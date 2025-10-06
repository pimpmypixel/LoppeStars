import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import * as Linking from 'expo-linking';
import { useAuth } from '../contexts/AuthContext';
import { useConnectivity } from '../contexts/ConnectivityContext';
import { useTranslation } from '../utils/localization';
import { Layout } from '@ui-kitten/components';
import SupabaseOfficialAuth from '../components/SupabaseOfficialAuth';
import AppNavigator from '../navigation/AppNavigator';
import ConnectivitySplash from '../components/ConnectivitySplash';
import ErrorBoundary from '../components/ErrorBoundary';
import { supabase } from '../utils/supabase';
import { Text, Button } from './ui-kitten';

export default function AuthWrapper() {
  const { session, loading } = useAuth();
  const { status, isChecking, recheckConnectivity } = useConnectivity();
  const { t } = useTranslation();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    console.log('🔄 AuthWrapper session state:', session ? 'Authenticated' : 'Not authenticated');
  }, [session]);

  // Hide splash after successful connectivity check
  useEffect(() => {
    if (!isChecking && status?.overall === 'healthy') {
      // Show success state briefly before continuing
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isChecking, status]);

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

  // Show connectivity splash on initial load or if checking
  if (showSplash || isChecking) {
    return <ConnectivitySplash status={status} isChecking={isChecking} />;
  }

  // Show error screen if offline
  if (status?.overall === 'offline') {
    return (
      <Layout style={styles.errorContainer} level="2">
        <Text variant="h1" style={styles.errorTitle}>
          Connection Failed
        </Text>
        <Text variant="lead" style={styles.errorText}>
          Unable to connect to services. Please check your internet connection and try again.
        </Text>
        <Button
          style={styles.retryButton}
          onPress={recheckConnectivity}
        >
          <Text style={styles.buttonText}>Retry Connection</Text>
        </Button>
      </Layout>
    );
  }

  // Show warning banner if degraded but continue loading app
  if (status?.overall === 'degraded') {
    console.warn('⚠️ App running in degraded mode');
    // Could show a banner component here, but for now just log it
  }

  // Show auth loading state
  if (loading) {
    return (
      <Layout style={styles.loadingContainer} level="2">
        <Text variant="lead" style={styles.loadingText}>
          {t('common.loading')}
        </Text>
      </Layout>
    );
  }

  return session ? (
    <ErrorBoundary>
      <AppNavigator />
    </ErrorBoundary>
  ) : (
    <SupabaseOfficialAuth />
  );
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 24,
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#EF4444',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#A8A29E',
    textAlign: 'center',
    maxWidth: 400,
  },
  retryButton: {
    marginTop: 16,
    minWidth: 200,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});