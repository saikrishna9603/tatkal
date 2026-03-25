@echo off
REM Train Ticket Booking App - Cleanup Script
REM Stops backend and frontend servers

echo.
echo ========================================
echo Stopping Train Booking App...
echo ========================================
echo.

echo Stopping frontend (node processes on port 3000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do taskkill /PID %%a /F 2>nul

timeout /t 1 /nobreak

echo Stopping backend (uvicorn on port 8000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do taskkill /PID %%a /F 2>nul

echo.
echo ========================================
echo All servers stopped.
echo ========================================
pause
