@echo off
REM ============================================
REM ULTIMATE QUICK START - Tatkal System
REM Just a simpler version of START_ALL.bat
REM ============================================

title Tatkal Train Booking System - Quick Start

cd /d "%~dp0"

echo.
echo 🚀 TATKAL TRAIN BOOKING SYSTEM
echo Starting in 3 seconds...
timeout /t 3 /nobreak

REM Start backend
cd backend
start "Backend API (Port 8000)" cmd /k "python main_api.py"
cd ..

timeout /t 2 /nobreak

REM Determine frontend working directory (prioritize frontend/ if it has its own package)
set "FRONTEND_DIR="
if exist "frontend\package.json" (
	set "FRONTEND_DIR=frontend"
) else if exist "package.json" (
	set "FRONTEND_DIR=."
) else (
	echo ❌ Frontend package.json not found
	exit /b 1
)

REM Start frontend
cd /d "%~dp0%FRONTEND_DIR%"
start "Frontend Web (Port 3000)" cmd /k "set NEXT_PUBLIC_API_URL=http://127.0.0.1:8000 && npm run dev -- --hostname 127.0.0.1 --port 3000"
cd /d "%~dp0"

timeout /t 3 /nobreak

REM Open browser
start http://localhost:3000

echo.
echo ✅ Both servers started!
echo.
echo 📍 URLs:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:8000
echo.
echo 👤 Demo Account:
echo    Email:    user@example.com
echo    Password: Test@12345
echo.
echo ℹ️  Press Ctrl+C in each window to stop
echo.
pause
