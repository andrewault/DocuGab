#!/bin/bash
# Run database migrations manually
# Usage: ./scripts/database/migrate.sh

set -e

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "Running database migrations..."

docker exec docutok-backend sh -c "cd /app && uv run python -m alembic upgrade head"

echo "✓ Migrations complete"
