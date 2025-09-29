import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import Auth from '../components/Auth';
import AppNavigator from '../navigation/AppNavigator';

export default function AuthWrapper() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <View style={styles.container} />;
  }

  return session ? <AppNavigator /> : <Auth />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});