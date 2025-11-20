# Microservice Connection Validation Commands

## 1. Check if all pods are running
kubectl get pods -o wide

## 2. Check services and endpoints
kubectl get services
kubectl get endpoints

## 3. Test Database Connection
# Connect to postgres pod and verify database
kubectl exec -it deployment/postgres-deployment -- psql -U postgres -d student_db -c "\dt"

## 4. Test Backend Health and Database Connection
# Health check
kubectl exec -it deployment/backend-deployment -- curl -s http://localhost:5000/health

# Test database connection from backend
kubectl exec -it deployment/backend-deployment -- python -c "
import psycopg2
import os
try:
    conn = psycopg2.connect(
        host=os.getenv('DB_HOST', 'postgres-service'),
        database=os.getenv('DB_NAME', 'student_db'),
        user=os.getenv('DB_USER', 'postgres'),
        password=os.getenv('DB_PASSWORD', 'password'),
        port=os.getenv('DB_PORT', '5432')
    )
    cursor = conn.cursor()
    cursor.execute('SELECT version();')
    version = cursor.fetchone()
    print(f'Connected to: {version[0]}')
    cursor.close()
    conn.close()
    print('Database connection successful!')
except Exception as e:
    print(f'Database connection failed: {e}')
"

## 5. Test API Endpoints from Backend Pod
kubectl exec -it deployment/backend-deployment -- curl -s http://localhost:5000/api/students

## 6. Test Frontend Health
kubectl exec -it deployment/frontend-deployment -- curl -s http://localhost/health

## 7. Test Frontend to Backend Connection
# Get the backend service IP
kubectl get service backend-service

# Test from frontend pod to backend service
kubectl exec -it deployment/frontend-deployment -- curl -s http://backend-service:5000/health
kubectl exec -it deployment/frontend-deployment -- curl -s http://backend-service:5000/api/students

## 8. Test External Access
# Get minikube IP and NodePort
minikube ip
kubectl get service frontend-service

# Access application
minikube service frontend-service --url

## 9. Check DNS Resolution
# From backend pod
kubectl exec -it deployment/backend-deployment -- nslookup postgres-service
kubectl exec -it deployment/backend-deployment -- nslookup backend-service

# From frontend pod  
kubectl exec -it deployment/frontend-deployment -- nslookup backend-service

## 10. Port Connectivity Tests
# Test backend to postgres
kubectl exec -it deployment/backend-deployment -- nc -zv postgres-service 5432

# Test frontend to backend
kubectl exec -it deployment/frontend-deployment -- nc -zv backend-service 5000

## 11. Check Resource Usage
kubectl top pods
kubectl top nodes

## 12. View Logs for Troubleshooting
kubectl logs -l app=postgres --tail=50
kubectl logs -l app=backend --tail=50  
kubectl logs -l app=frontend --tail=50

## 13. Create Test Data and Verify
# Add a test student via API
kubectl exec -it deployment/backend-deployment -- curl -X POST \
  http://localhost:5000/api/students \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Student","email":"test@example.com","age":22,"course":"Computer Science"}'

# Verify data was added
kubectl exec -it deployment/backend-deployment -- curl -s http://localhost:5000/api/students

## 14. Full End-to-End Test
# This should be done via browser:
# 1. Access the frontend URL
# 2. Add a new student via the UI
# 3. Verify the student appears in the list
# 4. Edit the student information
# 5. Delete the student
# 6. Check that all operations work without errors