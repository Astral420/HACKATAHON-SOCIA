# Deployment Guide

## Local Development with Docker

### Prerequisites
- Docker & Docker Compose installed
- Python 3 (for reset script)

### Quick Start

1. Copy environment file:
```bash
cp .env.example .env
```

2. Edit `.env` with your credentials

3. Run the reset script:
```bash
python3 docker_reset.py
```

Or manually:
```bash
docker compose down -v
docker compose build --no-cache
docker compose up
```

### Access Services
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## AWS EC2 Deployment

### 1. Launch EC2 Instance

**Recommended Specs:**
- Instance Type: t3.medium or larger
- OS: Ubuntu 22.04 LTS
- Storage: 30GB+ EBS
- Security Group Rules:
  - SSH (22) - Your IP
  - HTTP (80) - 0.0.0.0/0
  - HTTPS (443) - 0.0.0.0/0
  - Custom TCP (3000) - 0.0.0.0/0 (API)
  - Custom TCP (5173) - 0.0.0.0/0 (Frontend - dev only)

### 2. Connect to EC2

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### 3. Install Docker

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version

# Logout and login again for group changes
exit
```

### 4. Clone & Setup Project

```bash
# Clone repository
git clone your-repo-url
cd HACKATAHON-SOCIA

# Create .env file
cp .env.example .env
nano .env  # Edit with production values
```

### 5. Configure Environment Variables

Update `.env` with production values:
```bash
# Use EC2 public IP or domain
PUBLIC_URL=http://your-ec2-ip:3000
CORS_ORIGIN=http://your-ec2-ip:5173

# Strong passwords
DB_PASSWORD=strong_random_password
REDIS_PASSWORD=strong_random_password
API_KEY=strong_random_api_key

# Your actual API keys
GEN_AI_KEY=your_gemini_key
R2_ENDPOINT=your_r2_endpoint
# ... etc
```

### 6. Deploy

```bash
# Make reset script executable
chmod +x docker_reset.py

# Build and run
python3 docker_reset.py

# Or manually
docker compose up -d
```

### 7. Verify Deployment

```bash
# Check running containers
docker ps

# Check logs
docker compose logs -f server
docker compose logs -f postgres
docker compose logs -f redis

# Test API
curl http://localhost:3000/health
```

### 8. Setup Nginx Reverse Proxy (Production)

```bash
# Install Nginx
sudo apt install nginx -y

# Create config
sudo nano /etc/nginx/sites-available/meeting-ai
```

Add configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
    }

    # Public share links
    location /m {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/meeting-ai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 9. Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
```

### 10. Setup Auto-Start on Reboot

```bash
# Create systemd service
sudo nano /etc/systemd/system/meeting-ai.service
```

Add:
```ini
[Unit]
Description=Meeting AI Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ubuntu/HACKATAHON-SOCIA
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Enable:
```bash
sudo systemctl enable meeting-ai
sudo systemctl start meeting-ai
```

## Monitoring & Maintenance

### View Logs
```bash
docker compose logs -f
docker compose logs -f server
docker compose logs -f postgres
```

### Restart Services
```bash
docker compose restart server
docker compose restart
```

### Update Application
```bash
git pull
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Backup Database
```bash
docker exec meeting-ai-db pg_dump -U postgres meetings_db > backup.sql
```

### Restore Database
```bash
cat backup.sql | docker exec -i meeting-ai-db psql -U postgres meetings_db
```

### Monitor Resources
```bash
docker stats
htop
df -h
```

## Troubleshooting

### Container won't start
```bash
docker compose logs server
docker compose ps
```

### Database connection issues
```bash
docker compose exec postgres psql -U postgres -d meetings_db
```

### Redis connection issues
```bash
docker compose exec redis redis-cli -a your_redis_password
```

### Clear all data and restart
```bash
python3 docker_reset.py
```

## Production Checklist

- [ ] Strong passwords in `.env`
- [ ] Firewall configured (UFW or Security Groups)
- [ ] SSL certificate installed
- [ ] Nginx reverse proxy configured
- [ ] Auto-start on reboot enabled
- [ ] Backup strategy implemented
- [ ] Monitoring setup (CloudWatch, Datadog, etc.)
- [ ] Log rotation configured
- [ ] Domain DNS configured
- [ ] Environment variables secured
