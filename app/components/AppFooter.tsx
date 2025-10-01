import React from 'react';
import { View } from 'react-native';
import { t } from '../utils/localization';
import Logo from './Logo';
import { Text } from './ui/text';
import { useAuth } from '../contexts/AuthContext';

export default function AppFooter() {
  const { user, session, signOut } = useAuth();

  return (
    <View
      className="bg-card border-t border-border px-2 py-4"
      {...({} as any)}
    >
      <View className="flex-row justify-between items-center" {...({} as any)}>
        {/* Left column - Logo */}
        <View className="flex-1 items-center" {...({} as any)}>
          <Logo size="small" />
        </View>

        {/* Center column - Copyright and Tagline */}
        <View className="flex-1 items-center" {...({} as any)}>
          <Text variant="muted" className="text-xs uppercase tracking-wide">
            {t('footer.copyright')}
          </Text>
          {/* <Text variant="small" className="text-center text-muted-foreground mt-1">
            {t('footer.tagline')}
          </Text> */}
        </View>
      </View>
    </View>
  );
}