import React from 'react';
import { View } from 'react-native';
import { t } from '../utils/localization';
import Logo from './Logo';
import { Text } from './ui/text';

export default function AppFooter() {
  return (
    <View
      className="bg-card border-t border-border px-6 py-6 items-center gap-2"
      {...({} as any)}
    >
      <Logo size="small" />
      <Text variant="muted" className="text-xs uppercase tracking-wide">
        {t('footer.copyright')}
      </Text>
      <Text variant="small" className="text-center text-muted-foreground">
        {t('footer.tagline')}
      </Text>
    </View>
  );
}