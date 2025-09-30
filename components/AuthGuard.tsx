import React from 'react';
import { View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { t } from '../utils/localization';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import { Card, CardContent } from './ui/card';
import { Text } from './ui/text';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 bg-background" {...({} as any)}>
        <AppHeader title={t('common.loading')} />
        <View className="flex-1 items-center justify-center px-10" {...({} as any)}>
          <Card className="w-full max-w-sm">
            <CardContent className="items-center gap-3 py-6">
              <Text variant="muted" className="text-base">
                {t('common.loading')}
              </Text>
            </CardContent>
          </Card>
        </View>
        <AppFooter />
      </View>
    );
  }

  if (!session) {
    return fallback || (
      <View className="flex-1 bg-background" {...({} as any)}>
        <AppHeader title={t('auth.signIn')} />
        <View className="flex-1 items-center justify-center px-10" {...({} as any)}>
          <Card className="w-full max-w-sm items-center py-8 gap-3">
            <CardContent className="items-center gap-3">
              <Text className="text-5xl">🔒</Text>
              <Text variant="h3" className="text-center text-foreground">
                {t('auth.pleaseSignIn')}
              </Text>
              <Text variant="muted" className="text-center">
                {t('form.loginRequired')}
              </Text>
            </CardContent>
          </Card>
        </View>
        <AppFooter />
      </View>
    );
  }

  return <>{children}</>;
}