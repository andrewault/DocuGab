#!/bin/bash
# Restart the DocuGab application

set -e

cd "$(dirname "$0")/../.."

echo "🔄 Restarting DocuGab..."
docker compose down
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
echo "🌐 DocuGab is running!"
echo ""
echo "   Frontend:  http://localhost:5177"
echo "   API:       http://localhost:8007"
echo "   API Docs:  http://localhost:8007/docs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
