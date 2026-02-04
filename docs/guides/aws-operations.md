# AWS Operations & Maintenance Guide

This guide covers the standard procedures for maintaining the DocuTok application on AWS EKS.

## 1. Updating the Application

When you have made code changes and need to deploy them to production.

### Step 1: Rebuild & Push Images
**Note**: Ensure you use `--platform linux/amd64` for compatibility with AWS EC2.

```bash
# Backend
docker build --platform linux/amd64 -t docutok-backend ./backend
docker tag docutok-backend:latest 932380677908.dkr.ecr.us-west-2.amazonaws.com/docutok-backend:latest
docker push 932380677908.dkr.ecr.us-west-2.amazonaws.com/docutok-backend:latest

# Frontend
docker build --platform linux/amd64 -t docutok-frontend ./frontend
docker tag docutok-frontend:latest 932380677908.dkr.ecr.us-west-2.amazonaws.com/docutok-frontend:latest
docker push 932380677908.dkr.ecr.us-west-2.amazonaws.com/docutok-frontend:latest
```

### Step 2: Restart Pods
Kubernetes will not automatically pull the new "latest" image unless the pod restarts.

```bash
kubectl delete pod -l app=docutok-backend
kubectl delete pod -l app=docutok-frontend
```

## 2. Configuration Management

Configuration is handled via Kubernetes manifests, not local `.env` files.

*   **Environment Variables**: `k8s/configmap.yaml`
*   **Secrets (Passwords)**: `k8s/secrets.yaml`

### Changing a Variable
1.  Edit `k8s/configmap.yaml` locally.
2.  Apply the change:
    ```bash
    kubectl apply -f k8s/configmap.yaml
    ```
3.  Restart the backend pods to pick up the change:
    ```bash
    kubectl delete pod -l app=docutok-backend
    ```

## 3. Cost Saving & Maintenance

### "Pause" Mode (Stops App, Keeps Data/IP)
Stops the application containers but keeps the cluster running. You are still charged for EC2 time.

**Stop:**
```bash
kubectl scale deployment docutok-backend --replicas=0
kubectl scale deployment docutok-frontend --replicas=0
kubectl scale deployment docutok-ollama --replicas=0
```

**Start:**
```bash
kubectl scale deployment docutok-backend --replicas=2
kubectl scale deployment docutok-frontend --replicas=2
kubectl scale deployment docutok-ollama --replicas=1
```

### "Shutdown" Mode (Stops Billing)
Destroys the entire cluster. Data on nodes is lost. External databases (RDS) persist if configured separately.

**Destroy:**
```bash
eksctl delete cluster --name docutok-cluster
```

**Re-create:**
Follow the "Deploying to AWS" guide (Step 2 & Step 5).

## 4. Troubleshooting

### Viewing Logs
```bash
# Backend Logs
kubectl logs -l app=docutok-backend --tail=100 -f

# Frontend Logs (Nginx)
kubectl logs -l app=docutok-frontend --tail=100 -f

# Ollama Logs
kubectl logs -l app=docutok-ollama --tail=100 -f
```

### Shell Access to Pod
If you need to run a script or check a file inside a running pod:

```bash
# Get pod name
kubectl get pods

# Enter shell
kubectl exec -it <pod-name> -- /bin/bash
```

### Common Errors
*   **ImagePullBackOff**: Usually means the image doesn't exist in ECR or was built with the wrong architecture (ARM vs AMD).
*   **CrashLoopBackOff**: The application is starting but crashing immediately. Check logs (`kubectl logs ...`).
*   **Pending**: Usually means no nodes are available with enough resources (CPU/RAM/GPU) or storage (PVC) cannot be provisioned.
