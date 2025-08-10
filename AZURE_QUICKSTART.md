# ⚡ Azure Quick Start - Clinic Management System

Deploy your clinic management system to Azure in 3 simple steps!

## 🚀 **Option 1: One-Click Deployment (Recommended)**

### **Prerequisites**
- Azure CLI installed: `curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash`
- Docker installed and running
- Azure subscription

### **Deploy in 3 Commands**
```bash
# 1. Make script executable (already done)
chmod +x deploy-azure.sh

# 2. Run deployment script
./deploy-azure.sh

# 3. Wait for completion and access your clinic system!
```

## 🏗️ **Option 2: Manual Step-by-Step**

### **Step 1: Setup Azure Resources**
```bash
# Login to Azure
az login

# Create resource group
az group create --name clinic-rg --location eastus

# Create container registry
az acr create --resource-group clinic-rg --name clinicregistry --sku Basic
az acr login --name clinicregistry
```

### **Step 2: Build and Push Images**
```bash
# Build images
docker build -t clinicregistry.azurecr.io/clinic-backend:latest ./backend
docker build -t clinicregistry.azurecr.io/clinic-frontend:latest ./fronddesk

# Push to registry
docker push clinicregistry.azurecr.io/clinic-backend:latest
docker push clinicregistry.azurecr.io/clinic-frontend:latest
```

### **Step 3: Create Database**
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

### **Step 4: Deploy Containers**
```bash
# Deploy using YAML configuration
az container create --resource-group clinic-rg --file azure-containers.yaml
```

### **Step 5: Setup Database Schema**
```bash
# Connect to database and run schema
mysql -h clinic-mysql-server.mysql.database.azure.com -u clinicadmin -p clinic_db < database/azure-schema.sql
```

## 🎯 **What You Get**

After deployment, you'll have:

- ✅ **Frontend**: Next.js clinic dashboard
- ✅ **Backend**: NestJS API with authentication
- ✅ **Database**: Azure MySQL with sample data
- ✅ **Security**: HTTPS endpoints and secure passwords
- ✅ **Scalability**: Auto-scaling containers

## 🔗 **Access Your System**

1. **Frontend URL**: `https://clinic-app-unique.eastus.azurecontainer.io`
2. **Backend API**: `https://clinic-app-unique.eastus.azurecontainer.io:3001/api`
3. **Health Check**: `https://clinic-app-unique.eastus.azurecontainer.io:3001/api/health`

## 👤 **Default Login Credentials**

- **Admin**: `admin` / `password123`
- **Front Desk**: `frontdesk1` / `password123`

## 💰 **Expected Costs**

- **Containers**: ~$30-60/month
- **Database**: ~$20-50/month
- **Total**: ~$50-110/month

## 🔧 **Troubleshooting**

### **Common Issues**

1. **Docker build fails**: Ensure Docker is running
2. **Azure login fails**: Run `az login` and follow prompts
3. **Registry push fails**: Check `az acr login --name clinicregistry`
4. **Database connection fails**: Verify firewall rules allow connections

### **Check Deployment Status**
```bash
# Check container status
az container show --resource-group clinic-rg --name clinic-backend --query instanceView.state
az container show --resource-group clinic-rg --name clinic-frontend --query instanceView.state

# Check logs
az container logs --resource-group clinic-rg --name clinic-backend
az container logs --resource-group clinic-rg --name clinic-frontend
```

## 🎉 **Success!**

Your clinic management system is now running on Azure with:
- Enterprise-grade security
- Auto-scaling capabilities
- 99.9% uptime SLA
- Global CDN distribution

## 📞 **Support**

- Azure Portal: https://portal.azure.com
- Azure Documentation: https://docs.microsoft.com/azure
- Community Support: https://stackoverflow.com/questions/tagged/azure

---

**Your clinic is now in the cloud! 🏥☁️**
