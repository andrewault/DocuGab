#!/bin/bash
# Pull required Ollama models for DocuTalk

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
fi

EMBEDDING_MODEL=${EMBEDDING_MODEL:-nomic-embed-text}
LLM_MODEL=${LLM_MODEL:-llama3.2}

echo "🤖 Pulling Ollama models..."
echo ""

# Check if Ollama container is running
if ! docker ps --filter "name=docutalk-ollama" --format "{{.Names}}" | grep -q "docutalk-ollama"; then
    echo "⚠️  Ollama container not running. Starting it..."
    docker compose up -d ollama
    echo "Waiting for Ollama to be ready..."
    sleep 10
fi

# Pull embedding model
echo "📥 Pulling embedding model: $EMBEDDING_MODEL"
docker exec docutalk-ollama ollama pull $EMBEDDING_MODEL

# Pull LLM model
echo "📥 Pulling LLM model: $LLM_MODEL"
docker exec docutalk-ollama ollama pull $LLM_MODEL

echo ""
echo "✅ Models pulled successfully!"
echo ""
echo "Available models:"
docker exec docutalk-ollama ollama list
