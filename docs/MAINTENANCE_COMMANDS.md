# 🛠️ Loppestars Maintenance Commands Reference

**Quick reference for all maintenance and operational commands for Loppestars project.**

**Last Updated**: October 7, 2025  
**Repository**: pimpmypixel/LoppeStars  
**Branch**: kitty

---

## 📑 Table of Contents

- [🚀 Quick Actions](#-quick-actions)
- [📱 Mobile App Development](#-mobile-app-development)  
- [🗄️ Supabase Cloud Management](#️-supabase-cloud-management)
- [🐳 Docker API Development](#-docker-api-development)
- [☁️ AWS ECS Deployment](#️-aws-ecs-deployment)
- [🔄 GitHub Actions CI/CD](#-github-actions-cicd)
- [📊 Data Management & Scraping](#-data-management--scraping)
- [🌐 Cloudflare DNS](#-cloudflare-dns)
- [📊 Monitoring & Debugging](#-monitoring--debugging)
- [🔧 Troubleshooting](#-troubleshooting)

---

## 🚀 Quick Actions

### Start Local Development
```bash
# Start mobile app
cd app && bun run start

# Start local API
./scripts/start-local-api.sh

# Start API in background
./scripts/start-local-api.sh --detached
```

### Deploy to Production
```bash
# Automated AWS deployment
./scripts/deploy.sh

# Force redeployment
./scripts/deploy.sh --force

# Check deployment status
./scripts/deploy.sh --status
```

### Health Checks
```bash
# Local API
curl http://localhost:8080/health

# Production API
curl https://loppestars.spoons.dk/health

# Mobile app connectivity
# Check ConnectivitySplash component in app
```

---

## 📱 Mobile App Development

### Project Setup
```bash
cd app

# Install dependencies
bun install

# Install iOS pods (macOS only)
cd ios && pod install && cd ..

# Clean metro cache
npm run start -- --clear
```

### Development Servers
```bash
# Start Expo development server
bun run start
# or
bunx expo start

# Platform-specific runs
bun run android    # Android emulator
bun run ios        # iOS simulator (macOS only)  
bun run web        # Web browser
```

### Build & Deployment
```bash
# TypeScript type checking
bun run ts:check
bun run ts:watch   # Watch mode

# Build for production
bunx expo build:android
bunx expo build:ios

# EAS Build (modern approach)
bunx eas build --platform android
bunx eas build --platform ios
bunx eas build --platform all
```

### Testing & Debugging
```bash
# Run tests
bun test

# View device logs
bunx react-native log-android
bunx react-native log-ios

# Clear all caches
rm -rf node_modules bun.lockb
bun install
bunx expo start --clear

# Android clean build
cd android && ./gradlew clean && cd ..
```

### Environment Management
```bash
# All environment variables are in root .env file
cp .env.example .env  # If setting up for first time

# Key variables for mobile app:
# SUPABASE_URL_ANDROID=http://10.0.2.2:54321
# SUPABASE_URL_IOS=http://127.0.0.1:54321  
# SUPABASE_ANON_KEY=your-anon-key
# GOOGLE_WEB_CLIENT_ID=your-web-client-id
# GOOGLE_ANDROID_CLIENT_ID=your-android-client-id
```

---

## 🗄️ Supabase Cloud Management

### Database Migrations
```bash
# Deploy complete migration script (Recommended)
# 1. Copy COMPLETE_MIGRATION_SCRIPT.sql content
# 2. Open: https://supabase.com/dashboard/project/oprevwbturtujbugynct/sql
# 3. Paste and execute

# Or apply individual migrations
supabase db push

# Reset database (careful!)
supabase db reset

# Check migration status
supabase db status
```

### Edge Functions
```bash
# Deploy all functions
supabase functions deploy api-proxy
supabase functions deploy send-scrape-status

# Deploy specific function
supabase functions deploy api-proxy

# View function logs
supabase functions logs api-proxy
supabase functions logs send-scrape-status

# Set function secrets
supabase secrets set SUPABASE_URL=https://oprevwbturtujbugynct.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# List secrets  
supabase secrets list
```

### Database Management
```bash
# Connect to database
supabase db connect

# Run SQL commands
supabase db sql --file supabase/SEED_USER_ROLES.sql

# Backup database
pg_dump "postgresql://postgres:[password]@db.oprevwbturtujbugynct.supabase.co:5432/postgres" > backup.sql

# Generate types for TypeScript
supabase gen types typescript --project-id oprevwbturtujbugynct > types/supabase.ts
```

### Storage Management
```bash
# Via Supabase Dashboard:
# https://supabase.com/dashboard/project/oprevwbturtujbugynct/storage/buckets

# Bucket policies are in migration script:
# - stall-photos (original photos, user-specific)
# - stall-photos-processed (face-blurred photos, public read)
```

### Authentication
```bash
# Via Supabase Dashboard:
# https://supabase.com/dashboard/project/oprevwbturtujbugynct/auth/users

# Google OAuth configured with:
# - Web Client ID (for Supabase)
# - Android Client ID (for React Native)
# Redirect URLs: loppestars://**, exp://**, http://localhost:19006/**
```

---

## 🐳 Docker API Development

### Local Development
```bash
# Start local development server
./scripts/start-local-api.sh

# Start in background/detached mode
./scripts/start-local-api.sh --detached

# View logs
docker-compose -f docker-compose.dev.yml logs -f api

# Stop local server
docker-compose -f docker-compose.dev.yml down

# Rebuild and restart
docker-compose -f docker-compose.dev.yml up --build
```

### Docker Management
```bash
# Build production image locally
docker build -t loppestars-api \
  --build-arg SUPABASE_URL=$SUPABASE_URL \
  --build-arg SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY \
  --build-arg SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY \
  --build-arg SOURCE_BUCKET=stall-photos \
  --build-arg STORAGE_BUCKET=stall-photos-processed \
  -f Dockerfile .

# Run production image locally
docker run -p 8080:8080 loppestars-api

# Clean up Docker resources
docker system prune -a
docker buildx prune -a
```

### API Testing
```bash
# Health check
curl http://localhost:8080/health

# Face processing (requires image file)
curl -X POST http://localhost:8080/process \
  -F "file=@test-image.jpg" \
  -o processed-image.jpg

# API documentation
open http://localhost:8080/docs
```

### Face Processing Testing
```bash
# Test face detection with sample images
cd api
python test_face_processor.py

# Test specific image
python -c "
from face_processor import FaceProcessor
processor = FaceProcessor()
result = processor.process_image('test-image.jpg')
print(f'Faces detected: {len(result)}')
"
```

---

## ☁️ AWS ECS Deployment

### Full Deployment
```bash
# Complete automated deployment
./scripts/deploy.sh

# Force redeployment (even if healthy)
./scripts/deploy.sh --force

# Status check only
./scripts/deploy.sh --status
```

### Manual AWS Commands
```bash
# AWS CLI setup (pipe to cat to avoid pager issues)
aws configure | cat

# ECR Login
aws ecr get-login-password --region eu-central-1 | \
  docker login --username AWS --password-stdin 035338517878.dkr.ecr.eu-central-1.amazonaws.com

# List ECS clusters
aws ecs list-clusters --region eu-central-1 | cat

# List ECS services
aws ecs list-services --cluster LoppestarsEcsStack-ClusterEB0386A7-3Mzih57cTorn --region eu-central-1 | cat

# Describe ECS service
aws ecs describe-services \
  --cluster LoppestarsEcsStack-ClusterEB0386A7-3Mzih57cTorn \
  --services LoppestarsEcsStack-Service9571FDD8-mtj8oW2z8iEu \
  --region eu-central-1 | cat

# List running tasks
aws ecs list-tasks \
  --cluster LoppestarsEcsStack-ClusterEB0386A7-3Mzih57cTorn \
  --service-name LoppestarsEcsStack-Service9571FDD8-mtj8oW2z8iEu \
  --region eu-central-1 | cat

# Force new deployment
aws ecs update-service \
  --cluster LoppestarsEcsStack-ClusterEB0386A7-3Mzih57cTorn \
  --service LoppestarsEcsStack-Service9571FDD8-mtj8oW2z8iEu \
  --force-new-deployment \
  --region eu-central-1 | cat
```

### CloudFormation Management
```bash
# Deploy/update stack
aws cloudformation deploy \
  --template-file aws/stack-template.yaml \
  --stack-name LoppestarsEcsStack \
  --region eu-central-1 \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    Domain=loppestars.spoons.dk \
    SupabaseUrl=$SUPABASE_URL \
    SupabaseServiceRoleKey=$SUPABASE_SERVICE_ROLE_KEY \
    SupabaseAnonKey=$SUPABASE_ANON_KEY

# Check stack status
aws cloudformation describe-stacks \
  --stack-name LoppestarsEcsStack \
  --region eu-central-1 | cat

# Get stack outputs
aws cloudformation describe-stacks \
  --stack-name LoppestarsEcsStack \
  --region eu-central-1 \
  --query 'Stacks[0].Outputs' | cat

# Delete stack (careful!)
aws cloudformation delete-stack \
  --stack-name LoppestarsEcsStack \
  --region eu-central-1
```

### ECR Management
```bash
# List repositories
aws ecr describe-repositories --region eu-central-1 | cat

# List images in repository
aws ecr describe-images \
  --repository-name cdk-hnb659fds-container-assets-035338517878-eu-central-1 \
  --region eu-central-1 | cat

# Get image by tag
aws ecr describe-images \
  --repository-name cdk-hnb659fds-container-assets-035338517878-eu-central-1 \
  --image-ids imageTag=abc1234 \
  --region eu-central-1 | cat

# Delete old images (keeps latest 10)
aws ecr list-images \
  --repository-name cdk-hnb659fds-container-assets-035338517878-eu-central-1 \
  --region eu-central-1 \
  --filter tagStatus=TAGGED \
  --query 'imageIds[10:]' \
  --output json | \
aws ecr batch-delete-image \
  --repository-name cdk-hnb659fds-container-assets-035338517878-eu-central-1 \
  --region eu-central-1 \
  --image-ids file:///dev/stdin | cat
```

---

## 🔄 GitHub Actions CI/CD

### Monitoring Workflows
```bash
# List recent workflow runs (pipe to cat to avoid pager)
gh run list --limit 10 | cat

# View specific workflow run
gh run view <RUN_ID> | cat

# View workflow logs
gh run view <RUN_ID> --log | cat

# Watch workflow in real-time
gh run watch

# List workflow files
gh workflow list | cat
```

### Triggering Deployments
```bash
# Deployment triggers automatically on push to main branch
git checkout main
git merge kitty
git push origin main

# Or push to main directly
git push origin kitty:main

# Check deployment status
gh run list --branch main --limit 1 | cat
```

### Secrets Management
```bash
# List repository secrets
gh secret list | cat

# Set secret
gh secret set SECRET_NAME --body "secret-value"

# Delete secret
gh secret delete SECRET_NAME

# Required secrets for deployment:
# - AWS_ACCESS_KEY_ID
# - AWS_SECRET_ACCESS_KEY  
# - SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY
# - SUPABASE_ANON_KEY
```

### Workflow Debugging
```bash
# Download workflow artifacts
gh run download <RUN_ID>

# View workflow definition
cat .github/workflows/deploy-ecs.yml

# Validate workflow syntax
gh workflow view deploy-ecs.yml | cat

# Re-run failed workflow
gh run rerun <RUN_ID>
```

---

## 📊 Data Management & Scraping

### Manual Scraper Trigger
```bash
# Trigger market data scraper via API (default, async 10-30 min operation)
./scripts/trigger-scraper.sh

# Trigger via API endpoint explicitly
./scripts/trigger-scraper.sh --api

# Trigger via Supabase Edge Function
./scripts/trigger-scraper.sh --supabase

# Check scraper status and recent logs
./scripts/trigger-scraper.sh --status

# Show help
./scripts/trigger-scraper.sh --help
```

**⏰ Important Notes:**
- Scraping is **asynchronous** and takes **10-30 minutes** to complete
- 504/502/503 timeouts are **normal** - scraper continues running in background
- Use `--status` to monitor progress and check data freshness
- Check logs with: `aws logs tail /ecs/loppestars --follow --region eu-central-1 | grep -i scraper`

### Scraper Endpoints
```bash
# Direct API call to trigger scraper
curl -X POST https://loppestars.spoons.dk/scraper/trigger

# Via Supabase Edge Function (with auth)
curl -X POST https://oprevwbturtujbugynct.supabase.co/functions/v1/trigger-scraper \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'

# Check API health before triggering
curl https://loppestars.spoons.dk/health
```

### Market Data Queries
```bash
# Get today's markets
curl "https://loppestars.spoons.dk/markets/today"

# Get nearby markets (requires coordinates)
curl "https://loppestars.spoons.dk/markets/nearby?latitude=55.6761&longitude=12.5683&radius_km=50"

# Check recent scraping logs via Supabase
curl -X GET "https://oprevwbturtujbugynct.supabase.co/rest/v1/scraping_logs?order=scraped_at.desc&limit=10" \
  -H "apikey: $SUPABASE_ANON_KEY"

# Check latest market data freshness
curl -X GET "https://oprevwbturtujbugynct.supabase.co/rest/v1/markets?select=scraped_at&order=scraped_at.desc&limit=1" \
  -H "apikey: $SUPABASE_ANON_KEY"
```

### Scraper Monitoring
```bash
# View scraper logs (production)
aws logs filter-log-events \
  --log-group-name /ecs/loppestars \
  --filter-pattern "scraper" \
  --start-time $(date -d '1 hour ago' +%s)000 \
  --region eu-central-1 | cat

# Check scraper cron status in container
docker exec -it <container_id> ps aux | grep scraper_cron

# Monitor market data updates
watch -n 30 "curl -s 'https://loppestars.spoons.dk/markets/today' | jq 'length'"
```

---

## 🌐 Cloudflare DNS

### DNS Management
```bash
# Check current DNS resolution
dig loppestars.spoons.dk | cat
nslookup loppestars.spoons.dk

# Get load balancer DNS
aws cloudformation describe-stacks \
  --stack-name LoppestarsEcsStack \
  --region eu-central-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text | cat

# Manual DNS update (if CF_API_TOKEN and CF_ZONE_ID are set)
# This is automated in deploy.sh, but manual commands:

# Get Cloudflare record ID
curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records?name=loppestars.spoons.dk" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json"

# Update CNAME record
curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records/$RECORD_ID" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"type":"CNAME","name":"loppestars.spoons.dk","content":"LoppestarsEcsStack-LoadBa-xyz.eu-central-1.elb.amazonaws.com","ttl":1,"proxied":true}'
```

### SSL Certificate Management
```bash
# List ACM certificates
aws acm list-certificates --region eu-central-1 | cat

# Describe specific certificate
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:eu-central-1:035338517878:certificate/xyz \
  --region eu-central-1 | cat

# Certificate validation is handled automatically via DNS validation
# CloudFormation creates the certificate and DNS validation records
```

---

## 📊 Monitoring & Debugging

### Application Logs
```bash
# ECS task logs (production)
aws logs tail /ecs/loppestars --follow --region eu-central-1

# Specific log stream
aws logs describe-log-streams \
  --log-group-name /ecs/loppestars \
  --region eu-central-1 | cat

# Local API logs
docker-compose -f docker-compose.dev.yml logs -f api

# Mobile app logs
bunx react-native log-android
bunx react-native log-ios

# Expo logs
bunx expo logs
```

### Health Monitoring
```bash
# API health checks
curl -s https://loppestars.spoons.dk/health | jq
curl -s http://localhost:8080/health | jq

# ECS service health
aws ecs describe-services \
  --cluster LoppestarsEcsStack-ClusterEB0386A7-3Mzih57cTorn \
  --services LoppestarsEcsStack-Service9571FDD8-mtj8oW2z8iEu \
  --region eu-central-1 \
  --query 'services[0].{running:runningCount,desired:desiredCount,status:status}' | cat

# Load balancer target health
aws elbv2 describe-target-health \
  --target-group-arn $(aws cloudformation describe-stacks \
    --stack-name LoppestarsEcsStack \
    --region eu-central-1 \
    --query 'Stacks[0].Outputs[?OutputKey==`TargetGroupArn`].OutputValue' \
    --output text) \
  --region eu-central-1 | cat
```

### Performance Monitoring
```bash
# CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=LoppestarsEcsStack-Service9571FDD8-mtj8oW2z8iEu Name=ClusterName,Value=LoppestarsEcsStack-ClusterEB0386A7-3Mzih57cTorn \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average \
  --region eu-central-1 | cat

# API response time test
time curl -s https://loppestars.spoons.dk/health

# Load testing (simple)
for i in {1..10}; do
  curl -s -w "Response time: %{time_total}s\n" https://loppestars.spoons.dk/health > /dev/null
done
```

### Database Monitoring
```bash
# Supabase Dashboard: https://supabase.com/dashboard/project/oprevwbturtujbugynct

# Check database connections
# Via dashboard: Settings > Database > Connection pooling

# Monitor active queries
# Via dashboard: Reports > Database

# Check storage usage
# Via dashboard: Settings > Storage
```

---

## 🔧 Troubleshooting

### Common Issues & Solutions

#### Docker Build Issues
```bash
# Clear BuildX cache
docker buildx prune -a

# Remove all Docker images and containers
docker system prune -a

# Recreate BuildX builder
docker buildx rm loppestars-builder
docker buildx create --name loppestars-builder --use --bootstrap
```

#### ECS Deployment Issues
```bash
# Check stopped tasks for error reasons
aws ecs list-tasks \
  --cluster LoppestarsEcsStack-ClusterEB0386A7-3Mzih57cTorn \
  --service-name LoppestarsEcsStack-Service9571FDD8-mtj8oW2z8iEu \
  --desired-status STOPPED \
  --region eu-central-1 | cat

# Describe stopped task
aws ecs describe-tasks \
  --cluster LoppestarsEcsStack-ClusterEB0386A7-3Mzih57cTorn \
  --tasks <TASK_ARN> \
  --region eu-central-1 | cat

# Force service update
aws ecs update-service \
  --cluster LoppestarsEcsStack-ClusterEB0386A7-3Mzih57cTorn \
  --service LoppestarsEcsStack-Service9571FDD8-mtj8oW2z8iEu \
  --force-new-deployment \
  --region eu-central-1 | cat
```

#### Mobile App Issues
```bash
# Clear all caches
cd app
rm -rf node_modules bun.lockb
bun install
bunx expo start --clear

# Android specific
cd android && ./gradlew clean && cd ..

# Reset Metro bundler
bunx expo start --clear --reset-cache

# Clear AsyncStorage (add to app temporarily)
import AsyncStorage from '@react-native-async-storage/async-storage';
AsyncStorage.clear();
```

#### Supabase Connection Issues
```bash
# Test connection
curl -H "apikey: $SUPABASE_ANON_KEY" \
  "$SUPABASE_URL/rest/v1/markets?select=*&limit=1"

# Check environment variables
echo "SUPABASE_URL: $SUPABASE_URL"
echo "SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY:0:20}..."

# Reset Supabase client (in app)
# Clear AsyncStorage and restart app
```

#### GitHub Actions Issues
```bash
# Check failed workflow
gh run view <RUN_ID> --log | grep -i error

# Common issues:
# 1. ECR push permissions - rerun workflow
# 2. ECS service stuck - force new deployment  
# 3. Health check timeout - check API logs

# Re-run failed workflow
gh run rerun <RUN_ID>
```

### Emergency Procedures

#### Rollback Deployment
```bash
# Get previous task definition
aws ecs list-task-definitions \
  --family-prefix loppestars \
  --status ACTIVE \
  --sort DESC \
  --region eu-central-1 | cat

# Update service to previous task definition
aws ecs update-service \
  --cluster LoppestarsEcsStack-ClusterEB0386A7-3Mzih57cTorn \
  --service LoppestarsEcsStack-Service9571FDD8-mtj8oW2z8iEu \
  --task-definition loppestars:PREVIOUS_REVISION \
  --region eu-central-1 | cat
```

#### Database Recovery
```bash
# Backup current database first
pg_dump "postgresql://postgres:[password]@db.oprevwbturtujbugynct.supabase.co:5432/postgres" > emergency_backup.sql

# Reset to migration baseline
supabase db reset

# Apply complete migration
# Copy COMPLETE_MIGRATION_SCRIPT.sql to Supabase SQL Editor and execute
```

#### API Emergency Stop
```bash
# Scale ECS service to 0 tasks
aws ecs update-service \
  --cluster LoppestarsEcsStack-ClusterEB0386A7-3Mzih57cTorn \
  --service LoppestarsEcsStack-Service9571FDD8-mtj8oW2z8iEu \
  --desired-count 0 \
  --region eu-central-1 | cat

# Restart with 1 task
aws ecs update-service \
  --cluster LoppestarsEcsStack-ClusterEB0386A7-3Mzih57cTorn \
  --service LoppestarsEcsStack-Service9571FDD8-mtj8oW2z8iEu \
  --desired-count 1 \
  --region eu-central-1 | cat
```

---

## 📋 Quick Reference

### Key URLs
- **Production API**: https://loppestars.spoons.dk
- **API Health**: https://loppestars.spoons.dk/health
- **API Docs**: https://loppestars.spoons.dk/docs
- **Supabase Dashboard**: https://supabase.com/dashboard/project/oprevwbturtujbugynct
- **AWS Console**: https://console.aws.amazon.com/ecs/home?region=eu-central-1
- **GitHub Actions**: https://github.com/pimpmypixel/LoppeStars/actions

### Key File Locations
- **Environment**: `/Users/andreas/Herd/loppestars/.env`
- **Scripts**: `/Users/andreas/Herd/loppestars/scripts/`
- **Documentation**: `/Users/andreas/Herd/loppestars/docs/`
- **Supabase Config**: `/Users/andreas/Herd/loppestars/supabase/`
- **Mobile App**: `/Users/andreas/Herd/loppestars/app/`
- **API Code**: `/Users/andreas/Herd/loppestars/api/`
- **AWS Config**: `/Users/andreas/Herd/loppestars/aws/`
- **Docker Files**: `/Users/andreas/Herd/loppestars/Dockerfile` + `docker-compose.dev.yml`

### Important IDs
- **AWS Account**: 035338517878
- **AWS Region**: eu-central-1
- **Supabase Project**: oprevwbturtujbugynct
- **ECS Cluster**: LoppestarsEcsStack-ClusterEB0386A7-3Mzih57cTorn
- **ECS Service**: LoppestarsEcsStack-Service9571FDD8-mtj8oW2z8iEu
- **ECR Repository**: cdk-hnb659fds-container-assets-035338517878-eu-central-1
- **Domain**: loppestars.spoons.dk

### Command Aliases (add to ~/.zshrc)
```bash
# Loppestars shortcuts
alias ls-app='cd /Users/andreas/Herd/loppestars/app && bun run start'
alias ls-api='cd /Users/andreas/Herd/loppestars && ./scripts/start-local-api.sh'
alias ls-deploy='cd /Users/andreas/Herd/loppestars && ./scripts/deploy.sh'
alias ls-status='cd /Users/andreas/Herd/loppestars && ./scripts/deploy.sh --status'
alias ls-scraper='cd /Users/andreas/Herd/loppestars && ./scripts/trigger-scraper.sh'
alias ls-health='curl -s https://loppestars.spoons.dk/health | jq'
alias ls-logs='aws logs tail /ecs/loppestars --follow --region eu-central-1'
alias ls-gh='gh run list --limit 5 | cat'
```

---

**🎯 Pro Tips:**
- Always pipe AWS CLI and GitHub CLI commands to `cat` to avoid pager issues
- Use `./deploy.sh --status` to check deployment health before making changes  
- Keep the `.env` file updated with current credentials
- Test locally before deploying to production
- Monitor GitHub Actions after pushing to main branch
- Use `--force` flag sparingly - only when necessary

**📞 Emergency Contact**: If something breaks, check GitHub Issues or contact repository maintainers.

---

**Built with ❤️ for smooth operations** ⚙️