---
description: Pause and Resume AWS Services for Cost Savings
---

# AWS Cost Savings: Pause & Resume

You can "pause" your AWS environment by scaling all compute resources (Pods/Nodes) to zero.
**Your data remains safe** because the storage volumes (EBS Persistent Volumes) are independent of the compute resources.

> [!IMPORTANT]
> **Cost Note:** While "paused", you **STOP** paying for:
> - EC2 Instances (if Cluster Autoscaler is enabled, nodes will scale down)
> - Load Balancer usage (if ingress controller is scaled down or deleted, though this workflow keeps it simple)
>
> You **CONTINUE** paying for:
> - **EBS Storage:** ~$0.10/GB/month for the database and redis volumes (approx $2-3/month total for standard setup).
> - **Elastic Load Balancer (ELB):** If you don't delete the Service of type `LoadBalancer`.

## 1. Pause (Stop Paying for Compute)

Run these commands to stop all application containers. Data volumes are NOT deleted.

```bash
# 1. Scale down backend services (Stateless)
kubectl scale deployment docutok-backend --replicas=0
kubectl scale deployment docutok-frontend --replicas=0
kubectl scale deployment docutok-worker --replicas=0

# 2. Scale down database services (Stateful)
# Data volumes (PVCs) remain attached and persist!
kubectl scale statefulset docutok-db-postgresql --replicas=0
kubectl scale statefulset docutok-redis-master --replicas=0
```

**Verify Status:**
```bash
kubectl get pods
# Should show "No resources found" or Terminating
```

## 2. Resume (Start Everything Back Up)

Run these commands to bring everything back online.

```bash
# 1. Start databases first (Critical)
kubectl scale statefulset docutok-db-postgresql --replicas=1
kubectl scale statefulset docutok-redis-master --replicas=1

# Wait for DB to be ready (optional but recommended)
echo "Waiting for database to start..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=postgresql --timeout=120s

# 2. Start backend services
kubectl scale deployment docutok-backend --replicas=1
kubectl scale deployment docutok-worker --replicas=1
kubectl scale deployment docutok-frontend --replicas=1
```

## 3. Extreme Savings (Optional)

If you want to save the ~$15/month for the AWS Load Balancer while paused:

**Delete the Service (Release ELB):**
```bash
kubectl delete service docutok-frontend
```

**Restore the Service:**
```bash
kubectl apply -f k8s/frontend-service.yaml
```
*Note: This may assign a NEW IP address/DNS name to your Load Balancer.*
