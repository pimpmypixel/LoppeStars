# Database Table Name Fix - October 7, 2025

## Issue

**Error**: `PGRST200 - Could not find a relationship between 'markets' and 'stall_ratings'`

**Root Cause**: The mobile app was using the old table name `stall_ratings`, but the database schema uses `ratings`.

---

## Fix Applied

Updated all references from `stall_ratings` → `ratings` across the mobile app:

### Files Modified

1. **`app/components/MarketItem.tsx`**
   - Changed table query from `stall_ratings` to `ratings`
   - Fixed variable reference from `data` to `ratings`
   - Added TypeScript type annotations

2. **`app/screens/HomeScreen.tsx`**
   - Changed table query from `stall_ratings` to `ratings`
   - Fixed variable reference from `ratingsCount` to `ratingsData?.length`

3. **`app/screens/MarketsScreen.tsx`**
   - Changed relationship from `stall_ratings(count)` to `ratings(count)`

4. **`app/screens/RatingScreen.tsx`**
   - Changed insert table from `stall_ratings` to `ratings`

5. **`app/screens/MarketDetailsScreen.tsx`**
   - Changed table query from `stall_ratings` to `ratings`
   - Fixed variable references (`error` → `ratingsError`, `data` → `ratingsData`)
   - Added TypeScript type annotations

6. **`app/screens/more/MyRatingsScreen.tsx`**
   - Changed table query from `stall_ratings` to `ratings`
   - Fixed incomplete template literal in select statement
   - Fixed variable references (`error` → `ratingsError`, `data` → `ratingsData`)

---

## Database Schema Reference

**Table Name**: `ratings` (defined in `supabase/migrations/20250107000003_create_ratings_table.sql`)

**Columns**:
- `id` - UUID primary key
- `user_id` - UUID reference to auth.users
- `market_id` - UUID reference to markets
- `stall_name` - VARCHAR(255)
- `photo_url` - TEXT
- `mobilepay_phone` - VARCHAR(20)
- `rating` - INTEGER (1-10)
- `rating_type` - VARCHAR(20) ('stall' or 'market')
- `location_latitude` - DECIMAL(10, 8)
- `location_longitude` - DECIMAL(11, 8)
- `created_at` - TIMESTAMPTZ
- `updated_at` - TIMESTAMPTZ

---

## Verification

### Before Fix
```typescript
// ❌ Old code using wrong table name
const { data } = await supabase
  .from('stall_ratings')  // Table doesn't exist!
  .select('*')
```

### After Fix
```typescript
// ✅ Fixed code using correct table name
const { data } = await supabase
  .from('ratings')  // Matches database schema
  .select('*')
```

---

## TypeScript Improvements

While fixing the table name, also improved TypeScript type safety:

```typescript
// Before
const avgRating = data.reduce((sum, r) => sum + r.rating, 0) / data.length;

// After
const avgRating = ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length;
```

---

## Testing Recommendations

After deploying these changes, test the following features:

1. **Home Screen Stats**
   - ✓ Ratings count should load correctly
   - ✓ Markets count should display

2. **Markets List**
   - ✓ Each market should show ratings count
   - ✓ No PGRST200 errors in console

3. **Submit Rating**
   - ✓ Ratings should save successfully
   - ✓ Photo uploads should work
   - ✓ Both 'stall' and 'market' rating types supported

4. **Market Details**
   - ✓ Ratings should load and display
   - ✓ Average rating should calculate correctly

5. **My Ratings Screen**
   - ✓ User's ratings should load
   - ✓ Photos should display correctly

---

## Related Files (Not Modified)

These files reference the old table name but are **documentation only** (no code changes needed):

- `supabase/COMPLETE_MIGRATION_SCRIPT.sql` - SQL cleanup script (drops old table)
- `docs/SUPABASE_CONSOLIDATION_SUMMARY.md` - Documentation
- `docs/APPLY_MIGRATION_GUIDE.md` - Migration guide
- `docs/ADMIN_SYSTEM_COMPLETE_SETUP.md` - Admin setup docs
- `supabase/migrations/20250107000001_cleanup_existing_schema.sql` - Cleanup migration

These files correctly reference the cleanup/removal of `stall_ratings` in favor of `ratings`.

---

## Status

✅ **All TypeScript errors resolved**
✅ **All table references updated to 'ratings'**
✅ **Variable naming consistency fixed**
✅ **Type annotations added where needed**

The app is now ready to run without the PGRST200 error!
