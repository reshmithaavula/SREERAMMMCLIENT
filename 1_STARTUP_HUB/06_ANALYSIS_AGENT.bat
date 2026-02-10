@echo off
title [HUB] AI Analysis Agent
echo Starting Python Analysis Agent...
cd /d "%~dp0..\services\analysis-agent"
python main.py
pause
