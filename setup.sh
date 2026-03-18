#!/bin/bash
# GNS3 GUI - Project Setup Script
# Run this once to set up the environment

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="$PROJECT_DIR/.venv"

echo "============================================"
echo "  GNS3 GUI - Project Setup"
echo "============================================"
echo ""

# Check Python version
PYTHON=""
for cmd in python3.12 python3.11 python3.10 python3.9 python3; do
    if command -v "$cmd" &> /dev/null; then
        version=$("$cmd" -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
        major=$("$cmd" -c "import sys; print(sys.version_info.major)")
        minor=$("$cmd" -c "import sys; print(sys.version_info.minor)")
        if [ "$major" -ge 3 ] && [ "$minor" -ge 9 ]; then
            PYTHON="$cmd"
            echo "[OK] Found Python $version ($cmd)"
            break
        fi
    fi
done

if [ -z "$PYTHON" ]; then
    echo "[ERROR] Python 3.9+ is required but not found."
    echo "Install it with: brew install python@3.12"
    exit 1
fi

# Create virtual environment
if [ -d "$VENV_DIR" ]; then
    echo "[OK] Virtual environment already exists at $VENV_DIR"
else
    echo "[..] Creating virtual environment..."
    "$PYTHON" -m venv "$VENV_DIR"
    echo "[OK] Virtual environment created"
fi

# Activate venv
source "$VENV_DIR/bin/activate"

# Upgrade pip
echo "[..] Upgrading pip..."
pip install --upgrade pip --quiet

# Install PyQt6 (the GUI framework)
echo "[..] Installing PyQt6..."
pip install PyQt6 2>&1

# Install GNS3 server (backend required by the GUI)
echo "[..] Installing GNS3 server..."
pip install gns3-server 2>&1

# Install project requirements
echo "[..] Installing project requirements..."
pip install -r "$PROJECT_DIR/requirements.txt" 2>&1

# Install project in development mode
echo "[..] Installing GNS3 GUI in development mode..."
pip install -e "$PROJECT_DIR" 2>&1

echo ""
echo "============================================"
echo "  Setup Complete!"
echo "============================================"
echo ""
echo "To run the project:"
echo "  ./run.sh"
echo ""
echo "Or manually:"
echo "  source .venv/bin/activate"
echo "  python -m gns3.main"
echo ""
