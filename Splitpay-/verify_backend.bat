@echo off
cd /d "%~dp0\backend"
echo Running Backend Verification...
call npx ts-node verify_full_flow.ts
pause
