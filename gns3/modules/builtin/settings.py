# -*- coding: utf-8 -*-
#
# Copyright (C) 2016 GNS3 Technologies Inc.
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
Default Built-in settings.
"""

import sys

from gns3.node import Node

if sys.platform.startswith("linux"):
    DEFAULT_NAT_INTERFACE = "virbr0"
else:
    DEFAULT_NAT_INTERFACE = "vmnet8"

BUILTIN_SETTINGS = {
    "default_nat_interface": DEFAULT_NAT_INTERFACE
}

CLOUD_SETTINGS = {
    "name": "",
    "remote_console_host": "127.0.0.1",
    "remote_console_port": 23,
    "remote_console_type": "none",
    "remote_console_http_path": "/",
    "default_name_format": "Cloud{0}",
    "symbol": ":/symbols/cloud.svg",
    "category": Node.end_devices,
    "ports_mapping": [],
    "node_type": "cloud"
}

ETHERNET_HUB_SETTINGS = {
    "name": "",
    "default_name_format": "Hub{0}",
    "symbol": ":/symbols/hub.svg",
    "category": Node.switches,
    "ports_mapping": [],
    "node_type": "ethernet_hub"
}

SWITCH_MODELS = [
    "Generic Switch",
    "Cisco Catalyst 2960 (L2)",
    "Cisco Catalyst 3560 (L3)",
    "Cisco Catalyst 3750 (L3)",
    "Cisco Catalyst 4500 (L3)",
    "Cisco Catalyst 6500 (L3)",
]

L3_SWITCH_MODELS = {
    "Cisco Catalyst 3560 (L3)",
    "Cisco Catalyst 3750 (L3)",
    "Cisco Catalyst 4500 (L3)",
    "Cisco Catalyst 6500 (L3)",
}

SWITCH_MODEL_PORT_COUNTS = {
    "Generic Switch": 8,
    "Cisco Catalyst 2960 (L2)": 24,
    "Cisco Catalyst 3560 (L3)": 24,
    "Cisco Catalyst 3750 (L3)": 24,
    "Cisco Catalyst 4500 (L3)": 48,
    "Cisco Catalyst 6500 (L3)": 48,
}

ETHERNET_SWITCH_SETTINGS = {
    "name": "",
    "default_name_format": "Switch{0}",
    "symbol": ":/symbols/ethernet_switch.svg",
    "category": Node.switches,
    "console_type": "none",
    "ports_mapping": [],
    "node_type": "ethernet_switch",
    # Switch model
    "switch_model": "Generic Switch",
    # DHCP server configuration
    "dhcp_enabled": False,
    "dhcp_subnet": "192.168.1.0/24",
    "dhcp_pool_start": "192.168.1.100",
    "dhcp_pool_end": "192.168.1.200",
    "dhcp_gateway": "192.168.1.1",
    "dhcp_dns": "8.8.8.8",
}
