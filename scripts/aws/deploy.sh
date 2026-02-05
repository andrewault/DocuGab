#!/bin/bash
set -e

REGION="us-west-2"
CLUSTER_NAME="docutok-cluster"

echo "🔄 Updating Kubeconfig for $CLUSTER_NAME..."
aws eks update-kubeconfig --region $REGION --name $CLUSTER_NAME

if [ ! -z "$1" ]; then
    TAG=$1
    echo "📝 Updating manifests to use image tag: $TAG"
    
    # Update frontend.yaml
    sed -i '' "s|image: .*/docutok-frontend:.*|image: $(grep -o '[0-9]*\.dkr\.ecr\.'$REGION'\.amazonaws\.com' k8s/frontend.yaml | head -n 1)/docutok-frontend:$TAG|g" k8s/frontend.yaml
    
    # Update backend.yaml
    sed -i '' "s|image: .*/docutok-backend:.*|image: $(grep -o '[0-9]*\.dkr\.ecr\.'$REGION'\.amazonaws\.com' k8s/frontend.yaml | head -n 1)/docutok-backend:$TAG|g" k8s/backend.yaml
    
    echo "   Manifests updated."
fi

echo "🚀 Applying Manifests..."
# Apply all yaml files in k8s/ EXCEPT redis-values.yaml (which is for Helm)
find k8s -maxdepth 1 -name "*.yaml" ! -name "redis-values.yaml" -exec kubectl apply -f {} \;

echo "🔄 Restarting deployments to ensure new config/images are picked up..."
kubectl rollout restart deployment docutok-frontend
kubectl rollout restart deployment docutok-backend

echo "✅ Deployed. Watch status with: ./scripts/aws/status.sh"
