@echo off
REM EvenUP Startup Script - Starts all required services

echo.
echo ==================================================
echo       EvenUP - Startup Script
echo ==================================================
echo.

REM Check if MongoDB is running
echo Checking MongoDB...
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] MongoDB is running
) else (
    echo [INFO] Starting MongoDB...
    start mongod
    timeout /t 3 /nobreak
)

REM Start backend in a new terminal
echo.
echo Starting Backend (FastAPI)...
start cmd /k "cd backend && venv\Scripts\activate && uvicorn app.main:app --reload"
timeout /t 3 /nobreak

REM Start frontend in a new terminal  
echo.
echo Starting Frontend (React)...
start cmd /k "cd frontend && npm run dev"
timeout /t 3 /nobreak

echo.
echo ==================================================
echo Services started!
echo.
echo Frontend:  http://localhost:5173 (or 5174)
echo Backend:   http://127.0.0.1:8000
echo API Docs:  http://127.0.0.1:8000/docs
echo.
echo To verify everything is working:
echo   python verify_setup.py
echo.
echo ==================================================
echo.
pause
