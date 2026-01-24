#!/bin/bash
# Stop the DocuGab application

set -e

cd "$(dirname "$0")/../.."

echo "🛑 Stopping DocuGab..."
docker compose down

echo "✅ DocuGab stopped"
