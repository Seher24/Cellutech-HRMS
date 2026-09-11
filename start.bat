@echo off
setlocal
cd /d "%~dp0"

echo.
echo Starting Cellutech HRMS demo...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1"
set EXITCODE=%ERRORLEVEL%

if %EXITCODE% neq 0 (
  echo.
  echo Startup failed with exit code %EXITCODE%.
  pause
)

endlocal
exit /b %EXITCODE%
