# Apply Storage RLS Fix Migration

## Quick Steps

1. **Open Supabase SQL Editor**:
   ```
   https://supabase.com/dashboard/project/oprevwbturtujbugynct/sql/new
   ```

2. **Copy Migration SQL**:
   - Open: `supabase/migrations/20250107000023_fix_storage_rls_for_api.sql`
   - Copy entire file contents

3. **Run in Supabase**:
   - Paste into SQL editor
   - Click "Run" (▶️ button)

4. **Expected Output**:
   ```
   DROP POLICY
   DROP POLICY
   DROP POLICY
   DROP POLICY
   CREATE POLICY
   CREATE POLICY
   CREATE POLICY
   CREATE POLICY
   
   Success. No rows returned
   ```

5. **Test in App**:
   - Take a photo with a face
   - Wait for processing (2-3 seconds)
   - See success message
   - Submit rating form
   - ✅ No RLS errors!

## What This Fixes

**Before**:
```
ERROR: new row violates row-level security policy
```

**After**:
```
✅ Photo processed successfully!
✅ Rating submitted!
```

## Technical Details

The migration updates RLS policies to allow the API (using `service_role` key) to upload processed photos to the `stall-photos-processed` bucket.

### Old Policy
```sql
-- Only allowed authenticated users
CREATE POLICY "Users can upload processed stall photos" 
    ON storage.objects 
    FOR INSERT WITH CHECK (
        bucket_id = 'stall-photos-processed' 
        AND auth.uid()::text = (storage.foldername(name))[0]
    );
```

### New Policy
```sql
-- Allows both users AND service role (API)
CREATE POLICY "Allow uploads to processed photos bucket" 
    ON storage.objects 
    FOR INSERT WITH CHECK (
        bucket_id = 'stall-photos-processed' 
        AND (
            auth.uid()::text = (storage.foldername(name))[0]
            OR
            auth.role() = 'service_role'  -- ✅ API can upload!
        )
    );
```

## Rollback Plan

If needed, restore original policies:

```sql
DROP POLICY IF EXISTS "Allow uploads to processed photos bucket" ON storage.objects;

CREATE POLICY "Users can upload processed stall photos" ON storage.objects 
    FOR INSERT WITH CHECK (
        bucket_id = 'stall-photos-processed' 
        AND auth.uid()::text = (storage.foldername(name))[0]
    );
```

## Verification

Check that policies are applied:

```sql
SELECT 
    policyname, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname LIKE '%processed%';
```

Should return:
- `Allow uploads to processed photos bucket` (INSERT)
- `Users can view all processed stall photos` (SELECT)
- `Allow updates to processed photos` (UPDATE)
- `Users can delete their own processed stall photos` (DELETE)
