# Complete Admin System Setup Guide

## Overview

The admin system has been completely consolidated and is ready for deployment. This guide will walk you through the final setup steps.

## What's Been Completed

✅ **Consolidated Database Migration** (`supabase/migrations/20250106000001_consolidated_schema_and_admin_system.sql`)
- All tables, functions, policies, and triggers in one migration
- ADMIN_EMAIL-based admin detection as primary method
- Complete audit trail system
- Storage policies and permissions

✅ **Updated Mobile App** (`app/utils/adminCheck.ts`)
- ADMIN_EMAIL environment variable support
- Multiple fallback methods for admin detection
- Enhanced debugging and error handling

✅ **Environment Configuration** (`.env`)
- ADMIN_EMAIL=pimpmypixelcph@gmail.com
- EXPO_PUBLIC_ADMIN_EMAIL for React Native access

✅ **Edge Functions Updated**
- Admin validation in trigger-scraper function
- Enhanced security and error handling

## Setup Steps

### Step 1: Apply Database Migration

**Option A: Supabase SQL Editor (Recommended)**

1. Open Supabase Dashboard: https://supabase.com/dashboard/project/oprevwbturtujbugynct/sql
2. Click "New query"
3. Copy the entire contents of `supabase/migrations/20250106000001_consolidated_schema_and_admin_system.sql`
4. Paste into the SQL editor
5. Click "Run" to execute the migration
6. You should see: "Consolidated database schema and admin system migration completed successfully!"

**Option B: CLI (If migration detection works)**

```bash
cd /Users/andreas/Herd/loppestars/supabase
npx supabase db push
```

### Step 2: Create Admin User

1. **Start the mobile app** (should already be running on http://localhost:8081)
2. **Sign in with Google** using the email: `pimpmypixelcph@gmail.com`
3. This creates the user in the database and automatically grants admin rights

### Step 3: Verify Admin System

Run the test script to verify everything is working:

```bash
cd /Users/andreas/Herd/loppestars/supabase
node test_consolidated_admin.js
```

Expected output:
```
✅ Admin functions are available
✅ Admin user found: pimpmypixelcph@gmail.com
✅ Admin user pimpmypixelcph@gmail.com is ADMIN
✅ Found 1 active admin users in admin_users table
✅ Manual scraper trigger function is available
🎉 Consolidated admin system test completed successfully!
```

### Step 4: Test Mobile App Admin Features

1. **Open the mobile app** and ensure you're signed in as `pimpmypixelcph@gmail.com`
2. **Navigate to "More" tab**
3. **Look for "Admin" section** - should now be visible
4. **Test "Trigger Scraper" button**:
   - Should show loading spinner
   - Should call FastAPI endpoint
   - Should show success/error message
   - Should update Zustand store state

### Step 5: Monitor Console Logs

Watch for these admin detection logs in the mobile app:

```
🔄 Starting admin check for session: pimpmypixelcph@gmail.com
🔍 Checking admin status for user: pimpmypixelcph@gmail.com (uuid)
🔗 Checking ADMIN_EMAIL...
✅ User is admin via ADMIN_EMAIL environment variable
🔐 Final admin status for pimpmypixelcph@gmail.com: true
```

## Admin System Features

### Primary Admin Detection Methods

1. **ADMIN_EMAIL Match** (Primary) - Environment variable `EXPO_PUBLIC_ADMIN_EMAIL`
2. **Database RPC Function** - Uses `user_is_admin()` function
3. **App Metadata Roles** - Fallback for Supabase Auth roles
4. **First User Detection** - Fallback for initial setup

### Database Functions Available

- `user_is_admin(uuid)` - Check if specific user is admin
- `current_user_is_admin()` - Check if current user is admin
- `grant_admin_rights(uuid, text)` - Grant admin to user (admin only)
- `revoke_admin_rights(uuid, text)` - Revoke admin from user (admin only)
- `trigger_scraper_manually()` - Trigger scraper (admin only)

### Tables Created

- `markets` - Flea market information
- `stall_ratings` - User ratings with photo upload
- `events` - User interaction tracking (EAV pattern)
- `scraping_logs` - Scraper operation logs
- `send_scrape_status_logs` - Status notification logs
- `admin_users` - Admin privileges with audit trail

### Security Features

- Row Level Security (RLS) on all tables
- Admin-only policies for sensitive operations
- ADMIN_EMAIL user cannot have admin rights revoked
- First user protection against self-revocation
- Comprehensive audit trail for all admin actions

## Troubleshooting

### Admin Not Detected

1. **Check environment variables**:
   ```javascript
   console.log('ADMIN_EMAIL:', process.env.EXPO_PUBLIC_ADMIN_EMAIL);
   ```

2. **Verify user email matches exactly**:
   ```javascript
   console.log('User email:', session.user.email);
   console.log('Admin email:', process.env.EXPO_PUBLIC_ADMIN_EMAIL);
   ```

3. **Check database functions exist**:
   ```sql
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_schema = 'public' AND routine_name LIKE '%admin%';
   ```

### Migration Not Applied

1. **Manually apply in SQL Editor** - Copy/paste the migration file
2. **Check for syntax errors** in the migration
3. **Verify Supabase project connection**

### Scraper Trigger Fails

1. **Check Edge Function logs** in Supabase Dashboard
2. **Verify FastAPI endpoint** is accessible at https://loppestars.spoons.dk
3. **Check admin authentication** in trigger-scraper function

### Environment Variables Not Available

1. **Restart Expo development server** after adding EXPO_PUBLIC_ADMIN_EMAIL
2. **Check app.json** for environment variable configuration
3. **Verify .env file** has correct values

## Production Deployment

When deploying to production:

1. **Set ADMIN_EMAIL** in production environment variables
2. **Apply database migration** to production database
3. **Deploy Edge Functions** with admin validation
4. **Test admin functionality** in production environment
5. **Monitor admin access logs** for security

## API Endpoints

### Admin-Only Endpoints

- `POST /functions/v1/trigger-scraper` - Trigger scraper (requires admin auth)
- `RPC current_user_is_admin()` - Check admin status
- `RPC grant_admin_rights(uuid, text)` - Grant admin (admin only)
- `RPC revoke_admin_rights(uuid, text)` - Revoke admin (admin only)

### Public Endpoints

- All market and stall rating endpoints remain public
- User event tracking endpoints (user-scoped)

## Next Steps

After successful setup:

1. **Add more admin features** - User management, market moderation
2. **Create admin dashboard** - Web interface for admin operations
3. **Implement admin notifications** - Email alerts for important events
4. **Add admin analytics** - Usage statistics and monitoring
5. **Expand admin permissions** - Granular role-based access control

The admin system is now complete and production-ready with comprehensive security, audit trails, and multiple authentication methods!