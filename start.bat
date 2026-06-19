@echo off
setlocal enableextensions
title Suno Kawaii Player
cd /d "%~dp0"

REM ===== version must match "electron" in package.json =====
set "ELECTRON_VERSION=31.7.7"

REM ===== clear vars that commonly BREAK electron's binary install =====
set "ELECTRON_SKIP_BINARY_DOWNLOAD="
set "ELECTRON_SKIP_BINARY="
set "npm_config_ignore_scripts="

echo.
echo   (^=^'.'^=^)  Suno Kawaii Player
echo   --------------------------------
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo   [x] Node.js was not found on this PC.
  echo       Install it from https://nodejs.org  then run this again.
  echo.
  pause
  exit /b 1
)

REM ===== 1) install deps if missing =====
if not exist "node_modules" (
  echo   [*] First run - installing dependencies. This needs internet...
  call npm install
  if errorlevel 1 (
    echo   [!] npm install hit a snag - continuing to repair electron anyway.
  )
)

REM ===== 1b) pick up newly-added dependencies on later versions =====
if not exist "node_modules\sql.js" (
  echo   [*] New dependency detected - updating packages...
  call npm install
)

REM ===== 2) make sure the electron binary is actually present =====
call :ensure_electron
if errorlevel 1 (
  echo   [x] Could not get Electron working. See messages above.
  echo.
  pause
  exit /b 1
)

REM ===== 3) build the UI (non-fatal: a pre-compiled app.js ships too) =====
echo   [*] Building the interface...
call npm run build
if errorlevel 1 echo   [i] Build step skipped - using the bundled app.js.

REM ===== 4) launch =====
echo   [*] Launching... enjoy the music! ^<3
echo.
node "node_modules\electron\cli.js" .
if errorlevel 1 (
  echo.
  echo   [x] The app exited with an error.
  pause
)
exit /b 0

REM ============================================================
:ensure_electron
if exist "node_modules\electron\path.txt" (
  echo   [ok] Electron binary present.
  exit /b 0
)
echo   [*] Electron binary missing - repairing...

REM -- attempt A: run electron's own installer script
if exist "node_modules\electron\install.js" (
  echo   [a] Running electron install.js ...
  node "node_modules\electron\install.js" 2>nul
  if exist "node_modules\electron\path.txt" ( echo   [ok] Fixed via install.js. & exit /b 0 )
)

REM -- attempt B: retry through a mirror
echo   [b] Retrying download via mirror...
set "ELECTRON_MIRROR=https://github.com/electron/electron/releases/download/"
if exist "node_modules\electron\install.js" node "node_modules\electron\install.js" 2>nul
set "ELECTRON_MIRROR="
if exist "node_modules\electron\path.txt" ( echo   [ok] Fixed via mirror. & exit /b 0 )

REM -- attempt C: download the matching zip from GitHub via a generated PowerShell script
echo   [c] Downloading electron-v%ELECTRON_VERSION%-win32-x64.zip from GitHub...
if not exist "node_modules\electron" mkdir "node_modules\electron" >nul 2>nul
set "PS1=%TEMP%\kawaii_electron_fix.ps1"
if exist "%PS1%" del /q "%PS1%" >nul 2>nul
>>"%PS1%" echo $ErrorActionPreference='Stop'
>>"%PS1%" echo [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12
>>"%PS1%" echo $ver='%ELECTRON_VERSION%'
>>"%PS1%" echo $zip=Join-Path $env:TEMP 'kawaii_electron.zip'
>>"%PS1%" echo $url='https://github.com/electron/electron/releases/download/v' + $ver + '/electron-v' + $ver + '-win32-x64.zip'
>>"%PS1%" echo $dist='node_modules\electron\dist'
>>"%PS1%" echo Write-Host '      downloading...'
>>"%PS1%" echo Invoke-WebRequest -UseBasicParsing -Uri $url -OutFile $zip
>>"%PS1%" echo Remove-Item -Recurse -Force $dist -ErrorAction SilentlyContinue
>>"%PS1%" echo $null = New-Item -ItemType Directory -Force -Path $dist
>>"%PS1%" echo Write-Host '      extracting...'
>>"%PS1%" echo Expand-Archive -Path $zip -DestinationPath $dist -Force
>>"%PS1%" echo Set-Content -Path 'node_modules\electron\path.txt' -Value 'electron.exe' -NoNewline
>>"%PS1%" echo Remove-Item $zip -Force -ErrorAction SilentlyContinue
powershell -NoProfile -ExecutionPolicy Bypass -File "%PS1%"
del /q "%PS1%" >nul 2>nul
if exist "node_modules\electron\dist\electron.exe" (
  if not exist "node_modules\electron\path.txt" (>"node_modules\electron\path.txt" echo electron.exe)
  echo   [ok] Fixed via direct GitHub download.
  exit /b 0
)

REM -- attempt D: nuke node_modules and reinstall from scratch
echo   [d] Last resort - wiping node_modules and reinstalling...
rmdir /s /q "node_modules" >nul 2>nul
call npm install
if exist "node_modules\electron\path.txt" ( echo   [ok] Fixed via clean reinstall. & exit /b 0 )

exit /b 1
