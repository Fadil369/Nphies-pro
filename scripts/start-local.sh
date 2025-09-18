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
pnpm install

# Start local services with Docker
log_info "Starting local infrastructure (PostgreSQL, Redis)..."
docker-compose up -d postgres redis

# Wait for services to be ready
log_info "Waiting for services to be ready..."
sleep 10

# Start the application services
log_info "Starting application services..."

# Start platform gateway in background
cd services/platform-gateway
pnpm install
if [ -z "$DATABASE_URL" ]; then
    export DATABASE_URL="file:./prisma/dev.db"
fi
pnpm run prisma:generate
pnpm run prisma:migrate
pnpm run prisma:seed
pnpm run dev &
PLATFORM_GATEWAY_PID=$!
cd ../..

# Start claims AI engine in background
cd services/claims-ai-engine
poetry install --no-root >/dev/null 2>&1 || true
poetry run python src/main.py &
AI_ENGINE_PID=$!
cd ../..

# Start web application
cd apps/web
pnpm install
pnpm run dev &
WEB_PID=$!
cd ../..

log_info "🎉 All services started successfully!"
echo ""
echo "📊 Access your application:"
echo "   Web Dashboard: http://localhost:3000"
echo "   Platform Gateway API: http://localhost:3001"
echo "   Claims AI Engine: http://localhost:8000"
echo ""
echo "🔍 Health Checks:"
echo "   Platform Gateway: http://localhost:3001/health"
echo "   AI Engine: http://localhost:8000/health"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    log_info "Stopping services..."
    kill $PLATFORM_GATEWAY_PID $AI_ENGINE_PID $WEB_PID 2>/dev/null || true
    docker-compose down
    log_info "All services stopped"
}

# Set trap to cleanup on script exit
trap cleanup EXIT

# Wait for user to stop
wait
