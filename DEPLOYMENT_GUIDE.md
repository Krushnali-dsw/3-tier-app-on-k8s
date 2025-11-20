# Three-Tier Student Management Application Deployment Guide

## Prerequisites
- Docker installed
- Minikube installed and running
- kubectl configured

## Port Configuration
- Frontend: Port 80 (exposed via NodePort 30080)
- Backend: Port 5000 (ClusterIP)
- Database: Port 5432 (ClusterIP)

## Docker Images Overview

### Images Used:
1. **Backend**: `student-backend:latest` (built locally)
2. **Frontend**: `student-frontend:latest` (built locally)  
3. **Database**: `postgres:15-alpine` (pulled from Docker Hub during deployment)

## Docker Images Build Commands

### Backend Image
```bash
cd student-mgmt-app/backend
docker build -t student-backend:latest .
```

### Frontend Image  
```bash
cd student-mgmt-app/frontend
docker build -t student-frontend:latest .
```

## Load Images to Minikube
```bash
minikube image load student-backend:latest
minikube image load student-frontend:latest
```

## Kubernetes Deployment Commands

### Deploy PostgreSQL (Database)
**Note: PostgreSQL image (postgres:15-alpine) is automatically pulled from Docker Hub during deployment**
```bash
kubectl apply -f k8s-manifests/postgres.yaml
```

**What happens during PostgreSQL deployment:**
1. **PersistentVolume (PV)** is created with 5Gi storage at `/mnt/data/postgres`
2. **PersistentVolumeClaim (PVC)** claims the storage for the pod
3. **ConfigMap** sets up database credentials and name
4. **Deployment** pulls `postgres:15-alpine` image from Docker Hub automatically
5. **Service** exposes PostgreSQL on port 5432 within the cluster
6. **Volume Mount** attaches persistent storage to `/var/lib/postgresql/data` inside the container

**PostgreSQL Container Details:**
- Image: `postgres:15-alpine` (automatically pulled from Docker Hub)
- Port: 5432
- Database: `student_db`
- Username: `postgres`
- Password: `password`
- Persistent Volume: Mounted at `/var/lib/postgresql/data`

### Deploy Backend (Flask API)
```bash
kubectl apply -f k8s-manifests/backend.yaml
```

### Deploy Frontend (React App)
```bash
kubectl apply -f k8s-manifests/frontend.yaml
```

## Verification Commands

### Check all pods
```bash
kubectl get pods
```

### Check all services
```bash
kubectl get services
```

### Check persistent volumes
```bash
kubectl get pv,pvc
```

### View logs
```bash
kubectl logs -l app=backend
kubectl logs -l app=frontend
kubectl logs -l app=postgres
```

## Access Application
```bash
minikube service frontend-service --url
```

## Port Forwarding (Alternative access)
```bash
kubectl port-forward service/frontend-service 8080:80
kubectl port-forward service/backend-service 5000:5000
kubectl port-forward service/postgres-service 5432:5432
```

## Microservice Connection Test

### Test Backend Health
```bash
kubectl exec -it deployment/backend-deployment -- curl http://localhost:5000/health
```

### Test Database Connection from Backend
```bash
kubectl exec -it deployment/backend-deployment -- python -c "
import psycopg2
import os
try:
    conn = psycopg2.connect(
        host=os.getenv('DB_HOST'),
        database=os.getenv('DB_NAME'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        port=os.getenv('DB_PORT')
    )
    print('Database connection successful')
    conn.close()
except Exception as e:
    print(f'Database connection failed: {e}')
"
```

### Test Frontend to Backend Connection
Access the application via browser and check browser console for API calls.

## Cleanup
```bash
kubectl delete -f k8s-manifests/
```

## Troubleshooting

### Check pod status
```bash
kubectl describe pod <pod-name>
```

### Check service endpoints
```bash
kubectl get endpoints
```

### Check ConfigMaps
```bash
kubectl get configmaps
kubectl describe configmap backend-config
kubectl describe configmap postgres-config
```