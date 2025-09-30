import React from 'react';
import { View } from 'react-native';
import { t } from '../utils/localization';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import Logo from '../components/Logo';
import { Text } from '../components/ui';

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-[#f5f5f5]" {...({} as any)}>
      <AppHeader title="Loppestars" />

      <View className="flex-1 justify-center items-center px-5" {...({} as any)}>
        <Logo size="large" />
        <Text variant="h1" className="text-center mt-5 mb-4">
          {t('home.welcome')}
        </Text>
        <Text variant="lead" className="text-center mb-5">
          {t('home.subtitle')}
        </Text>
      </View>

      <AppFooter />
    </View>
  );
}