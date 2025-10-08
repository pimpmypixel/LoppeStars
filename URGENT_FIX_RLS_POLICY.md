# URGENT: Fix RLS Policy Error

## Issue
```
Upload/processing error: Error: Failed to upload image: new row violates row-level security policy
```

## Quick Fix (2 minutes)

### Step 1: Open Supabase SQL Editor
Open this link in your browser:
```
https://supabase.com/dashboard/project/oprevwbturtujbugynct/sql/new
```

### Step 2: Run This SQL
Copy and paste the entire SQL below, then click **Run** (▶️):

```sql
-- Fix Storage RLS for API Uploads
-- This allows the API (using service_role) to upload processed photos

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can upload processed stall photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own processed stall photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload stall photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own stall photos" ON storage.objects;

-- Recreate with service role bypass for processed photos
CREATE POLICY "Allow uploads to processed photos bucket" ON storage.objects 
    FOR INSERT WITH CHECK (
        bucket_id = 'stall-photos-processed' 
        AND (
            auth.uid()::text = (storage.foldername(name))[0]
            OR
            auth.role() = 'service_role'
        )
    );

CREATE POLICY "Allow updates to processed photos" ON storage.objects 
    FOR UPDATE USING (
        bucket_id = 'stall-photos-processed' 
        AND (
            auth.uid()::text = (storage.foldername(name))[0]
            OR
            auth.role() = 'service_role'
        )
    );

-- Recreate with service role bypass for original photos
CREATE POLICY "Allow uploads to stall photos bucket" ON storage.objects 
    FOR INSERT WITH CHECK (
        bucket_id = 'stall-photos' 
        AND (
            auth.uid()::text = (storage.foldername(name))[0]
            OR
            auth.role() = 'service_role'
        )
    );

CREATE POLICY "Allow updates to stall photos" ON storage.objects 
    FOR UPDATE USING (
        bucket_id = 'stall-photos' 
        AND (
            auth.uid()::text = (storage.foldername(name))[0]
            OR
            auth.role() = 'service_role'
        )
    );
```

### Step 3: Verify
You should see:
```
DROP POLICY (4 times)
CREATE POLICY (4 times)
Success. No rows returned
```

### Step 4: Test in App
1. Restart the mobile app
2. Take a photo with a face
3. Should see: ✅ "Photo processed successfully!"
4. Submit rating
5. Should see: ✅ "Thanks for rating this stall!"

## What This Does

**Problem**: The API uses `service_role` key to upload processed photos, but the old RLS policies only allowed authenticated users (with `auth.uid()`).

**Solution**: Allow **both**:
- Authenticated users → Upload to their own folder
- Service role (API) → Upload anywhere (for face detection processing)

## Expected Result

**Before**: ❌ RLS error when API tries to upload processed photo  
**After**: ✅ Photo uploads successfully, face detection works

---

**Time to fix**: 2 minutes  
**Downtime**: None (policies update instantly)  
**Risk**: Low (only makes uploads more permissive, doesn't break security)
