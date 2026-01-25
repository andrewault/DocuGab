#!/bin/bash
# Stop the DocuGab application

set -e

cd "$(dirname "$0")/../.."

echo "🛑 Stopping DocuGab..."
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
echo "✅ DocuGab stopped"
