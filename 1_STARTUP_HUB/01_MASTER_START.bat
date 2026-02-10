@echo off
setlocal enabledelayedexpansion
title [HUB] STOCKTRACK MASTER CONTROL
echo ========================================================
echo        STOCKTRACK UNIFIED CONTROL CENTER
echo ========================================================
echo.

:: 0. CHECKS
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found! Please install Node.js 20+.
    pause
    exit /b 1
)

:: AUTO-INSTALL
if not exist "%~dp0..\web\node_modules" (
    echo [PROGRESS] node_modules missing. Installing...
    cd /d "%~dp0..\web"
    call npm install
    cd /d "%~dp0"
)

echo Launching Consolidated Engine Architecture...
echo.

:: 1. Web Server (Frontend)
echo [1/6] Launching Web Dashboard (npm run dev)...
start "WEB_DASHBOARD" cmd /c "%~dp002_WEB_DASHBOARD.bat"

:: 2. Data Engine (Backend)
echo [2/6] Launching Data Engine (npm run engine)...
start "DATA_ENGINE" cmd /c "%~dp003_DATA_ENGINE_TS.bat"

:: 3. Real-Time Link (WebSocket)
echo [3/6] Launching Real-Time WebSocket Hub (npm run ws)...
start "REAL_TIME_NODE" cmd /c "%~dp004_REAL_TIME_LINK.bat"

:: 4. Live Index Scraper (Web Scraping)
echo [4/6] Launching Index Scraper (CNBC Scrape)...
start "INDEX_SCRAPER" cmd /c "%~dp005_LIVE_INDEX_SCRAPER.bat"

:: 5. AI Analysis Agent
echo [5/6] Launching Analysis Agent...
start "ANALYSIS_AGENT" cmd /c "%~dp006_ANALYSIS_AGENT.bat"

:: 6. Twitter Bot Engine
echo [6/6] Launching Twitter Bot automation...
start "BOT_ENGINE" cmd /c "%~dp0run-bot.bat"

echo.
echo ========================================================
echo SYSTEM IS OPERATIONAL.
echo Access the Dashboard at: http://localhost:3000
echo ========================================================
echo.
echo To stop everything, close the individual windows.
pause
