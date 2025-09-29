import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { t } from '../utils/localization';
import Auth from '../components/Auth';
import AppNavigator from '../navigation/AppNavigator';

export default function AuthWrapper() {
  const { session, loading } = useAuth();

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