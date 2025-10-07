#!/usr/bin/env python3
"""
Cron script to run the fleamarket scraper daily
"""
import os
import sys
import subprocess
import logging
import re
from datetime import datetime
import schedule
import time

# Add the scrapy project to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'scrapy_project'))

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/app/scraper.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

def run_scraper():
    """Run the Scrapy spider(s)"""
    try:
        logger.info("="*80)
        logger.info("Starting fleamarket scraper...")
        logger.info(f"Timestamp: {datetime.now().isoformat()}")
        logger.info("="*80)

        # Change to the scrapy project directory
        scrapy_dir = os.path.join(os.path.dirname(__file__), 'scrapy_project')

        # Get list of available spiders
        logger.info("Discovering available spiders...")
        list_proc = subprocess.run(
            ['scrapy', 'list'], cwd=scrapy_dir, capture_output=True, text=True, timeout=60
        )
        if list_proc.returncode != 0:
            logger.error(f"Failed to list spiders: {list_proc.stderr}")
            return
        spiders = [name.strip() for name in list_proc.stdout.splitlines() if name.strip()]

        if not spiders:
            logger.warning("No spiders found to run")
            return
        
        logger.info(f"Found {len(spiders)} spider(s): {', '.join(spiders)}")
        logger.info("")

        # Run each spider with detailed logging
        total_start = time.time()
        for idx, spider in enumerate(spiders, 1):
            logger.info("-"*80)
            logger.info(f"[{idx}/{len(spiders)}] Starting spider: '{spider}'")
            logger.info(f"Spider start time: {datetime.now().strftime('%H:%M:%S')}")
            logger.info("-"*80)
            
            spider_start = time.time()
            result = subprocess.run(
                ['scrapy', 'crawl', spider, '-L', 'INFO'], 
                cwd=scrapy_dir,
                capture_output=True, text=True, timeout=3600
            )
            spider_duration = time.time() - spider_start
            
            # Parse output for statistics
            stats_lines = []
            item_count = 0
            error_count = 0
            
            for line in result.stdout.splitlines():
                # Capture Scrapy stats lines
                if 'item_scraped_count' in line.lower():
                    match = re.search(r'(\d+)', line)
                    if match:
                        item_count = int(match.group(1))
                if 'finish_reason' in line.lower() or 'finish_time' in line.lower() or 'item_count' in line.lower():
                    stats_lines.append(line.strip())
                # Log important messages
                if any(keyword in line.lower() for keyword in ['error', 'warning', 'critical', 'scraped', 'crawled']):
                    logger.info(f"  {line.strip()}")
            
            # Parse stderr for errors
            for line in result.stderr.splitlines():
                if line.strip():
                    error_count += 1
                    logger.warning(f"  STDERR: {line.strip()}")
            
            logger.info("")
            logger.info(f"Spider '{spider}' finished in {spider_duration:.2f} seconds")
            
            if result.returncode == 0:
                logger.info(f"✓ Spider '{spider}' completed successfully")
                logger.info(f"  Items scraped: {item_count}")
                if stats_lines:
                    logger.info("  Statistics:")
                    for stat in stats_lines:
                        logger.info(f"    {stat}")
            else:
                logger.error(f"✗ Spider '{spider}' failed with return code {result.returncode}")
                logger.error(f"  Errors encountered: {error_count}")
                if result.stderr:
                    logger.error("  Error details (last 10 lines):")
                    for line in result.stderr.splitlines()[-10:]:
                        logger.error(f"    {line}")
            
            logger.info("")

        total_duration = time.time() - total_start
        logger.info("="*80)
        logger.info(f"Scraper run completed in {total_duration:.2f} seconds ({total_duration/60:.1f} minutes)")
        logger.info(f"End timestamp: {datetime.now().isoformat()}")
        logger.info("="*80)

    except subprocess.TimeoutExpired:
        logger.error("="*80)
        logger.error("Scraper timed out after 1 hour")
        logger.error("="*80)
    except Exception as e:
        logger.error("="*80)
        logger.error(f"Error running scraper: {str(e)}")
        logger.error("="*80)

def main():
    """Main function to schedule and run the scraper"""
    logger.info("Starting fleamarket scraper cron service")

    # Check environment variables
    required_env_vars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
    missing_vars = [var for var in required_env_vars if not os.environ.get(var)]

    if missing_vars:
        logger.error(f"Missing required environment variables: {missing_vars}")
        sys.exit(1)

    # Schedule the scraper to run daily at 2 AM
    schedule.every().day.at("02:00").do(run_scraper)

    # Also run immediately on startup
    logger.info("Running initial scrape...")
    run_scraper()

    logger.info("Scraper scheduled to run daily at 02:00. Press Ctrl+C to exit.")

    try:
        while True:
            schedule.run_pending()
            time.sleep(60)  # Check every minute
    except KeyboardInterrupt:
        logger.info("Shutting down scraper cron service")
    except Exception as e:
        logger.error(f"Unexpected error in main loop: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()