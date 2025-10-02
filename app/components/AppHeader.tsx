import React from 'react';
import { View } from 'react-native';
import { Text } from './ui/text';
import Logo from './Logo';
import { AppHeaderProps } from '../types/components/AppHeader';
import { useSelectedMarket } from '../stores/appStore';
import { Ionicons } from '@expo/vector-icons';

export default function AppHeader({ title }: AppHeaderProps) {
  const { selectedMarket } = useSelectedMarket();

  return (
    <View
      className="bg-transparent pt-14 pb-5 px-5 border-b border-border/50 shadow-sm shadow-black/5"
      {...({} as any)}
    >
      <View className="flex-row items-center" {...({} as any)}>
        <View className="flex-1" {...({} as any)}>
          <Logo size="small" />
        </View>
        <View className="flex-2 items-center" {...({} as any)}>
          <Text
            variant="h4"
            className="text-foreground font-semibold tracking-tight"
          >
            {title}
          </Text>
          {selectedMarket && (
            <View className="flex-row items-center mt-1" {...({} as any)}>
              <Ionicons name="storefront" size={14} color="#6b7280" />
              <Text className="text-muted-foreground text-sm ml-1">
                {selectedMarket.name}
              </Text>
            </View>
          )}
        </View>
        <View className="flex-1" {...({} as any)} />
      </View>
    </View>
  );
}