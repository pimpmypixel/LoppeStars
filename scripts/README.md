# Scripts Directory

This directory contains all operational scripts for the Loppestars project.

## Scripts

### 🚀 Deployment
- **`deploy.sh`** - Master deployment script for AWS ECS
  - Handles CloudFormation, Docker build, ECR push, ECS deployment
  - Usage: `./scripts/deploy.sh [--status|--force]`
  - Moved from `aws/deploy.sh`

- **`rebuild-stack.sh`** - Rebuild CloudFormation stack from scratch
  - Usage: `./scripts/rebuild-stack.sh`
  - Moved from `aws/rebuild-stack.sh`

### 🐳 Development
- **`start-local-api.sh`** - Start local API development server
  - Uses docker-compose for local development
  - Usage: `./scripts/start-local-api.sh [--detached]`
  - Moved from root directory

### 🔄 Data Management
- **`trigger-scraper.sh`** - Manually trigger market data scraper (async, 10-30 min)
  - Triggers scraper via API endpoint or Supabase Edge Function
  - Usage: `./scripts/trigger-scraper.sh [--api|--supabase|--status]`
  - Handles timeouts gracefully (504/502/503 are normal for long operations)
  - Includes health checks, status monitoring, and data freshness checks

### 📊 Monitoring
- **`tail-logs.sh`** - Tail CloudWatch logs for ECS Fargate tasks
  - Real-time and historical log monitoring with filtering
  - Usage: `./scripts/tail-logs.sh [--follow|--scraper|--api|--errors|--since 1h]`
  - Color-coded output for easy log analysis
  - Supports custom filters and time ranges

## Usage

All scripts should be run from the project root directory:

```bash
# From project root
./scripts/deploy.sh
./scripts/start-local-api.sh
./scripts/rebuild-stack.sh
./scripts/trigger-scraper.sh
./scripts/tail-logs.sh
```

## Dependencies

Scripts require:
- Docker and Docker Compose (for local development)
- AWS CLI (for deployment)
- Environment variables in root `.env` file

## Migration Notes

These scripts were moved from various locations to centralize all operational scripts:
- `start-local-api.sh` (from root)
- `deploy.sh` (from aws/)
- `rebuild-stack.sh` (from aws/)

All references in documentation and other files have been updated to point to the new locations.