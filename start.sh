#!/bin/bash
# MtaaLink - Start Script
# Starts both backend and frontend servers

echo "=========================================="
echo "  MtaaLink - Village Management System"
echo "=========================================="
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Activate virtual environment
if [ -d "venv" ]; then
    source venv/bin/activate
    echo "✅ Virtual environment activated"
fi

# Stop any existing servers
echo "Stopping existing servers..."
pkill -f "uvicorn app.main:app" 2>/dev/null
pkill -f "python3 -m http.server" 2>/dev/null
sleep 1

# Start backend server
echo "Starting backend server on port 8000..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Wait for backend to start
sleep 3

# Start frontend server
echo "Starting frontend server on port 3000..."
cd frontend
python3 -m http.server 3000 > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo "   Frontend PID: $FRONTEND_PID"

echo ""
echo "=========================================="
echo "  ✅ MtaaLink is now running!"
echo "=========================================="
echo ""
echo "  🌐 Frontend:  http://localhost:3000"
echo "  🔧 Backend:   http://localhost:8000"
echo "  📖 API Docs:  http://localhost:8000/docs"
echo "  🏥 Health:    http://localhost:8000/health"
echo ""
echo "  📋 To stop:   ./stop.sh"
echo "  📋 To view logs: tail -f logs/backend.log"
echo "  📋 To view logs: tail -f logs/frontend.log"
echo ""
echo "=========================================="
