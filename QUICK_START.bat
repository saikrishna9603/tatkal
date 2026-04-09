@echo off
REM Railway Tatkal Booking System - Quick Start

echo.
echo ========================================
echo Railway Tatkal Booking System
echo Quick Start Script
echo ========================================
echo.

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0

echo [1/3] Starting Backend (Port 8000)...
echo.

REM Start backend in a new window
start "Backend - FastAPI" cmd /k ^
  "cd /d %SCRIPT_DIR%backend && ^
   echo. && ^
   echo Starting FastAPI backend... && ^
   echo Command: python -m uvicorn main_api:app --host 0.0.0.0 --port 8000 --reload && ^
   echo. && ^
   .\.venv\Scripts\python.exe -m uvicorn main_api:app --host 0.0.0.0 --port 8000 --reload"

REM Wait for backend to start
timeout /t 3 /nobreak

echo [2/3] Starting Frontend (Port 3000)...
echo.

REM Start frontend in a new window
start "Frontend - Next.js" cmd /k ^
  "cd /d %SCRIPT_DIR% && ^
   echo. && ^
   echo Starting Next.js frontend... && ^
   echo Command: npm run dev && ^
   echo. && ^
   npm run dev"

REM Wait for frontend to start
timeout /t 2 /nobreak

echo.
echo [3/3] Opening Application in Browser...
echo.

REM Open browser
timeout /t 2 /nobreak
start http://localhost:3000/RAILWAY

echo.
echo ========================================
echo System Starting...
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000/RAILWAY
echo.
echo Demo Credentials:
echo   Email:    user@example.com
echo   Password: Test@12345
echo.
echo The browser will open automatically.
echo You have two new terminal windows running:
echo   - Backend-FastAPI (can be closed later)
echo   - Frontend-Next.js (can be closed later)
echo.
echo ========================================
echo.

pause
