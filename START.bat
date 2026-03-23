@echo off
REM ============================================
REM TATKAL Train Booking System - Startup Script
REM ============================================

echo.
echo  ==============================================
echo  🚂 TATKAL Train Booking System
echo  AI-Powered Train Booking with PRAL Agents
echo  ==============================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Python is not installed or not in PATH
    echo Please install Python 3.9+ from python.org
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Node.js is not installed or not in PATH
    echo Please install Node.js 18+ from nodejs.org
    pause
    exit /b 1
)

echo ✅ Python version:
python --version
echo.
echo ✅ Node.js version:
node --version
echo.

REM Create backend virtual environment if not exists
if not exist "backend\venv" (
    echo 🔧 Creating Python virtual environment...
    cd backend
    python -m venv venv
    cd ..
)

REM Activate backend virtual environment
echo 🚀 Starting Backend Server...
call backend\venv\Scripts\activate.bat

REM Install backend dependencies
echo 📦 Installing backend dependencies...
pip install -q -r backend\requirements.txt

REM Start backend server
cd backend
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 📊 Backend starting on http://0.0.0.0:8000
echo 📖 API Documentation: http://localhost:8000/docs
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM Start backend in a new window
start "TATKAL Backend Server" cmd /k "python -m uvicorn main_api:app --reload --host 0.0.0.0 --port 8000"

cd ..

REM Wait a moment for backend to start
timeout /t 3 /nobreak

REM Install frontend dependencies if needed
if not exist "frontend\node_modules" (
    echo 📦 Installing frontend dependencies...
    cd frontend
    call npm install --silent
    cd ..
)

REM Start frontend server
cd frontend
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 💻 Frontend starting on http://localhost:3000
echo 📱 Open your browser and navigate to:
echo    http://localhost:3000
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 🔐 Demo Credentials:
echo    Email: user@example.com
echo    Password: Test@12345
echo.

REM Start frontend in current window
call npm run dev

cd ..

echo.
echo Application stopped.
pause
