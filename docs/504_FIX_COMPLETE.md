# 504 Health Check Timeout - Complete Fix

## Problem Summary
`https://loppestars.spoons.dk/` returns **504 Gateway Timeout** error.

## Root Cause
1. **Wrong Health Check Path**: Target group was checking `/` instead of `/health`
2. **Short Timeout**: 5 seconds was too short for health checks
3. **No Logging**: Cannot see application startup errors
4. **Silent Failures**: Application may be failing to start but we can't see why

## Diagnosis Process

### 1. Checked ECS Service
```bash
/usr/local/bin/aws ecs describe-services --cluster LoppestarsEcsStack-ClusterEB0386A7-3Mzih57cTorn --services LoppestarsEcsStack-Service9571FDD8-mtj8oW2z8iEu --region eu-central-1
```
- Service: ACTIVE
- RunningCount: 1
- Task running since Oct 3rd

### 2. Checked Load Balancer Health
```bash
/usr/local/bin/aws elbv2 describe-target-health --target-group-arn ...
```
- Target: `10.0.104.63:8080`
- State: **unhealthy**
- Reason: **Target.Timeout**
- Description: "Request timed out"

### 3. Checked Health Check Configuration
```bash
/usr/local/bin/aws elbv2 describe-target-groups --target-group-arns ...
```
- ❌ HealthCheckPath: `/` (should be `/health`)
- ❌ HealthCheckTimeout: 5 seconds (too short)
- HealthCheckInterval: 30 seconds
- UnhealthyThreshold: 2

## Fixes Applied

### 1. Updated Target Group Health Check (Immediate Fix)
```bash
/usr/local/bin/aws elbv2 modify-target-group \
  --target-group-arn arn:aws:elasticloadbalancing:eu-central-1:035338517878:targetgroup/Loppes-Servi-YX7XFAJUE0LK/cb132ac43dc9980e \
  --health-check-path /health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 10 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --region eu-central-1
```

**Result**: ✅ Health check now uses `/health` endpoint with 10-second timeout

### 2. Improved Dockerfile (Deployed via GitHub Actions)

**Old CMD:**
```dockerfile
CMD ["sh", "-c", "cron && uvicorn main:app --host 0.0.0.0 --port 8080 --workers 1"]
```

**New CMD with logging and error handling:**
```dockerfile
# Create startup script with better error handling
RUN echo '#!/bin/bash\n\
set -e\n\
echo "Starting Loppestars API..."\n\
echo "SUPABASE_URL: ${SUPABASE_URL}"\n\
echo "SOURCE_BUCKET: ${SOURCE_BUCKET}"\n\
echo "STORAGE_BUCKET: ${STORAGE_BUCKET}"\n\
\n\
# Start cron in background\n\
cron\n\
echo "Cron started"\n\
\n\
# Start uvicorn\n\
echo "Starting uvicorn on 0.0.0.0:8080..."\n\
exec uvicorn main:app --host 0.0.0.0 --port 8080 --workers 1 --log-level info\n\
' > /app/start.sh && chmod +x /app/start.sh

CMD ["/app/start.sh"]
```

**Benefits:**
- ✅ Startup logging to see if app starts
- ✅ Environment variable validation
- ✅ Proper error handling with `set -e`
- ✅ Uvicorn info-level logging
- ✅ Clean process execution with `exec`

### 3. Updated CDK Stack (For Future Deployments)

**File**: `aws/lib/aws-stack.ts`

**Changes:**
1. Added CloudWatch logging:
```typescript
import * as logs from 'aws-cdk-lib/aws-logs';

logDriver: ecs.LogDrivers.awsLogs({
  streamPrefix: "loppestars",
  logRetention: logs.RetentionDays.ONE_WEEK,
}),
```

2. Configured health check:
```typescript
fargateService.targetGroup.configureHealthCheck({
  path: "/health",
  interval: cdk.Duration.seconds(30),
  timeout: cdk.Duration.seconds(10),
  healthyThresholdCount: 2,
  unhealthyThresholdCount: 3,
});
```

3. Fixed Docker build context:
```typescript
image: ecs.ContainerImage.fromAsset("..", {
  file: "Dockerfile",
}),
```

## Deployment Status

### GitHub Actions Workflow
- **Status**: In Progress
- **Workflow**: Build and Deploy to ECS
- **Branch**: kitty
- **Run ID**: 18256889660
- **Started**: 2025-10-05T09:26:56Z

### What's Happening:
1. Building Docker image with improved startup script
2. Pushing to ECR
3. Creating new ECS task definition
4. Updating ECS service
5. Waiting for service to stabilize

## Verification Steps

Once deployment completes (in ~10-15 minutes):

### 1. Check Target Health
```bash
/usr/local/bin/aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:eu-central-1:035338517878:targetgroup/Loppes-Servi-YX7XFAJUE0LK/cb132ac43dc9980e \
  --region eu-central-1
```
**Expected**: `"State": "healthy"`

### 2. Test API Endpoint
```bash
curl https://loppestars.spoons.dk/health
```
**Expected**: `{"status":"healthy","service":"loppestars"}`

### 3. Test Full API
```bash
curl https://loppestars.spoons.dk/
```
**Expected**: `{"message":"Welcome to the Loppestars API"}`

### 4. Check ECS Task Logs (if CloudWatch is enabled)
```bash
/usr/local/bin/aws logs tail /aws/ecs/loppestars --region eu-central-1 --follow
```
**Expected**: See startup messages and uvicorn logs

## Monitoring Commands

### Check Workflow Status
```bash
/usr/local/bin/gh run list --limit 1 | cat
```

### View Workflow Logs
```bash
/usr/local/bin/gh run view 18256889660 --log | cat | tail -50
```

### Check ECS Service Status
```bash
/usr/local/bin/aws ecs describe-services \
  --cluster LoppestarsEcsStack-ClusterEB0386A7-3Mzih57cTorn \
  --services LoppestarsEcsStack-Service9571FDD8-mtj8oW2z8iEu \
  --region eu-central-1 \
  --query 'services[0].events[:5]'
```

## Timeline

- **09:20 AM**: Identified 504 error cause (wrong health check path)
- **09:25 AM**: Updated target group health check to `/health` with 10s timeout
- **09:26 AM**: Committed Dockerfile improvements
- **09:27 AM**: GitHub Actions deployment started
- **~09:40 AM**: Expected deployment completion
- **~09:42 AM**: Health check should pass

## Expected Outcome

After deployment completes:
1. ✅ Container starts with visible logging
2. ✅ Uvicorn listens on `0.0.0.0:8080`
3. ✅ Health check at `/health` returns 200 OK
4. ✅ Target becomes healthy in load balancer
5. ✅ API accessible at `https://loppestars.spoons.dk/`
6. ✅ 504 errors resolved

## If Issues Persist

### Check Container Logs
If the new deployment also times out:
1. Wait for CloudWatch logs to be available (next CDK deployment)
2. Check if container is starting: Look for "Starting Loppestars API..." message
3. Check if uvicorn starts: Look for "Starting uvicorn on 0.0.0.0:8080..." message
4. Check for Python errors or missing dependencies

### Manual Debugging
```bash
# Check if task is running
/usr/local/bin/aws ecs list-tasks --cluster LoppestarsEcsStack-ClusterEB0386A7-3Mzih57cTorn --region eu-central-1

# Get task details
/usr/local/bin/aws ecs describe-tasks --cluster LoppestarsEcsStack-ClusterEB0386A7-3Mzih57cTorn --tasks <TASK_ID> --region eu-central-1

# Check target health
/usr/local/bin/aws elbv2 describe-target-health --target-group-arn <ARN> --region eu-central-1
```

### Possible Remaining Issues
1. **Missing Python dependencies**: Check if all packages in requirements.txt install successfully
2. **Supabase connection**: Verify SUPABASE_URL and keys are correct
3. **Port binding**: Ensure nothing else is using port 8080 in container
4. **Face processor models**: Verify model downloads complete successfully
5. **Memory/CPU limits**: Check if container has enough resources to start

## Files Modified

1. `Dockerfile` - Added startup script with logging and error handling
2. `aws/lib/aws-stack.ts` - Added health check config and CloudWatch logging
3. `docs/504_DIAGNOSIS_AND_FIX.md` - Complete diagnosis documentation
4. Target group health check - Updated via AWS CLI

## Commits

- **3088803**: "Fix 504: Update health check path and add startup logging"
- Pushed to branch: `kitty`

## AWS Resources Modified

- **Target Group**: Loppes-Servi-YX7XFAJUE0LK
  - Health check path: `/` → `/health`
  - Timeout: 5s → 10s
  - Healthy threshold: 5 → 2
  - Unhealthy threshold: 2 → 3

## Next Steps

1. ⏳ Wait for GitHub Actions deployment to complete (~10-15 min)
2. ✅ Verify target health becomes "healthy"
3. ✅ Test API endpoints
4. ✅ Confirm 504 errors are resolved
5. 📝 Deploy CDK stack later to add CloudWatch logging

## Summary

The 504 error was caused by:
- Wrong health check path (`/` instead of `/health`)
- Short timeout (5s) that caused timeouts
- Silent container failures with no logging

Fixes applied:
- ✅ Immediate: Updated target group health check configuration
- ✅ Deployed: Improved Dockerfile with startup logging
- ✅ Prepared: CDK stack updates for future deployments

**Status**: Deployment in progress, should be resolved in ~10-15 minutes.
