#!/bin/bash

# Neo4j MCP Server - Azure AKS Deployment Script
# Usage: ./scripts/deploy-azure.sh [environment]

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENVIRONMENT="${1:-production}"
RESOURCE_GROUP="neo4j-${ENVIRONMENT}"
CLUSTER_NAME="neo4j-aks"
LOCATION="eastus2"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Azure CLI
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI not found. Please install it first."
        exit 1
    fi
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl not found. Please install it first."
        exit 1
    fi
    
    # Check if logged in to Azure
    if ! az account show &> /dev/null; then
        log_error "Not logged in to Azure. Please run 'az login' first."
        exit 1
    fi
    
    log_info "Prerequisites check passed ✓"
}

# Create or update resource group
setup_resource_group() {
    log_info "Setting up resource group: $RESOURCE_GROUP"
    
    if az group show --name "$RESOURCE_GROUP" &> /dev/null; then
        log_info "Resource group '$RESOURCE_GROUP' already exists"
    else
        log_info "Creating resource group '$RESOURCE_GROUP'"
        az group create --name "$RESOURCE_GROUP" --location "$LOCATION"
    fi
}

# Create or update AKS cluster
setup_aks_cluster() {
    log_info "Setting up AKS cluster: $CLUSTER_NAME"
    
    if az aks show --resource-group "$RESOURCE_GROUP" --name "$CLUSTER_NAME" &> /dev/null; then
        log_info "AKS cluster '$CLUSTER_NAME' already exists"
        
        # Get cluster credentials
        log_info "Getting cluster credentials..."
        az aks get-credentials --resource-group "$RESOURCE_GROUP" --name "$CLUSTER_NAME" --overwrite-existing
    else
        log_info "Creating AKS cluster '$CLUSTER_NAME'"
        az aks create \
            --resource-group "$RESOURCE_GROUP" \
            --name "$CLUSTER_NAME" \
            --node-count 3 \
            --node-vm-size Standard_D2s_v3 \
            --enable-managed-identity \
            --enable-cluster-autoscaler \
            --min-count 1 \
            --max-count 5 \
            --generate-ssh-keys \
            --kubernetes-version 1.31
        
        # Get cluster credentials
        log_info "Getting cluster credentials..."
        az aks get-credentials --resource-group "$RESOURCE_GROUP" --name "$CLUSTER_NAME"
    fi
}

# Deploy Kubernetes resources
deploy_kubernetes_resources() {
    log_info "Deploying Kubernetes resources..."
    
    # Apply namespace first
    kubectl apply -f "$ROOT_DIR/kubernetes/neo4j/namespace.yaml"
    
    # Apply configuration and secrets
    kubectl apply -f "$ROOT_DIR/kubernetes/neo4j/configmap.yaml"
    
    # Check if secrets file exists
    if [ -f "$ROOT_DIR/kubernetes/neo4j/secrets.yaml" ]; then
        kubectl apply -f "$ROOT_DIR/kubernetes/neo4j/secrets.yaml"
    else
        log_warn "No secrets.yaml found. Please create one from secrets.yaml.template"
    fi
    
    # Apply PVC
    kubectl apply -f "$ROOT_DIR/kubernetes/neo4j/pvc.yaml"
    
    # Apply deployment
    kubectl apply -f "$ROOT_DIR/kubernetes/neo4j/deployment.yaml"
    
    # Apply service
    kubectl apply -f "$ROOT_DIR/kubernetes/neo4j/service.yaml"
    
    # Wait for deployment to be ready
    log_info "Waiting for deployment to be ready..."
    kubectl rollout status deployment/neo4j -n neo4j --timeout=300s
    
    log_info "Deployment completed successfully ✓"
}

# Get service information
get_service_info() {
    log_info "Getting service information..."
    
    # Get external IP
    EXTERNAL_IP=$(kubectl get service neo4j-loadbalancer -n neo4j -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    
    if [ -z "$EXTERNAL_IP" ]; then
        log_warn "External IP not yet assigned. Waiting..."
        kubectl get service neo4j-loadbalancer -n neo4j -w &
        WATCH_PID=$!
        
        # Wait for external IP (with timeout)
        timeout=300
        while [ -z "$EXTERNAL_IP" ] && [ $timeout -gt 0 ]; do
            sleep 10
            EXTERNAL_IP=$(kubectl get service neo4j-loadbalancer -n neo4j -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
            timeout=$((timeout - 10))
        done
        
        kill $WATCH_PID 2>/dev/null || true
    fi
    
    if [ -n "$EXTERNAL_IP" ]; then
        log_info "✓ Neo4j HTTP: http://$EXTERNAL_IP:7474"
        log_info "✓ Neo4j Bolt: bolt://$EXTERNAL_IP:7687"
        log_info "✓ Neo4j Browser: http://$EXTERNAL_IP:7474/browser/"
        
        # Save connection details
        cat > "$ROOT_DIR/connection-details.txt" << EOF
Neo4j Connection Details - $ENVIRONMENT
========================================

Environment: $ENVIRONMENT
External IP: $EXTERNAL_IP
HTTP Port: 7474
Bolt Port: 7687

URLs:
- HTTP: http://$EXTERNAL_IP:7474
- Bolt: bolt://$EXTERNAL_IP:7687
- Browser: http://$EXTERNAL_IP:7474/browser/

Default Credentials:
- Username: neo4j
- Password: your-secure-password-123

MCP Server Configuration:
{
  "mcpServers": {
    "neo4j": {
      "command": "neo4j-mcp-server",
      "env": {
        "NEO4J_URI": "bolt://$EXTERNAL_IP:7687",
        "NEO4J_USERNAME": "neo4j",
        "NEO4J_PASSWORD": "your-secure-password-123"
      }
    }
  }
}

Deployed: $(date)
EOF
        
        log_info "Connection details saved to connection-details.txt"
    else
        log_error "Failed to get external IP after timeout"
        exit 1
    fi
}

# Health check
health_check() {
    log_info "Running health check..."
    
    if [ -n "$EXTERNAL_IP" ]; then
        # Test HTTP endpoint
        if curl -s -f "http://$EXTERNAL_IP:7474" > /dev/null; then
            log_info "✓ HTTP endpoint is healthy"
        else
            log_error "✗ HTTP endpoint is not responding"
            exit 1
        fi
        
        # Test Bolt port
        if nc -z "$EXTERNAL_IP" 7687; then
            log_info "✓ Bolt port is accessible"
        else
            log_error "✗ Bolt port is not accessible"
            exit 1
        fi
    else
        log_error "Cannot perform health check without external IP"
        exit 1
    fi
}

# Main deployment function
main() {
    log_info "Starting Neo4j MCP Server deployment to Azure AKS"
    log_info "Environment: $ENVIRONMENT"
    log_info "Resource Group: $RESOURCE_GROUP"
    log_info "Cluster Name: $CLUSTER_NAME"
    log_info "Location: $LOCATION"
    
    check_prerequisites
    setup_resource_group
    setup_aks_cluster
    deploy_kubernetes_resources
    get_service_info
    health_check
    
    log_info "🎉 Deployment completed successfully!"
    log_info "Your Neo4j MCP Server is now running on Azure AKS"
    log_info "Check connection-details.txt for configuration information"
}

# Handle script interruption
trap 'log_error "Deployment interrupted!"; exit 1' INT TERM

# Run main function
main "$@"