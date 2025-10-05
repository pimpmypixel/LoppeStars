# 504 Gateway Timeout - Diagnosis and Fix

## Problem

After deployment, `https://loppestars.spoons.dk/` returns **504 Gateway Timeout** error.

## Root Cause Analysis

### Investigation Steps

1. **Checked GitHub Actions Workflow**
   - Latest deployment (18246868442) **failed** 
   - Reason: `Waiter ServicesStable failed: Max attempts exceeded`
   - The ECS service couldn't stabilize after deployment

2. **Checked ECS Service Status**
   ```bash
   aws ecs describe-services --cluster ... --services ...
   ```
   - Status: `ACTIVE`
   - RunningCount: 1
   - DesiredCount: 1
   - **Critical Error**: `"your account is currently blocked"`
   - However, there IS one running task from previous deployment

3. **Checked Load Balancer Target Health**
   ```bash
   aws elbv2 describe-target-health --target-group-arn ...
   ```
   - Target: `10.0.104.63:8080`
   - **HealthCheckPort**: `8080`
   - **State**: `unhealthy`
   - **Reason**: `Target.Timeout`
   - **Description**: `Request timed out`

4. **Checked Health Check Configuration**
   - **HealthCheckPath**: `/` (should be `/health`)
   - **HealthCheckProtocol**: `HTTP`
   - **HealthCheckInterval**: 30 seconds
   - **HealthCheckTimeout**: 5 seconds
   - **HealthyThreshold**: 5
   - **UnhealthyThreshold**: 2

5. **Tested Load Balancer Directly**
   ```bash
   curl -k https://Loppes-Servi-0Tw5t0YjAEYD-307174990.eu-central-1.elb.amazonaws.com/health
   ```
   - Result: **Connection timeout** (no response from container)

6. **Checked Task Definition**
   - Container name: `web` ✅
   - Port mapping: `8080:8080` ✅
   - Environment variables: All present ✅
   - **Logging**: `null` ❌ (No CloudWatch logs configured)

7. **Checked Container Code**
   - FastAPI app has both `/` and `/health` endpoints ✅
   - Dockerfile exposes port 8080 ✅
   - Uvicorn configured to listen on `0.0.0.0:8080` ✅

## Root Causes Identified

1. **Missing CloudWatch Logging**
   - No log driver configured in CDK stack
   - Cannot see container startup errors or application logs
   - Blind to what's happening inside the container

2. **Incorrect Health Check Path**
   - Health check configured for path `/` 
   - Should be `/health` for FastAPI app
   - Timeout is too short (5s) for a cold start

3. **AWS Account Blocking Issue**
   - Service cannot start new tasks: `"your account is currently blocked"`
   - Existing task is running but unhealthy
   - New deployments fail to stabilize

## Fixes Applied

### 1. Updated CDK Stack (`aws/lib/aws-stack.ts`)

**Added CloudWatch Logging:**
```typescript
import * as logs from 'aws-cdk-lib/aws-logs';

// In taskImageOptions:
logDriver: ecs.LogDrivers.awsLogs({
  streamPrefix: "loppestars",
  logRetention: logs.RetentionDays.ONE_WEEK,
}),
```

**Configured Proper Health Check:**
```typescript
fargateService.targetGroup.configureHealthCheck({
  path: "/health",
  interval: cdk.Duration.seconds(30),
  timeout: cdk.Duration.seconds(10),
  healthyThresholdCount: 2,
  unhealthyThresholdCount: 3,
});
```

**Added Container Name:**
```typescript
taskImageOptions: {
  containerName: "web",  // Explicit container name
  // ... rest of config
}
```

### 2. Redeployed Infrastructure

```bash
cd aws/
npm run cdk deploy -- --require-approval never
```

This will:
- Create CloudWatch log group for container logs
- Update target group health check to use `/health` path
- Increase health check timeout to 10 seconds
- Redeploy the ECS service with new configuration

## Expected Outcome

After CDK deployment completes:

1. **CloudWatch Logs Available**
   - Log group: `/aws/ecs/loppestars-Service...`
   - Can view container startup and application logs
   - Can diagnose any application errors

2. **Health Check Passes**
   - Target group checks `/health` endpoint
   - Container responds with `{"status": "healthy"}`
   - Target becomes healthy in load balancer

3. **Service Accessible**
   - `https://loppestars.spoons.dk/health` returns 200 OK
   - API endpoints become accessible
   - 504 errors resolved

## AWS Account Block Issue

The error `"your account is currently blocked"` needs attention:

### Possible Reasons:
1. **Payment Issue**: AWS account has unpaid bills
2. **Service Limit**: Hit ECS service or Fargate limits
3. **Compliance Issue**: Account flagged for terms violation
4. **Temporary Block**: AWS security measure

### Resolution Steps:
1. Check AWS billing dashboard for outstanding charges
2. Check AWS Personal Health Dashboard for account notices
3. Check Service Quotas for ECS/Fargate limits
4. Contact AWS Support if issue persists

### Current Workaround:
- One task is still running from previous deployment
- Can manually redeploy using GitHub Actions once fixed
- CDK changes will improve health checking when new tasks start

## Verification Steps

Once CDK deployment completes:

### 1. Check CloudWatch Logs
```bash
aws logs tail /aws/ecs/loppestars --region eu-central-1 --follow
```

### 2. Check Health Check Configuration
```bash
aws elbv2 describe-target-groups \
  --target-group-arns <ARN> \
  --query 'TargetGroups[0].HealthCheckPath'
```
Should return: `"/health"`

### 3. Check Target Health
```bash
aws elbv2 describe-target-health \
  --target-group-arn <ARN>
```
Should show: `"State": "healthy"`

### 4. Test API
```bash
curl https://loppestars.spoons.dk/health
```
Should return: `{"status":"healthy","service":"loppestars"}`

## Next Steps

1. **Monitor CDK Deployment**
   - Wait for deployment to complete
   - Check for any CloudFormation errors

2. **Check Container Logs**
   - Once deployed, view CloudWatch logs
   - Look for startup errors or FastAPI issues

3. **Resolve AWS Account Block**
   - Check billing and account status
   - Contact AWS support if needed

4. **Test Full Deployment**
   - Trigger GitHub Actions workflow
   - Verify new deployments stabilize successfully

## Summary

- ✅ Identified root cause: Missing health check configuration and logging
- ✅ Updated CDK stack with proper health check and CloudWatch logging
- ✅ Deployed infrastructure changes
- ⏳ Waiting for deployment to complete
- ⚠️ AWS account block issue needs separate resolution
- ⏳ Will test API once changes are deployed

## Files Modified

- `aws/lib/aws-stack.ts` - Added health check and logging configuration

## Commands Used

```bash
# Diagnosis
aws ecs describe-services --cluster <cluster> --services <service>
aws elbv2 describe-target-health --target-group-arn <arn>
curl -k https://load-balancer-dns/health

# Fix
cd aws/
npm run cdk deploy -- --require-approval never

# Verification
aws logs tail /aws/ecs/loppestars --region eu-central-1 --follow
curl https://loppestars.spoons.dk/health
```
