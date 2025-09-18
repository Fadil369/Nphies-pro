#!/bin/bash

# BrainSAIT Digital Insurance Platform - Deployment Script
set -e

echo "🚀 Starting BrainSAIT Digital Insurance Platform Deployment..."

# Configuration
PROJECT_NAME="nphies-pro"
AWS_REGION="us-east-1"
ENVIRONMENT="production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
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
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check if Terraform is installed
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform is not installed. Please install it first."
        exit 1
    fi
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install it first."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured. Run 'aws configure' first."
        exit 1
    fi
    
    log_info "Prerequisites check passed ✅"
}

# Generate SSH key if not exists
generate_ssh_key() {
    if [ ! -f ~/.ssh/id_rsa ]; then
        log_info "Generating SSH key..."
        ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
        log_info "SSH key generated ✅"
    else
        log_info "SSH key already exists ✅"
    fi
}

# Deploy infrastructure with Terraform
deploy_infrastructure() {
    log_info "Deploying AWS infrastructure..."
    
    cd infrastructure/terraform
    
    # Initialize Terraform
    terraform init
    
    # Plan deployment
    terraform plan -var="aws_region=$AWS_REGION" -var="environment=$ENVIRONMENT"
    
    # Apply infrastructure
    terraform apply -auto-approve -var="aws_region=$AWS_REGION" -var="environment=$ENVIRONMENT"
    
    # Get outputs
    INSTANCE_IP=$(terraform output -raw instance_public_ip)
    S3_BUCKET=$(terraform output -raw s3_bucket_name)
    RDS_ENDPOINT=$(terraform output -raw rds_endpoint)
    REDIS_ENDPOINT=$(terraform output -raw redis_endpoint)
    DB_PASSWORD=$(terraform output -raw database_password)
    
    log_info "Infrastructure deployed ✅"
    log_info "Instance IP: $INSTANCE_IP"
    log_info "S3 Bucket: $S3_BUCKET"
    
    cd ../..
}

# Build and push Docker images
build_and_push_images() {
    log_info "Building Docker images..."
    
    # Build main application
    docker build -t $PROJECT_NAME:latest .
    
    # Build services
    docker build -t $PROJECT_NAME-platform-gateway:latest ./services/platform-gateway
    docker build -t $PROJECT_NAME-claims-ai:latest ./services/claims-ai-engine
    
    log_info "Docker images built ✅"
}

# Deploy to EC2
deploy_to_ec2() {
    log_info "Deploying to EC2 instance..."
    
    # Create environment file
    cat > .env.production << EOF
NODE_ENV=production
DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@${RDS_ENDPOINT}:5432/nphies_pro
REDIS_URL=redis://${REDIS_ENDPOINT}:6379
AWS_REGION=${AWS_REGION}
S3_BUCKET=${S3_BUCKET}
JWT_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)
EOF
    
    # Copy files to EC2
    scp -o StrictHostKeyChecking=no -i ~/.ssh/id_rsa docker-compose.prod.yml ec2-user@$INSTANCE_IP:/opt/$PROJECT_NAME/
    scp -o StrictHostKeyChecking=no -i ~/.ssh/id_rsa .env.production ec2-user@$INSTANCE_IP:/opt/$PROJECT_NAME/.env
    
    # Deploy on EC2
    ssh -o StrictHostKeyChecking=no -i ~/.ssh/id_rsa ec2-user@$INSTANCE_IP << EOF
        cd /opt/$PROJECT_NAME
        docker-compose -f docker-compose.prod.yml pull
        docker-compose -f docker-compose.prod.yml up -d
        docker system prune -f
EOF
    
    log_info "Deployed to EC2 ✅"
}

# Health check
health_check() {
    log_info "Performing health check..."
    
    sleep 30
    
    if curl -f http://$INSTANCE_IP/health; then
        log_info "Health check passed ✅"
        log_info "🎉 Deployment completed successfully!"
        log_info "Access your application at: http://$INSTANCE_IP"
    else
        log_error "Health check failed ❌"
        exit 1
    fi
}

# Main deployment flow
main() {
    log_info "🏥 BrainSAIT Digital Insurance Platform Deployment"
    log_info "================================================"
    
    check_prerequisites
    generate_ssh_key
    deploy_infrastructure
    build_and_push_images
    deploy_to_ec2
    health_check
    
    log_info "🎊 Deployment completed successfully!"
    log_info "Your BrainSAIT Digital Insurance Platform is now live!"
}

# Run main function
main "$@"
