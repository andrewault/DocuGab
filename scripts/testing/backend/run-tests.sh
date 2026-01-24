#!/bin/bash
# Backend test runner

set -e

cd "$(dirname "$0")/../../.."

echo "🧪 Running backend tests..."
cd backend
PYTHONPATH=. uv run pytest tests/ "$@"
