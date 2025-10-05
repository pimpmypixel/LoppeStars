# Architecture Overview

Technical architecture and infrastructure details for Loppestars.

---

## System Architecture

```
┌─────────────────┐
│  Mobile App     │
│  (React Native) │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
    ┌────▼────┐      ┌────▼────────┐
    │Supabase │      │  API (ECS)  │
    │ Cloud   │      │   FastAPI   │
    └─────────┘      └─────┬───────┘
                           │
                     ┌─────▼──────┐
                     │  Scrapy    │
                     │  (Cron)    │
                     └────────────┘
```

### Components

**Mobile App (React Native + Expo)**
- User interface and navigation
- Google OAuth authentication
- Camera and photo capture
- Location services
- Local state management (AsyncStorage)
- API communication

**Supabase (Backend-as-a-Service)**
- PostgreSQL database
- Authentication (Google OAuth)
- Storage (photo uploads)
- Row-level security policies
- Real-time subscriptions

**API (FastAPI on AWS ECS)**
- Face detection and blurring (OpenCV)
- Market data endpoints
- Health checks
- Image processing pipeline
- Cron job for daily scraping

**Scraper (Scrapy)**
- Extracts market data from markedskalenderen.dk
- Runs daily at 2 AM via cron
- Upserts data to Supabase
- Handles duplicates and updates

---

## Infrastructure (AWS)

### Network Architecture
```
Internet
   │
   ├─► Cloudflare (DNS + CDN)
   │      │
   │      ▼
   ├─► Application Load Balancer (HTTPS)
         │
         ├─► Target Group (/health checks)
               │
               ▼
         ECS Fargate Tasks (port 8080)
```

### AWS Resources

**Networking**
- VPC: 10.0.0.0/16
- Public Subnets: 2 across AZs (a, b)
- Internet Gateway
- Route tables

**Compute**
- ECS Cluster: Fargate launch type
- ECS Service: 1 task (auto-scaling ready)
- Task Definition: 256 CPU, 512 MB memory
- Container: FastAPI on port 8080

**Load Balancing**
- Application Load Balancer
- HTTP listener (port 80) → HTTPS redirect
- HTTPS listener (port 443) → Target group
- Target group health checks: `/health`, 30s interval

**Security**
- ALB Security Group: Allows 80/443 from internet
- ECS Security Group: Allows 8080 from ALB only
- IAM Task Execution Role: ECR pull, CloudWatch logs
- IAM Task Role: Supabase access (if needed)

**Monitoring**
- CloudWatch Log Group: `/ecs/loppestars`
- CloudWatch Metrics: CPU, memory, request count
- Target health status

**DNS & SSL**
- Route 53 (optional)
- Cloudflare DNS with proxy
- ACM SSL certificate (*.spoons.dk)

---

## Docker BuildX Optimization

### Multi-Stage Build

```dockerfile
# Stage 1: Base (system deps)
FROM python:3.11-slim AS base
RUN apt-get update && install packages...

# Stage 2: Dependencies (Python packages)
FROM base AS dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Stage 3: Models (download once)
FROM dependencies AS models
RUN wget face detection models...

# Stage 4: Runtime (app code)
FROM models AS runtime
COPY api/ /app/
CMD ["uvicorn", "main:app"]
```

### Cache Strategy

**Layer Caching**
- Each stage caches independently
- Only rebuilds changed layers and downstream
- Code changes don't invalidate model downloads

**Registry Cache (ECR)**
- Cache stored in ECR with `buildcache` tag
- Shared across builds and machines
- Mode: `max` (caches all intermediate layers)

**Local Cache Mounts**
- `/var/cache/apt` - APT packages
- `/root/.cache/pip` - Python packages
- Persists between builds on same machine

### Build Performance

| Scenario | Time | Why Fast |
|----------|------|----------|
| No changes | ~5s | 100% cache hit |
| Code changes | ~5s | Only runtime stage rebuilds |
| requirements.txt change | ~2-3min | Deps + runtime rebuild |
| System packages change | ~4-5min | Base + all downstream |

---

## Mobile App Architecture

### Navigation Structure

```
AppNavigator (Bottom Tabs)
├── Home
├── Markets
│   └── MarketDetails
├── Rating
│   ├── CameraModal
│   └── PhotoPreview
└── More
    ├── MyRatings
    ├── About
    ├── Privacy
    ├── Organiser
    ├── Advertising
    └── Contact
```

### State Management

**Contexts**
- `AuthContext` - User session, login/logout
- `ThemeContext` - Light/dark mode
- `MarketContext` - Market data cache
- `ConnectivityContext` - API health status

**Persistence**
- AsyncStorage for auth tokens
- Supabase session auto-refresh
- Location permissions state

### Data Flow

```
User Action
   ↓
Component
   ↓
Context Hook
   ↓
Supabase Client / API
   ↓
Update State
   ↓
Re-render UI
```

---

## API Architecture

### FastAPI Endpoints

**Health Check**
```
GET /health
→ {"status": "healthy", "service": "loppestars"}
```

**Face Processing**
```
POST /process-face
Body: multipart/form-data (image file)
→ Processed image with blurred faces
```

**Markets**
```
GET /markets/today
GET /markets/nearby?latitude=55.6761&longitude=12.5683&radius=50
GET /markets/search?query=Copenhagen
```

### Face Detection Pipeline

```
Upload Image
   ↓
OpenCV DNN Model (res10_300x300)
   ↓
Detect Faces (bounding boxes)
   ↓
Apply Gaussian Blur
   ↓
Save to Supabase Storage
   ↓
Return Processed Image URL
```

### Scraper Architecture

**Scrapy Spider**
- Target: markedskalenderen.dk
- Extracts: Market name, dates, location, features
- Middleware: User-agent rotation, retry logic
- Output: JSON items

**Cron Job**
- Schedule: Daily at 2 AM
- Command: `python scraper_cron.py`
- Logging: `/app/logs/scraper.log`
- Error handling: Retries on failure

**Data Flow**
```
Scrapy Spider
   ↓
Extract Market Data
   ↓
Validate & Transform
   ↓
Upsert to Supabase
   ↓
Log Results
```

---

## Security

### Authentication Flow

```
User clicks "Sign in with Google"
   ↓
Google OAuth prompt
   ↓
User approves
   ↓
Google returns auth code
   ↓
App exchanges code for tokens
   ↓
Supabase verifies tokens
   ↓
Creates/updates user session
   ↓
Returns JWT access token
   ↓
App stores in AsyncStorage
   ↓
Includes token in API requests
```

### Data Protection

**At Rest**
- Supabase database encryption
- S3/Storage bucket encryption
- Environment variables in ECS (encrypted)

**In Transit**
- TLS 1.2/1.3 (Cloudflare → ALB → ECS)
- HTTPS only (HTTP redirects)
- Supabase connections over HTTPS

**Access Control**
- Row-level security (RLS) in Supabase
- IAM roles with least privilege
- API rate limiting (Cloudflare)
- Face blurring for privacy

---

## Scalability

### Current Capacity
- **Single task**: ~100 req/min
- **Database**: Supabase free tier (500 MB, 2 GB egress)
- **Storage**: Supabase 1 GB free

### Scaling Strategy

**Horizontal Scaling (ECS)**
```bash
aws ecs update-service \
  --cluster Lopp estarsCluster \
  --service loppestars-service \
  --desired-count 3
```

**Auto-Scaling (Target Tracking)**
- CPU > 70% → scale out
- CPU < 30% → scale in
- Request count per target

**Database Scaling**
- Upgrade Supabase plan
- Add read replicas
- Connection pooling (PgBouncer)

**CDN (Cloudflare)**
- Cache static assets
- Edge caching for API responses
- DDoS protection included

---

## Monitoring & Observability

### Metrics

**CloudWatch**
- Container CPU/Memory
- Request count
- Response time
- Error rate (5xx)

**Supabase Dashboard**
- Database connections
- Query performance
- Storage usage
- Auth events

### Logging

**Application Logs**
```bash
aws logs tail /ecs/loppestars --follow
```

**Structure**
- Timestamp
- Log level (INFO, WARNING, ERROR)
- Message
- Context (request ID, user ID)

### Alerting (Future)

- CPU > 80% for 5 minutes
- Error rate > 5% for 1 minute
- Health check failures
- Storage > 90% capacity

---

## Disaster Recovery

### Backup Strategy

**Database**
- Supabase daily backups (automatic)
- Point-in-time recovery (7 days)
- Export via pg_dump for archival

**Storage**
- S3 versioning enabled
- Cross-region replication (optional)

**Code**
- Git repository (GitHub)
- Tagged releases

### Recovery Procedures

**Data Loss**
```bash
# Restore from Supabase backup
supabase db reset --db-url <backup-url>
```

**Service Outage**
```bash
# Rollback to previous task definition
aws ecs update-service --task-definition loppestars:33
```

**Complete Failure**
```bash
# Redeploy entire stack
cd aws
./deploy.sh --force
```

---

## Performance Optimization

### Mobile App
- Image compression before upload
- Lazy loading for market lists
- AsyncStorage caching
- Debounced search inputs

### API
- Response compression (gzip)
- Connection pooling to Supabase
- Async I/O (FastAPI)
- Efficient OpenCV algorithms

### Database
- Indexes on frequently queried columns
- Partial indexes for common filters
- Query optimization with EXPLAIN
- Connection pooling

---

## Technology Choices

### Why React Native + Expo?
- Cross-platform (iOS + Android)
- Fast development cycle
- Large ecosystem
- OTA updates with Expo

### Why Supabase?
- PostgreSQL (proven, scalable)
- Built-in auth
- Real-time subscriptions
- Generous free tier
- Easy to self-host later

### Why FastAPI?
- High performance (async)
- Automatic API docs
- Type safety with Pydantic
- Easy to deploy

### Why AWS ECS Fargate?
- Serverless containers
- No server management
- Auto-scaling
- Cost-effective for low traffic

### Why BuildX?
- Multi-stage caching
- Cross-platform builds
- Registry cache support
- Faster CI/CD

---

## Future Enhancements

### Phase 1 (Current)
- ✅ Google OAuth
- ✅ Market browsing
- ✅ Photo upload
- ✅ Face blurring
- ✅ Rating system

### Phase 2 (Next)
- [ ] Facebook OAuth
- [ ] Push notifications
- [ ] User profiles
- [ ] Social features (follow, like)
- [ ] Search filters

### Phase 3 (Future)
- [ ] Admin dashboard
- [ ] Analytics
- [ ] Recommendations
- [ ] Gamification
- [ ] API for third parties

---

**Technical decisions documented!** 📐
