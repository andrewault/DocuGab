#!/bin/bash
set -e

# Configuration
REGION="us-west-2"
# Grep the account ID from the k8s config if not explicitly set
ACCOUNT_URL=$(grep -oE "[0-9]+\.dkr\.ecr\.$REGION\.amazonaws\.com" k8s/frontend.yaml | head -n 1)

if [ -z "$ACCOUNT_URL" ]; then
    echo "❌ Could not auto-detect ECR Registry URL from k8s/frontend.yaml"
    exit 1
fi

echo "🔐 Logging into ECR ($ACCOUNT_URL)..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT_URL
echo "✅ Login successful."
