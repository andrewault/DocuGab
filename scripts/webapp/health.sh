#!/bin/bash
# Check health of DocuTok services

set -e

cd "$(dirname "$0")/../.."

echo "🩺 Checking DocuTok health..."
echo ""

# Container status
echo "📦 Containers:"
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || docker compose ps

echo ""

# Backend health
echo "🔌 Backend API:"
if curl -s http://localhost:8007/health 2>/dev/null; then
    echo ""
else
    echo "❌ Backend not responding"
fi

echo ""

# Ollama models
echo "🤖 Ollama models:"
docker exec docutok-ollama ollama list 2>/dev/null || echo "❌ Ollama not responding"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 DocuTok URLs"
echo ""
echo "   Frontend:  http://localhost:5177"
echo "   API:       http://localhost:8007"
echo "   API Docs:  http://localhost:8007/docs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
