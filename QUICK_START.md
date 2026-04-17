# Quick Start Guide

Get up and running in 5 minutes.

## Prerequisites

- Docker & Docker Compose
- 4GB+ RAM available
- 10GB+ disk space

## Setup Steps

### 1. Verify Prerequisites

```bash
./verify_setup.sh
```

This checks Docker, ports, and configuration.

### 2. Configure Environment

```bash
cp .env.example .env
nano .env  # or use your favorite editor
```

Minimum required:
```bash
DB_PASSWORD=your_secure_password
REDIS_PASSWORD=your_redis_password
GEN_AI_KEY=your_gemini_api_key
API_KEY=your_api_key
```

### 3. Start Services

Choose one method:

**Option A: Using Make (recommended)**
```bash
make install  # Verify setup
make dev      # Start development
```

**Option B: Using Python script**
```bash
python3 docker_reset.py
```

**Option C: Using deploy script**
```bash
./deploy.sh development up
```

**Option D: Direct Docker Compose**
```bash
docker compose up -d
```

### 4. Verify Deployment

```bash
# Check status
make status

# Or manually
docker compose ps
curl http://localhost:3000/health
```

Expected response:
```json
{"status":"ok","timestamp":"2024-..."}
```

## Access Points

- **Backend API**: http://localhost:3000
- **Frontend**: http://localhost:5173
- **API Health**: http://localhost:3000/health

## Test API

```bash
# Set your API key
export API_KEY="your_api_key_from_env"

# Create a meeting
curl -X POST http://localhost:3000/api/meetings \
  -H "X-API-KEY: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": 1,
    "title": "Test Meeting",
    "recordingUrl": "https://example.com/recording.mp4"
  }'

# List meetings
curl http://localhost:3000/api/meetings \
  -H "X-API-KEY: $API_KEY"
```

## Common Commands

```bash
# View logs
make logs
# or
docker compose logs -f

# Restart services
make restart

# Stop everything
make down

# Complete reset
make clean
make dev
```

## Troubleshooting

### Port already in use
```bash
# Find what's using the port
lsof -i :3000

# Kill the process or change port in .env
```

### Container won't start
```bash
# Check logs
docker compose logs server

# Rebuild
make rebuild
```

### Database connection error
```bash
# Check if postgres is healthy
docker compose ps

# Access database
make db-shell
```

### Redis connection error
```bash
# Check redis
docker compose exec redis redis-cli -a your_redis_password
```

## Next Steps

1. Read [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
2. Check [server/README.md](server/README.md) for API documentation
3. Review [docker-compose.yml](docker-compose.yml) for service configuration

## Getting Help

- Check logs: `make logs`
- Verify setup: `./verify_setup.sh`
- Container status: `make status`
- Full reset: `python3 docker_reset.py`
