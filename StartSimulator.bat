@echo off
REM =============================================
REM  Network Simulator - One-Click Launcher
REM  Starts GNS3 Server + GUI automatically
REM =============================================
chcp 65001 >nul 2>&1
title Network Simulator

REM --- Find GNS3 ---
set "GNS3_DIR="
if exist "C:\Program Files\GNS3" set "GNS3_DIR=C:\Program Files\GNS3"
if exist "C:\Program Files (x86)\GNS3" set "GNS3_DIR=C:\Program Files (x86)\GNS3"

if defined GNS3_DIR (
    set "PATH=%GNS3_DIR%;%PATH%"
)

REM --- Find gns3server ---
set "SERVER_EXE="
where gns3server >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('where gns3server') do set "SERVER_EXE=%%i"
)
if not defined SERVER_EXE (
    if exist "%GNS3_DIR%\gns3server.exe" set "SERVER_EXE=%GNS3_DIR%\gns3server.exe"
)

REM --- Start server in background ---
if defined SERVER_EXE (
    echo Starting GNS3 server...
    start /b "" "%SERVER_EXE%" --local --port 3080 >nul 2>&1
    timeout /t 2 /nobreak >nul
) else (
    echo [Warning] GNS3 server not found. Simulations may not work.
    echo Install GNS3 from: https://github.com/GNS3/gns3-gui/releases
    timeout /t 3 /nobreak >nul
)

REM --- Start GUI ---
echo Starting Network Simulator...
set "SCRIPT_DIR=%~dp0"
start "" "%SCRIPT_DIR%NetworkSimulator.exe"

REM --- Wait for GUI to close, then stop server ---
:waitloop
tasklist /fi "imagename eq NetworkSimulator.exe" 2>nul | find /i "NetworkSimulator.exe" >nul
if %errorlevel% equ 0 (
    timeout /t 2 /nobreak >nul
    goto waitloop
)

REM --- Cleanup: stop server ---
taskkill /f /im gns3server.exe >nul 2>&1
exit
