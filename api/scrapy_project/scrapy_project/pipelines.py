from supabase import create_client, Client
import os
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class SupabasePipeline:
    def __init__(self):
        self.supabase_url = os.environ.get('SUPABASE_URL')
        self.supabase_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

        if not self.supabase_url or not self.supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required")

        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        
        # Statistics tracking
        self.items_processed = 0
        self.items_success = 0
        self.items_failed = 0
    
    def open_spider(self, spider):
        """Called when spider opens"""
        spider.logger.info(f"Pipeline opened for spider: {spider.name}")
        spider.logger.info(f"Connected to Supabase: {self.supabase_url}")
    
    def close_spider(self, spider):
        """Called when spider closes - log final statistics"""
        spider.logger.info("="*60)
        spider.logger.info("Pipeline Statistics:")
        spider.logger.info(f"  Total items processed: {self.items_processed}")
        spider.logger.info(f"  Successfully saved: {self.items_success}")
        spider.logger.info(f"  Failed: {self.items_failed}")
        if self.items_processed > 0:
            success_rate = (self.items_success / self.items_processed) * 100
            spider.logger.info(f"  Success rate: {success_rate:.1f}%")
        spider.logger.info("="*60)

    def process_item(self, item, spider):
        self.items_processed += 1
        
        try:
            # Convert item to dict first
            market_data = dict(item)
            market_name = market_data.get('name', 'Unknown')
            
            spider.logger.debug(f"Processing item #{self.items_processed}: {market_name}")

            # Build raw metadata entry for this spider
            raw_meta = market_data.copy()
            # Remove fields that match table columns to avoid conflict
            for col in ['start_date','end_date','created_at','updated_at']:
                raw_meta.pop(col, None)

            # Fetch existing metadata JSONB (may not exist for new markets)
            try:
                existing = self.supabase.table('markets')\
                    .select('loppemarkeder_nu')\
                    .eq('external_id', market_data.get('external_id'))\
                    .maybe_single().execute()
                old_meta = {}
                if existing.data and existing.data.get('loppemarkeder_nu'):
                    old_meta = existing.data['loppemarkeder_nu']
            except Exception:
                # Market doesn't exist yet, start fresh
                old_meta = {}

            # Merge new metadata under spider.name key
            merged_meta = old_meta.copy()
            merged_meta[spider.name] = raw_meta
            market_data['loppemarkeder_nu'] = merged_meta

            # Upsert the market data
            result = self.supabase.table('markets').upsert(
                market_data,
                on_conflict='external_id'
            ).execute()

            self.items_success += 1
            spider.logger.info(f"✓ [{self.items_success}/{self.items_processed}] Successfully upserted: {market_name}")

            return item

        except Exception as e:
            self.items_failed += 1
            spider.logger.error(f"✗ [{self.items_failed} failed] Error processing '{market_name}': {str(e)}")
            raise