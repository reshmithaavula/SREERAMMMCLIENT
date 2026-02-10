@echo off
title [HUB] Data Engine (TS)
echo Starting TypeScript Data Engine...
cd /d "%~dp0..\web"
echo Running backend engine...
call npm run engine
pause
