# -*- coding: utf-8 -*-
#
# IP Assignment Table Dialog.
# Shows all device names, types, MAC-like IDs, and their current IP assignments.

from gns3.qt import QtCore, QtWidgets, QtGui


class IPAssignmentDialog(QtWidgets.QDialog):
    """
    Dialog that displays a table of all end-devices in the topology with
    their device type, IP configuration mode, and current IP assignment.

    Accessible from the Network menu → Show IP Assignments.
    """

    def __init__(self, parent, nodes, links):
        super().__init__(parent)
        self.setWindowTitle("Network IP Assignments")
        self.setMinimumSize(720, 480)
        self._nodes = nodes
        self._links = links
        self._setup_ui()
        self._populate()

    def _setup_ui(self):
        layout = QtWidgets.QVBoxLayout(self)

        # Filter bar
        filter_row = QtWidgets.QHBoxLayout()
        filter_row.addWidget(QtWidgets.QLabel("Filter:"))
        self._filter_edit = QtWidgets.QLineEdit()
        self._filter_edit.setPlaceholderText("Type to filter by name or IP…")
        self._filter_edit.textChanged.connect(self._apply_filter)
        filter_row.addWidget(self._filter_edit)

        refresh_btn = QtWidgets.QPushButton("Refresh")
        refresh_btn.clicked.connect(self._populate)
        filter_row.addWidget(refresh_btn)
        layout.addLayout(filter_row)

        # Table
        self._table = QtWidgets.QTableWidget(0, 6)
        self._table.setHorizontalHeaderLabels([
            "Name", "Device Type", "Role / Model", "IP Mode", "IP Address", "Gateway"
        ])
        self._table.horizontalHeader().setStretchLastSection(True)
        self._table.setSelectionBehavior(QtWidgets.QAbstractItemView.SelectionBehavior.SelectRows)
        self._table.setEditTriggers(QtWidgets.QAbstractItemView.EditTrigger.NoEditTriggers)
        self._table.setSortingEnabled(True)
        self._table.verticalHeader().setVisible(False)
        layout.addWidget(self._table)

        # Summary label
        self._summary_label = QtWidgets.QLabel()
        layout.addWidget(self._summary_label)

        # Close button
        btn_box = QtWidgets.QDialogButtonBox(QtWidgets.QDialogButtonBox.StandardButton.Close)
        btn_box.rejected.connect(self.reject)
        layout.addWidget(btn_box)

    def _populate(self):
        from gns3.modules.vpcs.vpcs_node import VPCSNode
        from gns3.modules.builtin.ethernet_switch import EthernetSwitch
        from gns3.modules.builtin.dhcp_manager import DHCPManager

        dhcp_manager = DHCPManager.instance()
        self._table.setSortingEnabled(False)
        self._table.setRowCount(0)

        rows = []

        for node in self._nodes:
            settings = node.settings()

            if isinstance(node, VPCSNode):
                name = node.name()
                device_type = settings.get("device_type", "PC")
                role = settings.get("server_role", "") if device_type == "Server" else "—"
                use_dhcp = settings.get("use_dhcp", False)
                ip_mode = "DHCP" if use_dhcp else "Static"

                # Prefer DHCP-manager assignment, then static settings, then startup_script
                assigned_ip = dhcp_manager.get_assignment(node.node_id())
                if assigned_ip:
                    ip_addr = assigned_ip
                else:
                    ip_addr = settings.get("ip_address", "")
                    if not ip_addr:
                        script = settings.get("startup_script") or ""
                        for line in script.splitlines():
                            if line.strip().startswith("ip "):
                                parts = line.strip().split()
                                if len(parts) >= 2:
                                    ip_addr = parts[1].split("/")[0]
                                break

                gateway = settings.get("gateway", "")
                if not gateway:
                    script = settings.get("startup_script") or ""
                    for line in script.splitlines():
                        if line.strip().startswith("ip "):
                            parts = line.strip().split()
                            if len(parts) >= 3:
                                gateway = parts[2]
                            break

                rows.append((name, device_type, role, ip_mode, ip_addr or "—", gateway or "—"))

            elif isinstance(node, EthernetSwitch):
                name = node.name()
                model = settings.get("switch_model", "Generic Switch")
                dhcp_en = settings.get("dhcp_enabled", False)
                pool = ""
                if dhcp_en:
                    pool = "{} – {}".format(
                        settings.get("dhcp_pool_start", ""),
                        settings.get("dhcp_pool_end", ""))
                rows.append((name, "Switch", model,
                             "DHCP pool: {}".format(pool) if dhcp_en else "No DHCP",
                             settings.get("dhcp_subnet", "—"),
                             settings.get("dhcp_gateway", "—")))

        self._table.setRowCount(len(rows))
        for row_idx, (name, dtype, role, ip_mode, ip_addr, gw) in enumerate(rows):
            self._table.setItem(row_idx, 0, QtWidgets.QTableWidgetItem(name))
            self._table.setItem(row_idx, 1, QtWidgets.QTableWidgetItem(dtype))
            self._table.setItem(row_idx, 2, QtWidgets.QTableWidgetItem(role))

            mode_item = QtWidgets.QTableWidgetItem(ip_mode)
            if ip_mode == "DHCP":
                mode_item.setForeground(QtGui.QColor("#1a7abf"))
            self._table.setItem(row_idx, 3, mode_item)

            ip_item = QtWidgets.QTableWidgetItem(ip_addr)
            if ip_addr and ip_addr != "—":
                ip_item.setForeground(QtGui.QColor("#1a7a1a"))
            self._table.setItem(row_idx, 4, ip_item)

            self._table.setItem(row_idx, 5, QtWidgets.QTableWidgetItem(gw))

        self._table.setSortingEnabled(True)
        self._table.resizeColumnsToContents()

        total = len(rows)
        dhcp_count = sum(1 for r in rows if r[3] == "DHCP")
        self._summary_label.setText(
            "Total devices: {}   |   DHCP clients: {}   |   Static: {}".format(
                total, dhcp_count, total - dhcp_count))

        self._apply_filter(self._filter_edit.text())

    def _apply_filter(self, text):
        text = text.lower()
        for row in range(self._table.rowCount()):
            match = any(
                text in (self._table.item(row, col).text().lower() if self._table.item(row, col) else "")
                for col in range(self._table.columnCount())
            )
            self._table.setRowHidden(row, not match)
