#!/bin/bash

# BrainSAIT Digital Insurance Platform - Development Setup Script
# This script sets up the development environment for the NPHIES Pro platform

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE} BrainSAIT Digital Insurance Platform${NC}"
    echo -e "${BLUE} Development Environment Setup${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo
}

print_step() {
    echo -e "${GREEN}[STEP]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites..."
    
    local missing_deps=()
    
    if ! command_exists node; then
        missing_deps+=("Node.js 18+")
    else
        local node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$node_version" -lt 18 ]; then
            missing_deps+=("Node.js 18+ (current: $(node --version))")
        fi
    fi
    
    if ! command_exists python3; then
        missing_deps+=("Python 3.11+")
    else
        local python_version=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
        if ! python3 -c "import sys; exit(0 if sys.version_info >= (3, 11) else 1)" 2>/dev/null; then
            missing_deps+=("Python 3.11+ (current: $(python3 --version))")
        fi
    fi
    
    if ! command_exists docker; then
        missing_deps+=("Docker")
    fi
    
    if ! command_exists docker-compose; then
        missing_deps+=("Docker Compose")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing prerequisites:"
        for dep in "${missing_deps[@]}"; do
            echo "  - $dep"
        done
        echo
        echo "Please install the missing dependencies and run this script again."
        exit 1
    fi
    
    print_success "All prerequisites are installed!"
}

# Setup Node.js environment
setup_node_environment() {
    print_step "Setting up Node.js environment..."
    
    # Check if pnpm is installed, install if not
    if ! command_exists pnpm; then
        print_info "Installing pnpm..."
        npm install -g pnpm
    fi
    
    # Install dependencies
    print_info "Installing Node.js dependencies..."
    pnpm install
    
    print_success "Node.js environment setup complete!"
}

# Setup Python environment
setup_python_environment() {
    print_step "Setting up Python environment..."
    
    # Check if poetry is installed
    if ! command_exists poetry; then
        print_info "Installing Poetry..."
        curl -sSL https://install.python-poetry.org | python3 -
        export PATH="$HOME/.local/bin:$PATH"
    fi
    
    # Setup Claims AI Engine
    if [ -d "services/claims-ai-engine" ]; then
        print_info "Setting up Claims AI Engine dependencies..."
        cd services/claims-ai-engine
        poetry install
        cd ../..
    fi
    
    print_success "Python environment setup complete!"
}

# Setup database
setup_database() {
    print_step "Setting up database..."
    
    # Start database services with Docker Compose
    print_info "Starting database services..."
    docker-compose up -d postgres redis mongodb
    
    # Wait for databases to be ready
    print_info "Waiting for databases to be ready..."
    sleep 10
    
    # Check if databases are accessible
    print_info "Checking database connectivity..."
    
    # Test PostgreSQL
    if docker-compose exec -T postgres pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
        print_success "PostgreSQL is ready!"
    else
        print_warning "PostgreSQL might not be ready yet. Check logs with: docker-compose logs postgres"
    fi
    
    # Test Redis
    if docker-compose exec -T redis redis-cli ping >/dev/null 2>&1; then
        print_success "Redis is ready!"
    else
        print_warning "Redis might not be ready yet. Check logs with: docker-compose logs redis"
    fi
    
    print_success "Database setup complete!"
}

# Setup environment files
setup_environment() {
    print_step "Setting up environment configuration..."
    
    if [ ! -f ".env" ]; then
        print_info "Creating .env file from template..."
        cp .env.example .env
        print_warning "Please edit .env file with your specific configuration values"
    else
        print_info ".env file already exists"
    fi
    
    # Create necessary directories
    print_info "Creating necessary directories..."
    mkdir -p logs
    mkdir -p uploads
    mkdir -p certificates
    mkdir -p backups
    
    print_success "Environment setup complete!"
}

# Setup development tools
setup_dev_tools() {
    print_step "Setting up development tools..."
    
    # Setup pre-commit hooks if available
    if [ -f ".pre-commit-config.yaml" ]; then
        print_info "Installing pre-commit hooks..."
        if command_exists pre-commit; then
            pre-commit install
        else
            print_warning "pre-commit not installed. Install with: pip install pre-commit"
        fi
    fi
    
    # Setup VS Code settings if .vscode directory exists
    if [ ! -d ".vscode" ]; then
        print_info "Creating VS Code workspace settings..."
        mkdir -p .vscode
        cat > .vscode/settings.json << 'EOL'
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "python.defaultInterpreterPath": "./services/claims-ai-engine/.venv/bin/python",
  "eslint.workingDirectories": ["services", "packages", "apps"],
  "files.exclude": {
    "**/node_modules": true,
    "**/.git": true,
    "**/.DS_Store": true,
    "**/dist": true,
    "**/.next": true
  }
}
EOL
    fi
    
    print_success "Development tools setup complete!"
}

# Run health checks
run_health_checks() {
    print_step "Running health checks..."
    
    # Check if we can build the TypeScript services
    print_info "Checking TypeScript compilation..."
    if [ -d "services/platform-gateway" ]; then
        cd services/platform-gateway
        if pnpm run type-check >/dev/null 2>&1; then
            print_success "TypeScript compilation successful!"
        else
            print_warning "TypeScript compilation issues detected. Run 'pnpm run type-check' for details."
        fi
        cd ../..
    fi
    
    # Check Python syntax
    print_info "Checking Python syntax..."
    if [ -d "services/claims-ai-engine" ]; then
        cd services/claims-ai-engine
        if poetry run python -m py_compile src/main.py >/dev/null 2>&1; then
            print_success "Python syntax check passed!"
        else
            print_warning "Python syntax issues detected. Check your Python code."
        fi
        cd ../..
    fi
    
    print_success "Health checks complete!"
}

# Generate sample data
generate_sample_data() {
    print_step "Generating sample data..."
    
    print_info "Creating sample tenant data..."
    # This would typically run database seeders
    # For now, just create placeholder files
    
    if [ ! -f "sample-data/tenants.json" ]; then
        mkdir -p sample-data
        cat > sample-data/tenants.json << 'EOL'
{
  "tenants": [
    {
      "name": "Demo Healthcare Provider",
      "domain": "demo-provider",
      "planType": "professional",
      "contactEmail": "admin@demo-provider.sa"
    }
  ]
}
EOL
        print_success "Sample data generated!"
    else
        print_info "Sample data already exists"
    fi
}

# Print next steps
print_next_steps() {
    echo
    print_header
    echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
    echo
    echo -e "${BLUE}Next Steps:${NC}"
    echo "1. Edit .env file with your configuration"
    echo "2. Start the development environment:"
    echo "   ${YELLOW}pnpm run dev${NC}"
    echo
    echo "3. Access the services:"
    echo "   - Platform Gateway: http://localhost:3001"
    echo "   - Claims AI Engine: http://localhost:8000"
    echo "   - API Documentation: http://localhost:8000/docs"
    echo
    echo "4. Check service health:"
    echo "   ${YELLOW}curl http://localhost:3001/health${NC}"
    echo "   ${YELLOW}curl http://localhost:8000/health${NC}"
    echo
    echo -e "${BLUE}Useful Commands:${NC}"
    echo "   ${YELLOW}pnpm run build${NC}        - Build all services"
    echo "   ${YELLOW}pnpm run test${NC}         - Run all tests"
    echo "   ${YELLOW}pnpm run lint${NC}         - Lint all code"
    echo "   ${YELLOW}docker-compose logs${NC}   - View database logs"
    echo
    echo -e "${BLUE}Documentation:${NC}"
    echo "   - README.md - Complete platform documentation"
    echo "   - docs/ - Additional documentation"
    echo
    echo -e "${GREEN}Happy coding! 🚀${NC}"
    echo
}

# Main execution
main() {
    print_header
    
    check_prerequisites
    setup_node_environment
    setup_python_environment
    setup_database
    setup_environment
    setup_dev_tools
    run_health_checks
    generate_sample_data
    
    print_next_steps
}

# Run main function
main "$@"
