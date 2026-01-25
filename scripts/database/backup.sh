#!/bin/bash
# Database backup script for DocuTok
# Creates a compressed PostgreSQL dump file

set -e

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Configuration
CONTAINER_NAME="docutok-db"
DB_NAME="docugab"
DB_USER="docugab"
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

# Verify the backup was created
if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
    echo "✓ Backup created successfully: $BACKUP_FILE ($SIZE)"
else
    echo "✗ Backup failed!"
    exit 1
fi
