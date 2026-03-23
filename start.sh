#!/bin/bash

# 🚂 TATKAL BOOKING SYSTEM - COMMAND REFERENCE

echo "🚂 Tatkal AI Train Booking System"
echo "=================================="
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --legacy-peer-deps
fi

# Start development server
echo ""
echo "🚀 Starting development server..."
echo "Access the app at: http://localhost:3000"
echo ""
echo "Available commands:"
echo "  npm run dev      → Start development server"
echo "  npm run build    → Build for production"
echo "  npm start        → Start production server"
echo "  npm run lint     → Run linter"
echo ""

npm run dev
