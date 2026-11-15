@echo off
setlocal
cd /d "%~dp0"
title Build NEXORA for Windows
echo ========================================
echo        NEXORA - Windows Builder
echo ========================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required to build NEXORA.
  echo Download and install the LTS version from https://nodejs.org/
  echo Then close this window and double-click this file again.
  pause
  exit /b 1
)
echo Installing required components...
call npm install --no-audit --no-fund
if errorlevel 1 goto failed
echo.
echo Building NEXORA Windows installer and portable EXE...
call npx electron-builder --win nsis portable
if errorlevel 1 goto failed
echo.
echo SUCCESS! Your NEXORA files are in the dist folder.
echo Look for NEXORA Setup.exe and the portable NEXORA.exe.
explorer "%~dp0dist"
pause
exit /b 0
:failed
echo.
echo Build failed. Check the error messages above and try again.
pause
exit /b 1
