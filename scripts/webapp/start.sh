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

echo ""
# Run health check
./scripts/webapp/health.sh
