#!/bin/bash
#
# Loppestars Master Deployment Script
# =====================================
# Idempotent deployment script that handles infrastructure, Docker, ECS, and Cloudflare DNS.
# Only takes action when necessary based on current state.
#
# Usage:
#   ./deploy.sh              # Full deployment with all checks
#   ./deploy.sh --status     # Status check only
#   ./deploy.sh --force      # Force redeployment even if healthy
#

set -e

# Configuration
AWS_CLI="${AWS_CLI:-/usr/local/bin/aws}"
REGION="eu-central-1"
ACCOUNT_ID="035338517878"
STACK_NAME="LoppestarsEcsStack"
CLUSTER_NAME="LoppestarsCluster"
SERVICE_NAME="loppestars-service"
DOMAIN="${ECS_DOMAIN:-loppestars.spoons.dk}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Parse arguments
STATUS_ONLY=false
FORCE_DEPLOY=false
while [[ $# -gt 0 ]]; do
  case $1 in
    --status) STATUS_ONLY=true; shift ;;
    --force) FORCE_DEPLOY=true; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# Helper functions
log_header() { echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n${CYAN}$1${NC}\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Load environment variables
load_env() {
  if [ -f "$SCRIPT_DIR/../.env" ]; then
    source "$SCRIPT_DIR/../.env"
    log_success "Loaded environment variables"
  else
    log_error ".env file not found"
    exit 1
  fi
}

# Check if CloudFormation stack exists
check_stack_exists() {
  local status=$($AWS_CLI cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].StackStatus' \
    --output text 2>&1 || echo "NOT_FOUND")
  
  if [[ "$status" == "NOT_FOUND" ]] || [[ "$status" == *"does not exist"* ]]; then
    echo "NOT_FOUND"
  else
    echo "$status"
  fi
}

# Get stack outputs
get_stack_output() {
  local key=$1
  $AWS_CLI cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query "Stacks[0].Outputs[?OutputKey=='$key'].OutputValue" \
    --output text 2>/dev/null || echo ""
}

# Deploy CloudFormation stack
deploy_infrastructure() {
  log_header "Deploying Infrastructure"
  
  local stack_status=$(check_stack_exists)
  
  if [[ "$stack_status" == "CREATE_COMPLETE" ]] || [[ "$stack_status" == "UPDATE_COMPLETE" ]]; then
    log_success "Stack already exists: $stack_status"
    if [ "$FORCE_DEPLOY" = false ]; then
      return 0
    fi
    log_info "Force deploy requested, updating stack..."
  fi
  
  # Check if ACM certificate exists for domain
  log_info "Checking for ACM certificate..."
  local cert_arn=$($AWS_CLI acm list-certificates \
    --region "$REGION" \
    --certificate-statuses ISSUED \
    --query "CertificateSummaryList[?DomainName=='$DOMAIN'].CertificateArn | [0]" \
    --output text 2>/dev/null || echo "")
  
  if [ -n "$cert_arn" ] && [ "$cert_arn" != "None" ]; then
    log_success "Found existing certificate: $cert_arn"
  else
    log_warning "No ACM certificate found, will create DNS-validated certificate"
    log_info "You will need to add DNS validation records in Cloudflare"
    cert_arn=""
  fi
  
  log_info "Deploying CloudFormation stack..."
  $AWS_CLI cloudformation deploy \
    --template-file "$SCRIPT_DIR/stack-template.yaml" \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --capabilities CAPABILITY_IAM \
    --parameter-overrides \
      Domain="$DOMAIN" \
      SupabaseUrl="$SUPABASE_URL" \
      SupabaseServiceRoleKey="$SUPABASE_SERVICE_ROLE_KEY" \
      SupabaseAnonKey="$SUPABASE_ANON_KEY" \
      CertificateArn="$cert_arn" \
    --no-fail-on-empty-changeset
  
  # If certificate was created, show validation instructions
  if [ -z "$cert_arn" ]; then
    log_warning "Certificate validation required!"
    log_info "Check AWS Certificate Manager console for DNS validation records"
    log_info "Add the CNAME records to Cloudflare DNS"
  fi
  
  log_success "Infrastructure deployed"
}

# Build and push Docker image
build_and_push_image() {
  log_header "Building and Pushing Docker Image" >&2
  
  local ecr_repo="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/loppestars"
  local image_tag=$(cd "$SCRIPT_DIR/.." && git rev-parse --short HEAD)
  
  # Check if image already exists
  local image_exists=$($AWS_CLI ecr describe-images \
    --repository-name loppestars \
    --image-ids imageTag="$image_tag" \
    --region "$REGION" 2>/dev/null || echo "NOT_FOUND")
  
  if [[ "$image_exists" != "NOT_FOUND" ]] && [ "$FORCE_DEPLOY" = false ]; then
    log_success "Image already exists: $ecr_repo:$image_tag" >&2
    echo "$ecr_repo:$image_tag"
    return 0
  fi
  
  log_info "Building Docker image with BuildX (cached builds)..." >&2
  
  # Login to ECR
  $AWS_CLI ecr get-login-password --region "$REGION" | \
    docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com" >&2
  
  # Create ECR repository if needed
  $AWS_CLI ecr describe-repositories \
    --repository-names loppestars \
    --region "$REGION" 2>/dev/null >&2 || \
    $AWS_CLI ecr create-repository \
      --repository-name loppestars \
      --region "$REGION" >/dev/null 2>&1
  
  # Ensure BuildX is available and create builder if needed
  if ! docker buildx ls | grep -q loppestars-builder; then
    log_info "Creating BuildX builder instance..."
    docker buildx create --name loppestars-builder --use --bootstrap 2>/dev/null || true
  else
    docker buildx use loppestars-builder 2>/dev/null || true
  fi
  
  # Build image with BuildX and layer caching
  cd "$SCRIPT_DIR/.."
  docker buildx build \
    --platform linux/amd64 \
    --cache-from type=registry,ref="$ecr_repo:buildcache" \
    --cache-to type=registry,ref="$ecr_repo:buildcache",mode=max \
    --build-arg SUPABASE_URL="$SUPABASE_URL" \
    --build-arg SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
    --build-arg SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
    --build-arg SOURCE_BUCKET="stall-photos" \
    --build-arg STORAGE_BUCKET="stall-photos-processed" \
    --build-arg BUILDKIT_INLINE_CACHE=1 \
    -t "$ecr_repo:$image_tag" \
    -t "$ecr_repo:latest" \
    --push \
    -f Dockerfile . >&2
  
  log_success "Image pushed: $ecr_repo:$image_tag" >&2
  echo "$ecr_repo:$image_tag"
}

# Create or update task definition
register_task_definition() {
  log_header "Registering Task Definition" >&2
  
  local image=$1
  local task_exec_role=$(get_stack_output "TaskExecutionRoleArn")
  local task_role=$(get_stack_output "TaskRoleArn")
  local log_group=$(get_stack_output "LogGroupName")
  
  # Escape values properly for JSON
  local escaped_supabase_url=$(echo "$SUPABASE_URL" | sed 's/"/\\\\&/g')
  local escaped_service_role=$(echo "$SUPABASE_SERVICE_ROLE_KEY" | sed 's/"/\\\\&/g')
  local escaped_anon_key=$(echo "$SUPABASE_ANON_KEY" | sed 's/"/\\\\&/g')
  
  cat > /tmp/task-def.json <<EOF
{
  "family": "loppestars",
  "requiresCompatibilities": ["FARGATE"],
  "networkMode": "awsvpc",
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "$task_exec_role",
  "taskRoleArn": "$task_role",
  "containerDefinitions": [
    {
      "name": "web",
      "image": "$image",
      "cpu": 256,
      "memory": 512,
      "essential": true,
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "SUPABASE_URL",
          "value": "$escaped_supabase_url"
        },
        {
          "name": "SUPABASE_SERVICE_ROLE_KEY",
          "value": "$escaped_service_role"
        },
        {
          "name": "SUPABASE_ANON_KEY",
          "value": "$escaped_anon_key"
        },
        {
          "name": "SOURCE_BUCKET",
          "value": "stall-photos"
        },
        {
          "name": "STORAGE_BUCKET",
          "value": "stall-photos-processed"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "$log_group",
          "awslogs-region": "$REGION",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
EOF
  
  local task_def_arn=$($AWS_CLI ecs register-task-definition \
    --cli-input-json file:///tmp/task-def.json \
    --region "$REGION" \
    --query 'taskDefinition.taskDefinitionArn' \
    --output text)
  
  log_success "Task definition: $task_def_arn" >&2
  echo "$task_def_arn"
}

# Create or update ECS service
deploy_service() {
  log_header "Deploying ECS Service" >&2
  
  local task_def_arn=$1
  local target_group=$(get_stack_output "TargetGroupArn")
  local subnets=$(get_stack_output "SubnetIds")
  local security_group=$(get_stack_output "ECSSecurityGroupId")
  
  # Check if service exists
  local service_exists=$($AWS_CLI ecs describe-services \
    --cluster "$CLUSTER_NAME" \
    --services "$SERVICE_NAME" \
    --region "$REGION" \
    --query 'services[0].serviceName' \
    --output text 2>/dev/null || echo "NOT_FOUND")
  
  if [[ "$service_exists" == "NOT_FOUND" ]] || [[ "$service_exists" == "None" ]] || [[ -z "$service_exists" ]]; then
    log_info "Creating ECS service..." >&2
    $AWS_CLI ecs create-service \
      --cluster "$CLUSTER_NAME" \
      --service-name "$SERVICE_NAME" \
      --task-definition "$task_def_arn" \
      --desired-count 1 \
      --launch-type FARGATE \
      --platform-version LATEST \
      --network-configuration "awsvpcConfiguration={subnets=[$subnets],securityGroups=[$security_group],assignPublicIp=ENABLED}" \
      --load-balancers "targetGroupArn=$target_group,containerName=web,containerPort=8080" \
      --health-check-grace-period-seconds 60 \
      --region "$REGION" >/dev/null
    log_success "Service created" >&2
  else
    log_info "Updating ECS service..." >&2
    $AWS_CLI ecs update-service \
      --cluster "$CLUSTER_NAME" \
      --service "$SERVICE_NAME" \
      --task-definition "$task_def_arn" \
      --force-new-deployment \
      --region "$REGION" >/dev/null
    log_success "Service updated" >&2
  fi
  
  log_info "Waiting for service to stabilize..." >&2
  $AWS_CLI ecs wait services-stable \
    --cluster "$CLUSTER_NAME" \
    --services "$SERVICE_NAME" \
    --region "$REGION" || {
      log_error "Service did not stabilize" >&2
      return 1
    }
  
  log_success "Service is stable" >&2
}

# Check API health
check_api_health() {
  log_header "Checking API Health"
  
  local max_retries=10
  local retry_delay=5
  
  for i in $(seq 1 $max_retries); do
    if curl -s -f -m 10 "https://$DOMAIN/health" | grep -q '"status":"healthy"'; then
      log_success "API is healthy"
      return 0
    fi
    log_warning "Health check $i/$max_retries failed, retrying in ${retry_delay}s..."
    sleep $retry_delay
  done
  
  log_error "API health check failed after $max_retries attempts"
  return 1
}

# Update Cloudflare DNS
update_cloudflare_dns() {
  log_header "Checking Cloudflare DNS"
  
  local lb_dns=$(get_stack_output "LoadBalancerDNS")
  
  if [ -z "$lb_dns" ]; then
    log_error "Could not get Load Balancer DNS"
    return 1
  fi
  
  log_info "Load Balancer DNS: $lb_dns"
  
  # Check current DNS
  local current_dns=$(dig +short "$DOMAIN" | tail -1)
  local lb_ip=$(dig +short "$lb_dns" | tail -1)
  
  if [ "$current_dns" == "$lb_ip" ]; then
    log_success "Cloudflare DNS already points to correct load balancer"
    return 0
  fi
  
  log_warning "DNS mismatch detected"
  log_info "Current DNS: $current_dns"
  log_info "Expected (ALB): $lb_ip"
  
  if [ -z "$CF_API_TOKEN" ] || [ -z "$CF_ZONE_ID" ]; then
    log_warning "Cloudflare credentials not found in .env"
    log_info "Manually update DNS CNAME: $DOMAIN -> $lb_dns"
    return 0
  fi
  
  log_info "Updating Cloudflare DNS..."
  
  # Get record ID
  local record_id=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records?name=$DOMAIN" \
    -H "Authorization: Bearer $CF_API_TOKEN" \
    -H "Content-Type: application/json" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  
  if [ -n "$record_id" ]; then
    # Update existing record
    curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records/$record_id" \
      -H "Authorization: Bearer $CF_API_TOKEN" \
      -H "Content-Type: application/json" \
      --data "{\"type\":\"CNAME\",\"name\":\"$DOMAIN\",\"content\":\"$lb_dns\",\"ttl\":1,\"proxied\":true}" >/dev/null
    log_success "DNS record updated"
  else
    # Create new record
    curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records" \
      -H "Authorization: Bearer $CF_API_TOKEN" \
      -H "Content-Type: application/json" \
      --data "{\"type\":\"CNAME\",\"name\":\"$DOMAIN\",\"content\":\"$lb_dns\",\"ttl\":1,\"proxied\":true}" >/dev/null
    log_success "DNS record created"
  fi
}

# Display status
show_status() {
  log_header "Deployment Status"
  
  local stack_status=$(check_stack_exists)
  echo "Stack Status: $stack_status"
  
  if [[ "$stack_status" == "CREATE_COMPLETE" ]] || [[ "$stack_status" == "UPDATE_COMPLETE" ]]; then
    echo "Cluster: $(get_stack_output 'ClusterName')"
    echo "Load Balancer: $(get_stack_output 'LoadBalancerDNS')"
    echo "Log Group: $(get_stack_output 'LogGroupName')"
    
    # Check service
    local service_status=$($AWS_CLI ecs describe-services \
      --cluster "$CLUSTER_NAME" \
      --services "$SERVICE_NAME" \
      --region "$REGION" \
      --query 'services[0].{running:runningCount,desired:desiredCount,status:status}' \
      --output json 2>/dev/null || echo "{}")
    
    echo "Service Status: $service_status"
    
    # Check health
    if check_api_health 2>/dev/null; then
      log_success "API is operational"
    else
      log_warning "API health check failed"
    fi
  fi
}

# Main execution
main() {
  log_header "Loppestars Deployment"
  
  load_env
  
  if [ "$STATUS_ONLY" = true ]; then
    show_status
    exit 0
  fi
  
  # Deploy infrastructure
  deploy_infrastructure
  
  # Build and push image
  local image=$(build_and_push_image)
  
  # Register task definition
  local task_def=$(register_task_definition "$image")
  
  # Deploy service
  deploy_service "$task_def"
  
  # Update DNS
  update_cloudflare_dns
  
  # Final health check
  if check_api_health; then
    log_header "Deployment Complete! 🎉"
    log_success "API: https://$DOMAIN"
    log_success "Health: https://$DOMAIN/health"
  else
    log_header "Deployment Complete with Warnings"
    log_warning "API health check failed - may need a few more minutes"
  fi
}

main "$@"
