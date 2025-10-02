import React from 'react';
import { View, TouchableOpacity } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../utils/localization';
import { useAppStore } from '../stores/appStore';
import { Card, CardContent } from './ui/card';
import { Text } from './ui/text';
import { Market } from '../types/common/market';


interface MarketItemProps {
  market: Market & { distance?: number };
  formatDistance: (distance: number) => string;
}

export default function MarketItem({ market, formatDistance }: MarketItemProps) {
  const navigation = useNavigation<any>();
  // Use Zustand global state directly for instant reactivity
  const selectedMarket = useAppStore((state) => state.selectedMarket);
  const setSelectedMarket = useAppStore((state) => state.setSelectedMarket);
  const { t, language } = useTranslation();

  const isSelected = selectedMarket?.id === market.id;

  // Check if market is currently active
  const now = new Date();
  let startDate: Date;
  let endDate: Date | null = null;

  try {
    startDate = new Date(market.start_date);
    if (market.end_date && market.end_date.trim()) {
      endDate = new Date(market.end_date);
    }
  } catch (error) {
    console.error('Error parsing market dates:', error, market);
    startDate = new Date(); // fallback to current date
  }

  const isActive = now >= startDate && (!endDate || now <= endDate);

  const handlePress = () => {
    setSelectedMarket(market);
    navigation.navigate('MarketDetails', { market });
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      {...({} as any)}
    >
      <View className="relative" {...({} as any)}>
        <Card className={`mb-4 mx-4 shadow-sm ${isSelected ? 'border-2 border-green-500 bg-green-50' : 'bg-white'}`} {...({} as any)}>
          <CardContent className="px-4">
            {/* Header with name, city and distance */}
            <View className="flex-row justify-between items-start mb-2" {...({} as any)}>
              <View className="flex-1 mr-2" {...({} as any)}>
                <View className="flex-row items-center" {...({} as any)}>
                  <Text className={`text-lg font-semibold flex-1 mr-2 ${isSelected ? 'text-green-800' : 'text-gray-900'}`} numberOfLines={2}>
                    {market.name}
                  </Text>
                  {isSelected && (
                    <View className="bg-green-500 rounded-full px-2 py-1 ml-2" {...({} as any)}>
                      <Text className="text-white text-xs font-bold">{t('markets.selected')}</Text>
                    </View>
                  )}
                </View>
                {market.city && (
                  <Text className={`text-sm font-medium mt-1 ${isSelected ? 'text-green-700' : 'text-gray-600'}`}> 
                    {market.city}
                  </Text>
                )}
              </View>
              {market.distance && (
                <View className={`px-2 py-1 rounded-full ${isSelected ? 'bg-green-100' : 'bg-blue-50'}`} {...({} as any)}>
                  <Text className={`text-sm font-medium ${isSelected ? 'text-green-700' : 'text-blue-600'}`}>
                    {formatDistance(market.distance)}
                  </Text>
                </View>
              )}
            </View>

            {/* Tags */}
            <View className="flex-row flex-wrap gap-2 mb-3" {...({} as any)}>
              {isSelected && (
                <View className="bg-green-100 px-2 py-1 rounded-full" {...({} as any)}>
                  <Text className="text-xs text-green-800 font-bold">✓ {t('markets.markedHere')}</Text>
                </View>
              )}
              {isActive && (
                <View className={`px-2 py-1 rounded-full ${isSelected ? 'bg-green-200' : 'bg-green-50'}`} {...({} as any)}>
                  <Text className={`text-xs font-medium ${isSelected ? 'text-green-900' : 'text-green-700'}`}>{t('markets.active', { defaultValue: language === 'da' ? 'Aktiv' : 'Active' })}</Text>
                </View>
              )}
              <View className={`px-2 py-1 rounded-full ${isSelected ? 'bg-orange-200' : 'bg-orange-50'}`} {...({} as any)}>
                <Text className={`text-xs font-medium ${isSelected ? 'text-orange-900' : 'text-orange-700'}`}>{t('markets.category', { defaultValue: language === 'da' ? 'Loppemarked' : 'Flea Market' })}</Text>
              </View>
              {market.city && (
                <View className={`px-2 py-1 rounded-full ${isSelected ? 'bg-gray-200' : 'bg-gray-50'}`} {...({} as any)}>
                  <Text className={`text-xs font-medium ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>{market.city}</Text>
                </View>
              )}
            </View>

            {/* Location and date info */}
            <View className="flex-row justify-between items-center mb-4" {...({} as any)}>
              <View className="flex-row items-center gap-1 flex-1" {...({} as any)}>
                <Ionicons name="location-outline" size={14} color={isSelected ? "#16a34a" : "#666"} />
                <Text className={`text-sm ${isSelected ? 'text-green-700' : 'text-gray-600'}`} numberOfLines={1}>
                  {market.address}{market.address && market.city ? ', ' : ''}{market.city}
                </Text>
              </View>
              <View className="flex-row items-center gap-1 ml-2" {...({} as any)}>
                <Ionicons name="calendar-outline" size={14} color={isSelected ? "#16a34a" : "#666"} />
                <Text className={`text-sm ${isSelected ? 'text-green-700' : 'text-gray-600'}`}>
                  {(() => {
                    try {
                      const locale = language === 'da' ? 'da-DK' : 'en-GB';
                      const startDateStr = startDate.toLocaleDateString(locale, {
                        day: 'numeric',
                        month: 'short'
                      });
                      if (endDate && endDate.toDateString() !== startDate.toDateString()) {
                        const endDateStr = endDate.toLocaleDateString(locale, {
                          day: 'numeric',
                          month: 'short'
                        });
                        return `${startDateStr} - ${endDateStr}`;
                      }
                      return startDateStr;
                    } catch (error) {
                      console.error('Error formatting market dates:', error);
                      return t('markets.dateUnavailable', { defaultValue: language === 'da' ? 'Dato ikke tilgængelig' : 'Date unavailable' });
                    }
                  })()}
                </Text>
              </View>
            </View>

            {/* Action buttons */}
            <View className="flex-row gap-2" {...({} as any)}>
              <TouchableOpacity
                className={`flex-1 rounded-lg py-2 px-3 flex-row items-center justify-center ${isSelected ? 'bg-green-600' : 'bg-green-500'}`}
                onPress={() => {
                  // Handle "here" action - silent
                  console.log('User marked as being at:', market.name);
                }}
                {...({} as any)}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color="white" />
                <Text className="text-white font-medium text-sm ml-1">{t('markets.here')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-1 rounded-lg py-2 px-3 flex-row items-center justify-center border ${isSelected ? 'bg-green-100 border-green-300' : 'bg-gray-100 border-gray-200'}`}
                onPress={() => {
                  // Handle "add favorite" action - silent
                  console.log('Added to favorites:', market.name);
                }}
                {...({} as any)}
              >
                <Ionicons name="heart-outline" size={16} color={isSelected ? "#16a34a" : "#374151"} />
                <Text className={`font-medium text-sm ml-1 ${isSelected ? 'text-green-800' : 'text-gray-700'}`}>{t('markets.addFavorite')}</Text>
              </TouchableOpacity>
            </View>
          </CardContent>
        </Card>

        {/* Green diagonal corner with star for selected market */}
        {isSelected && (
          <View className="absolute top-0 right-0 w-0 h-0" style={{
            borderLeftWidth: 0,
            borderRightWidth: 60,
            borderBottomWidth: 60,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: '#10b981', // green-500
          }} {...({} as any)}>
            <View className="absolute top-1 right-1" {...({} as any)}>
              <Ionicons name="star" size={20} color="white" />
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}