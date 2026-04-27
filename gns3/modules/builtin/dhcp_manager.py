# -*- coding: utf-8 -*-
#
# DHCP Manager for network simulation.
# Manages IP pool assignment for simulated DHCP across topology.

import ipaddress
import logging

log = logging.getLogger(__name__)


class DHCPManager:
    """
    Singleton that manages DHCP IP address pools and assignments.

    Switches configured with dhcp_enabled=True advertise a pool.
    VPCS nodes configured with use_dhcp=True receive a pre-assigned IP
    from the connected switch's pool (simulated DHCP - written as static
    startup_script so VPCS boots with the correct address).
    """

    _instance = None

    def __init__(self):
        # node_id (str) → assigned IP (str)
        self._assignments = {}
        # switch_node_id (str) → next pool index (int)
        self._pool_counters = {}

    @classmethod
    def instance(cls):
        if cls._instance is None:
            cls._instance = DHCPManager()
        return cls._instance

    # ------------------------------------------------------------------ #
    # Public API
    # ------------------------------------------------------------------ #

    def get_assignment(self, node_id):
        """Return the currently assigned IP for a node, or None."""
        return self._assignments.get(node_id)

    def release(self, node_id):
        """Release the IP assignment for a node."""
        self._assignments.pop(node_id, None)

    def reset_switch(self, switch_node_id):
        """Reset pool counter for a switch (call when pool settings change)."""
        self._pool_counters.pop(switch_node_id, None)
        # Release all assignments that came from this switch
        # (we don't track which switch gave which IP, so just wipe all
        # unconnected-looking assignments – safer to re-assign on next apply)

    def apply_topology(self, nodes, links):
        """
        Main entry point: scan topology and assign IPs to all DHCP-mode
        VPCS nodes that are connected to a DHCP-enabled switch.
        Only assigns where no assignment exists yet.
        """
        from gns3.modules.vpcs.vpcs_node import VPCSNode
        from gns3.modules.builtin.ethernet_switch import EthernetSwitch

        dhcp_switches = [n for n in nodes
                         if isinstance(n, EthernetSwitch) and n.settings().get("dhcp_enabled")]
        dhcp_clients = [n for n in nodes
                        if isinstance(n, VPCSNode) and n.settings().get("use_dhcp")]

        for client in dhcp_clients:
            if client.node_id() in self._assignments:
                continue
            for switch in self._find_connected_switches(client, links, dhcp_switches):
                ip = self._assign(client, switch)
                if ip:
                    break

    def reassign_for_switch(self, switch, nodes, links):
        """
        Re-run assignment for all DHCP clients connected to *switch*.
        Call after switch DHCP settings change.
        """
        from gns3.modules.vpcs.vpcs_node import VPCSNode

        # Release existing assignments for nodes connected to this switch
        for link in links:
            src, dst = link._source_node, link._destination_node
            vpcs_node = None
            if src == switch and isinstance(dst, VPCSNode):
                vpcs_node = dst
            elif dst == switch and isinstance(src, VPCSNode):
                vpcs_node = src
            if vpcs_node and vpcs_node.settings().get("use_dhcp"):
                self.release(vpcs_node.node_id())

        self.reset_switch(switch.node_id())

        # Re-assign
        connected_clients = []
        for link in links:
            src, dst = link._source_node, link._destination_node
            if src == switch and isinstance(dst, VPCSNode) and dst.settings().get("use_dhcp"):
                connected_clients.append(dst)
            elif dst == switch and isinstance(src, VPCSNode) and src.settings().get("use_dhcp"):
                connected_clients.append(src)

        for client in connected_clients:
            self._assign(client, switch)

    def assign_on_link(self, source_node, destination_node):
        """
        Called when a link is added. If one end is a DHCP-mode VPCS and the
        other is a DHCP-enabled switch, immediately assign an IP.
        """
        from gns3.modules.vpcs.vpcs_node import VPCSNode
        from gns3.modules.builtin.ethernet_switch import EthernetSwitch

        vpcs_node = switch = None
        if isinstance(source_node, VPCSNode) and isinstance(destination_node, EthernetSwitch):
            vpcs_node, switch = source_node, destination_node
        elif isinstance(destination_node, VPCSNode) and isinstance(source_node, EthernetSwitch):
            vpcs_node, switch = destination_node, source_node

        if vpcs_node and switch:
            if vpcs_node.settings().get("use_dhcp") and switch.settings().get("dhcp_enabled"):
                if vpcs_node.node_id() not in self._assignments:
                    self._assign(vpcs_node, switch)

    def all_assignments(self):
        """Return dict of node_id → ip for all current assignments."""
        return dict(self._assignments)

    # ------------------------------------------------------------------ #
    # Internal helpers
    # ------------------------------------------------------------------ #

    def _find_connected_switches(self, vpcs_node, links, dhcp_switches):
        """Yield DHCP-enabled switches connected to vpcs_node."""
        for link in links:
            src, dst = link._source_node, link._destination_node
            if src == vpcs_node and dst in dhcp_switches:
                yield dst
            elif dst == vpcs_node and src in dhcp_switches:
                yield src

    def _parse_pool(self, switch_settings):
        """Parse pool settings. Returns (subnet, start, end, gateway, prefix) or None."""
        try:
            subnet_str = switch_settings.get("dhcp_subnet") or "192.168.1.0/24"
            subnet = ipaddress.IPv4Network(subnet_str, strict=False)
            start = ipaddress.IPv4Address(switch_settings.get("dhcp_pool_start") or str(subnet.network_address + 100))
            end = ipaddress.IPv4Address(switch_settings.get("dhcp_pool_end") or str(subnet.network_address + 200))
            gateway = switch_settings.get("dhcp_gateway") or str(subnet.network_address + 1)
            return subnet, start, end, gateway, subnet.prefixlen
        except (ValueError, TypeError):
            log.warning("DHCPManager: invalid pool settings")
            return None

    def _next_ip(self, switch_node_id, switch_settings):
        """Return next available IP from pool, skipping used ones."""
        pool = self._parse_pool(switch_settings)
        if pool is None:
            return None, None, None
        subnet, pool_start, pool_end, gateway, prefix_len = pool

        used = set(self._assignments.values())
        start_int = int(pool_start)
        end_int = int(pool_end)
        current = self._pool_counters.get(switch_node_id, start_int)

        for _ in range(end_int - start_int + 1):
            candidate = str(ipaddress.IPv4Address(current))
            current = start_int if current >= end_int else current + 1
            if candidate not in used:
                self._pool_counters[switch_node_id] = current
                return candidate, gateway, prefix_len

        log.warning("DHCPManager: pool exhausted for switch {}".format(switch_node_id))
        return None, None, None

    def _assign(self, vpcs_node, switch):
        """Assign an IP to vpcs_node from switch's pool. Returns assigned IP or None."""
        ip, gateway, prefix_len = self._next_ip(switch.node_id(), switch.settings())
        if ip is None:
            return None

        self._assignments[vpcs_node.node_id()] = ip
        self._write_startup_script(vpcs_node, ip, prefix_len, gateway)
        log.info("DHCPManager: assigned {}/{} gw {} → {} (switch {})".format(
            ip, prefix_len, gateway, vpcs_node.name(), switch.name()))
        return ip

    def _write_startup_script(self, vpcs_node, ip, prefix_len, gateway):
        """Write the assigned IP as a static startup_script on the VPCS node."""
        name = vpcs_node.name()
        if gateway:
            script = "set pcname {name}\nip {ip}/{prefix} {gw}\n".format(
                name=name, ip=ip, prefix=prefix_len, gw=gateway)
        else:
            script = "set pcname {name}\nip {ip}/{prefix}\n".format(
                name=name, ip=ip, prefix=prefix_len)

        vpcs_node.settings()["startup_script"] = script
        if vpcs_node.node_id() is not None:
            vpcs_node.update({"startup_script": script})
