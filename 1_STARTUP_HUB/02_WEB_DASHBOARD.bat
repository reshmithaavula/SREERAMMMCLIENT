@echo off
title [HUB] Web Dashboard
cd /d "%~dp0..\web"
echo Cleaning build cache...
if exist .next rmdir /s /q .next
echo Starting Web Dashboard Server (Webpack Mode)...
npm run dev
pause
