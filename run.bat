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

REM Start frontend
cd frontend
start "Frontend Web (Port 3000)" cmd /k "npm run dev"
cd ..

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
