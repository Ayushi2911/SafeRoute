@echo off
setlocal
cd /d "%~dp0"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Start-SafeRoute.ps1"
if errorlevel 1 (
  echo.
  echo SafeRoute could not be started. Check the server and MySQL setup.
  pause
)

endlocal
