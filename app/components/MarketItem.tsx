import React, { useEffect, useState } from 'react';
import { View, Pressable, Platform, ToastAndroid, StyleSheet, TouchableOpacity } from 'react-native';
// Remove LinearGradient to prevent crashes
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../utils/localization';
import { useAppStore } from '../stores/appStore';
import { useAuth } from '../contexts/AuthContext';
import { logEvent } from '../utils/eventLogger';
import { Card, CardContent, Text } from './ui-kitten';
import { Market } from '../types/common/market';
import { supabase } from '../utils/supabase';

interface MarketItemProps {
  market: Market & { distance?: number };
  formatDistance: (distance: number) => string;
}

interface RatingData {
  averageRating: number;
  ratingsCount: number;
}

export default function MarketItem({ market, formatDistance }: MarketItemProps) {
  const navigation = useNavigation<any>();
  const selectedMarket = useAppStore((state) => state.selectedMarket);
  const setSelectedMarket = useAppStore((state) => state.setSelectedMarket);
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const [ratingData, setRatingData] = useState<RatingData>({ averageRating: 0, ratingsCount: 0 });

  const isSelected = selectedMarket?.id === market.id;
  const isMarkedHere = isSelected; // Only selected market is marked as "here"

  // Decode HTML entities for proper Unicode display
  const decodeHtmlEntities = (text: string): string => {
    const entities: { [key: string]: string } = {
      '&#038;': '&',
      '&amp;': '&',
      '&#8211;': '–',
      '&ndash;': '–',
      '&#8212;': '—',
      '&mdash;': '—',
      '&nbsp;': ' ',
      '&quot;': '"',
      '&#39;': "'",
      '&apos;': "'",
      '&lt;': '<',
      '&gt;': '>',
    };
    return text.replace(/&#?\w+;/g, (match) => entities[match] || match);
  };

  const displayName = decodeHtmlEntities(market.name);

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
    startDate = new Date();
  }

  const isActive = now >= startDate && (!endDate || now <= endDate);

  useEffect(() => {
    fetchRatingData();
  }, [market.id]);

  const fetchRatingData = async () => {
    try {
      // Fetch both stall ratings and market ratings for this market
            const { data: ratings, error } = await supabase
        .from('ratings')
        .select('rating')
        .eq('market_id', market.id);

      if (error) {
        console.error('Error fetching ratings:', error);
        return;
      }

      if (ratings && ratings.length > 0) {
        // Calculate average rating from all ratings (both stall and market)
        const avgRating = ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length;
        setRatingData({
          averageRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
          ratingsCount: ratings.length
        });
      }
    } catch (error) {
      console.error('Error fetching rating data:', error);
    }
  };

  const handlePress = () => {
    setSelectedMarket(market);
    navigation.navigate('MarketDetails', { market });
  };

  const handleRateStall = () => {
    if (user) {
      navigation.navigate('Rating' as never);
    }
  };

  const handleMarkHere = async () => {
    console.log('User marked as being at:', market.name);
    setSelectedMarket(market); // This will make it the only selected market

    // Log event
    if (user?.id) {
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
    }

    if (Platform.OS === 'android') {
      ToastAndroid.showWithGravity(
        t('markets.markedHereToast', {
          defaultValue: language === 'da' ? 'Markeret er gemt som her!' : 'Market saved as here!'
        }),
        ToastAndroid.SHORT,
        ToastAndroid.BOTTOM
      );
    }
  };

  const handleAddFavorite = async () => {
    console.log('Added to favorites:', market.name);

    // Log event
    if (user?.id) {
      await logEvent(
        user.id,
        'market_favorited',
        'market',
        market.id,
        {
          market_name: market.name,
          market_city: market.city,
          favorited_at: new Date().toISOString(),
        }
      );
    }

    if (Platform.OS === 'android') {
      ToastAndroid.showWithGravity(
        t('markets.addFavoriteToast', {
          defaultValue: language === 'da' ? 'Markeret er tilføjet til favoritter!' : 'Market added to favorites!'
        }),
        ToastAndroid.SHORT,
        ToastAndroid.BOTTOM
      );
    }
  };

  const formatDate = () => {
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
      return t('markets.dateUnavailable', {
        defaultValue: language === 'da' ? 'Dato ikke tilgængelig' : 'Date unavailable'
      });
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      android_ripple={{ color: 'rgba(51, 102, 255, 0.3)' }}
      style={styles.container}
    >
      {isSelected ? (
        <View style={[styles.gradientWrapper, { backgroundColor: '#FF9500' }]}>
          <Card style={styles.selectedCard}>
            <CardContent>
              <View style={styles.header}>
                <View style={styles.nameSection}>
                  <View style={styles.nameRow}>
                    <Text style={styles.nameTextSelected} numberOfLines={2}>
                      {displayName}
                    </Text>
                    {/* <View style={styles.selectedBadge}>
                      <Text style={styles.selectedBadgeText}>{t('markets.selected')}</Text>
                    </View>
                  </View> */}
                   {/*  {market.city && (
                      <Text style={styles.cityTextSelected}>{market.city}</Text>
                    )} */}
                  </View>
                </View>
              </View>

              {/* Tags */}
              <View style={styles.tagsRow}>
                <View style={styles.markedHereBadge}>
                  <Text style={styles.markedHereBadgeText}>✓ {t('markets.markedHere')}</Text>
                </View>
                {isActive && (
                  <View style={styles.activeTagSelected}>
                    <Text style={styles.activeTagTextSelected}>
                      {t('markets.active', { defaultValue: language === 'da' ? 'Aktiv' : 'Active' })}
                    </Text>
                  </View>
                )}
                {/* <View style={styles.categoryTagSelected}>
                  <Text style={styles.categoryTagTextSelected}>
                    {t('markets.category', { defaultValue: language === 'da' ? 'Loppemarked' : 'Flea Market' })}
                  </Text>
                </View> */}
                {ratingData.ratingsCount > 0 && (
                  <View style={styles.ratingsTagSelected}>
                    <Ionicons name="star" size={12} color="#FFD700" />
                    <Text style={styles.ratingsTagTextSelected}>
                      {ratingData.averageRating} ({ratingData.ratingsCount})
                    </Text>
                  </View>
                )}
                {market.city && (
                  <View style={styles.cityTagSelected}>
                    <Text style={styles.cityTagTextSelected}>{market.city}</Text>
                  </View>
                )}
              </View>

            {/* Location and date info */}
            <View style={styles.infoRow}>
              <View style={styles.locationInfo}>
                <Ionicons name="location-outline" size={16} color="rgba(255, 255, 255, 0.9)" />
                <Text style={styles.locationTextSelected} numberOfLines={1}>
                  {market.address || market.city || t('markets.locationUnknown', { defaultValue: 'Address unknown' })}
                </Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <View style={styles.dateInfo}>
                <Ionicons name="calendar-outline" size={16} color="rgba(255, 255, 255, 0.9)" />
                <Text style={styles.dateTextSelected}>{formatDate()}</Text>
              </View>
              {market.distance !== undefined && (
                <View style={styles.distanceBadgeSelected}>
                  <Ionicons name="navigate-outline" size={14} color="rgba(255, 255, 255, 0.9)" style={{ marginRight: 4 }} />
                  <Text style={styles.distanceTextSelected}>
                    {formatDistance(market.distance)}
                  </Text>
                </View>
              )}
            </View>              {/* Action buttons */}
              <View style={styles.buttonsRow}>
                <TouchableOpacity style={styles.rateStallButtonSelected} onPress={handleRateStall}>
                  <Ionicons name="star" size={18} color="rgba(255, 255, 255, 0.9)" />
                  <Text style={styles.rateStallButtonTextSelected}>{t('markets.rateStall')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.detailsButton} onPress={handlePress}>
                  <Ionicons name="information-circle-outline" size={16} color="#FF9500" />
                  <Text style={styles.detailsButtonText}>{t('markets.details')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.favoriteButton} onPress={handleAddFavorite}>
                  <Ionicons name="heart-outline" size={16} color="#8F9BB3" />
                  <Text style={styles.favoriteButtonText}>{t('markets.favorite')}</Text>
                </TouchableOpacity>
              </View>
            </CardContent>
          </Card>
        </View>
      ) : (
        <Card style={{
          ...styles.card,
          ...(isMarkedHere ? styles.cardMarkedHere : {})
        }}>
          <CardContent>
            {/* Header with name, city and distance */}
            <View style={styles.header}>
              <View style={styles.nameSection}>
                <View style={styles.nameRow}>
                  <Text style={styles.nameText} numberOfLines={2}>
                    {displayName}
                  </Text>
                </View>
                {/* {market.city && (
                  <Text style={styles.cityText}>{market.city}</Text>
                )} */}
              </View>
              {market.distance !== undefined && (
                <View style={styles.distanceBadge}>
                  <Ionicons name="navigate-outline" size={14} color="#3366FF" style={{ marginRight: 4 }} />
                  <Text style={styles.distanceText}>
                    {formatDistance(market.distance)}
                  </Text>
                </View>
              )}
            </View>

            {/* Tags */}
            <View style={styles.tagsRow}>
              {isMarkedHere && (
                <View style={styles.markedHereBadge}>
                  <Text style={styles.markedHereBadgeText}>✓ {t('markets.markedHere')}</Text>
                </View>
              )}
              {isActive && (
                <View style={styles.activeTag}>
                  <Text style={styles.activeTagText}>
                    {t('markets.active', { defaultValue: language === 'da' ? 'Aktiv' : 'Active' })}
                  </Text>
                </View>
              )}
              {/* <View style={styles.categoryTag}>
                <Text style={styles.categoryTagText}>
                  {t('markets.category', { defaultValue: language === 'da' ? 'Loppemarked' : 'Flea Market' })}
                </Text>
              </View> */}
              {ratingData.ratingsCount > 0 && (
                <View style={styles.ratingsTag}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <Text style={styles.ratingsTagText}>
                    {ratingData.averageRating} ({ratingData.ratingsCount})
                  </Text>
                </View>
              )}
              {market.city && (
                <View style={styles.cityTag}>
                  <Text style={styles.cityTagText}>{market.city}</Text>
                </View>
              )}
            </View>

            {/* Location and date info */}
            <View style={styles.infoRow}>
              <View style={styles.locationInfo}>
                <Ionicons name="location-outline" size={16} color="#8F9BB3" />
                <Text style={styles.locationText} numberOfLines={1}>
                  {market.address || market.city || t('markets.locationUnknown', { defaultValue: 'Address unknown' })}
                </Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <View style={styles.dateInfo}>
                <Ionicons name="calendar-outline" size={16} color="#8F9BB3" />
                <Text style={styles.dateText}>{formatDate()}</Text>
              </View>
              {market.distance !== undefined && (
                <View style={styles.distanceBadge}>
                  <Ionicons name="navigate-outline" size={14} color="#3366FF" style={{ marginRight: 4 }} />
                  <Text style={styles.distanceText}>
                    {formatDistance(market.distance)}
                  </Text>
                </View>
              )}
            </View>

            {/* Action buttons */}
            <View style={styles.buttonsRow}>
              <TouchableOpacity style={styles.hereButton} onPress={handleMarkHere}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
                <Text style={styles.hereButtonText}>{t('markets.here')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.detailsButton} onPress={handlePress}>
                <Ionicons name="information-circle-outline" size={16} color="#FF9500" />
                <Text style={styles.detailsButtonText}>{t('markets.details')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.favoriteButton} onPress={handleAddFavorite}>
                <Ionicons name="heart-outline" size={16} color="#8F9BB3" />
                <Text style={styles.favoriteButtonText}>{t('markets.favorite')}</Text>
              </TouchableOpacity>
            </View>
          </CardContent>
        </Card>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    marginHorizontal: 0,
  },
  gradientWrapper: {
    borderRadius: 20,
    padding: 2,
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    borderRadius: 20,
    backgroundColor: '#292524',
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.15)',
  },
  cardMarkedHere: {
    borderWidth: 2,
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  selectedCard: {
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
    borderRadius: 20,
    backgroundColor: '#292524',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  nameSection: {
    flex: 1,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameText: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  nameTextSelected: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  selectedBadge: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
  },
  selectedBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cityText: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 6,
    color: '#8F9BB3',
  },
  cityTextSelected: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 6,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  distanceBadge: {
    backgroundColor: 'rgba(51, 102, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceBadgeSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3366FF',
  },
  distanceTextSelected: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  markedHereBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  markedHereBadgeText: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  activeTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  activeTagSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  activeTagText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: 0.3,
  },
  activeTagTextSelected: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  categoryTag: {
    backgroundColor: 'rgba(255, 195, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  categoryTagSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  categoryTagText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFC300',
    letterSpacing: 0.3,
  },
  categoryTagTextSelected: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.3,
  },
  cityTag: {
    backgroundColor: 'rgba(143, 155, 179, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  cityTagSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  cityTagText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8F9BB3',
    letterSpacing: 0.3,
    textTransform: 'capitalize',
  },
  cityTagTextSelected: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.3,
    textTransform: 'capitalize',
  },
  ratingsTag: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingsTagSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingsTagText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFD700',
    letterSpacing: 0.3,
  },
  ratingsTagTextSelected: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFD700',
    letterSpacing: 0.3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#8F9BB3',
    fontWeight: '500',
  },
  locationTextSelected: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  dateText: {
    fontSize: 14,
    color: '#8F9BB3',
    fontWeight: '500',
  },
  dateTextSelected: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  buttonsRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 6,
  },
  hereButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  detailsButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 149, 0, 0.3)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  hereButtonSelected: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  hereButtonText: {
    color: '#10B981',
    fontWeight: '600',
    fontSize: 13,
  },
  detailsButtonText: {
    color: '#FF9500',
    fontWeight: '600',
    fontSize: 13,
  },
  hereButtonTextSelected: {
    color: '#3366FF',
    fontWeight: '700',
    fontSize: 15,
    marginLeft: 6,
    letterSpacing: 0.3,
  },
  favoriteButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  favoriteButtonSelected: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButtonText: {
    color: '#8F9BB3',
    fontWeight: '600',
    fontSize: 13,
  },
  favoriteButtonTextSelected: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '700',
    fontSize: 15,
    marginLeft: 6,
    letterSpacing: 0.3,
  },
  rateStallButtonSelected: {
    flex: 1,
    backgroundColor: 'rgba(255, 149, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.4)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateStallButtonTextSelected: {
    color: '#FF9500',
    fontWeight: '700',
    fontSize: 15,
    marginLeft: 6,
    letterSpacing: 0.3,
  },
});
