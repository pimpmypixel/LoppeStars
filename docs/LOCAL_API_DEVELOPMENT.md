# Local API Development Setup

## Overview

When developing the API locally, the React Native app will automatically detect and use your local API server instead of production. This enables rapid iteration without deploying to AWS ECS.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Native App                        │
│                                                             │
│  1. Check: http://localhost:8080/health                    │
│     ├─ ✅ Available → Use local API                        │
│     └─ ❌ Not available → Use production API               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────┴──────────────────┐
        │                                     │
        ▼                                     ▼
┌──────────────────┐              ┌──────────────────┐
│   Local Docker   │              │  Production API  │
│   localhost:8080 │              │  loppestars.     │
│                  │              │  spoons.dk       │
│  - Fast testing  │              │                  │
│  - Hot reload    │              │  - Stable        │
│  - Debug mode    │              │  - Deployed code │
└──────────────────┘              └──────────────────┘
```

---

## Setup Steps

### 1. **Add Local API Detection to App**

The app will automatically check for a local API on startup and when processing images.

**File:** `app/utils/api.ts` (new file)

```typescript
import { Platform } from 'react-native';

const PRODUCTION_API = 'https://loppestars.spoons.dk';
const LOCAL_API_ANDROID = 'http://10.0.2.2:8080'; // Android emulator
const LOCAL_API_IOS = 'http://localhost:8080'; // iOS simulator
const LOCAL_API_WEB = 'http://localhost:8080'; // Web browser

let cachedApiUrl: string | null = null;

/**
 * Check if local API is available
 */
export async function checkLocalAPI(): Promise<boolean> {
  const localUrl = getLocalAPIUrl();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000); // 1 second timeout
    
    const response = await fetch(`${localUrl}/health`, {
      signal: controller.signal,
      method: 'GET',
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log('✅ Local API detected at:', localUrl);
      return true;
    }
  } catch (error) {
    // Local API not available (expected in most cases)
    console.log('ℹ️  Local API not available, using production');
  }
  
  return false;
}

/**
 * Get local API URL based on platform
 */
function getLocalAPIUrl(): string {
  if (Platform.OS === 'android') {
    return LOCAL_API_ANDROID; // 10.0.2.2 maps to host's localhost
  } else if (Platform.OS === 'ios') {
    return LOCAL_API_IOS;
  } else {
    return LOCAL_API_WEB;
  }
}

/**
 * Get API base URL (local or production)
 * Caches the result for performance
 */
export async function getAPIBaseUrl(): Promise<string> {
  // Return cached URL if available
  if (cachedApiUrl) {
    return cachedApiUrl;
  }
  
  // Check for local API
  const isLocalAvailable = await checkLocalAPI();
  
  if (isLocalAvailable) {
    cachedApiUrl = getLocalAPIUrl();
    console.log('🔧 Using LOCAL API:', cachedApiUrl);
  } else {
    cachedApiUrl = PRODUCTION_API;
    console.log('🚀 Using PRODUCTION API:', cachedApiUrl);
  }
  
  return cachedApiUrl;
}

/**
 * Reset cached API URL (useful for testing or manual override)
 */
export function resetAPICache(): void {
  cachedApiUrl = null;
  console.log('🔄 API cache reset');
}

/**
 * Force use of production API (for testing)
 */
export function forceProductionAPI(): void {
  cachedApiUrl = PRODUCTION_API;
  console.log('🚀 Forced PRODUCTION API:', cachedApiUrl);
}

/**
 * Force use of local API (for testing)
 */
export function forceLocalAPI(): void {
  cachedApiUrl = getLocalAPIUrl();
  console.log('🔧 Forced LOCAL API:', cachedApiUrl);
}
```

---

### 2. **Update Photo Upload Hook**

Update `app/hooks/usePhotoUpload.ts` to use the API detection:

```typescript
import { getAPIBaseUrl } from '../utils/api';

// Inside uploadPhoto function, replace:
const API_BASE_URL = 'https://loppestars.spoons.dk';

// With:
const API_BASE_URL = await getAPIBaseUrl();
```

---

### 3. **Run Local API with Docker**

#### Option A: Docker Compose (Recommended)

**File:** `docker-compose.dev.yml`

```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - SOURCE_BUCKET=stall-photos
      - STORAGE_BUCKET=stall-photos-processed
    volumes:
      - ./api:/app/api:ro
      - ./api/scrapy_project:/app/api/scrapy_project:ro
    command: uvicorn api.main:app --host 0.0.0.0 --port 8080 --reload
```

**Start local API:**
```bash
docker-compose -f docker-compose.dev.yml up
```

**Stop local API:**
```bash
docker-compose -f docker-compose.dev.yml down
```

---

#### Option B: Docker Run (Manual)

```bash
# Build image
docker build -t loppestars-api \
  --build-arg SUPABASE_URL=$SUPABASE_URL \
  --build-arg SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY \
  --build-arg SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY \
  --build-arg SOURCE_BUCKET=stall-photos \
  --build-arg STORAGE_BUCKET=stall-photos-processed \
  .

# Run container
docker run -d \
  -p 8080:8080 \
  --name loppestars-api-dev \
  -e SUPABASE_URL=$SUPABASE_URL \
  -e SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY \
  -e SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY \
  loppestars-api

# View logs
docker logs -f loppestars-api-dev

# Stop container
docker stop loppestars-api-dev
docker rm loppestars-api-dev
```

---

### 4. **Test Local API**

```bash
# Health check
curl http://localhost:8080/health

# Expected response
{"status":"healthy","service":"loppestars"}
```

---

## Ngrok Setup for Supabase Webhooks

If you need Supabase to call your local API (for webhooks, Edge Functions testing, etc.), use ngrok:

### **Install Ngrok**

```bash
# macOS
brew install ngrok

# Or download from https://ngrok.com/download
```

---

### **Start Ngrok Tunnel**

```bash
# Tunnel to local API
ngrok http 8080
```

**Output:**
```
ngrok                                                                    

Session Status                online
Account                       andreas@example.com
Version                       3.x.x
Region                        Europe (eu)
Latency                       10ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok.io -> http://localhost:8080

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**Your public URL:** `https://abc123.ngrok.io`

---

### **Configure Supabase to Use Ngrok**

#### **For Edge Functions:**

If you have a Supabase Edge Function that needs to call your local API:

1. Go to Supabase Dashboard → Edge Functions
2. Update environment variables:
   ```
   API_URL=https://abc123.ngrok.io
   ```

#### **For Webhooks:**

If Supabase needs to send webhooks to your local API:

1. Go to Supabase Dashboard → Database → Webhooks
2. Set webhook URL to: `https://abc123.ngrok.io/webhook`
3. Configure events and payload

#### **For Database Functions:**

If you have a PostgreSQL function that makes HTTP calls:

```sql
-- Update your function to use ngrok URL during development
SELECT net.http_post(
  url := 'https://abc123.ngrok.io/process',
  headers := jsonb_build_object('Content-Type', 'application/json'),
  body := jsonb_build_object('imagePath', 'test.jpg')
);
```

---

### **Ngrok Web Interface**

Access ngrok's web interface to inspect requests:

```
http://127.0.0.1:4040
```

**Features:**
- See all incoming requests
- Inspect request/response headers and bodies
- Replay requests for debugging
- View timing and status codes

---

### **Permanent Ngrok URL (Paid Feature)**

For consistent development, use a reserved domain:

```bash
# Get a free static domain from ngrok dashboard
ngrok http 8080 --domain=yourapp.ngrok.io
```

**Benefits:**
- Same URL every time
- No need to update Supabase config on each restart
- Can share with team

---

## Development Workflow

### **Starting Development Session**

1. **Start local API:**
   ```bash
   docker-compose -f docker-compose.dev.yml up
   ```

2. **Verify API is running:**
   ```bash
   curl http://localhost:8080/health
   ```

3. **Start ngrok (if needed for Supabase):**
   ```bash
   ngrok http 8080
   ```

4. **Run React Native app:**
   ```bash
   cd app && npm run android
   # or
   npm run ios
   ```

5. **App automatically detects local API** ✅

---

### **Making API Changes**

**With Hot Reload:**
1. Edit files in `api/` folder
2. Docker container automatically restarts (if using `--reload`)
3. No need to rebuild Docker image
4. Changes available immediately

**Without Hot Reload:**
1. Edit files in `api/` folder
2. Rebuild Docker image: `docker-compose -f docker-compose.dev.yml build`
3. Restart container: `docker-compose -f docker-compose.dev.yml up`

---

### **Testing Photo Upload Flow**

1. **Local API running** at `http://localhost:8080`
2. **Open app** on emulator/simulator
3. **Navigate** to "Add Item" tab
4. **Take/select photo** with face(s)
5. **Watch logs:**
   - React Native console: "🔧 Using LOCAL API: http://10.0.2.2:8080"
   - Docker logs: "POST /process" request received
   - FastAPI logs: Processing details
6. **Verify** faces are pixelated
7. **Check** Docker logs for any errors

---

### **Debugging Tips**

#### **App can't connect to local API:**

**Android Emulator:**
```typescript
// Use 10.0.2.2 instead of localhost
const LOCAL_API_ANDROID = 'http://10.0.2.2:8080';
```

**iOS Simulator:**
```typescript
// localhost works fine on iOS
const LOCAL_API_IOS = 'http://localhost:8080';
```

**Test connectivity:**
```bash
# From Android emulator
adb shell
curl http://10.0.2.2:8080/health

# From iOS simulator (Terminal)
curl http://localhost:8080/health
```

---

#### **Check Docker container is running:**

```bash
# List running containers
docker ps

# Expected output
CONTAINER ID   IMAGE              COMMAND                  CREATED          STATUS          PORTS                    NAMES
abc123def456   loppestars-api     "uvicorn api.main:a…"   10 seconds ago   Up 9 seconds    0.0.0.0:8080->8080/tcp   loppestars-api-dev
```

---

#### **View Docker logs:**

```bash
# Follow logs in real-time
docker logs -f loppestars-api-dev

# Last 100 lines
docker logs --tail 100 loppestars-api-dev

# Filter for errors
docker logs loppestars-api-dev 2>&1 | grep ERROR
```

---

#### **Test API directly:**

```bash
# Health check
curl http://localhost:8080/health

# Process endpoint (requires image in Supabase)
curl -X POST http://localhost:8080/process \
  -H "Content-Type: application/json" \
  -d '{
    "imagePath": "test-user/test.jpg",
    "userId": "test-user",
    "mode": "pixelate",
    "pixelateSize": 15,
    "blurStrength": 31,
    "downscaleForDetection": 800
  }'
```

---

#### **Reset API detection in app:**

If the app is stuck using the wrong API:

1. **Shake device/emulator** to open dev menu
2. **Tap "Reload"** to restart app
3. **Check console** for: "🔧 Using LOCAL API" or "🚀 Using PRODUCTION API"

Or programmatically:
```typescript
import { resetAPICache } from './utils/api';

// In dev menu or debug screen
<Button onPress={resetAPICache} title="Reset API Cache" />
```

---

## Environment Variables

### **Local Development (.env.local)**

Create `.env.local` for local API development:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Buckets
SOURCE_BUCKET=stall-photos
STORAGE_BUCKET=stall-photos-processed

# API
API_BASE_URL=http://localhost:8080  # Auto-detected, but can override

# Ngrok (if using)
NGROK_URL=https://abc123.ngrok.io
```

**Load in Docker Compose:**
```yaml
env_file:
  - .env.local
```

---

## VS Code Integration

### **Launch Configuration**

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Docker: Start Local API",
      "type": "docker",
      "request": "launch",
      "preLaunchTask": "docker-compose-up",
      "platform": "python"
    },
    {
      "name": "Attach to Docker API",
      "type": "python",
      "request": "attach",
      "connect": {
        "host": "localhost",
        "port": 5678
      },
      "pathMappings": [
        {
          "localRoot": "${workspaceFolder}/api",
          "remoteRoot": "/app/api"
        }
      ]
    }
  ]
}
```

---

### **Tasks Configuration**

Add to `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "docker-compose-up",
      "type": "shell",
      "command": "docker-compose -f docker-compose.dev.yml up -d",
      "problemMatcher": []
    },
    {
      "label": "docker-compose-down",
      "type": "shell",
      "command": "docker-compose -f docker-compose.dev.yml down",
      "problemMatcher": []
    },
    {
      "label": "docker-logs",
      "type": "shell",
      "command": "docker logs -f loppestars-api-dev",
      "problemMatcher": []
    }
  ]
}
```

---

## Performance Comparison

### **Local API**
- **Startup:** < 1 second
- **Hot reload:** < 1 second
- **Request latency:** < 50ms
- **Iteration speed:** ⚡ Instant

### **Production API**
- **Deployment:** 5-8 minutes (GitHub Actions + ECS)
- **Request latency:** 100-200ms (AWS + Cloudflare)
- **Iteration speed:** 🐌 Slow

### **Result:**
**10-100x faster** development with local API! 🚀

---

## Troubleshooting

### **Issue: App always uses production API**

**Solution:**
1. Check local API is running: `curl http://localhost:8080/health`
2. Check correct URL for platform (10.0.2.2 for Android)
3. Reset API cache in app
4. Check firewall/network settings

---

### **Issue: Docker container won't start**

**Solution:**
1. Check port 8080 is not in use: `lsof -i :8080`
2. Check Docker is running: `docker ps`
3. Check environment variables are set
4. View container logs: `docker logs loppestars-api-dev`

---

### **Issue: Ngrok tunnel closed**

**Solution:**
1. Restart ngrok: `ngrok http 8080`
2. Update Supabase webhook URL with new ngrok URL
3. Consider paid ngrok plan for persistent domains

---

### **Issue: Supabase can't reach ngrok URL**

**Solution:**
1. Verify ngrok is running: Check web interface at http://127.0.0.1:4040
2. Test publicly: `curl https://your-ngrok-url.ngrok.io/health`
3. Check ngrok firewall rules
4. Ensure webhook payload is correct

---

## Summary

✅ **Local API detection** - Automatic fallback to production  
✅ **Fast iteration** - No deployment needed for testing  
✅ **Hot reload** - Changes reflected immediately  
✅ **Ngrok integration** - Supabase can reach local API  
✅ **Platform-specific URLs** - Works on Android, iOS, Web  
✅ **Easy debugging** - Docker logs + ngrok inspector  

**Happy developing!** 🔧📸✨
