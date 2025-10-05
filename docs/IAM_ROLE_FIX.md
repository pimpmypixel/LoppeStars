# IAM Role Fix for GitHub Actions ECS Deployment

## Problem Discovered
**Date**: October 5, 2025  
**Issue**: GitHub Actions deployment failing with IAM role error

### Error Message
```
ECS was unable to assume the role 'arn:aws:iam::035338517878:role/ecsTaskExecutionRole' 
that was provided for this task. Please verify that the role being passed has the proper 
trust relationship and permissions and that your IAM user has permissions to pass this role.
```

### Root Cause
The GitHub Actions workflow (`.github/workflows/deploy-ecs.yml`) was hardcoding the execution role as:
```json
"executionRoleArn": "arn:aws:iam::035338517878:role/ecsTaskExecutionRole"
```

However, this role **does not exist** in the AWS account. The CDK stack creates its own roles with generated names.

### Investigation Steps
1. **Checked deployment failure**:
   ```bash
   gh run view 18256889660 --log
   # Result: "Waiter ServicesStable failed: Max attempts exceeded"
   ```

2. **Checked ECS service events**:
   ```bash
   aws ecs describe-services --cluster ... --services ... --query 'services[0].events[:5]'
   # Result: IAM role assumption error
   ```

3. **Verified role doesn't exist**:
   ```bash
   aws iam get-role --role-name ecsTaskExecutionRole
   # Result: NoSuchEntity error
   ```

4. **Found correct role from working task**:
   ```bash
   # Get running task
   aws ecs list-tasks --cluster LoppestarsEcsStack-ClusterEB0386A7-3Mzih57cTorn
   
   # Get task definition
   aws ecs describe-tasks ... --query 'tasks[0].taskDefinitionArn'
   # Result: LoppestarsEcsStackServiceTaskDefC91635A3:10
   
   # Get roles from working task definition
   aws ecs describe-task-definition --task-definition LoppestarsEcsStackServiceTaskDefC91635A3:10
   # Result: 
   #   executionRoleArn: LoppestarsEcsStack-ServiceTaskDefExecutionRole919F7-gnhoBqLZhTql
   #   taskRoleArn: LoppestarsEcsStack-ServiceTaskDefTaskRole0CFE2F57-v3VAz81Cmm5R
   ```

## Solution Applied

### 1. Update GitHub Actions Workflow
**File**: `.github/workflows/deploy-ecs.yml`

**Changed**:
```yaml
# OLD (incorrect):
"executionRoleArn": "arn:aws:iam::035338517878:role/ecsTaskExecutionRole"

# NEW (correct):
"executionRoleArn": "arn:aws:iam::035338517878:role/LoppestarsEcsStack-ServiceTaskDefExecutionRole919F7-gnhoBqLZhTql",
"taskRoleArn": "arn:aws:iam::035338517878:role/LoppestarsEcsStack-ServiceTaskDefTaskRole0CFE2F57-v3VAz81Cmm5R"
```

### 2. Deploy Fix
```bash
git add .github/workflows/deploy-ecs.yml
git commit -m "Fix IAM role in GitHub Actions workflow"
git push origin kitty
```

**Deployment Started**: Run ID 18259321138 (October 5, 2025, 13:19 UTC)

### 3. CloudWatch Logs Permission Issue (DISCOVERED)
**Problem**: Second deployment failed with CloudWatch permissions error:
```
AccessDeniedException: User: arn:aws:sts::035338517878:assumed-role/LoppestarsEcsStack-ServiceTaskDefExecutionRole919F7-gnhoBqLZhTql/... 
is not authorized to perform: logs:CreateLogStream on resource: arn:aws:logs:eu-central-1:035338517878:log-group:/ecs/loppestars
```

**Root Cause**: The workflow was trying to log to `/ecs/loppestars`, but the execution role only has permissions for the CDK-created log group: `LoppestarsEcsStack-ServiceTaskDefwebLogGroup2A898F61-l6JeWYmfnmS5`

**Fix Applied**: Updated workflow to use CDK log group:
```yaml
# OLD:
"awslogs-group": "/ecs/loppestars"

# NEW:
"awslogs-group": "LoppestarsEcsStack-ServiceTaskDefwebLogGroup2A898F61-l6JeWYmfnmS5"
```

**Deployment Started**: Run ID 18259508186 (October 5, 2025, 13:35 UTC)

## Role Breakdown

### Execution Role
**ARN**: `arn:aws:iam::035338517878:role/LoppestarsEcsStack-ServiceTaskDefExecutionRole919F7-gnhoBqLZhTql`

**Purpose**: Allows ECS tasks to:
- Pull Docker images from ECR
- Write logs to CloudWatch
- Access Secrets Manager (if needed)

**Created by**: CDK stack during initial deployment

### Task Role
**ARN**: `arn:aws:iam::035338517878:role/LoppestarsEcsStack-ServiceTaskDefTaskRole0CFE2F57-v3VAz81Cmm5R`

**Purpose**: Allows the running container to:
- Access AWS services (S3, Supabase via secrets, etc.)
- Perform application-specific AWS operations

**Created by**: CDK stack during initial deployment

## Why This Happened

1. **Manual task definition creation**: The GitHub Actions workflow creates task definitions manually (not via CDK)
2. **Hardcoded role name**: Used a generic role name instead of the CDK-generated one
3. **Role discovery needed**: Should query AWS to find existing roles OR use CDK for deployments

## Better Long-Term Solution

Instead of hardcoding role ARNs, the workflow should:

### Option 1: Query Existing Task Definition
```yaml
- name: Get existing task definition roles
  run: |
    EXISTING_TASK_DEF=$(aws ecs describe-services \
      --cluster $CLUSTER \
      --services $SERVICE \
      --query 'services[0].taskDefinition' \
      --output text)
    
    EXEC_ROLE=$(aws ecs describe-task-definition \
      --task-definition $EXISTING_TASK_DEF \
      --query 'taskDefinition.executionRoleArn' \
      --output text)
    
    TASK_ROLE=$(aws ecs describe-task-definition \
      --task-definition $EXISTING_TASK_DEF \
      --query 'taskDefinition.taskRoleArn' \
      --output text)
    
    echo "EXEC_ROLE=${EXEC_ROLE}" >> $GITHUB_ENV
    echo "TASK_ROLE=${TASK_ROLE}" >> $GITHUB_ENV
```

### Option 2: Use CDK for Deployments
Let CDK manage task definitions entirely:
```bash
cd aws
npm run cdk deploy
```

This would automatically:
- Use correct role ARNs
- Manage all infrastructure as code
- Prevent drift between manual and CDK-managed resources

## Current Status

✅ **Fixed**: Workflow now uses correct CDK-generated role ARNs  
⏳ **Deploying**: Run ID 18259321138 in progress  
🔍 **Monitor**: `gh run list --limit 1 | cat`  
🎯 **Expected**: Deployment should succeed with proper role permissions

## Verification Steps (After Deployment)

1. **Check deployment success**:
   ```bash
   gh run list --limit 1 | cat
   # Should show "completed" and "success"
   ```

2. **Test API endpoints**:
   ```bash
   curl https://loppestars.spoons.dk/health
   # Expected: {"status":"healthy","service":"loppestars"}
   ```

3. **Check target health**:
   ```bash
   aws elbv2 describe-target-health \
     --target-group-arn arn:aws:elasticloadbalancing:eu-central-1:035338517878:targetgroup/Loppe-Servi-WMU6FMTVHQVL/5ad8e8addef44568
   # Expected: State "healthy"
   ```

4. **Verify task is running**:
   ```bash
   aws ecs describe-services \
     --cluster LoppestarsEcsStack-ClusterEB0386A7-3Mzih57cTorn \
     --services LoppestarsEcsStack-Service9571FDD8-mtj8oW2z8iEu \
     --query 'services[0].runningCount'
   # Expected: 1
   ```

## Lessons Learned

1. **Always verify IAM roles exist** before referencing them in task definitions
2. **CDK-generated resource names** are unique and cannot be guessed
3. **Query existing resources** to find correct ARNs when creating manual deployments
4. **IAM role errors** prevent tasks from starting entirely (different from application errors)
5. **ECS service events** provide crucial diagnostic information for deployment failures

## Related Issues

- [504_FIX_COMPLETE.md](./504_FIX_COMPLETE.md) - Health check configuration fix
- AWS account blocking issue (separate problem, not addressed here)

---

**Next**: Wait for deployment Run ID 18259321138 to complete (~10-15 minutes), then verify API health.
