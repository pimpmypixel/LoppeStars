import React, { useEffect } from 'react';
import { View } from 'react-native';
import * as Linking from 'expo-linking';
import { useAuth } from '../contexts/AuthContext';
import { t } from '../utils/localization';
import SupabaseOfficialAuth from '../components/SupabaseOfficialAuth';
import AppNavigator from '../navigation/AppNavigator';
import { supabase } from '../utils/supabase';
import { Text } from './ui/text';

export default function AuthWrapper() {
  const { session, loading } = useAuth();

  useEffect(() => {
    // Handle deep links for OAuth callback
    const handleDeepLink = (url: string) => {
      // console.log('🔗 Deep link received:', url);
      
      if (url.includes('auth/callback')) {
        console.log('🔗 OAuth callback detected');
        // The session should be automatically updated by Supabase
        supabase.auth.getSession().then(({ data, error }) => {
          if (data?.session) {
            console.log('✅ OAuth session found after callback');
          } else {
            console.log('❌ No session found after callback');
          }
          if (error) {
            console.error('❌ Session error after callback:', error);
          }
        });
      }
    };

    // Handle initial URL if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Listen for incoming deep links while app is running
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => subscription?.remove();
  }, []);

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background"
        {...({} as any)}
      >
        <Text variant="lead" className="text-muted-foreground">
          {t('common.loading')}
        </Text>
      </View>
    );
  }

  return session ? <AppNavigator /> : <SupabaseOfficialAuth />;
}