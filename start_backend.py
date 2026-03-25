#!/usr/bin/env python
"""Start backend server"""

import subprocess
import sys
import os
import time

os.chdir(r"c:\Users\Admin\Downloads\OURMINIPROJECT\backend")

print("=" * 60)
print("🚀 STARTING TATKAL BACKEND SERVER")
print("=" * 60)
print(f"Current directory: {os.getcwd()}")
print(f"Python: {sys.executable}")
print()

try:
    print("Starting uvicorn server on 0.0.0.0:8001...")
    cmd = [
        sys.executable, "-m", "uvicorn",
        "main_api:app",
        "--host", "0.0.0.0",
        "--port", "8001",
        "--reload",
        "--log-level", "info"
    ]
    print(f"Command: {' '.join(cmd)}\n")
    
    result = subprocess.run(cmd, capture_output=False, text=True)
    
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
