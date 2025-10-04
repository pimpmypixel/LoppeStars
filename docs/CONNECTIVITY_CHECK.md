# Connectivity Check System

## Overview

The Loppestars app now performs comprehensive connectivity checks on startup to verify database and API availability before loading the main application.

## Architecture

### Components

1. **`utils/connectivityCheck.ts`** - Core connectivity checking logic
   - `performConnectivityCheck()` - Main function that checks both database and API
   - `checkDatabaseConnectivity()` - Tests Supabase database connection
   - `checkAPIConnectivity()` - Tests ECS FastAPI backend health endpoint
   - Helper functions for status interpretation

2. **`contexts/ConnectivityContext.tsx`** - React context for connectivity state
   - Provides connectivity status throughout the app
   - Performs initial check on app startup
   - Offers `recheckConnectivity()` for manual retries

3. **`components/ConnectivitySplash.tsx`** - Visual feedback component
   - Shows loading state during checks
   - Displays success/warning/error states with details
   - Shows latency metrics for connected services

4. **`components/AuthWrapper.tsx`** - Updated to integrate connectivity checks
   - Shows connectivity splash on startup
   - Blocks app loading if offline
   - Allows retry on connection failure

5. **`App.tsx`** - Updated with ConnectivityProvider
   - Wraps entire app in connectivity context

## Connectivity States

### Healthy ✅
- **Database**: Connected
- **API**: Connected
- **Behavior**: App loads normally after brief success screen (1.5s)

### Degraded ⚠️
- **Database**: Connected OR API: Connected (at least one working)
- **Behavior**: App continues to load with warning logged to console
- **User Experience**: Some features may be unavailable

### Offline ❌
- **Database**: Disconnected AND API: Disconnected
- **Behavior**: App shows error screen with retry button
- **User Experience**: Cannot proceed until connection is restored

## Startup Flow

```
App Start
    ↓
ConnectivityProvider initializes
    ↓
Parallel checks:
├─ Database (Supabase query to markets table)
└─ API (GET /health endpoint)
    ↓
Status determined (healthy/degraded/offline)
    ↓
├─ If HEALTHY: Show success splash (1.5s) → Continue to auth
├─ If DEGRADED: Show warning splash → Continue to auth with limitations
└─ If OFFLINE: Show error screen with retry button
```

## Implementation Details

### Database Check
```typescript
// Queries the markets table with a simple SELECT
const { data, error } = await supabase
  .from('markets')
  .select('id')
  .limit(1);
```

### API Check
```typescript
// Calls the health endpoint
const healthData = await getHealth(); // GET https://loppestars.spoons.dk/health
// Expected response: { status: "healthy" }
```

### Latency Tracking
Both checks track response time and display it on the success/warning screens:
- **Healthy**: Shows latency for both services
- **Error**: Shows time until timeout/error

## Configuration

### Environment Variables

Add to `.env`:
```env
API_BASE_URL=https://loppestars.spoons.dk
```

### API Health Endpoint

The backend must expose a `/health` endpoint:
```json
GET https://loppestars.spoons.dk/health

Response:
{
  "status": "healthy"
}
```

## Testing

### Manual Testing

1. **Test Healthy State**
   - Ensure internet connection is active
   - Ensure Supabase and API are operational
   - Restart app
   - Should see brief success screen then continue to login/app

2. **Test Offline State**
   - Disable internet connection
   - Restart app
   - Should see error screen with retry button
   - Enable connection and tap "Retry Connection"
   - Should proceed to app

3. **Test Degraded State**
   - Block API endpoint (e.g., via hosts file or firewall)
   - Keep Supabase accessible
   - Restart app
   - Should see warning but continue to app
   - Vice versa: block Supabase, keep API accessible

### Programmatic Testing

```typescript
import { performConnectivityCheck } from './utils/connectivityCheck';

// Run connectivity check
const status = await performConnectivityCheck();

console.log('Overall:', status.overall); // 'healthy' | 'degraded' | 'offline'
console.log('Database:', status.database.connected);
console.log('API:', status.api.connected);
```

## Console Logging

The connectivity system provides detailed console logs:

```
🚀 Starting connectivity checks...
🔍 Checking Supabase database connectivity...
✅ Database connected (125ms)
🔍 Checking API connectivity...
📡 API endpoint: https://loppestars.spoons.dk
✅ API connected (87ms)
✅ All systems operational
📊 Connectivity Status: {
  overall: 'healthy',
  database: '✅ 125ms',
  api: '✅ 87ms'
}
```

## User Experience

### Success Flow (Healthy)
1. App launches
2. Shows logo with "Checking connectivity..." spinner
3. Shows "All Systems Operational" with green checkmark
4. Shows latency for database and API
5. After 1.5 seconds, proceeds to login/main app

### Error Flow (Offline)
1. App launches
2. Shows logo with "Checking connectivity..." spinner
3. Shows "Connection Failed" with red WiFi-off icon
4. Lists failed services with error details
5. Shows "Retry Connection" button
6. User taps button → repeats connectivity check

### Warning Flow (Degraded)
1. App launches
2. Shows logo with "Checking connectivity..." spinner
3. Shows "Limited Connectivity" with yellow warning icon
4. Lists status of both services (connected/failed)
5. Proceeds to app after brief display

## Integration with Existing Features

### Authentication
- Connectivity check runs **before** authentication
- If offline, user cannot reach login screen
- Prevents auth errors due to network issues

### Market Loading
- If API is down but database is up, markets can still be fetched from Supabase
- App should handle API unavailability gracefully

### Photo Upload
- If API is down, face blurring service won't work
- App should detect API status and skip face blur or show warning

## Retry Logic

Users can manually retry connectivity via:
1. **Error Screen**: "Retry Connection" button
2. **Programmatic**: `useConnectivity().recheckConnectivity()`

Example:
```tsx
import { useConnectivity } from '../contexts/ConnectivityContext';

function MyComponent() {
  const { status, recheckConnectivity } = useConnectivity();
  
  return (
    <Button onPress={recheckConnectivity}>
      Check Connection
    </Button>
  );
}
```

## Future Enhancements

### Potential Improvements
1. **Periodic Health Checks**: Automatically recheck connectivity every N minutes
2. **Network State Monitoring**: Listen to device network state changes
3. **Offline Mode**: Cache data for offline usage
4. **Service-Specific Handling**: Gracefully degrade features based on which service is down
5. **Connection Quality**: Measure latency thresholds and warn if connection is slow
6. **Background Sync**: Queue actions when offline, sync when online

### Example: Periodic Checks
```tsx
// In ConnectivityContext.tsx
useEffect(() => {
  const interval = setInterval(() => {
    checkConnectivity();
  }, 5 * 60 * 1000); // Check every 5 minutes
  
  return () => clearInterval(interval);
}, []);
```

## Troubleshooting

### "Database connectivity check failed"
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env`
- Check if Supabase project is active
- Verify `markets` table exists and is accessible

### "API unreachable"
- Verify `API_BASE_URL` in `.env` is correct
- Check if ECS service is running: `https://loppestars.spoons.dk/health`
- Verify Docker container is deployed and healthy
- Check CloudFlare DNS settings

### "Connectivity check takes too long"
- Checks run in parallel for speed
- Database query is limited to 1 row
- Consider implementing timeout (currently relies on fetch/Supabase defaults)

### "App stuck on connectivity splash"
- Check console for detailed error logs
- Verify all dependencies are installed
- Ensure `ConnectivityProvider` wraps `AuthProvider`

## Dependencies

```json
{
  "@supabase/supabase-js": "^2.x",
  "react-native-config": "^1.5.x",
  "@ui-kitten/components": "^5.x",
  "lucide-react-native": "^0.x"
}
```

## Code Location

```
app/
├── utils/
│   └── connectivityCheck.ts       # Core logic
├── contexts/
│   └── ConnectivityContext.tsx    # React context
├── components/
│   ├── ConnectivitySplash.tsx     # UI component
│   └── AuthWrapper.tsx            # Integration point
└── App.tsx                        # Provider setup
```

## Summary

The connectivity check system provides:
- ✅ Automatic verification on app startup
- ✅ Parallel checking for speed
- ✅ Clear visual feedback with latency metrics
- ✅ Graceful degradation for partial failures
- ✅ Retry mechanism for connection failures
- ✅ Detailed console logging for debugging
- ✅ Context-based API for app-wide access

This ensures users have a smooth experience and prevents confusing errors from network issues.
