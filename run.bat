@echo off
title Didar Network Simulation Server
echo ===============================================
echo   Didar Network Simulation Lab
echo   Faculty of Information Technologies
echo ===============================================
echo.
echo Starting local development server...
echo.

cd /d "%~dp0"

echo Server will be available at:
echo   http://localhost:4173
echo.
echo Press Ctrl+C to stop the server
echo ===============================================
echo.

start "" "http://localhost:4173"

python -m http.server 4173

pause
