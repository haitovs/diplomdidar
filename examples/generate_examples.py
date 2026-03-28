#!/usr/bin/env python3
"""Generate 6 example GNS3 project files for Network Simulator testing."""

import json
import uuid
import os
import shutil

EXAMPLES_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECTS_DIR = os.path.expanduser("~/GNS3/projects")


def uid():
    return str(uuid.uuid4())


def make_vpcs(name, x, y, project_id, console_port, startup_script=None):
    nid = uid()
    return {
        "compute_id": "local",
        "node_id": nid,
        "node_type": "vpcs",
        "name": name,
        "console": console_port,
        "console_host": "127.0.0.1",
        "console_type": "telnet",
        "console_auto_start": False,
        "x": x, "y": y, "z": 1,
        "locked": False,
        "symbol": ":/symbols/vpcs_guest.svg",
        "label": {"text": name, "x": 17, "y": -25, "rotation": 0, "style": "font-size: 10;"},
        "properties": {"startup_script": startup_script or ""},
        "port_name_format": "Ethernet{0}",
        "port_segment_size": 0,
        "first_port_name": None,
    }


def make_switch(name, x, y, project_id, num_ports=8, vlan_map=None):
    nid = uid()
    ports_mapping = []
    for i in range(num_ports):
        vlan = 1
        if vlan_map and i in vlan_map:
            vlan = vlan_map[i]
        ports_mapping.append({
            "name": str(i),
            "port_number": i,
            "type": "access",
            "vlan": vlan,
            "ethertype": ""
        })
    return {
        "compute_id": "local",
        "node_id": nid,
        "node_type": "ethernet_switch",
        "name": name,
        "console": None,
        "console_host": "127.0.0.1",
        "console_type": "none",
        "console_auto_start": False,
        "x": x, "y": y, "z": 1,
        "locked": False,
        "symbol": ":/symbols/ethernet_switch.svg",
        "label": {"text": name, "x": 10, "y": -25, "rotation": 0, "style": "font-size: 10;"},
        "properties": {"ports_mapping": ports_mapping},
        "port_name_format": "Ethernet{0}",
        "port_segment_size": 0,
        "first_port_name": None,
    }


def make_hub(name, x, y, project_id, num_ports=8):
    nid = uid()
    ports_mapping = []
    for i in range(num_ports):
        ports_mapping.append({
            "name": str(i),
            "port_number": i
        })
    return {
        "compute_id": "local",
        "node_id": nid,
        "node_type": "ethernet_hub",
        "name": name,
        "console": None,
        "console_host": "127.0.0.1",
        "console_type": "none",
        "console_auto_start": False,
        "x": x, "y": y, "z": 1,
        "locked": False,
        "symbol": ":/symbols/hub.svg",
        "label": {"text": name, "x": 17, "y": -25, "rotation": 0, "style": "font-size: 10;"},
        "properties": {"ports_mapping": ports_mapping},
        "port_name_format": "Ethernet{0}",
        "port_segment_size": 0,
        "first_port_name": None,
    }


def make_link(project_id, node1_id, port1, node2_id, port2):
    return {
        "link_id": uid(),
        "link_type": "ethernet",
        "suspend": False,
        "filters": {},
        "capturing": False,
        "capture_file_name": None,
        "capture_file_path": None,
        "capture_compute_id": None,
        "link_style": {},
        "nodes": [
            {
                "node_id": node1_id,
                "adapter_number": 0,
                "port_number": port1,
                "label": {"text": "", "x": 0, "y": 0, "rotation": 0, "style": ""}
            },
            {
                "node_id": node2_id,
                "adapter_number": 0,
                "port_number": port2,
                "label": {"text": "", "x": 0, "y": 0, "rotation": 0, "style": ""}
            }
        ]
    }


def make_text_drawing(text, x, y, font_size=14):
    import html
    safe_text = html.escape(text)
    svg = (
        f'<svg width="400" height="50">'
        f'<text font-family="monospace" font-size="{font_size}" '
        f'font-weight="bold" fill="#4a90d9" fill-opacity="1.0">{safe_text}</text></svg>'
    )
    return {
        "drawing_id": uid(),
        "x": x, "y": y, "z": 2,
        "locked": False,
        "rotation": 0,
        "svg": svg
    }


def make_project(name, nodes, links, drawings=None):
    pid = uid()
    return {
        "project_id": pid,
        "type": "topology",
        "revision": 9,
        "version": "2.2.56.1",
        "name": name,
        "auto_start": False,
        "auto_open": False,
        "auto_close": True,
        "scene_width": 2000,
        "scene_height": 1000,
        "zoom": 100,
        "show_layers": False,
        "snap_to_grid": False,
        "show_grid": False,
        "grid_size": 75,
        "drawing_grid_size": 25,
        "show_interface_labels": True,
        "variables": None,
        "supplier": None,
        "topology": {
            "nodes": nodes,
            "links": links,
            "drawings": drawings or [],
            "computes": [{
                "compute_id": "local",
                "name": "Local",
                "protocol": "http",
                "host": "127.0.0.1",
                "port": 3080,
                "user": "admin",
                "connected": True,
                "cpu_usage_percent": None,
                "memory_usage_percent": None,
                "last_error": None,
                "capabilities": {
                    "version": "2.2.56.1",
                    "node_types": ["vpcs", "ethernet_switch", "ethernet_hub", "cloud", "nat"],
                    "platform": "darwin"
                }
            }]
        }
    }


def save_project(project, filename):
    """Save project to examples dir and also install to GNS3 projects dir."""
    # Save to examples/
    filepath = os.path.join(EXAMPLES_DIR, filename)
    with open(filepath, "w") as f:
        json.dump(project, f, indent=2)
    print(f"  Created: examples/{filename}")

    # Install to ~/GNS3/projects/<name>/
    project_dir = os.path.join(PROJECTS_DIR, project["name"])
    os.makedirs(project_dir, exist_ok=True)

    # Also create project-files dir structure for VPCS startup configs
    for node in project["topology"]["nodes"]:
        if node["node_type"] == "vpcs" and node["properties"].get("startup_script"):
            node_dir = os.path.join(project_dir, "project-files", "vpcs", node["node_id"])
            os.makedirs(node_dir, exist_ok=True)
            with open(os.path.join(node_dir, "startup.vpc"), "w") as f:
                f.write(node["properties"]["startup_script"])

    installed_path = os.path.join(project_dir, f"{project['name']}.gns3")
    with open(installed_path, "w") as f:
        json.dump(project, f, indent=2)
    print(f"  Installed: ~/GNS3/projects/{project['name']}/{project['name']}.gns3")


def case1_basic_ping():
    """Case 1: Basic Ping - 2 PCs + 1 Switch"""
    pid = uid()
    pc1 = make_vpcs("PC1", -150, 100, pid, 5000,
                     "set pcname PC1\nip 192.168.1.1/24 192.168.1.254\n")
    pc2 = make_vpcs("PC2", 150, 100, pid, 5001,
                     "set pcname PC2\nip 192.168.1.2/24 192.168.1.254\n")
    sw = make_switch("Switch1", 0, -50, pid)

    links = [
        make_link(pid, pc1["node_id"], 0, sw["node_id"], 0),
        make_link(pid, pc2["node_id"], 0, sw["node_id"], 1),
    ]

    drawings = [
        make_text_drawing("Case 1: Basic Ping Test", -200, -150),
        make_text_drawing("PC1 (192.168.1.1) <-> Switch <-> PC2 (192.168.1.2)", -250, -120, 11),
        make_text_drawing("Test: Start all nodes, open PC1 console, run: ping 192.168.1.2", -300, 220, 10),
    ]

    return make_project("Case1-Basic-Ping", [pc1, pc2, sw], links, drawings)


def case2_subnet_isolation():
    """Case 2: Subnet Isolation - 3 PCs, same switch, different subnets"""
    pid = uid()
    pc1 = make_vpcs("PC1-SubnetA", -200, 100, pid, 5010,
                     "set pcname PC1\nip 192.168.1.1/24\n")
    pc2 = make_vpcs("PC2-SubnetA", 0, 100, pid, 5011,
                     "set pcname PC2\nip 192.168.1.2/24\n")
    pc3 = make_vpcs("PC3-SubnetB", 200, 100, pid, 5012,
                     "set pcname PC3\nip 192.168.2.1/24\n")
    sw = make_switch("Switch1", 0, -50, pid)

    links = [
        make_link(pid, pc1["node_id"], 0, sw["node_id"], 0),
        make_link(pid, pc2["node_id"], 0, sw["node_id"], 1),
        make_link(pid, pc3["node_id"], 0, sw["node_id"], 2),
    ]

    drawings = [
        make_text_drawing("Case 2: Subnet Isolation", -200, -150),
        make_text_drawing("PC1 & PC2 on 192.168.1.0/24 | PC3 on 192.168.2.0/24", -280, -120, 11),
        make_text_drawing("Test: PC1 ping PC2 = OK | PC1 ping PC3 = FAIL (different subnet)", -350, 220, 10),
    ]

    return make_project("Case2-Subnet-Isolation", [pc1, pc2, pc3, sw], links, drawings)


def case3_vlan_isolation():
    """Case 3: VLAN Isolation - 3 PCs, switch with VLANs"""
    pid = uid()
    pc1 = make_vpcs("PC1-VLAN10", -200, 100, pid, 5020,
                     "set pcname PC1\nip 10.0.10.1/24\n")
    pc2 = make_vpcs("PC2-VLAN10", 0, 100, pid, 5021,
                     "set pcname PC2\nip 10.0.10.2/24\n")
    pc3 = make_vpcs("PC3-VLAN20", 200, 100, pid, 5022,
                     "set pcname PC3\nip 10.0.10.3/24\n")

    # Ports 0,1 = VLAN 10; Port 2 = VLAN 20
    vlan_map = {0: 10, 1: 10, 2: 20, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1}
    sw = make_switch("VLAN-Switch", 0, -50, pid, vlan_map=vlan_map)

    links = [
        make_link(pid, pc1["node_id"], 0, sw["node_id"], 0),
        make_link(pid, pc2["node_id"], 0, sw["node_id"], 1),
        make_link(pid, pc3["node_id"], 0, sw["node_id"], 2),
    ]

    drawings = [
        make_text_drawing("Case 3: VLAN Isolation", -200, -150),
        make_text_drawing("PC1 & PC2 on VLAN 10 | PC3 on VLAN 20 (same IP range!)", -300, -120, 11),
        make_text_drawing("Test: PC1 ping PC2 = OK | PC1 ping PC3 = FAIL (VLAN isolated)", -350, 220, 10),
    ]

    return make_project("Case3-VLAN-Isolation", [pc1, pc2, pc3, sw], links, drawings)


def case4_hub_vs_switch():
    """Case 4: Hub vs Switch - Compare broadcast behavior"""
    pid = uid()
    pc1 = make_vpcs("PC1-Hub", -300, 150, pid, 5030,
                     "set pcname PC1\nip 10.0.0.1/24\n")
    pc2 = make_vpcs("PC2-Hub", -100, 150, pid, 5031,
                     "set pcname PC2\nip 10.0.0.2/24\n")
    pc3 = make_vpcs("PC3-Switch", 100, 150, pid, 5032,
                     "set pcname PC3\nip 10.0.0.3/24\n")
    pc4 = make_vpcs("PC4-Switch", 300, 150, pid, 5033,
                     "set pcname PC4\nip 10.0.0.4/24\n")

    hub = make_hub("Hub1", -200, -50, pid)
    sw = make_switch("Switch1", 200, -50, pid)

    links = [
        make_link(pid, pc1["node_id"], 0, hub["node_id"], 0),
        make_link(pid, pc2["node_id"], 0, hub["node_id"], 1),
        make_link(pid, pc3["node_id"], 0, sw["node_id"], 0),
        make_link(pid, pc4["node_id"], 0, sw["node_id"], 1),
        # Connect hub and switch together
        make_link(pid, hub["node_id"], 2, sw["node_id"], 2),
    ]

    drawings = [
        make_text_drawing("Case 4: Hub vs Switch Behavior", -250, -180),
        make_text_drawing("Hub side: PC1 + PC2 | Switch side: PC3 + PC4 | All 10.0.0.x/24", -350, -150, 11),
        make_text_drawing("Test: All PCs can ping each other. Use packet capture to see broadcast differences.", -400, 270, 10),
    ]

    return make_project("Case4-Hub-vs-Switch", [pc1, pc2, pc3, pc4, hub, sw], links, drawings)


def case5_star_topology():
    """Case 5: Star Topology - 6 PCs + 1 central switch"""
    pid = uid()
    import math

    sw = make_switch("Central-Switch", 0, 0, pid)
    pcs = []
    links = []

    for i in range(6):
        angle = (i * 60 - 90) * math.pi / 180
        x = int(250 * math.cos(angle))
        y = int(250 * math.sin(angle))
        pc = make_vpcs(f"PC{i+1}", x, y, pid, 5040 + i,
                       f"set pcname PC{i+1}\nip 10.0.0.{i+1}/24\n")
        pcs.append(pc)
        links.append(make_link(pid, pc["node_id"], 0, sw["node_id"], i))

    drawings = [
        make_text_drawing("Case 5: Star Topology (6 PCs)", -200, -350),
        make_text_drawing("All PCs on 10.0.0.x/24 connected to central switch", -280, -320, 11),
        make_text_drawing("Test: Every PC should ping every other PC successfully", -300, 330, 10),
    ]

    return make_project("Case5-Star-Topology", pcs + [sw], links, drawings)


def case6_multi_switch():
    """Case 6: Daisy-chain / Multi-switch topology"""
    pid = uid()
    pc1 = make_vpcs("PC1", -300, 100, pid, 5050,
                     "set pcname PC1\nip 172.16.0.1/24\n")
    pc2 = make_vpcs("PC2", -100, 100, pid, 5051,
                     "set pcname PC2\nip 172.16.0.2/24\n")
    pc3 = make_vpcs("PC3", 100, 100, pid, 5052,
                     "set pcname PC3\nip 172.16.0.3/24\n")
    pc4 = make_vpcs("PC4", 300, 100, pid, 5053,
                     "set pcname PC4\nip 172.16.0.4/24\n")

    sw1 = make_switch("Switch1", -200, -50, pid)
    sw2 = make_switch("Switch2", 200, -50, pid)

    links = [
        make_link(pid, pc1["node_id"], 0, sw1["node_id"], 0),
        make_link(pid, pc2["node_id"], 0, sw1["node_id"], 1),
        make_link(pid, pc3["node_id"], 0, sw2["node_id"], 0),
        make_link(pid, pc4["node_id"], 0, sw2["node_id"], 1),
        # Uplink between switches
        make_link(pid, sw1["node_id"], 7, sw2["node_id"], 7),
    ]

    drawings = [
        make_text_drawing("Case 6: Multi-Switch (Daisy Chain)", -250, -180),
        make_text_drawing("Switch1: PC1+PC2 | Switch2: PC3+PC4 | Uplink between switches", -350, -150, 11),
        make_text_drawing("Test: PC1 ping PC4 = OK (frames forwarded across switches)", -350, 220, 10),
    ]

    return make_project("Case6-Multi-Switch", [pc1, pc2, pc3, pc4, sw1, sw2], links, drawings)


def case7_ring_topology():
    """Case 7: Ring Topology - 4 Switches in a ring with PCs"""
    pid = uid()
    pc1 = make_vpcs("PC1", -300, -200, pid, 5060,
                     "set pcname PC1\nip 10.1.0.1/24\n")
    pc2 = make_vpcs("PC2", 300, -200, pid, 5061,
                     "set pcname PC2\nip 10.1.0.2/24\n")
    pc3 = make_vpcs("PC3", 300, 200, pid, 5062,
                     "set pcname PC3\nip 10.1.0.3/24\n")
    pc4 = make_vpcs("PC4", -300, 200, pid, 5063,
                     "set pcname PC4\nip 10.1.0.4/24\n")

    sw1 = make_switch("Switch1", -150, -100, pid)
    sw2 = make_switch("Switch2", 150, -100, pid)
    sw3 = make_switch("Switch3", 150, 100, pid)
    sw4 = make_switch("Switch4", -150, 100, pid)

    links = [
        # PCs to switches
        make_link(pid, pc1["node_id"], 0, sw1["node_id"], 0),
        make_link(pid, pc2["node_id"], 0, sw2["node_id"], 0),
        make_link(pid, pc3["node_id"], 0, sw3["node_id"], 0),
        make_link(pid, pc4["node_id"], 0, sw4["node_id"], 0),
        # Ring: SW1-SW2-SW3-SW4-SW1
        make_link(pid, sw1["node_id"], 6, sw2["node_id"], 7),
        make_link(pid, sw2["node_id"], 6, sw3["node_id"], 7),
        make_link(pid, sw3["node_id"], 6, sw4["node_id"], 7),
        make_link(pid, sw4["node_id"], 6, sw1["node_id"], 7),
    ]

    drawings = [
        make_text_drawing("Case 7: Ring Topology", -200, -350),
        make_text_drawing("4 Switches in a ring, 1 PC per switch, all 10.1.0.x/24", -300, -320, 11),
        make_text_drawing("Test: All PCs can ping each other via the ring path", -300, 300, 10),
    ]

    return make_project("Case7-Ring-Topology", [pc1, pc2, pc3, pc4, sw1, sw2, sw3, sw4], links, drawings)


def case8_vlan_trunk():
    """Case 8: VLAN Trunk - 2 Switches with trunk link carrying multiple VLANs"""
    pid = uid()
    pc1 = make_vpcs("PC1-VLAN10", -300, 100, pid, 5070,
                     "set pcname PC1\nip 10.10.0.1/24\n")
    pc2 = make_vpcs("PC2-VLAN20", -300, 200, pid, 5071,
                     "set pcname PC2\nip 10.20.0.1/24\n")
    pc3 = make_vpcs("PC3-VLAN10", 300, 100, pid, 5072,
                     "set pcname PC3\nip 10.10.0.2/24\n")
    pc4 = make_vpcs("PC4-VLAN20", 300, 200, pid, 5073,
                     "set pcname PC4\nip 10.20.0.2/24\n")

    # Switch1: port 0=VLAN10, port 1=VLAN20, port 7=trunk (all VLANs)
    vlan_map1 = {0: 10, 1: 20, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1}
    sw1 = make_switch("Switch1", -100, 150, pid, vlan_map=vlan_map1)
    # Set port 7 as trunk
    sw1["properties"]["ports_mapping"][7] = {
        "name": "7", "port_number": 7, "type": "dot1q", "vlan": 1, "ethertype": ""
    }

    vlan_map2 = {0: 10, 1: 20, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1}
    sw2 = make_switch("Switch2", 100, 150, pid, vlan_map=vlan_map2)
    sw2["properties"]["ports_mapping"][7] = {
        "name": "7", "port_number": 7, "type": "dot1q", "vlan": 1, "ethertype": ""
    }

    links = [
        make_link(pid, pc1["node_id"], 0, sw1["node_id"], 0),
        make_link(pid, pc2["node_id"], 0, sw1["node_id"], 1),
        make_link(pid, pc3["node_id"], 0, sw2["node_id"], 0),
        make_link(pid, pc4["node_id"], 0, sw2["node_id"], 1),
        # Trunk link between switches
        make_link(pid, sw1["node_id"], 7, sw2["node_id"], 7),
    ]

    drawings = [
        make_text_drawing("Case 8: VLAN Trunk", -200, -20),
        make_text_drawing("PC1+PC3 = VLAN10 | PC2+PC4 = VLAN20 | Trunk between switches", -350, 10, 11),
        make_text_drawing("Test: PC1 ping PC3 = OK | PC1 ping PC2 = FAIL | PC2 ping PC4 = OK", -400, 320, 10),
    ]

    return make_project("Case8-VLAN-Trunk", [pc1, pc2, pc3, pc4, sw1, sw2], links, drawings)


def case9_tree_topology():
    """Case 9: Tree/Hierarchical Topology - Core > Distribution > Access"""
    pid = uid()

    # Core switch at the top
    core = make_switch("Core-Switch", 0, -150, pid)

    # Distribution switches
    dist1 = make_switch("Dist-Switch1", -200, 0, pid)
    dist2 = make_switch("Dist-Switch2", 200, 0, pid)

    # PCs under dist1
    pc1 = make_vpcs("PC1", -300, 150, pid, 5080,
                     "set pcname PC1\nip 192.168.10.1/24\n")
    pc2 = make_vpcs("PC2", -100, 150, pid, 5081,
                     "set pcname PC2\nip 192.168.10.2/24\n")

    # PCs under dist2
    pc3 = make_vpcs("PC3", 100, 150, pid, 5082,
                     "set pcname PC3\nip 192.168.10.3/24\n")
    pc4 = make_vpcs("PC4", 300, 150, pid, 5083,
                     "set pcname PC4\nip 192.168.10.4/24\n")

    links = [
        # Core to distribution
        make_link(pid, core["node_id"], 0, dist1["node_id"], 7),
        make_link(pid, core["node_id"], 1, dist2["node_id"], 7),
        # Distribution to PCs
        make_link(pid, dist1["node_id"], 0, pc1["node_id"], 0),
        make_link(pid, dist1["node_id"], 1, pc2["node_id"], 0),
        make_link(pid, dist2["node_id"], 0, pc3["node_id"], 0),
        make_link(pid, dist2["node_id"], 1, pc4["node_id"], 0),
    ]

    drawings = [
        make_text_drawing("Case 9: Tree (Hierarchical) Topology", -250, -300),
        make_text_drawing("Core Switch > 2 Distribution Switches > 4 PCs (192.168.10.x/24)", -350, -270, 11),
        make_text_drawing("Test: All PCs communicate through the hierarchy", -300, 270, 10),
    ]

    return make_project("Case9-Tree-Topology",
                        [core, dist1, dist2, pc1, pc2, pc3, pc4], links, drawings)


def case10_broadcast_domain():
    """Case 10: Broadcast Domain - Hub chain shows single broadcast domain"""
    pid = uid()

    hub1 = make_hub("Hub1", -150, -50, pid)
    hub2 = make_hub("Hub2", 150, -50, pid)

    pc1 = make_vpcs("PC1", -300, 100, pid, 5090,
                     "set pcname PC1\nip 10.5.0.1/24\n")
    pc2 = make_vpcs("PC2", -100, 100, pid, 5091,
                     "set pcname PC2\nip 10.5.0.2/24\n")
    pc3 = make_vpcs("PC3", 100, 100, pid, 5092,
                     "set pcname PC3\nip 10.5.0.3/24\n")
    pc4 = make_vpcs("PC4", 300, 100, pid, 5093,
                     "set pcname PC4\nip 10.5.0.4/24\n")
    pc5 = make_vpcs("PC5", -200, -200, pid, 5094,
                     "set pcname PC5\nip 10.5.0.5/24\n")
    pc6 = make_vpcs("PC6", 200, -200, pid, 5095,
                     "set pcname PC6\nip 10.5.0.6/24\n")

    links = [
        make_link(pid, pc1["node_id"], 0, hub1["node_id"], 0),
        make_link(pid, pc2["node_id"], 0, hub1["node_id"], 1),
        make_link(pid, pc5["node_id"], 0, hub1["node_id"], 2),
        make_link(pid, pc3["node_id"], 0, hub2["node_id"], 0),
        make_link(pid, pc4["node_id"], 0, hub2["node_id"], 1),
        make_link(pid, pc6["node_id"], 0, hub2["node_id"], 2),
        # Connect hubs together
        make_link(pid, hub1["node_id"], 7, hub2["node_id"], 7),
    ]

    drawings = [
        make_text_drawing("Case 10: Broadcast Domain (Hub Chain)", -250, -330),
        make_text_drawing("6 PCs + 2 Hubs chained = one big broadcast domain (10.5.0.x/24)", -350, -300, 11),
        make_text_drawing("Test: All PCs can ping each other. Any traffic is seen by ALL devices.", -400, 220, 10),
    ]

    return make_project("Case10-Broadcast-Domain",
                        [pc1, pc2, pc3, pc4, pc5, pc6, hub1, hub2], links, drawings)


def case11_network_segmentation():
    """Case 11: Network Segmentation - 3 departments on separate switches/subnets"""
    pid = uid()

    # Department A - Engineering
    sw_a = make_switch("SW-Engineering", -300, 0, pid)
    pc_a1 = make_vpcs("Eng-PC1", -400, 150, pid, 5100,
                       "set pcname Eng-PC1\nip 10.1.1.1/24\n")
    pc_a2 = make_vpcs("Eng-PC2", -200, 150, pid, 5101,
                       "set pcname Eng-PC2\nip 10.1.1.2/24\n")

    # Department B - Sales
    sw_b = make_switch("SW-Sales", 0, 0, pid)
    pc_b1 = make_vpcs("Sales-PC1", -100, 150, pid, 5102,
                       "set pcname Sales-PC1\nip 10.2.1.1/24\n")
    pc_b2 = make_vpcs("Sales-PC2", 100, 150, pid, 5103,
                       "set pcname Sales-PC2\nip 10.2.1.2/24\n")

    # Department C - HR
    sw_c = make_switch("SW-HR", 300, 0, pid)
    pc_c1 = make_vpcs("HR-PC1", 200, 150, pid, 5104,
                       "set pcname HR-PC1\nip 10.3.1.1/24\n")
    pc_c2 = make_vpcs("HR-PC2", 400, 150, pid, 5105,
                       "set pcname HR-PC2\nip 10.3.1.2/24\n")

    links = [
        make_link(pid, pc_a1["node_id"], 0, sw_a["node_id"], 0),
        make_link(pid, pc_a2["node_id"], 0, sw_a["node_id"], 1),
        make_link(pid, pc_b1["node_id"], 0, sw_b["node_id"], 0),
        make_link(pid, pc_b2["node_id"], 0, sw_b["node_id"], 1),
        make_link(pid, pc_c1["node_id"], 0, sw_c["node_id"], 0),
        make_link(pid, pc_c2["node_id"], 0, sw_c["node_id"], 1),
    ]

    drawings = [
        make_text_drawing("Case 11: Network Segmentation (Departments)", -300, -150),
        make_text_drawing("Engineering: 10.1.1.x | Sales: 10.2.1.x | HR: 10.3.1.x", -350, -120, 11),
        make_text_drawing("Test: Ping within dept = OK | Ping across dept = FAIL (different subnets)", -400, 270, 10),
    ]

    return make_project("Case11-Network-Segmentation",
                        [sw_a, sw_b, sw_c, pc_a1, pc_a2, pc_b1, pc_b2, pc_c1, pc_c2], links, drawings)


def case12_full_mesh():
    """Case 12: Full Mesh Topology - 4 switches, each connected to every other"""
    pid = uid()
    import math

    sw1 = make_switch("Switch1", -150, -100, pid)
    sw2 = make_switch("Switch2", 150, -100, pid)
    sw3 = make_switch("Switch3", 150, 100, pid)
    sw4 = make_switch("Switch4", -150, 100, pid)

    pc1 = make_vpcs("PC1", -350, -100, pid, 5110,
                     "set pcname PC1\nip 172.20.0.1/24\n")
    pc2 = make_vpcs("PC2", 350, -100, pid, 5111,
                     "set pcname PC2\nip 172.20.0.2/24\n")
    pc3 = make_vpcs("PC3", 350, 100, pid, 5112,
                     "set pcname PC3\nip 172.20.0.3/24\n")
    pc4 = make_vpcs("PC4", -350, 100, pid, 5113,
                     "set pcname PC4\nip 172.20.0.4/24\n")

    links = [
        # PCs to their switches
        make_link(pid, pc1["node_id"], 0, sw1["node_id"], 0),
        make_link(pid, pc2["node_id"], 0, sw2["node_id"], 0),
        make_link(pid, pc3["node_id"], 0, sw3["node_id"], 0),
        make_link(pid, pc4["node_id"], 0, sw4["node_id"], 0),
        # Full mesh between switches (6 links for 4 switches)
        make_link(pid, sw1["node_id"], 4, sw2["node_id"], 5),
        make_link(pid, sw1["node_id"], 5, sw3["node_id"], 4),
        make_link(pid, sw1["node_id"], 6, sw4["node_id"], 4),
        make_link(pid, sw2["node_id"], 4, sw3["node_id"], 5),
        make_link(pid, sw2["node_id"], 6, sw4["node_id"], 5),
        make_link(pid, sw3["node_id"], 6, sw4["node_id"], 6),
    ]

    drawings = [
        make_text_drawing("Case 12: Full Mesh Topology", -200, -280),
        make_text_drawing("4 Switches, each connected to every other (172.20.0.x/24)", -300, -250, 11),
        make_text_drawing("Test: All PCs can ping each other. Multiple paths = redundancy.", -350, 250, 10),
    ]

    return make_project("Case12-Full-Mesh",
                        [pc1, pc2, pc3, pc4, sw1, sw2, sw3, sw4], links, drawings)


if __name__ == "__main__":
    print("Generating example projects...\n")

    cases = [
        case1_basic_ping,
        case2_subnet_isolation,
        case3_vlan_isolation,
        case4_hub_vs_switch,
        case5_star_topology,
        case6_multi_switch,
        case7_ring_topology,
        case8_vlan_trunk,
        case9_tree_topology,
        case10_broadcast_domain,
        case11_network_segmentation,
        case12_full_mesh,
    ]

    for i, case_fn in enumerate(cases, 1):
        project = case_fn()
        filename = f"case{i}_{project['name'].lower().replace('-', '_')}.gns3"
        save_project(project, filename)
        print()

    print("Done! You can open these projects from:")
    print("  1. File > Open Project in GNS3 GUI")
    print("  2. Or they're already installed in ~/GNS3/projects/")
    print("\nAfter opening, click the green PLAY button to start all nodes.")
    print("Then double-click any PC to open its console and test.")
