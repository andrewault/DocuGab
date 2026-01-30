#!/bin/bash
# Restart the DocuTok application

set -e

cd "$(dirname "$0")/../.."

echo "🔄 Restarting DocuTok..."

# Stop Docker services
docker compose down

# Restart Ollama
echo ""
echo "🦙 Restarting Ollama..."
if pgrep -x "ollama" > /dev/null; then
    pkill -x ollama
    sleep 1
fi
ollama serve > /dev/null 2>&1 &
sleep 2
echo "   Ollama started"

# Start Docker services
echo ""
echo "🚀 Starting DocuTok..."
docker compose up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 5

echo ""
# Run health check
./scripts/webapp/health.sh
