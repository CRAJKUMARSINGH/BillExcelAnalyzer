@echo off
title BillGenerator Unified - All Features
color 0A

echo.
echo ========================================
echo   BillGenerator Unified
echo   Configuration-Based System
echo   With Batch Processing!
echo ========================================
echo.

:menu
echo Select variant to launch:
echo 1. V01 (Standard)
echo 2. V02 (Light)
echo 3. V03 (Basic)
echo 4. V04 (Advanced + Batch Processing)
echo 5. SmartBillFlow (All Features)
echo 6. Batch Run (Command Line - HTML ^& PDF)
echo 7. Exit
echo.
set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" goto launch_v01
if "%choice%"=="2" goto launch_v02
if "%choice%"=="3" goto launch_v03
if "%choice%"=="4" goto launch_v04
if "%choice%"=="5" goto launch_smart
if "%choice%"=="6" goto launch_batch
if "%choice%"=="7" goto exit_script
echo Invalid choice. Please try again.
goto menu

:launch_v01
echo.
echo Launching V01 (Standard)...
python launchers/launch_v01.py
goto menu

:launch_v02
echo.
echo Launching V02 (Light)...
python launchers/launch_v02.py
goto menu

:launch_v03
echo.
echo Launching V03 (Basic)...
python launchers/launch_v03.py
goto menu

:launch_v04
echo.
echo Launching V04 (Advanced + Batch Processing)...
python launchers/launch_v04.py
goto menu

:launch_smart
echo.
echo Launching SmartBillFlow (All Features)...
python launchers/launch_smartbillflow.py
goto menu

:launch_batch
echo.
echo Launching Batch Run (Command Line)...
echo.
python batch_run_demo.py
echo.
pause
goto menu

:exit_script
echo.
echo Thank you for using BillGenerator Unified!
echo.
exit /b 0
