#!/bin/bash
# Copies the schema from the development database to the testing database.
# WARNING: This will drop and recreate the testing database!

set -e
set -o pipefail

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Load .env file if it exists
if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
fi

# Configuration
# Default to values that work with the docker-compose setup if env vars aren't set
DB_HOST="localhost"
DB_PORT="${DB_HOST_PORT:-5433}"
DB_USER="${POSTGRES_USER:-docutok}"
DB_PASS="${POSTGRES_PASSWORD:-docutok_secret}"

SOURCE_DB="${POSTGRES_DB:-docutok}"
TARGET_DB="${POSTGRES_DB:-docutok}_test"

echo "=========================================================="
echo "Schema Copy: Dev -> Testing"
echo "=========================================================="
echo "Source DB: $SOURCE_DB"
echo "Target DB: $TARGET_DB"
echo "Host:      $DB_HOST:$DB_PORT"
echo "User:      $DB_USER"
echo "=========================================================="

# Export PGPASSWORD so psql/pg_dump don't prompt
export PGPASSWORD="$DB_PASS"

# 1. Terminate connections to the target database
echo "Disconnecting active clients from $TARGET_DB..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d template1 -c "
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = '$TARGET_DB' 
  AND pid <> pg_backend_pid();" > /dev/null

# 2. Drop the target database if it exists
echo "Dropping target database $TARGET_DB..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d template1 -c "DROP DATABASE IF EXISTS \"$TARGET_DB\";"

# 3. Create the target database
echo "Creating target database $TARGET_DB..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d template1 -c "CREATE DATABASE \"$TARGET_DB\";"

# 4. Dump schema from Source and pipe to Target
echo "Copying schema..."
# connection options inside docker are local to the container
# We use docker exec for pg_dump to ensure version compatibility with the server
docker exec docutok-db pg_dump -U "$DB_USER" --schema-only "$SOURCE_DB" | \
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TARGET_DB" > /dev/null

echo "✅ Schema copy complete!"
