# CodeRun Sandbox - Railway Deployment

## Quick Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/0dMP5L?referralCode=alphasec)

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **Docker in Docker**: Railway supports containerized code execution

## Deployment Steps

### 1. Add Services
In your Railway project, add these services:
- **PostgreSQL Database** (for production data storage)
- **Redis** (for queue management)
- **This Repository** (the main application)

### 2. Environment Variables
Railway will automatically set most variables. You may need to configure:
```env
NODE_ENV=production
PORT=5000
FRONTEND_URL=${RAILWAY_PUBLIC_DOMAIN}
```

### 3. Database Migration
The app will automatically create tables on first run with PostgreSQL.

## Service Configuration

### Main Application
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Port**: `5000`

### PostgreSQL Database
- Railway will provide `DATABASE_URL` automatically
- Tables are created automatically on startup

### Redis
- Railway will provide `REDIS_URL` automatically
- Used for background job processing

## Features Included

✅ **Safe Code Execution** - Docker containers with resource limits  
✅ **Multi-language Support** - Python & JavaScript  
✅ **Real-time Results** - Queue-based processing  
✅ **Production Database** - PostgreSQL with proper indexing  
✅ **Caching Layer** - Redis for performance  
✅ **Security** - Rate limiting, CORS, helmet  
✅ **Monitoring** - Health checks and error handling  

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Client  │───▶│   Express API    │───▶│   PostgreSQL    │
│   (Static)      │    │   (Railway)      │    │   (Railway)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   Redis Queue    │
                       │   (Railway)      │
                       └──────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │ Docker Execution │
                       │  (Containers)    │
                       └──────────────────┘
```

## Post-Deployment

1. **Database Seeding**: Initial problems are loaded automatically
2. **Health Check**: Visit `/health` to verify deployment
3. **API Docs**: Available at `/api/docs`

## Local Development

```bash
# Install dependencies
npm run setup

# Start development servers
npm run dev

# Access the app
open http://localhost:3000
```

## Support

For deployment issues, check:
1. Railway service logs
2. Database connection status
3. Redis connectivity
4. Docker daemon availability