@echo off
echo.
echo  CAF-WIFI Local Agent
echo  ====================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  ERROR: Node.js is not installed!
    echo.
    echo  Please download and install Node.js from:
    echo  https://nodejs.org/en/download
    echo.
    pause
    exit /b 1
)

echo  Starting agent...
echo  Press Ctrl+C to stop
echo.

node "%~dp0caf-wifi-agent.js"
pause
