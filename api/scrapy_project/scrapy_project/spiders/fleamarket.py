import scrapy
from datetime import datetime
from dateutil import parser
import re
import requests
import time
import random
from scrapy_project.utils.address_parser import get_address_parser

class FleamarketItem(scrapy.Item):
    external_id = scrapy.Field()
    name = scrapy.Field()
    municipality = scrapy.Field()
    category = scrapy.Field()
    start_date = scrapy.Field()
    end_date = scrapy.Field()
    address = scrapy.Field()
    city = scrapy.Field()
    postal_code = scrapy.Field()
    latitude = scrapy.Field()
    longitude = scrapy.Field()
    description = scrapy.Field()
    organizer_name = scrapy.Field()
    organizer_phone = scrapy.Field()
    organizer_email = scrapy.Field()
    organizer_website = scrapy.Field()
    opening_hours = scrapy.Field()
    entry_fee = scrapy.Field()
    stall_count = scrapy.Field()
    has_food = scrapy.Field()
    has_parking = scrapy.Field()
    has_toilets = scrapy.Field()
    has_wifi = scrapy.Field()
    is_indoor = scrapy.Field()
    is_outdoor = scrapy.Field()
    special_features = scrapy.Field()
    source_url = scrapy.Field()

class FleamarketSpider(scrapy.Spider):
    name = 'fleamarket'
    allowed_domains = ['markedskalenderen.dk']
    start_urls = ['https://markedskalenderen.dk/marked/kategori/loppemarked']

    # Limit to 10 markets for testing
    max_markets = 10
    markets_scraped = 0
    items_yielded = 0
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.logger.info(f"Initializing {self.name} spider (max_markets={self.max_markets})")
        # Initialize address parser
        self.address_parser = get_address_parser()

    # Random user agents for requests
    user_agents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.101 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/91.0.864.59',
    ]

    def parse(self, response):
        self.logger.info(f"Parsing market listing page: {response.url}")
        # Extract market listings from the page
        markets = response.css('table tr')
        self.logger.info(f"Found {len(markets)} table rows to process")

        for market in markets:
            # Skip header rows
            if not market.css('td'):
                continue

            tds = market.css('td')
            if len(tds) < 4:
                continue

            # Extract market name and link - try multiple selectors
            name_elem = tds[0].css('a::text').get() or tds[0].css('strong::text').get() or tds[0].css('td::text').get()
            if not name_elem:
                continue

            name = name_elem.strip()
            
            # Try multiple ways to find the market link
            market_link = tds[0].css('a::attr(href)').get()
            if not market_link:
                # Try to find any link in the cell
                market_link = tds[0].css('a::attr(href)').getall()
                market_link = market_link[0] if market_link else None

            # Extract municipality and category
            municipality_category = tds[1].css('::text').get()
            if municipality_category:
                # Usually format: "Municipality Category"
                parts = municipality_category.strip().split()
                municipality = ' '.join(parts[:-1]) if len(parts) > 1 else municipality_category
                category = parts[-1] if len(parts) > 1 else 'Loppemarked'
            else:
                municipality = None
                category = 'Loppemarked'

            # Extract dates - dates are in the 6th column (index 5)
            date_text = tds[5].css('::text').get() if len(tds) > 5 else None
            start_date = None
            end_date = None

            if date_text:
                date_text = date_text.strip()
                # Handle formats like "04-10-2025<br>05-10-2025" or "05-10-2025<br>05-10-2025"
                # Split by <br> or newlines
                date_lines = date_text.replace('<br>', '\n').split('\n')
                dates = []
                for line in date_lines:
                    line_dates = re.findall(r'\d{2}-\d{2}-\d{4}', line.strip())
                    dates.extend(line_dates)

                if len(dates) >= 1:
                    try:
                        start_date = datetime.strptime(dates[0], '%d-%m-%Y').date()
                    except ValueError:
                        self.logger.warning(f"Could not parse start date: {dates[0]}")
                if len(dates) >= 2:
                    try:
                        end_date = datetime.strptime(dates[1], '%d-%m-%Y').date()
                    except ValueError:
                        self.logger.warning(f"Could not parse end date: {dates[1]}")
                elif len(dates) == 1 and start_date:
                    # If only one date, use it for both start and end
                    end_date = start_date

            # Extract icons (features)
            icons_text = tds[3].css('::text').get() or ''
            has_food = '' in icons_text  # Food icon
            has_parking = '' in icons_text  # Parking icon

            # Generate external ID from name and dates
            external_id = f"{name}_{start_date}_{end_date}".replace(' ', '_').replace('/', '_') if start_date and end_date else name.replace(' ', '_')

            # Debug logging for market extraction
            if not name:
                self.logger.debug("Skipping row: no name found")
                continue
            if not start_date:
                self.logger.debug(f"Skipping '{name}': no start_date")
                continue
            if self.markets_scraped >= self.max_markets:
                self.logger.debug(f"Max markets ({self.max_markets}) reached, stopping")
                break
            
            # Only yield markets that have dates and limit to max_markets
            if start_date is not None and self.markets_scraped < self.max_markets:
                market_item = FleamarketItem(
                    external_id=external_id,
                    name=name,
                    municipality=municipality,
                    category=category,
                    start_date=start_date.isoformat() if start_date else None,
                    end_date=end_date.isoformat() if end_date else None,
                    has_food=has_food,
                    has_parking=has_parking,
                    source_url=response.url
                )

                # Visit market detail links if available, otherwise yield basic item
                if market_link and (market_link.startswith('/') or market_link.startswith('http')):
                    full_url = response.urljoin(market_link)
                    self.markets_scraped += 1
                    self.logger.info(f"[{self.markets_scraped}/{self.max_markets}] Visiting detail page: {name}")
                    yield response.follow(full_url, self.parse_market_detail, meta={'market_item': market_item})
                else:
                    # Yield market without detail page visit if no link available
                    self.markets_scraped += 1
                    self.logger.warning(f"[{self.markets_scraped}/{self.max_markets}] No detail link for '{name}', yielding basic item (link: {market_link})")
                    self.items_yielded += 1
                    self.logger.info(f"✓ Yielding completed item #{self.items_yielded}: {name}")
                    yield market_item

        # Handle pagination
        next_page = response.css('a:contains("»")::attr(href)').get()
        if next_page:
            self.logger.info(f"Following pagination link: {next_page}")
            yield response.follow(next_page, self.parse)
        else:
            self.logger.info("No more pagination pages found")

    def parse_market_detail(self, response):
        """Parse individual market detail pages for additional metadata"""
        market_item = response.meta['market_item']
        market_name = market_item.get('name', 'Unknown')
        
        self.logger.debug(f"Parsing detail page for: {market_name}")

        try:
            # Extract additional details from market detail page
            # Note: These selectors may need adjustment based on actual page structure

            # Address information
            address = response.css('.address::text, .location::text').get()
            if address:
                market_item['address'] = address.strip()

            # City and postal code
            city_postal = response.css('.city::text, .postal-code::text').get()
            if city_postal:
                # Try to extract postal code and city
                postal_match = re.search(r'(\d{4})\s*(.+)', city_postal.strip())
                if postal_match:
                    market_item['postal_code'] = postal_match.group(1)
                    market_item['city'] = postal_match.group(2).strip()

            # Parse and geocode address if we have location information
            if market_item.get('address') or market_item.get('city'):
                try:
                    # Build address string for parsing
                    address_parts = []
                    if market_item.get('address'):
                        address_parts.append(market_item.get('address'))
                    if market_item.get('postal_code') and market_item.get('city'):
                        address_parts.append(f"{market_item.get('postal_code')} {market_item.get('city')}")
                    elif market_item.get('city'):
                        address_parts.append(market_item.get('city'))
                    
                    full_address_str = ", ".join(address_parts)
                    
                    # Parse and geocode
                    parsed_address = self.address_parser.parse_and_geocode(full_address_str)
                    self.logger.info(f"Parsed address for '{market_name}': {parsed_address}")
                    
                    # Update with parsed data (prefer parsed over scraped)
                    if parsed_address.get('full_address'):
                        market_item['address'] = parsed_address.get('full_address')
                    if parsed_address.get('city'):
                        market_item['city'] = parsed_address.get('city')
                    if parsed_address.get('postal_code'):
                        market_item['postal_code'] = parsed_address.get('postal_code')
                    
                    # Add coordinates
                    if parsed_address.get('latitude') and parsed_address.get('longitude'):
                        market_item['latitude'] = parsed_address.get('latitude')
                        market_item['longitude'] = parsed_address.get('longitude')
                        self.logger.info(f"✓ Geocoded '{market_name}': ({market_item['latitude']}, {market_item['longitude']})")
                    else:
                        self.logger.warning(f"✗ Could not geocode '{market_name}'")
                
                except Exception as e:
                    self.logger.warning(f"Address parsing/geocoding failed for '{market_name}': {str(e)}")

            # Description
            description = response.css('.description::text, .content::text').get()
            if description:
                market_item['description'] = description.strip()

            # Organizer information
            organizer_name = response.css('.organizer::text, .contact-name::text').get()
            if organizer_name:
                market_item['organizer_name'] = organizer_name.strip()

            organizer_phone = response.css('.phone::text, .contact-phone::text').get()
            if organizer_phone:
                # Clean phone number
                phone_clean = re.sub(r'[^\d+\-\s]', '', organizer_phone)
                market_item['organizer_phone'] = phone_clean.strip()

            organizer_email = response.css('.email::text, .contact-email::text').get()
            if organizer_email:
                market_item['organizer_email'] = organizer_email.strip()

            organizer_website = response.css('.website::attr(href), .website::text').get()
            if organizer_website:
                market_item['organizer_website'] = organizer_website.strip()

            # Opening hours (if available)
            opening_hours = response.css('.hours::text, .opening-hours::text').get()
            if opening_hours:
                market_item['opening_hours'] = opening_hours.strip()

            # Entry fee
            entry_fee_text = response.css('.fee::text, .entry-fee::text').get()
            if entry_fee_text:
                # Try to extract numeric fee
                fee_match = re.search(r'(\d+(?:[.,]\d{1,2})?)', entry_fee_text)
                if fee_match:
                    market_item['entry_fee'] = float(fee_match.group(1).replace(',', '.'))

            # Stall count
            stall_text = response.css('.stalls::text, .stall-count::text').get()
            if stall_text:
                stall_match = re.search(r'(\d+)', stall_text)
                if stall_match:
                    market_item['stall_count'] = int(stall_match.group(1))

            # Additional features
            features = []
            if response.css('.indoor::text, .indoor-icon').get():
                market_item['is_indoor'] = True
            if response.css('.outdoor::text, .outdoor-icon').get():
                market_item['is_outdoor'] = True
            if response.css('.toilet::text, .toilet-icon').get():
                market_item['has_toilets'] = True
            if response.css('.wifi::text, .wifi-icon').get():
                market_item['has_wifi'] = True

            # Special features as JSON
            special_features = response.css('.features li::text, .amenities li::text').getall()
            if special_features:
                market_item['special_features'] = str(special_features)

        except Exception as e:
            self.logger.warning(f"Error parsing market detail for {market_name}: {str(e)}")

        self.items_yielded += 1
        self.logger.info(f"✓ Yielding completed item #{self.items_yielded}: {market_name}")
        yield market_item