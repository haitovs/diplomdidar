#!/bin/bash
# =============================================
#  Package Network Simulator for distribution
#  Creates ready-to-share zip files
# =============================================

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"
DIST_DIR="$PROJECT_DIR/dist"
PACKAGE_DIR="$DIST_DIR/package"

echo ""
echo "============================================"
echo "  Packaging Network Simulator"
echo "============================================"
echo ""

# --- Package macOS ---
if [ -d "$DIST_DIR/NetworkSimulator.app" ]; then
    echo "[..] Packaging macOS version..."
    MAC_PKG="$PACKAGE_DIR/NetworkSimulator-macOS"
    rm -rf "$MAC_PKG"
    mkdir -p "$MAC_PKG"

    cp -R "$DIST_DIR/NetworkSimulator.app" "$MAC_PKG/"
    cp -R examples "$MAC_PKG/"
    cp INSTALL_MACOS.md "$MAC_PKG/README.md"

    cd "$PACKAGE_DIR"
    zip -r -q "NetworkSimulator-macOS.zip" "NetworkSimulator-macOS"
    echo "[OK] Created: dist/package/NetworkSimulator-macOS.zip"
    cd "$PROJECT_DIR"
else
    echo "[--] No macOS build found (run ./build_mac.sh first)"
fi

# --- Package Windows files (without .exe — must be built on Windows) ---
echo "[..] Packaging Windows support files..."
WIN_PKG="$PACKAGE_DIR/NetworkSimulator-Windows"
rm -rf "$WIN_PKG"
mkdir -p "$WIN_PKG"

cp -R examples "$WIN_PKG/"
cp -R branding "$WIN_PKG/"
cp -R resources "$WIN_PKG/"
cp build_windows.bat "$WIN_PKG/"
cp build_windows.spec "$WIN_PKG/"
cp BUILD.bat "$WIN_PKG/"
cp launcher.py "$WIN_PKG/"
cp patch_gns3server.py "$WIN_PKG/"
cp INSTALL_WINDOWS.md "$WIN_PKG/README.md"
cp setup.py "$WIN_PKG/"
cp requirements.txt "$WIN_PKG/"
cp win-requirements.txt "$WIN_PKG/"

# Copy bundled Windows binaries (VPCS + cygwin1.dll)
cp -R bundled_bin "$WIN_PKG/"

# Copy the gns3 source (needed for Windows build)
cp -R gns3 "$WIN_PKG/"

cd "$PACKAGE_DIR"
zip -r -q "NetworkSimulator-Windows-Source.zip" "NetworkSimulator-Windows"
echo "[OK] Created: dist/package/NetworkSimulator-Windows-Source.zip"
cd "$PROJECT_DIR"

echo ""
echo "============================================"
echo "  Packaging Complete!"
echo "============================================"
echo ""
echo "Files ready for distribution:"
ls -lh "$PACKAGE_DIR"/*.zip 2>/dev/null
echo ""
echo "macOS: Share the zip — user extracts and runs .app"
echo "Windows: Copy zip to Windows, run build_windows.bat,"
echo "         then share the dist/NetworkSimulator/ folder"
echo ""
