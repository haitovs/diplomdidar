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
Configuration page for VPCS nodes (PC and Server device types).
"""

import os
from gns3.qt import QtWidgets
from gns3.local_server import LocalServer
from gns3.node import Node
from gns3.controller import Controller

from ..ui.vpcs_node_configuration_page_ui import Ui_VPCSNodeConfigPageWidget
from gns3.dialogs.symbol_selection_dialog import SymbolSelectionDialog
from ..settings import DEVICE_TYPES, SERVER_ROLES, ROUTER_ROLES


class VPCSNodeConfigurationPage(QtWidgets.QWidget, Ui_VPCSNodeConfigPageWidget):
    """
    QWidget configuration page for VPCS nodes (PC / Server).
    """

    def __init__(self):

        super().__init__()
        self.setupUi(self)

        self.uiSymbolToolButton.clicked.connect(self._symbolBrowserSlot)
        self.uiScriptFileToolButton.clicked.connect(self._scriptFileBrowserSlot)
        self._default_configs_dir = LocalServer.instance().localServerSettings()["configs_path"]
        if Controller.instance().isRemote():
            self.uiScriptFileToolButton.hide()

        # add the categories
        for name, category in Node.defaultCategories().items():
            self.uiCategoryComboBox.addItem(name, category)

        # ---- Device Type section ----------------------------------------
        self._device_type_label = QtWidgets.QLabel("Device type:", parent=self)
        self.uiDeviceTypeComboBox = QtWidgets.QComboBox(parent=self)
        for dt in DEVICE_TYPES:
            self.uiDeviceTypeComboBox.addItem(dt)
        self.gridLayout.addWidget(self._device_type_label, 6, 0, 1, 2)
        self.gridLayout.addWidget(self.uiDeviceTypeComboBox, 6, 2, 1, 1)
        self.uiDeviceTypeComboBox.currentIndexChanged.connect(self._deviceTypeChangedSlot)

        # Server role (only shown for Server type)
        self._server_role_label = QtWidgets.QLabel("Server role:", parent=self)
        self.uiServerRoleComboBox = QtWidgets.QComboBox(parent=self)
        for role in SERVER_ROLES:
            self.uiServerRoleComboBox.addItem(role)
        self.gridLayout.addWidget(self._server_role_label, 7, 0, 1, 2)
        self.gridLayout.addWidget(self.uiServerRoleComboBox, 7, 2, 1, 1)
        self._server_role_label.hide()
        self.uiServerRoleComboBox.hide()

        # Router role (only shown for Router type)
        self._router_role_label = QtWidgets.QLabel("Router role:", parent=self)
        self.uiRouterRoleComboBox = QtWidgets.QComboBox(parent=self)
        for role in ROUTER_ROLES:
            self.uiRouterRoleComboBox.addItem(role)
        self.gridLayout.addWidget(self._router_role_label, 7, 0, 1, 2)
        self.gridLayout.addWidget(self.uiRouterRoleComboBox, 7, 2, 1, 1)
        self._router_role_label.hide()
        self.uiRouterRoleComboBox.hide()

        # ---- IP Configuration group box ---------------------------------
        self.uiIPGroupBox = QtWidgets.QGroupBox("IP Configuration", parent=self)
        ip_grid = QtWidgets.QGridLayout(self.uiIPGroupBox)

        self.uiUseDHCPCheckBox = QtWidgets.QCheckBox("Use DHCP (auto-assign from connected switch)")
        ip_grid.addWidget(self.uiUseDHCPCheckBox, 0, 0, 1, 2)

        ip_grid.addWidget(QtWidgets.QLabel("IP address:"), 1, 0)
        self.uiIPAddressLineEdit = QtWidgets.QLineEdit()
        self.uiIPAddressLineEdit.setPlaceholderText("e.g. 192.168.1.10")
        ip_grid.addWidget(self.uiIPAddressLineEdit, 1, 1)

        ip_grid.addWidget(QtWidgets.QLabel("Subnet mask:"), 2, 0)
        self.uiSubnetMaskLineEdit = QtWidgets.QLineEdit("255.255.255.0")
        self.uiSubnetMaskLineEdit.setPlaceholderText("e.g. 255.255.255.0")
        ip_grid.addWidget(self.uiSubnetMaskLineEdit, 2, 1)

        ip_grid.addWidget(QtWidgets.QLabel("Default gateway:"), 3, 0)
        self.uiGatewayLineEdit = QtWidgets.QLineEdit()
        self.uiGatewayLineEdit.setPlaceholderText("e.g. 192.168.1.1")
        ip_grid.addWidget(self.uiGatewayLineEdit, 3, 1)

        self.uiUseDHCPCheckBox.toggled.connect(self._dhcpToggled)
        self._dhcpToggled(False)

        # Append IP group below the existing rows
        self.gridLayout.addWidget(self.uiIPGroupBox, 8, 0, 1, 3)

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

    def _scriptFileBrowserSlot(self):
        path, _ = QtWidgets.QFileDialog.getOpenFileName(self, "Select a script file", self._default_configs_dir)
        if not path:
            return
        self._default_configs_dir = os.path.dirname(path)
        if not os.access(path, os.R_OK):
            QtWidgets.QMessageBox.critical(self, "Script file",
                                           "{} cannot be read".format(os.path.basename(path)))
            return
        self.uiScriptFileEdit.setText(os.path.normpath(path))

    def _deviceTypeChangedSlot(self, _index):
        """Show/hide role rows and update default symbol."""
        dt = self.uiDeviceTypeComboBox.currentText()
        is_server = (dt == "Server")
        is_router = (dt == "Router")
        self._server_role_label.setVisible(is_server)
        self.uiServerRoleComboBox.setVisible(is_server)
        self._router_role_label.setVisible(is_router)
        self.uiRouterRoleComboBox.setVisible(is_router)
        # Auto-update symbol line edit if it still holds a device default
        current_sym = self.uiSymbolLineEdit.text()
        _device_defaults = (":/symbols/vpcs_guest.svg", ":/symbols/computer.svg",
                            "server.svg", ":/symbols/router.svg", "")
        if current_sym in _device_defaults:
            if is_server:
                new_sym = "server.svg"
            elif is_router:
                new_sym = ":/symbols/router.svg"
            else:
                new_sym = ":/symbols/vpcs_guest.svg"
            self.uiSymbolLineEdit.setText(new_sym)

    def _dhcpToggled(self, enabled):
        """Enable/disable static IP fields based on DHCP checkbox."""
        for widget in (self.uiIPAddressLineEdit, self.uiSubnetMaskLineEdit, self.uiGatewayLineEdit):
            widget.setEnabled(not enabled)

    # ------------------------------------------------------------------ #
    # Load / Save
    # ------------------------------------------------------------------ #

    def loadSettings(self, settings, node=None, group=False):
        """
        Loads the VPCS node settings.

        :param settings: the settings (dictionary)
        :param node: Node instance
        :param group: indicates the settings apply to a group of nodes
        """

        if not group:
            self.uiNameLineEdit.setText(settings["name"])
        else:
            self.uiNameLabel.hide()
            self.uiNameLineEdit.hide()

        if not node:
            # template mode
            self.uiNameLabel.setText("Template name:")
            self.uiDefaultNameFormatLineEdit.setText(settings["default_name_format"])
            self.uiSymbolLineEdit.setText(settings["symbol"])
            self.uiSymbolLineEdit.setToolTip('<img src="{}"/>'.format(settings["symbol"]))
            index = self.uiCategoryComboBox.findData(settings["category"])
            if index != -1:
                self.uiCategoryComboBox.setCurrentIndex(index)
            self.uiScriptFileEdit.setText(settings.get("base_script_file", ""))
        else:
            # node instance mode — hide template-only fields
            self.uiDefaultNameFormatLabel.hide()
            self.uiDefaultNameFormatLineEdit.hide()
            self.uiSymbolLabel.hide()
            self.uiSymbolLineEdit.hide()
            self.uiSymbolToolButton.hide()
            self.uiCategoryComboBox.hide()
            self.uiCategoryLabel.hide()
            self.uiScriptFileLabel.hide()
            self.uiScriptFileEdit.hide()
            self.uiScriptFileToolButton.hide()

        index = self.uiConsoleTypeComboBox.findText(settings["console_type"])
        if index != -1:
            self.uiConsoleTypeComboBox.setCurrentIndex(index)
        self.uiConsoleAutoStartCheckBox.setChecked(settings.get("console_auto_start", True))

        # Load device type
        device_type = settings.get("device_type", "PC")
        index = self.uiDeviceTypeComboBox.findText(device_type)
        if index != -1:
            self.uiDeviceTypeComboBox.blockSignals(True)
            self.uiDeviceTypeComboBox.setCurrentIndex(index)
            self.uiDeviceTypeComboBox.blockSignals(False)
        is_server = (device_type == "Server")
        is_router = (device_type == "Router")
        self._server_role_label.setVisible(is_server)
        self.uiServerRoleComboBox.setVisible(is_server)
        self._router_role_label.setVisible(is_router)
        self.uiRouterRoleComboBox.setVisible(is_router)

        role = settings.get("server_role", "General Server")
        index = self.uiServerRoleComboBox.findText(role)
        if index != -1:
            self.uiServerRoleComboBox.setCurrentIndex(index)

        router_role = settings.get("router_role", "Gateway Router")
        index = self.uiRouterRoleComboBox.findText(router_role)
        if index != -1:
            self.uiRouterRoleComboBox.setCurrentIndex(index)

        # Load IP configuration
        use_dhcp = settings.get("use_dhcp", False)
        self.uiUseDHCPCheckBox.setChecked(use_dhcp)
        self.uiIPAddressLineEdit.setText(settings.get("ip_address", ""))
        self.uiSubnetMaskLineEdit.setText(settings.get("subnet_mask", "255.255.255.0"))
        self.uiGatewayLineEdit.setText(settings.get("gateway", ""))

    def saveSettings(self, settings, node=None, group=False):
        """
        Saves the VPCS node settings.

        :param settings: the settings (dictionary)
        :param node: Node instance
        :param group: indicates the settings apply to a group of nodes
        """

        if not group:
            name = self.uiNameLineEdit.text()
            if not name:
                QtWidgets.QMessageBox.critical(self, "Name", "VPCS node name cannot be empty!")
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

            base_script_file = self.uiScriptFileEdit.text().strip()
            if not base_script_file:
                settings["base_script_file"] = ""
            elif base_script_file != settings.get("base_script_file", ""):
                if self._configFileValid(base_script_file):
                    settings["base_script_file"] = base_script_file
                else:
                    QtWidgets.QMessageBox.critical(self, "Base script config file",
                                                   "Cannot read the base script config file")

        settings["console_type"] = self.uiConsoleTypeComboBox.currentText().lower()
        settings["console_auto_start"] = self.uiConsoleAutoStartCheckBox.isChecked()

        # Save device identity
        settings["device_type"] = self.uiDeviceTypeComboBox.currentText()
        settings["server_role"] = self.uiServerRoleComboBox.currentText()
        settings["router_role"] = self.uiRouterRoleComboBox.currentText()

        # Save IP configuration
        settings["use_dhcp"] = self.uiUseDHCPCheckBox.isChecked()
        settings["ip_address"] = self.uiIPAddressLineEdit.text().strip()
        settings["subnet_mask"] = self.uiSubnetMaskLineEdit.text().strip()
        settings["gateway"] = self.uiGatewayLineEdit.text().strip()

        # Auto-generate startup_script from IP settings when node is being configured
        if node is not None:
            node.settings().update({
                "device_type": settings["device_type"],
                "server_role": settings["server_role"],
                "use_dhcp": settings["use_dhcp"],
                "ip_address": settings["ip_address"],
                "subnet_mask": settings["subnet_mask"],
                "gateway": settings["gateway"],
            })
            script = node.buildStartupScript()
            if script:
                settings["startup_script"] = script

        return settings

    def _configFileValid(self, path):
        if not os.path.isabs(path):
            path = os.path.join(LocalServer.instance().localServerSettings()["configs_path"], path)
        return os.access(path, os.R_OK)
