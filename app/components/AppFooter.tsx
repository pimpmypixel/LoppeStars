import React from 'react';
import { View } from 'react-native';
import { useTranslation } from '../utils/localization';
import Logo from './Logo';
import { Text } from './ui/text';
import { useAuth } from '../contexts/AuthContext';
import { useSelectedMarket } from '../stores/appStore';
import { Ionicons } from '@expo/vector-icons';

export default function AppFooter() {
  const { user, session, signOut } = useAuth();
  const { selectedMarket } = useSelectedMarket();
  const { t } = useTranslation();

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

        {/* Center column - Selected Market or Copyright */}
        <View className="flex-1 items-center" {...({} as any)}>
          {selectedMarket ? (
            <View className="items-center" {...({} as any)}>
              <View className="flex-row items-center" {...({} as any)}>
                <Ionicons name="storefront" size={12} color="#6b7280" />
                <Text className="text-muted-foreground text-xs ml-1">
                  {selectedMarket.name}
                </Text>
              </View>
              {selectedMarket.city && (
                <Text className="text-muted-foreground text-xs">
                  {selectedMarket.city}
                </Text>
              )}
            </View>
          ) : (
            <Text variant="muted" className="text-xs uppercase tracking-wide">
              {t('footer.copyright')}
            </Text>
          )}
        </View>

        {/* Right column - Empty for balance */}
        <View className="flex-1" {...({} as any)} />
      </View>
    </View>
  );
}