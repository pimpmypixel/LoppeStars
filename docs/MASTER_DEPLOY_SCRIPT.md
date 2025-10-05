# Master Deployment Script Documentation

## Overview

The `deploy.sh` script is the **single, consolidated, idempotent deployment tool** for the entire Loppestars infrastructure. It handles:

- ✅ CloudFormation infrastructure
- ✅ Docker image builds
- ✅ ECR repository management
- ✅ ECS task definitions
- ✅ ECS service deployment
- ✅ Cloudflare DNS configuration
- ✅ API health checks

## Key Features

### Idempotent Operations
The script only takes action when necessary:
- **Infrastructure exists?** Skip creation
- **Image already built?** Skip build
- **DNS already correct?** Skip update
- **API already healthy?** Skip deployment

### Smart State Detection
Checks current state before making changes:
- CloudFormation stack status
- Docker image existence in ECR
- ECS service state
- API health status
- DNS configuration

### Minimal Dependencies
Only requires:
- AWS CLI (`/usr/local/bin/aws`)
- Docker
- Git
- curl/dig (for health checks)

## Usage

### Full Deployment
```bash
cd aws
./deploy.sh
```

This will:
1. Deploy CloudFormation stack (if needed)
2. Build and push Docker image (if changed)
3. Register task definition
4. Create/update ECS service
5. Update Cloudflare DNS (if needed)
6. Verify API health

### Status Check Only
```bash
./deploy.sh --status
```

Shows current state without making changes:
- Stack status
- Cluster and service info
- Load balancer DNS
- API health status

### Force Redeployment
```bash
./deploy.sh --force
```

Forces redeployment even if state appears healthy:
- Rebuilds Docker image
- Updates task definition
- Forces new ECS deployment

## Environment Variables Required

In `../.env` file:

```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
SUPABASE_ANON_KEY=xxx

# Cloudflare (optional, for automatic DNS)
CF_API_TOKEN=xxx
CF_ZONE_ID=xxx

# Domain
ECS_DOMAIN=loppestars.spoons.dk
```

## What Gets Deployed

### CloudFormation Stack (`stack-template.yaml`)
- **VPC**: 10.0.0.0/16 with 2 public subnets
- **ALB**: Internet-facing load balancer
- **ECS Cluster**: Fargate cluster for containers
- **Security Groups**: ALB and ECS task security
- **IAM Roles**: Task execution and task roles
- **CloudWatch Logs**: `/ecs/loppestars` log group
- **Target Group**: Health checks on `/health` endpoint

### Docker Image
- Built from root `Dockerfile`
- Tagged with git commit SHA
- Pushed to ECR repository
- Environment variables baked in

### ECS Service
- **Name**: `loppestars-service`
- **Launch Type**: Fargate
- **CPU**: 256 (0.25 vCPU)
- **Memory**: 512 MB
- **Desired Count**: 1 task
- **Port**: 8080 (container)
- **Health Check**: `/health` endpoint

## Health Check Logic

The script verifies API health by:
1. Checking `/health` endpoint returns 200
2. Response contains `"status":"healthy"`
3. Retries up to 10 times with 5-second delays
4. Only proceeds if healthy or with warnings

## DNS Update Logic

### Automatic (with Cloudflare credentials)
1. Gets Load Balancer DNS from stack
2. Compares current DNS with expected
3. Updates CNAME if mismatch detected
4. Uses Cloudflare API for changes

### Manual (without credentials)
1. Shows Load Balancer DNS
2. Prompts to manually update Cloudflare
3. Continues deployment

## Troubleshooting

### Stack Deployment Fails
```bash
# Check CloudFormation console
# https://eu-central-1.console.aws.amazon.com/cloudformation

# Check stack events
aws cloudformation describe-stack-events \
  --stack-name LoppestarsEcsStack \
  --region eu-central-1 \
  --max-items 20
```

### Docker Build Fails
```bash
# Check .env file exists
ls -la ../.env

# Verify Docker is running
docker ps

# Check ECR login
aws ecr get-login-password --region eu-central-1 | \
  docker login --username AWS --password-stdin 035338517878.dkr.ecr.eu-central-1.amazonaws.com
```

### Service Won't Stabilize
```bash
# Check service events
aws ecs describe-services \
  --cluster LoppestarsCluster \
  --services loppestars-service \
  --region eu-central-1 \
  --query 'services[0].events[:10]'

# Check task logs
aws logs tail /ecs/loppestars --follow
```

### Health Check Fails
```bash
# Test directly
curl -v https://loppestars.spoons.dk/health

# Check target health
aws elbv2 describe-target-health \
  --target-group-arn $(aws cloudformation describe-stacks \
    --stack-name LoppestarsEcsStack \
    --region eu-central-1 \
    --query 'Stacks[0].Outputs[?OutputKey==`TargetGroupArn`].OutputValue' \
    --output text)
```

## Comparison with Old Scripts

| Old Scripts | New `deploy.sh` |
|-------------|-----------------|
| 9 separate scripts | 1 consolidated script |
| Manual orchestration | Automatic flow |
| Non-idempotent | Fully idempotent |
| No state checking | Smart state detection |
| Complex dependencies | Simple execution |
| CDK dependency | Direct CloudFormation |
| Often freezes | Reliable execution |

### Deprecated Scripts (can be removed)
- `build-push.sh` - Replaced by `deploy.sh`
- `check-status.sh` - Use `deploy.sh --status`
- `create-service.sh` - Integrated into `deploy.sh`
- `deploy-direct.sh` - Replaced by `deploy.sh`
- `deploy-full.sh` - Symlink, replaced
- `deploy-manual.sh` - Replaced by `deploy.sh`
- `deploy-simple.sh` - Replaced by `deploy.sh`
- `ensure-infrastructure.sh` - Replaced by `deploy.sh`
- `rebuild-stack.sh` - Use `deploy.sh --force`

## Integration with GitHub Actions

The script can be used in GitHub Actions:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main, kitty]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: eu-central-1
      
      - name: Create .env file
        run: |
          echo "SUPABASE_URL=${{ secrets.SUPABASE_URL }}" >> .env
          echo "SUPABASE_SERVICE_ROLE_KEY=${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" >> .env
          echo "SUPABASE_ANON_KEY=${{ secrets.SUPABASE_ANON_KEY }}" >> .env
          echo "CF_API_TOKEN=${{ secrets.CF_API_TOKEN }}" >> .env
          echo "CF_ZONE_ID=${{ secrets.CF_ZONE_ID }}" >> .env
      
      - name: Deploy
        run: |
          cd aws
          ./deploy.sh
```

## Next Steps

After successful deployment:

1. ✅ Verify API: `curl https://loppestars.spoons.dk/health`
2. ✅ Test endpoints: `curl https://loppestars.spoons.dk/`
3. ✅ Check logs: `aws logs tail /ecs/loppestars --follow`
4. ✅ Update mobile app if needed
5. ✅ Monitor CloudWatch metrics

## Maintenance

### Update Application Code
```bash
# Make code changes
git add -A && git commit -m "Update API"
git push

# Deploy changes
cd aws
./deploy.sh
```

### Scale Service
```bash
aws ecs update-service \
  --cluster LoppestarsCluster \
  --service loppestars-service \
  --desired-count 2 \
  --region eu-central-1
```

### View Logs
```bash
aws logs tail /ecs/loppestars --follow --region eu-central-1
```

### Clean Up Everything
```bash
# Delete service
aws ecs delete-service \
  --cluster LoppestarsCluster \
  --service loppestars-service \
  --force \
  --region eu-central-1

# Delete stack
aws cloudformation delete-stack \
  --stack-name LoppestarsEcsStack \
  --region eu-central-1

# Delete ECR images
aws ecr batch-delete-image \
  --repository-name loppestars \
  --region eu-central-1 \
  --image-ids imageTag=latest
```

---

**The master deployment script is ready to use!**

Just run `./deploy.sh` from the `aws` directory. 🚀
