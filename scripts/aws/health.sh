#!/bin/bash
# Check health of DocuTok services in AWS
set -e

# Configuration
REGION="us-west-2"
CLUSTER_NAME="docutok-cluster"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🩺 DocuTok AWS Health Check${NC}"
echo "=================================="

# 1. Update Kubeconfig
echo -e "\n🔄 Updating Kubeconfig..."
aws eks update-kubeconfig --region $REGION --name $CLUSTER_NAME > /dev/null

# 2. Pod Status
echo -e "\n📦 Pod Status:"
kubectl get pods

# 3. Service Status & URL Retrieval
echo -e "\n🌐 Service Status:"
kubectl get svc docutok-frontend-lb docutok-backend

# Get LoadBalancer URL
FRONTEND_URL=$(kubectl get svc docutok-frontend-lb -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")

echo -e "\n🔍 Connectivity Check:"

if [ -z "$FRONTEND_URL" ]; then
    echo -e "   ⚠️ ${YELLOW} LoadBalancer URL not found. Is the service deployed?${NC}"
else
    echo -e "   🌍 URL: http://$FRONTEND_URL"
    
    # Frontend Check
    echo -n "   🖥️  Frontend: "
    if curl -s -I --connect-timeout 5 "http://$FRONTEND_URL" > /dev/null; then
        echo -e "${GREEN}Accessible${NC}"
    else
        echo -e "${RED}Not Responding${NC}"
    fi

    # Backend API Check (assuming /api/v1/health or similar - trying common paths)
    # Based on local health check, backend has /health. 
    # If nginx proxies /api/ to backend, and backend mounts at root, path might be /api/health or /api/v1/health
    # We'll try to reach the root first as a proxy check
    
    # Try /api/health (common convention if proxied)
    echo -n "   🔌 Backend API (/api/health): "
    HTTP_CODE=$(curl -s -L -o /dev/null -w "%{http_code}" --connect-timeout 5 "http://$FRONTEND_URL/api/health")
    if [ "$HTTP_CODE" == "200" ]; then
        echo -e "${GREEN}Healthy ($HTTP_CODE)${NC}"
    elif [ "$HTTP_CODE" == "404" ]; then
         # Try /api/v1/health
         echo -e "${YELLOW}404${NC}"
         echo -n "   🔌 Backend API (/api/v1/health): "
         HTTP_CODE_V1=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "http://$FRONTEND_URL/api/v1/health")
         if [ "$HTTP_CODE_V1" == "200" ]; then
            echo -e "${GREEN}Healthy ($HTTP_CODE_V1)${NC}"
         else
            echo -e "${RED}Error ($HTTP_CODE_V1)${NC}"
         fi
    else
        echo -e "${RED}Error ($HTTP_CODE)${NC}"
    fi
fi

echo -e "\n✅ Done."
