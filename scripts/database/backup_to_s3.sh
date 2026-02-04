#!/bin/bash
set -e

# Configuration
BUCKET_NAME="${AWS_S3_BACKUP_BUCKET:-docutok-db-backups}"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
BACKUP_NAME="backup-${TIMESTAMP}.sql.gz"
S3_PATH="s3://${BUCKET_NAME}/${BACKUP_NAME}"

echo "Starting backup to ${S3_PATH}..."

# Check required env vars
if [ -z "$POSTGRES_PASSWORD" ]; then
    echo "Error: POSTGRES_PASSWORD is not set"
    exit 1
fi

if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "Error: AWS credentials are not set"
    exit 1
fi

# Stream pg_dump -> gzip -> aws s3 cp
export PGPASSWORD="$POSTGRES_PASSWORD"

pg_dump -h "${DB_HOST:-docutok-db-postgresql}" -U "${POSTGRES_USER:-docutok}" "${POSTGRES_DB:-docutok}" \
    | gzip \
    | aws s3 cp - "${S3_PATH}"

echo "Backup upload complete: ${S3_PATH}"
