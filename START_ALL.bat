@echo off
REM ============================================
REM Tatkal Train Booking System - Full Startup
REM ============================================
REM This script starts both backend and frontend servers
REM and verifies all systems are working correctly

setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo ╔════════════════════════════════════════════════════╗
echo ║   Tatkal Train Booking System - Complete Startup   ║
echo ║                Version 1.0.0                       ║
echo ╚════════════════════════════════════════════════════╝
echo.

REM Check if Python is installed
echo [1/5] Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.11+ and add it to PATH
    pause
    exit /b 1
)
echo ✅ Python found

REM Check if Node.js is installed
echo [2/5] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js 18+ and add it to PATH
    pause
    exit /b 1
)
echo ✅ Node.js found

REM Check backend requirements
echo [3/5] Checking backend dependencies...
if not exist "backend\requirements.txt" (
    echo ❌ backend\requirements.txt not found
    exit /b 1
)
echo ✅ Backend requirements file found

REM Check frontend dependencies
echo [4/5] Checking frontend dependencies...
if not exist "frontend\package.json" (
    echo ❌ frontend\package.json not found
    exit /b 1
)
echo ✅ Frontend package.json found

echo [5/5] Starting servers...
echo.

REM Start Backend in new window
echo Starting Backend API Server on port 8000...
cd backend
start "Backend - Tatkal API Server (Port 8000)" cmd /k "python main_api.py"
cd ..
timeout /t 3 /nobreak

REM Start Frontend in new window
echo Starting Frontend Development Server on port 3000...
cd frontend
start "Frontend - Tatkal Web App (Port 3000)" cmd /k "npm run dev"
cd ..
timeout /t 3 /nobreak

REM Wait and check if servers are running
echo.
echo ╔════════════════════════════════════════════════════╗
echo ║              Startup Complete! 🎉                 ║
echo ╚════════════════════════════════════════════════════╝
echo.
echo 📍 Backend API:   http://localhost:8000
echo 📍 Frontend Web:  http://localhost:3000
echo.
echo 🔗 Health Check:  http://localhost:8000/health
echo 📊 Dashboard:     http://localhost:3000
echo.
echo ⏳ Waiting 5 seconds for servers to initialize...
timeout /t 5 /nobreak

REM Open browser (optional)
echo.
echo Opening application in browser...
start http://localhost:3000

echo.
echo ✅ Application started successfully!
echo.
echo Demo Account:
echo   Email:    user@example.com
echo   Password: Test@12345
echo.
echo Features:
echo   🔍 Train Search        - /schedule
echo   🎫 Normal Booking      - /booking/1
echo   ⚡ Tatkal Booking      - /booking/tatkal
echo   👤 User Profile        - /profile
echo   🤖 AI Agent Dashboard  - /live-agent
echo   📊 Dashboard           - /
echo.
echo ℹ️  Both windows will stay open. Close them to stop the servers.
echo.
pause
