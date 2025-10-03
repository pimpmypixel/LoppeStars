import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../utils/localization';
import { Layout } from '@ui-kitten/components';
import SupabaseOfficialAuth from '../components/SupabaseOfficialAuth';
import AppNavigator from '../navigation/AppNavigator';
import { supabase } from '../utils/supabase';
import { Text } from './ui-kitten';

export default function AuthWrapper() {
  const { session, loading } = useAuth();
  const { t } = useTranslation();

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
      <Layout style={styles.loadingContainer} level="2">
        <Text variant="lead" style={styles.loadingText}>
          {t('common.loading')}
        </Text>
      </Layout>
    );
  }

  return session ? <AppNavigator /> : <SupabaseOfficialAuth />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#6b7280',
  },
});