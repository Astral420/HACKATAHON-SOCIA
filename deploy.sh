#!/bin/bash

# Meeting AI Deployment Script
# Quick deployment for production environments

set -e

echo "=================================="
echo "Meeting AI Deployment Script"
echo "=================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env from .env.example"
    exit 1
fi

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed"
    exit 1
fi

# Check if docker compose is available
if ! docker compose version &> /dev/null; then
    echo "❌ Error: Docker Compose is not available"
    exit 1
fi

# Parse arguments
ENVIRONMENT=${1:-development}
ACTION=${2:-up}

echo "Environment: $ENVIRONMENT"
echo "Action: $ACTION"
echo ""

# Select compose file
if [ "$ENVIRONMENT" = "production" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
else
    COMPOSE_FILE="docker-compose.yml"
fi

echo "Using: $COMPOSE_FILE"
echo ""

# Execute action
case $ACTION in
    up)
        echo "Starting services..."
        docker compose -f $COMPOSE_FILE up -d
        echo ""
        echo "✓ Services started!"
        echo ""
        docker compose -f $COMPOSE_FILE ps
        ;;
    down)
        echo "Stopping services..."
        docker compose -f $COMPOSE_FILE down
        echo "✓ Services stopped!"
        ;;
    restart)
        echo "Restarting services..."
        docker compose -f $COMPOSE_FILE restart
        echo "✓ Services restarted!"
        ;;
    logs)
        docker compose -f $COMPOSE_FILE logs -f
        ;;
    build)
        echo "Building services..."
        docker compose -f $COMPOSE_FILE build --no-cache
        echo "✓ Build complete!"
        ;;
    rebuild)
        echo "Rebuilding and restarting..."
        docker compose -f $COMPOSE_FILE down
        docker compose -f $COMPOSE_FILE build --no-cache
        docker compose -f $COMPOSE_FILE up -d
        echo "✓ Rebuild complete!"
        ;;
    *)
        echo "Usage: ./deploy.sh [environment] [action]"
        echo ""
        echo "Environments:"
        echo "  development (default)"
        echo "  production"
        echo ""
        echo "Actions:"
        echo "  up (default)  - Start services"
        echo "  down          - Stop services"
        echo "  restart       - Restart services"
        echo "  logs          - View logs"
        echo "  build         - Build images"
        echo "  rebuild       - Rebuild and restart"
        echo ""
        echo "Examples:"
        echo "  ./deploy.sh development up"
        echo "  ./deploy.sh production rebuild"
        echo "  ./deploy.sh production logs"
        exit 1
        ;;
esac

echo ""
echo "=================================="
echo "Deployment complete!"
echo "=================================="
