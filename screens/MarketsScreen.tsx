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
import { t } from '../utils/localization';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import AppHeader from '../components/AppHeader';
import AuthGuard from '../components/AuthGuard';
import { Button } from '../components/ui/button';
import { Text } from '../components/ui/text';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';

// Types
interface MarketLocation {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  postalCode: string;
}

interface Market {
  id: string;
  name: string;
  description: string;
  location: MarketLocation;
  startDate: string;
  endDate: string;
  isActive: boolean;
  stalls: any[];
  distance?: number;
}

export default function MarketsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

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

      // For now, use mock data until backend is ready
      const mockMarkets: Market[] = [
        {
          id: '1',
          name: 'Frederiksberg Loppemarked',
          description: 'Stort loppemarked med mange spændende boder',
          location: {
            latitude: 55.6761,
            longitude: 12.5683,
            address: 'Frederiksberg Allé 1',
            city: 'Frederiksberg',
            postalCode: '2000',
          },
          startDate: '2025-09-26T08:00:00Z',
          endDate: '2025-09-26T16:00:00Z',
          isActive: true,
          stalls: [],
        },
        {
          id: '2',
          name: 'Nørrebro Genbrugsloppemarked',
          description: 'Bæredygtigt loppemarked med unikke fund',
          location: {
            latitude: 55.6867,
            longitude: 12.5700,
            address: 'Nørrebrogade 100',
            city: 'København N',
            postalCode: '2200',
          },
          startDate: '2025-09-27T09:00:00Z',
          endDate: '2025-09-27T15:00:00Z',
          isActive: true,
          stalls: [],
        },
        {
          id: '3',
          name: 'Amager Strand Loppemarked',
          description: 'Loppemarked ved stranden med hyggelig stemning',
          location: {
            latitude: 55.6586,
            longitude: 12.6232,
            address: 'Amager Strandpark',
            city: 'København S',
            postalCode: '2300',
          },
          startDate: '2025-09-28T10:00:00Z',
          endDate: '2025-09-28T17:00:00Z',
          isActive: true,
          stalls: [],
        },
      ];

      setMarkets(mockMarkets);

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
        market.location.city.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort by distance if user location is available
    if (userLocation) {
      filtered = filtered.map(market => ({
        ...market,
        distance: calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          market.location.latitude,
          market.location.longitude
        ),
      })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
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
    <Card className="mb-3" {...({} as any)}>
      <CardHeader>
        <View className="flex-row justify-between items-center" {...({} as any)}>
          <CardTitle className="text-lg font-semibold flex-1">{item.name}</CardTitle>
          {item.distance && (
            <Text className="text-sm text-blue-600 font-medium">
              {formatDistance(item.distance)}
            </Text>
          )}
        </View>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm text-muted-foreground mb-3">
          {item.description}
        </CardDescription>

        <View className="flex-row justify-between items-center" {...({} as any)}>
          <View className="flex-row items-center gap-1" {...({} as any)}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text className="text-sm text-muted-foreground">{item.location.city}</Text>
          </View>

          <View className="flex-row items-center gap-1" {...({} as any)}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text className="text-sm text-muted-foreground">
              {new Date(item.startDate).toLocaleDateString('da-DK', {
                day: 'numeric',
                month: 'short',
              })}
            </Text>
          </View>
        </View>
      </CardContent>
    </Card>
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