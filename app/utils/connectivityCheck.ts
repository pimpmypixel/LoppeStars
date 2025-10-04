/**
 * Connectivity Check Utility
 * 
 * Checks database and API connectivity on app startup
 */

import { supabase } from './supabase';
import { getHealth } from './baseApi';
import Config from 'react-native-config';

export interface ConnectivityStatus {
  database: {
    connected: boolean;
    error?: string;
    latency?: number;
  };
  api: {
    connected: boolean;
    error?: string;
    latency?: number;
    endpoint?: string;
  };
  overall: 'healthy' | 'degraded' | 'offline';
}

/**
 * Check Supabase database connectivity
 */
async function checkDatabaseConnectivity(): Promise<ConnectivityStatus['database']> {
  const startTime = Date.now();
  
  try {
    console.log('🔍 Checking Supabase database connectivity...');
    
    // Simple query to check if database is reachable
    const { data, error } = await supabase
      .from('markets')
      .select('id')
      .limit(1);
    
    const latency = Date.now() - startTime;
    
    if (error) {
      console.error('❌ Database connectivity check failed:', error.message);
      return {
        connected: false,
        error: error.message,
        latency,
      };
    }
    
    console.log(`✅ Database connected (${latency}ms)`);
    return {
      connected: true,
      latency,
    };
  } catch (error: any) {
    const latency = Date.now() - startTime;
    console.error('❌ Database connectivity check error:', error);
    return {
      connected: false,
      error: error?.message || 'Unknown database error',
      latency,
    };
  }
}

/**
 * Check API connectivity (ECS FastAPI backend)
 */
async function checkAPIConnectivity(): Promise<ConnectivityStatus['api']> {
  const startTime = Date.now();
  const apiEndpoint = Config.API_BASE_URL ?? 'https://loppestars.spoons.dk';
  
  try {
    console.log('🔍 Checking API connectivity...');
    console.log('📡 API endpoint:', apiEndpoint);
    
    const healthData = await getHealth();
    const latency = Date.now() - startTime;
    
    if (healthData?.status === 'healthy') {
      console.log(`✅ API connected (${latency}ms)`);
      return {
        connected: true,
        latency,
        endpoint: apiEndpoint,
      };
    } else {
      console.warn('⚠️ API returned unexpected status:', healthData);
      return {
        connected: false,
        error: 'API returned unexpected status',
        latency,
        endpoint: apiEndpoint,
      };
    }
  } catch (error: any) {
    const latency = Date.now() - startTime;
    console.error('❌ API connectivity check failed:', error);
    return {
      connected: false,
      error: error?.message || 'API unreachable',
      latency,
      endpoint: apiEndpoint,
    };
  }
}

/**
 * Perform full connectivity check
 */
export async function performConnectivityCheck(): Promise<ConnectivityStatus> {
  console.log('🚀 Starting connectivity checks...');
  
  // Run checks in parallel for faster startup
  const [database, api] = await Promise.all([
    checkDatabaseConnectivity(),
    checkAPIConnectivity(),
  ]);
  
  // Determine overall health status
  let overall: ConnectivityStatus['overall'];
  if (database.connected && api.connected) {
    overall = 'healthy';
    console.log('✅ All systems operational');
  } else if (database.connected || api.connected) {
    overall = 'degraded';
    console.warn('⚠️ System degraded - some services unavailable');
  } else {
    overall = 'offline';
    console.error('❌ All systems offline');
  }
  
  const status: ConnectivityStatus = {
    database,
    api,
    overall,
  };
  
  // Log summary
  console.log('📊 Connectivity Status:', {
    overall: status.overall,
    database: database.connected ? `✅ ${database.latency}ms` : `❌ ${database.error}`,
    api: api.connected ? `✅ ${api.latency}ms` : `❌ ${api.error}`,
  });
  
  return status;
}

/**
 * Check if app is in offline mode
 */
export function isOffline(status: ConnectivityStatus): boolean {
  return status.overall === 'offline';
}

/**
 * Check if app is in degraded mode
 */
export function isDegraded(status: ConnectivityStatus): boolean {
  return status.overall === 'degraded';
}

/**
 * Get user-friendly error message
 */
export function getConnectivityMessage(status: ConnectivityStatus): string {
  if (status.overall === 'healthy') {
    return 'All systems operational';
  }
  
  const issues: string[] = [];
  
  if (!status.database.connected) {
    issues.push('Database unavailable');
  }
  
  if (!status.api.connected) {
    issues.push('API unavailable');
  }
  
  if (issues.length === 0) {
    return 'System status unknown';
  }
  
  return issues.join(', ');
}
