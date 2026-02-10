@echo off
echo ============================================================
echo   CLEAR DATABASE TOOL
echo ============================================================
echo.
echo WARNING: This will PERMANENTLY DELETE the database file.
echo All historical data will be lost.
echo.
echo Press any key to continue or Close this window to Cancel...
pause >nul

echo.
echo [1/2] Stopping Python processes to release database locks...
taskkill /IM python.exe /F 2>nul
taskkill /IM node.exe /F 2>nul

echo.
echo [2/2] Deleting database files...
if exist market_v3.db (
    del /F /Q market_v3.db
    echo Deleted market_v3.db
)
if exist market_v3.db-wal (
    del /F /Q market_v3.db-wal
    echo Deleted market_v3.db-wal
)
if exist market_v3.db-shm (
    del /F /Q market_v3.db-shm
    echo Deleted market_v3.db-shm
)

if exist web\data\my-test.db (
    del /F /Q web\data\my-test.db
    echo Deleted web\data\my-test.db
)
if exist web\data\my-test.db-wal (
    del /F /Q web\data\my-test.db-wal
    echo Deleted web\data\my-test.db-wal
)
if exist web\data\my-test.db-shm (
    del /F /Q web\data\my-test.db-shm
    echo Deleted web\data\my-test.db-shm
)

echo.
echo ============================================================
echo   DATABASE CLEARED SUCCESSFULLY
echo ============================================================
echo.
pause
