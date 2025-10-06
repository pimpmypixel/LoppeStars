import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../utils/localization';
import { Layout } from '@ui-kitten/components';
import AppHeader from '../components/AppHeader';
import { Card, CardContent } from './ui-kitten';
import { Text } from './ui-kitten';
import { AuthGuardProps } from '../types/components/AuthGuard';

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { session, loading } = useAuth();
  const { t } = useTranslation();

  // console.log('AuthGuard - session:', !!session, 'loading:', loading);

  if (loading) {
    console.log('AuthGuard - showing loading screen');
    return (
      <Layout style={styles.container} level="2">
        <AppHeader title={t('common.loading')} />
        <View style={styles.centerContent}>
          <Card style={styles.card}>
            <CardContent style={styles.cardContent}>
              <Text variant="muted" style={styles.loadingText}>
                {t('common.loading')}
              </Text>
            </CardContent>
          </Card>
        </View>
      </Layout>
    );
  }

  if (!session) {
    console.log('AuthGuard - showing sign in screen');
    return fallback || (
      <Layout style={styles.container} level="2">
        <AppHeader title={t('auth.signIn')} />
        <View style={styles.centerContent}>
          <Card style={styles.authCard}>
            <CardContent style={styles.authCardContent}>
              <Text style={styles.lockIcon}>🔒</Text>
              <Text variant="h3" style={styles.authTitle}>
                {t('auth.pleaseSignIn')}
              </Text>
              <Text variant="muted" style={styles.authMessage}>
                {t('form.loginRequired')}
              </Text>
            </CardContent>
          </Card>
        </View>
      </Layout>
    );
  }

  // console.log('AuthGuard - rendering children');
  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  card: {
    width: '100%',
    maxWidth: 384,
  },
  cardContent: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  loadingText: {
    fontSize: 16,
  },
  authCard: {
    width: '100%',
    maxWidth: 384,
    alignItems: 'center',
    paddingVertical: 32,
  },
  authCardContent: {
    alignItems: 'center',
    gap: 12,
  },
  lockIcon: {
    fontSize: 48,
  },
  authTitle: {
    textAlign: 'center',
  },
  authMessage: {
    textAlign: 'center',
  },
});