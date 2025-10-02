import './global.css';
import { StatusBar } from 'expo-status-bar';
import { View, Alert } from 'react-native';
import { useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { MarketProvider } from './contexts/MarketContext';
import AuthWrapper from './components/AuthWrapper';
import { useLanguageSync } from './utils/localization';
import { PortalHost } from '@rn-primitives/portal';
import Config from 'react-native-config';

export default function App() {
  // Keep i18n in sync with global language state
  useLanguageSync();

  useEffect(() => {
    // Log all environment variables for debugging
    // console.log('🔧 Environment Variables Check:');
    // console.log('SUPABASE_URL:', Config.SUPABASE_URL);
    // console.log('SUPABASE_URL_ANDROID:', Config.SUPABASE_URL_ANDROID);
    // console.log('SUPABASE_URL_IOS:', Config.SUPABASE_URL_IOS);
    // console.log('SUPABASE_ANON_KEY:', Config.SUPABASE_ANON_KEY ? '***' + Config.SUPABASE_ANON_KEY.slice(-10) : 'NOT SET');
    // console.log('GOOGLE_WEB_CLIENT_ID:', Config.GOOGLE_WEB_CLIENT_ID);
    // console.log('GOOGLE_ANDROID_CLIENT_ID:', Config.GOOGLE_ANDROID_CLIENT_ID);
    // console.log('FACEBOOK_APP_ID:', Config.FACEBOOK_APP_ID);
    // console.log('EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
    // console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '***' + process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY.slice(-10) : 'NOT SET');

    // // Alert to confirm env vars are loaded
    // const envStatus = [
    //   `SUPABASE_URL: ${Config.SUPABASE_URL ? '✓' : '✗'}`,
    //   `SUPABASE_ANON_KEY: ${Config.SUPABASE_ANON_KEY ? '✓' : '✗'}`,
    //   `GOOGLE_WEB_CLIENT_ID: ${Config.GOOGLE_WEB_CLIENT_ID ? '✓' : '✗'}`,
    //   `EXPO_PUBLIC_SUPABASE_URL: ${process.env.EXPO_PUBLIC_SUPABASE_URL ? '✓' : '✗'}`,
    // ].join('\n');

    // Alert.alert('Env Vars Check', envStatus);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <MarketProvider>
          <View className="flex-1 bg-background" {...({} as any)}>
            <AuthWrapper />
            <StatusBar style="auto" />
          </View>
          <PortalHost />
        </MarketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
