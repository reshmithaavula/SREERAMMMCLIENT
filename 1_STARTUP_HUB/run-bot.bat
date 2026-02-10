@echo off
title StockTrack Twitter Bot
echo ========================================
echo   StockTrack Twitter Automation
echo   Runs every 5 minutes
echo ========================================
echo.
cd /d "%~dp0..\web"
echo [OK] Current directory: %CD%

echo Cleaning up old bot processes...
:: Kill any chromes with the bot profile
powershell -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*chrome_profile_stealth*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"
timeout /t 2 /nobreak >nul

echo Starting bot...
:: Correct command with ts-node
npx ts-node --project tsconfig.bot.json --transpile-only scripts/ui-bot-v2.ts
if %errorlevel% neq 0 (
    echo [ERROR] Bot exited with code %errorlevel%
    echo Check for missing packages: npm install canvas puppeteer-extra
)
pause
