import React from 'react';
import { View, ScrollView, TouchableOpacity, Alert, Text as RNText } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../utils/localization';
import { useAuth } from '../contexts/AuthContext';
import { useMarket } from '../contexts/MarketContext';
import { Button } from '../components/ui/button';
import { Text } from '../components/ui/text';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { reset } from '../utils/navigation';
import { Market } from '../types/common/market';

export default function MarketDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { setSelectedMarket } = useMarket();
  const { t } = useTranslation();

  const market: Market = route.params?.market;

  if (!market) {
    return (
      <View className="flex-1 bg-[#f5f5f5]" {...({} as any)}>
        <View className="flex-1 justify-center items-center" {...({} as any)}>
          <Text className="text-lg text-muted-foreground">{t('common.error')}</Text>
        </View>
      </View>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('da-DK', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString('da-DK', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  return (
    <View className="flex-1 bg-[#f5f5f5]" {...({} as any)}>
      <ScrollView className="flex-1" {...({} as any)}>
        <View className="p-5" {...({} as any)}>
          {/* Main Info Card */}
          <Card className="mb-4 bg-white shadow-sm" {...({} as any)}>
            <CardHeader {...({} as any)}>
              <CardTitle className="text-xl">{market.name}</CardTitle>
              {market.city && (
                <CardDescription className="text-base">
                  {market.city}
                  {market.municipality && `, ${market.municipality}`}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent {...({} as any)}>
              {market.description && (
                <Text className="text-gray-700 mb-4 leading-6">
                  {market.description}
                </Text>
              )}

              {/* Location */}
              {(market.address || market.city) && (
                <View className="flex-row items-start mb-4" {...({} as any)}>
                  <Ionicons name="location-outline" size={20} color="#666" className="mt-1 mr-3" />
                  <View className="flex-1" {...({} as any)}>
                    <Text className="text-gray-900 font-medium mb-1">
                      {t('markets.location')}
                    </Text>
                    <Text className="text-gray-600">
                      {market.address && `${market.address}, `}
                      {market.city}
                      {market.postal_code && ` ${market.postal_code}`}
                    </Text>
                    {market.distance && (
                      <Text className="text-blue-600 text-sm mt-1">
                        {formatDistance(market.distance)} {t('markets.away')}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {/* Date & Time */}
              <View className="flex-row items-start mb-4" {...({} as any)}>
                <Ionicons name="calendar-outline" size={20} color="#666" className="mt-1 mr-3" />
                <View className="flex-1" {...({} as any)}>
                  <Text className="text-gray-900 font-medium mb-1">
                    {t('markets.dateTime')}
                  </Text>
                  <Text className="text-gray-600">
                    {formatDate(market.start_date)}
                  </Text>
                  {market.end_date && new Date(market.end_date).toDateString() !== new Date(market.start_date).toDateString() ? (
                    <Text className="text-gray-600">
                      - {formatDate(market.end_date)}
                    </Text>
                  ) : null}
                  {market.opening_hours && (
                    <Text className="text-gray-600 text-sm mt-1">
                      {market.opening_hours}
                    </Text>
                  )}
                </View>
              </View>

              {/* Category */}
              <View className="flex-row items-center mb-4" {...({} as any)}>
                <Ionicons name="pricetag-outline" size={20} color="#666" className="mr-3" />
                <View {...({} as any)}>
                  <Text className="text-gray-900 font-medium">
                    {t('markets.category')}
                  </Text>
                  <Text className="text-gray-600">{market.category}</Text>
                </View>
              </View>

              {/* Features */}
              <View className="mb-4" {...({} as any)}>
                <Text className="text-gray-900 font-medium mb-2">
                  {t('markets.features')}
                </Text>
                <View className="flex-row flex-wrap gap-2" {...({} as any)}>
                  {market.has_food && (
                    <View className="bg-green-50 px-3 py-1 rounded-full" {...({} as any)}>
                      <Text className="text-green-700 text-sm">🍽️ {t('markets.food')}</Text>
                    </View>
                  )}
                  {market.has_parking && (
                    <View className="bg-blue-50 px-3 py-1 rounded-full" {...({} as any)}>
                      <Text className="text-blue-700 text-sm">🚗 {t('markets.parking')}</Text>
                    </View>
                  )}
                  {market.has_toilets && (
                    <View className="bg-purple-50 px-3 py-1 rounded-full" {...({} as any)}>
                      <Text className="text-purple-700 text-sm">🚻 {t('markets.toilets')}</Text>
                    </View>
                  )}
                  {market.has_wifi && (
                    <View className="bg-indigo-50 px-3 py-1 rounded-full" {...({} as any)}>
                      <Text className="text-indigo-700 text-sm">📶 {t('markets.wifi')}</Text>
                    </View>
                  )}
                  {market.is_indoor && (
                    <View className="bg-orange-50 px-3 py-1 rounded-full" {...({} as any)}>
                      <Text className="text-orange-700 text-sm">🏠 {t('markets.indoor')}</Text>
                    </View>
                  )}
                  {market.is_outdoor && (
                    <View className="bg-cyan-50 px-3 py-1 rounded-full" {...({} as any)}>
                      <Text className="text-cyan-700 text-sm">🌳 {t('markets.outdoor')}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Additional Info */}
              {(market.entry_fee || market.stall_count) && (
                <View className="mb-4" {...({} as any)}>
                  <Text className="text-gray-900 font-medium mb-2">
                    {t('markets.additionalInfo')}
                  </Text>
                  {market.entry_fee && (
                    <Text className="text-gray-600 mb-1">
                      {t('markets.entryFee')}: {market.entry_fee} DKK
                    </Text>
                  )}
                  {market.stall_count && (
                    <Text className="text-gray-600">
                      {t('markets.stallCount')}: {market.stall_count}
                    </Text>
                  )}
                </View>
              )}

              {/* Organizer Info */}
              {(market.organizer_name || market.organizer_phone || market.organizer_email) && (
                <View className="mb-4" {...({} as any)}>
                  <Text className="text-gray-900 font-medium mb-2">
                    {t('markets.organizer')}
                  </Text>
                  {market.organizer_name && (
                    <Text className="text-gray-600 mb-1">{market.organizer_name}</Text>
                  )}
                  {market.organizer_phone && (
                    <Text className="text-gray-600 mb-1">📞 {market.organizer_phone}</Text>
                  )}
                  {market.organizer_email && (
                    <Text className="text-gray-600 mb-1">✉️ {market.organizer_email}</Text>
                  )}
                  {market.organizer_website && (
                    <Text className="text-gray-600">🌐 {market.organizer_website}</Text>
                  )}
                </View>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <View className="flex-row gap-3 mb-6" {...({} as any)}>
            <TouchableOpacity
              className="flex-1 bg-green-500 rounded-lg py-3 px-4 flex-row items-center justify-center"
              onPress={() => {
                // Handle "Vi er her" action - silent
                console.log('User marked as being at:', market.name);
              }}
              {...({} as any)}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="white" />
              <Text className="text-white font-medium text-base ml-2">{t('markets.here')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-gray-100 rounded-lg py-3 px-4 flex-row items-center justify-center border border-gray-200"
              onPress={() => {
                // Handle "Tilføj favorit" action - silent
                console.log('Added to favorites:', market.name);
              }}
              {...({} as any)}
            >
              <Ionicons name="heart-outline" size={20} color="#374151" />
              <Text className="text-gray-700 font-medium text-base ml-2">{t('markets.addFavorite')}</Text>
            </TouchableOpacity>
          </View>

          {/* Rate Stall Button */}
          <TouchableOpacity
            className="bg-blue-500 rounded-lg py-4 px-6 flex-row items-center justify-center mb-4"
            onPress={async () => {
              try {
                // Store the selected market globally
                setSelectedMarket(market);
                // Use navigation service to reset to Rating tab
                reset([{ name: 'Rating' }]);
              } catch (error) {
                console.error('Error selecting market for rating:', error);
                // Removed alert dialog - silent failure
              }
            }}
            {...({} as any)}
          >
            <Ionicons name="star-outline" size={20} color="white" />
            <RNText style={{ color: 'white', fontWeight: 'bold', fontSize: 18, marginLeft: 8 }}>
              {t('markets.rateStall') || 'Rate a Stall'}
            </RNText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}