#!/bin/bash
echo "=== Starting AutoDS Locally ==="

# Start PostgreSQL (macOS Homebrew — adjust for your OS)
brew services start postgresql@15 2>/dev/null || sudo service postgresql start

# Start Redis (macOS Homebrew — adjust for your OS)
brew services start redis 2>/dev/null || sudo service redis-server start

echo "Waiting for services..."
sleep 2

# Ollama
ollama serve &

# Backend
source venv/Scripts/activate 2>/dev/null || source venv/bin/activate 2>/dev/null || true
uvicorn backend.app.main:app --reload --port 8000 &

# Celery
celery -A backend.app.workers.celery_worker worker --loglevel=info &

# Frontend (foreground)
cd ../frontend
npm run dev

echo "AutoDS live at http://localhost:5173"
