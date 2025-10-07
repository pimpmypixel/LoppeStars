import scrapy
from scrapy_project.items import MarketItem
from scrapy_project.utils.address_parser import get_address_parser

class LoppemarkederSpider(scrapy.Spider):
    name = 'loppemarkeder'
    allowed_domains = ['loppemarkeder.nu']
    start_urls = [
        'https://loppemarkeder.nu/wp-json/tribe/events/v1/events?per_page=100'
    ]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.items_yielded = 0
        # Initialize address parser
        self.address_parser = get_address_parser()

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
            
            # Get raw address components from API
            raw_address = venue.get('address')
            raw_city = venue.get('city')
            raw_postal = venue.get('postal_code')
            api_lat = venue.get('latitude')
            api_lon = venue.get('longitude')
            
            # Parse and geocode address if we have address info
            parsed_address = None
            if raw_address or raw_city:
                # Build full address string for parsing
                address_parts = []
                if raw_address:
                    address_parts.append(raw_address)
                if raw_postal and raw_city:
                    address_parts.append(f"{raw_postal} {raw_city}")
                elif raw_city:
                    address_parts.append(raw_city)
                
                full_address_str = ", ".join(address_parts)
                
                # Parse and geocode
                try:
                    parsed_address = self.address_parser.parse_and_geocode(full_address_str)
                    self.logger.info(f"Parsed address for '{item['name']}': {parsed_address}")
                except Exception as e:
                    self.logger.warning(f"Address parsing failed for '{item['name']}': {str(e)}")
            
            # Populate address fields (prefer parsed over raw, but use raw as fallback)
            if parsed_address:
                item['address'] = parsed_address.get('full_address') or raw_address
                item['city'] = parsed_address.get('city') or raw_city
                item['postal_code'] = parsed_address.get('postal_code') or raw_postal
                
                # Use parsed coordinates if available, otherwise use API coordinates
                parsed_lat = parsed_address.get('latitude')
                parsed_lon = parsed_address.get('longitude')
                
                if parsed_lat and parsed_lon:
                    item['latitude'] = float(parsed_lat)
                    item['longitude'] = float(parsed_lon)
                    self.logger.info(f"✓ Using parsed coordinates: ({parsed_lat}, {parsed_lon})")
                elif api_lat and api_lon:
                    item['latitude'] = float(api_lat)
                    item['longitude'] = float(api_lon)
                    self.logger.info(f"✓ Using API coordinates: ({api_lat}, {api_lon})")
                else:
                    item['latitude'] = None
                    item['longitude'] = None
                    self.logger.warning(f"✗ No coordinates available for '{item['name']}'")
            else:
                # Use raw venue data as fallback
                item['address'] = raw_address
                item['city'] = raw_city
                item['postal_code'] = raw_postal
                item['latitude'] = float(api_lat) if api_lat else None
                item['longitude'] = float(api_lon) if api_lon else None
            
            item['municipality'] = venue.get('region')
            
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
