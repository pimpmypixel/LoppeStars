import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import * as Linking from 'expo-linking';
import { useAuth } from '../contexts/AuthContext';
import { t } from '../utils/localization';
import SupabaseOfficialAuth from '../components/SupabaseOfficialAuth';
import AppNavigator from '../navigation/AppNavigator';
import { supabase } from '../utils/supabase';

export default function AuthWrapper() {
  const { session, loading } = useAuth();

  useEffect(() => {
    // Handle deep links for OAuth callback
    const handleDeepLink = (url: string) => {
      console.log('🔗 Deep link received:', url);
      
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
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return session ? <AppNavigator /> : <SupabaseOfficialAuth />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});