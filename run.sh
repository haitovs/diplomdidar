#!/bin/bash
set -euo pipefail

PORT="${PORT:-4173}"
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
echo " Network Training Simulator Lab"
echo "========================================"
echo ""
echo "Starting local server on port ${PORT}..."
echo ""
echo "Available pages:"
echo "- Home Page:    ${BASE_URL}"
echo "- Demo:         ${BASE_URL}demo-v2.html"
echo "- Playground:   ${BASE_URL}playground-v2.html"
echo "- Simulation:   ${BASE_URL}simulation.html"
echo "- Analytics:    ${BASE_URL}analytics.html"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

open_browser "${BASE_URL}"

# Try Python 3 http.server
if command -v python3 &> /dev/null; then
    echo "Starting with Python 3..."
    python3 -m http.server "${PORT}"
else
    # Fallback to npx serve
    echo "Python 3 not found, trying npx serve..."
    npx serve . -p "${PORT}"
fi
