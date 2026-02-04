#!/bin/bash
set -e

# Configuration
REGION="us-west-2"
ACCOUNT_URL=$(grep -o "[0-9]*\.dkr\.ecr\.$REGION\.amazonaws\.com" k8s/frontend.yaml | head -n 1)

if [ -z "$ACCOUNT_URL" ]; then
    echo "❌ Could not auto-detect ECR Registry URL from k8s/frontend.yaml"
    exit 1
fi

if [ -z "$1" ]; then
    echo "Usage: ./scripts/aws/build-push.sh <version-tag>"
    echo "Example: ./scripts/aws/build-push.sh v10"
    exit 1
fi

TAG=$1
echo "🚀 Building and Pushing version: $TAG"
echo "registry: $ACCOUNT_URL"

# Login first
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT_URL

# Frontend
echo ""
echo "📦 Building Frontend (linux/amd64)..."
docker build --platform linux/amd64 -t $ACCOUNT_URL/docutok-frontend:$TAG ./frontend
echo "⬆️ Pushing Frontend..."
docker push $ACCOUNT_URL/docutok-frontend:$TAG

# Backend
echo ""
echo "📦 Building Backend (linux/amd64)..."
docker build --platform linux/amd64 -t $ACCOUNT_URL/docutok-backend:$TAG ./backend
echo "⬆️ Pushing Backend..."
docker push $ACCOUNT_URL/docutok-backend:$TAG

echo ""
echo "✅ Build & Push Complete -> $TAG"
