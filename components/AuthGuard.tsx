import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { t } from '../utils/localization';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader title={t('common.loading')} />
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
        <AppFooter />
      </View>
    );
  }

  if (!session) {
    return fallback || (
      <View style={styles.container}>
        <AppHeader title={t('auth.signIn')} />
        <View style={styles.centerContent}>
          <Text style={styles.errorIcon}>🔒</Text>
          <Text style={styles.errorTitle}>{t('auth.pleaseSignIn')}</Text>
          <Text style={styles.errorMessage}>
            {t('form.loginRequired')}
          </Text>
        </View>
        <AppFooter />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
});