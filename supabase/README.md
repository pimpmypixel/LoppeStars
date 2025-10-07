# Supabase Backend Documentation

This directory contains the complete Supabase backend configuration for the Loppestars application, including database migrations, Edge Functions, and system documentation.

## 📁 Directory Structure

```
supabase/
├── README.md                     # This comprehensive guide
├── COMPLETE_MIGRATION_SCRIPT.sql # Complete consolidated migration for Supabase Cloud
├── SEED_USER_ROLES.sql           # Optional seeding script for test data
├── migrations/                   # Individual migration files (25 files)
└── functions/                    # Supabase Edge Functions
    ├── api-proxy/               # FastAPI proxy with CORS handling
    ├── send-scrape-status/      # Scraper status logging
    └── _shared/                 # Shared utilities (CORS headers)
```

## 🚀 Quick Start

### 1. Deploy Database Schema

**Option A: Complete Migration (Recommended)**
1. Copy the entire `COMPLETE_MIGRATION_SCRIPT.sql` content
2. Open [Supabase SQL Editor](https://supabase.com/dashboard/project/oprevwbturtujbugynct/sql)
3. Paste and execute the script
4. Verify success message: "Role-based database system migration completed successfully!"

**Option B: Individual Migrations**
```bash
cd /Users/andreas/Herd/loppestars
supabase db push  # Applies all files in migrations/ directory
```

### 2. Deploy Edge Functions

```bash
# Set environment variables
supabase secrets set SUPABASE_URL=https://oprevwbturtujbugynct.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Deploy functions
supabase functions deploy api-proxy
supabase functions deploy send-scrape-status
```

### 3. Initialize Admin User

The migration automatically initializes the admin user (`pimpmypixelcph@gmail.com`) when they first sign in to the mobile app.

---

## 🏗️ Database Architecture

### Core Tables

#### `markets` - Flea Market Data
- **Purpose**: Store comprehensive flea market information
- **Key Fields**: name, location, dates, organizer details, features
- **Indexes**: Optimized for location-based queries and date filtering
- **RLS**: Public read access, authenticated users can manage

#### `ratings` - User Stall Ratings
- **Purpose**: Store user ratings of market stalls
- **Key Fields**: user_id, market_id, stall_name, rating (1-10), photo_url
- **RLS**: Users can manage their own ratings, admins can manage all

#### `events` - User Activity Tracking
- **Purpose**: Track user interactions using EAV pattern
- **Key Fields**: user_id, event_type, entity_type, entity_id, metadata
- **Use Cases**: market_selected, stall_rated, photo_added events
- **RLS**: Users can read/write their own events, admins can read all

#### `user_roles` - Role-Based Access Control
- **Purpose**: Manage user roles with full audit trail
- **Roles**: visitor, seller, organiser, admin
- **Features**: Multiple simultaneous roles, grant/revoke tracking
- **RLS**: Users can read their own roles, admins can manage all roles

#### `scraping_logs` - Market Data Scraping
- **Purpose**: Log automated market data collection
- **Key Fields**: success, message, output, error_details, scraped_at
- **RLS**: Service role and admins only

### Storage Buckets

#### `stall-photos` - Original Photos
- **Size Limit**: 50MB per file
- **Allowed Types**: JPEG, PNG, WebP
- **Structure**: `{user_id}/{filename}`
- **RLS**: Users can upload/manage their own photos, all can view

#### `stall-photos-processed` - Face-Blurred Photos
- **Purpose**: Store anonymized photos after face processing
- **Same configuration as stall-photos**

---

## 🔐 Role-Based Security System

### User Roles

1. **visitor** - Default role for all users
   - Can view markets and ratings
   - Can create own ratings

2. **seller** - Market stall vendors
   - All visitor permissions
   - Future: Enhanced stall management features

3. **organiser** - Market organizers (simple label)
   - All visitor permissions
   - No special permissions (organiser is just a role name)

4. **admin** - System administrators
   - Full system access
   - Can manage all data and users
   - Can trigger manual scraper

### Admin Detection Methods

The system uses multiple fallback methods to detect admin users:

1. **ADMIN_EMAIL**: `pimpmypixelcph@gmail.com` (primary method)
2. **user_roles table**: Explicitly granted admin roles
3. **app_metadata**: Legacy role storage
4. **First user**: Oldest registered user (fallback)

### Role Management Functions

```sql
-- Check if user has specific role
SELECT public.user_has_role(user_id, 'admin');

-- Grant role (admin only)
SELECT public.grant_user_role(target_user_id, 'seller', 'Notes');

-- Revoke role (admin only)
SELECT public.revoke_user_role(target_user_id, 'seller', 'Notes');

-- Convenience functions
SELECT public.current_user_is_admin();
SELECT public.current_user_is_seller();
SELECT public.current_user_is_organiser();
```

---

## 🌐 Edge Functions

### api-proxy
- **URL**: `https://oprevwbturtujbugynct.supabase.co/functions/v1/api-proxy`
- **Purpose**: Proxy all requests to FastAPI backend with CORS handling
- **Backend**: `https://loppestars.spoons.dk`
- **Features**: All HTTP methods, query forwarding, binary support

**Usage Examples**:
```bash
# Health check
GET /functions/v1/api-proxy?path=health

# Today's markets
GET /functions/v1/api-proxy?path=markets/today

# Process image
POST /functions/v1/api-proxy?path=process
```

### send-scrape-status
- **URL**: `https://oprevwbturtujbugynct.supabase.co/functions/v1/send-scrape-status`
- **Purpose**: Log market scraper results to database
- **Database**: Stores in `scraping_logs` table
- **Future**: Email notifications for scraper failures

**Usage**:
```bash
curl -X POST "/functions/v1/send-scrape-status" \
  -H "Content-Type: application/json" \
  -d '{"summary": {"marketsScraped": 10}, "status": "success"}'
```

---

## 🔧 Development Workflow

### Local Development (Cloud-Only)
**Important**: We don't run Supabase locally! All development uses Supabase Cloud.

### Migration Process
1. **Create Migration**: Add new `.sql` file to `migrations/` directory
2. **Test in Cloud**: Apply directly in Supabase SQL Editor first
3. **Update Complete Script**: Add changes to `COMPLETE_MIGRATION_SCRIPT.sql`
4. **Document Changes**: Update this README

### Function Development
1. **Local Testing**: Use `supabase functions serve` for local testing
2. **Environment Variables**: Set via `supabase secrets set`
3. **Deploy**: Use `supabase functions deploy <name>`
4. **Monitor**: Check logs in Supabase dashboard

---

## 📊 System Administration

### Admin Functions

#### Market Data Management
```sql
-- View recent scraping logs
SELECT * FROM scraping_logs ORDER BY scraped_at DESC LIMIT 10;

-- Manually trigger scraper (admin only)
SELECT trigger_scraper_manually();
```

#### User Management
```sql
-- View all users and their roles
SELECT 
    u.email,
    ur.role,
    ur.granted_at,
    ur.revoked_at,
    CASE WHEN ur.revoked_at IS NULL THEN 'ACTIVE' ELSE 'REVOKED' END as status
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
ORDER BY u.created_at DESC;

-- Grant seller role to user
SELECT grant_user_role(
    (SELECT id FROM auth.users WHERE email = 'user@example.com'),
    'seller',
    'Granted seller role for market participation'
);
```

#### Event Tracking
```sql
-- View user activity
SELECT 
    u.email,
    e.event_type,
    e.entity_type,
    e.metadata,
    e.timestamp
FROM events e
JOIN auth.users u ON e.user_id = u.id
ORDER BY e.timestamp DESC
LIMIT 20;
```

### Security Monitoring

#### Row Level Security Status
```sql
-- Check RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;

-- View active policies
SELECT schemaname, tablename, policyname, permissive, cmd 
FROM pg_policies 
WHERE schemaname = 'public';
```

---

## 🚨 Troubleshooting

### Common Issues

#### Migration Errors
**Problem**: "relation already exists" errors
**Solution**: Use the `COMPLETE_MIGRATION_SCRIPT.sql` which has `IF NOT EXISTS` patterns

**Problem**: Function permission errors
**Solution**: Ensure service role permissions are granted:
```sql
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
```

#### Admin Access Issues
**Problem**: User not recognized as admin
**Solution**: Check admin detection methods:
```sql
-- 1. Check ADMIN_EMAIL match
SELECT email FROM auth.users WHERE email = 'pimpmypixelcph@gmail.com';

-- 2. Check user_roles table
SELECT * FROM user_roles WHERE user_id = 'user-uuid' AND role = 'admin' AND revoked_at IS NULL;

-- 3. Manually grant admin role
SELECT grant_user_role('user-uuid', 'admin', 'Manual admin grant');
```

#### Edge Function Issues
**Problem**: CORS errors in browser
**Solution**: Verify `_shared/cors.ts` headers and OPTIONS handling

**Problem**: Environment variables not working
**Solution**: Set via `supabase secrets set` and redeploy function

### Performance Optimization

#### Database Indexes
All tables include optimized indexes for common query patterns:
- `markets`: location-based queries, date filtering
- `ratings`: user lookups, market associations
- `events`: user activity tracking, timestamp ordering
- `user_roles`: role lookups, active role filtering

#### Query Optimization
```sql
-- Efficient market search by location
SELECT * FROM markets 
WHERE latitude BETWEEN ? AND ? 
AND longitude BETWEEN ? AND ?
AND start_date >= CURRENT_DATE;

-- Optimized user role check
SELECT EXISTS(
    SELECT 1 FROM user_roles 
    WHERE user_id = ? AND role = ? AND revoked_at IS NULL
);
```

---

## 📈 Monitoring & Analytics

### Key Metrics to Track

#### User Engagement
```sql
-- Daily active users
SELECT DATE(timestamp) as date, COUNT(DISTINCT user_id) as active_users
FROM events 
WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(timestamp)
ORDER BY date;

-- Rating activity
SELECT 
    DATE(created_at) as date,
    COUNT(*) as ratings_count,
    AVG(rating) as average_rating
FROM ratings
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at);
```

#### System Health
```sql
-- Scraper success rate
SELECT 
    DATE(scraped_at) as date,
    COUNT(*) as total_runs,
    COUNT(*) FILTER (WHERE success = true) as successful_runs,
    ROUND(COUNT(*) FILTER (WHERE success = true) * 100.0 / COUNT(*), 2) as success_rate
FROM scraping_logs
WHERE scraped_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(scraped_at);

-- Storage usage
SELECT 
    bucket_id,
    COUNT(*) as file_count,
    SUM(size) / 1024 / 1024 as size_mb
FROM storage.objects
GROUP BY bucket_id;
```

---

## 🔮 Future Enhancements

### Planned Features

1. **Enhanced User Management**
   - Admin dashboard for user role management
   - Bulk role operations
   - User activity monitoring

2. **Advanced Market Features**
   - Market organizer tools
   - Seller dashboards
   - Market analytics

3. **Communication System**
   - Email notifications for scraper failures
   - Push notifications for users
   - Market update alerts

4. **Performance Improvements**
   - Edge caching for frequently accessed data
   - Database connection pooling
   - API rate limiting

### Development Roadmap

**Phase 1: Core Functionality** ✅
- Role-based access control
- Market data management
- User ratings system
- Edge function architecture

**Phase 2: Enhanced Features** 🚧
- Admin dashboard
- Market organizer tools
- Advanced analytics

**Phase 3: Scale & Performance** 📋
- Caching layer
- Real-time features
- Advanced monitoring

---

## 📚 Additional Resources

### Documentation Links
- [Supabase Documentation](https://supabase.com/docs)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

### Project-Specific Files
- `COMPLETE_MIGRATION_SCRIPT.sql` - Complete database schema
- `SEED_USER_ROLES.sql` - Test data seeding
- `functions/api-proxy/README.md` - API proxy documentation
- Individual migration files in `migrations/` directory

### Support
For issues or questions:
1. Check function logs in Supabase dashboard
2. Review this documentation
3. Test with SQL queries in Supabase SQL Editor
4. Consult individual function README files

---

**Last Updated**: January 7, 2025
**Database Version**: 2025-01-07 (Consolidated Role-Based System)
**Status**: Production Ready ✅