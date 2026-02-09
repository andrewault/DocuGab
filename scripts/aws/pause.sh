#!/bin/bash
set -e

echo "⏸️  Pausing AWS Environment (Scaling to 0)..."

# 1. Scale down backend services (Stateless)
echo "   Stopping backend services..."
kubectl scale deployment docutok-backend --replicas=0
kubectl scale deployment docutok-frontend --replicas=0
kubectl scale deployment docutok-worker --replicas=0

# 2. Scale down database services (Stateful)
echo "   Stopping database services (Data retained in PVCs)..."
kubectl scale statefulset docutok-db-postgresql --replicas=0
kubectl scale statefulset docutok-redis-master --replicas=0

echo "✅ Environment paused. Run 'scripts/aws/resume.sh' to restart."
