# AWS Deployment Scripts ☁️

This directory contains utility scripts to streamline deploying DocuTok to AWS EKS.

## Prerequisites
- AWS CLI configured (`aws configure`)
- `kubectl` installed
- `docker` installed

## Scripts

### 1. Login (`login.sh`)
Authenticates your local Docker client with AWS ECR.
```bash
./scripts/aws/login.sh
```

### 2. Build & Push (`build-push.sh`)
Builds `linux/amd64` images for Frontend, Backend, and Celery, and pushes them to ECR.
**Note**: This forces `linux/amd64` platform ensuring compatibility with AWS EC2 nodes, regardless of your local machine architecture (e.g., M1/M2 Mac).
```bash
./scripts/aws/build-push.sh [vTag]
# Example: ./scripts/aws/build-push.sh v10
```

### 3. Deploy (`deploy.sh`)
Applies the Kubernetes manifests from `k8s/` to your EKS cluster.
It can also update the image tag if provided.
```bash
./scripts/aws/deploy.sh [vTag]
# Example: ./scripts/aws/deploy.sh v10
```

### 4. Status (`status.sh`)
Quick check of pod status, logs, and service endpoints.
```bash
./scripts/aws/status.sh
```

## Workflow 🔄

### Phase 1: Local Development (Fast Loop)
Use your local machine (Mac arm64) for rapid iteration. Docker will build native arm64 images.
1.  **Code**: Make changes to frontend/backend.
2.  **Run**: `./scripts/webapp/restart.sh` (rebuilds locally).
3.  **Test**: Verified at `http://localhost:5173`.

### Phase 2: Deploy to Production (AWS)
When ready to ship, use the AWS scripts to build `amd64` images and update the cluster.
1.  **Login**: Ensure you are authenticated.
    ```bash
    ./scripts/aws/login.sh
    ```
2.  **Build & Push**: Create a new version tag (e.g., `v11`) and push to ECR.
    *   *Note: This script forces `linux/amd64` architecture ensures compatibility with EC2.*
    ```bash
    ./scripts/aws/build-push.sh v11
    ```
3.  **Deploy**: Update the EKS cluster to use the new image tag.
    ```bash
    ./scripts/aws/deploy.sh v11
    ```
4.  **Verify**: Watch the rollout status.
    ```bash
    ./scripts/aws/status.sh
    ```

## Architecture Strategy 🏗️
We use a **Split Build Strategy** to optimize for both performance and compatibility:

| Environment | Script | Platform | Frontend Mode | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Local** | `webapp/restart.sh` | **Host (arm64)** | Node.js (Dev) | Fast iteration, hot-reloading, native performance on Mac M1/M2/M3. |
| **AWS** | `aws/build-push.sh` | **Forced (amd64)** | Nginx (Prod) | Compatibility with standard EC2 instances (t3, c6, m6), static file serving. |

**Why?**
- Running `amd64` containers on a Mac (via Rosetta/QEMU) is slow.
- Keeping local builds `arm64` ensures your dev environment is snappy.
- The `build-push.sh` script handles the cross-compilation for AWS automatically.
