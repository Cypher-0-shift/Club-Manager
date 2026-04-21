@echo off
title Club Task Manager
color 0A

echo =============================================
echo        CLUB TASK MANAGER - Starting Up
echo =============================================
echo.

:: Start FastAPI backend in a new window
echo [1/2] Starting FastAPI backend on port 8000...
start "CTM Backend" cmd /k "cd /d "%~dp0backend" && uvicorn app.main:app --reload --port 8000"

:: Small delay so backend starts first
timeout /t 2 /nobreak >nul

:: Start Next.js frontend in a new window
echo [2/2] Starting Next.js frontend on port 3000...
start "CTM Frontend" cmd /k "cd /d "%~dp0frontend" && pnpm run dev"

:: Wait then open browser
echo.
echo Waiting for servers to be ready...
timeout /t 5 /nobreak >nul

echo Opening app in browser...
start http://localhost:3000

echo.
echo =============================================
echo  Backend  → http://localhost:8000
echo  Frontend → http://localhost:3000
echo  API Docs → http://localhost:8000/v1/docs
echo =============================================
echo.
echo Both servers are running in separate windows.
echo Close those windows to stop the servers.
echo.
pause
