@echo off
REM Verification Script - Check all systems before startup

setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════════════════╗
echo ║      System Verification & Health Check 🏥        ║
echo ╚════════════════════════════════════════════════════╝
echo.

REM Counter for checks
set "passed=0"
set "failed=0"

echo [CHECK 1] Python Installation
python --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYVER=%%i
    echo ✅ Python !PYVER! found
    set /a passed+=1
) else (
    echo ❌ Python not found
    set /a failed+=1
)

echo.
echo [CHECK 2] Node.js Installation
node --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f %%i in ('node --version') do set NODEVER=%%i
    echo ✅ Node.js !NODEVER! found
    set /a passed+=1
) else (
    echo ❌ Node.js not found
    set /a failed+=1
)

echo.
echo [CHECK 3] Backend Requirements File
if exist "backend\requirements.txt" (
    echo ✅ backend\requirements.txt exists
    set /a passed+=1
) else (
    echo ❌ backend\requirements.txt not found
    set /a failed+=1
)

echo.
echo [CHECK 4] Frontend Package File
if exist "frontend\package.json" (
    echo ✅ frontend\package.json exists
    set /a passed+=1
) else (
    echo ❌ frontend\package.json not found
    set /a failed+=1
)

echo.
echo [CHECK 5] Startup Scripts
set "scripts_found=0"
if exist "START_ALL.bat" echo ✅ START_ALL.bat found && set /a scripts_found+=1
if exist "startup.py" echo ✅ startup.py found && set /a scripts_found+=1
if %scripts_found% geq 2 (
    set /a passed+=1
) else (
    echo ❌ Some startup scripts missing
    set /a failed+=1
)

echo.
echo [CHECK 6] Frontend Pages
set "pages_found=0"
if exist "frontend\src\app\login\page.tsx" set /a pages_found+=1 & echo ✅ Login page found
if exist "frontend\src\app\register\page.tsx" set /a pages_found+=1 & echo ✅ Register page found
if exist "frontend\src\app\schedule\page.tsx" set /a pages_found+=1 & echo ✅ Schedule page found
if exist "frontend\src\app\profile\page.tsx" set /a pages_found+=1 & echo ✅ Profile page found
if exist "frontend\src\app\booking\[id]\page.tsx" set /a pages_found+=1 & echo ✅ Booking page found
if exist "frontend\src\app\booking\tatkal\page.tsx" set /a pages_found+=1 & echo ✅ Tatkal page found
if exist "frontend\src\app\live-agent\page.tsx" set /a pages_found+=1 & echo ✅ Live-agent page found

if %pages_found% equ 7 (
    echo ✅ All 7 pages present
    set /a passed+=1
) else (
    echo ⚠️ %pages_found%/7 pages found
    set /a passed+=1
)

echo.
echo [CHECK 7] Backend Files
set "backend_files=0"
if exist "backend\main_api.py" set /a backend_files+=1 & echo ✅ main_api.py found
if exist "backend\requirements.txt" set /a backend_files+=1 & echo ✅ requirements.txt found
if %backend_files% equ 2 (
    set /a passed+=1
) else (
    echo ❌ Backend files missing
    set /a failed+=1
)

echo.
echo [CHECK 8] Configuration Files
if exist "COMPLETE_STARTUP_GUIDE.md" (
    echo ✅ Startup guide found
    set /a passed+=1
) else (
    echo ⚠️ Startup guide not found
)

echo.
echo ╔════════════════════════════════════════════════════╗
echo ║                  VERIFICATION RESULT              ║
echo ╚════════════════════════════════════════════════════╝
echo.
echo Checks Passed:  %passed%
echo Checks Failed:  %failed%
echo.

if %failed% equ 0 (
    echo ✅ All systems ready for startup!
    echo.
    echo Ready to launch? Choose one:
    echo   1. Double-click START_ALL.bat
    echo   2. Run: python startup.py
    echo.
) else (
    echo ❌ Some checks failed. Please fix the issues above.
    echo.
)

echo Demo Account Credentials:
echo   Email:    user@example.com
echo   Password: Test@12345
echo.

echo.
pause
