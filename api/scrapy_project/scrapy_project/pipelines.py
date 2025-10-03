from supabase import create_client, Client
import os
from datetime import datetime

class SupabasePipeline:
    def __init__(self):
        self.supabase_url = os.environ.get('SUPABASE_URL')
        self.supabase_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

        if not self.supabase_url or not self.supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required")

        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)

    def process_item(self, item, spider):
        try:
            # Convert item to dict
            market_data = dict(item)

            # Add scraped timestamp
            market_data['scraped_at'] = datetime.utcnow().isoformat()

            # Build raw metadata entry for this spider
            raw_meta = market_data.copy()
            # Remove fields that match table columns to avoid conflict
            for col in ['start_date','end_date','scraped_at']:
                raw_meta.pop(col, None)

            # Fetch existing metadata JSONB
            existing = self.supabase.table('markets')\
                .select('loppemarkeder_nu')\
                .eq('external_id', market_data.get('external_id'))\
                .single().execute()
            old_meta = {}
            if existing.data and existing.data.get('loppemarkeder_nu'):
                old_meta = existing.data['loppemarkeder_nu']

            # Merge new metadata under spider.name key
            merged_meta = old_meta.copy()
            merged_meta[spider.name] = raw_meta
            market_data['loppemarkeder_nu'] = merged_meta

            # Upsert the market data
            result = self.supabase.table('markets').upsert(
                market_data,
                on_conflict='external_id'
            ).execute()

            spider.logger.info(f"Successfully upserted market: {market_data.get('name', 'Unknown')}")

            return item

        except Exception as e:
            spider.logger.error(f"Error processing item {item}: {str(e)}")
            raise