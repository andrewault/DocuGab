#!/bin/bash
# Check health of DocuTok services

set -e

cd "$(dirname "$0")/../.."

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🩺 Checking DocuTok health..."
echo ""

# Container status
echo "📦 Containers:"
CONTAINER_STATUS=$(docker compose ps --format "{{.Name}}\t{{.Status}}" 2>/dev/null)
echo "$CONTAINER_STATUS" | while IFS=$'\t' read -r name status; do
    if [[ "$status" =~ "Up" ]] && [[ "$status" =~ "healthy" || ! "$status" =~ "health" ]]; then
        echo -e "   ${GREEN}✓${NC} $name: $status"
    else
        echo -e "   ${RED}✗${NC} $name: $status"
    fi
done

echo ""

# Backend health
echo "🔌 Backend API:"
if BACKEND_RESPONSE=$(curl -s http://localhost:8007/health 2>/dev/null); then
    if [[ "$BACKEND_RESPONSE" =~ "healthy" ]]; then
        echo -e "   ${GREEN}✓ Backend is healthy${NC}"
    else
        echo -e "   ${YELLOW}⚠ Backend responded but status unknown${NC}"
        echo "   Response: $BACKEND_RESPONSE"
    fi
else
    echo -e "   ${RED}✗ Backend not responding${NC}"
fi

# Database health
if DB_RESPONSE=$(curl -s http://localhost:8007/health/db 2>/dev/null); then
    if [[ "$DB_RESPONSE" =~ "connected" ]]; then
        echo -e "   ${GREEN}✓ Database connected${NC}"
    else
        echo -e "   ${RED}✗ Database issue${NC}"
        echo "   Response: $DB_RESPONSE"
    fi
fi

echo ""

# Frontend health
echo "🖥️  Frontend:"
if curl -s -I http://localhost:5177 > /dev/null; then
    echo -e "   ${GREEN}✓ Frontend is accessible${NC}"
else
    echo -e "   ${RED}✗ Frontend not responding${NC}"
fi

echo ""

# Ollama models (native installation)
echo "🤖 Ollama models:"
if OLLAMA_RESPONSE=$(curl -s http://localhost:11434/api/tags 2>/dev/null); then
    MODEL_COUNT=$(echo "$OLLAMA_RESPONSE" | grep -o '"name":"[^"]*"' | wc -l | tr -d ' ')
    if [ "$MODEL_COUNT" -gt 0 ]; then
        echo "$OLLAMA_RESPONSE" | grep -o '"name":"[^"]*"' | cut -d'"' -f4 | while read model; do
            echo -e "   ${GREEN}✓${NC} $model"
        done
    else
        echo -e "   ${YELLOW}⚠ Ollama running but no models found${NC}"
    fi
else
    echo -e "   ${RED}✗ Ollama not responding${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 DocuTok URLs"
echo ""
echo "   Frontend:  http://localhost:5177"
echo "   API:       http://localhost:8007"
echo "   API Docs:  http://localhost:8007/docs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
