import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import { requestAllPermissions } from '../utils/permissions';
import { t } from '../utils/localization';
import Auth from '../components/Auth';
import AppNavigator from '../navigation/AppNavigator';

export default function AuthWrapper() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionsRequested, setPermissionsRequested] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setLoading(false);
      
      // Request permissions when user signs in
      if (session && !permissionsRequested) {
        setPermissionsRequested(true);
        try {
          await requestAllPermissions();
        } catch (error) {
          console.error('Error requesting permissions:', error);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [permissionsRequested]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return session ? <AppNavigator /> : <Auth />;
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