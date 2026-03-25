@echo off
REM Train Ticket Booking App - Startup Script
REM Starts both backend and frontend servers

title Train Booking App
echo.
echo ========================================
echo Train Ticket Booking App
echo ========================================
echo.
echo Starting backend (FastAPI on port 8000)...
start "Backend" cmd /k "cd /d %~dp0backend && uvicorn main_api:app --port 8000 --reload"

timeout /t 2 /nobreak

echo Starting frontend (Next.js on port 3000)...
start "Frontend" cmd /k "cd /d %~dp0 && npm run dev -- --hostname 127.0.0.1 --port 3000"

echo.
echo ========================================
echo Servers are starting...
echo.
echo Backend will be available at:  http://localhost:8000
echo Frontend will be available at: http://localhost:3000
echo.
echo Close either window to stop that server.
echo ========================================
pause
