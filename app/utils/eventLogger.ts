import { supabase } from './supabase';

export type EventType = 
  | 'market_selected'
  | 'market_marked_here'
  | 'stall_rated'
  | 'photo_added'
  | 'market_favorited'
  | 'market_unfavorited'
  | 'rating_deleted'
  | 'photo_deleted'
  | 'market_viewed';

export type EntityType = 
  | 'market'
  | 'stall'
  | 'rating'
  | 'photo'
  | 'user';

export interface EventMetadata {
  [key: string]: any;
}

/**
 * Log an event to the events table
 */
export async function logEvent(
  userId: string,
  eventType: EventType,
  entityType?: EntityType,
  entityId?: string,
  metadata?: EventMetadata
): Promise<{ success: boolean; error?: string; eventId?: string }> {
  try {
    const { data, error } = await supabase
      .from('events')
      .insert({
        user_id: userId,
        event_type: eventType,
        entity_type: entityType || null,
        entity_id: entityId || null,
        metadata: metadata || {},
        timestamp: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error logging event:', error);
      return { success: false, error: error.message };
    }

    return { success: true, eventId: data.id };
  } catch (error) {
    console.error('Error logging event:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get the last selected market for a user
 */
export async function getLastSelectedMarket(
  userId: string
): Promise<{ marketId?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('entity_id, metadata')
      .eq('user_id', userId)
      .eq('event_type', 'market_selected')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error getting last selected market:', error);
      return { error: error.message };
    }

    return { marketId: data?.entity_id };
  } catch (error) {
    console.error('Error getting last selected market:', error);
    return { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get user events with optional filters
 */
export async function getUserEvents(
  userId: string,
  options?: {
    eventType?: EventType;
    entityType?: EntityType;
    limit?: number;
    offset?: number;
  }
): Promise<{ events?: any[]; error?: string }> {
  try {
    let query = supabase
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (options?.eventType) {
      query = query.eq('event_type', options.eventType);
    }

    if (options?.entityType) {
      query = query.eq('entity_type', options.entityType);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting user events:', error);
      return { error: error.message };
    }

    return { events: data };
  } catch (error) {
    console.error('Error getting user events:', error);
    return { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get event statistics for a user
 */
export async function getUserEventStats(
  userId: string
): Promise<{ stats?: { [key: string]: number }; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('event_type')
      .eq('user_id', userId);

    if (error) {
      console.error('Error getting event stats:', error);
      return { error: error.message };
    }

    // Count events by type
    const stats = data.reduce((acc: { [key: string]: number }, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    }, {});

    return { stats };
  } catch (error) {
    console.error('Error getting event stats:', error);
    return { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Check if user has marked a market as "here"
 */
export async function isMarketMarkedHere(
  userId: string,
  marketId: string
): Promise<{ isMarked: boolean; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('id')
      .eq('user_id', userId)
      .eq('event_type', 'market_marked_here')
      .eq('entity_id', marketId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error checking market marked here:', error);
      return { isMarked: false, error: error.message };
    }

    return { isMarked: !!data };
  } catch (error) {
    console.error('Error checking market marked here:', error);
    return { 
      isMarked: false,
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
