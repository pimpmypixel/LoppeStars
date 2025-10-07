import scrapy
from scrapy_project.items import MarketItem

class LoppemarkederSpider(scrapy.Spider):
    name = 'loppemarkeder'
    allowed_domains = ['loppemarkeder.nu']
    start_urls = [
        'https://loppemarkeder.nu/wp-json/tribe/events/v1/events?per_page=100'
    ]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.items_yielded = 0

    def parse(self, response):
        self.logger.info(f"Parsing response from: {response.url}")
        data = response.json()
        events = data.get('events', [])
        self.logger.info(f"Found {len(events)} events in response")
        for ev in events:
            item = MarketItem()
            # Basic fields
            item['external_id'] = str(ev.get('id'))
            
            # Handle title - can be string or dict with 'rendered'
            title = ev.get('title', '')
            item['name'] = title.get('rendered') if isinstance(title, dict) else title
            
            item['start_date'] = ev.get('start_date', '').split(' ')[0]
            item['end_date'] = ev.get('end_date', '').split(' ')[0]
            
            # Venue details - can be dict or list, handle both
            venue = ev.get('venue', {})
            if isinstance(venue, list):
                # If venue is a list, take the first element or use empty dict
                venue = venue[0] if venue else {}
            elif not isinstance(venue, dict):
                # If venue is neither list nor dict (e.g., string), use empty dict
                venue = {}
            
            item['address'] = venue.get('address')
            item['city'] = venue.get('city')
            item['municipality'] = venue.get('region')
            item['postal_code'] = venue.get('postal_code')
            # Coordinates
            lat = venue.get('latitude')
            lon = venue.get('longitude')
            item['latitude'] = float(lat) if lat else None
            item['longitude'] = float(lon) if lon else None
            
            # Handle description - can be string or dict with 'rendered'
            description = ev.get('description', '')
            item['description'] = description.get('rendered') if isinstance(description, dict) else description
            
            # Handle category - can be string or dict with 'name'
            category = ev.get('category')
            if isinstance(category, dict):
                item['category'] = category.get('name', 'Loppemarked')
            else:
                item['category'] = category if category else 'Loppemarked'
            item['source_url'] = ev.get('url')
            # Default feature flags
            item['has_food'] = False
            item['has_parking'] = False
            item['has_toilets'] = False
            item['has_wifi'] = False
            item['is_indoor'] = False
            item['is_outdoor'] = True
            # Raw Modern Tribe JSON
            item['loppemarkeder_nu'] = ev

            self.items_yielded += 1
            self.logger.debug(f"Yielding item #{self.items_yielded}: {item['name']}")
            yield item
        
        self.logger.info(f"Finished parsing. Total items yielded: {self.items_yielded}")
