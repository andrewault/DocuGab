# Deploying DocuTok to AWS EC2 via Kubernetes (EKS)

This guide details how to deploy the DocuTok application to AWS using **Amazon Elastic Kubernetes Service (EKS)**. EKS runs upstream Kubernetes on AWS EC2 instances, providing a robust, production-ready environment.

> **Note:** While it is possible to manually install Kubernetes (e.g., `kubeadm`, `k3s`) on raw EC2 instances, using EKS is the standard best practice for "Kubernetes on AWS" as it handles the control plane complexity and scaling for you.

## Prerequisites

Ensure you have the following tools installed locally:

*   **AWS CLI**: Configured with your AWS credentials (`aws configure`).
*   **kubectl**: Kubernetes command-line tool.
*   **eksctl**: The official CLI for Amazon EKS.
*   **Docker**: For building and pushing images.

## Step 1: Set up Container Registry (ECR)

Kubernetes needs to pull your container images from a registry. We will use Amazon Elastic Container Registry (ECR).

1.  **Create Repositories**:
    ```bash
    aws ecr create-repository --repository-name docutok-backend
    aws ecr create-repository --repository-name docutok-frontend
    aws ecr create-repository --repository-name docutok-celery
    ```

2.  **Authenticate Docker to ECR**:
    ```bash
    aws ecr get-login-password --region <your-region> | docker login --username AWS --password-stdin <your-account-id>.dkr.ecr.<your-region>.amazonaws.com
    ```

3.  **Build and Push Images**:
    
    *Replace `<ecr-uri>` with your specific repository URI (e.g., `123456789012.dkr.ecr.us-west-2.amazonaws.com`).*

    **Backend:**
    ```bash
    docker build -t docutok-backend ./backend
    docker tag docutok-backend:latest <ecr-uri>/docutok-backend:latest
    docker push <ecr-uri>/docutok-backend:latest
    ```

    **Frontend:**
    ```bash
    docker build -t docutok-frontend ./frontend
    docker tag docutok-frontend:latest <ecr-uri>/docutok-frontend:latest
    docker push <ecr-uri>/docutok-frontend:latest
    ```
    *(Note: Repeat similar steps for Celery using the backend Dockerfile context).*

## Step 2: Create the EKS Cluster

Use `eksctl` to provision a cluster backed by EC2 nodes.

```bash
eksctl create cluster \
  --name docutok-cluster \
  --region us-west-2 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 1 \
  --nodes-max 4 \
  --managed
```

*This process takes about 15-20 minutes.* It provisions a VPC, Subnets, and Auto Scaling Groups for your EC2 instances.

## Step 3: Configure Persistence (Database & Redis)

For production, it is **highly recommended** to use managed services:
*   **Database**: AWS RDS for PostgreSQL.
*   **Cache**: AWS ElastiCache for Redis.
*   **Storage**: Amazon S3 for file uploads (`/app/uploads`).

However, for a self-contained content in Kubernetes, you can use Helm charts.

### Option A: In-Cluster (via Helm)
```bash
# PostgreSQL
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install docutok-db bitnami/postgresql \
  --set global.postgresql.auth.username=docutok \
  --set global.postgresql.auth.password=securepassword \
  --set global.postgresql.auth.database=docutok

# Redis
helm install docutok-redis bitnami/redis
```

## Step 4: Kubernetes Manifests

Create a directory `k8s/` and save the following files.

### 1. Secrets (`k8s/secrets.yaml`)
*Base64 encode your values first: `echo -n "value" | base64`*

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: docutok-secrets
type: Opaque
data:
  # Examples (ensure these are base64 encoded!)
  POSTGRES_PASSWORD: <base64-password>
  SECRET_KEY: <base64-secret-key>
  ADMIN_PASSWORD: <base64-admin-password>
```

### 2. Configure ConfigMap (`k8s/configmap.yaml`)

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: docutok-config
data:
  POSTGRES_USER: "docutok"
  POSTGRES_DB: "docutok"
  # If using in-cluster DB:
  DATABASE_URL: "postgresql+asyncpg://docutok:$(POSTGRES_PASSWORD)@docutok-db-postgresql.default.svc.cluster.local:5432/docutok"
  # If using in-cluster Redis:
  REDIS_URL: "redis://docutok-redis-master.default.svc.cluster.local:6379/0"
  CELERY_BROKER_URL: "redis://docutok-redis-master.default.svc.cluster.local:6379/1"
  BACKEND_PORT: "8000"
  # Update with your Ollama Setup (External or Sidecar)
  OLLAMA_BASE_URL: "http://ollama-service:11434" 
```

### 3. Backend Deployment (`k8s/backend.yaml`)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: docutok-backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: docutok-backend
  template:
    metadata:
      labels:
        app: docutok-backend
    spec:
      containers:
      - name: backend
        image: <your-ecr-uri>/docutok-backend:latest
        ports:
        - containerPort: 8000
        envFrom:
        - configMapRef:
            name: docutok-config
        env:
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: docutok-secrets
              key: POSTGRES_PASSWORD
        # Add necessary mounts for uploads if not using S3
```

### 4. Backend Service (`k8s/backend-service.yaml`)

```yaml
apiVersion: v1
kind: Service
metadata:
  name: docutok-backend
spec:
  selector:
    app: docutok-backend
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8000
  type: ClusterIP
```

### 5. Frontend Deployment (`k8s/frontend.yaml`)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: docutok-frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: docutok-frontend
  template:
    metadata:
      labels:
        app: docutok-frontend
    spec:
      containers:
      - name: frontend
        image: <your-ecr-uri>/docutok-frontend:latest
        ports:
        - containerPort: 5173
        env:
        - name: VITE_API_BASE_URL
          value: "/api" # Handled by Ingress rewrite usually, or public LB URL
```

### 6. Exposing the App (Load Balancer)

For simplicity, we can use a LoadBalancer service for the frontend.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: docutok-frontend-lb
spec:
  selector:
    app: docutok-frontend
  ports:
    - protocol: TCP
      port: 80
      targetPort: 5173
  type: LoadBalancer
```

## Step 5: Deploy

1.  **Apply Manifests**:
    ```bash
    kubectl apply -f k8s/secrets.yaml
    kubectl apply -f k8s/configmap.yaml
    kubectl apply -f k8s/backend.yaml
    kubectl apply -f k8s/backend-service.yaml
    kubectl apply -f k8s/frontend.yaml
    ```

2.  **Verify**:
    ```bash
    kubectl get pods
    kubectl get services
    ```

3.  **Access the Application**:
    Get the external IP/DNS of the Frontend LoadBalancer:
    ```bash
    kubectl get svc docutok-frontend-lb
    ```

## Important Considerations

*   **Ollama**: The current configuration expects an Ollama service. Running LLMs on standard CPU EC2 instances (like `t3.medium`) will be **extremely slow**. You should consider:
    *   Adding a GPU Node Group to your EKS cluster.
    *   Deploying Ollama to that node group using Kubernetes Taints and Tolerations.
    *   Or, switching to an external API provider (e.g., OpenAI) for the production environment.
*   **Database Migrations**: You can run Alembic migrations as a Kubernetes **Job** or part of an initContainer in the backend pod.

## Cleaning Up

To avoid invalid AWS charges, always tear down the cluster when done:

```bash
eksctl delete cluster --name docutok-cluster
```
