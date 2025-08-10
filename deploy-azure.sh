#!/bin/bash

# Azure Deployment Script for Clinic Management System
# This script automates the deployment of your clinic system to Azure

set -e

echo "🚀 Starting Azure deployment for Clinic Management System..."

# Configuration
RESOURCE_GROUP="clinic-rg"
LOCATION="eastus"
REGISTRY_NAME="clinicregistry"
MYSQL_SERVER="clinic-mysql-server"
MYSQL_ADMIN="clinicadmin"
MYSQL_PASSWORD="YourSecurePassword123!"
DATABASE_NAME="clinic_db"

# Step 1: Login to Azure (if not already logged in)
echo "📝 Checking Azure login status..."
if ! az account show &> /dev/null; then
    echo "Please login to Azure:"
    az login
fi

# Step 2: Create Resource Group
echo "🏗️ Creating resource group: $RESOURCE_GROUP"
az group create --name $RESOURCE_GROUP --location $LOCATION

# Step 3: Create Azure Container Registry
echo "📦 Creating Azure Container Registry: $REGISTRY_NAME"
az acr create --resource-group $RESOURCE_GROUP --name $REGISTRY_NAME --sku Basic

# Step 4: Login to Container Registry
echo "🔐 Logging into Container Registry..."
az acr login --name $REGISTRY_NAME

# Step 5: Build and Push Docker Images
echo "🐳 Building and pushing Docker images..."

# Build Backend
echo "Building backend image..."
docker build -t $REGISTRY_NAME.azurecr.io/clinic-backend:latest ./backend

# Build Frontend
echo "Building frontend image..."
docker build -t $REGISTRY_NAME.azurecr.io/clinic-frontend:latest ./fronddesk

# Push Images
echo "Pushing images to registry..."
docker push $REGISTRY_NAME.azurecr.io/clinic-backend:latest
docker push $REGISTRY_NAME.azurecr.io/clinic-frontend:latest

# Step 6: Create MySQL Database
echo "🗄️ Creating Azure Database for MySQL..."
az mysql flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name $MYSQL_SERVER \
  --admin-user $MYSQL_ADMIN \
  --admin-password $MYSQL_PASSWORD \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --public-access 0.0.0.0 \
  --storage-size 32 \
  --version 8.0.21

# Create Database
echo "Creating clinic database..."
az mysql flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name $MYSQL_SERVER \
  --database-name $DATABASE_NAME

# Step 7: Get Registry Credentials
echo "🔑 Getting registry credentials..."
REGISTRY_PASSWORD=$(az acr credential show --name $REGISTRY_NAME --query "passwords[0].value" -o tsv)

# Step 8: Deploy Backend Container
echo "🚀 Deploying backend container..."
az container create \
  --resource-group $RESOURCE_GROUP \
  --name clinic-backend \
  --image $REGISTRY_NAME.azurecr.io/clinic-backend:latest \
  --registry-login-server $REGISTRY_NAME.azurecr.io \
  --registry-username $REGISTRY_NAME \
  --registry-password $REGISTRY_PASSWORD \
  --dns-name-label clinic-backend-$(date +%s) \
  --ports 3001 \
  --environment-variables \
    NODE_ENV=production \
    DATABASE_HOST=$MYSQL_SERVER.mysql.database.azure.com \
    DATABASE_PORT=3306 \
    DATABASE_USERNAME=$MYSQL_ADMIN \
    DATABASE_PASSWORD=$MYSQL_PASSWORD \
    DATABASE_NAME=$DATABASE_NAME \
    JWT_SECRET=azure-clinic-jwt-secret-2025 \
    JWT_REFRESH_SECRET=azure-clinic-refresh-secret-2025

# Get backend URL
BACKEND_FQDN=$(az container show --resource-group $RESOURCE_GROUP --name clinic-backend --query ipAddress.fqdn -o tsv)
echo "Backend deployed at: https://$BACKEND_FQDN:3001"

# Step 9: Deploy Frontend Container
echo "🌐 Deploying frontend container..."
az container create \
  --resource-group $RESOURCE_GROUP \
  --name clinic-frontend \
  --image $REGISTRY_NAME.azurecr.io/clinic-frontend:latest \
  --registry-login-server $REGISTRY_NAME.azurecr.io \
  --registry-username $REGISTRY_NAME \
  --registry-password $REGISTRY_PASSWORD \
  --dns-name-label clinic-frontend-$(date +%s) \
  --ports 3000 \
  --environment-variables \
    NODE_ENV=production \
    NEXT_PUBLIC_API_URL=https://$BACKEND_FQDN:3001/api \
    NEXTAUTH_URL=https://clinic-frontend-$(date +%s).eastus.azurecontainer.io \
    NEXTAUTH_SECRET=azure-clinic-nextauth-secret-2025

# Get frontend URL
FRONTEND_FQDN=$(az container show --resource-group $RESOURCE_GROUP --name clinic-frontend --query ipAddress.fqdn -o tsv)

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "======================"
echo "Resource Group: $RESOURCE_GROUP"
echo "Container Registry: $REGISTRY_NAME.azurecr.io"
echo "MySQL Server: $MYSQL_SERVER.mysql.database.azure.com"
echo "Backend URL: https://$BACKEND_FQDN:3001"
echo "Frontend URL: https://$FRONTEND_FQDN"
echo ""
echo "🔗 Access your clinic management system at:"
echo "https://$FRONTEND_FQDN"
echo ""
echo "🗄️ Database Connection:"
echo "Host: $MYSQL_SERVER.mysql.database.azure.com"
echo "Username: $MYSQL_ADMIN"
echo "Database: $DATABASE_NAME"
echo ""
echo "💡 Next steps:"
echo "1. Access your application at the frontend URL"
echo "2. Login with default credentials (admin/password123)"
echo "3. Configure your database schema if needed"
echo "4. Set up monitoring and alerts in Azure Portal"
echo ""
echo "🎯 Your clinic management system is now running on Azure!"
