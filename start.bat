@echo off
title CampusEats - Starting Project
echo ========================================================
echo   Starting CampusEats - Skip the Lunch Queue
echo ========================================================
echo.
echo 1. Starting Backend API Server (Port 5000)...
start "CampusEats - Backend (Port 5000)" cmd /k "cd backend && npm start"

timeout /t 2 /nobreak >nul

echo 2. Starting Frontend Client (Port 3000)...
start "CampusEats - Frontend (Port 3000)" cmd /k "cd frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo 3. Opening Application in your default browser...
start http://localhost:3000

echo.
echo ========================================================
echo   CampusEats is now running!
echo   - Frontend: http://localhost:3000
echo   - Backend:  http://localhost:5000/api
echo ========================================================
echo.
pause
