@echo off
echo ========================================
echo   FluentEase Backend Server
echo ========================================
echo.

REM Check if virtual environment exists
if not exist "venv\" (
    echo Creating virtual environment...
    python -m venv venv
    echo.
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate
echo.

REM Check if requirements are installed
echo Checking dependencies...
pip install -r requirements.txt --quiet
echo.

REM Check for .env file
if not exist ".env" (
    echo WARNING: .env file not found!
    echo Please create .env file with your configuration.
    echo See .env.example for reference.
    echo.
    pause
    exit /b 1
)

REM Check for Firebase credentials
if not exist "firebase-credentials.json" (
    echo WARNING: firebase-credentials.json not found!
    echo.
    echo Please follow these steps:
    echo 1. Go to Firebase Console: https://console.firebase.google.com/
    echo 2. Select your project
    echo 3. Go to Project Settings ^> Service Accounts
    echo 4. Click "Generate new private key"
    echo 5. Save the file as "firebase-credentials.json" in the backend folder
    echo.
    echo See FIREBASE_SETUP.md for detailed instructions.
    echo.
    pause
    exit /b 1
)

REM Start the server
echo Starting FluentEase Backend Server...
echo Server will run on: http://127.0.0.1:8000
echo API Documentation: http://127.0.0.1:8000/docs
echo.
echo Press CTRL+C to stop the server
echo.

uvicorn app.main:app --reload

pause