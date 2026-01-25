#!/bin/bash
# Stop the DocuTok application

set -e

cd "$(dirname "$0")/../.."

echo "🛑 Stopping DocuTok..."
docker compose down

echo ""
echo "🦙 Stopping Ollama..."
if pgrep -x "ollama" > /dev/null; then
    pkill -x ollama
    echo "   Ollama stopped"
else
    echo "   Ollama was not running"
fi

echo ""
echo "✅ DocuTok stopped"
