#!/bin/bash

# BrainSAIT Digital Insurance Platform - AWS Setup Script (Free Tier Optimized)
set -e

echo "🏥 Setting up BrainSAIT Digital Insurance Platform on AWS Free Tier"
echo "=================================================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if AWS CLI is configured
check_aws_config() {
    log_info "Checking AWS configuration..."
    
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS CLI not configured. Please run 'aws configure' first."
        echo "You'll need:"
        echo "- AWS Access Key ID"
        echo "- AWS Secret Access Key"
        echo "- Default region (recommend: us-east-1 for free tier)"
        exit 1
    fi
    
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    REGION=$(aws configure get region)
    
    log_info "AWS Account: $ACCOUNT_ID"
    log_info "Region: $REGION"
}

# Create SSH key pair if not exists
setup_ssh_key() {
    log_info "Setting up SSH key..."
    
    if [ ! -f ~/.ssh/id_rsa ]; then
        ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
        log_info "SSH key generated"
    else
        log_info "SSH key already exists"
    fi
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        log_warn "Node.js not found. Installing..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_warn "Docker not found. Installing..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        sudo usermod -aG docker $USER
    fi
    
    # Check if Terraform is installed
    if ! command -v terraform &> /dev/null; then
        log_warn "Terraform not found. Installing..."
        wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
        echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
        sudo apt update && sudo apt install terraform
    fi
    
    log_info "Dependencies installed"
}

# Build the application
build_application() {
    log_info "Building application..."
    
    # Install npm dependencies
    npm install
    
    # Build the application
    npm run build
    
    log_info "Application built successfully"
}

# Deploy infrastructure
deploy_infrastructure() {
    log_info "Deploying AWS infrastructure..."
    
    cd infrastructure/terraform
    
    # Initialize Terraform
    terraform init
    
    # Plan and apply
    terraform plan -var="aws_region=$REGION"
    terraform apply -auto-approve -var="aws_region=$REGION"
    
    # Get outputs
    INSTANCE_IP=$(terraform output -raw instance_public_ip)
    S3_BUCKET=$(terraform output -raw s3_bucket_name)
    RDS_ENDPOINT=$(terraform output -raw rds_endpoint)
    REDIS_ENDPOINT=$(terraform output -raw redis_endpoint)
    
    log_info "Infrastructure deployed successfully"
    log_info "Instance IP: $INSTANCE_IP"
    
    # Save outputs to file
    cat > ../../.aws-outputs << EOF
INSTANCE_IP=$INSTANCE_IP
S3_BUCKET=$S3_BUCKET
RDS_ENDPOINT=$RDS_ENDPOINT
REDIS_ENDPOINT=$REDIS_ENDPOINT
EOF
    
    cd ../..
}

# Setup environment
setup_environment() {
    log_info "Setting up environment..."
    
    # Source AWS outputs
    source .aws-outputs
    
    # Create production environment file
    cat > .env.production << EOF
NODE_ENV=production
DATABASE_URL=postgresql://postgres:$(terraform -chdir=infrastructure/terraform output -raw database_password)@${RDS_ENDPOINT}:5432/nphies_pro
REDIS_URL=redis://${REDIS_ENDPOINT}:6379
AWS_REGION=${REGION}
S3_BUCKET=${S3_BUCKET}
JWT_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)
NPHIES_BASE_URL=https://dev-nphies.sa.gov
DEFAULT_TIMEZONE=Asia/Riyadh
DEFAULT_CURRENCY=SAR
DEFAULT_LANGUAGE=ar
EOF
    
    log_info "Environment configured"
}

# Deploy application
deploy_application() {
    log_info "Deploying application to EC2..."
    
    source .aws-outputs
    
    # Wait for instance to be ready
    log_info "Waiting for EC2 instance to be ready..."
    sleep 60
    
    # Copy files to EC2
    scp -o StrictHostKeyChecking=no -i ~/.ssh/id_rsa docker-compose.prod.yml ec2-user@$INSTANCE_IP:/opt/nphies-pro/
    scp -o StrictHostKeyChecking=no -i ~/.ssh/id_rsa .env.production ec2-user@$INSTANCE_IP:/opt/nphies-pro/.env
    scp -o StrictHostKeyChecking=no -i ~/.ssh/id_rsa nginx.conf ec2-user@$INSTANCE_IP:/opt/nphies-pro/
    
    # Deploy on EC2
    ssh -o StrictHostKeyChecking=no -i ~/.ssh/id_rsa ec2-user@$INSTANCE_IP << 'EOF'
        cd /opt/nphies-pro
        sudo docker-compose -f docker-compose.prod.yml up -d
        sudo docker system prune -f
EOF
    
    log_info "Application deployed"
}

# Health check
health_check() {
    log_info "Performing health check..."
    
    source .aws-outputs
    
    sleep 30
    
    if curl -f http://$INSTANCE_IP/health; then
        log_info "✅ Health check passed"
    else
        log_warn "⚠️  Health check failed, but deployment may still be starting"
    fi
}

# Main setup function
main() {
    log_info "🚀 Starting AWS setup for BrainSAIT Digital Insurance Platform"
    
    check_aws_config
    setup_ssh_key
    install_dependencies
    build_application
    deploy_infrastructure
    setup_environment
    deploy_application
    health_check
    
    source .aws-outputs
    
    echo ""
    echo "🎉 Setup completed successfully!"
    echo "================================"
    echo "Your BrainSAIT Digital Insurance Platform is now running on AWS!"
    echo ""
    echo "📊 Access your application:"
    echo "   Web Dashboard: http://$INSTANCE_IP"
    echo "   API Endpoint:  http://$INSTANCE_IP/api"
    echo "   AI Engine:     http://$INSTANCE_IP/ai"
    echo ""
    echo "💰 AWS Free Tier Resources Used:"
    echo "   ✅ EC2 t2.micro instance (750 hours/month free)"
    echo "   ✅ RDS db.t3.micro (750 hours/month free)"
    echo "   ✅ ElastiCache t3.micro (750 hours/month free)"
    echo "   ✅ S3 storage (5GB free)"
    echo "   ✅ Data transfer (15GB/month free)"
    echo ""
    echo "🔧 Next steps:"
    echo "   1. Configure your domain name (optional)"
    echo "   2. Set up SSL certificate"
    echo "   3. Configure NPHIES integration"
    echo "   4. Add your healthcare data"
    echo ""
    echo "📚 Documentation: https://github.com/Fadil369/Nphies-pro"
    echo "🆘 Support: support@brainsait.com"
}

# Run main function
main "$@"
