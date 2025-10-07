#!/bin/bash
# Start Local API Development Server
# Usage: ./start-local-api.sh [--detached]

set -e

echo "🚀 Starting Loppestars Local API Development Server"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running"
    echo "   Please start Docker Desktop and try again"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found"
    echo "   Please create .env file with required variables"
    exit 1
fi

# Check if docker-compose.dev.yml exists
if [ ! -f "docker-compose.dev.yml" ]; then
    echo "❌ Error: docker-compose.dev.yml not found"
    echo "   Please run from project root directory"
    exit 1
fi

# Parse arguments
DETACHED=""
if [ "$1" == "--detached" ] || [ "$1" == "-d" ]; then
    DETACHED="-d"
    echo "📦 Starting in detached mode (background)"
else
    echo "📦 Starting in foreground mode (logs visible)"
    echo "   Press Ctrl+C to stop"
fi

echo ""
echo "Building and starting local API..."
echo ""

# Start Docker Compose
if [ -n "$DETACHED" ]; then
    docker-compose -f docker-compose.dev.yml up --build -d
    
    echo ""
    echo "✅ Local API started successfully!"
    echo ""
    echo "📡 API Endpoints:"
    echo "   - Health Check:  http://localhost:8080/health"
    echo "   - Process Photo: http://localhost:8080/process"
    echo "   - Docs:          http://localhost:8080/docs"
    echo ""
    echo "📱 React Native App will auto-detect local API:"
    echo "   - Android: http://10.0.2.2:8080"
    echo "   - iOS:     http://localhost:8080"
    echo ""
    echo "📋 View logs:  docker-compose -f docker-compose.dev.yml logs -f api"
    echo "🛑 Stop:       docker-compose -f docker-compose.dev.yml down"
    echo ""
else
    docker-compose -f docker-compose.dev.yml up --build
fi
