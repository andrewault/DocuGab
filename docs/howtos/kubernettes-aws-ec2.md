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

1.  **Create Repositories**: DONE
    aws ecr create-repository --repository-name docutok-backend --region us-west-2
    aws ecr create-repository --repository-name docutok-frontend --region us-west-2
    aws ecr create-repository --repository-name docutok-celery --region us-west-2
    ```

2.  **Authenticate Docker to ECR**: DONE
    
    *Tip: Run `aws sts get-caller-identity --query Account --output text` to get your Account ID.*

    ```bash
    aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin 932380677908.dkr.ecr.us-west-2.amazonaws.com
    ```

3.  **Build and Push Images**:
    
    *Replace `<ecr-uri>` with your specific repository URI (e.g., `932380677908.dkr.ecr.us-west-2.amazonaws.com`).*

    **Backend:** DONE
    ```bash
    docker build -t docutok-backend ./backend
    docker tag docutok-backend:latest 932380677908.dkr.ecr.us-west-2.amazonaws.com/docutok-backend:latest
    docker push 932380677908.dkr.ecr.us-west-2.amazonaws.com/docutok-backend:latest
    ```

    **Frontend:** DONE
    ```bash
    docker build -t docutok-frontend ./frontend
    docker tag docutok-frontend:latest 932380677908.dkr.ecr.us-west-2.amazonaws.com/docutok-frontend:latest
    docker push 932380677908.dkr.ecr.us-west-2.amazonaws.com/docutok-frontend:latest
    ```
    *(Note: Repeat similar steps for Celery using the backend Dockerfile context).*

## Step 2: Create the EKS Cluster

Use `eksctl` to provision a cluster. For DocuTok, we need a standard node group for the web/app servers and a **GPU node group** for Ollama.

1.  **Create a `cluster.yaml` file**: DONE

    ```yaml
    apiVersion: eksctl.io/v1alpha5
    kind: ClusterConfig

    metadata:
      name: docutok-cluster
      region: us-west-2

    nodeGroups:
      - name: standard-workers
        instanceType: t3.medium
        desiredCapacity: 2
        minSize: 1
        maxSize: 4
        iam:
          withAddonPolicies:
            autoScaler: true

      - name: gpu-workers
        instanceType: g4dn.xlarge
        desiredCapacity: 1
        minSize: 0
        maxSize: 2
        labels:
          role: gpu
        taints:
          - key: nvidia.com/gpu
            value: "true"
            effect: NoSchedule
        iam:
          withAddonPolicies:
            autoScaler: true
            cloudWatch: true
    ```

2.  **Create the Cluster**: DONE
    ```bash
    eksctl create cluster -f cluster.yaml
    ```

*This process takes about 15-20 minutes.* It provisions a VPC, Subnets, and two Node Groups (CPU and GPU).

## Step 3: Configure Persistence (Database & Redis)

For production, it is **highly recommended** to use managed services:
*   **Database**: AWS RDS for PostgreSQL.
*   **Cache**: AWS ElastiCache for Redis.
*   **Storage**: Amazon S3 for file uploads (`/app/uploads`).

However, for a self-contained content in Kubernetes, you can use Helm charts.

### Option A: In-Cluster (via Helm) DONE
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

## Step 4: Kubernetes Manifests DONE

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
        image: 932380677908.dkr.ecr.us-west-2.amazonaws.com/docutok-backend:latest
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
        image: 932380677908.dkr.ecr.us-west-2.amazonaws.com/docutok-frontend:latest
        ports:
        - containerPort: 5173
        env:
        - name: VITE_API_BASE_URL
          value: "/api" # Handled by Ingress rewrite usually, or public LB URL
```

### 6. Exposing the App (Load Balancer) (`k8s/frontend-service.yaml`)

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

### 7. Ollama Deployment (`k8s/ollama.yaml`)

This deployment targets the **GPU nodes** using tolerations and requests NVIDIA GPU resources.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: docutok-ollama
spec:
  replicas: 1
  selector:
    matchLabels:
      app: docutok-ollama
  template:
    metadata:
      labels:
        app: docutok-ollama
    spec:
      containers:
      - name: ollama
        image: ollama/ollama:latest
        ports:
        - containerPort: 11434
        resources:
          limits:
            nvidia.com/gpu: 1
        volumeMounts:
        - name: ollama-data
          mountPath: /root/.ollama
      volumes:
      - name: ollama-data
        emptyDir: {} # For production, use a PersistentVolumeClaim
      tolerations:
      - key: "nvidia.com/gpu"
        operator: "Equal"
        value: "true"
        effect: "NoSchedule"
      nodeSelector:
        role: gpu
---
apiVersion: v1
kind: Service
metadata:
  name: ollama-service
spec:
  selector:
    app: docutok-ollama
  ports:
    - protocol: TCP
      port: 11434
      targetPort: 11434
  type: ClusterIP
```


## Step 5: Deploy 

1.  **Apply Manifests**: DONE
    ```bash
    kubectl apply -f k8s/secrets.yaml
    kubectl apply -f k8s/configmap.yaml
    kubectl apply -f k8s/backend.yaml
    kubectl apply -f k8s/backend-service.yaml
    kubectl apply -f k8s/frontend.yaml
    kubectl apply -f k8s/frontend-service.yaml
    kubectl apply -f k8s/ollama.yaml
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
    Output:
    ```shell
    NAME                  TYPE           CLUSTER-IP     EXTERNAL-IP                                                               PORT(S)        AGE
    docutok-frontend-lb   LoadBalancer   10.100.93.19   aa601044b65294e63861ea2e52a40739-1671173697.us-west-2.elb.amazonaws.com   80:31999/TCP   84s
    ```

## Maintenance: Turning Off & On

### Option A: Pause (Fast)
To stop the application but keep the underlying infrastructure (Cluster, Nodes, LoadBalancer) running. You **will still be charged** for the EC2 nodes and EKS Control Plane.

**Turn Off:**
```bash
# Scale deployments to 0
kubectl scale deployment docutok-backend --replicas=0
kubectl scale deployment docutok-frontend --replicas=0
kubectl scale deployment docutok-ollama --replicas=0
```

**Turn On:**
```bash
# Scale back up
kubectl scale deployment docutok-backend --replicas=2
kubectl scale deployment docutok-frontend --replicas=2
kubectl scale deployment docutok-ollama --replicas=1
```

### Option B: Full Shutdown (Saves Money)
To completely stop all AWS charges, you must delete the cluster. This destroys everything (including data on the nodes!).

**Turn Off:**
```bash
eksctl delete cluster --name docutok-cluster
```

**Turn On:**
Re-run **Step 2** (Create Cluster) and **Step 5** (Deploy Manifests).

## Important Considerations

*   **Ollama**: We have provisioned a GPU Node Group (`g4dn.xlarge`) specifically for Ollama.
    *   Ensure your Ollama deployment definition includes the necessary **tolerations** to schedule on these tainted nodes.
    *   Example toleration:
        ```yaml
        tolerations:
        - key: "nvidia.com/gpu"
          operator: "Equal"
          value: "true"
          effect: "NoSchedule"
        ```
    *   Alternatively, you can switch to an external API provider (e.g., OpenAI) for production to save costs.
*   **Database Migrations**: You can run Alembic migrations as a Kubernetes **Job** or part of an initContainer in the backend pod.

## Cleaning Up

To avoid invalid AWS charges, always tear down the cluster when done:

```bash
eksctl delete cluster --name docutok-cluster
```
