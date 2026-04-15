# -*- mode: python ; coding: utf-8 -*-
# PyInstaller spec file for building Windows .exe
# Run on Windows: pyinstaller build_windows.spec

import os

block_cipher = None
project_dir = os.path.abspath('.')

a = Analysis(
    ['launcher.py'],
    pathex=[project_dir],
    binaries=[],
    datas=[
        ('resources', 'resources'),
        ('branding', 'branding'),
        ('examples', 'examples'),
    ],
    hiddenimports=[
        'gns3',
        'gns3.main_window',
        'gns3.guide_dialog',
        'gns3.translator',
        'gns3.qt',
        'gns3.settings',
        'gns3.local_config',
        'gns3.local_server',
        'gns3.local_server_config',
        'gns3.project',
        'gns3.node',
        'gns3.topology',
        'gns3.version',
        'gns3.utils',
        'gns3.utils.get_icon',
        'gns3.dialogs',
        'gns3.items',
        'gns3.items.node_item',
        'gns3.items.link_item',
        'gns3.items.logo_item',
        'gns3.symbol',
        'PyQt6',
        'PyQt6.QtCore',
        'PyQt6.QtGui',
        'PyQt6.QtWidgets',
        'PyQt6.QtSvg',
        'PyQt6.QtSvgWidgets',
        'PyQt6.QtNetwork',
        'PyQt6.QtWebSockets',
        'jsonschema',
        'psutil',
        'distro',
        'sentry_sdk',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['tkinter', 'matplotlib', 'numpy', 'scipy', 'pandas'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='NetworkSimulator',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,  # No console window
    disable_windowed_traceback=False,
    argv_emulation=False,
    icon='branding/logo.ico',
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='NetworkSimulator',
)
