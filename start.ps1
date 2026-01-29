# EduSphere Project Startup Script
# This script starts both backend and frontend servers

Write-Host "🚀 Starting EduSphere Project..." -ForegroundColor Cyan
Write-Host ""

# Start Backend in a new window
Write-Host "📦 Starting Backend (Django)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd c:\edusphereproject\backend; .\venv\Scripts\activate; python manage.py runserver"

# Wait a moment for backend to initialize
Start-Sleep -Seconds 2

# Start Frontend in a new window
Write-Host "⚛️  Starting Frontend (React)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd c:\edusphereproject\frontend; npm run dev"

Write-Host ""
Write-Host "✅ Both servers are starting!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend will be at: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend will be at: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit this window (servers will keep running)..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
