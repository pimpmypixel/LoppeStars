"""
Address parsing and geocoding utilities for market scrapers.

This module provides functionality to:
1. Parse Danish addresses using PyAP (Python Address Parser)
2. Geocode addresses to precise coordinates using multiple services
3. Validate and normalize address components
"""

import re
import logging
import time
import random
from typing import Dict, Optional, Tuple
from geopy.geocoders import Nominatim, GoogleV3
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
import pyap

logger = logging.getLogger(__name__)


class AddressParser:
    """Parse and geocode Danish addresses with high accuracy"""
    
    def __init__(self, google_api_key: Optional[str] = None):
        """
        Initialize address parser with geocoding services.
        
        Args:
            google_api_key: Optional Google Geocoding API key for enhanced results
        """
        self.nominatim = Nominatim(user_agent="loppestars_scraper_v1.0")
        self.google = GoogleV3(api_key=google_api_key) if google_api_key else None
        
        # User agents for Nominatim requests
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        ]
    
    def parse_address(self, address_string: str) -> Dict[str, Optional[str]]:
        """
        Parse Danish address string into components using PyAP.
        
        Args:
            address_string: Raw address string (e.g., "Vestergade 12, 8000 Aarhus C")
        
        Returns:
            Dictionary with keys: street, street_number, postal_code, city, full_address
        """
        if not address_string or not isinstance(address_string, str):
            return self._empty_address()
        
        try:
            # Clean the address string
            address_clean = self._clean_address(address_string)
            
            # Try PyAP parsing (supports international addresses)
            addresses = pyap.parse(address_clean, country='DK')
            
            if addresses:
                # Use the first parsed address
                parsed = addresses[0]
                result = {
                    'street': parsed.street_name if hasattr(parsed, 'street_name') else None,
                    'street_number': parsed.street_number if hasattr(parsed, 'street_number') else None,
                    'postal_code': parsed.postal_code if hasattr(parsed, 'postal_code') else None,
                    'city': parsed.city if hasattr(parsed, 'city') else None,
                    'full_address': parsed.full_address if hasattr(parsed, 'full_address') else address_clean,
                }
                logger.info(f"PyAP parsed address: {result}")
                return result
            
            # Fallback to regex-based Danish address parsing
            result = self._parse_danish_address_regex(address_clean)
            logger.info(f"Regex parsed address: {result}")
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
        Fallback regex-based parser for Danish addresses.
        
        Danish address format: Street StreetNumber, PostalCode City
        Examples:
        - Vestergade 12, 8000 Aarhus C
        - H.C. Andersens Boulevard 27, 1553 København V
        - Strandvejen 171A, 2900 Hellerup
        """
        result = self._empty_address()
        result['full_address'] = address
        
        # Pattern: Street Number, PostalCode City
        # Example: "Vestergade 12, 8000 Aarhus C"
        pattern = r'^([^,\d]+)\s+(\d+[A-Za-z]?)\s*,?\s*(\d{4})?\s*(.+)?$'
        match = re.match(pattern, address)
        
        if match:
            result['street'] = match.group(1).strip() if match.group(1) else None
            result['street_number'] = match.group(2).strip() if match.group(2) else None
            result['postal_code'] = match.group(3).strip() if match.group(3) else None
            result['city'] = match.group(4).strip() if match.group(4) else None
        else:
            # Try simpler pattern: PostalCode City (for addresses without street)
            pattern_simple = r'^(\d{4})\s+(.+)$'
            match_simple = re.match(pattern_simple, address)
            if match_simple:
                result['postal_code'] = match_simple.group(1).strip()
                result['city'] = match_simple.group(2).strip()
        
        return result
    
    def _empty_address(self) -> Dict[str, Optional[str]]:
        """Return empty address dictionary"""
        return {
            'street': None,
            'street_number': None,
            'postal_code': None,
            'city': None,
            'full_address': None,
        }
    
    def geocode(
        self,
        street: Optional[str] = None,
        street_number: Optional[str] = None,
        postal_code: Optional[str] = None,
        city: Optional[str] = None,
        full_address: Optional[str] = None,
    ) -> Tuple[Optional[float], Optional[float]]:
        """
        Geocode address components to precise coordinates.
        
        Args:
            street: Street name (e.g., "Vestergade")
            street_number: Street number (e.g., "12" or "12A")
            postal_code: Danish postal code (e.g., "8000")
            city: City name (e.g., "Aarhus C")
            full_address: Complete address string (used if components not provided)
        
        Returns:
            Tuple of (latitude, longitude) or (None, None) if geocoding fails
        """
        # Build query string from components
        query_parts = []
        
        if street and street_number:
            query_parts.append(f"{street} {street_number}")
        elif street:
            query_parts.append(street)
        
        if postal_code:
            query_parts.append(postal_code)
        
        if city:
            query_parts.append(city)
        
        if not query_parts and full_address:
            query_parts.append(full_address)
        
        if not query_parts:
            logger.warning("No address components provided for geocoding")
            return None, None
        
        # Add Denmark to improve accuracy
        query_parts.append("Denmark")
        query = ", ".join(query_parts)
        
        logger.info(f"Geocoding query: {query}")
        
        # Try Google Geocoding API first (if available) - more accurate
        if self.google:
            try:
                lat, lon = self._geocode_google(query)
                if lat and lon:
                    logger.info(f"✓ Google geocoded: ({lat}, {lon})")
                    return lat, lon
            except Exception as e:
                logger.warning(f"Google geocoding failed: {str(e)}")
        
        # Fallback to Nominatim (OpenStreetMap) - free but less accurate
        try:
            lat, lon = self._geocode_nominatim(query, postal_code)
            if lat and lon:
                logger.info(f"✓ Nominatim geocoded: ({lat}, {lon})")
                return lat, lon
        except Exception as e:
            logger.warning(f"Nominatim geocoding failed: {str(e)}")
        
        logger.warning(f"✗ Geocoding failed for: {query}")
        return None, None
    
    def _geocode_google(self, query: str) -> Tuple[Optional[float], Optional[float]]:
        """Geocode using Google Geocoding API"""
        if not self.google:
            return None, None
        
        try:
            location = self.google.geocode(query, timeout=10)
            if location:
                return location.latitude, location.longitude
        except (GeocoderTimedOut, GeocoderServiceError) as e:
            logger.warning(f"Google geocoder error: {str(e)}")
        
        return None, None
    
    def _geocode_nominatim(
        self,
        query: str,
        postal_code: Optional[str] = None
    ) -> Tuple[Optional[float], Optional[float]]:
        """Geocode using Nominatim (OpenStreetMap)"""
        try:
            # Rate limiting: Nominatim requires 1 request per second
            time.sleep(1.1)
            
            # Build structured query for better accuracy
            location = self.nominatim.geocode(
                query,
                country_codes='dk',
                timeout=10,
                addressdetails=True,
            )
            
            if location:
                return location.latitude, location.longitude
            
            # If structured query fails and we have postal code, try simplified query
            if postal_code:
                time.sleep(1.1)
                simplified_query = f"{postal_code}, Denmark"
                location = self.nominatim.geocode(
                    simplified_query,
                    country_codes='dk',
                    timeout=10,
                )
                if location:
                    logger.info(f"Found location using postal code fallback: {postal_code}")
                    return location.latitude, location.longitude
            
        except (GeocoderTimedOut, GeocoderServiceError) as e:
            logger.warning(f"Nominatim geocoder error: {str(e)}")
        
        return None, None
    
    def parse_and_geocode(self, address_string: str) -> Dict[str, any]:
        """
        Parse address string and geocode in one operation.
        
        Args:
            address_string: Raw address string
        
        Returns:
            Dictionary with parsed components and coordinates:
            {
                'street': str,
                'street_number': str,
                'postal_code': str,
                'city': str,
                'full_address': str,
                'latitude': float,
                'longitude': float,
            }
        """
        # Parse address
        parsed = self.parse_address(address_string)
        
        # Geocode
        lat, lon = self.geocode(
            street=parsed.get('street'),
            street_number=parsed.get('street_number'),
            postal_code=parsed.get('postal_code'),
            city=parsed.get('city'),
            full_address=parsed.get('full_address'),
        )
        
        # Combine results
        result = {**parsed}
        result['latitude'] = lat
        result['longitude'] = lon
        
        return result


# Singleton instance for spiders to use
_parser_instance = None


def get_address_parser(google_api_key: Optional[str] = None) -> AddressParser:
    """Get or create singleton AddressParser instance"""
    global _parser_instance
    if _parser_instance is None:
        _parser_instance = AddressParser(google_api_key=google_api_key)
    return _parser_instance
