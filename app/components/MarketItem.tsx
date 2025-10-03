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
      android_ripple={{ color: 'rgba(51, 102, 255, 0.3)' }} 
      style={styles.container}
    >
      {isSelected ? (
        <LinearGradient 
          colors={['#FF9500', '#FFCA28']} 
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
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
                  <Ionicons name="location-outline" size={16} color="rgba(255, 255, 255, 0.9)" />
                  <Text style={styles.locationTextSelected} numberOfLines={1}>
                    {market.address}{market.address && market.city ? ', ' : ''}{market.city}
                  </Text>
                </View>
                <View style={styles.dateInfo}>
                  <Ionicons name="calendar-outline" size={16} color="rgba(255, 255, 255, 0.9)" />
                  <Text style={styles.dateTextSelected}>{formatDate()}</Text>
                </View>
              </View>

              {/* Action buttons */}
              <View style={styles.buttonsRow}>
                <TouchableOpacity style={styles.hereButtonSelected} onPress={handleMarkHere}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#3366FF" />
                  <Text style={styles.hereButtonTextSelected}>{t('markets.here')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.favoriteButtonSelected} onPress={handleAddFavorite}>
                  <Ionicons name="heart-outline" size={18} color="rgba(255, 255, 255, 0.9)" />
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
                <Ionicons name="location-outline" size={16} color="#8F9BB3" />
                <Text style={styles.locationText} numberOfLines={1}>
                  {market.address}{market.address && market.city ? ', ' : ''}{market.city}
                </Text>
              </View>
              <View style={styles.dateInfo}>
                <Ionicons name="calendar-outline" size={16} color="#8F9BB3" />
                <Text style={styles.dateText}>{formatDate()}</Text>
              </View>
            </View>

            {/* Action buttons */}
            <View style={styles.buttonsRow}>
              <TouchableOpacity style={styles.hereButton} onPress={handleMarkHere}>
                <Ionicons name="checkmark-circle-outline" size={18} color="white" />
                <Text style={styles.hereButtonText}>{t('markets.here')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.favoriteButton} onPress={handleAddFavorite}>
                <Ionicons name="heart-outline" size={18} color="#8F9BB3" />
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
  },
  distanceBadgeSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
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
  },
  cityTagTextSelected: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.8)',
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
    gap: 8,
  },
  hereButton: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    marginLeft: 6,
    letterSpacing: 0.3,
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
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '700',
    fontSize: 15,
    marginLeft: 6,
    letterSpacing: 0.3,
  },
  favoriteButtonTextSelected: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '700',
    fontSize: 15,
    marginLeft: 6,
    letterSpacing: 0.3,
  },
});
