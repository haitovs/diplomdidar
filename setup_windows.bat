@echo off
REM =============================================
REM  Network Simulator - Windows Setup
REM  Configures GNS3 server + VPCS paths
REM =============================================
chcp 65001 >nul 2>&1
title Network Simulator - Setup

echo.
echo  ============================================
echo    Network Simulator - Windows Setup
echo    Oguz Han University
echo  ============================================
echo.

REM --- Check for GNS3 installation ---
set "GNS3_DIR="
if exist "C:\Program Files\GNS3" set "GNS3_DIR=C:\Program Files\GNS3"
if exist "C:\Program Files (x86)\GNS3" set "GNS3_DIR=C:\Program Files (x86)\GNS3"

if defined GNS3_DIR (
    echo  [OK] GNS3 found at: %GNS3_DIR%
) else (
    echo  [!!] GNS3 not found!
    echo.
    echo  Please install GNS3 first:
    echo  https://github.com/GNS3/gns3-gui/releases
    echo.
    echo  Download: GNS3-2.2.49-all-in-one.exe
    echo  Install with: GNS3 Server + VPCS + WinPCAP
    echo.
    pause
    exit /b 1
)

REM --- Check for gns3server ---
set "SERVER_PATH="
if exist "%GNS3_DIR%\gns3server.exe" set "SERVER_PATH=%GNS3_DIR%\gns3server.exe"
where gns3server >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('where gns3server') do set "SERVER_PATH=%%i"
)

if defined SERVER_PATH (
    echo  [OK] GNS3 Server: %SERVER_PATH%
) else (
    echo  [!!] gns3server.exe not found
    echo  Make sure GNS3 Server was selected during installation.
    pause
    exit /b 1
)

REM --- Check for VPCS ---
set "VPCS_PATH="
if exist "%GNS3_DIR%\vpcs.exe" set "VPCS_PATH=%GNS3_DIR%\vpcs.exe"
where vpcs >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('where vpcs') do set "VPCS_PATH=%%i"
)

if defined VPCS_PATH (
    echo  [OK] VPCS: %VPCS_PATH%
) else (
    echo  [!!] vpcs.exe not found
    echo  Make sure VPCS was selected during GNS3 installation.
    pause
    exit /b 1
)

REM --- Check for uBridge ---
set "UBRIDGE_PATH="
if exist "%GNS3_DIR%\ubridge.exe" set "UBRIDGE_PATH=%GNS3_DIR%\ubridge.exe"
if defined UBRIDGE_PATH (
    echo  [OK] uBridge: %UBRIDGE_PATH%
) else (
    echo  [--] uBridge: not found (optional, basic cases work without it)
)

REM --- Add GNS3 to PATH for this session ---
set "PATH=%GNS3_DIR%;%PATH%"

REM --- Install example projects ---
set "PROJECTS_DIR=%USERPROFILE%\GNS3\projects"
if not exist "%PROJECTS_DIR%" mkdir "%PROJECTS_DIR%"

echo.
echo  [..] Installing example projects...
set "SCRIPT_DIR=%~dp0"

for %%f in ("%SCRIPT_DIR%examples\*.gns3") do (
    for /f "tokens=1 delims=_" %%n in ("%%~nf") do (
        REM Just copy to projects dir with proper name
    )
    echo     Copied: %%~nf
    copy "%%f" "%PROJECTS_DIR%\" >nul 2>&1
)

echo  [OK] Examples installed to %PROJECTS_DIR%

REM --- Check Telnet ---
where telnet >nul 2>&1
if %errorlevel% equ 0 (
    echo  [OK] Telnet client available
) else (
    echo  [!!] Telnet client not enabled!
    echo      To enable: Settings ^> Apps ^> Optional Features ^> Add "Telnet Client"
    echo      (Required for PC consoles)
)

echo.
echo  ============================================
echo    Setup Complete!
echo  ============================================
echo.
echo  To start: double-click NetworkSimulator.exe
echo.
echo  Or run from command line:
echo    start "" "%SERVER_PATH%" --local --port 3080
echo    NetworkSimulator.exe
echo.
pause
