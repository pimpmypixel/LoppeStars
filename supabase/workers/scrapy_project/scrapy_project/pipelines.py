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

            # Convert date strings back to date objects for database
            if 'start_date' in market_data and market_data['start_date']:
                market_data['start_date'] = market_data['start_date']
            if 'end_date' in market_data and market_data['end_date']:
                market_data['end_date'] = market_data['end_date']

            # Add scraped timestamp
            market_data['scraped_at'] = datetime.utcnow().isoformat()

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