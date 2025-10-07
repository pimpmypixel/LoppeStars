#!/bin/bash
#
# CloudWatch ECS Logs Tailing Script
# =====================================
# Tail CloudWatch logs for ECS Fargate tasks with filtering and monitoring
#
# Usage:
#   ./tail-logs.sh                    # Tail all logs (default)
#   ./tail-logs.sh --scraper          # Filter for scraper activity
#   ./tail-logs.sh --api              # Filter for API requests
#   ./tail-logs.sh --errors           # Filter for errors only
#   ./tail-logs.sh --since 1h         # Logs from last hour
#   ./tail-logs.sh --follow           # Follow mode (real-time)
#   ./tail-logs.sh --help             # Show help
#

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AWS_REGION="${AWS_REGION:-eu-central-1}"
LOG_GROUP="${LOG_GROUP:-/ecs/loppestars}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

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
    log_warning ".env file not found - using defaults"
  fi
}

# Show help
show_help() {
  echo "CloudWatch ECS Logs Tailing Script"
  echo ""
  echo "📋 Tail and filter CloudWatch logs for ECS Fargate tasks"
  echo ""
  echo "Usage:"
  echo "  $0                           # Tail all logs (last 10 minutes)"
  echo "  $0 --follow                  # Follow mode (real-time streaming)"
  echo "  $0 --scraper                 # Filter for scraper activity"
  echo "  $0 --api                     # Filter for API requests"
  echo "  $0 --errors                  # Filter for errors only"
  echo "  $0 --since <time>            # Time range (1h, 30m, 1d, etc.)"
  echo "  $0 --filter <pattern>        # Custom filter pattern"
  echo "  $0 --raw                     # Raw output (no formatting)"
  echo "  $0 --help                    # Show this help"
  echo ""
  echo "Environment Variables:"
  echo "  AWS_REGION                   # AWS region (default: eu-central-1)"
  echo "  LOG_GROUP                    # CloudWatch log group (default: /ecs/loppestars)"
  echo ""
  echo "Examples:"
  echo "  $0 --follow --scraper        # Real-time scraper logs"
  echo "  $0 --since 1h --errors       # Errors from last hour"
  echo "  $0 --api --since 30m         # API requests from last 30 minutes"
  echo "  $0 --filter 'POST /process'  # Custom filter for image processing"
  echo ""
  echo "⏰ Common time formats: 1h, 30m, 1d, 2h30m"
  echo "🔍 Log patterns are case-insensitive"
  echo ""
}

# Convert time format to milliseconds
time_to_ms() {
  local time_str="$1"
  local current_time=$(date +%s)
  local seconds=0
  
  # Parse time string (1h, 30m, 1d, etc.)
  if [[ "$time_str" =~ ^([0-9]+)d$ ]]; then
    seconds=$((${BASH_REMATCH[1]} * 86400))
  elif [[ "$time_str" =~ ^([0-9]+)h$ ]]; then
    seconds=$((${BASH_REMATCH[1]} * 3600))
  elif [[ "$time_str" =~ ^([0-9]+)m$ ]]; then
    seconds=$((${BASH_REMATCH[1]} * 60))
  elif [[ "$time_str" =~ ^([0-9]+)h([0-9]+)m$ ]]; then
    seconds=$((${BASH_REMATCH[1]} * 3600 + ${BASH_REMATCH[2]} * 60))
  elif [[ "$time_str" =~ ^([0-9]+)$ ]]; then
    seconds=$1  # Assume seconds if just a number
  else
    log_error "Invalid time format: $time_str (use: 1h, 30m, 1d, etc.)"
    exit 1
  fi
  
  local start_time=$((current_time - seconds))
  echo $((start_time * 1000))  # Convert to milliseconds
}

# Format log output with colors
format_log_line() {
  local line="$1"
  local raw_mode="$2"
  
  if [ "$raw_mode" = "true" ]; then
    echo "$line"
    return
  fi
  
  # Extract timestamp and message
  local timestamp=$(echo "$line" | grep -o '^[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}T[0-9]\{2\}:[0-9]\{2\}:[0-9]\{2\}\.[0-9]\{3\}Z' || echo "")
  local message=$(echo "$line" | sed 's/^[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}T[0-9]\{2\}:[0-9]\{2\}:[0-9]\{2\}\.[0-9]\{3\}Z//' | sed 's/^[[:space:]]*//')
  
  # Color coding based on content
  if echo "$message" | grep -qi "error\|exception\|failed\|traceback"; then
    echo -e "${RED}$timestamp${NC} ${RED}$message${NC}"
  elif echo "$message" | grep -qi "warning\|warn"; then
    echo -e "${YELLOW}$timestamp${NC} ${YELLOW}$message${NC}"
  elif echo "$message" | grep -qi "scraper\|spider\|crawl"; then
    echo -e "${PURPLE}$timestamp${NC} ${PURPLE}$message${NC}"
  elif echo "$message" | grep -qi "POST\|GET\|PUT\|DELETE"; then
    echo -e "${GREEN}$timestamp${NC} ${GREEN}$message${NC}"
  elif echo "$message" | grep -qi "success\|completed\|finished"; then
    echo -e "${GREEN}$timestamp${NC} ${GREEN}$message${NC}"
  else
    echo -e "${BLUE}$timestamp${NC} $message"
  fi
}

# Tail logs with filtering
tail_logs() {
  local follow_mode="$1"
  local filter_pattern="$2"
  local since_time="$3"
  local raw_mode="$4"
  
  log_header "Tailing CloudWatch Logs"
  
  # Check if log group exists
  log_info "Checking log group: $LOG_GROUP"
  if ! aws logs describe-log-groups \
    --log-group-name-prefix "$LOG_GROUP" \
    --region "$AWS_REGION" \
    --query 'logGroups[0].logGroupName' \
    --output text | grep -q "$LOG_GROUP"; then
    log_error "Log group not found: $LOG_GROUP"
    log_info "Available log groups:"
    aws logs describe-log-groups \
      --region "$AWS_REGION" \
      --query 'logGroups[].logGroupName' \
      --output table | cat
    exit 1
  fi
  
  log_success "Log group found: $LOG_GROUP"
  
  # Check if there are any log streams (indicates ECS service activity)
  local stream_count=$(aws logs describe-log-streams \
    --log-group-name "$LOG_GROUP" \
    --region "$AWS_REGION" \
    --query 'length(logStreams)' \
    --output text)
  
  if [ "$stream_count" = "0" ]; then
    log_warning "No log streams found - ECS service may not be running"
    log_info "Check ECS service status:"
    log_info "  aws ecs list-services --cluster LoppestarsEcsStack-ClusterEB0386A7-3Mzih57cTorn --region eu-central-1"
    log_info "Deploy if needed:"
    log_info "  ./scripts/deploy.sh"
    echo ""
  else
    log_success "$stream_count log streams found"
  fi
  
  # Build AWS CLI command
  local aws_cmd=""
  
  if [ "$follow_mode" = "true" ]; then
    aws_cmd="aws logs tail $LOG_GROUP --region $AWS_REGION"
    log_info "📡 Starting real-time log streaming..."
  else
    aws_cmd="aws logs filter-log-events --log-group-name $LOG_GROUP --region $AWS_REGION"
    log_info "📋 Fetching historical logs..."
  fi
  
  # Add time filter
  if [ -n "$since_time" ]; then
    if [ "$follow_mode" = "true" ]; then
      aws_cmd="$aws_cmd --since $since_time"
    else
      local start_time_ms=$(time_to_ms "$since_time")
      aws_cmd="$aws_cmd --start-time $start_time_ms"
    fi
    log_info "⏰ Time filter: last $since_time"
  elif [ "$follow_mode" != "true" ]; then
    # Default to last 10 minutes for historical logs
    local default_start=$(time_to_ms "10m")
    aws_cmd="$aws_cmd --start-time $default_start"
    log_info "⏰ Default time filter: last 10 minutes"
  fi
  
  # Add pattern filter
  if [ -n "$filter_pattern" ]; then
    aws_cmd="$aws_cmd --filter-pattern '$filter_pattern'"
    log_info "🔍 Filter pattern: $filter_pattern"
  fi
  
  # Add follow flag
  if [ "$follow_mode" = "true" ]; then
    aws_cmd="$aws_cmd --follow"
  fi
  
  echo ""
  log_info "Command: $aws_cmd"
  echo ""
  
  # Execute command with formatting
  if [ "$follow_mode" = "true" ]; then
    # For follow mode, pipe through formatting
    eval "$aws_cmd" | while IFS= read -r line; do
      format_log_line "$line" "$raw_mode"
    done
  else
    # For historical logs, format the output
    if [ "$raw_mode" = "true" ]; then
      eval "$aws_cmd --output text --query 'events[].message'" | cat
    else
      # Use a different approach to avoid head -n -1 compatibility issues
      local temp_output=$(eval "$aws_cmd --output table --query 'events[].[timestamp,message]'")
      local line_count=$(echo "$temp_output" | wc -l | xargs)
      
      if [ "$line_count" -gt 3 ]; then
        echo "$temp_output" | tail -n +3 | sed '$d' | while IFS= read -r line; do
          # Parse table format and reformat
          local timestamp_ms=$(echo "$line" | awk '{print $2}' | sed 's/|//g' | xargs)
          local message=$(echo "$line" | cut -d'|' -f3- | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')
          
          if [ -n "$timestamp_ms" ] && [ "$timestamp_ms" != "None" ]; then
            # Convert timestamp from milliseconds to ISO format (macOS compatible)
            local timestamp_iso
            if command -v gdate >/dev/null 2>&1; then
              # Use GNU date if available (brew install coreutils)
              timestamp_iso=$(gdate -d "@$((timestamp_ms / 1000))" -u +"%Y-%m-%dT%H:%M:%S.%3NZ" 2>/dev/null || echo "$timestamp_ms")
            else
              # Use macOS date
              timestamp_iso=$(date -u -r "$((timestamp_ms / 1000))" +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || echo "$timestamp_ms")
            fi
            format_log_line "$timestamp_iso $message" "$raw_mode"
          fi
        done
      else
        log_warning "No log events found in the specified time range"
      fi
    fi
  fi
}

# Parse arguments
FOLLOW_MODE="false"
FILTER_PATTERN=""
SINCE_TIME=""
RAW_MODE="false"

while [[ $# -gt 0 ]]; do
  case $1 in
    --follow|-f)
      FOLLOW_MODE="true"
      shift
      ;;
    --scraper)
      FILTER_PATTERN="scraper spider crawl scrapy"
      shift
      ;;
    --api)
      FILTER_PATTERN="POST GET PUT DELETE /health /process /markets"
      shift
      ;;
    --errors)
      FILTER_PATTERN="ERROR error Exception exception failed Failed traceback Traceback"
      shift
      ;;
    --since)
      SINCE_TIME="$2"
      shift 2
      ;;
    --filter)
      FILTER_PATTERN="$2"
      shift 2
      ;;
    --raw)
      RAW_MODE="true"
      shift
      ;;
    --help|-h)
      show_help
      exit 0
      ;;
    *)
      log_error "Unknown option: $1"
      show_help
      exit 1
      ;;
  esac
done

# Main execution
main() {
  log_header "CloudWatch ECS Logs Monitor"
  
  # Load environment variables
  load_env
  
  # Check AWS CLI is available
  if ! command -v aws >/dev/null 2>&1; then
    log_error "AWS CLI not found. Please install AWS CLI."
    exit 1
  fi
  
  # Check AWS credentials
  if ! aws sts get-caller-identity >/dev/null 2>&1; then
    log_error "AWS credentials not configured or invalid."
    log_info "Run: aws configure"
    exit 1
  fi
  
  log_success "AWS CLI configured"
  
  # Start tailing logs
  tail_logs "$FOLLOW_MODE" "$FILTER_PATTERN" "$SINCE_TIME" "$RAW_MODE"
}

# Handle Ctrl+C gracefully
trap 'echo -e "\n\n${YELLOW}📡 Log monitoring stopped${NC}"; exit 0' INT

main "$@"