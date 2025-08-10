# 🚀 Azure Deployment Guide - Clinic Management System

Deploy your clinic management system on Microsoft Azure using Docker containers and managed services.

## 🏗️ **Architecture Overview**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│  (Next.js)      │    │   (NestJS)      │    │    (MySQL)      │
│                 │    │                 │    │                 │
│ Azure Container │    │ Azure Container │    │ Azure Database  │
│   Instances     │    │   Instances     │    │   for MySQL     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 💰 **Cost Estimate**
- **Frontend Container**: ~$15-30/month
- **Backend Container**: ~$15-30/month  
- **MySQL Database**: ~$20-50/month
- **Total**: ~$50-110/month (much cheaper than dedicated VMs)

## 🚀 **Deployment Methods**

### **Method 1: Azure Container Instances (Recommended)**

#### **Prerequisites**
- Azure CLI installed
- Docker images pushed to Azure Container Registry
- Azure subscription

#### **Step 1: Create Resource Group**
```bash
# Login to Azure
az login

# Create resource group
az group create --name clinic-rg --location eastus
```

#### **Step 2: Create Azure Container Registry**
```bash
# Create container registry
az acr create --resource-group clinic-rg --name clinicregistry --sku Basic

# Login to registry
az acr login --name clinicregistry
```

#### **Step 3: Build and Push Docker Images**
```bash
# Tag and push backend
docker build -t clinicregistry.azurecr.io/clinic-backend:latest ./backend
docker push clinicregistry.azurecr.io/clinic-backend:latest

# Tag and push frontend
docker build -t clinicregistry.azurecr.io/clinic-frontend:latest ./fronddesk
docker push clinicregistry.azurecr.io/clinic-frontend:latest
```

#### **Step 4: Create Azure Database for MySQL**
```bash
# Create MySQL server
az mysql flexible-server create \
  --resource-group clinic-rg \
  --name clinic-mysql-server \
  --admin-user clinicadmin \
  --admin-password "YourSecurePassword123!" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --public-access 0.0.0.0 \
  --storage-size 32 \
  --version 8.0.21

# Create database
az mysql flexible-server db create \
  --resource-group clinic-rg \
  --server-name clinic-mysql-server \
  --database-name clinic_db
```

#### **Step 5: Deploy Backend Container**
```bash
az container create \
  --resource-group clinic-rg \
  --name clinic-backend \
  --image clinicregistry.azurecr.io/clinic-backend:latest \
  --registry-login-server clinicregistry.azurecr.io \
  --registry-username clinicregistry \
  --registry-password $(az acr credential show --name clinicregistry --query "passwords[0].value" -o tsv) \
  --dns-name-label clinic-backend-unique \
  --ports 3001 \
  --environment-variables \
    NODE_ENV=production \
    DATABASE_HOST=clinic-mysql-server.mysql.database.azure.com \
    DATABASE_PORT=3306 \
    DATABASE_USERNAME=clinicadmin \
    DATABASE_PASSWORD=YourSecurePassword123! \
    DATABASE_NAME=clinic_db \
    JWT_SECRET=azure-clinic-jwt-secret-2025 \
    FRONTEND_URL=https://clinic-frontend-unique.eastus.azurecontainer.io
```

#### **Step 6: Deploy Frontend Container**
```bash
az container create \
  --resource-group clinic-rg \
  --name clinic-frontend \
  --image clinicregistry.azurecr.io/clinic-frontend:latest \
  --registry-login-server clinicregistry.azurecr.io \
  --registry-username clinicregistry \
  --registry-password $(az acr credential show --name clinicregistry --query "passwords[0].value" -o tsv) \
  --dns-name-label clinic-frontend-unique \
  --ports 3000 \
  --environment-variables \
    NODE_ENV=production \
    NEXT_PUBLIC_API_URL=https://clinic-backend-unique.eastus.azurecontainer.io:3001/api \
    NEXTAUTH_URL=https://clinic-frontend-unique.eastus.azurecontainer.io \
    NEXTAUTH_SECRET=azure-clinic-nextauth-secret-2025
```

### **Method 2: Azure Virtual Machines (EC2 Equivalent)**

#### **Create Ubuntu VM**
```bash
# Create VM
az vm create \
  --resource-group clinic-rg \
  --name clinic-vm \
  --image Ubuntu2204 \
  --admin-username azureuser \
  --generate-ssh-keys \
  --size Standard_B2s \
  --public-ip-sku Standard

# Open ports
az vm open-port --port 80 --resource-group clinic-rg --name clinic-vm
az vm open-port --port 443 --resource-group clinic-rg --name clinic-vm
az vm open-port --port 3000 --resource-group clinic-rg --name clinic-vm
az vm open-port --port 3001 --resource-group clinic-rg --name clinic-vm
```

#### **Setup VM with Docker**
```bash
# SSH into VM
ssh azureuser@<VM_PUBLIC_IP>

# Install Docker
sudo apt update
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker $USER

# Clone your repository
git clone https://github.com/Mohammedazif/clinic-management-system.git
cd clinic-management-system

# Run with Docker Compose
sudo docker-compose up -d
```

### **Method 3: Azure App Service**

#### **Deploy Frontend to App Service**
```bash
# Create App Service plan
az appservice plan create \
  --name clinic-plan \
  --resource-group clinic-rg \
  --sku B1 \
  --is-linux

# Create web app
az webapp create \
  --resource-group clinic-rg \
  --plan clinic-plan \
  --name clinic-frontend-app \
  --deployment-container-image-name clinicregistry.azurecr.io/clinic-frontend:latest

# Configure container settings
az webapp config container set \
  --name clinic-frontend-app \
  --resource-group clinic-rg \
  --docker-custom-image-name clinicregistry.azurecr.io/clinic-frontend:latest \
  --docker-registry-server-url https://clinicregistry.azurecr.io
```

## 🔧 **Azure-Specific Configuration Files**

### **Azure Container Instances YAML**
```yaml
# azure-containers.yaml
apiVersion: 2019-12-01
location: eastus
name: clinic-containers
properties:
  containers:
  - name: clinic-backend
    properties:
      image: clinicregistry.azurecr.io/clinic-backend:latest
      ports:
      - port: 3001
      environmentVariables:
      - name: NODE_ENV
        value: production
      - name: DATABASE_HOST
        value: clinic-mysql-server.mysql.database.azure.com
      resources:
        requests:
          cpu: 1.0
          memoryInGb: 1.5
  - name: clinic-frontend
    properties:
      image: clinicregistry.azurecr.io/clinic-frontend:latest
      ports:
      - port: 3000
      environmentVariables:
      - name: NODE_ENV
        value: production
      resources:
        requests:
          cpu: 1.0
          memoryInGb: 1.5
  osType: Linux
  ipAddress:
    type: Public
    ports:
    - protocol: tcp
      port: 3000
    - protocol: tcp
      port: 3001
type: Microsoft.ContainerInstance/containerGroups
```

## 🗄️ **Database Setup**

### **MySQL Schema for Azure**
```sql
-- Connect to Azure MySQL
mysql -h clinic-mysql-server.mysql.database.azure.com -u clinicadmin -p clinic_db

-- Create tables
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'front_desk', 'doctor') DEFAULT 'front_desk',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE doctors (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    status ENUM('available', 'busy', 'offline') DEFAULT 'offline',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE appointments (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    patient_name VARCHAR(100) NOT NULL,
    doctor_id VARCHAR(36),
    appointment_date DATE NOT NULL,
    status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

CREATE TABLE queue (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    queue_number VARCHAR(10) NOT NULL,
    patient_name VARCHAR(100) NOT NULL,
    status ENUM('waiting', 'with-doctor', 'completed') DEFAULT 'waiting',
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔒 **Security Configuration**

### **Environment Variables for Azure**
```bash
# Backend Environment Variables
NODE_ENV=production
DATABASE_HOST=clinic-mysql-server.mysql.database.azure.com
DATABASE_PORT=3306
DATABASE_USERNAME=clinicadmin
DATABASE_PASSWORD=YourSecurePassword123!
DATABASE_NAME=clinic_db
JWT_SECRET=azure-clinic-jwt-secret-production-2025
JWT_REFRESH_SECRET=azure-clinic-refresh-secret-production-2025
FRONTEND_URL=https://clinic-frontend-unique.eastus.azurecontainer.io

# Frontend Environment Variables
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://clinic-backend-unique.eastus.azurecontainer.io:3001/api
NEXTAUTH_URL=https://clinic-frontend-unique.eastus.azurecontainer.io
NEXTAUTH_SECRET=azure-clinic-nextauth-secret-production-2025
```

## 📊 **Monitoring and Scaling**

### **Azure Monitor Setup**
```bash
# Enable container insights
az monitor log-analytics workspace create \
  --resource-group clinic-rg \
  --workspace-name clinic-logs

# Monitor containers
az container show \
  --resource-group clinic-rg \
  --name clinic-backend \
  --query instanceView.state
```

## 💡 **Cost Optimization Tips**

1. **Use Burstable Database Tier** for development
2. **Scale containers** based on usage
3. **Use Azure Reserved Instances** for production
4. **Enable auto-shutdown** for development VMs
5. **Monitor costs** with Azure Cost Management

## 🚀 **Quick Start Commands**

```bash
# 1. Login and setup
az login
az group create --name clinic-rg --location eastus

# 2. Create container registry
az acr create --resource-group clinic-rg --name clinicregistry --sku Basic

# 3. Build and deploy
docker build -t clinicregistry.azurecr.io/clinic-backend:latest ./backend
docker build -t clinicregistry.azurecr.io/clinic-frontend:latest ./fronddesk
docker push clinicregistry.azurecr.io/clinic-backend:latest
docker push clinicregistry.azurecr.io/clinic-frontend:latest

# 4. Deploy containers
az container create --resource-group clinic-rg --file azure-containers.yaml
```

## 🔗 **Useful Azure Resources**

- **Azure Portal**: https://portal.azure.com
- **Azure CLI Docs**: https://docs.microsoft.com/en-us/cli/azure/
- **Container Instances**: https://azure.microsoft.com/en-us/services/container-instances/
- **Azure Database for MySQL**: https://azure.microsoft.com/en-us/services/mysql/

## 📞 **Support**

For Azure-specific issues:
- Azure Support Portal
- Azure Community Forums
- Azure Documentation

---

**Your clinic management system will be running on enterprise-grade Azure infrastructure! 🏥☁️**
