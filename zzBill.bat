@echo off
REM ════════════════════════════════════════════════════════════════
REM  BILLGENERATOR - Quick Local Run Script
REM  Windows Batch File for Easy Development Startup
REM ════════════════════════════════════════════════════════════════

cls
color 0A
echo.
echo ════════════════════════════════════════════════════════════════
echo  🚀 BILLGENERATOR - Local Development Server
echo ════════════════════════════════════════════════════════════════
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Node.js is not installed or not in PATH
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js detected: 
node --version
echo.

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: npm is not installed or not in PATH
    echo.
    pause
    exit /b 1
)

echo ✅ npm detected: 
npm --version
echo.

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ❌ npm install failed
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed
    echo.
)

REM Start the development server
echo ════════════════════════════════════════════════════════════════
echo 🎯 Starting BillGenerator Development Server...
echo ════════════════════════════════════════════════════════════════
echo.
echo 📝 The application will be available at: http://localhost:5000
echo.
echo Press CTRL+C to stop the server
echo.

call npm run dev:client

REM If the server crashes or exits
if errorlevel 1 (
    echo.
    echo ❌ Server encountered an error
    echo.
    pause
)

exit /b 0
