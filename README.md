# Microservices Demo for Azure Kubernetes Service

<p align="center">
<img src="https://img.shields.io/badge/Azure-AKS-0078D4?logo=microsoftazure" alt="Azure AKS">
<img src="https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker" alt="Docker">
<img src="https://img.shields.io/badge/Kubernetes-Deployed-326CE5?logo=kubernetes" alt="Kubernetes">
<img src="https://img.shields.io/badge/CIn%2fCD-Github%20Actions-2088FF?logo=githubactions" alt="GitHub Actions">
<img src="https://img.shields.io/badge/Helm-v3--0F16897?logo=helm" alt="Helm">
</p>

Production-ready microservices application demonstrating DevOps best practices, containerization, and Kubernetes orchestration on Azure AKS.

## Architecture

**Three-tier microservices application with zero-trust security**

```
+-----------------------------+
|         INTERNET            |
+-----------------------------+
             |
             v
+-----------------------------+
|      NGINX Ingress          |
|      (Load Balancer)        |
|      Public Access          |
+-----------------------------+
             |
             v
+-----------------------------+
|   Frontend Service          |
|   React 18 + Nginx          |
|   Port: 80                  |
+-----------------------------+
      Internal Only
             |
             v
+-----------------------------+
|     API Service             |
|     Node.js/Express         |
|     Port: 8080              |
|     (ClusterIP)             |
+-----------------------------+
      Internal Only
             |
             v
+-----------------------------+
| PostgreSQL Database         |
| Port: 5432                  |
| (StatefulSet)               |
| (ClusterIP)                 |
+-----------------------------+
```

**Traffic Flow:** `Internet → Ingress → Frontend → API → Database`

### Service Details

| Service   | Technology         | Type            | Accessibility     |
|-----------|--------------------|-----------------|-------------------|
| **Frontend** | React 18 + Nginx    | Ingress-exposed  | ✅ Public         |
| **API**      | Node.js/Express     | ClusterIP        | 🔒 Internal Only  |
| **Database** | PostgreSQL 15       | ClusterIP        | 🔒 Internal Only  |

### Security Model
- ✅ Only frontend exposed publicly via Ingress
- 🔒 API/Database use ClusterIP (internal communication only)
- 🔒 Network policies enforce pod-to-pod restrictions
- 🔒 Zero-trust networking with defense-in-depth

### Key Features

**DevOps & CI/CD**
- GitHub Actions pipelines with automated build/test/deploy
- Multi-environment support (dev/staging/prod)
- Docker multi-stage builds & Azure Container Registry
- Trivy security scanning & PR validation

**Kubernetes**
- Helm charts for templated deployments
- Horizontal Pod Autoscaling (HPA)
- Health probes & network policies
- NGINX Ingress with SSL/TLS support

**Azure Integration**
- Azure Key Vault CSI driver for secrets
- Managed Identity authentication
- Azure Monitor for logging
- Persistent storage with Azure Disks

## Project Structure

```
test-iac/
├── services/           # Microservices (React frontend, Node.js API, PostgreSQL)
├── k8s/base/           # Kubernetes manifests (11 files)
├── helm/               # Helm charts with templates
├── .github/workflows/  # CI/CD pipelines
└── docs/               # Documentation
```


## ⚡ Prerequisites
- [Azure CLI](https://docs.microsoft.com/cli/azure/install-azure-cli/) 2.50+
- [kubectl](https://kubernetes.io/docs/tasks/tools/) 1.24+
- [Helm](https://helm.sh/docs/intro/install/) 3.0+
- [Docker](https://docs.docker.com/get-docker/) 20.10+
- Azure subscription with AKS and ACR

## ⚡ Quick Start

### 1. Setup Azure Resources

```bash
# Variables
RESOURCE_GROUP="microservices-demo-rg"
LOCATION="eastus"
ACR_NAME="microservicesdemo"
AKS_NAME="microservices-aks"

# Create resources
az login
az group create --name $RESOURCE_GROUP --location $LOCATION
az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Standard
az aks create \\n  --resource-group $RESOURCE_GROUP \\n  --name $AKS_NAME \\n  --node-count 3 \\n  --enable-managed-identity \\n  --attach-acr $ACR_NAME \\n  --network-plugin azure

# Get credentials
az aks get-credentials --resource-group $RESOURCE_GROUP --name $AKS_NAME
```

### 2. Install NGINX Ingress

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install ingress-nginx ingress-nginx/ingress-nginx \\n  --namespace ingress-nginx --create-namespace
```

### 3. Build & Push Images

```bash
az acr login --name $ACR_NAME

docker build -t ${ACR_NAME}.azurecr.io/frontend-service:latest ./services/frontend
docker push ${ACR_NAME}.azurecr.io/frontend-service:latest

docker build -t ${ACR_NAME}.azurecr.io/api-service:latest ./services/api
docker push ${ACR_NAME}.azurecr.io/api-service:latest
```

## 4. Deploy

**Option A: Kubectl**
```bash
find k8s/base -type f -name "*;.yaml" -exec sed -i "s/${ACR_NAME}/$ACR_NAME/g" {} +
kubectl apply -f k8s/base/
```

**Option B: Helm**
```bash
helm install microservices-demo ./helm/microservices-demo \
  --namespace microservices-demo --create-namespace \
  --set global.registry=${ACR_NAME}.azurecr.io
```

## 5. Access Application

```bash
INGRESS_IP=$(kubectl get ingress microservices-ingress \
  -n microservices-demo -o jsonpath='[{.status.loadBalancer.ingress[0].ip}]')
echo "Application: http://${INGRESS_IP}"
```

## CI/CD Pipeline

Configure GitHub Secrets for automated deployments:
- AZURE_CREDENTIALS   - Service principal JSON
- ACR_NAME            - ACR_USERNAME , ACR_PASSWORD
- AKS_CLUSTER_NAME    , AKS_RESOURCE_GROUP

**Workflows:**
- ci-cd-pipeline.yml   - Build, test, deploy on push to main
- pr-validation.yml    - Security scans and validation on PRs
- cleanup.yml          - Automated resource cleanup

## 🖥 Operations

**View Logs:**
```bash
kubectl logs -f -l app=frontend -n microservices-demo
kubectl logs -f -l app=api -n microservices-demo
```

**Monitor Resources:**
```bash
kubectl top nodes
kubectl top pods -n microservices-demo
kubectl get hpa -n microservices-demo
```

**Scaling:**
```bash
kubectl scale deployment microservices-frontend --replicas=3 -n microservices-demo
kubectl scale deployment microservices-api --replicas=3 -n microservices-demo

# Auto(HPA)
kubectl describe how -n microservices-demo
```

## 🛡 Security

**Network Isolation:**
- Frontend only exposed via Ingress (public)
- API/Database use ClusterIP (internal only)
- Network policies enforce strict pod-to-pod rules

**Benefits:**
- Reduced attack surface (API not discoverable from internet)
- Defense-in-depth with layered security
- DDoS mitigation at ingress level

**Azure Key Vault Integration:**
```bash
az aks enable-addons --addons azure-keyvault-secrets-provider \
  --name $AKS_NAME --resource-group $RESOURCE_GROUP
kubectl apply -f k8s/base/azure-keyvault-csi.yaml
```

## 🐞 Testing & Debugging

**Port-forward for local access:**
```bash
# Frontend
kubectl port-forward -n microservices-demo svc/frontend-service 8080:80

# API (internal service)
kubectl port-forward -n microservices-demo svc/api-service 8081:8080
curl http://localhost:8081/api/users

# Test DNS resolution
kubectl run -it --rm debug --image=busybox -n microservices-demo -- sh
# nslookup api-service.microservices-demo.svc.cluster.local
```

**Common Issues:**
```bash
# Pod troubleshooting
kubectl describe pod <pod-name> -n microservices-demo
kubectl logs <pod-name> -n microservices-demo

# Database connectivity
kubectl exec -it postgres-0 -n microservices-demo -- pg_isready

# Ingress issues
kubectl describe ingress microservices-ingress -n microservices-demo
```

## 🧹 Cleanup

```bash
# Delete Kubernetes resources
kubectl delete namespace microservices-demo
# Or: helm uninstall microservices-demo -n microservices-demo

# Delete Azure resources
az group delete --name $RESOURCE_GROUP --yes --no-wait
```

## 📚 Documentation

- [Azure Key Vault Integration](docs/azure-keyvault-integration.md)
- [AKS Setup Guide](docs/aks-setup-guide.md)
- [Troubleshooting Guide](docs/troubleshooting.md)

## 💡 Skills Demonstrated

✅ Microservices architecture & containerization
✅ Kubernetes orchestration (AKS, deployments, services, ingress)
✅ Docker multi-stage builds & optimization
✅ CI/CD with GitHub Actions
✅ Infrastructure as Code (Helm charts)
✅ Security best practices (zero-trust, network policies, secrets management)
✅ Cloud-native Azure services (ACR, AKS, Key Vault, Monitor)
✅ Observability & monitoring

---

**Built with ❤️ to demonstrate modern DevOps practices on Azure**