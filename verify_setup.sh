#!/bin/bash

# Setup Verification Script
# Checks if all prerequisites and configurations are correct

echo "=================================="
echo "Meeting AI Setup Verification"
echo "=================================="
echo ""

ERRORS=0
WARNINGS=0

# Color codes
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

error() {
    echo -e "${RED}❌ $1${NC}"
    ((ERRORS++))
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Check Docker
echo "Checking Docker..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    success "Docker installed: $DOCKER_VERSION"
else
    error "Docker is not installed"
fi

# Check Docker Compose
echo "Checking Docker Compose..."
if docker compose version &> /dev/null; then
    COMPOSE_VERSION=$(docker compose version)
    success "Docker Compose available: $COMPOSE_VERSION"
else
    error "Docker Compose is not available"
fi

# Check if Docker daemon is running
echo "Checking Docker daemon..."
if docker ps &> /dev/null; then
    success "Docker daemon is running"
else
    error "Docker daemon is not running"
fi

# Check .env file
echo ""
echo "Checking environment configuration..."
if [ -f .env ]; then
    success ".env file exists"
    
    # Check required variables
    REQUIRED_VARS=(
        "DB_NAME"
        "DB_USER"
        "DB_PASSWORD"
        "REDIS_PASSWORD"
        "GEN_AI_KEY"
        "API_KEY"
    )
    
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^${var}=" .env; then
            VALUE=$(grep "^${var}=" .env | cut -d '=' -f2)
            if [ -z "$VALUE" ] || [[ "$VALUE" == *"your_"* ]] || [[ "$VALUE" == *"example"* ]]; then
                warning "$var is not configured (using placeholder value)"
            else
                success "$var is configured"
            fi
        else
            error "$var is missing from .env"
        fi
    done
else
    error ".env file not found"
    echo "  Run: cp .env.example .env"
fi

# Check server/.env
echo ""
echo "Checking server environment..."
if [ -f server/.env ]; then
    success "server/.env exists"
else
    warning "server/.env not found (will use root .env in Docker)"
fi

# Check Docker Compose files
echo ""
echo "Checking Docker Compose files..."
if [ -f docker-compose.yml ]; then
    success "docker-compose.yml exists"
else
    error "docker-compose.yml not found"
fi

if [ -f docker-compose.prod.yml ]; then
    success "docker-compose.prod.yml exists"
else
    warning "docker-compose.prod.yml not found"
fi

# Check Dockerfiles
echo ""
echo "Checking Dockerfiles..."
if [ -f server/Dockerfile ]; then
    success "server/Dockerfile exists"
else
    error "server/Dockerfile not found"
fi

if [ -f client/Dockerfile ]; then
    success "client/Dockerfile exists"
else
    warning "client/Dockerfile not found"
fi

# Check database schema
echo ""
echo "Checking database configuration..."
if [ -f server/config/database.sql ]; then
    success "Database schema file exists"
else
    error "server/config/database.sql not found"
fi

# Check if ports are available
echo ""
echo "Checking port availability..."
check_port() {
    PORT=$1
    NAME=$2
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        warning "Port $PORT ($NAME) is already in use"
    else
        success "Port $PORT ($NAME) is available"
    fi
}

check_port 3000 "Backend API"
check_port 5173 "Frontend"
check_port 5432 "PostgreSQL"
check_port 6379 "Redis"

# Check disk space
echo ""
echo "Checking disk space..."
AVAILABLE=$(df -h . | awk 'NR==2 {print $4}')
success "Available disk space: $AVAILABLE"

# Check Python for reset script
echo ""
echo "Checking Python..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    success "Python installed: $PYTHON_VERSION"
else
    warning "Python3 not found (docker_reset.py won't work)"
fi

# Summary
echo ""
echo "=================================="
echo "Verification Summary"
echo "=================================="
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! You're ready to deploy.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Review and update .env with your credentials"
    echo "  2. Run: make dev  (or: docker compose up -d)"
    echo "  3. Access: http://localhost:3000/health"
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Setup complete with $WARNINGS warning(s)${NC}"
    echo ""
    echo "You can proceed, but review the warnings above."
    echo "Run: make dev  (or: docker compose up -d)"
else
    echo -e "${RED}❌ Setup incomplete: $ERRORS error(s), $WARNINGS warning(s)${NC}"
    echo ""
    echo "Please fix the errors above before deploying."
    exit 1
fi

echo ""
