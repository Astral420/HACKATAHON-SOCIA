.PHONY: help dev prod up down restart logs build rebuild clean backup restore

help:
	@echo "Meeting AI Platform - Make Commands"
	@echo ""
	@echo "Development:"
	@echo "  make dev          - Start development environment"
	@echo "  make logs         - View all logs"
	@echo "  make restart      - Restart all services"
	@echo ""
	@echo "Production:"
	@echo "  make prod         - Start production environment"
	@echo "  make prod-logs    - View production logs"
	@echo "  make prod-restart - Restart production services"
	@echo ""
	@echo "Build:"
	@echo "  make build        - Build all images"
	@echo "  make rebuild      - Rebuild without cache"
	@echo ""
	@echo "Cleanup:"
	@echo "  make down         - Stop all services"
	@echo "  make clean        - Remove all containers and volumes"
	@echo ""
	@echo "Database:"
	@echo "  make backup       - Backup database"
	@echo "  make restore      - Restore database from backup.sql"
	@echo "  make db-shell     - Access database shell"
	@echo ""
	@echo "Utilities:"
	@echo "  make reset        - Full reset (Python script)"
	@echo "  make status       - Show container status"

# Development
dev:
	docker compose up -d
	@echo "✓ Development environment started"
	@make status

logs:
	docker compose logs -f

restart:
	docker compose restart
	@echo "✓ Services restarted"

# Production
prod:
	docker compose -f docker-compose.prod.yml up -d
	@echo "✓ Production environment started"
	@docker compose -f docker-compose.prod.yml ps

prod-logs:
	docker compose -f docker-compose.prod.yml logs -f

prod-restart:
	docker compose -f docker-compose.prod.yml restart
	@echo "✓ Production services restarted"

# Build
build:
	docker compose build
	@echo "✓ Build complete"

rebuild:
	docker compose build --no-cache
	@echo "✓ Rebuild complete"

# Cleanup
down:
	docker compose down
	@echo "✓ Services stopped"

clean:
	docker compose down -v
	@echo "✓ All containers and volumes removed"

# Database
backup:
	@echo "Creating database backup..."
	docker exec meeting-ai-db pg_dump -U postgres meetings_db > backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "✓ Backup created"

restore:
	@echo "Restoring database from backup.sql..."
	cat backup.sql | docker exec -i meeting-ai-db psql -U postgres meetings_db
	@echo "✓ Database restored"

db-shell:
	docker compose exec postgres psql -U postgres -d meetings_db

redis-shell:
	docker compose exec redis redis-cli -a $$(grep REDIS_PASSWORD .env | cut -d '=' -f2)

# Utilities
reset:
	python3 docker_reset.py

status:
	@echo ""
	@docker compose ps
	@echo ""
	@echo "Health Status:"
	@docker compose exec server curl -s http://localhost:3000/health || echo "Server not ready"

install:
	@echo "Checking prerequisites..."
	@command -v docker >/dev/null 2>&1 || { echo "❌ Docker not installed"; exit 1; }
	@command -v docker compose >/dev/null 2>&1 || { echo "❌ Docker Compose not installed"; exit 1; }
	@[ -f .env ] || { echo "⚠️  Creating .env from .env.example"; cp .env.example .env; }
	@echo "✓ Prerequisites OK"
	@echo ""
	@echo "Next steps:"
	@echo "1. Edit .env with your credentials"
	@echo "2. Run: make dev"
