# Local API Development - Simplified Guide

## TL;DR

```bash
# 1. Start local API
cd api && docker-compose up

# 2. Run React Native app
cd app && npm run android

# That's it! App auto-detects local API at 10.0.2.2:8080
```

---

## Why This Approach Works

**Question**: Why not use ngrok or port forwarding?  
**Answer**: You don't need it! Here's why:

1. **Docker can reach Supabase Cloud directly** (it has internet access)
2. **Android emulator can reach localhost** via `10.0.2.2`
3. **Same Supabase instance** for both local and production
4. **No tunneling, no proxies, no complexity**

---

## The Simple Truth

```
┌──────────────────────────────────────────────────────┐
│  You're NOT running Supabase locally                 │
│  You're only running the FastAPI server locally      │
│  It talks to Supabase Cloud (same as production)     │
└──────────────────────────────────────────────────────┘
```

**Local API** = FastAPI container on your Mac  
**Supabase** = Always cloud (production database & storage)

---

## Setup (One Time)

### 1. Environment Variables

Your `.env` file already has everything needed:

```bash
# These work for BOTH local and production!
SUPABASE_URL=https://oprevwbturtujbugynct.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SOURCE_BUCKET=stall-photos
STORAGE_BUCKET=stall-photos-processed
```

### 2. Docker Compose File

Already created at `docker-compose.yml`:

```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    env_file:
      - .env
    volumes:
      - ./api:/app/api  # Live reload on code changes
    command: uvicorn api.main:app --host 0.0.0.0 --port 8080 --reload
```

**Key**: `--reload` flag = instant code changes without rebuild!

---

## Daily Workflow

### Start Local API

```bash
cd /Users/andreas/Herd/loppestars
docker-compose up
```

**What happens:**
1. Docker builds FastAPI image (first time only)
2. Starts container on port 8080
3. Connects to Supabase Cloud (using your credentials)
4. Watches for code changes in `api/` folder
5. Auto-reloads on save (no rebuild needed!)

**First time:** ~30 seconds (build image)  
**Subsequent starts:** ~2 seconds (use cached image)

### Run React Native App

```bash
cd /Users/andreas/Herd/loppestars/app
npm run android
```

**What happens:**
1. App checks `http://10.0.2.2:8080/health`
2. If responds → "🟢 Using local API"
3. If no response → "🔵 Using production API"
4. All API calls use detected endpoint

### Make Changes

1. **Edit API code** in `api/main.py` or `api/face_processor.py`
2. **Save file**
3. **Wait 1 second** (auto-reload)
4. **Test in app** immediately!

No rebuild, no redeploy, no waiting!

---

## How Auto-Detection Works

### app/utils/apiUtils.ts

```typescript
export async function detectApiEndpoint(): Promise<string> {
  // Android emulator: 10.0.2.2 = host machine localhost
  // iOS simulator: 127.0.0.1 = host machine localhost
  const localUrl = Platform.OS === 'android' 
    ? 'http://10.0.2.2:8080'
    : 'http://127.0.0.1:8080';
  
  try {
    const response = await fetch(`${localUrl}/health`, { 
      timeout: 1000  // Fast fail if not available
    });
    
    if (response.ok) {
      console.log('🟢 Using local API');
      return localUrl;
    }
  } catch (error) {
    console.log('🔵 Using production API (local not available)');
  }
  
  return 'https://loppestars.spoons.dk';  // Production fallback
}
```

**Simple!** Try local, fall back to production. No configuration needed.

---

## Network Addresses Explained

### For Android Emulator

- **`10.0.2.2`** = Host machine's `localhost`
- **`127.0.0.1`** = Emulator itself (doesn't work for reaching host!)
- **`localhost`** = Same as 127.0.0.1 (doesn't work!)

### For iOS Simulator

- **`127.0.0.1`** = Host machine's `localhost` (works!)
- **`localhost`** = Same as 127.0.0.1 (works!)

### Why This Matters

```bash
# Your Mac:
localhost:8080 → FastAPI server

# Android Emulator:
10.0.2.2:8080 → Your Mac's localhost:8080 → FastAPI server ✅
127.0.0.1:8080 → Emulator itself (nothing there) ❌

# iOS Simulator:
127.0.0.1:8080 → Your Mac's localhost:8080 → FastAPI server ✅
```

---

## Testing Local API

### 1. Check Health

```bash
# From your Mac
curl http://localhost:8080/health
# {"status":"healthy","service":"loppestars"}

# From Android emulator (via adb)
adb shell "curl http://10.0.2.2:8080/health"
# {"status":"healthy","service":"loppestars"}
```

### 2. Test Face Processing

```bash
# Upload test image to Supabase first (via dashboard)
# Path: test-user/test.jpg in stall-photos bucket

curl -X POST http://localhost:8080/process \
  -H "Content-Type: application/json" \
  -d '{
    "imagePath": "test-user/test.jpg",
    "userId": "test-user",
    "mode": "pixelate",
    "pixelateSize": 15
  }'
```

### 3. Watch Logs

```bash
# Terminal where docker-compose is running shows live logs:
api_1  | INFO: 10.0.2.2:54321 - "POST /process HTTP/1.1" 200 OK
api_1  | Downloading: test-user/test.jpg
api_1  | Faces detected: 2
api_1  | Uploading: test-user/12345-processed.jpg
```

---

## Common Scenarios

### Scenario 1: Test API Changes Quickly

```bash
# 1. Start local API
docker-compose up

# 2. Run app
cd app && npm run android

# 3. Edit api/main.py (add debug logging, change parameters, etc.)
# 4. Save → auto-reloads in 1 second
# 5. Test immediately in app

# No deployment, no waiting!
```

### Scenario 2: Test with Production API

```bash
# 1. Stop local API (Ctrl+C in docker-compose terminal)
# 2. Restart app (or just wait 1 second, it re-checks on next API call)
# 3. App automatically uses production API

# Switch back: Just restart docker-compose up
```

### Scenario 3: Debug Face Detection

```bash
# 1. Add print statements in api/face_processor.py:
print(f"Image size: {img.shape}")
print(f"Faces found: {len(faces)}")

# 2. Save file (auto-reloads)
# 3. Take photo in app
# 4. See debug output in docker-compose logs immediately
```

---

## Advantages

### ✅ Speed
- **Code change → Test**: 1 second
- **No deploy**: Save hours per day
- **Fast iteration**: Try, fail, fix, repeat

### ✅ Simplicity
- **No ngrok**: No tunnels, no public URLs
- **No local Supabase**: Use production cloud
- **No complex networking**: Direct localhost access

### ✅ Safety
- **Same data**: Test with real Supabase data
- **Same storage**: Real buckets, real files
- **Same behavior**: Identical to production

### ✅ Flexibility
- **Switch anytime**: Local ↔ Production instantly
- **Multiple developers**: Each runs own local API
- **Offline capable**: Works without production deploy

---

## Limitations

### What You CAN'T Do

1. **Test ECS deployment issues** (use staging environment)
2. **Test load balancer behavior** (deploy to production)
3. **Test from real device over WiFi** (needs ngrok for that)

### What You CAN Do

1. **Test all API logic** ✅
2. **Test face detection** ✅
3. **Test Supabase integration** ✅
4. **Test error handling** ✅
5. **Debug with live logs** ✅
6. **Iterate rapidly** ✅

---

## Troubleshooting

### Issue: "Local API not detected"

**Check:**
```bash
# Is Docker running?
docker ps

# Is API container running?
docker-compose ps

# Can you reach it from Mac?
curl http://localhost:8080/health
```

**Fix:**
```bash
# Restart Docker
docker-compose down
docker-compose up
```

### Issue: "Connection refused from emulator"

**Check:**
```bash
# From Android emulator terminal (via adb):
adb shell
curl http://10.0.2.2:8080/health
```

**Fix:**
- Make sure using `10.0.2.2`, not `127.0.0.1`
- Check firewall isn't blocking port 8080
- Restart emulator

### Issue: "Supabase connection error in local API"

**Check:**
```bash
# Are credentials in .env?
cat .env | grep SUPABASE_URL

# Can Docker reach Supabase?
docker-compose exec api curl -I https://oprevwbturtujbugynct.supabase.co
```

**Fix:**
- Verify `.env` file exists in project root
- Check credentials are correct
- Ensure Docker has internet access

### Issue: "Code changes not reloading"

**Check:**
```bash
# Is --reload flag in docker-compose.yml?
cat docker-compose.yml | grep reload
```

**Fix:**
```bash
# Restart with reload:
docker-compose down
docker-compose up
```

---

## When to Use What

### Use Local API When:
- 🔧 Developing new API features
- 🐛 Debugging face detection
- 📊 Testing with different parameters
- 🎨 Experimenting with changes
- ⚡ Need instant feedback

### Use Production API When:
- 🚀 Testing deployed version
- 🌍 Testing from real device
- 👥 Demoing to others
- ✅ Verifying production behavior
- 📱 Not actively developing API

---

## Quick Reference

### Start Local Development

```bash
# Terminal 1: Start API
cd /Users/andreas/Herd/loppestars
docker-compose up

# Terminal 2: Run app
cd /Users/andreas/Herd/loppestars/app
npm run android
```

### Stop Local Development

```bash
# Terminal 1: Stop API
Ctrl+C
docker-compose down

# App automatically switches to production
```

### Check Which API App Is Using

```bash
# In app logs (React Native debugger or Metro):
🟢 Using local API at http://10.0.2.2:8080
# or
🔵 Using production API at https://loppestars.spoons.dk
```

### Force Production API

```bash
# Stop local API
docker-compose down

# App will auto-detect and switch in 1 second
```

---

## Best Practices

### 1. Always Use Local for Development

```bash
# Start of day:
docker-compose up

# End of day:
Ctrl+C (leave running if continuing tomorrow)
```

### 2. Test Locally Before Deploying

```bash
# 1. Make changes to api/main.py
# 2. Test in app with local API
# 3. Verify everything works
# 4. Commit and push (triggers deployment)
# 5. Wait for deployment
# 6. Test with production API
```

### 3. Use Logs for Debugging

```bash
# docker-compose terminal shows live logs
# Add print() statements liberally
# Watch output while testing in app
```

### 4. Keep .env Updated

```bash
# If Supabase credentials change:
# 1. Update .env file
# 2. Restart docker-compose
# 3. Credentials instantly updated
```

---

## Summary

**Local API development is SIMPLE:**

1. **One command** to start: `docker-compose up`
2. **Auto-detection** in app (no configuration)
3. **Live reload** on code changes (1 second)
4. **Same Supabase** as production (real data)
5. **Instant switch** between local and production

**No ngrok, no proxies, no complexity!**

Just Docker + localhost + Supabase Cloud = Fast development 🚀

---

## Next Steps

1. **Try it now:**
   ```bash
   docker-compose up
   # Open app, see "🟢 Using local API"
   ```

2. **Make a change:**
   ```python
   # api/main.py - add debug logging
   print("🐛 Processing image:", req.imagePath)
   ```

3. **Save and watch:**
   ```bash
   # Docker logs show:
   # INFO: Uvicorn running on http://0.0.0.0:8080 (Press CTRL+C to quit)
   # INFO: Started reloader process
   # ℹ️  Reloading...
   ```

4. **Test immediately:**
   - Take photo in app
   - See debug log in docker terminal instantly
   - Iterate!

**Happy local developing!** 🎉
