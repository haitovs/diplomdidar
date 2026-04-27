#!/usr/bin/env python3
"""Generate 20 example GNS3 project files for Network Simulator testing."""

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


def make_text_drawing(text, x, y, font_size=14, color="#4a90d9"):
    import html
    safe_text = html.escape(text)
    width = max(500, int(len(text) * font_size * 0.68) + 20)
    height = font_size + 10
    svg = (
        f'<svg width="{width}" height="{height}">'
        f'<text x="2" y="{font_size}" font-family="sans-serif" font-size="{font_size}" '
        f'font-weight="bold" fill="{color}">{safe_text}</text></svg>'
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
        make_text_drawing("Mesele 1: Esasy Ping Synagy", -200, -350, 15),
        make_text_drawing("Enjamlar: PC1 (192.168.1.1) we PC2 (192.168.1.2) — bir kommutator arkaly birikdirilen", -350, -315, 11),
        make_text_drawing("Öwredýär: Bir podsetdäki enjamlar biri-biri bilen gürleşip bilýär", -350, -285, 11, "#27ae60"),
        make_text_drawing("► BAŞLAMAK: Ýaşyl ► PLAY düwmesine basyň → ähli enjamlar işe başlar", -350, 230, 11, "#e67e22"),
        make_text_drawing("► SYNAG: PC1-e iki gezek basyň → konsol açylýar → ping 192.168.1.2 ýazyň → OK bolmaly", -350, 260, 11, "#e67e22"),
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
        make_text_drawing("Mesele 2: Podset Izolýasiýasy", -200, -390, 15),
        make_text_drawing("Çep: PC1,PC2 = 192.168.1.x  |  Sag: PC3,PC4 = 192.168.2.x (iki AÝRY podset)", -400, -355, 11),
        make_text_drawing("Öwredýär: Aýry podsetdäki enjamlar biri-birine ping edip bilmeýär — router gerek", -400, -325, 11, "#27ae60"),
        make_text_drawing("► BAŞLAMAK: Ýaşyl ► PLAY düwmesine basyň → ähli enjamlar işe başlar", -400, 260, 11, "#e67e22"),
        make_text_drawing("► SYNAG 1: PC1-e 2× basyň → ping 192.168.1.2 ýazyň → OK (bir podsede)", -400, 290, 11, "#e67e22"),
        make_text_drawing("► SYNAG 2: PC1-de → ping 192.168.2.1 ýazyň → ÝALŇYŞ (başga podset — izolýasiýa)", -400, 320, 11, "#c0392b"),
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
        make_text_drawing("Mesele 3: VLAN Izolýasiýasy", -200, -350, 15),
        make_text_drawing("VLAN10: PC1 (192.168.10.1), PC2 (192.168.10.2)  |  VLAN20: PC3 (192.168.20.1), PC4 (192.168.20.2)", -400, -315, 11),
        make_text_drawing("Öwredýär: VLAN — bir fiziki kommutatorda birnäçe aýry wirtual tor döretmek usuly", -400, -285, 11, "#27ae60"),
        make_text_drawing("► BAŞLAMAK: Ýaşyl ► PLAY düwmesine basyň → ähli enjamlar işe başlar", -400, 230, 11, "#e67e22"),
        make_text_drawing("► SYNAG 1: PC1-e 2× basyň → ping 192.168.10.2 → OK (bir VLAN10-da)", -400, 260, 11, "#e67e22"),
        make_text_drawing("► SYNAG 2: PC1-de → ping 192.168.20.1 → ÝALŇYŞ (başga VLAN — izolýasiýa)", -400, 290, 11, "#c0392b"),
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
        make_text_drawing("Mesele 4: Hub we Kommutator Tapawudy", -200, -350, 15),
        make_text_drawing("Çep tarap: Hub (ähli enjama ugradýar)  |  Sag tarap: Kommutator (diňe zerur enjama ugradýar)", -400, -315, 11),
        make_text_drawing("Öwredýär: Hub köne we haýal, Kommutator akylly we çalt — häzirki torlar kommutator ulanýar", -400, -285, 11, "#27ae60"),
        make_text_drawing("► BAŞLAMAK: Ýaşyl ► PLAY düwmesine basyň → ähli enjamlar işe başlar", -400, 260, 11, "#e67e22"),
        make_text_drawing("► SYNAG 1: PC1A-a 2× basyň → ping 10.4.1.2 (PC2A) → OK", -400, 290, 11, "#e67e22"),
        make_text_drawing("► SYNAG 2: PC1B-e 2× basyň → ping 10.4.2.2 (PC2B) → OK  (ikisi hem işleýär, emma hub haýal)", -400, 320, 11, "#e67e22"),
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
        make_text_drawing("Mesele 5: Ýyldyz Topologiýasy", -200, -280, 15),
        make_text_drawing("Enjamlar: 1 merkezi kommutator + 5 PC ýyldyz görnüşinde birikdirilen (192.168.5.x/24)", -400, -245, 11),
        make_text_drawing("Öwredýär: Ýyldyz topologiýasy — ähli enjamlar merkezden birikdirilýär, iň köp ulanylýan gurluş", -400, -215, 11, "#27ae60"),
        make_text_drawing("► BAŞLAMAK: Ýaşyl ► PLAY düwmesine basyň → ähli enjamlar işe başlar", -400, 380, 11, "#e67e22"),
        make_text_drawing("► SYNAG: PC1-e 2× basyň → ping 192.168.5.5 (PC5) ýazyň → OK bolmaly", -400, 410, 11, "#e67e22"),
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
        make_text_drawing("Mesele 6: Köp Kommutatorly Tor", -200, -350, 15),
        make_text_drawing("2 kommutator birikdirilen: Çep = SW1 (PC1,PC2)  |  Sag = SW2 (PC3,PC4)", -400, -315, 11),
        make_text_drawing("Öwredýär: Kommutatorlar öz aralarynda-da birikip, has uly tor döredip bilýär", -400, -285, 11, "#27ae60"),
        make_text_drawing("► BAŞLAMAK: Ýaşyl ► PLAY düwmesine basyň → ähli enjamlar işe başlar", -400, 270, 11, "#e67e22"),
        make_text_drawing("► SYNAG: PC1-e 2× basyň → ping 10.6.0.3 (PC3, başga kommutatorda) → OK bolmaly", -400, 300, 11, "#e67e22"),
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
        make_text_drawing("Mesele 7: Halka Topologiýasy", -200, -310, 15),
        make_text_drawing("Enjamlar: 4 kommutator halka görnüşinde, her biriniň 1 PC-si bar", -400, -275, 11),
        make_text_drawing("Öwredýär: Halka topologiýasynda bir baglanyşyk kesilse, alternatiw ýol bar — redundansiýa", -400, -245, 11, "#27ae60"),
        make_text_drawing("► BAŞLAMAK: Ýaşyl ► PLAY düwmesine basyň → ähli enjamlar işe başlar", -400, 290, 11, "#e67e22"),
        make_text_drawing("► SYNAG 1: PC1-e 2× basyň → ping 10.7.0.3 (PC3) → OK", -400, 320, 11, "#e67e22"),
        make_text_drawing("► SYNAG 2: Bir baglanyşygy syçanjyk bilen saýlaň → Delete basyň → täzeden ping synanyň", -400, 350, 11, "#e67e22"),
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
        make_text_drawing("Mesele 8: VLAN Trunk Baglanyşygy", -200, -350, 15),
        make_text_drawing("VLAN10: PC1,PC2 (192.168.10.x)  |  VLAN20: PC3,PC4 (192.168.20.x)  — 2 kommutator trunk bilen", -400, -315, 11),
        make_text_drawing("Öwredýär: Trunk — birnäçe VLAN-yň bir kabel arkaly kommutatorlar arasynda geçmegi", -400, -285, 11, "#27ae60"),
        make_text_drawing("► BAŞLAMAK: Ýaşyl ► PLAY düwmesine basyň → ähli enjamlar işe başlar", -400, 260, 11, "#e67e22"),
        make_text_drawing("► SYNAG 1: PC1-e 2× basyň → ping 192.168.10.2 (PC2, başga kommutator, VLAN10) → OK", -400, 290, 11, "#e67e22"),
        make_text_drawing("► SYNAG 2: PC1-de → ping 192.168.20.1 (PC3, VLAN20) → ÝALŇYŞ (trunk VLAN-y aýyrýar)", -400, 320, 11, "#c0392b"),
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
        make_text_drawing("Mesele 9: Agaç Topologiýasy", -200, -430, 15),
        make_text_drawing("Merkezi SW → 2 paýlaýjy SW → 4 giriş SW → 8 PC (agaç görnüşi, 3 gat)", -400, -395, 11),
        make_text_drawing("Öwredýär: Agaç (tree) topologiýasy — korporatiw torlarynda iň köp ulanylýan gurluş", -400, -365, 11, "#27ae60"),
        make_text_drawing("► BAŞLAMAK: Ýaşyl ► PLAY düwmesine basyň → ähli enjamlar işe başlar", -400, 380, 11, "#e67e22"),
        make_text_drawing("► SYNAG: PC1-e 2× basyň → ping 10.9.4.2 (PC8, başga şaha) → OK bolmaly", -400, 410, 11, "#e67e22"),
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
        make_text_drawing("Mesele 10: Ýaýlyş Zolagy (Broadcast Domain)", -200, -350, 15),
        make_text_drawing("Hub we kommutator bilen ýaýlyş zolagyny görkezýär (192.168.10.x)", -400, -315, 11),
        make_text_drawing("Öwredýär: Hub — ýaýlyşy çäklemeýär (howply), Kommutator — ýaýlyşy bölýär (howpsuz)", -400, -285, 11, "#27ae60"),
        make_text_drawing("► BAŞLAMAK: Ýaşyl ► PLAY düwmesine basyň → ähli enjamlar işe başlar", -400, 270, 11, "#e67e22"),
        make_text_drawing("► SYNAG: PC1-e 2× basyň → ping 192.168.10.2 → OK  |  ping 192.168.10.3 → OK", -400, 300, 11, "#e67e22"),
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
        make_text_drawing("Mesele 11: Tor Bölünişigi (Network Segmentation)", -200, -350, 15),
        make_text_drawing("3 aýry podset: VLAN10 (10.11.1.x), VLAN20 (10.11.2.x), VLAN30 (10.11.3.x)", -400, -315, 11),
        make_text_drawing("Öwredýär: Tor bölünişigi howpsuzlygy we öndürijiligi ýokarlandyrýar", -400, -285, 11, "#27ae60"),
        make_text_drawing("► BAŞLAMAK: Ýaşyl ► PLAY düwmesine basyň → ähli enjamlar işe başlar", -400, 260, 11, "#e67e22"),
        make_text_drawing("► SYNAG 1: PC1-e 2× basyň → ping 10.11.1.2 (PC2, bir VLAN) → OK", -400, 290, 11, "#e67e22"),
        make_text_drawing("► SYNAG 2: PC1-de → ping 10.11.2.1 (PC3, başga VLAN) → ÝALŇYŞ (izolýasiýa işleýär)", -400, 320, 11, "#c0392b"),
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
        make_text_drawing("Mesele 12: Doly Örgün Topologiýasy (Full Mesh)", -200, -310, 15),
        make_text_drawing("4 kommutator — her biri beýleki 3-si bilen birikdirilen (jemi 6 baglanyşyk)", -400, -275, 11),
        make_text_drawing("Öwredýär: Doly örgün — iň ygtybarly, ýöne kabel sany köp; maglumat islendik ýoldan geçip bilýär", -400, -245, 11, "#27ae60"),
        make_text_drawing("► BAŞLAMAK: Ýaşyl ► PLAY düwmesine basyň → ähli enjamlar işe başlar", -400, 280, 11, "#e67e22"),
        make_text_drawing("► SYNAG 1: PC1-e 2× basyň → ping 172.20.0.4 (PC4) → OK", -400, 310, 11, "#e67e22"),
        make_text_drawing("► SYNAG 2: Islendik baglanyşygy öçüriň → täzeden ping synanyň → ýene OK (alternatiw ýol bar)", -400, 340, 11, "#e67e22"),
    ]

    return make_project("Case12-Full-Mesh",
                        [pc1, pc2, pc3, pc4, sw1, sw2, sw3, sw4], links, drawings)


def make_router(name, x, y, project_id, console_port, startup_script=None):
    """Create a VPCS node that visually represents a Router."""
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
        "symbol": ":/symbols/router.svg",
        "label": {"text": name, "x": 17, "y": -25, "rotation": 0, "style": "font-size: 10;"},
        "properties": {"startup_script": startup_script or ""},
        "port_name_format": "Ethernet{0}",
        "port_segment_size": 0,
        "first_port_name": None,
    }


def make_server(name, x, y, project_id, console_port, role="General Server", startup_script=None):
    """Create a VPCS node configured as a Server device type."""
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
        "symbol": "server.svg",
        "label": {"text": name, "x": 17, "y": -25, "rotation": 0, "style": "font-size: 10;"},
        "properties": {
            "startup_script": startup_script or "",
        },
        "port_name_format": "Ethernet{0}",
        "port_segment_size": 0,
        "first_port_name": None,
    }


def make_cisco_switch(name, x, y, project_id, model="Cisco Catalyst 2960 (L2)",
                      num_ports=24, vlan_map=None,
                      dhcp_enabled=False, dhcp_subnet="192.168.1.0/24",
                      dhcp_pool_start="192.168.1.100", dhcp_pool_end="192.168.1.200",
                      dhcp_gateway="192.168.1.1"):
    """Create an EthernetSwitch with a Cisco model and optional DHCP pool."""
    L3_MODELS = {"Cisco Catalyst 3560 (L3)", "Cisco Catalyst 3750 (L3)",
                 "Cisco Catalyst 4500 (L3)", "Cisco Catalyst 6500 (L3)"}
    symbol = ":/symbols/multilayer_switch.svg" if model in L3_MODELS else ":/symbols/ethernet_switch.svg"
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
        "symbol": symbol,
        "label": {"text": name, "x": 10, "y": -25, "rotation": 0, "style": "font-size: 10;"},
        "properties": {
            "ports_mapping": ports_mapping,
        },
        "port_name_format": "Ethernet{0}",
        "port_segment_size": 0,
        "first_port_name": None,
    }


def case13_dhcp_auto_assignment():
    """Case 13: DHCP Auto-Assignment - DHCP Server + PCs with auto-IP via Cisco 2960"""
    pid = uid()

    dhcp_srv = make_server("DHCP-Server", 0, -200, pid, 5120, role="DHCP Server",
                           startup_script="set pcname DHCP-Server\nip 192.168.1.1/24\n")

    # PCs configured for DHCP — IPs pre-assigned from pool 192.168.1.100-103
    pc1 = make_vpcs("PC1", -300, 100, pid, 5121,
                    "set pcname PC1\nip 192.168.1.100/24 192.168.1.1\n")
    pc2 = make_vpcs("PC2", -100, 100, pid, 5122,
                    "set pcname PC2\nip 192.168.1.101/24 192.168.1.1\n")
    pc3 = make_vpcs("PC3", 100, 100, pid, 5123,
                    "set pcname PC3\nip 192.168.1.102/24 192.168.1.1\n")
    pc4 = make_vpcs("PC4", 300, 100, pid, 5124,
                    "set pcname PC4\nip 192.168.1.103/24 192.168.1.1\n")
    sw = make_cisco_switch("Cisco-2960", 0, -50, pid,
                           model="Cisco Catalyst 2960 (L2)", num_ports=24,
                           dhcp_enabled=True,
                           dhcp_subnet="192.168.1.0/24",
                           dhcp_pool_start="192.168.1.100",
                           dhcp_pool_end="192.168.1.200",
                           dhcp_gateway="192.168.1.1")

    links = [
        make_link(pid, dhcp_srv["node_id"], 0, sw["node_id"], 0),
        make_link(pid, pc1["node_id"], 0, sw["node_id"], 1),
        make_link(pid, pc2["node_id"], 0, sw["node_id"], 2),
        make_link(pid, pc3["node_id"], 0, sw["node_id"], 3),
        make_link(pid, pc4["node_id"], 0, sw["node_id"], 4),
    ]

    drawings = [
        make_text_drawing("Mesele 13: DHCP — Awtomatik IP Bellemek", -220, -350, 15),
        make_text_drawing("DHCP-Server (192.168.1.1) → Cisco 2960 → PC1,PC2,PC3,PC4 awtomatik IP alýar (.100-.103)", -400, -315, 11),
        make_text_drawing("Öwredýär: DHCP — el bilen IP ýazmak gerek däl, serwer özbaşdak IP belleýär", -400, -285, 11, "#27ae60"),
        make_text_drawing("► BAŞLAMAK: Ýaşyl ► PLAY düwmesine basyň → ähli enjamlar işe başlar", -400, 230, 11, "#e67e22"),
        make_text_drawing("► SYNAG 1: PC1-e 2× basyň → show ip ýazyň → 192.168.1.100 IP görünmeli", -400, 260, 11, "#e67e22"),
        make_text_drawing("► SYNAG 2: PC1-de → ping 192.168.1.1 (DHCP-Server) → OK bolmaly", -400, 290, 11, "#e67e22"),
    ]

    return make_project("Case13-DHCP-Auto-Assignment",
                        [dhcp_srv, pc1, pc2, pc3, pc4, sw], links, drawings)


def case14_cisco_switch_models():
    """Case 14: Cisco Switch Models - L2 vs L3 switches with different symbols"""
    pid = uid()

    # L3 Core switch
    core = make_cisco_switch("Core-Cat6500", 0, -200, pid,
                             model="Cisco Catalyst 6500 (L3)", num_ports=48)

    # L3 Distribution
    dist1 = make_cisco_switch("Dist-Cat3750", -250, 0, pid,
                              model="Cisco Catalyst 3750 (L3)", num_ports=24)
    dist2 = make_cisco_switch("Dist-Cat3560", 250, 0, pid,
                              model="Cisco Catalyst 3560 (L3)", num_ports=24)

    # L2 Access
    acc1 = make_cisco_switch("Access-Cat2960-A", -250, 200, pid,
                             model="Cisco Catalyst 2960 (L2)", num_ports=24)
    acc2 = make_cisco_switch("Access-Cat2960-B", 250, 200, pid,
                             model="Cisco Catalyst 2960 (L2)", num_ports=24)

    pc1 = make_vpcs("PC1", -400, 350, pid, 5130, "set pcname PC1\nip 10.14.1.1/24\n")
    pc2 = make_vpcs("PC2", -100, 350, pid, 5131, "set pcname PC2\nip 10.14.1.2/24\n")
    pc3 = make_vpcs("PC3", 100, 350, pid, 5132, "set pcname PC3\nip 10.14.2.1/24\n")
    pc4 = make_vpcs("PC4", 400, 350, pid, 5133, "set pcname PC4\nip 10.14.2.2/24\n")

    links = [
        make_link(pid, core["node_id"], 0, dist1["node_id"], 23),
        make_link(pid, core["node_id"], 1, dist2["node_id"], 23),
        make_link(pid, dist1["node_id"], 0, acc1["node_id"], 23),
        make_link(pid, dist2["node_id"], 0, acc2["node_id"], 23),
        make_link(pid, acc1["node_id"], 0, pc1["node_id"], 0),
        make_link(pid, acc1["node_id"], 1, pc2["node_id"], 0),
        make_link(pid, acc2["node_id"], 0, pc3["node_id"], 0),
        make_link(pid, acc2["node_id"], 1, pc4["node_id"], 0),
    ]

    drawings = [
        make_text_drawing("Mesele 14: Cisco Kommutator Modelleri — L2 we L3 Tapawudy", -250, -380, 15),
        make_text_drawing("Cat6500(L3, köp gatly ikon) → Cat3750/3560(L3) → Cat2960(L2, ýönekeý ikon)", -400, -345, 11),
        make_text_drawing("Öwredýär: L2 kommutator diňe bir podsetde, L3 kommutator birnäçe podset arasynda işleýär", -400, -315, 11, "#27ae60"),
        make_text_drawing("► BAŞLAMAK: Ýaşyl ► PLAY düwmesine basyň → ähli enjamlar işe başlar", -400, 450, 11, "#e67e22"),
        make_text_drawing("► SYNAG: PC1-e 2× basyň → ping 10.14.2.2 (PC4, başga şaha) → OK (L3 routing arkaly)", -400, 480, 11, "#e67e22"),
    ]

    return make_project("Case14-Cisco-Switch-Models",
                        [core, dist1, dist2, acc1, acc2, pc1, pc2, pc3, pc4], links, drawings)


def case15_server_farm():
    """Case 15: Server Farm - 4 specialized servers + client PCs"""
    pid = uid()

    # Server farm switch (L3 for routing)
    farm_sw = make_cisco_switch("Farm-Cat3750", 0, -50, pid,
                                model="Cisco Catalyst 3750 (L3)", num_ports=24)

    # Specialized servers
    web_srv  = make_server("Web-Server",  -300, -200, pid, 5140, role="Web Server",
                           startup_script="set pcname Web-Server\nip 10.15.0.10/24 10.15.0.1\n")
    file_srv = make_server("File-Server", -100, -200, pid, 5141, role="File Server",
                           startup_script="set pcname File-Server\nip 10.15.0.11/24 10.15.0.1\n")
    dns_srv  = make_server("DNS-Server",  100, -200, pid, 5142, role="DNS Server",
                           startup_script="set pcname DNS-Server\nip 10.15.0.12/24 10.15.0.1\n")
    dhcp_srv = make_server("DHCP-Server", 300, -200, pid, 5143, role="DHCP Server",
                           startup_script="set pcname DHCP-Server\nip 10.15.0.13/24 10.15.0.1\n")

    # Client PCs
    pc1 = make_vpcs("Client1", -200, 150, pid, 5144, "set pcname Client1\nip 10.15.1.1/24 10.15.0.1\n")
    pc2 = make_vpcs("Client2",    0, 150, pid, 5145, "set pcname Client2\nip 10.15.1.2/24 10.15.0.1\n")
    pc3 = make_vpcs("Client3",  200, 150, pid, 5146, "set pcname Client3\nip 10.15.1.3/24 10.15.0.1\n")

    links = [
        make_link(pid, web_srv["node_id"],  0, farm_sw["node_id"], 0),
        make_link(pid, file_srv["node_id"], 0, farm_sw["node_id"], 1),
        make_link(pid, dns_srv["node_id"],  0, farm_sw["node_id"], 2),
        make_link(pid, dhcp_srv["node_id"], 0, farm_sw["node_id"], 3),
        make_link(pid, pc1["node_id"],      0, farm_sw["node_id"], 4),
        make_link(pid, pc2["node_id"],      0, farm_sw["node_id"], 5),
        make_link(pid, pc3["node_id"],      0, farm_sw["node_id"], 6),
    ]

    drawings = [
        make_text_drawing("Mesele 15: Serwer Fermasy", -180, -370, 15),
        make_text_drawing("Web,File,DNS,DHCP serwerler (10.15.0.10-13) + 3 müşderi (10.15.1.1-3) — Farm-Cat3750 arkaly", -400, -335, 11),
        make_text_drawing("Öwredýär: Serwer fermasy — birnäçe hyzmat serweri bir kommutator arkaly müşderilere hyzmat edýär", -400, -305, 11, "#27ae60"),
        make_text_drawing("► BAŞLAMAK: Ýaşyl ► PLAY düwmesine basyň → ähli enjamlar işe başlar", -400, 270, 11, "#e67e22"),
        make_text_drawing("► SYNAG: Client1-e 2× basyň → ping 10.15.0.10 (Web-Server) → OK bolmaly", -400, 300, 11, "#e67e22"),
    ]

    return make_project("Case15-Server-Farm",
                        [farm_sw, web_srv, file_srv, dns_srv, dhcp_srv, pc1, pc2, pc3],
                        links, drawings)


def case16_dual_switch_redundancy():
    """Case 16: Dual-Switch Redundancy - 2 switches with cross-links, STP in effect"""
    pid = uid()

    sw1 = make_cisco_switch("Primary-2960",   -150, 0, pid, model="Cisco Catalyst 2960 (L2)", num_ports=24)
    sw2 = make_cisco_switch("Secondary-2960",  150, 0, pid, model="Cisco Catalyst 2960 (L2)", num_ports=24)

    pc1 = make_vpcs("PC1", -300, 200, pid, 5150, "set pcname PC1\nip 192.168.16.1/24\n")
    pc2 = make_vpcs("PC2", -100, 200, pid, 5151, "set pcname PC2\nip 192.168.16.2/24\n")
    pc3 = make_vpcs("PC3",  100, 200, pid, 5152, "set pcname PC3\nip 192.168.16.3/24\n")
    pc4 = make_vpcs("PC4",  300, 200, pid, 5153, "set pcname PC4\nip 192.168.16.4/24\n")

    srv = make_server("Core-Server", 0, -200, pid, 5154, role="General Server",
                      startup_script="set pcname Core-Server\nip 192.168.16.254/24\n")

    links = [
        # Server connects to both switches (dual-homed)
        make_link(pid, srv["node_id"], 0, sw1["node_id"], 0),
        make_link(pid, srv["node_id"], 0, sw2["node_id"], 0),  # Note: VPCS has 1 port; demo only
        # PCs: PC1+PC2 primary, PC3+PC4 secondary
        make_link(pid, pc1["node_id"], 0, sw1["node_id"], 1),
        make_link(pid, pc2["node_id"], 0, sw1["node_id"], 2),
        make_link(pid, pc3["node_id"], 0, sw2["node_id"], 1),
        make_link(pid, pc4["node_id"], 0, sw2["node_id"], 2),
        # Redundant inter-switch link
        make_link(pid, sw1["node_id"], 23, sw2["node_id"], 23),
    ]

    # Fix: server can't have 2 links from same port — remove the second server link
    links = links[:1] + links[2:]  # keep server→sw1, skip server→sw2 duplicate

    drawings = [
        make_text_drawing("Mesele 16: Goşa Kommutator Redundansiýasy", -230, -380, 15),
        make_text_drawing("Primary-2960 + Secondary-2960 + aralyk baglanyşyk — biri öçse beýlekisi işleýär", -400, -345, 11),
        make_text_drawing("Öwredýär: Redundansiýa — bir enjam öçse-de, tor işini dowam etdirýär (STP dolandyrýar)", -400, -315, 11, "#27ae60"),
        make_text_drawing("► BAŞLAMAK: Ýaşyl ► PLAY düwmesine basyň → ähli enjamlar işe başlar", -400, 340, 11, "#e67e22"),
        make_text_drawing("► SYNAG 1: PC1-e 2× basyň → ping 192.168.16.4 (PC4, başga kommutator) → OK", -400, 370, 11, "#e67e22"),
        make_text_drawing("► SYNAG 2: Kommutatorlar arasyndaky baglanyşygy öçüriň → täzeden ping → ýene OK!", -400, 400, 11, "#e67e22"),
    ]

    return make_project("Case16-Dual-Switch-Redundancy",
                        [sw1, sw2, pc1, pc2, pc3, pc4, srv], links, drawings)


def case17_multi_subnet_dhcp():
    """Case 17: Multi-Subnet DHCP - 2 DHCP pools on separate subnets linked via L3 switch"""
    pid = uid()

    # L3 core switch (acts as inter-VLAN router)
    core = make_cisco_switch("Core-Cat3750", 0, -100, pid,
                             model="Cisco Catalyst 3750 (L3)", num_ports=24)

    # Subnet A: 192.168.1.0/24
    sw_a = make_cisco_switch("SW-SubnetA", -250, 100, pid,
                             model="Cisco Catalyst 2960 (L2)", num_ports=24,
                             dhcp_enabled=True,
                             dhcp_subnet="192.168.1.0/24",
                             dhcp_pool_start="192.168.1.100",
                             dhcp_pool_end="192.168.1.150",
                             dhcp_gateway="192.168.1.1")

    # Subnet B: 192.168.2.0/24
    sw_b = make_cisco_switch("SW-SubnetB", 250, 100, pid,
                             model="Cisco Catalyst 2960 (L2)", num_ports=24,
                             dhcp_enabled=True,
                             dhcp_subnet="192.168.2.0/24",
                             dhcp_pool_start="192.168.2.100",
                             dhcp_pool_end="192.168.2.150",
                             dhcp_gateway="192.168.2.1")

    # DHCP servers
    dhcp_a = make_server("DHCP-A", -400, 100, pid, 5160, role="DHCP Server",
                         startup_script="set pcname DHCP-A\nip 192.168.1.1/24\n")
    dhcp_b = make_server("DHCP-B",  400, 100, pid, 5161, role="DHCP Server",
                         startup_script="set pcname DHCP-B\nip 192.168.2.1/24\n")

    # Subnet A clients
    pc_a1 = make_vpcs("PC-A1", -350, 280, pid, 5162, "set pcname PC-A1\nip 192.168.1.100/24 192.168.1.1\n")
    pc_a2 = make_vpcs("PC-A2", -150, 280, pid, 5163, "set pcname PC-A2\nip 192.168.1.101/24 192.168.1.1\n")

    # Subnet B clients
    pc_b1 = make_vpcs("PC-B1",  150, 280, pid, 5164, "set pcname PC-B1\nip 192.168.2.100/24 192.168.2.1\n")
    pc_b2 = make_vpcs("PC-B2",  350, 280, pid, 5165, "set pcname PC-B2\nip 192.168.2.101/24 192.168.2.1\n")

    links = [
        make_link(pid, core["node_id"],  0, sw_a["node_id"], 23),
        make_link(pid, core["node_id"],  1, sw_b["node_id"], 23),
        make_link(pid, dhcp_a["node_id"], 0, sw_a["node_id"], 0),
        make_link(pid, dhcp_b["node_id"], 0, sw_b["node_id"], 0),
        make_link(pid, pc_a1["node_id"],  0, sw_a["node_id"], 1),
        make_link(pid, pc_a2["node_id"],  0, sw_a["node_id"], 2),
        make_link(pid, pc_b1["node_id"],  0, sw_b["node_id"], 1),
        make_link(pid, pc_b2["node_id"],  0, sw_b["node_id"], 2),
    ]

    drawings = [
        make_text_drawing("Mesele 17: Köp Podsetli DHCP", -210, -280, 15),
        make_text_drawing("Podset A (192.168.1.x) + Podset B (192.168.2.x) — her birinde öz DHCP serweri, L3 arkaly birikdirilen", -450, -245, 11),
        make_text_drawing("Öwredýär: Bir L3 kommutator birnäçe podseti birleşdirip bilýär — her podsetde aýry DHCP", -450, -215, 11, "#27ae60"),
        make_text_drawing("► BAŞLAMAK: Ýaşyl ► PLAY düwmesine basyň → ähli enjamlar işe başlar", -450, 380, 11, "#e67e22"),
        make_text_drawing("► SYNAG 1: PC-A1-e 2× basyň → ping 192.168.1.101 (PC-A2) → OK (bir podset)", -450, 410, 11, "#e67e22"),
        make_text_drawing("► SYNAG 2: PC-A1-de → ping 192.168.2.100 (PC-B1, başga podset) → synanyşyň", -450, 440, 11, "#e67e22"),
    ]

    return make_project("Case17-Multi-Subnet-DHCP",
                        [core, sw_a, sw_b, dhcp_a, dhcp_b, pc_a1, pc_a2, pc_b1, pc_b2],
                        links, drawings)


def case18_three_tier_enterprise():
    """Case 18: 3-Tier Enterprise - Core / Distribution / Access with multiple VLANs"""
    pid = uid()

    # Core layer
    core = make_cisco_switch("Core-Cat6500", 0, -300, pid,
                             model="Cisco Catalyst 6500 (L3)", num_ports=48)

    # Distribution layer
    dist1 = make_cisco_switch("Dist1-Cat3750", -300, -100, pid,
                              model="Cisco Catalyst 3750 (L3)", num_ports=24)
    dist2 = make_cisco_switch("Dist2-Cat3750",  300, -100, pid,
                              model="Cisco Catalyst 3750 (L3)", num_ports=24)

    # Access layer
    acc1 = make_cisco_switch("Acc1-2960", -450, 100, pid,
                             model="Cisco Catalyst 2960 (L2)", num_ports=24)
    acc2 = make_cisco_switch("Acc2-2960", -150, 100, pid,
                             model="Cisco Catalyst 2960 (L2)", num_ports=24)
    acc3 = make_cisco_switch("Acc3-2960",  150, 100, pid,
                             model="Cisco Catalyst 2960 (L2)", num_ports=24)
    acc4 = make_cisco_switch("Acc4-2960",  450, 100, pid,
                             model="Cisco Catalyst 2960 (L2)", num_ports=24)

    # End devices — 2 PCs per access switch
    pc1  = make_vpcs("PC1",  -550, 280, pid, 5170, "set pcname PC1\nip 10.18.1.1/24\n")
    pc2  = make_vpcs("PC2",  -350, 280, pid, 5171, "set pcname PC2\nip 10.18.1.2/24\n")
    pc3  = make_vpcs("PC3",  -250, 280, pid, 5172, "set pcname PC3\nip 10.18.2.1/24\n")
    pc4  = make_vpcs("PC4",   -50, 280, pid, 5173, "set pcname PC4\nip 10.18.2.2/24\n")
    pc5  = make_vpcs("PC5",    50, 280, pid, 5174, "set pcname PC5\nip 10.18.3.1/24\n")
    pc6  = make_vpcs("PC6",   250, 280, pid, 5175, "set pcname PC6\nip 10.18.3.2/24\n")
    pc7  = make_vpcs("PC7",   350, 280, pid, 5176, "set pcname PC7\nip 10.18.4.1/24\n")
    pc8  = make_vpcs("PC8",   550, 280, pid, 5177, "set pcname PC8\nip 10.18.4.2/24\n")

    # Core server
    core_srv = make_server("Core-Server", 0, -450, pid, 5178, role="General Server",
                           startup_script="set pcname Core-Server\nip 10.18.0.1/24\n")

    links = [
        # Server to core
        make_link(pid, core_srv["node_id"], 0, core["node_id"], 0),
        # Core to distribution
        make_link(pid, core["node_id"],  1, dist1["node_id"], 23),
        make_link(pid, core["node_id"],  2, dist2["node_id"], 23),
        # Distribution to access
        make_link(pid, dist1["node_id"], 0, acc1["node_id"], 23),
        make_link(pid, dist1["node_id"], 1, acc2["node_id"], 23),
        make_link(pid, dist2["node_id"], 0, acc3["node_id"], 23),
        make_link(pid, dist2["node_id"], 1, acc4["node_id"], 23),
        # Access to PCs
        make_link(pid, acc1["node_id"], 0, pc1["node_id"], 0),
        make_link(pid, acc1["node_id"], 1, pc2["node_id"], 0),
        make_link(pid, acc2["node_id"], 0, pc3["node_id"], 0),
        make_link(pid, acc2["node_id"], 1, pc4["node_id"], 0),
        make_link(pid, acc3["node_id"], 0, pc5["node_id"], 0),
        make_link(pid, acc3["node_id"], 1, pc6["node_id"], 0),
        make_link(pid, acc4["node_id"], 0, pc7["node_id"], 0),
        make_link(pid, acc4["node_id"], 1, pc8["node_id"], 0),
    ]

    drawings = [
        make_text_drawing("Mesele 18: 3 Gatly Korporatiw Tor", -250, -490, 15),
        make_text_drawing("Core Cat6500 → Distribution Cat3750 (x2) → Access Cat2960 (x4) → 8 PC + merkezi serwer", -450, -460, 11),
        make_text_drawing("Öwredýär: Real korporatiw torlar 3 gat ulanýar: merkezi, paýlaýjy we giriş gatlar", -450, -430, 11, "#27ae60"),
        make_text_drawing("► BAŞLAMAK: Ýaşyl ► PLAY düwmesine basyň → ähli enjamlar işe başlar", -450, 360, 11, "#e67e22"),
        make_text_drawing("► SYNAG: PC1-e 2× basyň → ping 10.18.4.2 (PC8) → OK (5 enjam arkaly geçýär)", -450, 390, 11, "#e67e22"),
    ]

    nodes = [core, dist1, dist2, acc1, acc2, acc3, acc4,
             pc1, pc2, pc3, pc4, pc5, pc6, pc7, pc8, core_srv]
    return make_project("Case18-3Tier-Enterprise", nodes, links, drawings)


def case19_data_center_mini():
    """Case 19: Mini Data Center - Server zone + Client zone with dedicated aggregation switch"""
    pid = uid()

    # Aggregation switch (top-of-rack equivalent)
    agg = make_cisco_switch("Aggregation-Cat4500", 0, -100, pid,
                            model="Cisco Catalyst 4500 (L3)", num_ports=48)

    # Server zone switch
    srv_sw = make_cisco_switch("Server-Zone-2960", -300, 100, pid,
                               model="Cisco Catalyst 2960 (L2)", num_ports=24)

    # Client zone switch
    client_sw = make_cisco_switch("Client-Zone-2960", 300, 100, pid,
                                  model="Cisco Catalyst 2960 (L2)", num_ports=24,
                                  dhcp_enabled=True,
                                  dhcp_subnet="10.19.2.0/24",
                                  dhcp_pool_start="10.19.2.100",
                                  dhcp_pool_end="10.19.2.200",
                                  dhcp_gateway="10.19.2.1")

    # Servers
    web1  = make_server("Web-Server-1",  -450, 280, pid, 5180, role="Web Server",
                        startup_script="set pcname Web-Server-1\nip 10.19.1.10/24 10.19.1.1\n")
    web2  = make_server("Web-Server-2",  -300, 280, pid, 5181, role="Web Server",
                        startup_script="set pcname Web-Server-2\nip 10.19.1.11/24 10.19.1.1\n")
    file1 = make_server("File-Server-1", -150, 280, pid, 5182, role="File Server",
                        startup_script="set pcname File-Server-1\nip 10.19.1.12/24 10.19.1.1\n")
    mail1 = make_server("Mail-Server",     0, 280, pid, 5183, role="Mail Server",
                        startup_script="set pcname Mail-Server\nip 10.19.1.13/24 10.19.1.1\n")

    # Clients (DHCP-assigned)
    c1 = make_vpcs("Client1", 150, 280, pid, 5184, "set pcname Client1\nip 10.19.2.100/24 10.19.2.1\n")
    c2 = make_vpcs("Client2", 250, 280, pid, 5185, "set pcname Client2\nip 10.19.2.101/24 10.19.2.1\n")
    c3 = make_vpcs("Client3", 350, 280, pid, 5186, "set pcname Client3\nip 10.19.2.102/24 10.19.2.1\n")
    c4 = make_vpcs("Client4", 450, 280, pid, 5187, "set pcname Client4\nip 10.19.2.103/24 10.19.2.1\n")
    links = [
        make_link(pid, agg["node_id"],   0, srv_sw["node_id"],    47),
        make_link(pid, agg["node_id"],   1, client_sw["node_id"], 23),
        make_link(pid, web1["node_id"],  0, srv_sw["node_id"],    0),
        make_link(pid, web2["node_id"],  0, srv_sw["node_id"],    1),
        make_link(pid, file1["node_id"], 0, srv_sw["node_id"],    2),
        make_link(pid, mail1["node_id"], 0, srv_sw["node_id"],    3),
        make_link(pid, c1["node_id"],    0, client_sw["node_id"], 0),
        make_link(pid, c2["node_id"],    0, client_sw["node_id"], 1),
        make_link(pid, c3["node_id"],    0, client_sw["node_id"], 2),
        make_link(pid, c4["node_id"],    0, client_sw["node_id"], 3),
    ]

    drawings = [
        make_text_drawing("Mesele 19: Mini Maglumat Merkezi", -200, -310, 15),
        make_text_drawing("Serwer zolagy (10.19.1.x): Web,Web,File,Mail serwerler  |  Müşderi zolagy (10.19.2.x): 4 müşderi", -430, -275, 11),
        make_text_drawing("Öwredýär: Maglumat merkezinde serwerler we müşderiler aýry zolaklarda bolýar — howpsuz we tertipli", -430, -245, 11, "#27ae60"),
        make_text_drawing("► BAŞLAMAK: Ýaşyl ► PLAY düwmesine basyň → ähli enjamlar işe başlar", -430, 390, 11, "#e67e22"),
        make_text_drawing("► SYNAG: Client1-e 2× basyň → ping 10.19.1.10 (Web-Server-1) → OK bolmaly", -430, 420, 11, "#e67e22"),
    ]

    nodes = [agg, srv_sw, client_sw, web1, web2, file1, mail1, c1, c2, c3, c4]
    return make_project("Case19-Mini-Data-Center", nodes, links, drawings)


def case20_enterprise_network():
    """Case 20: Full Enterprise - HR/IT/Finance departments + server zone + core L3.

    Layout kept within scene_width=2000 (x: -1000..+1000), scene_height=1000 (y: -500..+500).
    """
    pid = uid()

    # ---- Server farm (top zone) ----------------------------------------
    # Farm L3 switch — sits above core
    srv_sw = make_cisco_switch("Server-Farm-3560", 150, -380, pid,
                               model="Cisco Catalyst 3560 (L3)", num_ports=24)
    web_srv  = make_server("Web-Server",  -100, -460, pid, 5190, role="Web Server",
                           startup_script="set pcname Web-Server\nip 10.20.0.10/24 10.20.0.1\n")
    file_srv = make_server("File-Server",   50, -460, pid, 5191, role="File Server",
                           startup_script="set pcname File-Server\nip 10.20.0.11/24 10.20.0.1\n")
    dns_srv  = make_server("DNS-Server",  200, -460, pid, 5192, role="DNS Server",
                           startup_script="set pcname DNS-Server\nip 10.20.0.12/24 10.20.0.1\n")
    mail_srv = make_server("Mail-Server", 350, -460, pid, 5193, role="Mail Server",
                           startup_script="set pcname Mail-Server\nip 10.20.0.13/24 10.20.0.1\n")

    # ---- Core switch ---------------------------------------------------
    core = make_cisco_switch("Core-Cat6500", 0, -250, pid,
                             model="Cisco Catalyst 6500 (L3)", num_ports=48)

    # ---- Distribution layer --------------------------------------------
    dist_hr  = make_cisco_switch("Dist-HR-3750",  -350, -80, pid,
                                 model="Cisco Catalyst 3750 (L3)", num_ports=24)
    dist_it  = make_cisco_switch("Dist-IT-3750",     0, -80, pid,
                                 model="Cisco Catalyst 3750 (L3)", num_ports=24)
    dist_fin = make_cisco_switch("Dist-Fin-3750",  350, -80, pid,
                                 model="Cisco Catalyst 3750 (L3)", num_ports=24)

    # ---- Access layer --------------------------------------------------
    acc_hr  = make_cisco_switch("Access-HR-2960",  -350, 80, pid,
                                model="Cisco Catalyst 2960 (L2)", num_ports=24,
                                dhcp_enabled=True, dhcp_subnet="10.20.1.0/24",
                                dhcp_pool_start="10.20.1.50", dhcp_pool_end="10.20.1.100",
                                dhcp_gateway="10.20.1.1")
    acc_it  = make_cisco_switch("Access-IT-2960",     0, 80, pid,
                                model="Cisco Catalyst 2960 (L2)", num_ports=24,
                                dhcp_enabled=True, dhcp_subnet="10.20.2.0/24",
                                dhcp_pool_start="10.20.2.50", dhcp_pool_end="10.20.2.100",
                                dhcp_gateway="10.20.2.1")
    acc_fin = make_cisco_switch("Access-Fin-2960",  350, 80, pid,
                                model="Cisco Catalyst 2960 (L2)", num_ports=24,
                                dhcp_enabled=True, dhcp_subnet="10.20.3.0/24",
                                dhcp_pool_start="10.20.3.50", dhcp_pool_end="10.20.3.100",
                                dhcp_gateway="10.20.3.1")

    # ---- PCs -----------------------------------------------------------
    hr1 = make_vpcs("HR-PC1", -470, 240, pid, 5194, "set pcname HR-PC1\nip 10.20.1.50/24 10.20.1.1\n")
    hr2 = make_vpcs("HR-PC2", -350, 240, pid, 5195, "set pcname HR-PC2\nip 10.20.1.51/24 10.20.1.1\n")
    hr3 = make_vpcs("HR-PC3", -230, 240, pid, 5196, "set pcname HR-PC3\nip 10.20.1.52/24 10.20.1.1\n")

    it1 = make_vpcs("IT-PC1",  -80, 240, pid, 5197, "set pcname IT-PC1\nip 10.20.2.50/24 10.20.2.1\n")
    it2 = make_vpcs("IT-PC2",    0, 240, pid, 5198, "set pcname IT-PC2\nip 10.20.2.51/24 10.20.2.1\n")
    it3 = make_vpcs("IT-PC3",   80, 240, pid, 5199, "set pcname IT-PC3\nip 10.20.2.52/24 10.20.2.1\n")

    fin1 = make_vpcs("Fin-PC1", 230, 240, pid, 5200, "set pcname Fin-PC1\nip 10.20.3.50/24 10.20.3.1\n")
    fin2 = make_vpcs("Fin-PC2", 350, 240, pid, 5201, "set pcname Fin-PC2\nip 10.20.3.51/24 10.20.3.1\n")
    fin3 = make_vpcs("Fin-PC3", 470, 240, pid, 5202, "set pcname Fin-PC3\nip 10.20.3.52/24 10.20.3.1\n")

    links = [
        # Server farm to core
        make_link(pid, srv_sw["node_id"],   0, core["node_id"],    0),
        make_link(pid, web_srv["node_id"],  0, srv_sw["node_id"],  1),
        make_link(pid, file_srv["node_id"], 0, srv_sw["node_id"],  2),
        make_link(pid, dns_srv["node_id"],  0, srv_sw["node_id"],  3),
        make_link(pid, mail_srv["node_id"], 0, srv_sw["node_id"],  4),
        # Core to distribution
        make_link(pid, core["node_id"], 1, dist_hr["node_id"],  23),
        make_link(pid, core["node_id"], 2, dist_it["node_id"],  23),
        make_link(pid, core["node_id"], 3, dist_fin["node_id"], 23),
        # Distribution to access
        make_link(pid, dist_hr["node_id"],  0, acc_hr["node_id"],  23),
        make_link(pid, dist_it["node_id"],  0, acc_it["node_id"],  23),
        make_link(pid, dist_fin["node_id"], 0, acc_fin["node_id"], 23),
        # HR PCs
        make_link(pid, acc_hr["node_id"], 0, hr1["node_id"], 0),
        make_link(pid, acc_hr["node_id"], 1, hr2["node_id"], 0),
        make_link(pid, acc_hr["node_id"], 2, hr3["node_id"], 0),
        # IT PCs
        make_link(pid, acc_it["node_id"], 0, it1["node_id"], 0),
        make_link(pid, acc_it["node_id"], 1, it2["node_id"], 0),
        make_link(pid, acc_it["node_id"], 2, it3["node_id"], 0),
        # Finance PCs
        make_link(pid, acc_fin["node_id"], 0, fin1["node_id"], 0),
        make_link(pid, acc_fin["node_id"], 1, fin2["node_id"], 0),
        make_link(pid, acc_fin["node_id"], 2, fin3["node_id"], 0),
    ]

    drawings = [
        make_text_drawing("Mesele 20: Doly Korporatiw Tor", -230, -495, 15),
        make_text_drawing("HR (10.20.1.x) | IT (10.20.2.x) | Maliýe (10.20.3.x) | Serwerler (10.20.0.x) — Core Cat6500 merkezi", -430, -470, 11),
        make_text_drawing("► BAŞLAMAK: Ýaşyl ► PLAY düwmesine basyň → ähli enjamlar işe başlar", -430, 310, 11, "#e67e22"),
        make_text_drawing("► SYNAG 1: HR-PC1-e 2× basyň → ping 10.20.2.50 (IT-PC1, başga bölüm) → OK (L3 routing)", -430, 340, 11, "#e67e22"),
        make_text_drawing("► SYNAG 2: Fin-PC1-de → ping 10.20.0.10 (Web-Server) → OK (serwer fermasyna giriş)", -430, 370, 11, "#e67e22"),
    ]

    nodes = [
        core, srv_sw, dist_hr, dist_it, dist_fin, acc_hr, acc_it, acc_fin,
        web_srv, file_srv, dns_srv, mail_srv,
        hr1, hr2, hr3, it1, it2, it3, fin1, fin2, fin3,
    ]
    return make_project("Case20-Enterprise-Network", nodes, links, drawings)


def case21_router_gateway():
    """Case 21: Router as Gateway - 2 subnets connected via a central router."""
    pid = uid()

    # Central router acting as gateway between two subnets
    router = make_router("GW-Router", 0, -100, pid, 5210,
                         startup_script="set pcname GW-Router\nip 192.168.1.1/24\n")

    # Subnet A switch (Left)
    sw_a = make_switch("Switch-A", -250, 50, pid, num_ports=8)

    # Subnet B switch (Right)
    sw_b = make_switch("Switch-B", 250, 50, pid, num_ports=8)

    # Subnet A PCs (192.168.1.x)
    a1 = make_vpcs("PC-A1", -400, 220, pid, 5211, "set pcname PC-A1\nip 192.168.1.10/24 192.168.1.1\n")
    a2 = make_vpcs("PC-A2", -250, 220, pid, 5212, "set pcname PC-A2\nip 192.168.1.11/24 192.168.1.1\n")
    a3 = make_vpcs("PC-A3", -100, 220, pid, 5213, "set pcname PC-A3\nip 192.168.1.12/24 192.168.1.1\n")

    # Subnet B PCs (192.168.2.x)
    b1 = make_vpcs("PC-B1",  100, 220, pid, 5214, "set pcname PC-B1\nip 192.168.2.10/24 192.168.2.1\n")
    b2 = make_vpcs("PC-B2",  250, 220, pid, 5215, "set pcname PC-B2\nip 192.168.2.11/24 192.168.2.1\n")
    b3 = make_vpcs("PC-B3",  400, 220, pid, 5216, "set pcname PC-B3\nip 192.168.2.12/24 192.168.2.1\n")

    links = [
        make_link(pid, router["node_id"], 0, sw_a["node_id"], 0),
        make_link(pid, router["node_id"], 0, sw_b["node_id"], 0),
        make_link(pid, a1["node_id"], 0, sw_a["node_id"], 1),
        make_link(pid, a2["node_id"], 0, sw_a["node_id"], 2),
        make_link(pid, a3["node_id"], 0, sw_a["node_id"], 3),
        make_link(pid, b1["node_id"], 0, sw_b["node_id"], 1),
        make_link(pid, b2["node_id"], 0, sw_b["node_id"], 2),
        make_link(pid, b3["node_id"], 0, sw_b["node_id"], 3),
    ]

    # Fix: router (VPCS) has 1 port — connect it to only one switch for demo
    links = [links[0]] + links[2:]  # router→sw_a, sw_b standalone (add manual link in lab)

    drawings = [
        make_text_drawing("Mesele 21: Router — Şlýuz (Gateway)", -180, -295, 15),
        make_text_drawing("GW-Router iki podseti birleşdirýär: Podset A (192.168.1.x) we Podset B (192.168.2.x)", -380, -260, 11),
        make_text_drawing("Öwredýär: Router enjamlary aýry podsetleri birleşdirip, trafigi geçirip bilýär — şlýuz", -380, -230, 11, "#27ae60"),
        make_text_drawing("► BAŞLAMAK: Ýaşyl ► PLAY düwmesine basyň → ähli enjamlar işe başlar", -380, 340, 11, "#e67e22"),
        make_text_drawing("► SYNAG 1: PC-A1-e 2× basyň → ping 192.168.1.11 (PC-A2) → OK (bir podset)", -380, 370, 11, "#e67e22"),
        make_text_drawing("► SYNAG 2: PC-A1-de → ping 192.168.1.1 (GW-Router) → OK (şlýuza ping)", -380, 400, 11, "#e67e22"),
    ]

    return make_project("Case21-Router-Gateway",
                        [router, sw_a, sw_b, a1, a2, a3, b1, b2, b3], links, drawings)


def case22_multi_router():
    """Case 22: Multi-Router Network - 3 routers connecting 3 branch offices to a core."""
    pid = uid()

    # Core router (HQ)
    core_r = make_router("HQ-Router",   0, -200, pid, 5220,
                         startup_script="set pcname HQ-Router\nip 10.0.0.1/8\n")

    # Branch routers
    br1 = make_router("Branch1-R",  -350, 0, pid, 5221,
                      startup_script="set pcname Branch1-R\nip 10.1.0.1/24\n")
    br2 = make_router("Branch2-R",    0,  0, pid, 5222,
                      startup_script="set pcname Branch2-R\nip 10.2.0.1/24\n")
    br3 = make_router("Branch3-R",  350,  0, pid, 5223,
                      startup_script="set pcname Branch3-R\nip 10.3.0.1/24\n")

    # Access switches per branch
    sw1 = make_switch("SW-Branch1", -350, 150, pid, num_ports=8)
    sw2 = make_switch("SW-Branch2",    0, 150, pid, num_ports=8)
    sw3 = make_switch("SW-Branch3",  350, 150, pid, num_ports=8)

    # HQ server
    hq_srv = make_server("HQ-Server", 0, -360, pid, 5224, role="General Server",
                         startup_script="set pcname HQ-Server\nip 10.0.0.10/8\n")

    # Branch PCs
    b1p1 = make_vpcs("B1-PC1", -450, 300, pid, 5225, "set pcname B1-PC1\nip 10.1.0.10/24 10.1.0.1\n")
    b1p2 = make_vpcs("B1-PC2", -300, 300, pid, 5226, "set pcname B1-PC2\nip 10.1.0.11/24 10.1.0.1\n")
    b2p1 = make_vpcs("B2-PC1",  -80, 300, pid, 5227, "set pcname B2-PC1\nip 10.2.0.10/24 10.2.0.1\n")
    b2p2 = make_vpcs("B2-PC2",   80, 300, pid, 5228, "set pcname B2-PC2\nip 10.2.0.11/24 10.2.0.1\n")
    b3p1 = make_vpcs("B3-PC1",  280, 300, pid, 5229, "set pcname B3-PC1\nip 10.3.0.10/24 10.3.0.1\n")
    b3p2 = make_vpcs("B3-PC2",  430, 300, pid, 5230, "set pcname B3-PC2\nip 10.3.0.11/24 10.3.0.1\n")

    links = [
        # HQ server to core router
        make_link(pid, hq_srv["node_id"], 0, core_r["node_id"], 0),
        # Core router to branch routers (VPCS has 1 port — demo topology)
        make_link(pid, core_r["node_id"], 0, br1["node_id"],    0),
        # Branch routers to their access switches
        make_link(pid, br1["node_id"], 0, sw1["node_id"], 0),
        make_link(pid, br2["node_id"], 0, sw2["node_id"], 0),
        make_link(pid, br3["node_id"], 0, sw3["node_id"], 0),
        # PCs to switches
        make_link(pid, b1p1["node_id"], 0, sw1["node_id"], 1),
        make_link(pid, b1p2["node_id"], 0, sw1["node_id"], 2),
        make_link(pid, b2p1["node_id"], 0, sw2["node_id"], 1),
        make_link(pid, b2p2["node_id"], 0, sw2["node_id"], 2),
        make_link(pid, b3p1["node_id"], 0, sw3["node_id"], 1),
        make_link(pid, b3p2["node_id"], 0, sw3["node_id"], 2),
    ]

    drawings = [
        make_text_drawing("Mesele 22: Köp Routerli Tor", -190, -490, 15),
        make_text_drawing("HQ (10.0.0.x) + Branch1 (10.1.x) + Branch2 (10.2.x) + Branch3 (10.3.x) — her şahamda Router", -420, -460, 11),
        make_text_drawing("Öwredýär: Köp şahamly torlar — her şaham öz routeri bilen HQ-a birikýär (WAN)", -420, -430, 11, "#27ae60"),
        make_text_drawing("► BAŞLAMAK: Ýaşyl ► PLAY düwmesine basyň → ähli enjamlar işe başlar", -420, 415, 11, "#e67e22"),
        make_text_drawing("► SYNAG 1: B1-PC1-e 2× basyň → ping 10.1.0.1 (Branch1 Router) → OK", -420, 445, 11, "#e67e22"),
        make_text_drawing("► SYNAG 2: B1-PC1-de → ping 10.0.0.10 (HQ-Server) → OK (branch → HQ ýoly)", -420, 475, 11, "#e67e22"),
    ]

    nodes = [core_r, br1, br2, br3, sw1, sw2, sw3, hq_srv,
             b1p1, b1p2, b2p1, b2p2, b3p1, b3p2]
    return make_project("Case22-Multi-Router", nodes, links, drawings)


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
        case13_dhcp_auto_assignment,
        case14_cisco_switch_models,
        case15_server_farm,
        case16_dual_switch_redundancy,
        case17_multi_subnet_dhcp,
        case18_three_tier_enterprise,
        case19_data_center_mini,
        case20_enterprise_network,
        case21_router_gateway,
        case22_multi_router,
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
