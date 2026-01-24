#!/bin/bash
# Check health of DocuTalk webapp services

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
fi

BACKEND_PORT=${BACKEND_PORT:-8007}
VITE_PORT=${VITE_PORT:-5177}

echo "🏥 DocuTalk Health Check"
echo "========================"
echo ""

# Check backend
echo "Backend (port $BACKEND_PORT):"
if lsof -i :$BACKEND_PORT > /dev/null 2>&1; then
    echo "  ✅ Port is open"
    
    # Check health endpoint
    HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$BACKEND_PORT/health" 2>/dev/null)
    if [ "$HEALTH_RESPONSE" = "200" ]; then
        echo "  ✅ Health endpoint: OK"
        HEALTH_DATA=$(curl -s "http://localhost:$BACKEND_PORT/health" 2>/dev/null)
        echo "     Response: $HEALTH_DATA"
    else
        echo "  ❌ Health endpoint: HTTP $HEALTH_RESPONSE"
    fi
    
    # Check database health
    DB_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$BACKEND_PORT/health/db" 2>/dev/null)
    if [ "$DB_RESPONSE" = "200" ]; then
        echo "  ✅ Database: connected"
        DB_DATA=$(curl -s "http://localhost:$BACKEND_PORT/health/db" 2>/dev/null)
        echo "     Response: $DB_DATA"
    else
        echo "  ❌ Database: HTTP $DB_RESPONSE"
    fi
else
    echo "  ❌ Not running"
fi

echo ""

# Check frontend
echo "Frontend (port $VITE_PORT):"
if lsof -i :$VITE_PORT > /dev/null 2>&1; then
    echo "  ✅ Port is open"
    
    # Check if serving content
    FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$VITE_PORT/" 2>/dev/null)
    if [ "$FRONTEND_RESPONSE" = "200" ]; then
        echo "  ✅ Serving content: OK"
    else
        echo "  ⚠️  Response: HTTP $FRONTEND_RESPONSE"
    fi
else
    echo "  ❌ Not running"
fi

echo ""

# Check Docker services
echo "Docker (PostgreSQL):"
if docker ps --filter "name=docutalk-db" --format "{{.Names}}" | grep -q "docutalk-db"; then
    echo "  ✅ docutalk-db container running"
    
    # Check if we can connect
    if docker exec docutalk-db pg_isready -U docutalk > /dev/null 2>&1; then
        echo "  ✅ PostgreSQL is ready"
    else
        echo "  ⚠️  PostgreSQL not ready"
    fi
else
    echo "  ℹ️  docutalk-db container not running"
    echo "     (Using local PostgreSQL or not started)"
fi

echo ""
echo "========================"
echo ""
echo "🔗 Quick Links:"
echo "   Frontend: http://localhost:$VITE_PORT"
echo "   Backend API: http://localhost:$BACKEND_PORT"
echo "   Swagger Docs: http://localhost:$BACKEND_PORT/docs"
