#!/bin/bash
set -e

echo "▶️  Resuming AWS Environment..."

# 1. Start databases first (Critical)
echo "   Starting database services..."
kubectl scale statefulset docutok-db-postgresql --replicas=1
kubectl scale statefulset docutok-redis-master --replicas=1

# Wait for DB to be ready
echo "   Waiting for database to be ready..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=postgresql --timeout=120s

# 2. Start backend services
echo "   Starting backend services..."
kubectl scale deployment docutok-backend --replicas=1
kubectl scale deployment docutok-worker --replicas=1
kubectl scale deployment docutok-frontend --replicas=1

echo "✅ Environment resumed."
