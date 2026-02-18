#!/bin/bash
echo "========================================"
echo " Network Training Simulator Lab"
echo "========================================"
echo ""
echo "Starting local server on port 4173..."
echo ""
echo "Available pages:"
echo "- Home Page:    http://localhost:4173/"
echo "- Demo:         http://localhost:4173/demo-v2.html"
echo "- Playground:   http://localhost:4173/playground-v2.html"
echo "- Simulation:   http://localhost:4173/simulation.html"
echo "- Analytics:    http://localhost:4173/analytics.html"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Try Python 3 http.server
if command -v python3 &> /dev/null; then
    echo "Starting with Python 3..."
    python3 -m http.server 4173
else
    # Fallback to npx serve
    echo "Python 3 not found, trying npx serve..."
    npx serve . -p 4173
fi
