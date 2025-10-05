# CDK Stack Rebuild Plan

## Current Status
- **Stack deletion initiated**: October 5, 2025, 15:48 UTC
- **Stack name**: LoppestarsEcsStack
- **Region**: eu-central-1

## Why Rebuild?

The GitHub Actions workflow was creating task definitions with hardcoded values that conflicted with CDK-generated resources:

1. **IAM Roles**: Workflow used non-existent `ecsTaskExecutionRole`, CDK creates auto-generated role names
2. **Log Groups**: Workflow tried to use `/ecs/loppestars`, CDK creates auto-generated log group names
3. **Configuration Drift**: Manual task definitions vs. CDK-managed infrastructure

**Solution**: Destroy and rebuild the stack using CDK, then either:
- Use CDK for all deployments (recommended)
- OR update GitHub Actions to query and use CDK-generated resource names dynamically

## Rebuild Steps

### 1. Wait for Stack Deletion
```bash
# Check status
aws cloudformation describe-stacks \
  --stack-name LoppestarsEcsStack \
  --region eu-central-1 \
  --query 'Stacks[0].StackStatus'

# Monitor deletion events
aws cloudformation describe-stack-events \
  --stack-name LoppestarsEcsStack \
  --region eu-central-1 \
  --max-items 10 \
  --query 'StackEvents[*].[Timestamp,ResourceStatus,ResourceType,LogicalResourceId]' \
  --output table
```

### 2. Run Rebuild Script
```bash
cd aws
./rebuild-stack.sh
```

The script will:
1. Wait for deletion to complete
2. Bootstrap CDK if needed
3. Deploy fresh stack with correct configuration
4. Output load balancer DNS for DNS configuration

### 3. Update Cloudflare DNS

After deployment completes, update the CNAME record:
```
Type: CNAME
Name: loppestars
Target: [New Load Balancer DNS from CDK output]
Proxy: Enabled (orange cloud)
```

### 4. Verify Deployment

```bash
# Test health endpoint
curl https://loppestars.spoons.dk/health

# Expected response:
# {"status":"healthy","service":"loppestars"}

# Test root endpoint
curl https://loppestars.spoons.dk/

# Expected response:
# {"message":"Welcome to the Loppestars API"}
```

## CDK Stack Configuration

The rebuilt stack (`aws/lib/aws-stack.ts`) includes:

✅ **Correct health check configuration**:
- Path: `/health`
- Interval: 30 seconds
- Timeout: 10 seconds
- Healthy threshold: 2
- Unhealthy threshold: 3

✅ **Proper IAM roles**: CDK auto-generates with correct permissions

✅ **CloudWatch logging**: Automatic log group creation with 1-week retention

✅ **HTTPS with ACM certificate**: DNS validation for `loppestars.spoons.dk`

✅ **Fargate resources**:
- CPU: 512
- Memory: 1024 MB
- Docker build from root `Dockerfile`
- Container port: 8080

✅ **Environment variables**: From root `.env` file:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- SOURCE_BUCKET
- STORAGE_BUCKET

## GitHub Actions Workflow Options

### Option 1: Use CDK for Deployments (Recommended)

**Pros**:
- No configuration drift
- Single source of truth
- Automatic resource management
- Proper IAM permissions

**Cons**:
- Slower deployments (~5-10 minutes)
- Requires CDK CLI in GitHub Actions

**Implementation**:
```yaml
name: Deploy with CDK

on:
  push:
    branches: [main, kitty]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: eu-central-1
      - name: Deploy with CDK
        run: |
          cd aws
          npm install
          npx cdk deploy --require-approval never
```

### Option 2: Keep GitHub Actions, Query CDK Resources

**Pros**:
- Faster deployments (~2-3 minutes)
- Direct Docker image updates

**Cons**:
- Complex workflow
- Must query AWS for resource names
- Risk of drift

**Implementation**: Update workflow to query existing task definition for role ARNs and log group names before creating new task definition.

## Recommended Approach

**Use CDK for deployments** because:
1. Eliminates all configuration drift issues
2. Single source of truth for infrastructure
3. Automatic resource management
4. Proper dependency handling
5. Rollback support

The slightly longer deployment time is worth the reliability and maintainability.

## Monitoring Rebuild Progress

Check deletion status:
```bash
watch -n 10 'aws cloudformation describe-stacks --stack-name LoppestarsEcsStack --region eu-central-1 --query "Stacks[0].StackStatus" 2>&1'
```

Or run the rebuild script (it will wait automatically):
```bash
cd aws
./rebuild-stack.sh
```

## Timeline Estimate

- **Stack deletion**: 5-10 minutes ⏳ In Progress
- **Stack deployment**: 10-15 minutes
- **DNS propagation**: 1-5 minutes (Cloudflare is fast)
- **Total**: ~20-30 minutes

## Post-Deployment Tasks

1. ✅ Verify API health
2. ✅ Test all endpoints
3. ✅ Check CloudWatch logs
4. ✅ Update DNS if load balancer DNS changed
5. ✅ Disable or update GitHub Actions workflow
6. ✅ Document new infrastructure
7. ✅ Test mobile app connectivity

---

**Status**: Waiting for stack deletion to complete (~5 more minutes)
