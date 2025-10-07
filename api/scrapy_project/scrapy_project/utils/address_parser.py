"""
Address parsing and geocoding utilities for market scrapers.

This module provides functionality to:
1. Parse Danish addresses with optimized regex
2. Batch geocode addresses using Geoapify API
3. Validate and normalize address components

Optimized for Danish address format: Street Number, PostalCode City
Examples: "Vestergade 12, 8000 Aarhus C" or "8000 Aarhus C"
"""

import re
import logging
import os
import asyncio
import aiohttp
from typing import Dict, Optional, Tuple, List
from urllib.parse import quote

logger = logging.getLogger(__name__)


class AddressParser:
    """Parse and geocode Danish addresses with high accuracy using Geoapify"""
    
    def __init__(self, geoapify_api_key: Optional[str] = None):
        """
        Initialize address parser with Geoapify API.
        
        Args:
            geoapify_api_key: Geoapify API key for geocoding (reads from env if not provided)
        """
        self.geoapify_api_key = geoapify_api_key or os.getenv('GEOAPIFY_API_KEY')
        if not self.geoapify_api_key:
            logger.warning("No Geoapify API key found. Geocoding will be disabled.")
        
        self.geoapify_base_url = "https://api.geoapify.com/v1/geocode/search"
        self.batch_size = 50  # Geoapify supports batch requests
    
    def parse_address(self, address_string: str) -> Dict[str, Optional[str]]:
        """
        Parse Danish address string into components.
        
        Args:
            address_string: Raw address string (e.g., "Vestergade 12, 8000 Aarhus C")
        
        Returns:
            Dictionary matching markets table schema:
            {
                'full_address': str (original address),
                'postal_code': str,
                'city': str,
            }
        """
        if not address_string or not isinstance(address_string, str):
            return self._empty_address()
        
        try:
            # Clean the address string
            address_clean = self._clean_address(address_string)
            
            # Use optimized regex for Danish addresses
            result = self._parse_danish_address_regex(address_clean)
            
            return result
            
        except Exception as e:
            logger.warning(f"Error parsing address '{address_string}': {str(e)}")
            return self._empty_address()
    
    def _clean_address(self, address: str) -> str:
        """Clean and normalize address string"""
        # Remove extra whitespace
        address = re.sub(r'\s+', ' ', address.strip())
        # Remove HTML entities
        address = address.replace('&nbsp;', ' ')
        address = address.replace('&#8211;', '-')
        # Normalize Danish characters
        return address
    
    def _parse_danish_address_regex(self, address: str) -> Dict[str, Optional[str]]:
        """
        Regex-based parser optimized for Danish address format.
        
        Danish address format patterns:
        1. Street Number, PostalCode City (full address)
           Example: "Vestergade 12, 8000 Aarhus C"
        2. PostalCode City (postal code + city only)
           Example: "8000 Aarhus C" or "2900 Hellerup"
        3. City name only
           Example: "Aarhus" or "København V"
        """
        result = self._empty_address()
        
        # Pattern 1: PostalCode City (4-digit postal code followed by city name)
        # Example: "8000 Aarhus C" or "2900 Hellerup"
        pattern_postal = r'(\d{4})\s+(.+?)(?:,|$)'
        postal_match = re.search(pattern_postal, address)
        
        if postal_match:
            result['postal_code'] = postal_match.group(1).strip()
            result['city'] = postal_match.group(2).strip()
            
            # Extract street address by removing postal code and city
            street_address = address
            # Remove the postal code and city part
            postal_city_pattern = r',?\s*' + re.escape(postal_match.group(0))
            street_address = re.sub(postal_city_pattern, '', street_address, flags=re.IGNORECASE).strip()
            
            result['full_address'] = street_address if street_address else address
        else:
            # Pattern 2: City name only (extract last component after comma or whole string)
            parts = address.split(',')
            if len(parts) > 1:
                city_part = parts[-1].strip()
                # Remove any leading postal codes
                city_clean = re.sub(r'^\d{4}\s*', '', city_part)
                if city_clean:
                    result['city'] = city_clean
                    # Store street address without city
                    result['full_address'] = ', '.join(parts[:-1]).strip()
            else:
                # Single component - could be city only
                result['city'] = address.strip()
                result['full_address'] = address.strip()
        
        return result
    
    def _empty_address(self) -> Dict[str, Optional[str]]:
        """Return empty address dictionary matching markets table schema"""
        return {
            'full_address': None,
            'postal_code': None,
            'city': None,
        }
    
    def ensure_postal_code(self, parsed: Dict[str, Optional[str]]) -> Dict[str, Optional[str]]:
        """
        Ensure postal code is populated, attempt to extract from city if missing.
        
        Args:
            parsed: Parsed address dictionary
        
        Returns:
            Updated dictionary with postal code if found
        """
        if parsed.get('postal_code'):
            return parsed
        
        # Try to extract postal code from city field
        city = parsed.get('city', '')
        if city:
            postal_pattern = r'(\d{4})'
            match = re.search(postal_pattern, city)
            if match:
                parsed['postal_code'] = match.group(1)
                # Clean city name
                parsed['city'] = re.sub(r'\d{4}\s*', '', city).strip()
        
        return parsed
    
    def geocode(
        self,
        full_address: Optional[str] = None,
        postal_code: Optional[str] = None,
        city: Optional[str] = None,
    ) -> Tuple[Optional[float], Optional[float]]:
        """
        Geocode Danish address to precise coordinates using Geoapify.
        
        Args:
            full_address: Complete address string (prioritized)
            postal_code: Danish postal code (e.g., "8000")
            city: City name (e.g., "Aarhus C")
        
        Returns:
            Tuple of (latitude, longitude) or (None, None) if geocoding fails
        """
        if not self.geoapify_api_key:
            logger.debug("Geocoding disabled: No API key")
            return None, None
        
        # Build query string from components
        query_parts = []
        
        if full_address:
            query_parts.append(full_address)
        elif postal_code and city:
            query_parts.append(f"{postal_code} {city}")
        elif postal_code:
            query_parts.append(postal_code)
        elif city:
            query_parts.append(city)
        
        if not query_parts:
            return None, None
        
        # Add Denmark to improve accuracy
        query_parts.append("Denmark")
        query = ", ".join(query_parts)
        
        # Geocode with Geoapify (synchronous)
        try:
            import requests
            
            url = f"{self.geoapify_base_url}?text={quote(query)}&filter=countrycode:dk&apiKey={self.geoapify_api_key}"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('features') and len(data['features']) > 0:
                    coords = data['features'][0]['geometry']['coordinates']
                    lon, lat = coords[0], coords[1]
                    logger.debug(f"✓ Geocoded: ({lat}, {lon})")
                    return lat, lon
                else:
                    logger.debug(f"No results for: {query}")
            else:
                logger.warning(f"Geoapify API error {response.status_code}: {response.text}")
        except Exception as e:
            logger.warning(f"Geocoding failed for '{query}': {str(e)}")
        
        return None, None
    
    async def batch_geocode_async(self, addresses: List[str]) -> List[Tuple[Optional[float], Optional[float]]]:
        """
        Batch geocode multiple addresses asynchronously using Geoapify.
        
        Args:
            addresses: List of address strings to geocode
        
        Returns:
            List of (latitude, longitude) tuples in same order as input
        """
        if not self.geoapify_api_key:
            logger.warning("Batch geocoding disabled: No API key")
            return [(None, None) for _ in addresses]
        
        results = []
        
        # Process in batches to avoid overwhelming the API
        for i in range(0, len(addresses), self.batch_size):
            batch = addresses[i:i + self.batch_size]
            batch_results = await self._geocode_batch(batch)
            results.extend(batch_results)
        
        return results
    
    async def _geocode_batch(self, addresses: List[str]) -> List[Tuple[Optional[float], Optional[float]]]:
        """Geocode a batch of addresses concurrently"""
        async with aiohttp.ClientSession() as session:
            tasks = [self._geocode_single_async(session, addr) for addr in addresses]
            return await asyncio.gather(*tasks)
    
    async def _geocode_single_async(
        self,
        session: aiohttp.ClientSession,
        address: str
    ) -> Tuple[Optional[float], Optional[float]]:
        """Geocode a single address asynchronously"""
        try:
            query = f"{address}, Denmark"
            url = f"{self.geoapify_base_url}?text={quote(query)}&filter=countrycode:dk&apiKey={self.geoapify_api_key}"
            
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get('features') and len(data['features']) > 0:
                        coords = data['features'][0]['geometry']['coordinates']
                        lon, lat = coords[0], coords[1]
                        logger.debug(f"✓ Geocoded '{address}': ({lat}, {lon})")
                        return lat, lon
                else:
                    logger.debug(f"No results for: {address}")
        except Exception as e:
            logger.debug(f"Geocoding failed for '{address}': {str(e)}")
        
        return None, None
    
    def batch_geocode(self, addresses: List[str]) -> List[Tuple[Optional[float], Optional[float]]]:
        """
        Batch geocode addresses (synchronous wrapper for async method).
        
        Args:
            addresses: List of address strings
        
        Returns:
            List of (lat, lon) tuples
        """
        try:
            # Create new event loop if needed
            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
            
            return loop.run_until_complete(self.batch_geocode_async(addresses))
        except Exception as e:
            logger.error(f"Batch geocoding error: {str(e)}")
            return [(None, None) for _ in addresses]
    
    def parse_and_geocode(self, address_string: str) -> Dict[str, any]:
        """
        Parse Danish address string and geocode in one operation.
        
        Args:
            address_string: Raw address string
        
        Returns:
            Dictionary matching markets table schema:
            {
                'full_address': str (street address without postal/city),
                'postal_code': str,
                'city': str,
                'latitude': float,
                'longitude': float,
            }
        """
        # Parse address
        parsed = self.parse_address(address_string)
        
        # Ensure postal code is populated
        parsed = self.ensure_postal_code(parsed)
        
        # Geocode using parsed components (use original address for better results)
        lat, lon = self.geocode(
            full_address=address_string,  # Use original for geocoding
            postal_code=parsed.get('postal_code'),
            city=parsed.get('city'),
        )
        
        # Combine results
        result = {**parsed}
        result['latitude'] = lat
        result['longitude'] = lon
        
        return result


# Singleton instance for spiders to use
_parser_instance = None


def get_address_parser(geoapify_api_key: Optional[str] = None) -> AddressParser:
    """Get or create singleton AddressParser instance"""
    global _parser_instance
    if _parser_instance is None:
        _parser_instance = AddressParser(geoapify_api_key=geoapify_api_key)
    return _parser_instance
