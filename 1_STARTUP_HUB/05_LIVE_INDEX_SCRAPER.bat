@echo off
title [HUB] Live Index Scraper
echo Starting Python CNBC Index Scraper...
cd /d "%~dp0.."
python StartHeaderService.py
pause
