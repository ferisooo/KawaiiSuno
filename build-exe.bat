@echo off
setlocal enableextensions
title Build SunoKawaiiPlayer installer
cd /d "%~dp0"

set "ELECTRON_SKIP_BINARY_DOWNLOAD="
set "ELECTRON_SKIP_BINARY="
set "npm_config_ignore_scripts="

echo.
echo   Building a Windows installer (.exe) with electron-builder...
echo.

where node >nul 2>nul
if errorlevel 1 ( echo   [x] Node.js not found. Install from https://nodejs.org & pause & exit /b 1 )

if not exist "node_modules" (
  echo   [*] Installing dependencies first...
  call npm install
)

REM make sure the UI is freshly compiled
call npm run build

REM electron-builder is heavy, so it is NOT installed by default - add it on demand
if not exist "node_modules\electron-builder" (
  echo   [*] Installing electron-builder ^(one time^)...
  call npm install --save-dev electron-builder
  if errorlevel 1 ( echo   [x] Couldn't install electron-builder. & pause & exit /b 1 )
)

echo   [*] Packaging... output goes to the dist\ folder.
call npx electron-builder --win nsis
if errorlevel 1 ( echo. & echo   [x] Packaging failed - see messages above. & pause & exit /b 1 )

echo.
echo   [ok] Done! Find your installer in the dist\ folder.
echo.
pause
exit /b 0
