# Deployment Guide

Complete guide for deploying the Loppestars API to AWS ECS Fargate with Docker BuildX optimization.

---

## Prerequisites

- **AWS Account** with appropriate permissions
- **AWS CLI** configured with credentials
- **Docker Desktop** installed and running
- **Git** for version control
- **Environment variables** configured in `.env` file

---

## Infrastructure Overview

The deployment uses:
- **AWS ECS Fargate** for serverless containers
- **Application Load Balancer** with HTTPS
- **Amazon ECR** for Docker image registry
- **CloudFormation** for infrastructure as code
- **Cloudflare** for DNS and CDN
- **AWS Certificate Manager** for SSL/TLS

### Resources Created
- VPC with 2 public subnets
- Internet Gateway
- Application Load Balancer (HTTPS listener on port 443)
- Target Group (health checks on `/health`)
- ECS Cluster and Service
- Security Groups (ALB and ECS task)
- IAM Roles (task execution and task role)
- CloudWatch Log Group

---

## Quick Deployment

The `deploy.sh` script handles everything automatically:

```bash
cd aws
./deploy.sh
```

This will:
1. ✅ Deploy CloudFormation stack (if needed)
2. ✅ Build Docker image with BuildX caching
3. ✅ Push image to Amazon ECR
4. ✅ Register ECS task definition
5. ✅ Create/update ECS service
6. ✅ Update Cloudflare DNS
7. ✅ Verify API health

### Options

```bash
./deploy.sh              # Full deployment
./deploy.sh --status     # Check current state only
./deploy.sh --force      # Force rebuild and redeploy
```

---

## Environment Configuration

Create `.env` file in project root:

```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_ANON_KEY=eyJ...

# API
API_BASE_URL=https://loppestars.spoons.dk
SOURCE_BUCKET=stall-photos
STORAGE_BUCKET=stall-photos-processed

# Cloudflare (optional for automatic DNS updates)
CF_API_TOKEN=xxx...
CF_ZONE_ID=xxx...
ECS_DOMAIN=loppestars.spoons.dk
```

---

## BuildX Docker Optimization

The Dockerfile uses multi-stage builds with aggressive caching:

### Build Stages
1. **base** - System dependencies (apt packages)
2. **dependencies** - Python packages (requirements.txt)
3. **models** - Face detection models (downloaded once)
4. **runtime** - Application code (changes frequently)

### Build Performance

| Scenario | Build Time | Cache Hit Rate |
|----------|-----------|----------------|
| No changes | ~5s | 100% |
| Code changes only | ~5s | 95% |
| requirements.txt change | ~2-3min | 70% |
| System packages change | ~4-5min | 30% |
| Cold build (first time) | ~6-8min | 0% |

### Cache Strategy

**Local Cache Mounts:**
```dockerfile
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/root/.cache/pip
```

**Registry Cache (ECR):**
```bash
--cache-from type=registry,ref=$ecr_repo:buildcache \
--cache-to type=registry,ref=$ecr_repo:buildcache,mode=max
```

**Build Context Optimization:**
- `.dockerignore` excludes `app/`, `docs/`, `aws/`, `.git/`
- Reduces build context from ~200MB to ~40MB
- Faster uploads to BuildX builder

---

## Manual Deployment Steps

If you need to deploy manually or understand what `deploy.sh` does:

### 1. Deploy Infrastructure

```bash
cd aws

# Deploy CloudFormation stack
aws cloudformation deploy \
  --template-file stack-template.yaml \
  --stack-name LoppestarsEcsStack \
  --parameter-overrides \
      Domain=loppestars.spoons.dk \
      SupabaseUrl=$SUPABASE_URL \
      SupabaseServiceRoleKey=$SUPABASE_SERVICE_ROLE_KEY \
      SupabaseAnonKey=$SUPABASE_ANON_KEY \
  --capabilities CAPABILITY_IAM \
  --region eu-central-1
```

### 2. Build and Push Docker Image

```bash
# Login to ECR
aws ecr get-login-password --region eu-central-1 | \
  docker login --username AWS --password-stdin 035338517878.dkr.ecr.eu-central-1.amazonaws.com

# Create ECR repository (if needed)
aws ecr create-repository --repository-name loppestars --region eu-central-1 || true

# Build with BuildX
docker buildx build \
  --platform linux/amd64 \
  --cache-from type=registry,ref=035338517878.dkr.ecr.eu-central-1.amazonaws.com/loppestars:buildcache \
  --cache-to type=registry,ref=035338517878.dkr.ecr.eu-central-1.amazonaws.com/loppestars:buildcache,mode=max \
  --build-arg SUPABASE_URL="$SUPABASE_URL" \
  --build-arg SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  --build-arg SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  --build-arg SOURCE_BUCKET="stall-photos" \
  --build-arg STORAGE_BUCKET="stall-photos-processed" \
  -t 035338517878.dkr.ecr.eu-central-1.amazonaws.com/loppestars:$(git rev-parse --short HEAD) \
  -t 035338517878.dkr.ecr.eu-central-1.amazonaws.com/loppestars:latest \
  --push \
  -f Dockerfile .
```

### 3. Register Task Definition

```bash
# Get stack outputs
TASK_EXEC_ROLE=$(aws cloudformation describe-stacks \
  --stack-name LoppestarsEcsStack \
  --query 'Stacks[0].Outputs[?OutputKey==`TaskExecutionRoleArn`].OutputValue' \
  --output text)

TASK_ROLE=$(aws cloudformation describe-stacks \
  --stack-name LoppestarsEcsStack \
  --query 'Stacks[0].Outputs[?OutputKey==`TaskRoleArn`].OutputValue' \
  --output text)

LOG_GROUP=$(aws cloudformation describe-stacks \
  --stack-name LoppestarsEcsStack \
  --query 'Stacks[0].Outputs[?OutputKey==`LogGroupName`].OutputValue' \
  --output text)

# Create task definition JSON
cat > task-def.json <<EOF
{
  "family": "loppestars",
  "requiresCompatibilities": ["FARGATE"],
  "networkMode": "awsvpc",
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "$TASK_EXEC_ROLE",
  "taskRoleArn": "$TASK_ROLE",
  "containerDefinitions": [{
    "name": "web",
    "image": "035338517878.dkr.ecr.eu-central-1.amazonaws.com/loppestars:$(git rev-parse --short HEAD)",
    "cpu": 256,
    "memory": 512,
    "essential": true,
    "portMappings": [{"containerPort": 8080, "protocol": "tcp"}],
    "environment": [
      {"name": "SUPABASE_URL", "value": "$SUPABASE_URL"},
      {"name": "SUPABASE_SERVICE_ROLE_KEY", "value": "$SUPABASE_SERVICE_ROLE_KEY"},
      {"name": "SUPABASE_ANON_KEY", "value": "$SUPABASE_ANON_KEY"},
      {"name": "SOURCE_BUCKET", "value": "stall-photos"},
      {"name": "STORAGE_BUCKET", "value": "stall-photos-processed"}
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "$LOG_GROUP",
        "awslogs-region": "eu-central-1",
        "awslogs-stream-prefix": "ecs"
      }
    }
  }]
}
EOF

# Register task definition
aws ecs register-task-definition \
  --cli-input-json file://task-def.json \
  --region eu-central-1
```

### 4. Create/Update ECS Service

```bash
# Get stack outputs
TARGET_GROUP=$(aws cloudformation describe-stacks \
  --stack-name LoppestarsEcsStack \
  --query 'Stacks[0].Outputs[?OutputKey==`TargetGroupArn`].OutputValue' \
  --output text)

SUBNETS=$(aws cloudformation describe-stacks \
  --stack-name LoppestarsEcsStack \
  --query 'Stacks[0].Outputs[?OutputKey==`SubnetIds`].OutputValue' \
  --output text)

SECURITY_GROUP=$(aws cloudformation describe-stacks \
  --stack-name LoppestarsEcsStack \
  --query 'Stacks[0].Outputs[?OutputKey==`ECSSecurityGroupId`].OutputValue' \
  --output text)

# Create service (first time)
aws ecs create-service \
  --cluster LoppestarsCluster \
  --service-name loppestars-service \
  --task-definition loppestars \
  --desired-count 1 \
  --launch-type FARGATE \
  --platform-version LATEST \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNETS],securityGroups=[$SECURITY_GROUP],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=$TARGET_GROUP,containerName=web,containerPort=8080" \
  --health-check-grace-period-seconds 60 \
  --region eu-central-1

# Or update existing service
aws ecs update-service \
  --cluster LoppestarsCluster \
  --service loppestars-service \
  --task-definition loppestars \
  --force-new-deployment \
  --region eu-central-1
```

### 5. Update DNS (Cloudflare)

```bash
# Get load balancer DNS
ALB_DNS=$(aws cloudformation describe-stacks \
  --stack-name LoppestarsEcsStack \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text)

# Update Cloudflare DNS record
curl -X PUT "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records/<RECORD_ID>" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "CNAME",
    "name": "loppestars",
    "content": "'$ALB_DNS'",
    "ttl": 1,
    "proxied": true
  }'
```

---

## Monitoring

### View Container Logs
```bash
aws logs tail /ecs/loppestars --follow --region eu-central-1
```

### Check Service Status
```bash
aws ecs describe-services \
  --cluster LoppestarsCluster \
  --services loppestars-service \
  --region eu-central-1
```

### Check Task Status
```bash
aws ecs list-tasks \
  --cluster LoppestarsCluster \
  --service-name loppestars-service \
  --region eu-central-1
```

### Check Target Health
```bash
TARGET_GROUP_ARN=$(aws cloudformation describe-stacks \
  --stack-name LoppestarsEcsStack \
  --query 'Stacks[0].Outputs[?OutputKey==`TargetGroupArn`].OutputValue' \
  --output text)

aws elbv2 describe-target-health \
  --target-group-arn $TARGET_GROUP_ARN
```

### Test API Health
```bash
curl https://loppestars.spoons.dk/health
```

Expected response:
```json
{"status":"healthy","service":"loppestars"}
```

---

## Rollback

### Quick Rollback (previous task definition)
```bash
aws ecs update-service \
  --cluster LoppestarsCluster \
  --service loppestars-service \
  --task-definition loppestars:33 \
  --region eu-central-1
```

### Full Rollback (redeploy from git)
```bash
git checkout <previous-commit>
cd aws
./deploy.sh --force
```

### Emergency Stop
```bash
aws ecs update-service \
  --cluster LoppestarsCluster \
  --service loppestars-service \
  --desired-count 0 \
  --region eu-central-1
```

---

## Scaling

### Manual Scaling
```bash
aws ecs update-service \
  --cluster LoppestarsCluster \
  --service loppestars-service \
  --desired-count 2 \
  --region eu-central-1
```

### Auto Scaling (future)
Add auto-scaling policies based on:
- CPU utilization
- Memory utilization
- ALB request count per target

---

## Cost Optimization

### Current Configuration
- **Fargate CPU**: 256 (0.25 vCPU) × $0.04048/hr = **~$0.01/hr**
- **Fargate Memory**: 512 MB × $0.004445/hr = **~$0.002/hr**
- **Total Compute**: **~$0.012/hr or ~$8.64/month**
- **ALB**: ~$16.20/month (fixed)
- **Data Transfer**: Pay as you go
- **CloudWatch Logs**: ~$0.50/month (1 GB)

### Estimated Monthly Cost
- **Total**: ~$25-30/month for single task

---

## Troubleshooting

See **[Troubleshooting Guide](TROUBLESHOOTING.md)** for common issues:
- BuildX errors
- Service won't stabilize
- Health check failures
- DNS issues
- SSL certificate problems

---

## CI/CD Integration

### GitHub Actions Example

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
      
      - name: Create .env
        run: |
          echo "SUPABASE_URL=${{ secrets.SUPABASE_URL }}" >> .env
          echo "SUPABASE_SERVICE_ROLE_KEY=${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" >> .env
          echo "SUPABASE_ANON_KEY=${{ secrets.SUPABASE_ANON_KEY }}" >> .env
      
      - name: Deploy
        run: |
          cd aws
          ./deploy.sh
```

---

## Next Steps

After successful deployment:

1. ✅ Verify API health: `curl https://loppestars.spoons.dk/health`
2. ✅ Test face processing endpoint
3. ✅ Monitor CloudWatch logs
4. ✅ Set up CloudWatch alarms
5. ✅ Configure auto-scaling (optional)
6. ✅ Update mobile app with production API URL

---

**Deployment complete!** 🚀
