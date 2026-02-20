#!/bin/bash
set -euo pipefail

PORT="${PORT:-4040}"
BASE_URL="http://localhost:${PORT}/"

open_browser() {
    local url="$1"

    if [[ "${NO_OPEN:-0}" == "1" ]]; then
        echo "Auto-open disabled (NO_OPEN=1)."
        return 0
    fi

    if command -v open >/dev/null 2>&1; then
        (sleep 1; open "$url" >/dev/null 2>&1) &
        echo "Opening browser: $url"
        return 0
    fi

    if command -v xdg-open >/dev/null 2>&1; then
        (sleep 1; xdg-open "$url" >/dev/null 2>&1) &
        echo "Opening browser: $url"
        return 0
    fi

    echo "Could not auto-open browser. Open manually: $url"
}

echo "========================================"
echo " Network Training Simulator Lab (React)"
echo "========================================"
echo ""
echo "Starting React dev server on port ${PORT}..."
echo ""
echo "Routes:"
echo "- Home:        ${BASE_URL}"
echo "- Playground:  ${BASE_URL}playground"
echo "- Simulation:  ${BASE_URL}simulation"
echo "- Analytics:   ${BASE_URL}analytics"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

open_browser "${BASE_URL}"

if ! command -v npm >/dev/null 2>&1; then
    echo "npm is required to run the React app."
    exit 1
fi

cd web

if [[ ! -d node_modules ]]; then
    echo "Installing dependencies..."
    npm install
fi

npm run dev -- --host 0.0.0.0 --port "${PORT}" --strictPort
