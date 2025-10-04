# Events System Documentation

## Overview
The Events system provides comprehensive event tracking for all user interactions in the Loppestars app using an **EAV (Entity-Attribute-Value)** pattern for maximum flexibility.

## Database Schema

### Events Table
```sql
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Indexes
- `idx_events_user_id` - Fast user lookups
- `idx_events_event_type` - Filter by event type
- `idx_events_entity_type` - Filter by entity type
- `idx_events_entity_id` - Find events for specific entities
- `idx_events_timestamp` - Time-based queries
- `idx_events_user_timestamp` - User timeline queries
- `idx_events_metadata` - GIN index for JSONB queries

## Event Types

### Market Events
- **`market_selected`** - User selects a market (only one at a time)
  - entity_type: `market`
  - entity_id: market UUID
  - metadata: `{ market_name, market_city, market_address, selected_at }`

- **`market_marked_here`** - User marks themselves as being at a market
  - entity_type: `market`
  - entity_id: market UUID
  - metadata: `{ market_name, market_city, market_address, marked_at }`

- **`market_favorited`** - User adds market to favorites
  - entity_type: `market`
  - entity_id: market UUID
  - metadata: `{ market_name, market_city, favorited_at }`

- **`market_unfavorited`** - User removes market from favorites
  - entity_type: `market`
  - entity_id: market UUID
  - metadata: `{ market_name, unfavorited_at }`

- **`market_viewed`** - User views market details
  - entity_type: `market`
  - entity_id: market UUID
  - metadata: `{ market_name, viewed_at }`

### Rating Events
- **`stall_rated`** - User submits a rating for a stall
  - entity_type: `rating`
  - entity_id: rating UUID
  - metadata: `{ market_id, market_name, stall_name, rating_value, has_photo, has_mobilepay, has_comments, rated_at }`

- **`rating_deleted`** - User deletes their rating
  - entity_type: `rating`
  - entity_id: rating UUID
  - metadata: `{ stall_name, deleted_at }`

### Photo Events
- **`photo_added`** - User adds a photo to a rating
  - entity_type: `photo`
  - entity_id: rating UUID (or photo UUID if separate)
  - metadata: `{ market_id, market_name, stall_name, photo_url, added_at }`

- **`photo_deleted`** - User deletes a photo
  - entity_type: `photo`
  - entity_id: photo UUID
  - metadata: `{ deleted_at }`

## Usage Examples

### Logging Events
```typescript
import { logEvent } from '../utils/eventLogger';

// Log market selection
await logEvent(
  user.id,
  'market_selected',
  'market',
  market.id,
  {
    market_name: market.name,
    market_city: market.city,
    selected_at: new Date().toISOString(),
  }
);

// Log stall rating
await logEvent(
  user.id,
  'stall_rated',
  'rating',
  ratingId,
  {
    market_id: selectedMarket.id,
    stall_name: 'Cool Vintage Booth',
    rating_value: 8,
    has_photo: true,
    rated_at: new Date().toISOString(),
  }
);
```

### Querying Events
```typescript
import { getUserEvents, getLastSelectedMarket } from '../utils/eventLogger';

// Get user's last 10 events
const { events } = await getUserEvents(user.id, { limit: 10 });

// Get all rating events
const { events: ratings } = await getUserEvents(user.id, {
  eventType: 'stall_rated',
});

// Get last selected market
const { marketId } = await getLastSelectedMarket(user.id);
```

### Event Statistics
```typescript
import { getUserEventStats } from '../utils/eventLogger';

const { stats } = await getUserEventStats(user.id);
// Result: { market_selected: 5, stall_rated: 12, photo_added: 8, ... }
```

## One Market at a Time Rule

The system enforces that **only one market can be selected at a time**:

1. When a user selects a new market, the previous selection is automatically cleared
2. The `market_selected` event is logged with full metadata
3. The MarketContext handles the enforcement automatically

```typescript
// MarketContext automatically handles one-at-a-time
const { setSelectedMarket } = useMarket();

// This will unselect the previous market and log the event
setSelectedMarket(newMarket);
```

## Analytics Queries

### Most active users
```sql
SELECT user_id, COUNT(*) as event_count
FROM events
GROUP BY user_id
ORDER BY event_count DESC
LIMIT 10;
```

### Popular markets
```sql
SELECT 
  metadata->>'market_name' as market_name,
  COUNT(*) as selections
FROM events
WHERE event_type = 'market_selected'
GROUP BY metadata->>'market_name'
ORDER BY selections DESC;
```

### Average ratings per market
```sql
SELECT 
  metadata->>'market_name' as market_name,
  AVG((metadata->>'rating_value')::int) as avg_rating,
  COUNT(*) as rating_count
FROM events
WHERE event_type = 'stall_rated'
GROUP BY metadata->>'market_name'
ORDER BY rating_count DESC;
```

### User engagement timeline
```sql
SELECT 
  event_type,
  COUNT(*) as count,
  DATE_TRUNC('day', timestamp) as day
FROM events
WHERE user_id = 'USER_UUID'
GROUP BY event_type, day
ORDER BY day DESC;
```

## Database Functions

### get_user_selected_market(user_id)
Returns the UUID of the most recently selected market for a user.

```sql
SELECT get_user_selected_market('USER_UUID');
```

### log_event(user_id, event_type, entity_type, entity_id, metadata)
Helper function for logging events from SQL.

```sql
SELECT log_event(
  'USER_UUID'::uuid,
  'market_selected',
  'market',
  'MARKET_UUID'::uuid,
  '{"market_name": "Copenhagen Flea Market"}'::jsonb
);
```

## Security

- **RLS (Row Level Security)** is enabled
- Users can only read their own events
- Users can only insert their own events
- No update or delete permissions (audit trail)

## Best Practices

1. **Always log events after successful operations**
2. **Include meaningful metadata** for analytics
3. **Use consistent event_type names** across the app
4. **Don't log sensitive information** in metadata
5. **Use the helper functions** instead of direct queries
6. **Consider event volume** for high-frequency operations

## Migration

To apply the events table:

```bash
# Run the migration
supabase db push

# Or apply manually
psql -h your-host -d postgres -f supabase/migrations/20251004120000_create_events_table.sql
```

## Future Enhancements

Potential additions to the events system:

- Event aggregation tables for faster analytics
- Real-time event streaming with Supabase Realtime
- Event-triggered notifications
- User activity badges/achievements
- Automatic event cleanup (archive old events)
- Event replay for debugging
