@echo off
cd /d "%~dp0"
echo Running Database Setup...
powershell -NoProfile -ExecutionPolicy Bypass -File "database\scripts\setup_db.ps1"
pause
