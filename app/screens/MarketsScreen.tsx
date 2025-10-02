import React, { useEffect, useState } from 'react';
import {
  View,
  TextInput,
  Alert,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTranslation } from '../utils/localization';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useMarket } from '../contexts/MarketContext';
import AppHeader from '../components/AppHeader';
import AuthGuard from '../components/AuthGuard';
import MarketItem from '../components/MarketItem';
import { Text } from '../components/ui/text';
import { Market } from '../types/common/market';

export default function MarketsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { selectedMarket, setSelectedMarket } = useMarket();
  const { t } = useTranslation();

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
        (market.city && market.city.toLowerCase().includes(searchQuery.toLowerCase()))
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

  const renderMarketItem = ({ item }: { item: Market & { distance?: number } }) => (
    <MarketItem market={item} formatDistance={formatDistance} />
  );

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