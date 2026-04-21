@echo off
REM =============================================
REM  Network Simulator - COMPLETE BUILD
REM  Installs Python + Builds Everything
REM  Just double-click this file!
REM =============================================
chcp 65001 >nul 2>&1
title Network Simulator - Building...

echo.
echo  ============================================
echo   Network Simulator - Complete Builder
echo   Oguz Han University
echo  ============================================
echo.
echo  This will:
echo    1. Install Python (if needed)
echo    2. Build the standalone application
echo    3. Create a ready-to-share folder
echo.
echo  Press any key to start...
pause >nul

REM --- Check if Python is already installed ---
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo  [OK] Python is already installed
    goto :build
)

REM --- Install Python silently ---
echo.
echo  [..] Installing Python 3.12...
echo      (This may take 1-2 minutes)

set "PYTHON_INSTALLER=%~dp0bundled_bin\windows\python-3.12.9-amd64.exe"

if not exist "%PYTHON_INSTALLER%" (
    echo  [ERROR] Python installer not found at:
    echo          %PYTHON_INSTALLER%
    echo.
    echo  Please download Python from python.org and install manually.
    pause
    exit /b 1
)

REM Install Python silently with pip and PATH
"%PYTHON_INSTALLER%" /quiet InstallAllUsers=0 PrependPath=1 Include_pip=1 Include_test=0

REM Refresh PATH
set "PATH=%LOCALAPPDATA%\Programs\Python\Python312\;%LOCALAPPDATA%\Programs\Python\Python312\Scripts\;%PATH%"

REM Verify
python --version >nul 2>&1
if errorlevel 1 (
    echo  [!!] Python installed but not in PATH yet.
    echo      Please close this window and run BUILD.bat again.
    pause
    exit /b 1
)

echo  [OK] Python installed successfully

:build
echo.
echo  [..] Setting up build environment...

set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"

REM Create build venv
if not exist ".build_venv" (
    echo  [..] Creating virtual environment...
    python -m venv .build_venv
)

call .build_venv\Scripts\activate.bat

REM Install dependencies
echo  [..] Installing dependencies (3-5 minutes)...
pip install --upgrade pip --quiet 2>nul
pip install PyQt6==6.10.1 --quiet 2>nul
pip install pyinstaller --quiet 2>nul
pip install jsonschema psutil distro sentry-sdk pillow --quiet 2>nul
pip install pywin32==311 --quiet 2>nul
pip install gns3-server --quiet 2>nul
pip install aiohttp aiofiles jinja2 sqlalchemy alembic --quiet 2>nul
pip install -e . --quiet 2>nul

echo  [OK] Dependencies installed

REM --- Patch gns3server schema (allows startup_script in VPCS updates) ---
echo  [..] Patching gns3server...
python patch_gns3server.py 2>nul

REM --- Prepare bundled binaries ---
if not exist "build_bin" mkdir build_bin
copy "bundled_bin\windows\vpcs.exe" "build_bin\vpcs.exe" >nul
copy "bundled_bin\windows\cygwin1.dll" "build_bin\cygwin1.dll" >nul
copy "bundled_bin\windows\putty.exe" "build_bin\putty.exe" >nul
echo  [OK] VPCS and PuTTY binaries ready

REM --- Build with PyInstaller ---
echo.
echo  [..] Building application (3-5 minutes)...
echo.

pyinstaller ^
    --name "NetworkSimulator" ^
    --noconsole ^
    --icon branding/logo.ico ^
    --add-data "resources;resources" ^
    --add-data "branding;branding" ^
    --add-data "examples;examples" ^
    --add-binary "build_bin\vpcs.exe;bin" ^
    --add-binary "build_bin\cygwin1.dll;bin" ^
    --add-binary "build_bin\putty.exe;bin" ^
    --hidden-import gns3 ^
    --hidden-import gns3.main_window ^
    --hidden-import gns3.guide_dialog ^
    --hidden-import gns3.translator ^
    --hidden-import gns3.qt ^
    --hidden-import PyQt6.QtSvg ^
    --hidden-import PyQt6.QtSvgWidgets ^
    --hidden-import PyQt6.QtNetwork ^
    --hidden-import PyQt6.QtWebSockets ^
    --hidden-import jsonschema ^
    --hidden-import psutil ^
    --hidden-import distro ^
    --hidden-import sentry_sdk ^
    --hidden-import gns3server ^
    --hidden-import gns3server.main ^
    --hidden-import gns3server.controller ^
    --hidden-import gns3server.compute ^
    --hidden-import gns3server.compute.vpcs ^
    --hidden-import aiohttp ^
    --hidden-import aiohttp.web ^
    --hidden-import aiofiles ^
    --hidden-import multidict ^
    --hidden-import yarl ^
    --hidden-import async_timeout ^
    --hidden-import jinja2 ^
    --hidden-import sqlalchemy ^
    --hidden-import alembic ^
    --collect-all gns3server ^
    --exclude-module tkinter ^
    --exclude-module matplotlib ^
    --exclude-module numpy ^
    --noconfirm ^
    launcher.py

REM Cleanup
rd /s /q build_bin 2>nul

echo.
if exist "dist\NetworkSimulator\NetworkSimulator.exe" (
    echo  ============================================
    echo   BUILD SUCCESSFUL!
    echo  ============================================
    echo.
    echo   The application is ready at:
    echo     dist\NetworkSimulator\NetworkSimulator.exe
    echo.
    echo   To share with others:
    echo     1. Zip the "dist\NetworkSimulator" folder
    echo     2. Send the zip to anyone
    echo     3. They extract and double-click NetworkSimulator.exe
    echo     4. NO installation needed!
    echo.
    echo   Opening the folder now...
    explorer "dist\NetworkSimulator"
) else (
    echo  [ERROR] Build failed. Check the output above.
)

call .build_venv\Scripts\deactivate.bat 2>nul
echo.
pause
