import React, { useEffect, useState } from 'react';
import {
  View,
  TextInput,
  Alert,
  RefreshControl,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTranslation } from '../utils/localization';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useMarket } from '../contexts/MarketContext';
import { useAppStore } from '../stores/appStore';
import { Layout } from '@ui-kitten/components';
import AppHeader from '../components/AppHeader';
import AuthGuard from '../components/AuthGuard';
import MarketItem from '../components/MarketItem';
import { Text } from '../components/ui-kitten';
import { Market } from '../types/common/market';

export default function MarketsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { selectedMarket, setSelectedMarket } = useMarket();
  const selectedMarketFromStore = useAppStore((state) => state.selectedMarket);
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
  }, [markets, searchQuery, userLocation, selectedMarketFromStore]);

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

      // Query the database for markets with ratings count
      const { data: marketsData, error } = await supabase
        .from('markets')
        .select(`
          *,
          ratings_count:stall_ratings(count)
        `)
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

    // Add distance calculation if user location is available
    if (userLocation) {
      filtered = filtered.map(market => ({
        ...market,
        distance: market.latitude && market.longitude ? calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          market.latitude,
          market.longitude
        ) : undefined,
      }));
    }

    // Sort: selected market first, then by distance if available, then by start date
    filtered.sort((a, b) => {
      // Selected market always comes first
      if (selectedMarketFromStore?.id === a.id) return -1;
      if (selectedMarketFromStore?.id === b.id) return 1;
      
      // Then sort by distance if available
      if (userLocation && a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      
      // Fall back to sorting by start date
      return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
    });

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
      <Layout style={styles.container} level="1">
        <AppHeader title={t('markets.title')} />

        <View style={styles.content}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={20} color="#8F9BB3" />
              <TextInput
                style={styles.searchInput}
                placeholder={t('markets.searchPlaceholder')}
                placeholderTextColor="#8F9BB3"
                onChangeText={debouncedSearch}
              />
            </View>
          </View>

          {/* Markets List */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>{t('common.loading')}</Text>
            </View>
          ) : (
            <FlatList
              data={filteredMarkets}
              extraData={selectedMarketFromStore}
              renderItem={renderMarketItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="storefront-outline" size={48} color="#ccc" />
                  <Text style={styles.emptyText}>
                    {t('markets.noMarkets')}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </Layout>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1917',
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#292524',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 149, 0, 0.15)',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1917',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.2)',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1917',
  },
  loadingText: {
    fontSize: 18,
    color: '#8F9BB3',
  },
  listContent: {
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    color: '#8F9BB3',
    marginTop: 16,
    textAlign: 'center',
  },
});