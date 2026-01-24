#!/bin/bash
# Start DocuTalk webapp services (frontend + backend)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
else
    echo "Error: .env file not found at $PROJECT_ROOT/.env"
    exit 1
fi

BACKEND_PORT=${BACKEND_PORT:-8007}
VITE_PORT=${VITE_PORT:-5177}

echo "🚀 Starting DocuTalk services..."
echo "   Backend: http://localhost:$BACKEND_PORT"
echo "   Frontend: http://localhost:$VITE_PORT"
echo ""

# Check if services are already running
if lsof -i :$BACKEND_PORT > /dev/null 2>&1; then
    echo "⚠️  Port $BACKEND_PORT is already in use. Stop existing services first."
    exit 1
fi

if lsof -i :$VITE_PORT > /dev/null 2>&1; then
    echo "⚠️  Port $VITE_PORT is already in use. Stop existing services first."
    exit 1
fi

# Create logs directory
mkdir -p "$PROJECT_ROOT/logs"

# Start backend
echo "Starting backend on port $BACKEND_PORT..."
cd "$PROJECT_ROOT/backend"
nohup uv run uvicorn app.main:app --host 0.0.0.0 --port $BACKEND_PORT --reload > "$PROJECT_ROOT/logs/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$PROJECT_ROOT/logs/backend.pid"

# Start frontend
echo "Starting frontend on port $VITE_PORT..."
cd "$PROJECT_ROOT/frontend"
nohup npm run dev > "$PROJECT_ROOT/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$PROJECT_ROOT/logs/frontend.pid"

# Wait for services to start
sleep 2

# Verify services are running
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo "✅ Backend started (PID: $BACKEND_PID)"
else
    echo "❌ Backend failed to start. Check logs/backend.log"
fi

if kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "✅ Frontend started (PID: $FRONTEND_PID)"
else
    echo "❌ Frontend failed to start. Check logs/frontend.log"
fi

echo ""
echo "📄 Logs available at:"
echo "   Backend:  $PROJECT_ROOT/logs/backend.log"
echo "   Frontend: $PROJECT_ROOT/logs/frontend.log"
echo ""
echo "🔗 Access:"
echo "   Frontend: http://localhost:$VITE_PORT"
echo "   Backend API: http://localhost:$BACKEND_PORT"
echo "   Swagger Docs: http://localhost:$BACKEND_PORT/docs"
