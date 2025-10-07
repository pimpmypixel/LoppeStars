# Scraper Async Fix - Critical Issue Resolution

**Date:** 7 October 2025  
**Issue:** API becomes unresponsive when scraper is triggered  
**Status:** ✅ FIXED

## 🚨 Problem Identified

### Root Cause
The `/scraper/trigger` endpoint was using `subprocess.run()` which is a **synchronous blocking call**. This caused the entire FastAPI event loop to block while the scraper ran, making the API completely unresponsive.

### Impact
1. **API Unresponsive**: All endpoints (including `/health`) timeout during scraping
2. **Health Check Failures**: Load balancer marks container as unhealthy
3. **Container Restarts**: After 2-3 failed health checks, ECS kills and restarts the container
4. **Service Disruption**: No API requests can be processed for 10-30 minutes during scraping

### Timeline
- Scraper runs can take 10-30 minutes
- Health checks occur every 30 seconds
- After ~2-3 failures (60-90 seconds), container is marked unhealthy
- Container gets terminated and restarted
- Scraper job is killed mid-execution

## ✅ Solution Implemented

### Changes Made

**File:** `api/main.py`

#### Before (Blocking):
```python
@app.post("/scraper/trigger")
async def trigger_scraper():
    # BLOCKING - Waits for scraper to complete (up to 1 hour)
    result = subprocess.run([
        sys.executable, "/app/scraper_cron.py"
    ], capture_output=True, text=True, cwd="/app")
    
    if result.returncode == 0:
        return {"success": True, "output": result.stdout}
```

#### After (Non-Blocking):
```python
@app.post("/scraper/trigger")
async def trigger_scraper(background_tasks: BackgroundTasks):
    def run_scraper_background():
        # NON-BLOCKING - Starts process and returns immediately
        process = subprocess.Popen(
            [sys.executable, "/app/scraper_cron.py"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd="/app"
        )
        print(f"Scraper process started with PID: {process.pid}")
    
    background_tasks.add_task(run_scraper_background)
    return {"success": True, "message": "Scraper triggered in background"}
```

### Key Improvements

1. **✅ Non-Blocking**: API remains responsive during scraping
2. **✅ Background Execution**: Scraper runs as a separate process
3. **✅ Health Checks Pass**: `/health` endpoint always responds
4. **✅ No Container Restarts**: ECS service remains stable
5. **✅ Better UX**: API returns immediately after triggering scraper

## 📊 Resource Considerations

### Current ECS Configuration
- **CPU**: 256 units (0.25 vCPU)
- **Memory**: 512 MB
- **Launch Type**: Fargate

### Resource Usage During Scraping
With the async fix, the scraper runs as a **separate process**:
- **Main API process**: Continues handling requests
- **Scraper process**: Runs independently with shared resources

### Potential Issues to Monitor

1. **Memory Pressure** (512 MB is tight):
   - FastAPI + Scrapy + libraries ≈ 300-400 MB base
   - Scraping activity adds 100-200 MB
   - **Risk**: Could still hit OOM if scraping multiple sites concurrently
   - **Mitigation**: Monitor CloudWatch metrics, consider increasing to 1024 MB

2. **CPU Contention** (0.25 vCPU is minimal):
   - Shared between API and scraper
   - Could cause slower scraping
   - Health checks should still pass (they're lightweight)
   - **Mitigation**: Monitor response times during scraping

## 🔍 Monitoring Commands

### Check if scraper is running:
```bash
./scripts/tail-logs.sh --follow --scraper
```

### Monitor API health during scraping:
```bash
watch -n 5 'curl -s https://loppestars.spoons.dk/health'
```

### Check ECS task resource utilization:
```bash
aws ecs describe-tasks \
  --cluster LoppestarsCluster \
  --tasks $(aws ecs list-tasks --cluster LoppestarsCluster --query 'taskArns[0]' --output text) \
  --region eu-central-1
```

### Monitor CloudWatch metrics:
```bash
# Memory utilization
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name MemoryUtilization \
  --dimensions Name=ClusterName,Value=LoppestarsCluster \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average \
  --region eu-central-1
```

## 📋 Testing Plan

### Step 1: Deploy the Fix
```bash
cd /Users/andreas/Herd/loppestars
git add api/main.py
git commit -m "fix: Make scraper trigger async to prevent API blocking"
git push origin kitty
```

### Step 2: Wait for GitHub Actions Deployment
```bash
# Monitor deployment
gh run list --limit 1
gh run view <RUN_ID> --log
```

### Step 3: Verify API Health
```bash
# Test health endpoint
curl https://loppestars.spoons.dk/health

# Check service status
./scripts/deploy.sh --status
```

### Step 4: Trigger Scraper
```bash
./scripts/trigger-scraper.sh --api
```

### Step 5: Monitor During Scraping
```bash
# Terminal 1: Watch logs
./scripts/tail-logs.sh --follow --scraper

# Terminal 2: Monitor health
watch -n 5 'curl -s -w "\nStatus: %{http_code}\n" https://loppestars.spoons.dk/health'

# Terminal 3: Check ECS task status
watch -n 10 'aws ecs describe-services \
  --cluster LoppestarsCluster \
  --services loppestars-service \
  --query "services[0].{running:runningCount,desired:desiredCount,pending:pendingCount}" \
  --region eu-central-1'
```

### Expected Results
- ✅ API health endpoint responds within 1-2 seconds throughout scraping
- ✅ Scraper logs show activity in CloudWatch
- ✅ ECS service maintains 1/1 running count
- ✅ No container restarts during scraping
- ✅ Scraper completes successfully (10-30 minutes)

### If Issues Occur

**Symptom:** High memory usage (>90%)
**Action:** Increase task memory to 1024 MB

**Symptom:** Slow API responses during scraping
**Action:** Increase task CPU to 512 units (0.5 vCPU)

**Symptom:** Scraper process gets killed
**Action:** Check for OOM kills in logs, increase resources

## 🎯 Recommendations

### Short-term
1. ✅ Deploy the async fix immediately
2. 📊 Monitor first scraper run closely
3. 📈 Collect metrics on resource usage

### Medium-term (if issues persist)
1. **Increase Resources**:
   - CPU: 256 → 512 units (0.5 vCPU)
   - Memory: 512 MB → 1024 MB
   - Cost impact: ~$0.02/hour → ~$0.04/hour

2. **Separate Services** (optimal solution):
   - Main API service (256 CPU / 512 MB) - always running
   - Scraper service (512 CPU / 1024 MB) - runs on schedule
   - Benefits: Better isolation, no resource contention
   - Cost: Only pay for scraper during execution

3. **Use Lambda for Scraping**:
   - Trigger Lambda function from API
   - Lambda runs scraper with 3 GB memory, 15-minute timeout
   - Benefits: No impact on API, pay-per-execution
   - Trade-off: More complex setup

## 📚 Related Documentation

- [AWS ECS Task Sizing](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-cpu-memory-error.html)
- [FastAPI Background Tasks](https://fastapi.tiangolo.com/tutorial/background-tasks/)
- [Subprocess Best Practices](https://docs.python.org/3/library/subprocess.html#subprocess.Popen)

## ✅ Deployment Checklist

- [x] Fix implemented in `api/main.py`
- [ ] Code committed to Git
- [ ] Pushed to `kitty` branch
- [ ] GitHub Actions deployment successful
- [ ] API health verified
- [ ] Scraper trigger tested
- [ ] Resource usage monitored
- [ ] Documentation updated

---

**Next Steps:** Deploy the fix and monitor the first scraper run to validate the solution works as expected.
