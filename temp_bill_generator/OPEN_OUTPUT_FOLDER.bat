@echo off
title Open Output Folder
color 0A

echo.
echo ========================================
echo   OPENING OUTPUT FOLDER
echo ========================================
echo.

REM Check if output folder exists
if exist "output" (
    echo Opening: %CD%\output
    echo.
    explorer output
) else (
    echo Output folder does not exist yet.
    echo.
    echo The output folder will be created automatically
    echo when you run batch processing.
    echo.
    echo To generate outputs:
    echo   1. Place Excel files in input\ folder
    echo   2. Run BATCH_RUN.bat
    echo   3. Check output\ folder
    echo.
    
    REM Create output folder
    mkdir output
    echo Created output folder: %CD%\output
    echo.
    explorer output
)

echo.
pause
