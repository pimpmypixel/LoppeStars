# Infrastructure Rebuild - Ready to Deploy

## Status: Stack Deleted ✅

**Date**: October 5, 2025, 16:05 UTC  
**Previous Stack**: LoppestarsEcsStack (deleted)  
**Region**: eu-central-1

The old CDK stack has been successfully deleted. We're ready for a clean rebuild.

## What We Fixed

### Root Cause Analysis

The GitHub Actions workflow was creating manual task definitions with **hardcoded values** that conflicted with **CDK-generated resource names**:

| Resource | GitHub Actions (Wrong) | CDK Reality (Correct) |
|----------|------------------------|----------------------|
| Execution Role | `ecsTaskExecutionRole` (doesn't exist) | `LoppestarsEcsStack-ServiceTaskDefExecutionRole919F7-*` (auto-generated) |
| Task Role | Not specified | `LoppestarsEcsStack-ServiceTaskDefTaskRole0CFE2F57-*` (auto-generated) |
| Log Group | `/ecs/loppestars` (no permissions) | `LoppestarsEcsStack-ServiceTaskDefwebLogGroup2A898F61-*` (auto-generated) |
| Health Check | `/` (wrong path, 5s timeout) | `/health` (10s timeout, proper config) |

This caused:
1. ❌ IAM permission errors (role doesn't exist)
2. ❌ CloudWatch logging failures (no permission for log group)
3. ❌ 504 Gateway Timeout errors (wrong health check configuration)
4. ❌ Deployment failures (max attempts exceeded)

## New Tools Created

### 1. `ensure-infrastructure.sh` - The Ultimate Infrastructure Tool ⭐

Location: `aws/ensure-infrastructure.sh`

**Purpose**: Comprehensive infrastructure validation and deployment tool that ensures AWS CDK stack is ready for GitHub Actions deployments.

**Capabilities**:
- ✅ Validates CDK stack existence and health
- ✅ Checks load balancer and target health
- ✅ Verifies Cloudflare DNS configuration
- ✅ Tests API endpoints (/health, /, /markets/today)
- ✅ Extracts CDK-generated resource names (IAM roles, log groups)
- ✅ Generates GitHub Actions workflow snippets
- ✅ Wraps deploy-and-dns.js for seamless deployment

**Usage**:
```bash
# Check infrastructure status
./ensure-infrastructure.sh --status

# Deploy infrastructure
./ensure-infrastructure.sh --deploy

# Export resource names for GitHub Actions
./ensure-infrastructure.sh --export
```

**Documentation**: `docs/INFRASTRUCTURE_READINESS_TOOL.md`

### 2. `rebuild-stack.sh` - Automated Rebuild Script

Location: `aws/rebuild-stack.sh`

**Purpose**: Automatically waits for stack deletion, then deploys fresh CDK stack.

**Process**:
1. Polls CloudFormation until stack is deleted
2. Bootstraps CDK if needed
3. Deploys CDK stack
4. Outputs load balancer DNS for DNS configuration

### 3. `check-status.sh` - Quick Status Checker

Location: `aws/check-status.sh`

**Purpose**: Quick check of stack deletion/deployment status with recent events.

## Next Steps - Deployment Process

### Step 1: Deploy Fresh CDK Stack

Choose one of these methods:

#### Option A: Use ensure-infrastructure.sh (Recommended)
```bash
cd /Users/andreas/Herd/loppestars/aws
./ensure-infrastructure.sh --deploy
```

This will:
- Deploy CDK stack with correct configuration
- Ensure ACM certificate is validated
- Configure Cloudflare DNS automatically
- Test all API endpoints
- Extract resource names
- Generate GitHub Actions snippets

**Duration**: ~15 minutes

#### Option B: Use rebuild-stack.sh
```bash
cd /Users/andreas/Herd/loppestars/aws
./rebuild-stack.sh
```

This will deploy but without the extra validation and resource extraction.

**Duration**: ~15 minutes

### Step 2: Export Resource Names

After deployment completes:

```bash
./ensure-infrastructure.sh --export
```

This generates:
- `/tmp/loppestars_resources.json` - All CDK resource details
- `/tmp/loppestars_workflow_snippet.yml` - GitHub Actions snippet
- Console output with environment variables

### Step 3: Update GitHub Actions Workflow

Update `.github/workflows/deploy-ecs.yml` with the exported values:

```yaml
"executionRoleArn": "arn:aws:iam::035338517878:role/LoppestarsEcsStack-ServiceTaskDefExecutionRole919F7-...",
"taskRoleArn": "arn:aws:iam::035338517878:role/LoppestarsEcsStack-ServiceTaskDefTaskRole0CFE2F57-...",
"logConfiguration": {
  "logDriver": "awslogs",
  "options": {
    "awslogs-group": "LoppestarsEcsStack-ServiceTaskDefwebLogGroup2A898F61-...",
    "awslogs-region": "${AWS_REGION}",
    "awslogs-stream-prefix": "Service"
  }
}
```

**OR** better yet: **Use CDK for all deployments** (recommended below).

### Step 4: Verify Deployment

```bash
./ensure-infrastructure.sh --status
```

Expected output:
```
✅ Stack status: CREATE_COMPLETE
✅ Load Balancer state: active
✅ Target health: healthy
✅ Health endpoint: OK
✅ Infrastructure is ready for GitHub Actions deployments
```

### Step 5: Test API

```bash
curl https://loppestars.spoons.dk/health
# Expected: {"status":"healthy","service":"loppestars"}

curl https://loppestars.spoons.dk/
# Expected: {"message":"Welcome to the Loppestars API"}
```

## Recommended Deployment Strategy Going Forward

### Option 1: Use CDK for All Deployments (RECOMMENDED) ⭐

**Why**: Eliminates all configuration drift issues.

**Implementation**: Update `.github/workflows/deploy-ecs.yml`:

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
      
      - name: Install dependencies
        run: |
          cd aws
          npm install
      
      - name: Deploy with CDK
        run: |
          cd aws
          npx cdk deploy --require-approval never
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          ECS_DOMAIN: loppestars.spoons.dk
          CF_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
```

**Pros**:
- ✅ Single source of truth
- ✅ No configuration drift
- ✅ Automatic resource management
- ✅ Built-in rollback support
- ✅ Proper dependency handling

**Cons**:
- ⏱️ Slightly slower (~10-15 minutes vs 2-3 minutes)

### Option 2: Keep Docker-Only Deployments

Continue using current GitHub Actions workflow but:
1. Update it with exported resource names after each CDK change
2. Run `./ensure-infrastructure.sh --export` after any CDK stack update
3. Manually update workflow file with new values

**Pros**:
- ⚡ Faster deployments

**Cons**:
- ⚠️ Risk of configuration drift
- 🔧 Manual maintenance required
- 🐛 Harder to debug mismatches

## CDK Stack Configuration

The rebuilt stack includes **all fixes**:

### Health Check Configuration ✅
```typescript
fargateService.targetGroup.configureHealthCheck({
  path: "/health",
  interval: cdk.Duration.seconds(30),
  timeout: cdk.Duration.seconds(10),
  healthyThresholdCount: 2,
  unhealthyThresholdCount: 3,
});
```

### Proper Logging ✅
```typescript
logDriver: ecs.LogDrivers.awsLogs({
  streamPrefix: "loppestars",
  logRetention: logs.RetentionDays.ONE_WEEK,
})
```

### IAM Roles ✅
CDK automatically creates:
- Execution role with CloudWatch and ECR permissions
- Task role with application-specific permissions

### HTTPS with Certificate ✅
```typescript
protocol: elbv2.ApplicationProtocol.HTTPS,
listenerPort: 443,
redirectHTTP: true,
certificate: certificate,
```

## Documentation Created

1. **`docs/INFRASTRUCTURE_READINESS_TOOL.md`** - Complete documentation for ensure-infrastructure.sh
2. **`docs/CDK_REBUILD_PLAN.md`** - Rebuild plan and strategy
3. **`docs/IAM_ROLE_FIX.md`** - IAM role issue analysis
4. **`docs/504_FIX_COMPLETE.md`** - Original health check fix

## Timeline

| Time | Event |
|------|-------|
| 15:48 UTC | Stack deletion initiated |
| 15:55 UTC | Stack deletion completed |
| 16:05 UTC | Tools created and ready |
| **NOW** | Ready to deploy! |

## Quick Start Commands

```bash
# Navigate to AWS directory
cd /Users/andreas/Herd/loppestars/aws

# Deploy infrastructure (this will take ~15 minutes)
./ensure-infrastructure.sh --deploy

# After deployment, verify everything
./ensure-infrastructure.sh --status

# Export resource names for GitHub Actions
./ensure-infrastructure.sh --export

# Test API
curl https://loppestars.spoons.dk/health
```

## Success Criteria

After deployment, you should see:

✅ CloudFormation stack: `CREATE_COMPLETE`  
✅ Load balancer state: `active`  
✅ Target health: `healthy`  
✅ Health endpoint returns: `{"status":"healthy","service":"loppestars"}`  
✅ Root endpoint returns: `{"message":"Welcome to the Loppestars API"}`  
✅ Cloudflare DNS correctly configured  
✅ CDK resource names extracted and saved  

---

**Ready to deploy?** Run the command above and the infrastructure will be rebuilt with all fixes applied! 🚀
