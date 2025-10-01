import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { t } from '../utils/localization';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useMarket } from '../contexts/MarketContext';
import AppHeader from '../components/AppHeader';
import AuthGuard from '../components/AuthGuard';
import { Button } from '../components/ui/button';
import { Text } from '../components/ui/text';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Market, MarketLocation } from '../types/common/market';

export default function MarketsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { selectedMarket, setSelectedMarket } = useMarket();

  const [markets, setMarkets] = useState<Market[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMarkets, setFilteredMarkets] = useState<Market[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMarkets();
    requestLocationPermission();
  }, []);

  useEffect(() => {
    filterMarkets();
  }, [markets, searchQuery, userLocation]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('location.permissionRequired'),
          t('location.permissionMessage')
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert(t('common.error'), t('location.locationError'));
    }
  };

  const loadMarkets = async () => {
    try {
      setIsLoading(true);

      // Query the database for markets
      const { data: marketsData, error } = await supabase
        .from('markets')
        .select('*')
        .order('start_date', { ascending: true })
        .limit(50);

      if (error) {
        console.error('Database error:', error);
        Alert.alert(t('common.error'), 'Kunne ikke hente markeder fra databasen');
        return;
      }

      if (marketsData) {
        setMarkets(marketsData);
      }

    } catch (error) {
      console.error('Load markets error:', error);
      Alert.alert(t('common.error'), t('markets.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in km
    return distance;
  };

  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  const filterMarkets = () => {
    let filtered = [...markets];

    if (searchQuery) {
      filtered = filtered.filter(market =>
        market.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (market.city?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
      );
    }

    // Sort by distance if user location is available
    if (userLocation) {
      filtered = filtered.map(market => ({
        ...market,
        distance: market.latitude && market.longitude ? calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          market.latitude,
          market.longitude
        ) : undefined,
      })).sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    }

    setFilteredMarkets(filtered);
  };

  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  const debouncedSearch = debounce((query: string) => {
    setSearchQuery(query);
  }, 300);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMarkets();
    setRefreshing(false);
  };

  const renderMarketItem = ({ item }: { item: Market & { distance?: number } }) => {
    const isSelected = selectedMarket?.id === item.id;
    
    // Check if market is currently active
    const now = new Date();
    const startDate = new Date(item.start_date);
    const endDate = item.end_date ? new Date(item.end_date) : null;
    const isActive = now >= startDate && (!endDate || now <= endDate);

    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedMarket(item);
          navigation.navigate('MarketDetails', { market: item });
        }}
        activeOpacity={0.7}
        {...({} as any)}
      >
        <View className="relative" {...({} as any)}>
          <Card className="mb-4 mx-4 bg-white shadow-sm" {...({} as any)}>
            <CardContent className="px-4">
            {/* Header with name, city and distance */}
            <View className="flex-row justify-between items-start mb-2" {...({} as any)}>
              <View className="flex-1 mr-2" {...({} as any)}>
                <Text className="text-lg font-semibold text-gray-900 flex-1 mr-2" numberOfLines={2}>
                  {item.name}
                </Text>
                {item.city && (
                  <Text className="text-sm text-gray-600 font-medium mt-1">
                    {item.city}
                  </Text>
                )}
              </View>
              {item.distance && (
                <View className="bg-blue-50 px-2 py-1 rounded-full" {...({} as any)}>
                  <Text className="text-sm text-blue-600 font-medium">
                    {formatDistance(item.distance)}
                  </Text>
                </View>
              )}
            </View>

            {/* Tags */}
            <View className="flex-row flex-wrap gap-2 mb-3" {...({} as any)}>
              {isActive && (
                <View className="bg-green-50 px-2 py-1 rounded-full" {...({} as any)}>
                  <Text className="text-xs text-green-700 font-medium">Aktiv</Text>
                </View>
              )}
              <View className="bg-orange-50 px-2 py-1 rounded-full" {...({} as any)}>
                <Text className="text-xs text-orange-700 font-medium">Loppemarked</Text>
              </View>
              {item.city && (
                <View className="bg-gray-50 px-2 py-1 rounded-full" {...({} as any)}>
                  <Text className="text-xs text-gray-700 font-medium">{item.city}</Text>
                </View>
              )}
            </View>

            {/* Location and date info */}
            <View className="flex-row justify-between items-center mb-4" {...({} as any)}>
              <View className="flex-row items-center gap-1 flex-1" {...({} as any)}>
                <Ionicons name="location-outline" size={14} color="#666" />
                <Text className="text-sm text-gray-600" numberOfLines={1}>
                  {item.address}, {item.city}
                </Text>
              </View>
              <View className="flex-row items-center gap-1 ml-2" {...({} as any)}>
                <Ionicons name="calendar-outline" size={14} color="#666" />
                <Text className="text-sm text-gray-600">
                  {new Date(item.start_date).toLocaleDateString('da-DK', {
                    day: 'numeric',
                    month: 'short'
                  })}
                  {item.end_date && new Date(item.end_date).toDateString() !== new Date(item.start_date).toDateString() &&
                    ` - ${new Date(item.end_date).toLocaleDateString('da-DK', {
                      day: 'numeric',
                      month: 'short'
                    })}`
                  }
                </Text>
              </View>
            </View>

            {/* Action buttons */}
            <View className="flex-row gap-2" {...({} as any)}>
              <TouchableOpacity
                className="flex-1 bg-green-500 rounded-lg py-2 px-3 flex-row items-center justify-center"
                onPress={() => {
                  // Handle "Vi er her" action - silent
                  console.log('User marked as being at:', item.name);
                }}
                {...({} as any)}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color="white" />
                <Text className="text-white font-medium text-sm ml-1">Vi er her</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 bg-gray-100 rounded-lg py-2 px-3 flex-row items-center justify-center border border-gray-200"
                onPress={() => {
                  // Handle "Tilføj favorit" action - silent
                  console.log('Added to favorites:', item.name);
                }}
                {...({} as any)}
              >
                <Ionicons name="heart-outline" size={16} color="#374151" />
                <Text className="text-gray-700 font-medium text-sm ml-1">Tilføj favorit</Text>
              </TouchableOpacity>
            </View>
          </CardContent>
        </Card>

        {/* Green diagonal corner with star for selected market */}
        {isSelected && isActive && (
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
  };

  return (
    <AuthGuard>
      <View className="flex-1 bg-[#f5f5f5]" {...({} as any)}>
        <AppHeader title={t('markets.title')} />

        <View className="flex-1" {...({} as any)}>
          {/* Search Bar */}
          <View className="px-5 py-3 bg-white border-b border-gray-200" {...({} as any)}>
            <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2" {...({} as any)}>
              <Ionicons name="search-outline" size={20} color="#666" />
              <TextInput
                className="flex-1 ml-2 text-base"
                placeholder={t('markets.searchPlaceholder')}
                onChangeText={debouncedSearch}
                {...({} as any)}
              />
            </View>
          </View>

          {/* Markets List */}
          {isLoading ? (
            <View className="flex-1 justify-center items-center" {...({} as any)}>
              <Text className="text-lg text-muted-foreground">{t('common.loading')}</Text>
            </View>
          ) : (
            <FlatList
              data={filteredMarkets}
              renderItem={renderMarketItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 20 }}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListEmptyComponent={
                <View className="flex-1 justify-center items-center py-16" {...({} as any)}>
                  <Ionicons name="storefront-outline" size={48} color="#ccc" />
                  <Text className="text-lg text-muted-foreground mt-4 text-center">
                    {t('markets.noMarkets')}
                  </Text>
                </View>
              }
              {...({} as any)}
            />
          )}
        </View>
      </View>
    </AuthGuard>
  );
}