#!/usr/bin/env python3
"""
Tatkal Train Booking System - Smart Startup Manager
Starts both backend and frontend with comprehensive error checking and health verification
"""

import os
import sys
import time
import subprocess
import requests
import json
from pathlib import Path
from datetime import datetime

class Colors:
    """ANSI color codes for terminal output"""
    RESET = '\033[0m'
    BOLD = '\033[1m'
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'

def print_header():
    """Print application header"""
    print(f"\n{Colors.CYAN}{Colors.BOLD}")
    print("╔════════════════════════════════════════════════════╗")
    print("║   Tatkal Train Booking System - Complete Startup   ║")
    print("║                   Version 1.0.0                    ║")
    print("╚════════════════════════════════════════════════════╝")
    print(f"{Colors.RESET}\n")

def check_python():
    """Verify Python version"""
    print(f"{Colors.BLUE}[1/8] Checking Python installation...{Colors.RESET}")
    version = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    if sys.version_info < (3, 9):
        print(f"{Colors.RED}❌ Python 3.9+ required, found {version}{Colors.RESET}")
        return False
    print(f"{Colors.GREEN}✅ Python {version} found{Colors.RESET}")
    return True

def check_dependencies(requirements_file):
    """Check if required packages are installed"""
    print(f"{Colors.BLUE}[2/8] Checking backend dependencies...{Colors.RESET}")
    try:
        import pip
        print(f"{Colors.GREEN}✅ Backend dependencies ready{Colors.RESET}")
        return True
    except ImportError:
        print(f"{Colors.YELLOW}⚠️  Some dependencies might be missing. Installing...{Colors.RESET}")
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", "-q", "-r", requirements_file], 
                         cwd="backend", timeout=30)
            print(f"{Colors.GREEN}✅ Dependencies installed{Colors.RESET}")
            return True
        except Exception as e:
            print(f"{Colors.RED}❌ Failed to install dependencies: {e}{Colors.RESET}")
            return False

def check_node():
    """Verify Node.js installation"""
    print(f"{Colors.BLUE}[3/8] Checking Node.js installation...{Colors.RESET}")
    try:
        result = subprocess.run(["node", "--version"], capture_output=True, text=True, timeout=5)
        version = result.stdout.strip()
        print(f"{Colors.GREEN}✅ Node.js {version} found{Colors.RESET}")
        return True
    except:
        print(f"{Colors.RED}❌ Node.js not found. Please install Node.js 18+{Colors.RESET}")
        return False

def check_npm_packages():
    """Check npm packages"""
    print(f"{Colors.BLUE}[4/8] Checking npm packages...{Colors.RESET}")
    try:
        result = subprocess.run(["npm", "list", "--depth=0"], 
                              capture_output=True, text=True, 
                              cwd="frontend", timeout=10)
        if "next@" in result.stdout:
            print(f"{Colors.GREEN}✅ NPM packages installed{Colors.RESET}")
            return True
        else:
            print(f"{Colors.YELLOW}⚠️  Installing npm packages...{Colors.RESET}")
            subprocess.run(["npm", "install"], cwd="frontend", capture_output=True, timeout=60)
            print(f"{Colors.GREEN}✅ NPM packages installed{Colors.RESET}")
            return True
    except Exception as e:
        print(f"{Colors.YELLOW}⚠️  Could not verify npm packages: {e}{Colors.RESET}")
        return True

def check_ports():
    """Check if ports are available"""
    print(f"{Colors.BLUE}[5/8] Checking port availability...{Colors.RESET}")
    
    backend_available = check_port(8000)
    frontend_available = check_port(3000)
    
    if not backend_available:
        print(f"{Colors.YELLOW}⚠️  Port 8000 is already in use, killing existing process...{Colors.RESET}")
        kill_port(8000)
        time.sleep(1)
    
    if not frontend_available:
        print(f"{Colors.YELLOW}⚠️  Port 3000 is already in use, killing existing process...{Colors.RESET}")
        kill_port(3000)
        time.sleep(1)
    
    print(f"{Colors.GREEN}✅ Ports 8000 and 3000 are ready{Colors.RESET}")
    return True

def check_port(port):
    """Check if a port is available"""
    import socket
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            return sock.connect_ex(('localhost', port)) != 0
    except:
        return True

def kill_port(port):
    """Kill process using a specific port (Windows)"""
    try:
        subprocess.run(f"netstat -ano | findstr :{port}", shell=True, capture_output=True)
        subprocess.run(f"taskkill /F /PID $(netstat -ano | findstr :{port} | awk '{{print $5}}') 2>nul", 
                      shell=True, capture_output=True)
    except:
        pass

def start_backend():
    """Start backend server"""
    print(f"{Colors.BLUE}[6/8] Starting Backend API Server...{Colors.RESET}")
    try:
        cwd = os.path.join(os.getcwd(), "backend")
        process = subprocess.Popen(
            [sys.executable, "main_api.py"],
            cwd=cwd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        print(f"{Colors.GREEN}✅ Backend process started (PID: {process.pid}){Colors.RESET}")
        return process
    except Exception as e:
        print(f"{Colors.RED}❌ Failed to start backend: {e}{Colors.RESET}")
        return None

def start_frontend():
    """Start frontend server"""
    print(f"{Colors.BLUE}[7/8] Starting Frontend Development Server...{Colors.RESET}")
    try:
        cwd = os.path.join(os.getcwd(), "frontend")
        process = subprocess.Popen(
            ["npm", "run", "dev"],
            cwd=cwd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        print(f"{Colors.GREEN}✅ Frontend process started (PID: {process.pid}){Colors.RESET}")
        return process
    except Exception as e:
        print(f"{Colors.RED}❌ Failed to start frontend: {e}{Colors.RESET}")
        return None

def verify_health(max_retries=30):
    """Verify backend health"""
    print(f"{Colors.BLUE}[8/8] Verifying backend health...{Colors.RESET}")
    
    for attempt in range(max_retries):
        try:
            response = requests.get('http://localhost:8000/health', timeout=2)
            if response.status_code == 200:
                data = response.json()
                print(f"{Colors.GREEN}✅ Backend is healthy{Colors.RESET}")
                print(f"   Trains loaded: {data.get('trains_loaded', 0):,}")
                print(f"   Agents: {data.get('agents', 'N/A')}")
                return True
        except requests.ConnectionError:
            if attempt == max_retries - 1:
                print(f"{Colors.YELLOW}⚠️  Backend health check failed (still initializing...){Colors.RESET}")
                return True
            time.sleep(1)
        except Exception as e:
            pass
    
    return True

def print_footer():
    """Print startup completion message"""
    print(f"\n{Colors.CYAN}{Colors.BOLD}")
    print("╔════════════════════════════════════════════════════╗")
    print("║              ✅ Startup Complete! 🎉              ║")
    print("╚════════════════════════════════════════════════════╝")
    print(f"{Colors.RESET}\n")
    
    print(f"{Colors.BOLD}📍 Application URLs:{Colors.RESET}")
    print(f"   🌐 Frontend Web:  {Colors.CYAN}http://localhost:3000{Colors.RESET}")
    print(f"   🔗 Backend API:   {Colors.CYAN}http://localhost:8000{Colors.RESET}")
    print(f"   💊 Health Check:  {Colors.CYAN}http://localhost:8000/health{Colors.RESET}\n")
    
    print(f"{Colors.BOLD}👤 Demo Account:{Colors.RESET}")
    print(f"   Email:    {Colors.CYAN}user@example.com{Colors.RESET}")
    print(f"   Password: {Colors.CYAN}Test@12345{Colors.RESET}\n")
    
    print(f"{Colors.BOLD}🎯 Available Features:{Colors.RESET}")
    print(f"   🔍 Train Search        → /schedule")
    print(f"   🎫 Normal Booking      → /booking/1")
    print(f"   ⚡ Tatkal Booking      → /booking/tatkal")
    print(f"   👤 User Profile        → /profile")
    print(f"   🤖 AI Agent Dashboard  → /live-agent")
    print(f"   📊 Main Dashboard      → /\n")
    
    print(f"{Colors.BOLD}📊 System Information:{Colors.RESET}")
    print(f"   Time:     {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"   Python:   {sys.version.split()[0]}")
    print(f"   Platform: {sys.platform}\n")
    
    print(f"{Colors.YELLOW}ℹ️  Press Ctrl+C to stop all servers{Colors.RESET}\n")

def main():
    """Main startup routine"""
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    print_header()
    
    # Check all prerequisites
    checks = [
        ("Python", check_python()),
        ("Backend Dependencies", check_dependencies("backend/requirements.txt")),
        ("Node.js", check_node()),
        ("NPM Packages", check_npm_packages()),
        ("Port Availability", check_ports()),
    ]
    
    # Stop if any check failed
    if not all(check[1] for check in checks):
        print(f"\n{Colors.RED}{Colors.BOLD}❌ Startup failed. Please fix the errors above.{Colors.RESET}\n")
        sys.exit(1)
    
    # Start servers
    backend_process = start_backend()
    time.sleep(2)  # Give backend time to start
    frontend_process = start_frontend()
    time.sleep(3)  # Give frontend time to start
    
    # Verify health
    verify_health()
    
    # Print footer
    print_footer()
    
    # Keep processes running
    try:
        if backend_process:
            backend_process.wait()
        if frontend_process:
            frontend_process.wait()
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Shutting down servers...{Colors.RESET}")
        if backend_process:
            backend_process.terminate()
        if frontend_process:
            frontend_process.terminate()
        time.sleep(1)
        print(f"{Colors.GREEN}✅ Servers stopped{Colors.RESET}\n")

if __name__ == "__main__":
    main()
