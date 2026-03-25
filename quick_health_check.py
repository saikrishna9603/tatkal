#!/usr/bin/env python3
"""
Quick Health Check - Test all systems without starting servers
Run with: python quick_health_check.py
"""

import os
import sys
import json
import subprocess
from pathlib import Path
from datetime import datetime

class HealthChecker:
    def __init__(self):
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'python': {'version': None, 'status': 'unknown'},
            'nodejs': {'version': None, 'status': 'unknown'},
            'npm': {'version': None, 'status': 'unknown'},
            'files': {},
            'dependencies': {'backend': 'unknown', 'frontend': 'unknown'},
        }

    @staticmethod
    def _exists_any(paths):
        """Return True if any candidate path exists."""
        return any(Path(p).exists() for p in paths)
    
    def check_python(self):
        """Check Python installation and version"""
        try:
            version = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
            self.results['python']['version'] = version
            self.results['python']['status'] = 'OK'
            print(f"✅ Python {version}")
            return True
        except Exception as e:
            print(f"❌ Python check failed: {e}")
            return False
    
    def check_nodejs(self):
        """Check Node.js and npm"""
        try:
            node_result = subprocess.run(['node', '--version'], capture_output=True, text=True, timeout=5)
            if node_result.returncode == 0:
                node_version = node_result.stdout.strip()
                self.results['nodejs']['version'] = node_version
                self.results['nodejs']['status'] = 'OK'
                print(f"✅ Node.js {node_version}")

                # On Windows, npm is typically npm.cmd
                npm_cmd = 'npm.cmd' if os.name == 'nt' else 'npm'
                npm_result = subprocess.run([npm_cmd, '--version'], capture_output=True, text=True, timeout=5)
                if npm_result.returncode == 0:
                    npm_version = npm_result.stdout.strip()
                    self.results['npm']['version'] = npm_version
                    self.results['npm']['status'] = 'OK'
                    print(f"✅ NPM {npm_version}")
                    return True
        except Exception as e:
            print(f"❌ Node.js check failed: {e}")
        return False
    
    def check_files(self):
        """Check if required files exist"""
        required_files = {
            'Backend': [
                ['backend/main_api.py'],
                ['backend/requirements.txt'],
            ],
            'Frontend': [
                ['package.json', 'frontend/package.json'],
                ['tsconfig.json', 'frontend/tsconfig.json'],
                ['next.config.js', 'frontend/next.config.js'],
            ],
            'Pages': [
                ['src/app/login/page.tsx', 'frontend/src/app/login/page.tsx'],
                ['src/app/register/page.tsx', 'frontend/src/app/register/page.tsx'],
                ['src/app/schedule/page.tsx', 'frontend/src/app/schedule/page.tsx'],
                ['src/app/profile/page.tsx', 'frontend/src/app/profile/page.tsx'],
                ['src/app/booking/[id]/page.tsx', 'frontend/src/app/booking/[id]/page.tsx'],
                ['src/app/booking/tatkal/page.tsx', 'frontend/src/app/booking/tatkal/page.tsx'],
                ['src/app/live-agent/page.tsx', 'frontend/src/app/live-agent/page.tsx'],
            ],
            'Configuration': [
                ['COMPLETE_STARTUP_GUIDE.md'],
                ['START_ALL.bat'],
                ['startup.py'],
            ],
        }
        
        all_present = True
        for category, files in required_files.items():
            present = sum(1 for candidates in files if self._exists_any(candidates))
            total = len(files)
            status = "✅" if present == total else "⚠️"
            print(f"{status} {category}: {present}/{total} files")
            self.results['files'][category] = {'count': present, 'total': total}
            
            if present < total:
                all_present = False
                for candidates in files:
                    if not self._exists_any(candidates):
                        print(f"    Missing any of: {', '.join(candidates)}")
        
        return all_present
    
    def check_dependencies(self):
        """Check if dependencies are installable"""
        print("\n📦 Dependency Check:")
        
        # Check backend requirements file presence
        if Path('backend/requirements.txt').exists():
            print("✅ Backend requirements file found")
            self.results['dependencies']['backend'] = 'OK'
        else:
            print("⚠️  Backend requirements file missing")
            self.results['dependencies']['backend'] = 'MISSING'
        
        # Check frontend node_modules
        if Path('frontend/node_modules').exists():
            print("✅ Frontend dependencies installed")
            self.results['dependencies']['frontend'] = 'OK'
        else:
            print("⚠️  Frontend dependencies not installed yet (will install on startup)")
            self.results['dependencies']['frontend'] = 'NOT_INSTALLED'
    
    def run_all_checks(self):
        """Run all health checks"""
        print("\n" + "="*50)
        print("🏥 TATKAL SYSTEM HEALTH CHECK")
        print("="*50 + "\n")
        
        print("🔧 Environment Check:")
        self.check_python()
        self.check_nodejs()
        
        print("\n📂 File System Check:")
        self.check_files()
        
        self.check_dependencies()
        
        print("\n" + "="*50)
        
        # Summary
        python_ok = self.results['python']['status'] == 'OK'
        nodejs_ok = self.results['nodejs']['status'] == 'OK'
        files_ok = all(v['count'] == v['total'] for v in self.results['files'].values())
        
        if python_ok and nodejs_ok and files_ok:
            print("✅ SYSTEM READY - All checks passed!")
            print("\n🚀 You can now startup with:")
            print("   • Double-click: START_ALL.bat")
            print("   • Or run: python startup.py")
            return 0
        else:
            print("⚠️  SYSTEM NOT READY - Please fix issues above")
            return 1

if __name__ == '__main__':
    checker = HealthChecker()
    sys.exit(checker.run_all_checks())
