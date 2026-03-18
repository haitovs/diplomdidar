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

# Activate venv
source "$VENV_DIR/bin/activate"

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
