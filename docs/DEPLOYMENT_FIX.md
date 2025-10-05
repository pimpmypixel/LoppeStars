# GitHub Actions Deployment Fix

## Problem Summary

The GitHub Actions deployment workflow was failing with error **"Max attempts exceeded"** during the "Wait for Deployment" step.

---

## Root Causes Identified

### 1. ⚠️ **CRITICAL: Wrong IAM Role ARNs**

**Error Message from ECS:**
```
(service loppestars-service) failed to launch a task with (error ECS was unable 
to assume the role 'arn:aws:iam::035338517878:role/LoppestarsEcsStack-ServiceTaskDefTaskRole0CFE2F57-v3VAz81Cmm5R' 
that was provided for this task. Please verify that the role being passed has the 
proper trust relationship and permissions and that your IAM user has permissions to pass this role.).
```

**Issue:**
- GitHub Actions workflow had hardcoded IAM role ARNs in task definition
- These roles were from an older infrastructure deployment
- New tasks couldn't start because ECS couldn't assume the roles
- Tasks failed ELB health checks and were killed (exit code 137)

**Symptom:**
- Deployment stuck in `IN_PROGRESS` state
- New tasks: 0 running, 0 pending
- Old tasks: 1 running (from previous successful deployment)
- Stopped task with reason: "Task failed ELB health checks"

**Fix:**
Updated task definition with correct IAM role ARNs:

**❌ OLD (Broken):**
```yaml
executionRoleArn: "arn:aws:iam::035338517878:role/LoppestarsEcsStack-ServiceTaskDefExecutionRole919F7-gnhoBqLZhTql"
taskRoleArn: "arn:aws:iam::035338517878:role/LoppestarsEcsStack-ServiceTaskDefTaskRole0CFE2F57-v3VAz81Cmm5R"
```

**✅ NEW (Working):**
```yaml
executionRoleArn: "arn:aws:iam::035338517878:role/LoppestarsEcsStack-TaskExecutionRole-RIAkMYD1kOjs"
taskRoleArn: "arn:aws:iam::035338517878:role/LoppestarsEcsStack-TaskRole-N7ax2UYdMxas"
```

---

### 2. ⏱️ **Timeout: `aws ecs wait` Default Timeout Too Short**

**Issue:**
- `aws ecs wait services-stable` has default max attempts (40 attempts × 15 seconds = 10 minutes)
- ECS deployments can take longer, especially with health check grace periods
- When deployment is stuck (due to IAM issue), the wait command times out without helpful error info
- GitHub Actions logs only showed "Max attempts exceeded" without details

**Symptom:**
```
⏳ Waiting for deployment to stabilize...
Waiter ServicesStable failed: Max attempts exceeded
Error: Process completed with exit code 255.
```

**Fix:**
Replaced simple `aws ecs wait` with custom polling loop:
- **Max attempts:** 40 × 15 seconds = 10 minutes
- **Better error detection:** Checks for failed tasks, stuck deployments, rollout state
- **Helpful logging:** Shows running/desired counts, failed task details, rollout progress
- **Early failure detection:** Exits early if no tasks running after 10 attempts (2.5 minutes)

**New Wait Logic:**
```bash
MAX_ATTEMPTS=40  # 40 attempts × 15 seconds = 10 minutes
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  ATTEMPT=$((ATTEMPT + 1))
  
  # Get deployment status
  DEPLOYMENT_STATUS=$(aws ecs describe-services ...)
  
  ROLLOUT_STATE=$(echo $DEPLOYMENT_STATUS | jq -r '.[0].RolloutState')
  RUNNING_COUNT=$(echo $DEPLOYMENT_STATUS | jq -r '.[0].Running')
  DESIRED_COUNT=$(echo $DEPLOYMENT_STATUS | jq -r '.[0].Desired')
  FAILED_TASKS=$(echo $DEPLOYMENT_STATUS | jq -r '.[0].Failed')
  
  echo "  Rollout: $ROLLOUT_STATE | Running: $RUNNING_COUNT/$DESIRED_COUNT | Failed: $FAILED_TASKS"
  
  # Check for completion
  if [ "$ROLLOUT_STATE" = "COMPLETED" ]; then
    echo "✅ Deployment completed successfully!"
    break
  fi
  
  # Check for failures - show stopped task details
  if [ "$FAILED_TASKS" -gt 0 ]; then
    echo "⚠️  WARNING: $FAILED_TASKS task(s) failed during deployment"
    aws ecs describe-tasks ... # Show why task stopped
  fi
  
  # Check if stuck with no progress
  if [ "$RUNNING_COUNT" -eq 0 ] && [ $ATTEMPT -gt 10 ]; then
    echo "❌ ERROR: Deployment stuck - no tasks running after ${ATTEMPT} attempts"
    exit 1
  fi
  
  sleep 15
done
```

**Benefits:**
- ✅ Clear progress logging (Attempt 1/40, 2/40, etc.)
- ✅ Shows deployment state at each check
- ✅ Detects and reports failed tasks with reasons
- ✅ Exits early if deployment is clearly stuck
- ✅ More informative error messages for troubleshooting

---

## Deployment Timeline

### Failed Deployment (Run 18261890620)

**Time:** 2025-10-05 17:17:21 UTC  
**Duration:** ~10 minutes  
**Result:** ❌ FAILED

**What Happened:**
1. ✅ Docker image built successfully
2. ✅ Image pushed to ECR with tag `60d2983...`
3. ✅ Task definition registered (loppestars:35)
4. ✅ ECS service update initiated
5. ⏳ Waiting for deployment...
6. ❌ Task failed to start (IAM role error)
7. ❌ Task killed by ECS (health check failure)
8. ⏳ Wait command timed out after 10 minutes
9. ❌ Workflow failed: "Max attempts exceeded"

**Task Failure Details:**
```
Task ID: 3dda851a22994ad59d9f69072d3cb750
Status: STOPPED
Exit Code: 137 (SIGKILL)
Reason: Task failed ELB health checks in (target-group loppestars-tg)
Root Cause: ECS was unable to assume the role (IAM role ARN invalid)
```

**CloudWatch Logs:**
- No logs from failed task (never started)
- Old task (eca760bfc81b47d59d5a59f657c8d329) continued serving traffic
- All health checks on old task: 200 OK

---

### Fixed Deployment (Run [TBD])

**Time:** 2025-10-05 19:39+ UTC  
**Commit:** fceeaf5  
**Result:** ⏳ IN PROGRESS

**Changes Applied:**
1. ✅ Corrected IAM role ARNs in task definition
2. ✅ Improved wait logic with custom polling
3. ✅ Better error detection and logging
4. ✅ Early failure detection for stuck deployments

**Expected Result:**
- ✅ Task definition loppestars:36 (or higher) registered
- ✅ New task starts successfully (no IAM errors)
- ✅ Health checks pass within 60 seconds (grace period)
- ✅ Old task drained and stopped
- ✅ Deployment completes: ROLLOUT_STATE = "COMPLETED"
- ✅ API live with face pixelation fix (commit 60d2983)

---

## Verification Steps

### 1. Check GitHub Actions Run

```bash
# Check latest run
gh run list --limit 1 | cat

# Watch live logs
gh run watch <RUN_ID>

# Or view completed logs
gh run view <RUN_ID> --log | cat
```

**Expected Output:**
```
Attempt 1/40...
  Rollout: IN_PROGRESS | Running: 0/1 | Failed: 0
Attempt 2/40...
  Rollout: IN_PROGRESS | Running: 0/1 | Failed: 0
Attempt 3/40...
  Rollout: IN_PROGRESS | Running: 1/1 | Failed: 0
...
Attempt 5/40...
  Rollout: COMPLETED | Running: 1/1 | Failed: 0

✅ Deployment completed successfully!
```

---

### 2. Check ECS Service Status

```bash
# Check service
aws ecs describe-services \
  --cluster LoppestarsCluster \
  --services loppestars-service \
  --region eu-central-1 \
  --query 'services[0].deployments[].[status,rolloutState,desiredCount,runningCount,failedTasks]' \
  --output table | cat
```

**Expected Output:**
```
------------------------------------------------------
|                  DescribeServices                   |
+----------+-----------+----+----+----+
| PRIMARY  | COMPLETED | 1  | 1  | 0  |
+----------+-----------+----+----+----+
```

---

### 3. Check Running Task

```bash
# Get task ARN
aws ecs list-tasks \
  --cluster LoppestarsCluster \
  --service-name loppestars-service \
  --region eu-central-1 \
  --query 'taskArns[0]' \
  --output text

# Check task details
aws ecs describe-tasks \
  --cluster LoppestarsCluster \
  --tasks <TASK_ARN> \
  --region eu-central-1 \
  --query 'tasks[0].{LastStatus:lastStatus,HealthStatus:healthStatus,Image:containers[0].image}' | cat
```

**Expected Output:**
```json
{
    "LastStatus": "RUNNING",
    "HealthStatus": "HEALTHY",
    "Image": "035338517878.dkr.ecr.eu-central-1.amazonaws.com/...@sha256:..."
}
```

---

### 4. Test API Endpoint

```bash
# Health check
curl https://loppestars.spoons.dk/health | cat

# Expected: {"status":"healthy"}
```

---

### 5. Check CloudWatch Logs

```bash
# Watch live logs
aws logs tail /ecs/loppestars --follow --region eu-central-1 | cat

# Check recent logs
aws logs tail /ecs/loppestars --since 10m --region eu-central-1 | cat
```

**Expected:**
- Health check logs: `GET /health HTTP/1.1" 200 OK`
- No error messages
- Task started successfully

---

## Debugging Guide

### If Deployment Still Fails

**1. Check IAM Roles:**
```bash
# Get current task definition roles
aws ecs describe-task-definition \
  --task-definition loppestars \
  --region eu-central-1 \
  --query 'taskDefinition.{ExecutionRole:executionRoleArn,TaskRole:taskRoleArn}' | cat

# Compare with working task definition (loppestars:34)
aws ecs describe-task-definition \
  --task-definition loppestars:34 \
  --region eu-central-1 \
  --query 'taskDefinition.{ExecutionRole:executionRoleArn,TaskRole:taskRoleArn}' | cat

# Should match!
```

**2. Check for Stopped Tasks:**
```bash
# List stopped tasks
aws ecs list-tasks \
  --cluster LoppestarsCluster \
  --service-name loppestars-service \
  --desired-status STOPPED \
  --region eu-central-1 | cat

# Describe stopped task
aws ecs describe-tasks \
  --cluster LoppestarsCluster \
  --tasks <TASK_ARN> \
  --region eu-central-1 \
  --query 'tasks[0].{StoppedReason:stoppedReason,ExitCode:containers[0].exitCode,Reason:containers[0].reason}' | cat
```

**3. Check Service Events:**
```bash
aws ecs describe-services \
  --cluster LoppestarsCluster \
  --services loppestars-service \
  --region eu-central-1 \
  --query 'services[0].events[:5]' | cat
```

**4. Check Target Group Health:**
```bash
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:eu-central-1:035338517878:targetgroup/loppestars-tg/356ffd470e9a6c9c \
  --region eu-central-1 | cat
```

---

## Common Issues

### Issue: "ECS was unable to assume the role"

**Cause:** Wrong IAM role ARN or missing trust relationship

**Solution:**
1. Get correct role ARNs from working task definition
2. Update GitHub Actions workflow with correct ARNs
3. Verify trust relationship in IAM console
4. Ensure `ecs-tasks.amazonaws.com` is in trusted entities

---

### Issue: "Task failed ELB health checks"

**Cause:** Container not responding on port 8080 or health check path

**Solution:**
1. Check container logs for startup errors
2. Verify port 8080 is exposed in Dockerfile
3. Verify FastAPI is listening on `0.0.0.0:8080` (not `127.0.0.1`)
4. Check security group allows traffic on port 8080
5. Increase `healthCheckGracePeriodSeconds` if app needs more startup time

---

### Issue: "Deployment stuck in IN_PROGRESS"

**Cause:** Various reasons - check deployment events

**Solution:**
1. Check ECS service events for error messages
2. Look for stopped tasks and check stop reasons
3. Verify task definition is valid
4. Check subnet and security group configuration
5. Ensure NAT gateway/internet gateway exists for public IP

---

## Prevention

### Best Practices for Future Deployments

1. **Use Dynamic Role Lookup** (instead of hardcoded ARNs):
   ```yaml
   EXECUTION_ROLE=$(aws ecs describe-task-definition \
     --task-definition loppestars \
     --region ${AWS_REGION} \
     --query 'taskDefinition.executionRoleArn' \
     --output text)
   ```

2. **Enable ECS Circuit Breaker** (auto-rollback on failure):
   ```json
   "deploymentConfiguration": {
     "deploymentCircuitBreaker": {
       "enable": true,
       "rollback": true
     }
   }
   ```

3. **Add Health Check to Dockerfile**:
   ```dockerfile
   HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
     CMD curl -f http://localhost:8080/health || exit 1
   ```

4. **Increase Health Check Grace Period** (if app needs more startup time):
   ```json
   "healthCheckGracePeriodSeconds": 120
   ```

5. **Use ECS Exec for Debugging**:
   ```bash
   aws ecs update-service \
     --cluster LoppestarsCluster \
     --service loppestars-service \
     --enable-execute-command \
     --region eu-central-1
   ```

6. **Monitor Deployment in Real-Time**:
   ```bash
   watch -n 5 'aws ecs describe-services \
     --cluster LoppestarsCluster \
     --services loppestars-service \
     --region eu-central-1 \
     --query "services[0].deployments[].[status,rolloutState,runningCount,desiredCount]" \
     --output table'
   ```

---

## Summary

✅ **Fixed IAM role ARNs** in GitHub Actions workflow  
✅ **Improved wait logic** with custom polling and better error messages  
✅ **Added early failure detection** for stuck deployments  
✅ **Better logging** for troubleshooting deployment issues  

**Commit:** fceeaf5 - "Fix GitHub Actions deployment: correct IAM roles and improve wait logic"

**Result:** Deployment should now succeed with clear progress logging and helpful error messages if anything goes wrong.

---

**Next Steps:**
1. ✅ Wait for GitHub Actions deployment to complete
2. ✅ Verify API is live with face pixelation fix
3. ✅ Test photo upload end-to-end in mobile app
4. ✅ Consider implementing prevention best practices above
