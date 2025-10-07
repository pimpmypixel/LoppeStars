# MarketItem Fixes: Address Unknown & Distance Display

## Date: 2025-10-07

## Issues Fixed

### 1. Missing "Address Unknown" Translation
**Problem**: When a market had no address or city, the app crashed because the translation key `markets.locationUnknown` didn't exist.

**Solution**: Added translation keys to both language files:

**English (`app/locales/en.json`)**:
```json
"locationUnknown": "Address unknown"
```

**Danish (`app/locales/da.json`)**:
```json
"locationUnknown": "Adresse ukendt"
```

**Usage in MarketItem.tsx**:
```tsx
{market.address || market.city || t('markets.locationUnknown', { defaultValue: 'Address unknown' })}
```

### 2. Distance Badge Not Showing
**Problem**: Distance badges were duplicated in the location info row and not properly displayed. The badges appeared twice in the same `infoRow`, causing layout issues.

**Solution**: Restructured the info rows to separate location and date information properly:

**Before (WRONG - duplicate badges)**:
```tsx
<View style={styles.infoRow}>
  <View style={styles.locationInfo}>
    <Ionicons name="location-outline" ... />
    <Text>{market.address || market.city || ...}</Text>
  </View>
  {market.distance !== undefined && (
    <View style={styles.distanceBadge}>...</View>  // First badge
  )}
</View>

<View style={styles.infoRow}>
  <Ionicons name="calendar-outline" ... />
  <Text>{formatDate()}</Text>
  // Missing distance badge container
</View>
```

**After (CORRECT - proper structure)**:
```tsx
{/* Row 1: Location only */}
<View style={styles.infoRow}>
  <View style={styles.locationInfo}>
    <Ionicons name="location-outline" size={16} color="#8F9BB3" />
    <Text style={styles.locationText} numberOfLines={1}>
      {market.address || market.city || t('markets.locationUnknown', { defaultValue: 'Address unknown' })}
    </Text>
  </View>
</View>

{/* Row 2: Date + Distance badge */}
<View style={styles.infoRow}>
  <View style={styles.dateInfo}>
    <Ionicons name="calendar-outline" size={16} color="#8F9BB3" />
    <Text style={styles.dateText}>{formatDate()}</Text>
  </View>
  {market.distance !== undefined && (
    <View style={styles.distanceBadge}>
      <Ionicons name="navigate-outline" size={14} color="#3366FF" style={{ marginRight: 4 }} />
      <Text style={styles.distanceText}>
        {formatDistance(market.distance)}
      </Text>
    </View>
  )}
</View>
```

**Key Changes**:
1. Separated location and date into different rows
2. Wrapped date elements in `dateInfo` container
3. Distance badge now appears next to date (right-aligned)
4. Applied same structure to both selected and unselected cards

### 3. Icon Component Error in RatingScreen
**Problem**: RatingScreen was using `Icon` from `@ui-kitten/components` which caused runtime errors:
```
Error: Element type is invalid: expected a string (for built-in components) 
or a class/function (for composite components) but got: undefined.
Check the render method of `Icon`.
```

**Solution**: Replaced all `Icon` components with `Ionicons` for consistency:

**Before**:
```tsx
import { Layout, Icon } from '@ui-kitten/components';

<Icon name="home" style={styles.typeIcon} fill={ratingType === 'stall' ? '#FF9500' : '#8F9BB3'} />
<Icon name="map-pin" style={styles.typeIcon} fill={ratingType === 'market' ? '#FF9500' : '#8F9BB3'} />
<Icon name="camera" style={styles.buttonIcon} fill="#FF9500" />
<Icon name="trash-2" style={styles.deleteIcon} fill="#EF4444" />
```

**After**:
```tsx
import { Ionicons } from '@expo/vector-icons';
import { Layout } from '@ui-kitten/components';

<Ionicons name="home-outline" size={24} color={ratingType === 'stall' ? '#FF9500' : '#8F9BB3'} />
<Ionicons name="location-outline" size={24} color={ratingType === 'market' ? '#FF9500' : '#8F9BB3'} />
<Ionicons name="camera-outline" size={32} color="#FF9500" />
<Ionicons name="trash-outline" size={24} color="#EF4444" />
```

**Icon Mapping**:
| Eva Icons | Ionicons |
|-----------|----------|
| `home` | `home-outline` |
| `map-pin` | `location-outline` |
| `camera` | `camera-outline` |
| `trash-2` | `trash-outline` |

## Files Modified

1. **app/locales/en.json** - Added `markets.locationUnknown` translation
2. **app/locales/da.json** - Added `markets.locationUnknown` translation
3. **app/components/MarketItem.tsx** - Fixed info row structure for distance badges
4. **app/screens/RatingScreen.tsx** - Replaced Eva Icon with Ionicons

## Layout Structure

### MarketItem Info Rows (Final)

**Unselected Card**:
```tsx
{/* Row 1: Location */}
<View style={styles.infoRow}>
  <View style={styles.locationInfo}>
    <Ionicons + Address text />
  </View>
</View>

{/* Row 2: Date + Distance */}
<View style={styles.infoRow}>
  <View style={styles.dateInfo}>
    <Ionicons + Date text />
  </View>
  {distance && (
    <View style={styles.distanceBadge}>
      <Ionicons + Distance text />
    </View>
  )}
</View>
```

**Selected Card**:
```tsx
{/* Same structure with *Selected styles */}
<View style={styles.infoRow}>
  <View style={styles.locationInfo}>
    <Ionicons + Address (white color) />
  </View>
</View>

<View style={styles.infoRow}>
  <View style={styles.dateInfo}>
    <Ionicons + Date (white color) />
  </View>
  {distance && (
    <View style={styles.distanceBadgeSelected}>
      <Ionicons + Distance (white color) />
    </View>
  )}
</View>
```

## Testing Checklist

### Address Display
- [x] Markets with address show full address
- [x] Markets with only city show city name
- [x] Markets with no address/city show "Address unknown" (English)
- [x] Markets with no address/city show "Adresse ukendt" (Danish)
- [x] No crashes when address/city are null/undefined

### Distance Display
- [x] Distance badge shows on same row as date
- [x] Distance badge aligned to right side
- [x] Distance badge includes navigation icon
- [x] Distance badge shows for 0km distances (`!== undefined` check)
- [x] No duplicate distance badges
- [x] Proper layout on both selected and unselected cards

### Icon System
- [x] Rating screen loads without errors
- [x] Type toggle buttons show home/location icons
- [x] Camera button shows camera icon
- [x] Delete button shows trash icon
- [x] All icons render correctly with proper colors
- [x] No Eva Icons errors in console

## Visual Changes

### Before
```
┌─────────────────────────────────┐
│ Market Name                     │
│ ✓ Active  ⭐4.5 (12)  Copenhagen│
│ 📍 Vestergade 12 [Distance?]   │  ← Distance badge duplicate issue
│ 📅 7 Oct - 8 Oct                │
│ [Here] [Details] [Favorite]    │
└─────────────────────────────────┘
```

### After
```
┌─────────────────────────────────┐
│ Market Name                     │
│ ✓ Active  ⭐4.5 (12)  Copenhagen│
│ 📍 Vestergade 12                │  ← Clean address line
│ 📅 7 Oct - 8 Oct      🧭 1.2km  │  ← Distance badge right-aligned
│ [Here] [Details] [Favorite]    │
└─────────────────────────────────┘
```

## Edge Cases Handled

### No Address Data
1. **No address, has city**: Shows city name with location icon
2. **No address, no city**: Shows "Address unknown" / "Adresse ukendt"
3. **Has address, has city**: Shows address (city in tag)
4. **Empty strings**: Treated as no data, falls back to "unknown"

### Distance Data
1. **Distance = 0**: Shows "0m" with badge ✅
2. **Distance < 1km**: Shows in meters (e.g., "250m")
3. **Distance >= 1km**: Shows in kilometers (e.g., "1.2km")
4. **No GPS data**: No badge shown (correct behavior)
5. **Distance undefined**: No badge shown (correct behavior)

### Icon Compatibility
1. **Eva Icons not loaded**: No longer an issue (using Ionicons)
2. **IconRegistry missing**: No longer needed for these screens
3. **Consistent icon library**: All screens now use Ionicons

## Performance Impact

**Layout Changes**:
- Minimal performance impact (same number of View components)
- Better semantic structure (location/date separated)
- Cleaner rendering (no duplicate badges)

**Icon System**:
- Ionicons already loaded and cached
- No extra dependencies needed
- Faster rendering (native vector icons)

## Known Limitations

### Address Fallback
- Shows "Address unknown" when no location data exists
- Could enhance with "No GPS" or "Location pending" statuses
- Consider adding map link for markets with coordinates

### Distance Badge
- Only shows straight-line distance (Haversine formula)
- Does not account for roads or travel time
- Acceptable for proximity-based market discovery

### Icon Sizes
- Hardcoded sizes (24px, 32px) may need adjustment for accessibility
- Consider adding size prop for dynamic scaling
- Test on various screen sizes and densities

## Future Improvements

1. **Smart Address Display**:
   - Show "Getting location..." when geocoding in progress
   - Add "Add address" button for market organizers
   - Integrate with map services for navigation

2. **Enhanced Distance Info**:
   - Add travel time estimates (walking/driving)
   - Show "Nearby" vs "Far" indicators
   - Cache distances for performance

3. **Icon System Standardization**:
   - Create icon mapping utility
   - Consistent icon sizes across app
   - Accessibility improvements (icon labels)

4. **Localization**:
   - Add more language variants
   - Handle pluralization ("1 review" vs "2 reviews")
   - Regional date/distance formatting

## Rollback Plan

If issues arise, revert specific changes:

```bash
# Revert MarketItem changes
git show HEAD:app/components/MarketItem.tsx > app/components/MarketItem.tsx

# Revert RatingScreen changes
git show HEAD:app/screens/RatingScreen.tsx > app/screens/RatingScreen.tsx

# Revert translation changes
git show HEAD:app/locales/en.json > app/locales/en.json
git show HEAD:app/locales/da.json > app/locales/da.json

git commit -am "Revert MarketItem address/distance fixes"
```

## Deployment Notes

✅ **No Backend Changes**: All fixes are frontend-only
✅ **No Database Changes**: No migrations needed
✅ **No API Changes**: Existing data structure unchanged
✅ **Backwards Compatible**: Works with existing market data
✅ **Type Safe**: All TypeScript checks pass

## Related Documentation

- [MARKETITEM_UNICODE_DISTANCE_FIXES.md](./MARKETITEM_UNICODE_DISTANCE_FIXES.md) - Previous Unicode/distance fixes
- [app/locales/](./locales/) - Translation files
- [app/utils/localization.ts](./utils/localization.ts) - Localization utilities
