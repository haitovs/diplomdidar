@echo off
echo ========================================
echo  Didar Network Simulation Lab
echo ========================================
echo.
echo Starting local server on port 4173...
echo.
echo Available pages:
echo - Home Page:    http://localhost:4173/
echo - Demo:         http://localhost:4173/demo-v2.html
echo - Playground:   http://localhost:4173/playground-v2.html
echo - Simulation:   http://localhost:4173/simulation.html
echo - Analytics:    http://localhost:4173/analytics.html
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start Python HTTP server
python -m http.server 4173

REM If Python is not available, try Node.js serve
if errorlevel 1 (
    echo.
    echo Python not found, trying npx serve...
    npx serve . -p 4173
)

pause
