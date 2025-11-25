@echo off
title Show Input/Output Paths
color 0A

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║              INPUT / OUTPUT FOLDER PATHS                     ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo 📂 PROJECT DIRECTORY:
echo    %CD%
echo.

echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo 📥 INPUT FOLDER (Place Excel files here):
echo    %CD%\input
echo.
if exist "input" (
    echo    Status: ✅ Exists
    dir /b input 2>nul | find /c /v "" > temp.txt
    set /p count=<temp.txt
    del temp.txt
    echo    Files: %count%
) else (
    echo    Status: ❌ Does not exist
    mkdir input
    echo    Created: ✅
)
echo.

echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo 📤 OUTPUT FOLDER (Generated files appear here):
echo    %CD%\output
echo.
if exist "output" (
    echo    Status: ✅ Exists
    dir /b output 2>nul | find /c /v "" > temp.txt
    set /p count=<temp.txt
    del temp.txt
    echo    Folders: %count%
) else (
    echo    Status: ⚠️  Will be created on first run
)
echo.

echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo 🎯 QUICK ACTIONS:
echo.
echo    1. Open input folder   : explorer input
echo    2. Open output folder  : explorer output
echo    3. Run batch processing: BATCH_RUN.bat
echo.

echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo 📋 FOLDER STRUCTURE:
echo.
echo    BillGeneratorUnified\
echo    ├── input\              ← PUT EXCEL FILES HERE
echo    │   ├── ProjectA.xlsx
echo    │   └── ProjectB.xlsx
echo    │
echo    └── output\             ← OUTPUTS APPEAR HERE
echo        ├── 20241111_143025_ProjectA\
echo        │   ├── html\
echo        │   └── pdf\
echo        └── 20241111_143026_ProjectB\
echo            ├── html\
echo            └── pdf\
echo.

echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo Press any key to open folders...
pause >nul

echo.
echo Opening input folder...
explorer input

timeout /t 2 >nul

if exist "output" (
    echo Opening output folder...
    explorer output
) else (
    echo Output folder will be created on first batch run.
)

echo.
echo Done!
echo.
pause
