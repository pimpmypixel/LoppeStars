#!/usr/bin/env python3
"""
Cron script to run the fleamarket scraper daily
"""
import os
import sys
import subprocess
import logging
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
        logger.info("Starting fleamarket scraper...")

        # Change to the scrapy project directory
        scrapy_dir = os.path.join(os.path.dirname(__file__), 'scrapy_project')

        # Get list of available spiders
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

        # Run each spider
        for spider in spiders:
            logger.info(f"Running spider: {spider}")
            result = subprocess.run(
                ['scrapy', 'crawl', spider], cwd=scrapy_dir,
                capture_output=True, text=True, timeout=3600
            )
            if result.returncode == 0:
                logger.info(f"Spider '{spider}' completed successfully")
                logger.info(f"Output: {result.stdout}")
            else:
                logger.error(f"Spider '{spider}' failed with return code {result.returncode}")
                logger.error(f"Error output: {result.stderr}")

    except subprocess.TimeoutExpired:
        logger.error("Scraper timed out after 1 hour")
    except Exception as e:
        logger.error(f"Error running scraper: {str(e)}")

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