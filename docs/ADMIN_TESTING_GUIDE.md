# Admin System Testing Guide

## Current Status
- ✅ Admin functions created in `app/utils/adminCheck.ts`
- ✅ Admin UI implemented in `app/screens/MoreScreen.tsx`
- ✅ Zustand store for scraping state management
- ✅ Internationalization support for admin features
- ⚠️  Database admin functions need to be manually applied
- ⚠️  Need to create a user to test admin functionality

## Testing Steps

### Step 1: Apply Admin System to Database

**Option A: Via Supabase Dashboard (Recommended)**
1. Open Supabase Dashboard: https://supabase.com/dashboard/project/oprevwbturtujbugynct
2. Go to SQL Editor
3. Copy and paste the contents of `supabase/minimal_admin_setup.sql`
4. Run the SQL to create admin functions

**Option B: Via Mobile App** (Test without database functions first)
1. The app has fallback methods that work without database functions
2. First user will be automatically considered admin

### Step 2: Create Test User

1. Open the mobile app (Expo should be running on http://localhost:8081)
2. Click "Open in iOS Simulator" or "Open in Android Emulator"
3. Or use physical device with Expo Go app
4. Sign in with Google OAuth
5. This will create the first user in the database

### Step 3: Test Admin Detection

With the app running and user signed in:

1. **Check Console Output**: Look for admin check messages:
   ```
   🔄 Starting admin check for session: user@example.com
   🔍 Checking admin status for user: user@example.com (uuid)
   🔗 Attempting RPC admin check...
   🔗 Checking app_metadata...
   🔗 Checking if first user...
   ✅ User is admin as first registered user
   🔐 Final admin status for user@example.com: true
   ```

2. **Check More Screen**: Navigate to "More" tab
   - If admin: Should see "Admin" section with "Trigger Scraper" button
   - If not admin: Should only see regular menu items

### Step 4: Test Scraper Trigger

If user is detected as admin:

1. **Tap "Trigger Scraper" button**
2. **Should see**:
   - Button shows loading spinner
   - API call to Edge Function `trigger-scraper`
   - Success/error alert
   - Button returns to normal state

3. **Expected API Response**:
   - Success: "Scraper triggered successfully"
   - Error: Check if FastAPI endpoint is running at https://loppestars.spoons.dk

### Step 5: Debug Issues

**If admin not detected:**
1. Check console logs for detailed admin check process
2. Verify user is first in database
3. Check if RPC functions exist in database

**If scraper trigger fails:**
1. Check Edge Function logs in Supabase Dashboard
2. Verify FastAPI endpoint is accessible
3. Check environment variables in Edge Function

**If RPC functions not found:**
1. Apply `minimal_admin_setup.sql` in Supabase SQL Editor
2. Grant proper permissions to functions

## Console Output Examples

### Successful Admin Detection (First User):
```
🔄 Starting admin check for session: user@example.com
🔍 Checking admin status for user: user@example.com (f9ab1c1f-fd36-4e1d-b69d-6f0137b7db91)
🔗 Attempting RPC admin check...
⚠️ RPC error checking current user admin status: Could not find the function...
📝 Admin functions not yet deployed, using fallback methods
🔗 Checking app_metadata...
🔗 Checking if first user...
👤 First user: user@example.com (f9ab1c1f-fd36-4e1d-b69d-6f0137b7db91)
🆔 Current user: user@example.com (f9ab1c1f-fd36-4e1d-b69d-6f0137b7db91)
✅ User is admin as first registered user
🔐 Final admin status for user@example.com: true
```

### Successful Scraper Trigger:
```
🔄 Triggering scraper...
✅ Scraper triggered successfully: { message: "Scraper triggered", status: "success" }
```

## Next Steps After Testing

1. **If everything works**: Document the working admin system
2. **If database functions needed**: Apply full migration with admin_users table
3. **Add more admin features**: User management, market management, analytics
4. **Production deployment**: Ensure admin system works in production environment

## Files to Monitor

- `app/utils/adminCheck.ts` - Admin detection logic
- `app/screens/MoreScreen.tsx` - Admin UI
- `app/stores/scrapingStore.ts` - Scraping state
- `supabase/functions/trigger-scraper/index.ts` - Edge Function
- `app/locales/*.json` - Internationalization strings

## Database Tables to Check

After creating users:
```sql
-- Check users
SELECT id, email, created_at FROM auth.users ORDER BY created_at;

-- Check if admin functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name LIKE '%admin%';
```