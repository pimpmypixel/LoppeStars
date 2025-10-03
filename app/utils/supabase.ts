import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import { createClient } from '@supabase/supabase-js';

// Support both react-native-config and Expo environment variables
const supabaseUrl = Config.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://oprevwbturtujbugynct.supabase.co';
const supabaseAnonKey = Config.SUPABASE_ANON_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey ? '***' + supabaseAnonKey.slice(-10) : 'NOT SET');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});