#!/bin/bash
# Pull required Ollama models for DocuGab

set -e

echo "📥 Pulling Ollama models..."
echo ""

# LLM model for chat
echo "🤖 Pulling llama3.2 (LLM for chat)..."
ollama pull llama3.2

echo ""

# Embedding model for document search
echo "📊 Pulling nomic-embed-text (embeddings)..."
ollama pull nomic-embed-text

echo ""
echo "✅ All models pulled successfully!"
echo ""
echo "Available models:"
ollama list
