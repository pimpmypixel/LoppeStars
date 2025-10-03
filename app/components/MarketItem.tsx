import React from 'react';
import { View, Pressable, Platform, ToastAndroid, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../utils/localization';
import { useAppStore } from '../stores/appStore';
import { Card, CardContent, Text } from './ui-kitten';
import { Market } from '../types/common/market';

interface MarketItemProps {
  market: Market & { distance?: number };
  formatDistance: (distance: number) => string;
}

export default function MarketItem({ market, formatDistance }: MarketItemProps) {
  const navigation = useNavigation<any>();
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
    startDate = new Date();
  }

  const isActive = now >= startDate && (!endDate || now <= endDate);

  const handlePress = () => {
    setSelectedMarket(market);
    navigation.navigate('MarketDetails', { market });
  };

  const handleMarkHere = () => {
    console.log('User marked as being at:', market.name);
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

  const handleAddFavorite = () => {
    console.log('Added to favorites:', market.name);
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
      android_ripple={{ color: 'rgba(0,0,0,0.1)' }} 
      style={styles.container}
    >
      {isSelected ? (
        <LinearGradient 
          colors={['#d1fae5', '#6ee7b7']} 
          style={styles.gradientWrapper}
        >
          <Card style={styles.selectedCard}>
            <CardContent>
              {/* Header with name, city and distance */}
              <View style={styles.header}>
                <View style={styles.nameSection}>
                  <View style={styles.nameRow}>
                    <Text style={styles.nameTextSelected} numberOfLines={2}>
                      {market.name}
                    </Text>
                    <View style={styles.selectedBadge}>
                      <Text style={styles.selectedBadgeText}>{t('markets.selected')}</Text>
                    </View>
                  </View>
                  {market.city && (
                    <Text style={styles.cityTextSelected}>{market.city}</Text>
                  )}
                </View>
                {market.distance && (
                  <View style={styles.distanceBadgeSelected}>
                    <Text style={styles.distanceTextSelected}>
                      {formatDistance(market.distance)}
                    </Text>
                  </View>
                )}
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
                <View style={styles.categoryTagSelected}>
                  <Text style={styles.categoryTagTextSelected}>
                    {t('markets.category', { defaultValue: language === 'da' ? 'Loppemarked' : 'Flea Market' })}
                  </Text>
                </View>
                {market.city && (
                  <View style={styles.cityTagSelected}>
                    <Text style={styles.cityTagTextSelected}>{market.city}</Text>
                  </View>
                )}
              </View>

              {/* Location and date info */}
              <View style={styles.infoRow}>
                <View style={styles.locationInfo}>
                  <Ionicons name="location-outline" size={14} color="#16a34a" />
                  <Text style={styles.locationTextSelected} numberOfLines={1}>
                    {market.address}{market.address && market.city ? ', ' : ''}{market.city}
                  </Text>
                </View>
                <View style={styles.dateInfo}>
                  <Ionicons name="calendar-outline" size={14} color="#16a34a" />
                  <Text style={styles.dateTextSelected}>{formatDate()}</Text>
                </View>
              </View>

              {/* Action buttons */}
              <View style={styles.buttonsRow}>
                <TouchableOpacity style={styles.hereButtonSelected} onPress={handleMarkHere}>
                  <Ionicons name="checkmark-circle-outline" size={16} color="white" />
                  <Text style={styles.hereButtonText}>{t('markets.here')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.favoriteButtonSelected} onPress={handleAddFavorite}>
                  <Ionicons name="heart-outline" size={16} color="#16a34a" />
                  <Text style={styles.favoriteButtonTextSelected}>{t('markets.addFavorite')}</Text>
                </TouchableOpacity>
              </View>
            </CardContent>
          </Card>
        </LinearGradient>
      ) : (
        <Card style={styles.card}>
          <CardContent>
            {/* Header with name, city and distance */}
            <View style={styles.header}>
              <View style={styles.nameSection}>
                <View style={styles.nameRow}>
                  <Text style={styles.nameText} numberOfLines={2}>
                    {market.name}
                  </Text>
                </View>
                {market.city && (
                  <Text style={styles.cityText}>{market.city}</Text>
                )}
              </View>
              {market.distance && (
                <View style={styles.distanceBadge}>
                  <Text style={styles.distanceText}>
                    {formatDistance(market.distance)}
                  </Text>
                </View>
              )}
            </View>

            {/* Tags */}
            <View style={styles.tagsRow}>
              {isActive && (
                <View style={styles.activeTag}>
                  <Text style={styles.activeTagText}>
                    {t('markets.active', { defaultValue: language === 'da' ? 'Aktiv' : 'Active' })}
                  </Text>
                </View>
              )}
              <View style={styles.categoryTag}>
                <Text style={styles.categoryTagText}>
                  {t('markets.category', { defaultValue: language === 'da' ? 'Loppemarked' : 'Flea Market' })}
                </Text>
              </View>
              {market.city && (
                <View style={styles.cityTag}>
                  <Text style={styles.cityTagText}>{market.city}</Text>
                </View>
              )}
            </View>

            {/* Location and date info */}
            <View style={styles.infoRow}>
              <View style={styles.locationInfo}>
                <Ionicons name="location-outline" size={14} color="#666" />
                <Text style={styles.locationText} numberOfLines={1}>
                  {market.address}{market.address && market.city ? ', ' : ''}{market.city}
                </Text>
              </View>
              <View style={styles.dateInfo}>
                <Ionicons name="calendar-outline" size={14} color="#666" />
                <Text style={styles.dateText}>{formatDate()}</Text>
              </View>
            </View>

            {/* Action buttons */}
            <View style={styles.buttonsRow}>
              <TouchableOpacity style={styles.hereButton} onPress={handleMarkHere}>
                <Ionicons name="checkmark-circle-outline" size={16} color="white" />
                <Text style={styles.hereButtonText}>{t('markets.here')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.favoriteButton} onPress={handleAddFavorite}>
                <Ionicons name="heart-outline" size={16} color="#374151" />
                <Text style={styles.favoriteButtonText}>{t('markets.addFavorite')}</Text>
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
    marginVertical: 8,
    marginHorizontal: 16,
  },
  gradientWrapper: {
    borderRadius: 12,
    padding: 1,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  selectedCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
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
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
    color: '#111827',
  },
  nameTextSelected: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
    color: '#166534',
  },
  selectedBadge: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  selectedBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cityText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
    color: '#4b5563',
  },
  cityTextSelected: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
    color: '#15803d',
  },
  distanceBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceBadgeSelected: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563eb',
  },
  distanceTextSelected: {
    fontSize: 14,
    fontWeight: '500',
    color: '#15803d',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  markedHereBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  markedHereBadgeText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: 'bold',
  },
  activeTag: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeTagSelected: {
    backgroundColor: '#bbf7d0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#15803d',
  },
  activeTagTextSelected: {
    fontSize: 12,
    fontWeight: '500',
    color: '#14532d',
  },
  categoryTag: {
    backgroundColor: '#fff7ed',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryTagSelected: {
    backgroundColor: '#fed7aa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#c2410c',
  },
  categoryTagTextSelected: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7c2d12',
  },
  cityTag: {
    backgroundColor: '#f9fafb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cityTagSelected: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cityTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  cityTagTextSelected: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
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
    color: '#4b5563',
  },
  locationTextSelected: {
    fontSize: 14,
    color: '#15803d',
  },
  dateText: {
    fontSize: 14,
    color: '#4b5563',
  },
  dateTextSelected: {
    fontSize: 14,
    color: '#15803d',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  hereButton: {
    flex: 1,
    backgroundColor: '#22c55e',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hereButtonSelected: {
    flex: 1,
    backgroundColor: '#16a34a',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hereButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 4,
  },
  favoriteButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButtonSelected: {
    flex: 1,
    backgroundColor: '#d1fae5',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButtonText: {
    color: '#374151',
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 4,
  },
  favoriteButtonTextSelected: {
    color: '#166534',
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 4,
  },
});
