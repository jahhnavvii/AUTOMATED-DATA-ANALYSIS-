# AutoDS Backend Startup Script (Windows PowerShell)

Write-Host "=== Starting AutoDS Backend ===" -ForegroundColor Cyan

# 1. Kill existing backend processes
Write-Host "Cleaning up existing processes..." -ForegroundColor Yellow
Stop-Process -Name "python", "uvicorn" -Force -ErrorAction SilentlyContinue

# 2. Check Redis
Write-Host "Checking Redis..." -ForegroundColor Yellow
$redisCheck = Test-NetConnection -ComputerName localhost -Port 6379 -InformationLevel Quiet
if (-not $redisCheck) {
    Write-Host "WARNING: Redis is not running on port 6379." -ForegroundColor Red
    Write-Host "Background tasks (Celery) will fail without Redis." -ForegroundColor Red
    Write-Host "Please start Redis or install it (e.g., 'winget install Redis.Redis')." -ForegroundColor Red
} else {
    Write-Host "Redis is running." -ForegroundColor Green
}

# 3. Start Backend (FastAPI/Uvicorn)
Write-Host "Starting FastAPI Backend..." -ForegroundColor Yellow
$Env:PYTHONPATH = ".;backend"
Start-Process -FilePath "venv\Scripts\python.exe" -ArgumentList "-m uvicorn backend.app.main:app --reload --port 8000" -NoNewWindow -RedirectStandardOutput "backend_uvicorn.log" -RedirectStandardError "backend_uvicorn_err.log"

# 4. Start Celery Worker
Write-Host "Starting Celery Worker..." -ForegroundColor Yellow
Start-Process -FilePath "venv\Scripts\python.exe" -ArgumentList "-m celery -A backend.app.workers.celery_worker worker --pool=solo --loglevel=info" -NoNewWindow -RedirectStandardOutput "backend_celery.log" -RedirectStandardError "backend_celery_err.log"

Write-Host "Backend services are starting in the background." -ForegroundColor Green
Write-Host "Check 'backend_uvicorn.log' and 'backend_celery.log' for details." -ForegroundColor Gray

# 5. Wait for Startup and Check Health
Write-Host "Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:8000/health" -ErrorAction Stop
    if ($health.status -eq "ok") {
        Write-Host "SUCCESS: Backend is healthy and running at http://localhost:8000" -ForegroundColor Green
    }
} catch {
    Write-Host "ERROR: Backend failed to start or is not responding yet." -ForegroundColor Red
    Write-Host "Check 'backend_uvicorn_err.log' for errors." -ForegroundColor Gray
}

Write-Host "=== AutoDS Backend Startup Complete ===" -ForegroundColor Cyan
