@echo off
setlocal enabledelayedexpansion

echo ============================================================
echo   STOCKTRACK - DEPENDECY INSTALLATION TOOL
echo ============================================================
echo.

:: Check for Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 20+ from https://nodejs.org/
    pause
    exit /b 1
) else (
    for /f "tokens=v" %%v in ('node -v') do set node_ver=%%v
    echo [SUCCESS] Found Node.js !node_ver!
)

:: Check for Python
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python is not installed. Please install Python 3.10+ from https://python.org/
    pause
    exit /b 1
) else (
    for /f "tokens= " %%v in ('python --version') do set py_ver=%%v %%w
    echo [SUCCESS] Found !py_ver!
)

:: Check for Chrome (Required for Bot)
if not exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    echo [WARNING] Google Chrome not found at default path. 
    echo           The Twitter Bot requires Chrome to be installed.
) else (
    echo [SUCCESS] Found Google Chrome.
)

echo.
echo ------------------------------------------------------------
echo 1. Installing Python Dependencies...
echo ------------------------------------------------------------
if exist "requirements.txt" (
    echo [PROGRESS] Running pip install...
    python -m pip install --upgrade pip >nul 2>nul
    python -m pip install -r requirements.txt
    if !ERRORLEVEL! neq 0 (
        echo [WARNING] Some Python dependencies failed to install.
    ) else (
        echo [SUCCESS] Python dependencies installed.
    )
) else (
    echo [ERROR] requirements.txt not found! Skipping Python steps.
)

echo.
echo ------------------------------------------------------------
echo 2. Installing Web Dependencies (Node.js)...
echo ------------------------------------------------------------
if exist "web\package.json" (
    cd web
    echo [PROGRESS] Running npm install... (This may take a minute)
    call npm install
    if !ERRORLEVEL! neq 0 (
        echo [ERROR] npm install failed!
        cd ..
    ) else (
        echo [PROGRESS] Rebuilding native modules (Critical for SQLite)...
        call npm rebuild better-sqlite3
        
        echo [PROGRESS] Pre-compiling application (Build)...
        if exist ".next" rmdir /s /q .next
        call npm run build
        
        echo [SUCCESS] Node.js dependencies installed and application compiled.
        cd ..
    )
) else (
    echo [ERROR] web/package.json not found! Skipping Web steps.
)

echo.
echo ============================================================
echo   INSTALLATION COMPLETE
echo ============================================================
echo.
echo You can now start the application using:
echo 1_STARTUP_HUB\01_MASTER_START.bat
echo.
pause
