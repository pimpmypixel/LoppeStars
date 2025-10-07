# Address Parsing and Geocoding Implementation

## Overview
The scraper spiders now use PyAP (Python Address Parser) to parse Danish address strings into structured components and geocode them to precise coordinates.

## Features

### 1. Address Parsing
- **PyAP Integration**: Uses PyAP library for intelligent address parsing
- **Danish Address Support**: Handles Danish address formats (e.g., "Vestergade 12, 8000 Aarhus C")
- **Fallback Regex Parser**: Custom regex-based parser for Danish addresses when PyAP fails
- **Component Extraction**: Extracts:
  - Street name
  - Street number (including letters, e.g., "12A")
  - Postal code (4-digit Danish format)
  - City name
  - Full normalized address

### 2. Geocoding
- **Multi-Service Support**: 
  - Primary: Google Geocoding API (if API key provided)
  - Fallback: Nominatim (OpenStreetMap) - free service
- **Structured Queries**: Builds optimal queries from parsed components
- **Rate Limiting**: Respects Nominatim's 1 req/sec limit
- **Postal Code Fallback**: If full address fails, tries postal code only
- **Country Filtering**: Restricts results to Denmark for accuracy

### 3. Integration
Both spiders (`loppemarkeder` and `fleamarket`) now use the centralized `AddressParser` utility:

```python
from scrapy_project.utils.address_parser import get_address_parser

# In spider __init__
self.address_parser = get_address_parser()

# Parse and geocode in one call
parsed = self.address_parser.parse_and_geocode(address_string)
# Returns: {'street', 'street_number', 'postal_code', 'city', 
#           'full_address', 'latitude', 'longitude'}
```

## Dependencies

Added to `requirements.txt`:
- `pyap` - Python Address Parser (international address parsing)
- `geopy` - Geocoding library (Google, Nominatim, and more)

Install with:
```bash
pip install -r requirements.txt
```

## Usage Examples

### Example 1: Loppemarkeder Spider
The loppemarkeder spider receives venue data from the API and parses/geocodes it:

```python
# API returns: {"address": "Vestergade 12", "city": "Aarhus C", "postal_code": "8000"}
raw_address = venue.get('address')
raw_city = venue.get('city')
raw_postal = venue.get('postal_code')

# Build full address and parse
full_address_str = f"{raw_address}, {raw_postal} {raw_city}"
parsed_address = self.address_parser.parse_and_geocode(full_address_str)

# Result:
# {
#   'street': 'Vestergade',
#   'street_number': '12',
#   'postal_code': '8000',
#   'city': 'Aarhus C',
#   'full_address': 'Vestergade 12, 8000 Aarhus C',
#   'latitude': 56.1572,
#   'longitude': 10.2107
# }
```

### Example 2: Fleamarket Spider
The fleamarket spider scrapes address from HTML and parses/geocodes it:

```python
# Scraped: "H.C. Andersens Boulevard 27, 1553 København V"
address_string = "H.C. Andersens Boulevard 27, 1553 København V"
parsed = self.address_parser.parse_and_geocode(address_string)

# Result:
# {
#   'street': 'H.C. Andersens Boulevard',
#   'street_number': '27',
#   'postal_code': '1553',
#   'city': 'København V',
#   'full_address': 'H.C. Andersens Boulevard 27, 1553 København V',
#   'latitude': 55.6724,
#   'longitude': 12.5674
# }
```

## Logging

The address parser provides detailed logging:

```
✓ PyAP parsed address: {'street': 'Vestergade', 'street_number': '12', ...}
✓ Geocoding query: Vestergade 12, 8000, Aarhus C, Denmark
✓ Nominatim geocoded: (56.1572, 10.2107)
✓ Using parsed coordinates: (56.1572, 10.2107)
```

Or fallback messages:
```
⚠ PyAP parsing failed, using regex fallback
⚠ Google geocoding failed: API key not provided
⚠ Nominatim geocoder error: Timeout
✗ Geocoding failed for: Invalid Address, Denmark
✗ No coordinates available for 'Market Name'
```

## Configuration

### Google Geocoding API (Optional)
For higher accuracy and better rate limits, provide a Google Geocoding API key:

```python
# Set environment variable
export GOOGLE_GEOCODING_API_KEY="your_api_key_here"

# Or pass to parser initialization
parser = AddressParser(google_api_key="your_api_key_here")
```

Without Google API key, the system automatically falls back to free Nominatim service.

## Database Schema

Parsed address components are stored in the `markets` table:

```sql
- address TEXT              -- Full normalized address
- city VARCHAR(255)         -- City name
- postal_code VARCHAR(20)   -- 4-digit postal code
- latitude DECIMAL(10, 8)   -- Precise latitude
- longitude DECIMAL(11, 8)  -- Precise longitude
```

## Benefits

1. **Structured Data**: Address components are properly separated for filtering/searching
2. **Precise Coordinates**: Geocoding provides exact lat/lon for map display
3. **Data Quality**: Normalization reduces duplicates and inconsistencies
4. **Flexibility**: Works with various address formats and partial data
5. **Resilience**: Multiple fallback mechanisms ensure high success rate

## Testing

Test the address parser standalone:

```python
from scrapy_project.utils.address_parser import get_address_parser

parser = get_address_parser()

# Test parsing
result = parser.parse_address("Vestergade 12, 8000 Aarhus C")
print(result)

# Test geocoding
lat, lon = parser.geocode(
    street="Vestergade",
    street_number="12",
    postal_code="8000",
    city="Aarhus C"
)
print(f"Coordinates: ({lat}, {lon})")

# Test full pipeline
full_result = parser.parse_and_geocode("H.C. Andersens Boulevard 27, 1553 København V")
print(full_result)
```

## Performance Considerations

1. **Rate Limiting**: Nominatim enforces 1 req/sec limit (1.1s delay in code)
2. **Timeout Handling**: 10-second timeout for geocoding requests
3. **Caching**: Consider implementing coordinate caching for repeated addresses
4. **Batch Processing**: For large scrapes, consider batching geocoding requests

## Future Enhancements

- [ ] Implement coordinate caching to reduce API calls
- [ ] Add support for DAWA (Danmarks Adressers Web API) for official Danish addresses
- [ ] Batch geocoding for better performance
- [ ] Confidence scores for parsed addresses
- [ ] Address validation against official Danish address registry

## Troubleshooting

### Issue: Geocoding fails for all addresses
**Solution**: Check internet connectivity and API rate limits. Enable debug logging:
```python
import logging
logging.getLogger('scrapy_project.utils.address_parser').setLevel(logging.DEBUG)
```

### Issue: PyAP not parsing Danish addresses
**Solution**: The fallback regex parser handles most Danish formats. If needed, adjust the regex pattern in `_parse_danish_address_regex()`.

### Issue: Coordinates are inaccurate
**Solution**: Provide Google Geocoding API key for higher accuracy, or verify the address string format matches expected Danish format.

## Related Files

- `api/scrapy_project/scrapy_project/utils/address_parser.py` - Main parser implementation
- `api/scrapy_project/scrapy_project/spiders/loppemarkeder.py` - Loppemarkeder spider integration
- `api/scrapy_project/scrapy_project/spiders/fleamarket.py` - Fleamarket spider integration
- `api/requirements.txt` - Added pyap and geopy dependencies

## Summary

The address parsing and geocoding system provides robust, accurate location data for all scraped markets. It handles various address formats, provides detailed logging, and uses multiple services to ensure high success rates. The implementation is centralized in a utility module for easy maintenance and reusability across spiders.
