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
    svg = (
        f'<svg width="400" height="50">'
        f'<text font-family="monospace" font-size="{font_size}" '
        f'font-weight="bold" fill="#4a90d9" fill-opacity="1.0">{text}</text></svg>'
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


if __name__ == "__main__":
    print("Generating example projects...\n")

    cases = [
        case1_basic_ping,
        case2_subnet_isolation,
        case3_vlan_isolation,
        case4_hub_vs_switch,
        case5_star_topology,
        case6_multi_switch,
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
