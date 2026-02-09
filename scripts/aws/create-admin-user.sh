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

# DB Configuration (Auto-detect from Cluster)
# We fetch the actual password from the running cluster's secrets
export POSTGRES_PASSWORD=$(kubectl get secret docutok-secrets -o jsonpath="{.data.POSTGRES_PASSWORD}" | base64 --decode)
export POSTGRES_DB=${POSTGRES_DB:-"docutok"}
export POSTGRES_USER=${POSTGRES_USER:-"docutok"}

if [ -z "$POSTGRES_PASSWORD" ]; then
    echo "❌ Error: Could not fetch POSTGRES_PASSWORD from secret 'docutok-secrets'"
    exit 1
fi

echo "🔐 Creating Admin User: $ADMIN_USERNAME"

# Generate Password Hash using Python (matching backend logic: bcrypt)
# Generate Password Hash using Python (matching backend logic: bcrypt)
# We use uv run to execute in an ephemeral environment with bcrypt installed
HASH=$(uv run --with bcrypt python3 -c "import bcrypt; print(bcrypt.hashpw('$ADMIN_PASSWORD'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'))")
echo "   Hash generated."

# SQL Command
SQL="INSERT INTO users (uuid, email, password_hash, full_name, role, is_active, is_verified, created_at, updated_at) 
VALUES (gen_random_uuid(), '$ADMIN_USERNAME', '$HASH', 'Andrew Ault, Admin User', 'superadmin', true, true, NOW(), NOW())
ON CONFLICT (email) DO UPDATE 
SET password_hash = '$HASH', role='superadmin', is_active=true, is_verified=true, updated_at=NOW();"

# Identify Postgres Pod
# Identify Backend Pod (which has psql installed and network access to RDS)
DB_POD=$(kubectl get pods -l app=docutok-backend -o jsonpath="{.items[0].metadata.name}")
if [ -z "$DB_POD" ]; then
    echo "❌ Error: Could not find backend pod (app=docutok-backend)"
    exit 1
fi

echo "⏳ Waiting for pod $DB_POD to be ready..."
kubectl wait --for=condition=ready pod/$DB_POD --timeout=60s || {
    echo "❌ Error: Pod $DB_POD is not ready. Check logs with: kubectl logs $DB_POD -c migrate"
    exit 1
}

echo "🚀 Executing SQL on pod: $DB_POD"
# Use -h docutok-db-postgresql because psql inside the container defaults to localhost (socket)
kubectl exec $DB_POD -- env PGPASSWORD=$POSTGRES_PASSWORD psql -h docutok-db-postgresql -U $POSTGRES_USER -d $POSTGRES_DB -c "$SQL"

echo "✅ Admin user created/updated successfully."
