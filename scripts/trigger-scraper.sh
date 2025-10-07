#!/bin/bash
#
# Manual Scraper Trigger Script
# =====================================
# Manually trigger the market data scraper via API or Supabase Edge Function
#
# Usage:
#   ./trigger-scraper.sh              # Trigger via API (default)
#   ./trigger-scraper.sh --api        # Trigger via API endpoint
#   ./trigger-scraper.sh --supabase   # Trigger via Supabase Edge Function
#   ./trigger-scraper.sh --help       # Show help
#

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_URL="${API_BASE_URL:-https://loppestars.spoons.dk}"
SUPABASE_URL="${SUPABASE_URL:-https://oprevwbturtujbugynct.supabase.co}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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
    log_error ".env file not found"
    exit 1
  fi
}

# Show help
show_help() {
  echo "Manual Scraper Trigger Script"
  echo ""
  echo "Usage:"
  echo "  $0                    # Trigger via API (default)"
  echo "  $0 --api             # Trigger via API endpoint"
  echo "  $0 --supabase        # Trigger via Supabase Edge Function"
  echo "  $0 --help            # Show this help"
  echo ""
  echo "Environment Variables:"
  echo "  API_BASE_URL         # API endpoint (default: https://loppestars.spoons.dk)"
  echo "  SUPABASE_URL         # Supabase URL (default: https://oprevwbturtujbugynct.supabase.co)"
  echo "  SUPABASE_ANON_KEY    # Required for Supabase method"
  echo ""
  echo "Examples:"
  echo "  $0                           # Quick API trigger"
  echo "  $0 --api                     # Explicit API trigger"
  echo "  $0 --supabase                # Trigger via Supabase function"
  echo ""
}

# Trigger scraper via API endpoint
trigger_via_api() {
  log_header "Triggering Scraper via API"
  
  log_info "API Endpoint: $API_URL/scraper/trigger"
  
  # Check if API is healthy first
  log_info "Checking API health..."
  if ! curl -s -f -m 10 "$API_URL/health" > /dev/null; then
    log_error "API health check failed - API may be down"
    exit 1
  fi
  log_success "API is healthy"
  
  # Trigger the scraper
  log_info "Triggering scraper..."
  
  response=$(curl -s -X POST "$API_URL/scraper/trigger" \
    -H "Content-Type: application/json" \
    -w "HTTPSTATUS:%{http_code}")
  
  # Extract HTTP status code
  http_code=$(echo "$response" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
  response_body=$(echo "$response" | sed -e 's/HTTPSTATUS:.*//g')
  
  if [ "$http_code" = "200" ]; then
    log_success "Scraper triggered successfully!"
    echo ""
    echo "Response:"
    echo "$response_body" | jq . 2>/dev/null || echo "$response_body"
  else
    log_error "Scraper trigger failed (HTTP $http_code)"
    echo ""
    echo "Error Response:"
    echo "$response_body" | jq . 2>/dev/null || echo "$response_body"
    exit 1
  fi
}

# Trigger scraper via Supabase Edge Function
trigger_via_supabase() {
  log_header "Triggering Scraper via Supabase Edge Function"
  
  if [ -z "$SUPABASE_ANON_KEY" ]; then
    log_error "SUPABASE_ANON_KEY not set in environment"
    exit 1
  fi
  
  log_info "Supabase Function: $SUPABASE_URL/functions/v1/trigger-scraper"
  
  # Trigger the scraper function
  log_info "Triggering scraper function..."
  
  response=$(curl -s -X POST "$SUPABASE_URL/functions/v1/trigger-scraper" \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{}' \
    -w "HTTPSTATUS:%{http_code}")
  
  # Extract HTTP status code
  http_code=$(echo "$response" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
  response_body=$(echo "$response" | sed -e 's/HTTPSTATUS:.*//g')
  
  if [ "$http_code" = "200" ]; then
    log_success "Scraper triggered successfully via Supabase!"
    echo ""
    echo "Response:"
    echo "$response_body" | jq . 2>/dev/null || echo "$response_body"
  else
    log_error "Scraper trigger failed (HTTP $http_code)"
    echo ""
    echo "Error Response:"
    echo "$response_body" | jq . 2>/dev/null || echo "$response_body"
    exit 1
  fi
}

# Check scraper status
check_status() {
  log_header "Checking Scraper Status"
  
  # Check recent scraping logs if available
  if [ -n "$SUPABASE_ANON_KEY" ]; then
    log_info "Fetching recent scraping logs..."
    
    # Query recent logs (last 5 entries)
    curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/get_recent_scraping_logs" \
      -H "apikey: $SUPABASE_ANON_KEY" \
      -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
      -H "Content-Type: application/json" \
      -d '{"limit_count": 5}' | jq . 2>/dev/null || log_warning "Could not fetch scraping logs"
  fi
  
  # Check if markets data is recent
  log_info "Checking market data freshness..."
  
  if [ -n "$SUPABASE_ANON_KEY" ]; then
    recent_markets=$(curl -s -X GET "$SUPABASE_URL/rest/v1/markets?select=scraped_at&order=scraped_at.desc&limit=1" \
      -H "apikey: $SUPABASE_ANON_KEY" \
      -H "Authorization: Bearer $SUPABASE_ANON_KEY")
    
    if echo "$recent_markets" | jq -e '.[0].scraped_at' > /dev/null 2>&1; then
      latest_scrape=$(echo "$recent_markets" | jq -r '.[0].scraped_at')
      log_success "Latest market data: $latest_scrape"
    else
      log_warning "Could not determine latest scrape time"
    fi
  fi
}

# Parse arguments
METHOD="api"  # Default method

while [[ $# -gt 0 ]]; do
  case $1 in
    --api)
      METHOD="api"
      shift
      ;;
    --supabase)
      METHOD="supabase"
      shift
      ;;
    --help|-h)
      show_help
      exit 0
      ;;
    --status)
      METHOD="status"
      shift
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
  log_header "Manual Scraper Trigger"
  
  # Load environment variables
  load_env
  
  # Execute based on method
  case $METHOD in
    api)
      trigger_via_api
      ;;
    supabase)
      trigger_via_supabase
      ;;
    status)
      check_status
      ;;
    *)
      log_error "Invalid method: $METHOD"
      exit 1
      ;;
  esac
  
  log_header "Operation Complete! 🎉"
  log_info "You can check the scraping logs in the Supabase dashboard or by running:"
  log_info "./scripts/trigger-scraper.sh --status"
}

main "$@"