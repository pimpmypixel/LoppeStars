# Local Development Testing Guide

## Current Status ✅

**Local API**: Running at http://localhost:8080
- Container: `loppestars-api-1` (started with `docker-compose up -d`)
- Health Check: `curl http://localhost:8080/health` → `{"status":"healthy","service":"loppestars"}`
- Live Reload: Enabled with `uvicorn --reload` (1-second code changes)

**React Native App**: Running on Android Emulator
- Build: Successful (28s, 576 tasks)
- APK: Installed and launched
- Metro: Listening on http://localhost:8081
- Emulator: Medium_Phone_API_36.1

**API Auto-Detection**: Implemented in `app/utils/api.ts`
- Android: Checks http://10.0.2.2:8080/health (emulator → host localhost)
- iOS: Checks http://localhost:8080/health (simulator → host localhost)
- Timeout: 1 second (fast fail if not available)
- Cache: 1 minute (avoids excessive checks)
- Fallback: https://loppestars.spoons.dk (production)

## Test Scenarios

### Scenario 1: Local API Active (Current State)

**Setup**:
```bash
# Terminal 1: Local API
cd /Users/andreas/Herd/loppestars
docker-compose up -d
docker-compose logs -f  # Watch logs

# Terminal 2: React Native App
cd /Users/andreas/Herd/loppestars/app
npm run android
```

**Expected Behavior**:
1. App starts and detects local API
2. Console log: `✅ Local API detected at: http://10.0.2.2:8080 {"status":"healthy","service":"loppestars"}`
3. Console log: `🔧 Using LOCAL API: http://10.0.2.2:8080`
4. Photo uploads processed by local API
5. Docker logs show processing in real-time

**Testing Photo Upload**:
1. Navigate to "Add Item" tab
2. Tap "Take Photo" button
3. Capture photo with face(s)
4. Tap "Use Photo"
5. Watch progress: 0% → 25% → 50% → 100%
6. Verify processed photo appears with pixelated faces

**Verification**:
```bash
# Check Docker logs for processing
docker-compose logs -f

# Expected output:
# INFO:     127.0.0.1:xxxxx - "POST /process HTTP/1.1" 200 OK
# Face detection, pixelation, upload to stall-photos-processed

# Check app console logs (Metro bundler terminal)
# Expected:
# [photo-upload] Using API: http://10.0.2.2:8080
# [photo-upload] Processing image with FastAPI /process endpoint
# [photo-upload] Photo upload completed successfully
```

### Scenario 2: Local API Stopped (Fallback to Production)

**Setup**:
```bash
# Stop local API
docker-compose down

# App continues running
```

**Expected Behavior**:
1. Next photo upload tries local (1s timeout)
2. Timeout occurs (no local API running)
3. Console log: `ℹ️  Local API not available at http://10.0.2.2:8080 - using production`
4. Console log: `🚀 Using PRODUCTION API: https://loppestars.spoons.dk`
5. Photo uploads processed by production API
6. Seamless fallback (user doesn't notice)

**Testing**:
1. Stop local API: `docker-compose down`
2. Navigate to "Add Item" tab
3. Take photo and upload
4. Should process successfully via production
5. Check Metro logs for production API usage

### Scenario 3: Live Code Reload

**Setup**:
```bash
# Ensure local API running
docker-compose up -d
docker-compose logs -f
```

**Test Steps**:
1. Open `api/main.py` in editor
2. Add debug log in `/process` endpoint:
   ```python
   @app.post("/process")
   async def process_image(req: ProcessRequest):
       print(f"🐛 DEBUG: Processing image: {req.imagePath}")
       # ... existing code
   ```
3. Save file
4. Watch Docker logs: `INFO: ℹ️  Reloading...` (within 1 second)
5. Take photo in app
6. See debug log in Docker logs immediately

**Expected Result**:
- Code change detected instantly
- API reloads in ~1 second
- No need to rebuild Docker container
- Next request uses updated code

### Scenario 4: Force Production API (Testing)

**Setup**:
```javascript
// In app screen (e.g., RatingScreen.tsx)
import { forceProductionAPI } from '../utils/api';

// Before photo upload
forceProductionAPI();
```

**Expected Behavior**:
1. API detection skipped
2. Always uses production: https://loppestars.spoons.dk
3. Console log: `🚀 Forced PRODUCTION API: https://loppestars.spoons.dk`
4. Useful for testing production behavior in development

### Scenario 5: Force Local API (Testing)

**Setup**:
```javascript
// In app screen
import { forceLocalAPI } from '../utils/api';

// Before photo upload
forceLocalAPI();
```

**Expected Behavior**:
1. Auto-detection skipped
2. Always tries local: http://10.0.2.2:8080 (Android)
3. Console log: `🔧 Forced LOCAL API: http://10.0.2.2:8080`
4. Useful for debugging local API issues

## Network Architecture

### Android Emulator Networking
```
┌─────────────────────────────────────┐
│  Android Emulator                   │
│  ┌──────────────────────────────┐   │
│  │  React Native App            │   │
│  │                              │   │
│  │  Tries: 10.0.2.2:8080/health │   │
│  └──────────────┬───────────────┘   │
│                 │                   │
│     Special IP: 10.0.2.2            │
│     (maps to host's localhost)      │
└─────────────────┼───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  Host Machine (macOS)               │
│  ┌──────────────────────────────┐   │
│  │  Docker Container            │   │
│  │  ┌──────────────────────┐    │   │
│  │  │  FastAPI             │    │   │
│  │  │  Port: 8080          │    │   │
│  │  │                      │────┼───► Supabase Cloud
│  │  └──────────────────────┘    │   │  (Internet access)
│  └──────────────────────────────┘   │
│  localhost:8080                     │
└─────────────────────────────────────┘
```

**Key Points**:
- Emulator sees host as `10.0.2.2` (NOT `127.0.0.1` or `localhost`)
- Docker container port 8080 exposed to host
- Docker container has internet → Supabase Cloud access
- Same Supabase instance for local and production

### iOS Simulator Networking
```
┌─────────────────────────────────────┐
│  iOS Simulator                      │
│  ┌──────────────────────────────┐   │
│  │  React Native App            │   │
│  │                              │   │
│  │  Tries: 127.0.0.1:8080/health│   │
│  └──────────────┬───────────────┘   │
│                 │                   │
│     Direct access to host localhost │
└─────────────────┼───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  Host Machine (macOS)               │
│  (Same Docker setup as Android)     │
└─────────────────────────────────────┘
```

**Key Points**:
- Simulator can use `localhost` or `127.0.0.1` directly
- No special IP needed (unlike Android)
- Same Docker/Supabase setup works

## API Detection Flow

```javascript
// In app/utils/api.ts

export async function getAPIBaseUrl(): Promise<string> {
  // 1. Check cache (1-minute TTL)
  if (cachedApiUrl && !expired) {
    return cachedApiUrl;
  }
  
  // 2. In development mode, try local first
  if (__DEV__) {
    // Platform-specific URL
    const localUrl = Platform.OS === 'android' 
      ? 'http://10.0.2.2:8080'     // Android
      : 'http://localhost:8080';    // iOS/web
    
    try {
      // Fast fail: 1 second timeout
      const response = await fetch(`${localUrl}/health`, {
        signal: AbortSignal.timeout(1000)
      });
      
      if (response.ok && data.status === 'healthy') {
        console.log('✅ Local API detected');
        return localUrl;
      }
    } catch {
      // Silent fail, try production
    }
  }
  
  // 3. Fall back to production
  console.log('🚀 Using PRODUCTION API');
  return 'https://loppestars.spoons.dk';
}
```

## Docker Commands Reference

### Start Local API
```bash
# Start in foreground (see logs)
docker-compose up

# Start in background (detached)
docker-compose up -d

# Rebuild if Dockerfile changed
docker-compose up --build

# Rebuild without cache
docker-compose up --build --no-cache
```

### View Logs
```bash
# Follow logs (like tail -f)
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Specific service
docker-compose logs -f api
```

### Stop Local API
```bash
# Stop containers (keep volumes)
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Force stop (if hanging)
docker-compose down --timeout 1
```

### Container Status
```bash
# List running containers
docker-compose ps

# Detailed container info
docker ps

# Container resource usage
docker stats
```

### Debugging
```bash
# Enter running container
docker-compose exec api bash

# Check environment variables
docker-compose exec api env

# Test health endpoint inside container
docker-compose exec api curl http://localhost:8080/health

# Restart container
docker-compose restart api
```

## Common Issues & Solutions

### Issue: App Not Detecting Local API

**Symptoms**:
- Console shows: "Using PRODUCTION API"
- Local API running but not detected

**Debugging**:
```bash
# 1. Check Docker container running
docker ps
# Should show: loppestars-api-1 with port 8080

# 2. Test health endpoint from host
curl http://localhost:8080/health
# Expected: {"status":"healthy","service":"loppestars"}

# 3. Test from Android emulator IP
curl http://10.0.2.2:8080/health
# (Run this on Android device/emulator if possible)

# 4. Check Docker logs for startup errors
docker-compose logs api
# Look for: "Uvicorn running on http://0.0.0.0:8080"
```

**Solutions**:
- Restart Docker: `docker-compose restart`
- Rebuild: `docker-compose up --build`
- Check port not in use: `lsof -i :8080`
- Force local API in app: `forceLocalAPI()`

### Issue: Docker Build Fails

**Symptoms**:
- `docker-compose up` shows build errors
- Missing dependencies or files

**Solutions**:
```bash
# 1. Check .env file exists
cat .env | grep SUPABASE
# Should show SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, etc.

# 2. Rebuild without cache
docker-compose build --no-cache

# 3. Clean Docker cache
docker system prune -a

# 4. Check Dockerfile syntax
docker-compose config
```

### Issue: Live Reload Not Working

**Symptoms**:
- Code changes don't apply
- Must restart Docker manually

**Debugging**:
```bash
# 1. Check volume mount
docker-compose exec api ls -la /app/api
# Should show main.py, face_processor.py, etc.

# 2. Check uvicorn running with --reload
docker-compose logs api | grep reload
# Should show: "Will watch for changes in these directories"

# 3. Test by touching file
touch api/main.py
docker-compose logs api --tail=5
# Should show: "INFO: ℹ️  Reloading..."
```

**Solutions**:
- Check `docker-compose.yml` has volume mount: `./api:/app/api:ro`
- Restart with rebuild: `docker-compose up --build`
- Check file permissions: `ls -la api/`

### Issue: Supabase Connection Fails

**Symptoms**:
- API logs show: "Supabase error"
- 500 errors from `/process` endpoint

**Debugging**:
```bash
# 1. Check environment variables in container
docker-compose exec api env | grep SUPABASE
# Should show: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, etc.

# 2. Test Supabase connection
docker-compose exec api python3 -c "
from supabase import create_client
import os
url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
supabase = create_client(url, key)
print('Connected to Supabase:', url)
"
```

**Solutions**:
- Check `.env` file has correct Supabase credentials
- Restart Docker to reload env vars: `docker-compose restart`
- Test Supabase dashboard access: https://supabase.com/dashboard

### Issue: Port 8080 Already in Use

**Symptoms**:
- `docker-compose up` fails with "port is already allocated"

**Solutions**:
```bash
# 1. Find process using port 8080
lsof -i :8080

# 2. Kill process
kill -9 <PID>

# 3. Or change port in docker-compose.yml
# Change: "8080:8080" to "8081:8080"
# Then use: http://localhost:8081
```

## Performance Benchmarks

### Local API (Target)
- Photo upload: < 500ms
- Face detection: 100-300ms
- Pixelation: 50-100ms
- Upload to Supabase: 200-500ms
- **Total**: 1-2 seconds

### Production API (Baseline)
- Network latency: +500-1000ms
- Processing: Same as local
- **Total**: 2-8 seconds

### Iteration Speed
- Code change detected: < 1 second
- API reload: 1-2 seconds
- Test in app: < 1 second
- **Total iteration**: 2-4 seconds

## Best Practices

### Daily Workflow
1. Start Docker: `docker-compose up -d`
2. Start app: `cd app && npm run android`
3. Develop, test, iterate
4. Watch Docker logs: `docker-compose logs -f`
5. Stop Docker when done: `docker-compose down`

### When to Use Local API
✅ Feature development (rapid iteration)
✅ Testing edge cases (controlled environment)
✅ Debugging API issues (live logs)
✅ Offline development (no production access)

### When to Use Production API
✅ Testing production behavior
✅ Verifying deployment changes
✅ Performance benchmarking (real network)
✅ Testing with production data

### Code Organization
- API code: `api/` folder
- App API integration: `app/hooks/usePhotoUpload.ts`
- API detection: `app/utils/api.ts`
- Docker config: `docker-compose.yml` (root)

## Next Steps

### Immediate Testing
1. ✅ Local API running (verified)
2. ✅ App running (verified)
3. ⏳ Test photo upload with local API
4. ⏳ Verify face pixelation working
5. ⏳ Test live reload workflow

### Feature Testing
- [ ] Single face detection
- [ ] Multiple faces detection
- [ ] No faces (should process normally)
- [ ] Large images (>5MB)
- [ ] Error handling (network failures)

### Performance Testing
- [ ] Measure local API response times
- [ ] Compare with production API
- [ ] Test concurrent uploads
- [ ] Monitor memory usage

### Integration Testing
- [ ] Verify Supabase Storage uploads
- [ ] Check processed images in dashboard
- [ ] Test rating submission with processed images
- [ ] Verify CloudWatch logs (production)

## Useful Commands

### Quick Health Check
```bash
# Check everything is running
docker ps && curl http://localhost:8080/health && echo "\n✅ All systems ready"
```

### Full Reset
```bash
# Stop everything, clean up, rebuild, restart
docker-compose down -v
docker system prune -f
docker-compose up --build -d
docker-compose logs -f
```

### Watch Multiple Logs
```bash
# Terminal multiplexer approach
tmux new-session \; \
  send-keys 'docker-compose logs -f' C-m \; \
  split-window -h \; \
  send-keys 'cd app && npm run android' C-m
```

### Check API from Android Emulator
```bash
# From emulator terminal (adb shell)
adb shell
$ curl http://10.0.2.2:8080/health
```

## Conclusion

✅ **Setup Complete**:
- Docker API running with live reload
- React Native app with auto-detection
- Seamless local/production switching
- 1-second iteration cycle

🚀 **Ready to Test**:
- Take photos and test face pixelation
- Watch real-time Docker logs
- Edit code and see changes instantly
- Fall back to production automatically

📝 **Documentation**:
- This guide for testing and troubleshooting
- `LOCAL_API_DEVELOPMENT_SIMPLE.md` for setup details
- `PHOTO_UPLOAD_FLOW.md` for architecture
- `TESTING_PHOTO_UPLOAD.md` for comprehensive testing
