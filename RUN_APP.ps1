#!/usr/bin/env powershell
# Train Ticket Booking App - Startup Script
# Starts both backend and frontend servers

Write-Host ""
Write-Host "========================================"
Write-Host "Train Ticket Booking App"
Write-Host "========================================"
Write-Host ""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Starting backend (FastAPI on port 8000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\backend'; uvicorn main_api:app --port 8000 --reload"

Start-Sleep -Seconds 2

Write-Host "Starting frontend (Next.js on port 3000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir'; npm run dev -- --hostname 127.0.0.1 --port 3000"

Write-Host ""
Write-Host "========================================"
Write-Host "Servers are starting..." -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:8000" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "Close either window to stop that server."
Write-Host "========================================"
Write-Host ""
