#!/bin/bash
# Start the DocuTok application

set -e

cd "$(dirname "$0")/../.."

# Start Ollama if not already running
echo "🦙 Starting Ollama..."
if pgrep -x "ollama" > /dev/null; then
    echo "   Ollama already running"
else
    ollama serve > /dev/null 2>&1 &
    sleep 2
    echo "   Ollama started"
fi

echo ""
echo "🚀 Starting DocuTok..."
docker compose up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 5

# Check health
if curl -s http://localhost:8007/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "⏳ Backend starting up..."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 DocuTok is running!"
echo ""
echo "   Frontend:  http://localhost:5177"
echo "   API:       http://localhost:8007"
echo "   API Docs:  http://localhost:8007/docs"
echo "   Ollama:    http://localhost:11434"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
