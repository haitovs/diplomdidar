@echo off
REM =============================================
REM  Network Simulator - Windows Build Script
REM  Builds FULLY STANDALONE exe
REM  Everything included - NO installation needed!
REM =============================================
chcp 65001 >nul 2>&1

echo.
echo ============================================
echo   Network Simulator - Windows Builder
echo   (Fully Standalone - No Install Needed)
echo ============================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed.
    echo Download from: https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during install!
    pause
    exit /b 1
)

REM Create build venv
if not exist ".build_venv" (
    echo [..] Creating build environment...
    python -m venv .build_venv
)

call .build_venv\Scripts\activate.bat

REM Install ALL dependencies
echo [..] Installing dependencies (this may take a few minutes)...
pip install --upgrade pip --quiet
pip install PyQt6==6.10.1 --quiet
pip install pyinstaller --quiet
pip install jsonschema psutil distro sentry-sdk pillow --quiet
pip install pywin32==311 --quiet
pip install gns3-server --quiet
pip install aiohttp aiofiles jinja2 sqlalchemy alembic --quiet
pip install -e . --quiet 2>nul

REM --- Use bundled VPCS ---
echo [OK] Using bundled VPCS (included in package)
if not exist "build_bin" mkdir build_bin
copy "bundled_bin\windows\vpcs.exe" "build_bin\vpcs.exe" >nul
copy "bundled_bin\windows\cygwin1.dll" "build_bin\cygwin1.dll" >nul
copy "bundled_bin\windows\putty.exe" "build_bin\putty.exe" >nul

REM --- Build ---
echo.
echo [..] Building standalone executable...
echo     This may take 3-5 minutes...
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
    echo ============================================
    echo   BUILD SUCCESSFUL!
    echo ============================================
    echo.
    echo   Output: dist\NetworkSimulator\
    echo   Run:    dist\NetworkSimulator\NetworkSimulator.exe
    echo.
    echo   FULLY STANDALONE - share the folder,
    echo   users just extract and double-click!
    echo   No Python, no GNS3, no installation needed!
) else (
    echo [ERROR] Build failed. Check the output above.
)

call .build_venv\Scripts\deactivate.bat 2>nul
pause
