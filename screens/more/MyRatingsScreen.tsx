import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../utils/supabase';
import { t } from '../../utils/localization';
import AppHeader from '../../components/AppHeader';
import AppFooter from '../../components/AppFooter';

interface Rating {
  id: string;
  stall_name: string;
  rating: number;
  photo_url?: string;
  mobilepay_phone: string;
  created_at: string;
  location_latitude?: number;
  location_longitude?: number;
}

export default function MyRatingsScreen() {
  const navigation = useNavigation();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRatings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No user found');
        return;
      }

      const { data, error } = await supabase
        .from('stall_ratings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading ratings:', error);
        return;
      }

      setRatings(data || []);
    } catch (error) {
      console.error('Error in loadRatings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRatings();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadRatings();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('da-DK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRatingColor = (rating: number) => {
    if (rating <= 3) return '#ff3b30'; // Red
    if (rating <= 6) return '#ff9500'; // Orange
    if (rating <= 8) return '#ffcc00'; // Yellow
    return '#34c759'; // Green
  };

  const getRatingEmoji = (rating: number) => {
    if (rating <= 2) return '😞';
    if (rating <= 4) return '😐';
    if (rating <= 6) return '🙂';
    if (rating <= 8) return '😊';
    return '🤩';
  };

  return (
    <View style={styles.container}>
      <AppHeader title={t('myRatings.title')} />
      
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#007AFF" />
        <Text style={styles.backButtonText}>{t('common.back')}</Text>
      </TouchableOpacity>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.centerContainer}>
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        ) : ratings.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>{t('myRatings.noRatings')}</Text>
            <Text style={styles.emptySubtext}>{t('myRatings.startRating')}</Text>
          </View>
        ) : (
          <View style={styles.ratingsContainer}>
            {ratings.map((rating) => (
              <View key={rating.id} style={styles.ratingCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.stallName}>{rating.stall_name}</Text>
                  <View style={styles.ratingBadge}>
                    <Text style={[styles.ratingText, { color: getRatingColor(rating.rating) }]}>
                      {getRatingEmoji(rating.rating)} {rating.rating}/10
                    </Text>
                  </View>
                </View>
                
                {rating.photo_url && (
                  <Image source={{ uri: rating.photo_url }} style={styles.photo} />
                )}
                
                <View style={styles.cardDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="card-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>MobilePay: {rating.mobilepay_phone}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>{formatDate(rating.created_at)}</Text>
                  </View>
                  {rating.location_latitude && rating.location_longitude && (
                    <View style={styles.detailRow}>
                      <Ionicons name="location-outline" size={16} color="#666" />
                      <Text style={styles.detailText}>
                        {rating.location_latitude.toFixed(4)}, {rating.location_longitude.toFixed(4)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      
      <AppFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#007AFF',
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  ratingsContainer: {
    padding: 20,
  },
  ratingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stallName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  ratingBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
    resizeMode: 'cover',
  },
  cardDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
});