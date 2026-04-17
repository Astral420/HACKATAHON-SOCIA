# Architecture Overview

Complete system architecture for the Meeting AI Processing Platform.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌──────────────┐              ┌──────────────┐            │
│  │   Browser    │              │  Mobile App  │            │
│  │  (React/Vue) │              │   (Future)   │            │
│  └──────┬───────┘              └──────┬───────┘            │
└─────────┼──────────────────────────────┼──────────────────┘
          │                              │
          └──────────────┬───────────────┘
                         │ HTTP/REST
          ┌──────────────▼───────────────┐
          │      Nginx (Production)       │
          │    Reverse Proxy + SSL        │
          └──────────────┬───────────────┘
                         │
          ┌──────────────▼───────────────┐
          │      Express.js Server        │
          │  ┌─────────────────────────┐ │
          │  │   Auth Middleware       │ │
          │  │   Validation Middleware │ │
          │  │   Error Middleware      │ │
          │  └─────────────────────────┘ │
          │  ┌─────────────────────────┐ │
          │  │   Controllers           │ │
          │  │   - Meeting             │ │
          │  │   - AI Processing       │ │
          │  │   - Client View         │ │
          │  └─────────────────────────┘ │
          │  ┌─────────────────────────┐ │
          │  │   Services              │ │
          │  │   - AI Service          │ │
          │  │   - Storage Service     │ │
          │  │   - URL Service         │ │
          │  │   - Cache Service       │ │
          │  └─────────────────────────┘ │
          │  ┌─────────────────────────┐ │
          │  │   Models                │ │
          │  │   - Meeting             │ │
          │  │   - Client              │ │
          │  │   - Transcript          │ │
          │  │   - AI Output           │ │
          │  └─────────────────────────┘ │
          └───────┬──────────┬──────────┘
                  │          │
        ┌─────────▼──┐   ┌──▼─────────┐
        │ PostgreSQL │   │   Redis    │
        │  Database  │   │   Cache    │
        └────────────┘   └────────────┘

External Services:
┌──────────────────┐  ┌──────────────────┐
│  Google Gemini   │  │  Cloudflare R2   │
│   AI Service     │  │  Object Storage  │
└──────────────────┘  └──────────────────┘
```

## Directory Structure

```
HACKATAHON-SOCIA/
├── server/                      # Backend application
│   ├── controllers/             # Request handlers
│   │   ├── meetingController.js    # Meeting CRUD
│   │   ├── aiController.js         # AI processing
│   │   └── clientViewController.js # Public views
│   │
│   ├── models/                  # Data access layer
│   │   ├── Meeting.js              # Meeting queries
│   │   ├── Client.js               # Client queries
│   │   ├── Transcript.js           # Transcript queries
│   │   └── AiOutput.js             # AI output queries
│   │
│   ├── routes/                  # API routes
│   │   ├── meetingRoutes.js        # /api/meetings/*
│   │   ├── aiRoutes.js             # /api/meetings/:id/process
│   │   └── publicRoutes.js         # /m/:token
│   │
│   ├── services/                # Business logic
│   │   ├── aiService.js            # Gemini integration
│   │   ├── storageService.js       # R2 uploads
│   │   ├── urlService.js           # Token generation
│   │   └── cacheService.js         # Redis helpers
│   │
│   ├── middlewares/             # Express middlewares
│   │   ├── authMiddleware.js       # Authentication
│   │   ├── errorMiddleware.js      # Error handling
│   │   └── validateMiddleware.js   # Request validation
│   │
│   ├── utils/                   # Utilities
│   │   ├── logger.js               # Pino logger
│   │   ├── db.js                   # PostgreSQL pool
│   │   └── redis.js                # Redis client
│   │
│   ├── config/                  # Configuration
│   │   └── database.sql            # DB schema
│   │
│   ├── app.js                   # Express setup
│   ├── server.js                # HTTP server
│   ├── package.json             # Dependencies
│   ├── Dockerfile               # Container image
│   └── .env.example             # Environment template
│
├── client/                      # Frontend (TBD)
│   ├── src/
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml           # Development setup
├── docker-compose.prod.yml      # Production setup
├── Makefile                     # Make commands
├── docker_reset.py              # Reset script
├── deploy.sh                    # Deployment script
├── verify_setup.sh              # Setup verification
├── .env.example                 # Root environment
├── .gitignore                   # Git ignore
├── README.md                    # Main documentation
├── QUICK_START.md               # Quick start guide
├── DEPLOYMENT.md                # Deployment guide
└── ARCHITECTURE.md              # This file
```

## Data Flow

### 1. Meeting Creation Flow
```
Client Request
    ↓
Auth Middleware (verify API key/JWT)
    ↓
Validation Middleware (check request body)
    ↓
Meeting Controller
    ↓
Meeting Model (INSERT query)
    ↓
PostgreSQL Database
    ↓
Response to Client
```

### 2. AI Processing Flow
```
Client Request (/api/meetings/:id/process)
    ↓
Auth Middleware
    ↓
AI Controller
    ↓
Check Cache (Redis)
    ├─ Hit → Return cached result
    └─ Miss ↓
Fetch Transcript (PostgreSQL)
    ↓
AI Service (Google Gemini)
    ↓
Parse AI Response
    ↓
Save to AI Output Model (PostgreSQL)
    ↓
Cache Result (Redis, 1 hour)
    ↓
Response to Client
```

### 3. File Upload Flow
```
Client Upload (multipart/form-data)
    ↓
Auth Middleware
    ↓
Meeting Controller
    ↓
Storage Service
    ↓
Generate R2 Key (user_id/timestamp-filename)
    ↓
Upload to Cloudflare R2
    ↓
Get Public URL
    ↓
Update Meeting Record (PostgreSQL)
    ↓
Response with URL
```

### 4. Public Share Flow
```
Client Request (/m/:token)
    ↓
Public Route (no auth)
    ↓
URL Service (validate token)
    ↓
Check Redis Cache
    ├─ Invalid → 404 Error
    └─ Valid ↓
Get Meeting ID
    ↓
Client View Controller
    ↓
Fetch Meeting Data (PostgreSQL)
    ├─ Meeting
    ├─ Client Info
    ├─ Transcript
    └─ AI Output
    ↓
Cache Result (Redis, 5 min)
    ↓
Response to Client
```

## Database Schema

```sql
┌─────────────────┐
│    clients      │
├─────────────────┤
│ id (PK)         │
│ name            │
│ email           │
│ company         │
│ user_id         │
│ created_at      │
└────────┬────────┘
         │
         │ 1:N
         │
┌────────▼────────┐
│    meetings     │
├─────────────────┤
│ id (PK)         │
│ client_id (FK)  │
│ title           │
│ recording_url   │
│ user_id         │
│ created_at      │
│ updated_at      │
└────────┬────────┘
         │
    ┌────┴────┐
    │ 1:1     │ 1:1
    │         │
┌───▼──────┐  ┌──▼──────────┐
│transcripts│  │ ai_outputs  │
├──────────┤  ├─────────────┤
│ id (PK)  │  │ id (PK)     │
│ meeting_id│  │ meeting_id  │
│ text     │  │ summary     │
│ language │  │ action_items│
│ created_at│  │ key_points  │
│ updated_at│  │ sentiment   │
└──────────┘  │ created_at  │
              │ updated_at  │
              └─────────────┘
```

## API Routes

### Protected Routes (require auth)
```
POST   /api/meetings              - Create meeting
GET    /api/meetings              - List meetings
GET    /api/meetings/:id          - Get meeting
PUT    /api/meetings/:id          - Update meeting
DELETE /api/meetings/:id          - Delete meeting
POST   /api/meetings/:id/upload   - Upload recording
POST   /api/meetings/:id/share    - Generate share link
POST   /api/meetings/:id/process  - Process with AI
GET    /api/meetings/:id/ai-output - Get AI results
```

### Public Routes (no auth)
```
GET    /m/:token                  - Public meeting view
GET    /health                    - Health check
```

## Technology Stack

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express.js 5
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Validation**: Zod
- **Logging**: Pino
- **AI**: Google Gemini API
- **Storage**: Cloudflare R2 (S3-compatible)

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Reverse Proxy**: Nginx
- **SSL**: Let's Encrypt (Certbot)
- **Cloud**: AWS EC2

### Development Tools
- **Package Manager**: npm
- **Process Manager**: nodemon
- **Build Tool**: Make
- **Scripts**: Python 3, Bash

## Security Considerations

### Authentication
- API Key validation
- JWT token support (placeholder)
- Per-request auth middleware

### Data Protection
- Environment variables for secrets
- Password-protected Redis
- PostgreSQL authentication
- HTTPS in production

### Input Validation
- Zod schema validation
- Request sanitization
- SQL injection prevention (parameterized queries)

### Rate Limiting (TODO)
- API rate limiting
- Redis-based throttling

## Scalability Considerations

### Horizontal Scaling
- Stateless API design
- Redis for shared cache
- Load balancer ready

### Caching Strategy
- Redis for hot data
- TTL-based expiration
- Cache invalidation on updates

### Database Optimization
- Indexed foreign keys
- Connection pooling
- Query optimization

### File Storage
- CDN-ready (R2 public URLs)
- Separate storage service
- Async upload processing

## Monitoring & Observability

### Logging
- Structured JSON logs (Pino)
- Log levels (info, warn, error)
- Request/response logging

### Health Checks
- `/health` endpoint
- Docker healthchecks
- Database connectivity checks

### Metrics (TODO)
- Prometheus integration
- Custom metrics
- Performance monitoring

## Deployment Environments

### Development
- Hot reload enabled
- Verbose logging
- Volume mounts for code
- Exposed ports

### Production
- Optimized builds
- Resource limits
- Internal networking
- SSL termination
- Log aggregation

## Future Enhancements

### Features
- [ ] Real-time transcription
- [ ] WebSocket support
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] User management
- [ ] Team collaboration

### Infrastructure
- [ ] Kubernetes deployment
- [ ] CI/CD pipeline
- [ ] Automated testing
- [ ] Performance monitoring
- [ ] Backup automation
- [ ] Multi-region support

### Security
- [ ] OAuth2 integration
- [ ] Role-based access control
- [ ] Audit logging
- [ ] Rate limiting
- [ ] DDoS protection
- [ ] Security scanning
