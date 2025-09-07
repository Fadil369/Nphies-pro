#!/bin/bash

# BrainSAIT Digital Insurance Platform - Local Development Startup
set -e

echo "🏥 Starting BrainSAIT Digital Insurance Platform (Local Development)"
echo "=================================================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

# Check if .env exists
if [ ! -f .env ]; then
    log_info "Creating .env file from .env.example..."
    cp .env.example .env
    log_warn "Please update .env file with your configuration"
fi

# Install dependencies
log_info "Installing dependencies..."
npm install

# Start local services with Docker
log_info "Starting local infrastructure (PostgreSQL, Redis)..."
docker-compose up -d postgres redis

# Wait for services to be ready
log_info "Waiting for services to be ready..."
sleep 10

# Start the application services
log_info "Starting application services..."

# Start tenant manager in background
cd services/tenant-manager
npm install
npm run dev &
TENANT_MANAGER_PID=$!
cd ../..

# Start claims AI engine in background
cd services/claims-ai-engine
pip install -r requirements.txt
python src/main.py &
AI_ENGINE_PID=$!
cd ../..

# Start web application
cd apps/web
npm install
npm run dev &
WEB_PID=$!
cd ../..

log_info "🎉 All services started successfully!"
echo ""
echo "📊 Access your application:"
echo "   Web Dashboard: http://localhost:3000"
echo "   Tenant Manager API: http://localhost:3001"
echo "   Claims AI Engine: http://localhost:8000"
echo ""
echo "🔍 Health Checks:"
echo "   Tenant Manager: http://localhost:3001/health"
echo "   AI Engine: http://localhost:8000/health"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    log_info "Stopping services..."
    kill $TENANT_MANAGER_PID $AI_ENGINE_PID $WEB_PID 2>/dev/null || true
    docker-compose down
    log_info "All services stopped"
}

# Set trap to cleanup on script exit
trap cleanup EXIT

# Wait for user to stop
wait
