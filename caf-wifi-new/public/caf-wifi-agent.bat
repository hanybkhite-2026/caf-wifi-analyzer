@echo off
title CAF-WIFI Local Agent
color 0B

echo.
echo  =========================================
echo   CAF-WIFI Local Agent v1.0 - Windows
echo  =========================================
echo.

:: Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  ERROR: Node.js is not installed.
    echo.
    echo  Download free from: https://nodejs.org
    echo  Install LTS version, then run this again.
    echo.
    pause
    exit /b 1
)

:: Use agent.js in same folder if it exists, else download it
set "JSFILE=%~dp0caf-wifi-agent.js"
if not exist "%JSFILE%" (
    echo  Downloading agent...
    powershell -NoProfile -Command "Invoke-WebRequest -Uri 'https://caf-wifi-new.vercel.app/caf-wifi-agent.js' -OutFile '%JSFILE%'"
    if not exist "%JSFILE%" (
        echo  Download failed. Check internet connection.
        pause & exit /b 1
    )
    echo  Downloaded OK!
    echo.
)

echo  Starting WiFi scanner...
echo  Press Ctrl+C to stop
echo.

node "%JSFILE%"
pause
