#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${ROOT_DIR}/web"

PORT="${PORT:-4040}"
HOST="${HOST:-0.0.0.0}"
BASE_URL="http://localhost:${PORT}/"

print_banner() {
    echo "========================================"
    echo " Network Training Simulator Lab (React)"
    echo "========================================"
    echo ""
    echo "Starting React dev server on ${HOST}:${PORT}..."
    echo ""
    echo "Routes:"
    echo "- Home:        ${BASE_URL}"
    echo "- Playground:  ${BASE_URL}playground"
    echo "- Simulation:  ${BASE_URL}simulation"
    echo "- Analytics:   ${BASE_URL}analytics"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
}

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

ensure_dependencies() {
    if [[ "${SKIP_INSTALL:-0}" == "1" ]]; then
        return 0
    fi

    if [[ -d node_modules ]]; then
        return 0
    fi

    echo "Installing web dependencies..."
    if [[ -f package-lock.json ]]; then
        npm ci --no-audit --no-fund
    else
        npm install --no-audit --no-fund
    fi
}

if ! command -v npm >/dev/null 2>&1; then
    echo "Error: npm is required to run the React app."
    exit 1
fi

if [[ ! -d "${APP_DIR}" ]]; then
    echo "Error: web app directory not found: ${APP_DIR}"
    exit 1
fi

cd "${APP_DIR}"

print_banner
open_browser "${BASE_URL}"
ensure_dependencies

npm run dev -- --host "${HOST}" --port "${PORT}" --strictPort
