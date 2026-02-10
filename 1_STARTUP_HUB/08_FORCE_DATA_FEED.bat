@echo off
title STOCKTRACK - FORCE DATA FEED
color 0A

:LOOP
echo [DATA] Starting Data Engine (MainTack.py)...
echo [DATA] This window must stay OPEN for values to update.
python MainTack.py
echo [WARNING] Data Engine crashed! Restarting in 5 seconds...
timeout /t 5
goto LOOP
