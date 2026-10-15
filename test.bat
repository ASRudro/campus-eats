@echo off
title CampusEats - Automated Test Suite
echo ========================================================
echo   Running CampusEats Automated API Tests...
echo ========================================================
echo.
cd backend
node test_api.js
echo.
echo ========================================================
echo   Test Execution Finished.
echo ========================================================
pause
