import { Platform } from 'react-native';

const PRODUCTION_API = 'https://loppestars.spoons.dk';
const LOCAL_API_ANDROID = 'http://10.0.2.2:8080'; // Android emulator localhost
const LOCAL_API_IOS = 'http://localhost:8080'; // iOS simulator
const LOCAL_API_WEB = 'http://localhost:8080'; // Web browser

let cachedApiUrl: string | null = null;
let lastCheckTime: number = 0;
const CACHE_DURATION = 60000; // 1 minute cache

/**
 * Check if local API is available
 * @returns Promise<boolean> - true if local API is reachable
 */
export async function checkLocalAPI(): Promise<boolean> {
  const localUrl = getLocalAPIUrl();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000); // 1 second timeout
    
    const response = await fetch(`${localUrl}/health`, {
      signal: controller.signal,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Local API detected at:', localUrl, data);
      return true;
    }
  } catch (error) {
    // Local API not available (expected in production)
    if (__DEV__) {
      console.log('ℹ️  Local API not available at', localUrl, '- using production');
    }
  }
  
  return false;
}

/**
 * Get local API URL based on platform
 * @returns string - Platform-specific localhost URL
 */
function getLocalAPIUrl(): string {
  if (Platform.OS === 'android') {
    return LOCAL_API_ANDROID; // 10.0.2.2 maps to host machine's localhost
  } else if (Platform.OS === 'ios') {
    return LOCAL_API_IOS;
  } else {
    return LOCAL_API_WEB;
  }
}

/**
 * Get API base URL (local or production)
 * Caches the result for performance (1 minute cache)
 * @returns Promise<string> - Base URL for API requests
 */
export async function getAPIBaseUrl(): Promise<string> {
  const now = Date.now();
  
  // Return cached URL if available and fresh
  if (cachedApiUrl && (now - lastCheckTime) < CACHE_DURATION) {
    return cachedApiUrl;
  }
  
  // Only check for local API in development mode
  if (__DEV__) {
    const isLocalAvailable = await checkLocalAPI();
    
    if (isLocalAvailable) {
      cachedApiUrl = getLocalAPIUrl();
      lastCheckTime = now;
      console.log('🔧 Using LOCAL API:', cachedApiUrl);
      return cachedApiUrl;
    }
  }
  
  // Use production API
  cachedApiUrl = PRODUCTION_API;
  lastCheckTime = now;
  
  if (__DEV__) {
    console.log('🚀 Using PRODUCTION API:', cachedApiUrl);
  }
  
  return cachedApiUrl;
}

/**
 * Reset cached API URL
 * Call this to force re-detection of local API
 */
export function resetAPICache(): void {
  cachedApiUrl = null;
  lastCheckTime = 0;
  console.log('🔄 API cache reset - will re-detect on next request');
}

/**
 * Force use of production API
 * Useful for testing production behavior in development
 */
export function forceProductionAPI(): void {
  cachedApiUrl = PRODUCTION_API;
  lastCheckTime = Date.now();
  console.log('🚀 Forced PRODUCTION API:', cachedApiUrl);
}

/**
 * Force use of local API
 * Useful for testing when auto-detection fails
 */
export function forceLocalAPI(): void {
  cachedApiUrl = getLocalAPIUrl();
  lastCheckTime = Date.now();
  console.log('🔧 Forced LOCAL API:', cachedApiUrl);
}

/**
 * Get current API URL without checking
 * @returns string | null - Current cached API URL
 */
export function getCurrentAPIUrl(): string | null {
  return cachedApiUrl;
}

/**
 * Check if currently using local API
 * @returns boolean - true if using local API
 */
export function isUsingLocalAPI(): boolean {
  return cachedApiUrl?.includes('localhost') || cachedApiUrl?.includes('10.0.2.2') || false;
}
