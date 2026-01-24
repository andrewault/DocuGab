#!/bin/bash
# Stop DocuTalk webapp services (frontend + backend)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
fi

BACKEND_PORT=${BACKEND_PORT:-8007}
VITE_PORT=${VITE_PORT:-5177}

echo "🛑 Stopping DocuTalk services..."

# Stop using PID files if they exist
stopped_backend=false
stopped_frontend=false

if [ -f "$PROJECT_ROOT/logs/backend.pid" ]; then
    BACKEND_PID=$(cat "$PROJECT_ROOT/logs/backend.pid")
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID 2>/dev/null
        echo "✅ Backend stopped (PID: $BACKEND_PID)"
        stopped_backend=true
    fi
    rm -f "$PROJECT_ROOT/logs/backend.pid"
fi

if [ -f "$PROJECT_ROOT/logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$PROJECT_ROOT/logs/frontend.pid")
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID 2>/dev/null
        echo "✅ Frontend stopped (PID: $FRONTEND_PID)"
        stopped_frontend=true
    fi
    rm -f "$PROJECT_ROOT/logs/frontend.pid"
fi

# Fallback: kill by port if PID files didn't work
if ! $stopped_backend; then
    BACKEND_PIDS=$(lsof -ti :$BACKEND_PORT 2>/dev/null)
    if [ -n "$BACKEND_PIDS" ]; then
        echo "$BACKEND_PIDS" | xargs kill 2>/dev/null
        echo "✅ Backend stopped (port $BACKEND_PORT)"
    else
        echo "ℹ️  Backend not running on port $BACKEND_PORT"
    fi
fi

if ! $stopped_frontend; then
    FRONTEND_PIDS=$(lsof -ti :$VITE_PORT 2>/dev/null)
    if [ -n "$FRONTEND_PIDS" ]; then
        echo "$FRONTEND_PIDS" | xargs kill 2>/dev/null
        echo "✅ Frontend stopped (port $VITE_PORT)"
    else
        echo "ℹ️  Frontend not running on port $VITE_PORT"
    fi
fi

echo ""
echo "All services stopped."
