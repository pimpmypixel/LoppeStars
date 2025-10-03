import scrapy
from scrapy_project.items import MarketItem

class LoppemarkederSpider(scrapy.Spider):
    name = 'loppemarkeder'
    allowed_domains = ['loppemarkeder.nu']
    start_urls = [
        'https://loppemarkeder.nu/wp-json/tribe/events/v1/events?per_page=100'
    ]

    def parse(self, response):
        data = response.json()
        events = data.get('events', [])
        for ev in events:
            item = MarketItem()
            # Basic fields
            item['external_id'] = str(ev.get('id'))
            item['name'] = ev.get('title', {}).get('rendered')
            item['start_date'] = ev.get('start_date', '').split(' ')[0]
            item['end_date'] = ev.get('end_date', '').split(' ')[0]
            # Venue details
            venue = ev.get('venue', {})
            item['address'] = venue.get('address')
            item['city'] = venue.get('city')
            item['municipality'] = venue.get('region')
            item['postal_code'] = venue.get('postal_code')
            # Coordinates
            lat = venue.get('latitude')
            lon = venue.get('longitude')
            item['latitude'] = float(lat) if lat else None
            item['longitude'] = float(lon) if lon else None
            # Description and metadata
            item['description'] = ev.get('description', {}).get('rendered')
            item['category'] = ev.get('category', {}).get('name') if ev.get('category') else 'Loppemarked'
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

            yield item
