#!/bin/bash
# Database backup script for DocuTok
# Creates a compressed PostgreSQL dump file

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
CONTAINER_NAME="docutok-db"
DB_NAME="${POSTGRES_DB:-docutok}"
DB_USER="${POSTGRES_USER:-docutok}"
BACKUP_DIR="$PROJECT_ROOT/dbbackups"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
BACKUP_FILE="docutok-backup-${TIMESTAMP}.sql.gz"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "Creating database backup..."
echo "  Container: $CONTAINER_NAME"
echo "  Database: $DB_NAME"
echo "  Output: $BACKUP_DIR/$BACKUP_FILE"

# Create the backup
docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_DIR/$BACKUP_FILE"

# Verify the backup was created and has size
if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    SIZE_BYTES=$(wc -c < "$BACKUP_DIR/$BACKUP_FILE" | tr -d ' ')
    SIZE_HUMAN=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
    
    # Check if larger than 100 bytes (empty gzip is 20 bytes)
    if [ "$SIZE_BYTES" -gt 100 ]; then
        echo "✓ Backup created successfully: $BACKUP_FILE ($SIZE_HUMAN)"
    else
        echo "✗ Backup failed: File is too small ($SIZE_BYTES bytes)"
        rm "$BACKUP_DIR/$BACKUP_FILE"
        exit 1
    fi
else
    echo "✗ Backup failed: File not found!"
    exit 1
fi
