# Meeting AI Processing Platform

AI-powered meeting management system with automatic transcription, analysis, and client sharing capabilities.

## Features

- Meeting recording management with Cloudflare R2 storage
- AI-powered transcription and analysis using Google Gemini
- Automatic extraction of summaries, action items, and key points
- Sentiment analysis
- Secure client share links with expiration
- Redis caching for performance
- RESTful API with authentication
- Dockerized deployment

## Tech Stack

**Backend:**
- Node.js + Express
- PostgreSQL (database)
- Redis (caching)
- Google Gemini AI
- Cloudflare R2 (storage)

**Infrastructure:**
- Docker & Docker Compose
- Nginx (reverse proxy)
- AWS EC2 ready

## Quick Start

### 1. Verify Setup
```bash
./verify_setup.sh
```

### 2. Configure
```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Deploy
```bash
make dev
# or: python3 docker_reset.py
# or: ./deploy.sh development up
```

### 4. Access
- Frontend: http://localhost:5173
- Backend: http://localhost:3000/health

See [QUICK_START.md](QUICK_START.md) for detailed instructions.

## Project Structure

```
├── server/                 # Backend API
│   ├── controllers/        # HTTP handlers
│   ├── models/            # Database queries
│   ├── routes/            # API routes
│   ├── services/          # Business logic (AI, storage, cache)
│   ├── middlewares/       # Auth, validation, errors
│   ├── utils/             # DB, Redis, logging
│   └── config/            # Database schema
├── client/                # Frontend (TBD)
├── docker-compose.yml     # Development setup
├── docker-compose.prod.yml # Production setup
├── Makefile               # Make commands
├── docker_reset.py        # Reset & rebuild script
├── deploy.sh              # Deployment helper
├── verify_setup.sh        # Setup verification
└── DEPLOYMENT.md          # Full deployment guide
```

## Useful Commands

### Make Commands (Recommended)
```bash
make help          # Show all commands
make dev           # Start development
make logs          # View logs
make restart       # Restart services
make down          # Stop services
make clean         # Remove all containers/volumes
make backup        # Backup database
make status        # Show container status
```

### Python Script
```bash
python3 docker_reset.py    # Complete reset & rebuild
```

### Deployment Script
```bash
./deploy.sh development up      # Start dev
./deploy.sh production rebuild  # Rebuild prod
./deploy.sh production logs     # View logs
```

### Direct Docker Compose
```bash
docker compose up -d           # Start
docker compose logs -f         # Logs
docker compose restart         # Restart
docker compose down            # Stop
```

## API Endpoints

### Meetings
- `POST /api/meetings` - Create meeting
- `GET /api/meetings` - List meetings
- `GET /api/meetings/:id` - Get meeting
- `PUT /api/meetings/:id` - Update meeting
- `DELETE /api/meetings/:id` - Delete meeting
- `POST /api/meetings/:id/upload` - Upload recording
- `POST /api/meetings/:id/share` - Generate share link

### AI Processing
- `POST /api/meetings/:id/process` - Process with AI
- `GET /api/meetings/:id/ai-output` - Get AI results

### Public
- `GET /m/:token` - Public meeting view (no auth)

## Authentication

Include API key in requests:
```bash
curl -H "X-API-KEY: your_api_key" http://localhost:3000/api/meetings
```

Or use Bearer token:
```bash
curl -H "Authorization: Bearer your_token" http://localhost:3000/api/meetings
```

## AWS EC2 Deployment

Complete guide in [DEPLOYMENT.md](DEPLOYMENT.md):
- EC2 instance setup
- Docker installation
- Nginx reverse proxy
- SSL with Let's Encrypt
- Auto-start configuration
- Monitoring & maintenance

Quick deploy on EC2:
```bash
# After SSH into EC2
git clone <repo-url>
cd HACKATAHON-SOCIA
./verify_setup.sh
cp .env.example .env
# Edit .env with production values
./deploy.sh production up
```

## Environment Variables

Key variables in `.env`:
```bash
# Database
DB_NAME=meetings_db
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_PASSWORD=your_redis_password

# AI
GEN_AI_KEY=your_gemini_api_key

# Storage
R2_ENDPOINT=your_r2_endpoint
R2_ACCESS_KEY_ID=your_key
R2_SECRET_ACCESS_KEY=your_secret

# Auth
API_KEY=your_api_key

# URLs
PUBLIC_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:5173
```

## Development

### View logs:
```bash
make logs
# or: docker compose logs -f server
```

### Access database:
```bash
make db-shell
# or: docker compose exec postgres psql -U postgres -d meetings_db
```

### Access Redis:
```bash
make redis-shell
# or: docker compose exec redis redis-cli -a your_password
```

### Restart services:
```bash
make restart
# or: docker compose restart
```

### Backup database:
```bash
make backup
# Creates: backup_YYYYMMDD_HHMMSS.sql
```

## Troubleshooting

### Verify setup
```bash
./verify_setup.sh
```

### Check container status
```bash
make status
docker compose ps
```

### View specific service logs
```bash
docker compose logs -f server
docker compose logs -f postgres
docker compose logs -f redis
```

### Complete reset
```bash
python3 docker_reset.py
# or: make clean && make dev
```

### Port conflicts
```bash
# Check what's using a port
lsof -i :3000
```

## Production Checklist

- [ ] Run `./verify_setup.sh`
- [ ] Update `.env` with production values
- [ ] Use strong passwords (DB, Redis, API)
- [ ] Configure firewall/security groups
- [ ] Setup SSL certificate
- [ ] Configure Nginx reverse proxy
- [ ] Enable auto-start on reboot
- [ ] Setup monitoring (CloudWatch, etc.)
- [ ] Configure automated backups
- [ ] Update CORS_ORIGIN and PUBLIC_URL
- [ ] Test all endpoints
- [ ] Setup log rotation

## Documentation

- [QUICK_START.md](QUICK_START.md) - Get started in 5 minutes
- [DEPLOYMENT.md](DEPLOYMENT.md) - Complete deployment guide
- [server/README.md](server/README.md) - Backend API documentation

## License

MIT