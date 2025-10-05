#!/bin/bash
#
# Ultimate Infrastructure Readiness Script for Loppestars
# =========================================================
# This script ensures the AWS CDK infrastructure is properly deployed
# and DNS is configured correctly before allowing GitHub Actions deployments.
#
# What it does:
# 1. Checks if CDK stack exists and is healthy
# 2. Verifies load balancer is operational
# 3. Ensures Cloudflare DNS is pointing to correct load balancer
# 4. Tests API health endpoints
# 5. Extracts and displays CDK-generated resource names for GitHub Actions
#
# Usage:
#   ./ensure-infrastructure.sh              # Full check and deploy if needed
#   ./ensure-infrastructure.sh --status     # Status check only
#   ./ensure-infrastructure.sh --deploy     # Force redeploy
#   ./ensure-infrastructure.sh --export     # Export resource names for GitHub Actions
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME="LoppestarsEcsStack"
AWS_REGION="eu-central-1"
DOMAIN="${ECS_DOMAIN:-loppestars.spoons.dk}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AWS_CLI="/usr/local/bin/aws"

# Parse arguments
MODE="check"
while [[ $# -gt 0 ]]; do
  case $1 in
    --status)
      MODE="status"
      shift
      ;;
    --deploy)
      MODE="deploy"
      shift
      ;;
    --export)
      MODE="export"
      shift
      ;;
    --help)
      echo "Usage: $0 [--status|--deploy|--export|--help]"
      echo ""
      echo "Options:"
      echo "  --status    Check infrastructure status only"
      echo "  --deploy    Force CDK deployment"
      echo "  --export    Export resource names for GitHub Actions"
      echo "  --help      Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Helper functions
print_header() {
  echo ""
  echo -e "${CYAN}============================================================${NC}"
  echo -e "${CYAN}$1${NC}"
  echo -e "${CYAN}============================================================${NC}"
  echo ""
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if required tools are installed
check_prerequisites() {
  print_header "Checking Prerequisites"
  
  local missing=0
  
  # Check for AWS CLI in common locations
  if command -v aws &> /dev/null; then
    AWS_CLI="aws"
    print_success "AWS CLI installed: $(aws --version 2>&1 | head -1)"
  elif [ -f "/usr/local/bin/aws" ]; then
    AWS_CLI="/usr/local/bin/aws"
    print_success "AWS CLI installed: $($AWS_CLI --version 2>&1 | head -1)"
  else
    print_error "AWS CLI not found"
    missing=1
  fi
  
  if ! command -v node &> /dev/null; then
    print_error "Node.js not found"
    missing=1
  else
    print_success "Node.js installed: $(node --version)"
  fi
  
  if ! command -v npx &> /dev/null; then
    print_error "NPX not found"
    missing=1
  else
    print_success "NPX available"
  fi
  
  if ! command -v curl &> /dev/null; then
    print_error "curl not found"
    missing=1
  else
    print_success "curl installed"
  fi
  
  if ! command -v jq &> /dev/null; then
    print_warning "jq not found (recommended for JSON parsing)"
  else
    print_success "jq installed: $(jq --version)"
  fi
  
  # Check .env file exists
  if [ -f "$SCRIPT_DIR/../.env" ]; then
    print_success ".env file found"
    # Load environment variables
    source "$SCRIPT_DIR/../.env"
  else
    print_error ".env file not found in parent directory"
    missing=1
  fi
  
  if [ $missing -eq 1 ]; then
    print_error "Missing required prerequisites. Please install them first."
    exit 1
  fi
}

# Check CloudFormation stack status
check_stack_status() {
  print_header "Checking CloudFormation Stack"
  
  local status=$($AWS_CLI cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$AWS_REGION" \
    --query 'Stacks[0].StackStatus' \
    --output text 2>&1 || echo "NOT_FOUND")
  
  if [[ "$status" == *"does not exist"* ]] || [[ "$status" == "NOT_FOUND" ]]; then
    print_warning "Stack $STACK_NAME does not exist"
    return 1
  elif [[ "$status" == "CREATE_COMPLETE" ]] || [[ "$status" == "UPDATE_COMPLETE" ]]; then
    print_success "Stack status: $status"
    return 0
  elif [[ "$status" == *"IN_PROGRESS"* ]]; then
    print_info "Stack status: $status (deployment in progress)"
    return 2
  else
    print_error "Stack status: $status"
    return 1
  fi
}

# Get stack outputs
get_stack_outputs() {
  print_header "Retrieving Stack Outputs"
  
  local outputs=$($AWS_CLI cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$AWS_REGION" \
    --query 'Stacks[0].Outputs' \
    --output json 2>&1 || echo "[]")
  
  if [ "$outputs" == "[]" ]; then
    print_warning "No stack outputs found"
    return 1
  fi
  
  echo "$outputs" | jq -r '.[] | "\(.OutputKey): \(.OutputValue)"' | while read -r line; do
    print_info "$line"
  done
  
  # Extract Load Balancer DNS
  local lb_dns=$(echo "$outputs" | jq -r '.[] | select(.OutputKey | contains("LoadBalancerDNS")) | .OutputValue' 2>/dev/null || echo "")
  
  if [ -n "$lb_dns" ]; then
    print_success "Load Balancer DNS: $lb_dns"
    echo "$lb_dns" > /tmp/loppestars_lb_dns.txt
  else
    print_warning "Load Balancer DNS not found in outputs"
  fi
  
  return 0
}

# Get CDK-generated resource names
get_resource_names() {
  print_header "Extracting CDK Resource Names"
  
  # Get task definition family
  local task_def=$($AWS_CLI ecs list-task-definitions \
    --family-prefix "${STACK_NAME}Service" \
    --region "$AWS_REGION" \
    --query 'taskDefinitionArns[0]' \
    --output text 2>/dev/null || echo "")
  
  if [ -n "$task_def" ] && [ "$task_def" != "None" ]; then
    print_success "Task Definition: $task_def"
    
    # Get detailed task definition info
    local task_info=$($AWS_CLI ecs describe-task-definition \
      --task-definition "$task_def" \
      --region "$AWS_REGION" \
      --query 'taskDefinition.{executionRoleArn:executionRoleArn,taskRoleArn:taskRoleArn,logGroup:containerDefinitions[0].logConfiguration.options."awslogs-group",logPrefix:containerDefinitions[0].logConfiguration.options."awslogs-stream-prefix"}' \
      --output json 2>/dev/null || echo "{}")
    
    local exec_role=$(echo "$task_info" | jq -r '.executionRoleArn // empty')
    local task_role=$(echo "$task_info" | jq -r '.taskRoleArn // empty')
    local log_group=$(echo "$task_info" | jq -r '.logGroup // empty')
    local log_prefix=$(echo "$task_info" | jq -r '.logPrefix // empty')
    
    if [ -n "$exec_role" ]; then
      print_success "Execution Role: $exec_role"
    fi
    if [ -n "$task_role" ]; then
      print_success "Task Role: $task_role"
    fi
    if [ -n "$log_group" ]; then
      print_success "CloudWatch Log Group: $log_group"
    fi
    if [ -n "$log_prefix" ]; then
      print_success "CloudWatch Log Prefix: $log_prefix"
    fi
    
    # Save to file for GitHub Actions
    cat > /tmp/loppestars_resources.json <<EOF
{
  "executionRoleArn": "$exec_role",
  "taskRoleArn": "$task_role",
  "logGroup": "$log_group",
  "logPrefix": "$log_prefix",
  "taskDefinitionFamily": "$(echo $task_def | awk -F/ '{print $NF}' | cut -d: -f1)"
}
EOF
    print_success "Resource names saved to /tmp/loppestars_resources.json"
  else
    print_warning "No task definitions found"
    return 1
  fi
  
  # Get cluster and service names
  local cluster=$($AWS_CLI ecs list-clusters \
    --region "$AWS_REGION" \
    --query "clusterArns[?contains(@, '$STACK_NAME')] | [0]" \
    --output text 2>/dev/null || echo "")
  
  if [ -n "$cluster" ] && [ "$cluster" != "None" ]; then
    local cluster_name=$(echo "$cluster" | awk -F/ '{print $NF}')
    print_success "Cluster: $cluster_name"
    
    local service=$($AWS_CLI ecs list-services \
      --cluster "$cluster_name" \
      --region "$AWS_REGION" \
      --query 'serviceArns[0]' \
      --output text 2>/dev/null || echo "")
    
    if [ -n "$service" ] && [ "$service" != "None" ]; then
      local service_name=$(echo "$service" | awk -F/ '{print $NF}')
      print_success "Service: $service_name"
      
      # Add to resources file
      jq ". + {\"clusterName\": \"$cluster_name\", \"serviceName\": \"$service_name\"}" \
        /tmp/loppestars_resources.json > /tmp/loppestars_resources_tmp.json
      mv /tmp/loppestars_resources_tmp.json /tmp/loppestars_resources.json
    fi
  fi
  
  return 0
}

# Check load balancer health
check_load_balancer() {
  print_header "Checking Load Balancer Health"
  
  local lb_arn=$($AWS_CLI elbv2 describe-load-balancers \
    --region "$AWS_REGION" \
    --query "LoadBalancers[?contains(LoadBalancerName, 'Loppe') || contains(LoadBalancerName, 'Service')].LoadBalancerArn | [0]" \
    --output text 2>/dev/null || echo "")
  
  if [ -z "$lb_arn" ] || [ "$lb_arn" == "None" ]; then
    print_warning "Load balancer not found"
    return 1
  fi
  
  local lb_state=$($AWS_CLI elbv2 describe-load-balancers \
    --load-balancer-arns "$lb_arn" \
    --region "$AWS_REGION" \
    --query 'LoadBalancers[0].State.Code' \
    --output text 2>/dev/null || echo "")
  
  if [ "$lb_state" == "active" ]; then
    print_success "Load Balancer state: $lb_state"
  else
    print_warning "Load Balancer state: $lb_state"
    return 1
  fi
  
  # Check target health
  local target_groups=$($AWS_CLI elbv2 describe-target-groups \
    --load-balancer-arn "$lb_arn" \
    --region "$AWS_REGION" \
    --query 'TargetGroups[*].TargetGroupArn' \
    --output text 2>/dev/null || echo "")
  
  if [ -n "$target_groups" ]; then
    for tg in $target_groups; do
      local health=$($AWS_CLI elbv2 describe-target-health \
        --target-group-arn "$tg" \
        --region "$AWS_REGION" \
        --query 'TargetHealthDescriptions[0].TargetHealth.State' \
        --output text 2>/dev/null || echo "unknown")
      
      if [ "$health" == "healthy" ]; then
        print_success "Target health: $health"
      elif [ "$health" == "initial" ] || [ "$health" == "draining" ]; then
        print_info "Target health: $health (transitioning)"
      else
        print_warning "Target health: $health"
      fi
    done
  fi
  
  return 0
}

# Check Cloudflare DNS
check_cloudflare_dns() {
  print_header "Checking Cloudflare DNS Configuration"
  
  if [ -z "$CF_API_TOKEN" ]; then
    print_warning "CF_API_TOKEN not set, skipping DNS check"
    return 1
  fi
  
  print_info "Using deploy-and-dns.js for DNS verification..."
  
  cd "$SCRIPT_DIR"
  
  # Ensure node_modules are installed
  if [ ! -d "node_modules" ]; then
    print_info "Installing Node.js dependencies..."
    npm install --silent
  fi
  
  # Run the DNS check via deploy-and-dns.js in status mode
  if node deploy-and-dns.js --status 2>&1 | grep -q "Health check: OK"; then
    print_success "Cloudflare DNS is correctly configured"
    return 0
  else
    print_warning "DNS or health check issues detected"
    return 1
  fi
}

# Test API endpoints
test_api_endpoints() {
  print_header "Testing API Endpoints"
  
  print_info "Testing health endpoint..."
  if curl -s -f -m 10 "https://${DOMAIN}/health" > /dev/null 2>&1; then
    local response=$(curl -s -m 10 "https://${DOMAIN}/health")
    if echo "$response" | grep -q '"status":"healthy"'; then
      print_success "Health endpoint: OK"
    else
      print_warning "Health endpoint returned unexpected response"
      echo "$response"
    fi
  else
    print_error "Health endpoint: FAILED"
    return 1
  fi
  
  print_info "Testing root endpoint..."
  if curl -s -f -m 10 "https://${DOMAIN}/" > /dev/null 2>&1; then
    print_success "Root endpoint: OK"
  else
    print_warning "Root endpoint: FAILED"
  fi
  
  print_info "Testing markets endpoint..."
  if curl -s -f -m 10 "https://${DOMAIN}/markets/today" > /dev/null 2>&1; then
    print_success "Markets endpoint: OK"
  else
    print_warning "Markets endpoint: FAILED (may be expected if no markets today)"
  fi
  
  return 0
}

# Deploy using deploy-and-dns.js
deploy_infrastructure() {
  print_header "Deploying Infrastructure"
  
  cd "$SCRIPT_DIR"
  
  # Ensure node_modules are installed
  if [ ! -d "node_modules" ]; then
    print_info "Installing Node.js dependencies..."
    npm install
  fi
  
  print_info "Running deploy-and-dns.js..."
  node deploy-and-dns.js
  
  return $?
}

# Export resource names for GitHub Actions
export_resource_names() {
  print_header "Exporting Resource Names for GitHub Actions"
  
  if [ ! -f /tmp/loppestars_resources.json ]; then
    print_warning "Resource file not found. Running resource extraction..."
    get_resource_names
  fi
  
  if [ -f /tmp/loppestars_resources.json ]; then
    echo ""
    print_success "GitHub Actions Environment Variables:"
    echo ""
    echo -e "${GREEN}# Add these to your GitHub Secrets or workflow:${NC}"
    echo ""
    
    local exec_role=$(jq -r '.executionRoleArn // empty' /tmp/loppestars_resources.json)
    local task_role=$(jq -r '.taskRoleArn // empty' /tmp/loppestars_resources.json)
    local log_group=$(jq -r '.logGroup // empty' /tmp/loppestars_resources.json)
    local log_prefix=$(jq -r '.logPrefix // empty' /tmp/loppestars_resources.json)
    
    if [ -n "$exec_role" ]; then
      echo "EXECUTION_ROLE_ARN=\"$exec_role\""
    fi
    if [ -n "$task_role" ]; then
      echo "TASK_ROLE_ARN=\"$task_role\""
    fi
    if [ -n "$log_group" ]; then
      echo "LOG_GROUP=\"$log_group\""
    fi
    if [ -n "$log_prefix" ]; then
      echo "LOG_PREFIX=\"$log_prefix\""
    fi
    
    echo ""
    print_info "Update your GitHub Actions workflow with these values"
    print_info "Or use them from the JSON file: /tmp/loppestars_resources.json"
    echo ""
    
    cat /tmp/loppestars_resources.json | jq '.'
  else
    print_error "Could not export resource names"
    return 1
  fi
}

# Generate GitHub Actions workflow snippet
generate_workflow_snippet() {
  print_header "GitHub Actions Workflow Snippet"
  
  if [ ! -f /tmp/loppestars_resources.json ]; then
    print_error "Resource file not found"
    return 1
  fi
  
  local exec_role=$(jq -r '.executionRoleArn // empty' /tmp/loppestars_resources.json)
  local task_role=$(jq -r '.taskRoleArn // empty' /tmp/loppestars_resources.json)
  local log_group=$(jq -r '.logGroup // empty' /tmp/loppestars_resources.json)
  local log_prefix=$(jq -r '.logPrefix // empty' /tmp/loppestars_resources.json)
  
  cat > /tmp/loppestars_workflow_snippet.yml <<EOF
# Task Definition snippet for GitHub Actions
# Copy this to your .github/workflows/deploy-ecs.yml

"executionRoleArn": "$exec_role",
"taskRoleArn": "$task_role",

# Log Configuration:
"logConfiguration": {
  "logDriver": "awslogs",
  "options": {
    "awslogs-group": "$log_group",
    "awslogs-region": "\${AWS_REGION}",
    "awslogs-stream-prefix": "$log_prefix"
  }
}
EOF
  
  print_success "Workflow snippet saved to /tmp/loppestars_workflow_snippet.yml"
  cat /tmp/loppestars_workflow_snippet.yml
  echo ""
}

# Main execution
main() {
  print_header "Loppestars Infrastructure Readiness Check"
  
  check_prerequisites
  
  case $MODE in
    status)
      check_stack_status
      local stack_status=$?
      
      if [ $stack_status -eq 0 ]; then
        get_stack_outputs
        get_resource_names
        check_load_balancer
        check_cloudflare_dns
        test_api_endpoints
        
        print_header "Status Summary"
        print_success "Infrastructure is deployed and operational"
        print_info "Ready for GitHub Actions deployments"
      else
        print_header "Status Summary"
        print_warning "Infrastructure needs deployment"
        print_info "Run: ./ensure-infrastructure.sh --deploy"
      fi
      ;;
      
    deploy)
      check_stack_status
      local stack_status=$?
      
      if [ $stack_status -eq 0 ]; then
        print_warning "Stack already exists. This will update it."
        read -p "Continue? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
          print_info "Deployment cancelled"
          exit 0
        fi
      fi
      
      deploy_infrastructure
      
      if [ $? -eq 0 ]; then
        print_success "Deployment completed successfully"
        get_resource_names
        export_resource_names
        generate_workflow_snippet
      else
        print_error "Deployment failed"
        exit 1
      fi
      ;;
      
    export)
      check_stack_status
      if [ $? -eq 0 ]; then
        get_resource_names
        export_resource_names
        generate_workflow_snippet
      else
        print_error "Stack does not exist. Deploy first."
        exit 1
      fi
      ;;
      
    check)
      check_stack_status
      local stack_status=$?
      
      if [ $stack_status -eq 0 ]; then
        print_success "Stack exists and is healthy"
        get_stack_outputs
        get_resource_names
        check_load_balancer
        test_api_endpoints
        check_cloudflare_dns
        
        print_header "Final Summary"
        print_success "✅ Infrastructure is ready for GitHub Actions deployments"
        echo ""
        print_info "To export resource names for GitHub Actions:"
        echo "  ./ensure-infrastructure.sh --export"
        echo ""
        print_info "To update infrastructure:"
        echo "  ./ensure-infrastructure.sh --deploy"
      else
        print_warning "Stack does not exist or is not ready"
        echo ""
        print_info "To deploy infrastructure:"
        echo "  ./ensure-infrastructure.sh --deploy"
      fi
      ;;
  esac
}

# Run main function
main
