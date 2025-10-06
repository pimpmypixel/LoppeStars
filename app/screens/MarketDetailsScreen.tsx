import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Text as RNText, StyleSheet, Image, Dimensions, Linking, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Star } from 'lucide-react-native';
import { useTranslation } from '../utils/localization';
import { useAuth } from '../contexts/AuthContext';
import { useMarket } from '../contexts/MarketContext';
import { Card, CardContent, CardHeader, CardTitle, Text } from '../components/ui-kitten';
import { reset } from '../utils/navigation';
import { Market } from '../types/common/market';
import { supabase } from '../utils/supabase';
import { logEvent } from '../utils/eventLogger';

// Try to import MapView, but make it optional
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;

try {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
} catch (e) {
  console.log('react-native-maps not available, map will be hidden');
}

const { width } = Dimensions.get('window');

interface StallRating {
  id: string;
  stall_name: string;
  rating: number;
  photo_url?: string;
  mobilepay_phone: string;
  created_at: string;
  user_id: string;
}

export default function MarketDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { selectedMarket, setSelectedMarket } = useMarket();
  const { t } = useTranslation();

  const market: Market = route.params?.market;
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [stallRatings, setStallRatings] = useState<StallRating[]>([]);
  const [loadingRatings, setLoadingRatings] = useState(true);
  const [averageRating, setAverageRating] = useState<number | null>(null);

  // Load stall ratings for this market
  useEffect(() => {
    loadStallRatings();
  }, [market?.id]);

  const loadStallRatings = async () => {
    if (!market?.id) return;

    try {
      setLoadingRatings(true);
      const { data, error } = await supabase
        .from('stall_ratings')
        .select('*')
        .eq('market_id', market.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const ratings = data || [];
      setStallRatings(ratings);

      // Calculate average rating
      if (ratings.length > 0) {
        const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
        setAverageRating(avg);
      }
    } catch (error) {
      console.error('Error loading stall ratings:', error);
    } finally {
      setLoadingRatings(false);
    }
  };

  if (!market) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('common.error')}</Text>
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

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return '#10B981'; // green
    if (rating >= 6) return '#FFCA28'; // yellow
    return '#EF4444'; // red
  };

  const handleCheckIn = async () => {
    if (!user?.id) return;

    setIsCheckedIn(true);
    setSelectedMarket(market);

    // Log check-in event
    await logEvent(
      user.id,
      'market_marked_here',
      'market',
      market.id,
      {
        market_name: market.name,
        market_city: market.city,
        market_address: market.address,
        marked_at: new Date().toISOString(),
      }
    );
  };

  const openInMaps = () => {
    if (!market.latitude || !market.longitude) return;

    const scheme = Platform.select({
      ios: 'maps:0,0?q=',
      android: 'geo:0,0?q=',
    });
    const latLng = `${market.latitude},${market.longitude}`;
    const label = encodeURIComponent(market.name);
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });

    if (url) {
      Linking.openURL(url);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header Image / Map */}
        {MapView && market.latitude && market.longitude ? (
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={{
                latitude: market.latitude,
                longitude: market.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              <Marker
                coordinate={{
                  latitude: market.latitude,
                  longitude: market.longitude,
                }}
                title={market.name}
              />
            </MapView>
            <TouchableOpacity style={styles.mapOverlay} onPress={openInMaps}>
              <Ionicons name="navigate-outline" size={20} color="#FFFFFF" />
              <Text style={styles.mapOverlayText}>{t('markets.viewOnMap')}</Text>
            </TouchableOpacity>
          </View>
        ) : market.latitude && market.longitude ? (
          <View style={styles.mapPlaceholder}>
            <TouchableOpacity style={styles.mapPlaceholderButton} onPress={openInMaps}>
              <Ionicons name="map-outline" size={32} color="#FF9500" />
              <Text style={styles.mapPlaceholderText}>{t('markets.viewOnMap')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.content}>
          {/* Market Header */}
          <View style={styles.header}>
            <Text style={styles.marketName}>{market.name}</Text>
            {market.address && (
              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={16} color="#8F9BB3" />
                <Text style={styles.addressText}>
                  {market.address}, {market.city}
                </Text>
              </View>
            )}
          </View>

          {/* Stats Bar */}
          <View style={styles.statsBar}>
            {market.opening_hours && (
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={18} color="#FF9500" />
                <View style={styles.statTextContainer}>
                  <Text style={styles.statLabel}>{t('markets.openingHours')}</Text>
                  <Text style={styles.statValue}>{market.opening_hours}</Text>
                </View>
              </View>
            )}
            {averageRating !== null && (
              <View style={styles.statItem}>
                <Star size={18} color="#FFCA28" fill="#FFCA28" />
                <View style={styles.statTextContainer}>
                  <Text style={styles.statLabel}>{t('markets.averageRating')}</Text>
                  <Text style={styles.statValue}>{averageRating.toFixed(1)} ({stallRatings.length})</Text>
                </View>
              </View>
            )}
          </View>

          {/* Check In Button */}
          <TouchableOpacity
            style={[
              styles.checkInButton,
              isCheckedIn && styles.checkInButtonActive
            ]}
            onPress={handleCheckIn}
            disabled={isCheckedIn}
          >
            <Ionicons 
              name={isCheckedIn ? "checkmark-circle" : "checkmark-circle-outline"} 
              size={24} 
              color={isCheckedIn ? "#10B981" : "#FF9500"} 
            />
            <Text style={
              isCheckedIn ? styles.checkInButtonTextActive : styles.checkInButtonText
            }>
              {isCheckedIn ? t('markets.checkedIn') : t('markets.checkInHere')}
            </Text>
          </TouchableOpacity>

          {/* Date & Info */}
          <Card style={styles.infoCard}>
            <CardContent>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={20} color="#FF9500" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>{t('markets.dateTime')}</Text>
                  <Text style={styles.infoValue}>{formatDate(market.start_date)}</Text>
                </View>
              </View>

              {market.category && (
                <View style={styles.infoRow}>
                  <Ionicons name="pricetag-outline" size={20} color="#FF9500" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>{t('markets.category')}</Text>
                    <Text style={styles.infoValue}>{market.category}</Text>
                  </View>
                </View>
              )}

              {/* Features */}
              <View style={styles.featuresRow}>
                {market.has_food && (
                  <View style={styles.featureBadge}>
                    <Text style={styles.featureBadgeText}>🍽️</Text>
                  </View>
                )}
                {market.has_parking && (
                  <View style={styles.featureBadge}>
                    <Text style={styles.featureBadgeText}>🚗</Text>
                  </View>
                )}
                {market.has_toilets && (
                  <View style={styles.featureBadge}>
                    <Text style={styles.featureBadgeText}>🚻</Text>
                  </View>
                )}
                {market.has_wifi && (
                  <View style={styles.featureBadge}>
                    <Text style={styles.featureBadgeText}>📶</Text>
                  </View>
                )}
              </View>
            </CardContent>
          </Card>

          {/* Stall Ratings Section */}
          <View style={styles.ratingsSection}>
            <Text style={styles.sectionTitle}>{t('markets.stallRatings')}</Text>
            {loadingRatings ? (
              <Card style={styles.ratingCard}>
                <CardContent>
                  <Text style={styles.loadingText}>Loading...</Text>
                </CardContent>
              </Card>
            ) : stallRatings.length === 0 ? (
              <Card style={styles.ratingCard}>
                <CardContent>
                  <Text style={styles.noRatingsText}>{t('markets.noRatings')}</Text>
                </CardContent>
              </Card>
            ) : (
              stallRatings.map((rating) => (
                <Card key={rating.id} style={styles.ratingCard}>
                  <CardContent>
                    <View style={styles.ratingHeader}>
                      <View style={styles.ratingHeaderLeft}>
                        <Text style={styles.stallName}>{rating.stall_name}</Text>
                        <Text style={styles.ratingDate}>
                          {new Date(rating.created_at).toLocaleDateString('da-DK', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </Text>
                      </View>
                      <View style={styles.ratingBadge}>
                        <Star size={14} color={getRatingColor(rating.rating)} fill={getRatingColor(rating.rating)} />
                        <Text style={{ ...styles.ratingValue, color: getRatingColor(rating.rating) }}>
                          {rating.rating}/10
                        </Text>
                      </View>
                    </View>

                    {rating.photo_url && (
                      <Image
                        source={{ uri: rating.photo_url }}
                        style={styles.ratingPhoto}
                        resizeMode="cover"
                      />
                    )}

                    <View style={styles.ratingStars}>
                      {Array.from({ length: rating.rating }, (_, i) => (
                        <Star
                          key={i}
                          size={14}
                          color={getRatingColor(rating.rating)}
                          fill={getRatingColor(rating.rating)}
                        />
                      ))}
                    </View>
                  </CardContent>
                </Card>
              ))
            )}
          </View>

          {/* Rate Stall Button */}
          <TouchableOpacity
            style={styles.rateStallButton}
            onPress={async () => {
              try {
                setSelectedMarket(market);
                // Use safer navigation instead of reset
                navigation.navigate('Rating' as never);
              } catch (error) {
                console.error('Error selecting market for rating:', error);
              }
            }}
          >
            <Ionicons name="star" size={20} color="#FFFFFF" />
            <Text style={styles.rateStallButtonText}>{t('markets.rateStall')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1917',
  },
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#8F9BB3',
  },
  mapContainer: {
    height: 200,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#FF9500',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  mapOverlayText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  mapPlaceholder: {
    height: 200,
    backgroundColor: '#292524',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderButton: {
    alignItems: 'center',
    gap: 8,
  },
  mapPlaceholderText: {
    color: '#FF9500',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  marketName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addressText: {
    fontSize: 14,
    color: '#8F9BB3',
    fontWeight: '500',
  },
  statsBar: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    backgroundColor: '#292524',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.15)',
  },
  statTextContainer: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: '#8F9BB3',
    fontWeight: '500',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  checkInButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FF9500',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  checkInButtonActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10B981',
  },
  checkInButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF9500',
    letterSpacing: 0.3,
  },
  checkInButtonTextActive: {
    color: '#10B981',
  },
  infoCard: {
    backgroundColor: '#292524',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.15)',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#8F9BB3',
    fontWeight: '500',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  featuresRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  featureBadge: {
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  featureBadgeText: {
    fontSize: 18,
  },
  ratingsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  ratingCard: {
    backgroundColor: '#292524',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.15)',
  },
  loadingText: {
    fontSize: 14,
    color: '#8F9BB3',
    textAlign: 'center',
  },
  noRatingsText: {
    fontSize: 14,
    color: '#8F9BB3',
    textAlign: 'center',
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingHeaderLeft: {
    flex: 1,
  },
  stallName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  ratingDate: {
    fontSize: 12,
    color: '#8F9BB3',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  ratingPhoto: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#1C1917',
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 4,
  },
  rateStallButton: {
    backgroundColor: '#FF9500',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 8,
    marginBottom: 24,
  },
  rateStallButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});