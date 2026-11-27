@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Install-ZaraStartup.ps1" -LaunchNow
if errorlevel 1 (
  echo.
  echo Zara startup setup failed. Read the message above.
)
echo.
pause
