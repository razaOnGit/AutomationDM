@echo off
echo 🚀 Starting Instagram Comment-to-DM Demo
echo.

echo 📍 Starting Backend Server...
cd backend
start "Backend Server" cmd /k "node demo-server.js"

echo ⏳ Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo 📱 Starting Frontend...
cd ..\frontend
start "Frontend App" cmd /k "npm start"

echo.
echo ✅ Demo Started Successfully!
echo.
echo 📋 What's Running:
echo    Backend: http://localhost:5000
echo    Frontend: http://localhost:3000
echo.
echo 🎯 Next Steps:
echo    1. Wait for both servers to fully start
echo    2. Frontend will open automatically in browser
echo    3. Click "Try Demo Mode" to login
echo.
echo Press any key to close this window...
pause > nul