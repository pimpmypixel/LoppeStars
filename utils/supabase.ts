import { AppState, Platform } from 'react-native'
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient, processLock } from '@supabase/supabase-js'
import Config from 'react-native-config'

const resolveSupabaseUrl = () => {
  const platformUrl = Platform.select({
    ios: Config.SUPABASE_URL_IOS,
    android: Config.SUPABASE_URL_ANDROID,
    default: undefined,
  })

  return (
    platformUrl ||
    Config.SUPABASE_URL ||
    Config.SUPABASE_URL_IOS ||
    Config.SUPABASE_URL_ANDROID ||
    undefined
  )
}

const supabaseUrl = resolveSupabaseUrl()
const supabaseAnonKey = Config.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    `Missing Supabase configuration. Ensure SUPABASE_URL_* and SUPABASE_ANON_KEY are defined in your .env file.`
  )
}

// Log the configuration for debugging
console.log('🔧 Supabase Cloud Configuration:', {
  platform: Platform.OS,
  supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'NOT SET'
})

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    ...(Platform.OS !== "web" ? { storage: AsyncStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    lock: processLock,
  },
})

// Tells Supabase Auth to continuously refresh the session automatically
// if the app is in the foreground. When this is added, you will continue
// to receive `onAuthStateChange` events with the `TOKEN_REFRESHED` or
// `SIGNED_OUT` event if the user's session is terminated. This should
// only be registered once.
if (Platform.OS !== "web") {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh()
    } else {
      supabase.auth.stopAutoRefresh()
    }
  })
}