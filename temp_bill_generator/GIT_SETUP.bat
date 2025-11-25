@echo off
title Git Setup and Push to GitHub
color 0A

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║              GIT SETUP AND PUSH TO GITHUB                    ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo 📋 Repository: https://github.com/CRAJKUMARSINGH/BillGeneratorUnified.git
echo.

echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo Step 1: Initialize Git Repository
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
git init
if errorlevel 1 (
    echo ❌ Failed to initialize Git repository
    pause
    exit /b 1
)
echo ✅ Git repository initialized
echo.

echo Step 2: Add Remote Origin
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
git remote add origin https://github.com/CRAJKUMARSINGH/BillGeneratorUnified.git 2>nul
if errorlevel 1 (
    echo ⚠️  Remote already exists, updating...
    git remote set-url origin https://github.com/CRAJKUMARSINGH/BillGeneratorUnified.git
)
echo ✅ Remote origin set
echo.

echo Step 3: Add All Files
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
git add .
if errorlevel 1 (
    echo ❌ Failed to add files
    pause
    exit /b 1
)
echo ✅ All files added
echo.

echo Step 4: Create Initial Commit
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
git commit -m "Initial commit: BillGenerator Unified with Enhanced PDF and Batch Processing"
if errorlevel 1 (
    echo ⚠️  Commit failed or nothing to commit
)
echo ✅ Initial commit created
echo.

echo Step 5: Set Main Branch
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
git branch -M main
if errorlevel 1 (
    echo ❌ Failed to set main branch
    pause
    exit /b 1
)
echo ✅ Main branch set
echo.

echo Step 6: Push to GitHub
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo ⚠️  You may be prompted for GitHub credentials
echo.
git push -u origin main
if errorlevel 1 (
    echo.
    echo ❌ Push failed!
    echo.
    echo Possible reasons:
    echo   1. GitHub credentials not configured
    echo   2. Repository doesn't exist on GitHub
    echo   3. No internet connection
    echo   4. Permission denied
    echo.
    echo Solutions:
    echo   1. Configure Git credentials:
    echo      git config --global user.name "Your Name"
    echo      git config --global user.email "your.email@example.com"
    echo.
    echo   2. Create repository on GitHub first:
    echo      https://github.com/new
    echo.
    echo   3. Use GitHub Desktop or authenticate via browser
    echo.
    pause
    exit /b 1
)
echo.
echo ✅ Successfully pushed to GitHub!
echo.

echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 🎉 SUCCESS! Repository is now on GitHub
echo.
echo 📍 Repository URL:
echo    https://github.com/CRAJKUMARSINGH/BillGeneratorUnified
echo.
echo 🔗 Quick Links:
echo    View Repository: https://github.com/CRAJKUMARSINGH/BillGeneratorUnified
echo    Clone Command:   git clone https://github.com/CRAJKUMARSINGH/BillGeneratorUnified.git
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

pause
