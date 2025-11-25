@echo off
REM build-billgen-zip.bat
REM Creates a clean, production-ready ZIP of BillGeneratorUnified

setlocal enabledelayedexpansion

REM Generate timestamp for ZIP name
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set ZIP_NAME=billgen-unified-deploy-%datetime:~0,8%.zip

echo ========================================
echo Building Clean BillGeneratorUnified ZIP
echo ========================================
echo.

REM Create temporary clean directory
set TEMP_DIR=%TEMP%\billgen-clean
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%"
mkdir "%TEMP_DIR%"

echo [1/4] Copying runtime files...

REM Copy Python source files
xcopy /E /I /Y "*.py" "%TEMP_DIR%\" >nul 2>&1
xcopy /E /I /Y "core" "%TEMP_DIR%\core\" >nul
xcopy /E /I /Y "launchers" "%TEMP_DIR%\launchers\" >nul

REM Copy configuration files
xcopy /E /I /Y "config" "%TEMP_DIR%\config\" >nul
xcopy /E /I /Y ".streamlit" "%TEMP_DIR%\.streamlit\" >nul

REM Copy templates
xcopy /E /I /Y "templates" "%TEMP_DIR%\templates\" >nul

REM Copy batch launchers
copy /Y "*.bat" "%TEMP_DIR%\" >nul 2>&1

REM Copy requirements and docs
copy /Y "requirements.txt" "%TEMP_DIR%\" >nul 2>&1
copy /Y "packages.txt" "%TEMP_DIR%\" >nul 2>&1
copy /Y "README.md" "%TEMP_DIR%\" >nul 2>&1
copy /Y ".gitignore" "%TEMP_DIR%\" >nul 2>&1

REM Create empty input/output directories
mkdir "%TEMP_DIR%\input" >nul 2>&1
mkdir "%TEMP_DIR%\OUTPUT_FILES" >nul 2>&1

echo [2/4] Cleaning dev artifacts...

REM Remove cache and dev files
for /d /r "%TEMP_DIR%" %%d in (__pycache__) do @if exist "%%d" rmdir /s /q "%%d"
for /d /r "%TEMP_DIR%" %%d in (.pytest_cache) do @if exist "%%d" rmdir /s /q "%%d"
for /d /r "%TEMP_DIR%" %%d in (*.egg-info) do @if exist "%%d" rmdir /s /q "%%d"
del /s /q "%TEMP_DIR%\*.pyc" >nul 2>&1
del /s /q "%TEMP_DIR%\*.pyo" >nul 2>&1
del /s /q "%TEMP_DIR%\*.log" >nul 2>&1

REM Remove test files
del /q "%TEMP_DIR%\test_*.py" >nul 2>&1
if exist "%TEMP_DIR%\test_output" rmdir /s /q "%TEMP_DIR%\test_output"
if exist "%TEMP_DIR%\TEST_INPUT_FILES" rmdir /s /q "%TEMP_DIR%\TEST_INPUT_FILES"
if exist "%TEMP_DIR%\autonomous_test_output" rmdir /s /q "%TEMP_DIR%\autonomous_test_output"

echo [3/4] Creating ZIP archive...

REM Use PowerShell to create ZIP
powershell -command "Compress-Archive -Path '%TEMP_DIR%\*' -DestinationPath '%CD%\%ZIP_NAME%' -Force"

echo [4/4] Cleaning up...
rmdir /s /q "%TEMP_DIR%"

echo.
echo ========================================
echo ✅ ZIP created successfully!
echo ========================================
echo File: %ZIP_NAME%
echo Location: %CD%
echo.
echo Contents:
echo   - Core application files
echo   - All 5 launchers + batch scripts
echo   - Configuration files
echo   - Templates (HTML/LaTeX)
echo   - Empty input/output folders
echo.
echo Excluded:
echo   - Test files and outputs
echo   - Cache files (__pycache__, *.pyc)
echo   - Log files
echo   - .git directory
echo ========================================

endlocal
pause
