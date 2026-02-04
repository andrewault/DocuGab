#!/bin/bash
set -e

# Configuration
# Read from root .env file if it exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Ensure required variables are present
if [ -z "$ADMIN_USERNAME" ] || [ -z "$ADMIN_PASSWORD" ]; then
    echo "❌ Error: ADMIN_USERNAME or ADMIN_PASSWORD not found in .env"
    exit 1
fi

echo "🔐 Creating Admin User: $ADMIN_USERNAME"

# Generate Password Hash using Python (matching backend logic: bcrypt)
# We use python3 -c to run a small script that outputs the hash
HASH=$(python3 -c "import bcrypt; print(bcrypt.hashpw('$ADMIN_PASSWORD'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'))")
echo "   Hash generated."

# SQL Command
SQL="INSERT INTO users (uuid, email, password_hash, full_name, role, is_active, is_verified, created_at, updated_at) 
VALUES (gen_random_uuid(), '$ADMIN_USERNAME', '$HASH', 'Admin User', 'admin', true, true, NOW(), NOW())
ON CONFLICT (email) DO UPDATE 
SET password_hash = '$HASH', role='admin', is_active=true, is_verified=true, updated_at=NOW();"

# Identify Postgres Pod
DB_POD=$(kubectl get pods -l app=docutok-db -o jsonpath="{.items[0].metadata.name}")
if [ -z "$DB_POD" ]; then
    echo "❌ Error: Could not find postgres pod (app=docutok-db)"
    exit 1
fi

echo "🚀 Executing SQL on pod: $DB_POD"
kubectl exec $DB_POD -- env PGPASSWORD=$POSTGRES_PASSWORD psql -U $POSTGRES_USER -d $POSTGRES_DB -c "$SQL"

echo "✅ Admin user created/updated successfully."
