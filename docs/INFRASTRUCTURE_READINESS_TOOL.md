# Infrastructure Readiness Tool - Documentation

## Overview

The `ensure-infrastructure.sh` script is the **ultimate tool** for managing the Loppestars AWS CDK infrastructure and ensuring it's ready for GitHub Actions deployments. It wraps the existing `deploy-and-dns.js` Node.js script and provides a comprehensive shell-based interface for infrastructure validation.

## Purpose

This script solves the critical problem we encountered: **configuration drift between CDK-generated resources and GitHub Actions workflows**. It ensures:

1. ✅ CDK stack is properly deployed
2. ✅ Load balancer is healthy and operational
3. ✅ Cloudflare DNS points to the correct load balancer
4. ✅ API endpoints respond correctly
5. ✅ CDK-generated resource names are extracted and ready for GitHub Actions

## Features

### 🔍 Comprehensive Status Checking
- CloudFormation stack status
- Load balancer health and target health
- Cloudflare DNS configuration
- API endpoint testing (health, root, markets)
- CDK-generated resource extraction

### 🚀 Automated Deployment
- Wraps `deploy-and-dns.js` for seamless deployment
- Ensures certificate validation via Cloudflare
- Automatically configures DNS after deployment
- Validates deployment success

### 📦 Resource Export
- Extracts IAM role ARNs (execution and task roles)
- Identifies CloudWatch log group and prefix
- Gets cluster and service names
- Saves to JSON for easy access
- Generates GitHub Actions workflow snippets

### 🎨 User-Friendly Interface
- Color-coded output (success, error, warning, info)
- Clear section headers
- Detailed progress information
- Helpful next-step suggestions

## Usage

### Basic Commands

```bash
# Check infrastructure status (default)
./ensure-infrastructure.sh

# Full status check with details
./ensure-infrastructure.sh --status

# Deploy or update infrastructure
./ensure-infrastructure.sh --deploy

# Export resource names for GitHub Actions
./ensure-infrastructure.sh --export

# Show help
./ensure-infrastructure.sh --help
```

## Workflow Integration

### Step 1: Deploy Infrastructure

After destroying the old stack, deploy fresh infrastructure:

```bash
cd /Users/andreas/Herd/loppestars/aws
./ensure-infrastructure.sh --deploy
```

This will:
1. Check prerequisites (AWS CLI, Node.js, .env file)
2. Run `deploy-and-dns.js` to deploy the CDK stack
3. Wait for deployment completion
4. Configure Cloudflare DNS
5. Test API endpoints
6. Extract resource names
7. Generate GitHub Actions snippets

**Expected Duration**: 10-15 minutes for full deployment

### Step 2: Export Resource Names

After deployment completes:

```bash
./ensure-infrastructure.sh --export
```

This outputs:
- Environment variables for GitHub Secrets
- JSON file with all resource details
- GitHub Actions workflow snippet

Example output:
```bash
EXECUTION_ROLE_ARN="arn:aws:iam::035338517878:role/LoppestarsEcsStack-ServiceTaskDefExecutionRole919F7-gnhoBqLZhTql"
TASK_ROLE_ARN="arn:aws:iam::035338517878:role/LoppestarsEcsStack-ServiceTaskDefTaskRole0CFE2F57-v3VAz81Cmm5R"
LOG_GROUP="LoppestarsEcsStack-ServiceTaskDefwebLogGroup2A898F61-l6JeWYmfnmS5"
LOG_PREFIX="Service"
```

### Step 3: Update GitHub Actions Workflow

Use the exported resource names to update `.github/workflows/deploy-ecs.yml`:

```yaml
"executionRoleArn": "arn:aws:iam::035338517878:role/LoppestarsEcsStack-ServiceTaskDefExecutionRole919F7-gnhoBqLZhTql",
"taskRoleArn": "arn:aws:iam::035338517878:role/LoppestarsEcsStack-ServiceTaskDefTaskRole0CFE2F57-v3VAz81Cmm5R",

"logConfiguration": {
  "logDriver": "awslogs",
  "options": {
    "awslogs-group": "LoppestarsEcsStack-ServiceTaskDefwebLogGroup2A898F61-l6JeWYmfnmS5",
    "awslogs-region": "${AWS_REGION}",
    "awslogs-stream-prefix": "Service"
  }
}
```

### Step 4: Verify Everything Works

```bash
./ensure-infrastructure.sh --status
```

This performs a comprehensive check:
- ✅ Stack exists and is healthy
- ✅ Load balancer is active
- ✅ Targets are healthy
- ✅ DNS is correctly configured
- ✅ API endpoints respond

If all checks pass, you're **ready for GitHub Actions deployments**!

## Output Files

The script creates temporary files for easy access:

- `/tmp/loppestars_lb_dns.txt` - Load balancer DNS name
- `/tmp/loppestars_resources.json` - All CDK resource names
- `/tmp/loppestars_workflow_snippet.yml` - GitHub Actions snippet

## Prerequisites

The script checks for:
- ✅ AWS CLI installed and configured
- ✅ Node.js and NPX available
- ✅ curl for API testing
- ✅ jq for JSON parsing (recommended)
- ✅ `.env` file in parent directory with required variables

Required environment variables (from `.env`):
```bash
ECS_DOMAIN=loppestars.spoons.dk
CF_API_TOKEN=your_cloudflare_api_token
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SOURCE_BUCKET=stall-photos
STORAGE_BUCKET=stall-photos-processed
```

## How It Works

### Architecture

```
ensure-infrastructure.sh (Bash)
    │
    ├─→ Checks Prerequisites
    │   ├─→ AWS CLI
    │   ├─→ Node.js/NPX
    │   ├─→ .env file
    │   └─→ Required tools
    │
    ├─→ deploy-and-dns.js (Node.js)
    │   ├─→ ACM Certificate Management
    │   ├─→ CDK Deployment
    │   ├─→ Cloudflare DNS Configuration
    │   └─→ Health Check Testing
    │
    ├─→ AWS SDK/CLI
    │   ├─→ CloudFormation
    │   ├─→ ECS
    │   ├─→ ELB
    │   └─→ IAM
    │
    └─→ Cloudflare API
        └─→ DNS Record Management
```

### Status Check Flow

1. **Check CloudFormation Stack**
   - Queries stack status
   - Extracts outputs (Load Balancer DNS, Certificate ARN)

2. **Extract CDK Resources**
   - Lists task definitions
   - Describes task definition for IAM roles and log config
   - Identifies cluster and service names

3. **Check Load Balancer**
   - Verifies LB is active
   - Checks target group health
   - Reports on target status

4. **Verify DNS Configuration**
   - Calls `deploy-and-dns.js --status`
   - Ensures CNAME points to correct load balancer
   - Tests DNS resolution

5. **Test API Endpoints**
   - Health endpoint: `GET /health`
   - Root endpoint: `GET /`
   - Markets endpoint: `GET /markets/today`

### Deployment Flow

1. **Prerequisites Check**
   - Validates all tools available
   - Loads environment variables

2. **Run deploy-and-dns.js**
   - Ensures ACM certificate exists
   - Deploys CDK stack
   - Waits for completion
   - Configures DNS

3. **Post-Deployment**
   - Extracts resource names
   - Generates GitHub Actions snippets
   - Saves to output files

## Troubleshooting

### Stack Doesn't Exist

```bash
⚠️  Stack LoppestarsEcsStack does not exist

To deploy infrastructure:
  ./ensure-infrastructure.sh --deploy
```

**Solution**: Run deployment command

### Targets Unhealthy

```bash
⚠️  Target health: unhealthy
```

**Possible Causes**:
- Container failing to start
- Health check path incorrect
- Application error

**Solution**: Check CloudWatch logs:
```bash
aws logs tail /aws/ecs/loppestars --follow
```

### DNS Not Configured

```bash
⚠️  DNS record for loppestars.spoons.dk not found
```

**Solution**: Run deployment which will configure DNS automatically:
```bash
./ensure-infrastructure.sh --deploy
```

### API Endpoints Failing

```bash
❌ Health endpoint: FAILED
```

**Possible Causes**:
- DNS not propagated yet (wait 1-5 minutes)
- Container not healthy
- Load balancer not routing correctly

**Solution**: Wait and retry, or check logs

## Comparison with deploy-and-dns.js

| Feature | deploy-and-dns.js | ensure-infrastructure.sh |
|---------|-------------------|--------------------------|
| Language | Node.js | Bash |
| Certificate Management | ✅ | ✅ (via deploy-and-dns.js) |
| CDK Deployment | ✅ | ✅ (via deploy-and-dns.js) |
| DNS Configuration | ✅ | ✅ (via deploy-and-dns.js) |
| Resource Extraction | ❌ | ✅ |
| Status Checking | Basic | Comprehensive |
| GitHub Actions Integration | ❌ | ✅ |
| User-Friendly Output | Basic | Colored, formatted |
| Export Functionality | ❌ | ✅ |

## Best Practices

### Before GitHub Actions Deployment

Always run a status check:
```bash
./ensure-infrastructure.sh --status
```

### After CDK Stack Changes

Re-export resource names:
```bash
./ensure-infrastructure.sh --export
```

Then update GitHub Actions workflow with new values.

### Regular Health Checks

Add to cron or run periodically:
```bash
./ensure-infrastructure.sh --status
```

### Before Major Changes

Export current configuration for backup:
```bash
./ensure-infrastructure.sh --export > infrastructure-backup-$(date +%Y%m%d).txt
```

## Integration with GitHub Actions

### Option 1: Use CDK for Deployments (Recommended)

Update `.github/workflows/deploy-ecs.yml` to use CDK:

```yaml
- name: Deploy with CDK
  run: |
    cd aws
    npm install
    npx cdk deploy --require-approval never
```

**Pros**: No configuration drift, single source of truth

### Option 2: Keep Docker-Only Deployments

Use extracted resource names in GitHub Actions workflow.

**Pros**: Faster deployments  
**Cons**: Must update workflow when CDK stack changes

## Future Enhancements

Potential improvements:
- 🔄 Automatic GitHub Actions workflow updating
- 📊 Dashboard/web interface
- 🔔 Slack/email notifications on failures
- 📈 Historical health check logging
- 🔐 Secrets rotation integration
- 🐳 Docker image validation before deployment

## Summary

The `ensure-infrastructure.sh` script is the **single source of truth** for infrastructure readiness. It:

✅ Validates infrastructure is properly deployed  
✅ Ensures DNS is correctly configured  
✅ Extracts CDK-generated resource names  
✅ Provides clear, actionable output  
✅ Bridges the gap between CDK and GitHub Actions  

**Use this script before and after every infrastructure change to ensure everything is ready for production deployments.**

---

**Questions?** Check the script's `--help` output or review the inline comments in the code.
