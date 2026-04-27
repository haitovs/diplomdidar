# -*- coding: utf-8 -*-
#
# Copyright (C) 2014 GNS3 Technologies Inc.
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

"""
VPCS node implementation (PC and Server device types).
"""

import ipaddress

from gns3.node import Node

import logging
log = logging.getLogger(__name__)


class VPCSNode(Node):
    """
    VPCS node — represents either a PC or a Server end-device.

    :param module: parent module for this node
    :param server: GNS3 server instance
    :param project: Project instance
    """

    URL_PREFIX = "vpcs"

    def __init__(self, module, server, project):
        super().__init__(module, server, project)

        self.settings().update({
            "startup_script": None,
            "console_type": "telnet",
            "console_auto_start": True,
            # Device identity
            "device_type": "PC",
            "server_role": "General Server",
            # IP configuration
            "use_dhcp": False,
            "ip_address": "",
            "subnet_mask": "255.255.255.0",
            "gateway": "",
        })

    # ------------------------------------------------------------------ #
    # Info
    # ------------------------------------------------------------------ #

    def info(self):
        """
        Returns human-readable information about this node.

        :returns: formatted string
        """

        device_type = self._settings.get("device_type", "PC")
        if device_type == "Server":
            role = self._settings.get("server_role", "General Server")
            type_info = "  Role: {}\n".format(role)
        else:
            type_info = ""

        use_dhcp = self._settings.get("use_dhcp", False)
        ip = self._settings.get("ip_address", "")
        mask = self._settings.get("subnet_mask", "")
        gw = self._settings.get("gateway", "")

        if use_dhcp:
            ip_info = "  IP configuration: DHCP (auto-assigned)\n"
        elif ip:
            ip_info = "  IP configuration: static {}/{} gw {}\n".format(ip, mask, gw)
        else:
            ip_info = "  IP configuration: not configured\n"

        info = """{device_type} {name} is {state}
  Running on server {host} with port {port}
  Local ID is {id} and server ID is {node_id}
  Console is on port {console} and type is {console_type}
{type_info}{ip_info}""".format(
            device_type=device_type,
            name=self.name(),
            id=self.id(),
            node_id=self._node_id,
            state=self.state(),
            host=self.compute().name(),
            port=self.compute().port(),
            console=self._settings["console"],
            console_type=self._settings["console_type"],
            type_info=type_info,
            ip_info=ip_info,
        )

        port_info = ""
        for port in self._ports:
            if port.isFree():
                port_info += "     {port_name} is empty\n".format(port_name=port.name())
            else:
                port_info += "     {port_name} {port_description}\n".format(
                    port_name=port.name(),
                    port_description=port.description())

        return info + port_info

    # ------------------------------------------------------------------ #
    # Startup script helpers
    # ------------------------------------------------------------------ #

    def buildStartupScript(self):
        """
        Build and return a VPCS startup script from the current IP settings.
        Returns None if no IP configuration is present.
        """

        name = self.name()
        use_dhcp = self._settings.get("use_dhcp", False)
        ip = self._settings.get("ip_address", "").strip()
        mask = self._settings.get("subnet_mask", "255.255.255.0").strip()
        gw = self._settings.get("gateway", "").strip()

        if use_dhcp:
            # DHCP mode — DHCPManager will overwrite with static assignment;
            # fall back to the VPCS native dhcp command if no switch pool found.
            return "set pcname {}\ndhcp\n".format(name)

        if ip:
            try:
                prefix = ipaddress.IPv4Network("0.0.0.0/{}".format(mask), strict=False).prefixlen
            except ValueError:
                prefix = 24
            if gw:
                return "set pcname {}\nip {}/{} {}\n".format(name, ip, prefix, gw)
            return "set pcname {}\nip {}/{}\n".format(name, ip, prefix)

        return "set pcname {}\n".format(name)

    def applyIPConfig(self):
        """
        Rebuild startup_script from current IP settings and push to server.
        Call after IP/DHCP settings change.
        """

        script = self.buildStartupScript()
        if script is not None:
            self._settings["startup_script"] = script
            if self._node_id is not None:
                self.update({"startup_script": script})

    # ------------------------------------------------------------------ #
    # Node interface
    # ------------------------------------------------------------------ #

    def configFiles(self):
        return ["startup.vpc"]

    def configPage(self):
        from .pages.vpcs_node_configuration_page import VPCSNodeConfigurationPage
        return VPCSNodeConfigurationPage

    def defaultSymbol(self):
        """Returns the default symbol based on device type."""
        dt = self._settings.get("device_type")
        if dt == "Server":
            return "server.svg"
        if dt == "Router":
            return ":/symbols/router.svg"
        return ":/symbols/vpcs_guest.svg"

    def symbol(self):
        """Return stored symbol, falling back to the type-appropriate default."""
        stored = self._settings.get("symbol")
        # Only fall through to defaultSymbol for generic Qt defaults
        if stored and stored not in (":/symbols/vpcs_guest.svg", ":/symbols/computer.svg"):
            return stored
        return self.defaultSymbol()

    @staticmethod
    def categories():
        return [Node.end_devices]

    def __str__(self):
        device_type = self._settings.get("device_type", "PC")
        if device_type == "Server":
            role = self._settings.get("server_role", "General Server")
            return "Server ({})".format(role)
        if device_type == "Router":
            role = self._settings.get("router_role", "Gateway Router")
            return "Router ({})".format(role)
        return "PC"


# for compatibility pre version 2.0
class VPCSDevice(VPCSNode):
    pass
