#!/bin/bash
# MtaaLink - Stop Script
# Stops all MtaaLink servers

echo "Stopping MtaaLink servers..."

# Stop backend
pkill -f "uvicorn app.main:app" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Backend stopped"
else
    echo "ℹ️  Backend not running"
fi

# Stop frontend
pkill -f "python3 -m http.server 3000" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Frontend stopped"
else
    echo "ℹ️  Frontend not running"
fi

echo ""
echo "All servers stopped."
