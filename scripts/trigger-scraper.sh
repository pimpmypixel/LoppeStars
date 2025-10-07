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
  echo "🕷️  Triggers market data scraper asynchronously (10-30 minute operation)"
  echo ""
  echo "Usage:"
  echo "  $0                    # Trigger via API (default)"
  echo "  $0 --api             # Trigger via API endpoint"
  echo "  $0 --supabase        # Trigger via Supabase Edge Function"
  echo "  $0 --status          # Check scraper status and recent data"
  echo "  $0 --help            # Show this help"
  echo ""
  echo "Environment Variables:"
  echo "  API_BASE_URL         # API endpoint (default: https://loppestars.spoons.dk)"
  echo "  SUPABASE_URL         # Supabase URL (default: https://oprevwbturtujbugynct.supabase.co)"
  echo "  SUPABASE_ANON_KEY    # Required for Supabase method and status checks"
  echo ""
  echo "Examples:"
  echo "  $0                           # Quick API trigger (async)"
  echo "  $0 --api                     # Explicit API trigger"
  echo "  $0 --supabase                # Trigger via Supabase function"
  echo "  $0 --status                  # Check recent scraper activity"
  echo ""
  echo "⏰ Note: Scraping is asynchronous and can take 10-30 minutes"
  echo "📊 Use --status to monitor progress and data freshness"
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
  
  # Trigger the scraper (async operation)
  log_info "Triggering scraper (async operation)..."
  log_warning "⏰ Scraper will run in background and may take 10-30 minutes to complete"
  
  response=$(curl -s -X POST "$API_URL/scraper/trigger" \
    -H "Content-Type: application/json" \
    --max-time 60 \
    -w "HTTPSTATUS:%{http_code}")
  
  # Extract HTTP status code
  http_code=$(echo "$response" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
  response_body=$(echo "$response" | sed -e 's/HTTPSTATUS:.*//g')
  
  if [ "$http_code" = "200" ]; then
    log_success "Scraper triggered successfully!"
    echo ""
    echo "Response:"
    echo "$response_body" | jq . 2>/dev/null || echo "$response_body"
    echo ""
    log_info "🕒 The scraper is now running in the background"
    log_info "📊 Check progress with: ./scripts/trigger-scraper.sh --status"
    log_info "📋 Monitor logs with: aws logs tail /ecs/loppestars --follow --region eu-central-1"
  elif [ "$http_code" = "504" ] || [ "$http_code" = "502" ] || [ "$http_code" = "503" ]; then
    log_warning "Gateway timeout/unavailable (HTTP $http_code) - Scraper likely started"
    echo ""
    log_info "🔄 This is normal for long-running scraper operations"
    log_info "🚀 The scraper process has likely been initiated successfully"
    log_info "⏱️  Scraping can take 10-30 minutes depending on market data volume"
    echo ""
    log_info "Next steps:"
    log_info "1. Wait 5-10 minutes for scraper to start processing"
    log_info "2. Check status: ./scripts/trigger-scraper.sh --status"
    log_info "3. Monitor logs: aws logs tail /ecs/loppestars --follow --region eu-central-1 | grep -i scraper"
    echo ""
    log_success "✅ Scraper trigger completed (running asynchronously)"
  else
    log_error "Scraper trigger failed (HTTP $http_code)"
    echo ""
    echo "Error Response:"
    echo "$response_body" | jq . 2>/dev/null || echo "$response_body"
    
    # Add troubleshooting tips for common errors
    case $http_code in
      500)
        echo ""
        log_info "Troubleshooting tips:"
        log_info "- Internal server error - check API logs"
        log_info "- Monitor logs: aws logs tail /ecs/loppestars --follow --region eu-central-1"
        log_info "- Verify scraper dependencies are available"
        ;;
      401|403)
        echo ""
        log_info "Troubleshooting tips:"
        log_info "- Authentication/authorization issue"
        log_info "- Verify API is accessible without auth"
        ;;
      *)
        echo ""
        log_info "Troubleshooting tips:"
        log_info "- Check API health: curl $API_URL/health"
        log_info "- Check ECS service status: ./scripts/deploy.sh --status"
        log_info "- Try Supabase method: ./scripts/trigger-scraper.sh --supabase"
        ;;
    esac
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
  
  # Trigger the scraper function (async operation)
  log_info "Triggering scraper function (async)..."
  log_warning "⏰ Scraper will run in background and may take 10-30 minutes"
  
  response=$(curl -s -X POST "$SUPABASE_URL/functions/v1/trigger-scraper" \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{}' \
    --max-time 60 \
    -w "HTTPSTATUS:%{http_code}")
  
  # Extract HTTP status code
  http_code=$(echo "$response" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
  response_body=$(echo "$response" | sed -e 's/HTTPSTATUS:.*//g')
  
  if [ "$http_code" = "200" ]; then
    log_success "Scraper triggered successfully via Supabase!"
    echo ""
    echo "Response:"
    echo "$response_body" | jq . 2>/dev/null || echo "$response_body"
    echo ""
    log_info "🕒 The scraper is now running in the background"
    log_info "📊 Check progress with: ./scripts/trigger-scraper.sh --status"
  elif [ "$http_code" = "504" ] || [ "$http_code" = "502" ] || [ "$http_code" = "503" ]; then
    log_warning "Function timeout/unavailable (HTTP $http_code) - Scraper likely started"
    echo ""
    log_info "🔄 This is expected for long-running scraper operations"
    log_info "🚀 The scraper process has likely been initiated via Supabase"
    log_info "⏱️  Allow 10-30 minutes for completion"
    echo ""
    log_success "✅ Scraper trigger completed (running asynchronously)"
  else
    log_error "Scraper trigger failed (HTTP $http_code)"
    echo ""
    echo "Error Response:"
    echo "$response_body" | jq . 2>/dev/null || echo "$response_body"
    
    if [ "$http_code" = "401" ] || [ "$http_code" = "403" ]; then
      echo ""
      log_info "Troubleshooting tips:"
      log_info "- Check SUPABASE_ANON_KEY is valid"
      log_info "- Verify Edge Function permissions"
      log_info "- Try API method: ./scripts/trigger-scraper.sh --api"
    fi
    exit 1
  fi
}

# Check scraper status
check_status() {
  log_header "Checking Scraper Status"
  
  # Check API health first
  log_info "Checking API health..."
  if curl -s -f -m 10 "$API_URL/health" > /dev/null; then
    log_success "API is healthy"
  else
    log_warning "API health check failed"
  fi
  
  # Check recent scraping logs if available
  if [ -n "$SUPABASE_ANON_KEY" ]; then
    log_info "Fetching recent scraping logs..."
    
    # Query scraping_logs table directly
    recent_logs=$(curl -s -X GET "$SUPABASE_URL/rest/v1/scraping_logs?select=*&order=scraped_at.desc&limit=5" \
      -H "apikey: $SUPABASE_ANON_KEY" \
      -H "Authorization: Bearer $SUPABASE_ANON_KEY")
    
    if echo "$recent_logs" | jq -e '. | if type == "array" then length > 0 else . != null end' > /dev/null 2>&1; then
      echo "$recent_logs" | jq -r 'if type == "array" then .[] else . end | "📅 \(.scraped_at) | Status: \(.status // "unknown") | Markets: \(.markets_count // 0)"' 2>/dev/null || echo "$recent_logs"
    else
      log_warning "No recent scraping logs found or could not fetch them"
    fi
  else
    log_warning "SUPABASE_ANON_KEY not available - skipping log check"
  fi
  
  echo ""
  
  # Check market data freshness
  log_info "Checking market data freshness..."
  
  if [ -n "$SUPABASE_ANON_KEY" ]; then
    recent_markets=$(curl -s -X GET "$SUPABASE_URL/rest/v1/markets?select=scraped_at,name&order=scraped_at.desc&limit=3" \
      -H "apikey: $SUPABASE_ANON_KEY" \
      -H "Authorization: Bearer $SUPABASE_ANON_KEY")
    
    if echo "$recent_markets" | jq -e '. | if type == "array" then length > 0 else . != null end' > /dev/null 2>&1; then
      latest_scrape=$(echo "$recent_markets" | jq -r 'if type == "array" then .[0].scraped_at else .scraped_at end')
      market_count=$(echo "$recent_markets" | jq -r 'if type == "array" then length else 1 end')
      log_success "Latest market data: $latest_scrape (showing $market_count recent entries)"
      
      # Show sample of recent markets
      echo "Recent markets:"
      echo "$recent_markets" | jq -r 'if type == "array" then .[] else . end | "  📍 \(.name) (scraped: \(.scraped_at))"' 2>/dev/null
      
      # Calculate time since last scrape
      if command -v date >/dev/null 2>&1; then
        current_time=$(date -u +%s)
        # Try GNU date first, then macOS date
        if command -v gdate >/dev/null 2>&1; then
          scrape_time=$(gdate -d "$latest_scrape" +%s 2>/dev/null || echo "0")
        else
          # macOS date - try to parse ISO format
          scrape_time=$(date -j -f "%Y-%m-%dT%H:%M:%S" "${latest_scrape%.*}" +%s 2>/dev/null || echo "0")
        fi
        if [ "$scrape_time" -gt 0 ]; then
          time_diff=$((current_time - scrape_time))
          hours_ago=$((time_diff / 3600))
          echo ""
          if [ $hours_ago -lt 24 ]; then
            log_success "Data is fresh (scraped $hours_ago hours ago)"
          elif [ $hours_ago -lt 168 ]; then  # 7 days
            log_warning "Data is $((hours_ago / 24)) days old - consider running scraper"
          else
            log_warning "Data is stale (over a week old) - scraper should be run"
          fi
        fi
      fi
    else
      log_warning "No market data found or could not fetch it"
    fi
  else
    log_warning "SUPABASE_ANON_KEY not available - skipping data check"
  fi
  
  echo ""
  log_info "💡 To trigger scraper: ./scripts/trigger-scraper.sh"
  log_info "📋 To monitor logs: aws logs tail /ecs/loppestars --follow --region eu-central-1 | grep -i scraper"
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