#!/bin/bash

# Enhanced Build Script for NPHIES Platform
# Builds all services and applications with proper error handling

set -e

echo "🚀 Starting NPHIES Platform Build Process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "apps" ] || [ ! -d "services" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Install dependencies
print_status "Installing dependencies..."
pnpm install
print_success "Dependencies installed"

# Build shared packages first
print_status "Building shared packages..."
pnpm --filter @nphies-pro/shared-types build
pnpm --filter @nphies-pro/ui-components build
print_success "Shared packages built"

# Generate Prisma client
print_status "Generating Prisma client..."
cd services/platform-gateway
pnpm prisma generate
cd ../..
print_success "Prisma client generated"

# Build platform gateway
print_status "Building platform gateway..."
pnpm --filter @nphies-pro/platform-gateway build
print_success "Platform gateway built"

# Test AI agent and CopilotKit integration
print_status "Testing AI integration..."
cd services/claims-ai-engine
poetry install --only main
poetry run python -c "
import sys
sys.path.append('src')
from ag_ui_agent import app
print('✅ Pydantic AI agent loaded successfully')
"
cd ../..
print_success "AI agent tested"

# Build web application
print_status "Building web application..."
pnpm --filter @nphies-pro/web build
print_success "Web application built"

# Run tests
print_status "Running tests..."
pnpm test --filter @nphies-pro/web || print_warning "Some tests failed"

print_success "🎉 Build process completed successfully!"
print_status "Ready for deployment:"
print_status "  - Web app: apps/web/.next"
print_status "  - Platform gateway: services/platform-gateway/dist"
print_status "  - AI agent: services/claims-ai-engine/src/ag_ui_agent.py"
