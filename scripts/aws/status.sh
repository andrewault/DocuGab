#!/bin/bash
set -e

echo "🔍 Pod Status:"
kubectl get pods

echo ""
echo "🌐 Service Endpoints:"
kubectl get svc docutok-frontend docutok-backend

echo ""
echo "📜 Recent logs (Frontend):"
kubectl logs -l app=docutok-frontend --tail=5 2>/dev/null || echo "No logs found"
