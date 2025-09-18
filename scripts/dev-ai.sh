#!/bin/bash

# Development Startup Script for NPHIES AI Integration
# Starts all services required for CopilotKit + Pydantic AI

set -e

echo "🚀 Starting NPHIES AI Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "apps" ] || [ ! -d "services" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Check for required environment variables
if [ -z "$OPENAI_API_KEY" ]; then
    print_error "OPENAI_API_KEY environment variable is required"
    echo "Please set it in your .env file or export it:"
    echo "export OPENAI_API_KEY='your-api-key-here'"
    exit 1
fi

# Install dependencies if needed
print_status "Checking dependencies..."
if [ ! -d "node_modules" ]; then
    print_status "Installing Node.js dependencies..."
    pnpm install
fi

cd services/claims-ai-engine
if [ ! -d ".venv" ]; then
    print_status "Installing Python dependencies..."
    poetry install
fi
cd ../..

print_success "Dependencies ready"

# Generate Prisma client
print_status "Generating Prisma client..."
cd services/platform-gateway
pnpm prisma generate
cd ../..

# Start services in background
print_status "Starting services..."

# Start Platform Gateway
print_status "Starting Platform Gateway on port 3001..."
cd services/platform-gateway
pnpm dev > ../../../logs/gateway.log 2>&1 &
GATEWAY_PID=$!
cd ../..

# Start AI Agent
print_status "Starting Pydantic AI Agent on port 8001..."
cd services/claims-ai-engine
poetry run python src/ag_ui_agent.py > ../../logs/ai-agent.log 2>&1 &
AI_AGENT_PID=$!
cd ../..

# Start Web Application
print_status "Starting Web Application on port 3000..."
cd apps/web
pnpm dev > ../../logs/web.log 2>&1 &
WEB_PID=$!
cd ../..

# Create logs directory if it doesn't exist
mkdir -p logs

# Wait for services to start
print_status "Waiting for services to initialize..."
sleep 10

# Health checks
print_status "Performing health checks..."

# Check Platform Gateway
if curl -s http://localhost:3001/api/health > /dev/null; then
    print_success "✅ Platform Gateway (http://localhost:3001)"
else
    print_error "❌ Platform Gateway failed to start"
fi

# Check AI Agent
if curl -s http://localhost:8001/health > /dev/null; then
    print_success "✅ Pydantic AI Agent (http://localhost:8001)"
else
    print_error "❌ AI Agent failed to start (check logs/ai-agent.log)"
fi

# Check Web Application
if curl -s http://localhost:3000 > /dev/null; then
    print_success "✅ Web Application (http://localhost:3000)"
else
    print_error "❌ Web Application failed to start (check logs/web.log)"
fi

# Test CopilotKit integration
print_status "Testing CopilotKit integration..."
sleep 5
if curl -s -X POST http://localhost:3000/api/copilot \
   -H "Content-Type: application/json" \
   -d '{"message": "Health check"}' > /dev/null; then
    print_success "✅ CopilotKit API integration working"
else
    print_error "❌ CopilotKit integration failed"
fi

print_success "🎉 NPHIES AI Development Environment Ready!"
echo ""
echo "📱 Services Running:"
echo "   • Web App: http://localhost:3000"
echo "   • Platform Gateway: http://localhost:3001"
echo "   • AI Agent: http://localhost:8001"
echo ""
echo "🤖 AI Assistant:"
echo "   • Press ⌘J in the web app to open AI assistant"
echo "   • Try: 'Analyze my claims' or 'تحليل المطالبات'"
echo ""
echo "📊 Monitoring:"
echo "   • Gateway logs: tail -f logs/gateway.log"
echo "   • AI Agent logs: tail -f logs/ai-agent.log"
echo "   • Web App logs: tail -f logs/web.log"
echo ""
echo "🛑 To stop all services:"
echo "   kill $GATEWAY_PID $AI_AGENT_PID $WEB_PID"

# Keep script running and handle Ctrl+C
cleanup() {
    print_status "Shutting down services..."
    kill $GATEWAY_PID $AI_AGENT_PID $WEB_PID 2>/dev/null || true
    print_success "All services stopped"
    exit 0
}

trap cleanup INT TERM

# Wait for user to stop
echo ""
echo "Press Ctrl+C to stop all services..."
wait
