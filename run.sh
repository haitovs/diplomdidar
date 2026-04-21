#!/bin/bash
# GNS3 - Run Script
# Starts GNS3 server + GUI in one command

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="$PROJECT_DIR/.venv"

# Check if setup has been run
if [ ! -d "$VENV_DIR" ]; then
    echo "[!] Virtual environment not found. Running setup first..."
    bash "$PROJECT_DIR/setup.sh"
fi

# Kill any orphan simulator processes holding UDP ports (prevents "UDP ports still in use" errors)
pkill -9 -f "vpcs -p" 2>/dev/null
pkill -9 -f "dynamips" 2>/dev/null
pkill -9 -f "ubridge" 2>/dev/null
sleep 1

# Activate venv
source "$VENV_DIR/bin/activate"

# Apply gns3server schema patch (allows startup_script in VPCS updates)
python3 "$PROJECT_DIR/patch_gns3server.py" 2>/dev/null || true

# Ensure the telnet console command works (Mac default is fragile)
python3 - <<'PYEOF'
import json, os, sys
if sys.platform != 'darwin':
    raise SystemExit(0)
config_file = os.path.expanduser('~/.config/GNS3/2.2/gns3_gui.conf')
os.makedirs(os.path.dirname(config_file), exist_ok=True)
config = {}
if os.path.exists(config_file):
    try:
        with open(config_file) as f:
            config = json.load(f)
    except Exception:
        config = {}
config.setdefault('version', '2.2.0')
config.setdefault('type', 'settings')
config.setdefault('MainWindow', {})
config['MainWindow']['telnet_console_command'] = (
    'osascript -e \'tell application "Terminal" to do script "telnet 127.0.0.1 {port}"\' '
    '-e \'tell application "Terminal" to activate\''
)
with open(config_file, 'w') as f:
    json.dump(config, f, indent=4)
PYEOF

# Start GNS3 server in the background
echo "Starting GNS3 server..."
gns3server --local --port 3080 &
SERVER_PID=$!

# Give server a moment to start
sleep 2

# Start GNS3 GUI
echo "Starting GNS3 GUI..."
python -m gns3.main "$@"

# When GUI closes, stop the server
echo "Shutting down GNS3 server..."
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null
echo "Done."
