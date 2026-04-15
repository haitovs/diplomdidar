# -*- mode: python ; coding: utf-8 -*-
from PyInstaller.utils.hooks import collect_all

datas = [('resources', 'resources'), ('branding', 'branding'), ('examples', 'examples')]
binaries = [('build_bin/vpcs', 'bin'), ('build_bin/ubridge', 'bin')]
hiddenimports = ['gns3', 'gns3.main_window', 'gns3.guide_dialog', 'gns3.translator', 'gns3.qt', 'PyQt6.QtSvg', 'PyQt6.QtSvgWidgets', 'PyQt6.QtNetwork', 'PyQt6.QtWebSockets', 'jsonschema', 'psutil', 'distro', 'sentry_sdk', 'gns3server', 'gns3server.main', 'gns3server.web', 'gns3server.controller', 'gns3server.compute', 'gns3server.compute.vpcs', 'gns3server.compute.ethernet_switch', 'gns3server.compute.ethernet_hub', 'aiohttp', 'aiohttp.web', 'aiofiles', 'multidict', 'yarl', 'async_timeout', 'aiohttp_cors', 'jinja2', 'py_cpuinfo', 'sqlalchemy', 'alembic']
tmp_ret = collect_all('gns3server')
datas += tmp_ret[0]; binaries += tmp_ret[1]; hiddenimports += tmp_ret[2]


a = Analysis(
    ['launcher.py'],
    pathex=[],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['tkinter', 'matplotlib', 'numpy'],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

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
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=['branding/logo.ico'],
)
coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='NetworkSimulator',
)
app = BUNDLE(
    coll,
    name='NetworkSimulator.app',
    icon='branding/logo.ico',
    bundle_identifier=None,
)
