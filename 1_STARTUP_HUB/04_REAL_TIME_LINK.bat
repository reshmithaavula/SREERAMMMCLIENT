@echo off
title [HUB] Real-Time Link
echo Starting WebSocket Real-Time Stream...
cd /d "%~dp0..\web"
npm run ws
pause
