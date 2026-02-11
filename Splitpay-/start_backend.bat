@echo off
cd /d "%~dp0\backend"
echo Starting Backend...
call npm run dev
pause
