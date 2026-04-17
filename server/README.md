# Meeting AI Processing Backend

Backend API for meeting recording management with AI-powered transcription and analysis.

## Architecture

```
/controllers     - HTTP request/response handlers
/models          - Database query layer
/routes          - API route definitions
/services        - Business logic (AI, storage, caching)
/middlewares     - Auth, validation, error handling
/utils           - Database, Redis, logging utilities
/config          - Database schema
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. Setup database:
```bash
psql -U postgres -d meetings_db -f config/database.sql
```

4. Start Redis:
```bash
redis-server
```

5. Run server:
```bash
npm run dev
```

## API Endpoints

### Meetings
- `POST /api/meetings` - Create meeting
- `GET /api/meetings` - List meetings
- `GET /api/meetings/:id` - Get meeting details
- `PUT /api/meetings/:id` - Update meeting
- `DELETE /api/meetings/:id` - Delete meeting
- `POST /api/meetings/:id/upload` - Upload recording
- `POST /api/meetings/:id/share` - Generate share link

### AI Processing
- `POST /api/meetings/:id/process` - Process meeting with AI
- `GET /api/meetings/:id/ai-output` - Get AI analysis

### Public
- `GET /m/:token` - Public meeting view (no auth)

## Authentication

Include API key in header:
```
X-API-KEY: your_api_key
```

Or use Bearer token:
```
Authorization: Bearer your_jwt_token
```
