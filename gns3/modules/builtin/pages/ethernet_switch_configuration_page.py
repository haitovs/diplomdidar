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
Configuration page for Ethernet switches.
"""

from gns3.qt import QtCore, QtWidgets
from gns3.dialogs.symbol_selection_dialog import SymbolSelectionDialog
from gns3.node import Node

from ..utils.tree_widget_item import TreeWidgetItem
from ..ui.ethernet_switch_configuration_page_ui import Ui_ethernetSwitchConfigPageWidget
from ..settings import SWITCH_MODELS, L3_SWITCH_MODELS, SWITCH_MODEL_PORT_COUNTS


class EthernetSwitchConfigurationPage(QtWidgets.QWidget, Ui_ethernetSwitchConfigPageWidget):

    """
    QWidget configuration page for Ethernet switches.
    """

    def __init__(self):

        super().__init__()
        self.setupUi(self)
        self._ports = {}
        self._node = None

        # add the categories
        for name, category in Node.defaultCategories().items():
            self.uiCategoryComboBox.addItem(name, category)

        # --- Model row added to the General group box ---
        self._model_label = QtWidgets.QLabel("Switch model:", parent=self.uiGeneralGroupBox)
        self.uiModelComboBox = QtWidgets.QComboBox(parent=self.uiGeneralGroupBox)
        for m in SWITCH_MODELS:
            self.uiModelComboBox.addItem(m)
        self.gridLayout.addWidget(self._model_label, 5, 0, 1, 1)
        self.gridLayout.addWidget(self.uiModelComboBox, 5, 1, 1, 1)
        self.uiModelComboBox.currentIndexChanged.connect(self._modelChangedSlot)

        # --- DHCP server configuration group box ---
        self.uiDHCPGroupBox = QtWidgets.QGroupBox("DHCP Server Configuration", parent=self)
        dhcp_grid = QtWidgets.QGridLayout(self.uiDHCPGroupBox)

        self.uiDHCPEnabledCheckBox = QtWidgets.QCheckBox("Enable DHCP server on this switch")
        dhcp_grid.addWidget(self.uiDHCPEnabledCheckBox, 0, 0, 1, 2)

        dhcp_grid.addWidget(QtWidgets.QLabel("Subnet (CIDR):"), 1, 0)
        self.uiDHCPSubnetLineEdit = QtWidgets.QLineEdit("192.168.1.0/24")
        self.uiDHCPSubnetLineEdit.setPlaceholderText("e.g. 192.168.1.0/24")
        dhcp_grid.addWidget(self.uiDHCPSubnetLineEdit, 1, 1)

        dhcp_grid.addWidget(QtWidgets.QLabel("Pool start:"), 2, 0)
        self.uiDHCPPoolStartLineEdit = QtWidgets.QLineEdit("192.168.1.100")
        self.uiDHCPPoolStartLineEdit.setPlaceholderText("e.g. 192.168.1.100")
        dhcp_grid.addWidget(self.uiDHCPPoolStartLineEdit, 2, 1)

        dhcp_grid.addWidget(QtWidgets.QLabel("Pool end:"), 3, 0)
        self.uiDHCPPoolEndLineEdit = QtWidgets.QLineEdit("192.168.1.200")
        self.uiDHCPPoolEndLineEdit.setPlaceholderText("e.g. 192.168.1.200")
        dhcp_grid.addWidget(self.uiDHCPPoolEndLineEdit, 3, 1)

        dhcp_grid.addWidget(QtWidgets.QLabel("Gateway:"), 4, 0)
        self.uiDHCPGatewayLineEdit = QtWidgets.QLineEdit("192.168.1.1")
        self.uiDHCPGatewayLineEdit.setPlaceholderText("e.g. 192.168.1.1")
        dhcp_grid.addWidget(self.uiDHCPGatewayLineEdit, 4, 1)

        dhcp_grid.addWidget(QtWidgets.QLabel("DNS server:"), 5, 0)
        self.uiDHCPDnsLineEdit = QtWidgets.QLineEdit("8.8.8.8")
        self.uiDHCPDnsLineEdit.setPlaceholderText("e.g. 8.8.8.8")
        dhcp_grid.addWidget(self.uiDHCPDnsLineEdit, 5, 1)

        self.uiDHCPEnabledCheckBox.toggled.connect(self._dhcpToggled)
        self._dhcpToggled(False)

        # Row 4 of the outer grid, spanning both columns
        self.gridLayout_2.addWidget(self.uiDHCPGroupBox, 4, 0, 1, 2)

        # connect existing slots
        self.uiAddPushButton.clicked.connect(self._addPortSlot)
        self.uiDeletePushButton.clicked.connect(self._deletePortSlot)
        self.uiPortsTreeWidget.itemActivated.connect(self._portSelectedSlot)
        self.uiPortsTreeWidget.itemSelectionChanged.connect(self._portSelectionChangedSlot)
        self.uiPortTypeComboBox.currentIndexChanged.connect(self._typeSelectionChangedSlot)

        # enable sorting
        self.uiPortsTreeWidget.sortByColumn(0, QtCore.Qt.SortOrder.AscendingOrder)
        self.uiPortsTreeWidget.setSortingEnabled(True)

        self.uiSymbolToolButton.clicked.connect(self._symbolBrowserSlot)

    # ------------------------------------------------------------------ #
    # Slots
    # ------------------------------------------------------------------ #

    def _symbolBrowserSlot(self):
        symbol_path = self.uiSymbolLineEdit.text()
        dialog = SymbolSelectionDialog(self, symbol=symbol_path)
        dialog.show()
        if dialog.exec():
            new_symbol_path = dialog.getSymbol()
            self.uiSymbolLineEdit.setText(new_symbol_path)
            self.uiSymbolLineEdit.setToolTip('<img src="{}"/>'.format(new_symbol_path))

    def _modelChangedSlot(self, _index):
        """Auto-select symbol and pre-populate ports when model changes."""
        model = self.uiModelComboBox.currentText()
        # Update symbol to match L2/L3 type
        if model in L3_SWITCH_MODELS:
            self.uiSymbolLineEdit.setText(":/symbols/multilayer_switch.svg")
        else:
            self.uiSymbolLineEdit.setText(":/symbols/ethernet_switch.svg")

        # Pre-populate ports only when there are none yet
        if not self._ports:
            port_count = SWITCH_MODEL_PORT_COUNTS.get(model, 8)
            self.uiPortsTreeWidget.clear()
            self._ports = {}
            for i in range(port_count):
                item = TreeWidgetItem(self.uiPortsTreeWidget)
                item.setText(0, str(i))
                item.setText(1, "1")
                item.setText(2, "access")
                item.setText(3, "")
                self.uiPortsTreeWidget.addTopLevelItem(item)
                self._ports[i] = {
                    "name": "Ethernet{}".format(i),
                    "port_number": i,
                    "type": "access",
                    "vlan": 1,
                    "ethertype": "",
                }
            if self._ports:
                self.uiPortSpinBox.setValue(max(self._ports) + 1)

    def _dhcpToggled(self, enabled):
        """Enable or disable DHCP pool fields."""
        for widget in (self.uiDHCPSubnetLineEdit, self.uiDHCPPoolStartLineEdit,
                       self.uiDHCPPoolEndLineEdit, self.uiDHCPGatewayLineEdit,
                       self.uiDHCPDnsLineEdit):
            widget.setEnabled(enabled)

    def _portSelectedSlot(self, item, _column):
        """Loads a selected port from the tree widget."""
        port = int(item.text(0))
        vlan = int(item.text(1))
        port_type = item.text(2)
        port_ethertype = item.text(3)
        self.uiPortSpinBox.setValue(port)
        self.uiVlanSpinBox.setValue(vlan)
        index = self.uiPortTypeComboBox.findText(port_type)
        if index != -1:
            self.uiPortTypeComboBox.setCurrentIndex(index)
        index = self.uiPortEtherTypeComboBox.findText(port_ethertype)
        if index != -1:
            self.uiPortEtherTypeComboBox.setCurrentIndex(index)
        self.uiPortEtherTypeComboBox.setEnabled(port_type == "qinq")

    def _portSelectionChangedSlot(self):
        item = self.uiPortsTreeWidget.currentItem()
        self.uiDeletePushButton.setEnabled(item is not None)

    def _typeSelectionChangedSlot(self):
        port_type = self.uiPortTypeComboBox.currentText()
        self.uiPortEtherTypeComboBox.setEnabled(port_type == "qinq")

    def _addPortSlot(self):
        port = self.uiPortSpinBox.value()
        vlan = self.uiVlanSpinBox.value()
        port_type = self.uiPortTypeComboBox.currentText()
        port_ethertype = self.uiPortEtherTypeComboBox.currentText() if port_type == "qinq" else ""

        if port in self._ports:
            item = self.uiPortsTreeWidget.findItems(str(port), QtCore.Qt.MatchFlag.MatchFixedString)[0]
            item.setText(1, str(vlan))
            item.setText(2, port_type)
            item.setText(3, port_ethertype)
        else:
            item = TreeWidgetItem(self.uiPortsTreeWidget)
            item.setText(0, str(port))
            item.setText(1, str(vlan))
            item.setText(2, port_type)
            item.setText(3, port_ethertype)
            self.uiPortsTreeWidget.addTopLevelItem(item)

        self._ports[port] = {
            "name": "Ethernet{}".format(port),
            "port_number": port,
            "type": port_type,
            "vlan": vlan,
            "ethertype": port_ethertype,
        }
        self.uiPortSpinBox.setValue(max(self._ports) + 1)
        self.uiPortsTreeWidget.resizeColumnToContents(0)

    def _deletePortSlot(self):
        item = self.uiPortsTreeWidget.currentItem()
        if item:
            port = int(item.text(0))
            if self._node:
                for node_port in self._node.ports():
                    if node_port.portNumber() == port and not node_port.isFree():
                        QtWidgets.QMessageBox.critical(
                            self, self._node.name(),
                            "A link is connected to port {}, please remove it first".format(node_port.name()))
                        return
            del self._ports[port]
            self.uiPortsTreeWidget.takeTopLevelItem(self.uiPortsTreeWidget.indexOfTopLevelItem(item))

        if self._ports:
            self.uiPortSpinBox.setValue(max(self._ports) + 1)
        else:
            self.uiPortSpinBox.setValue(1)

    # ------------------------------------------------------------------ #
    # Load / Save
    # ------------------------------------------------------------------ #

    def loadSettings(self, settings, node=None, group=False):
        """
        Loads the Ethernet switch settings.

        :param settings: the settings (dictionary)
        :param node: Node instance
        :param group: indicates the settings apply to a group
        """

        if not group:
            self.uiNameLineEdit.setText(settings["name"])
        else:
            self.uiNameLineEdit.setEnabled(False)

        self.uiPortsTreeWidget.clear()
        self._ports = {}
        self._node = node

        if not node:
            self.uiNameLabel.setText("Template name:")
            self.uiDefaultNameFormatLineEdit.setText(settings["default_name_format"])
            self.uiSymbolLineEdit.setText(settings["symbol"])
            self.uiSymbolLineEdit.setToolTip('<img src="{}"/>'.format(settings["symbol"]))
            index = self.uiCategoryComboBox.findData(settings["category"])
            if index != -1:
                self.uiCategoryComboBox.setCurrentIndex(index)
        else:
            self.uiDefaultNameFormatLabel.hide()
            self.uiDefaultNameFormatLineEdit.hide()
            self.uiSymbolLabel.hide()
            self.uiSymbolLineEdit.hide()
            self.uiSymbolToolButton.hide()
            self.uiCategoryComboBox.hide()
            self.uiCategoryLabel.hide()

        # Load switch model
        model = settings.get("switch_model", "Generic Switch")
        index = self.uiModelComboBox.findText(model)
        if index != -1:
            self.uiModelComboBox.blockSignals(True)
            self.uiModelComboBox.setCurrentIndex(index)
            self.uiModelComboBox.blockSignals(False)

        # Load DHCP settings
        self.uiDHCPEnabledCheckBox.setChecked(settings.get("dhcp_enabled", False))
        self.uiDHCPSubnetLineEdit.setText(settings.get("dhcp_subnet", "192.168.1.0/24"))
        self.uiDHCPPoolStartLineEdit.setText(settings.get("dhcp_pool_start", "192.168.1.100"))
        self.uiDHCPPoolEndLineEdit.setText(settings.get("dhcp_pool_end", "192.168.1.200"))
        self.uiDHCPGatewayLineEdit.setText(settings.get("dhcp_gateway", "192.168.1.1"))
        self.uiDHCPDnsLineEdit.setText(settings.get("dhcp_dns", "8.8.8.8"))

        # Load port mapping
        for port_info in settings["ports_mapping"]:
            item = TreeWidgetItem(self.uiPortsTreeWidget)
            item.setText(0, str(port_info["port_number"]))
            item.setText(1, str(port_info.get("vlan", 1)))
            item.setText(2, port_info.get("type", "access"))
            item.setText(3, port_info.get("ethertype", ""))
            self.uiPortsTreeWidget.addTopLevelItem(item)
            self._ports[port_info["port_number"]] = port_info

        index = self.uiConsoleTypeComboBox.findText(settings["console_type"])
        if index != -1:
            self.uiConsoleTypeComboBox.setCurrentIndex(index)

        self.uiPortsTreeWidget.resizeColumnToContents(0)
        self.uiPortsTreeWidget.resizeColumnToContents(1)
        if self._ports:
            self.uiPortSpinBox.setValue(max(self._ports) + 1)

    def saveSettings(self, settings, node=None, group=False):
        """
        Saves the Ethernet switch settings.

        :param settings: the settings (dictionary)
        :param node: Node instance
        :param group: indicates the settings apply to a group
        """

        if not group:
            name = self.uiNameLineEdit.text()
            if not name:
                QtWidgets.QMessageBox.critical(self, "Name", "Ethernet switch name cannot be empty!")
            else:
                settings["name"] = name

        if not node:
            default_name_format = self.uiDefaultNameFormatLineEdit.text().strip()
            if '{0}' not in default_name_format and '{id}' not in default_name_format:
                QtWidgets.QMessageBox.critical(self, "Default name format",
                                               "The default name format must contain at least {0} or {id}")
            else:
                settings["default_name_format"] = default_name_format

            settings["symbol"] = self.uiSymbolLineEdit.text()
            settings["category"] = self.uiCategoryComboBox.itemData(self.uiCategoryComboBox.currentIndex())

        # Save switch model
        settings["switch_model"] = self.uiModelComboBox.currentText()

        # Save DHCP settings
        settings["dhcp_enabled"] = self.uiDHCPEnabledCheckBox.isChecked()
        settings["dhcp_subnet"] = self.uiDHCPSubnetLineEdit.text().strip()
        settings["dhcp_pool_start"] = self.uiDHCPPoolStartLineEdit.text().strip()
        settings["dhcp_pool_end"] = self.uiDHCPPoolEndLineEdit.text().strip()
        settings["dhcp_gateway"] = self.uiDHCPGatewayLineEdit.text().strip()
        settings["dhcp_dns"] = self.uiDHCPDnsLineEdit.text().strip()

        settings["console_type"] = self.uiConsoleTypeComboBox.currentText().lower()
        settings["ports_mapping"] = list(self._ports.values())
        return settings
