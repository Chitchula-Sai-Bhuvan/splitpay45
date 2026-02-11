@echo off
cd /d "%~dp0\frontend"
echo Starting Frontend...
call npm run dev
pause
