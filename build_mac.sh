#!/bin/bash
# =============================================
#  Network Simulator - macOS Build Script
#  Builds a FULLY STANDALONE .app
#  Includes: GUI + GNS3 Server + VPCS
# =============================================

set -e

echo ""
echo "============================================"
echo "  Network Simulator - macOS Builder"
echo "  (Fully Standalone - No Install Needed)"
echo "============================================"
echo ""

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# Check Python
PYTHON=""
for cmd in python3.12 python3.11 python3.10 python3.13 python3; do
    if command -v "$cmd" &> /dev/null; then
        PYTHON="$cmd"
        break
    fi
done

if [ -z "$PYTHON" ]; then
    echo "[ERROR] Python 3.9+ not found."
    exit 1
fi

echo "[OK] Using $PYTHON"

# Create build venv
if [ ! -d ".build_venv" ]; then
    echo "[..] Creating build environment..."
    "$PYTHON" -m venv .build_venv
fi

source .build_venv/bin/activate

# Install deps
echo "[..] Installing dependencies..."
pip install --upgrade pip --quiet
pip install PyQt6 --quiet
pip install pyinstaller --quiet
pip install jsonschema psutil distro sentry-sdk pillow --quiet
pip install gns3-server --quiet
pip install -e . --quiet 2>/dev/null || true

# Find VPCS binary
VPCS_PATH=$(which vpcs 2>/dev/null || echo "")
VPCS_ARGS=""
if [ -n "$VPCS_PATH" ]; then
    echo "[OK] Found VPCS at: $VPCS_PATH"
    # Create bin directory with vpcs
    mkdir -p "$PROJECT_DIR/build_bin"
    cp "$VPCS_PATH" "$PROJECT_DIR/build_bin/vpcs"
    chmod +x "$PROJECT_DIR/build_bin/vpcs"
    VPCS_ARGS="--add-binary build_bin/vpcs:bin"
else
    echo "[!!] VPCS not found (install with: brew install vpcs)"
    echo "     Building without VPCS - consoles won't work"
fi

# Find ubridge binary
UBRIDGE_PATH=$(which ubridge 2>/dev/null || echo "")
UBRIDGE_ARGS=""
if [ -n "$UBRIDGE_PATH" ]; then
    echo "[OK] Found uBridge at: $UBRIDGE_PATH"
    cp "$UBRIDGE_PATH" "$PROJECT_DIR/build_bin/ubridge" 2>/dev/null || true
    chmod +x "$PROJECT_DIR/build_bin/ubridge" 2>/dev/null || true
    UBRIDGE_ARGS="--add-binary build_bin/ubridge:bin"
else
    echo "[--] uBridge not found (optional)"
fi

# Build
echo "[..] Building standalone application..."
pyinstaller \
    --name "NetworkSimulator" \
    --windowed \
    --icon branding/logo.ico \
    --add-data "resources:resources" \
    --add-data "branding:branding" \
    --add-data "examples:examples" \
    $VPCS_ARGS \
    $UBRIDGE_ARGS \
    --hidden-import gns3 \
    --hidden-import gns3.main_window \
    --hidden-import gns3.guide_dialog \
    --hidden-import gns3.translator \
    --hidden-import gns3.qt \
    --hidden-import PyQt6.QtSvg \
    --hidden-import PyQt6.QtSvgWidgets \
    --hidden-import PyQt6.QtNetwork \
    --hidden-import PyQt6.QtWebSockets \
    --hidden-import jsonschema \
    --hidden-import psutil \
    --hidden-import distro \
    --hidden-import sentry_sdk \
    --hidden-import gns3server \
    --hidden-import gns3server.main \
    --hidden-import gns3server.web \
    --hidden-import gns3server.controller \
    --hidden-import gns3server.compute \
    --hidden-import gns3server.compute.vpcs \
    --hidden-import gns3server.compute.ethernet_switch \
    --hidden-import gns3server.compute.ethernet_hub \
    --hidden-import aiohttp \
    --hidden-import aiohttp.web \
    --hidden-import aiofiles \
    --hidden-import multidict \
    --hidden-import yarl \
    --hidden-import async_timeout \
    --hidden-import aiohttp_cors \
    --hidden-import jinja2 \
    --hidden-import py_cpuinfo \
    --hidden-import sqlalchemy \
    --hidden-import alembic \
    --collect-all gns3server \
    --exclude-module tkinter \
    --exclude-module matplotlib \
    --exclude-module numpy \
    --noconfirm \
    launcher.py

# Cleanup
rm -rf "$PROJECT_DIR/build_bin" 2>/dev/null

echo ""
if [ -d "dist/NetworkSimulator.app" ] || [ -d "dist/NetworkSimulator" ]; then
    echo "============================================"
    echo "  BUILD SUCCESSFUL!"
    echo "============================================"
    echo ""
    du -sh dist/NetworkSimulator.app 2>/dev/null || du -sh dist/NetworkSimulator
    echo ""
    echo "This is FULLY STANDALONE - no installation needed!"
    echo "Just share the .app and it works."
else
    echo "[ERROR] Build failed."
fi

deactivate 2>/dev/null
