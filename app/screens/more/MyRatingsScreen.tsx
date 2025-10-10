import React, { useEffect } from 'react';
import { View, ScrollView, Image, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Icon } from '@ui-kitten/components';
import { supabase } from '../../utils/supabase';
import { useTranslation } from '../../utils/localization';
import AppHeader from '../../components/AppHeader';
import AppFooter from '../../components/AppFooter';
import { Card, CardContent, CardHeader, CardTitle, Text } from '../../components/ui-kitten';
import { useMyRatingsScreenStore } from '../../stores/myRatingsScreenStore';
import { useUIStore } from '../../stores/uiStore';

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
  const { t } = useTranslation();
  const { ratings, setRatings } = useUIStore();
  const { loading, setLoading, refreshing, setRefreshing } = useMyRatingsScreenStore();

  const loadRatings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found');
        return;
      }
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('ratings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (ratingsError) {
        console.error('Error loading ratings:', ratingsError);
        return;
      }
      const normalised = (ratingsData || []).map((item) => {
        if (item.photo_url && !item.photo_url.startsWith('http')) {
          const { data: publicUrl } = supabase.storage
            .from('stall-photos')
            .getPublicUrl(item.photo_url);
          return {
            ...item,
            photo_url: publicUrl?.publicUrl ?? item.photo_url,
          };
        }
        return item;
      });
  setRatings(normalised as Rating[]);
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
    if (rating <= 3) return '#ef4444'; // Red
    if (rating <= 6) return '#f97316'; // Orange  
    if (rating <= 8) return '#eab308'; // Yellow
    return '#22c55e'; // Green
  };

  const getRatingIconName = (rating: number) => {
    if (rating <= 2) return 'smiling-face-outline';
    if (rating <= 4) return 'smiling-face-outline';
    if (rating <= 6) return 'smiling-face';
    if (rating <= 8) return 'smiling-face';
    return 'star';
  };

  return (
    <View style={styles.container}>
      <AppHeader title={t('myRatings.title')} />

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-back" style={styles.backIcon} fill="#FF9500" />
        <Text style={styles.backText}>{t('common.back')}</Text>
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.centerContainer}>
            <Text variant="lead">{t('common.loading')}</Text>
          </View>
        ) : ratings.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.noRatingsTitle}>{t('myRatings.noRatings')}</Text>
            <Text variant="lead" style={styles.noRatingsText}>{t('myRatings.startRating')}</Text>
          </View>
        ) : (
          <View style={styles.content}>
            {ratings.map((rating) => (
              <Card key={rating.id} style={styles.card}>
                <CardHeader>
                  <View style={styles.headerRow}>
                    <CardTitle style={styles.cardTitle}>{rating.stall_name}</CardTitle>
                    <View style={styles.ratingBadge}>
                      <View style={styles.ratingContent}>
                        <Icon 
                          name={getRatingIconName(rating.rating)} 
                          style={styles.ratingIcon} 
                          fill={getRatingColor(rating.rating)} 
                        />
                        <View style={styles.starsRow}>
                          {Array.from({ length: rating.rating }, (_, index) => (
                            <Icon
                              key={index}
                              name="star"
                              style={styles.starIcon}
                              fill={getRatingColor(rating.rating)}
                            />
                          ))}
                        </View>
                        <Text
                          style={StyleSheet.flatten([styles.ratingText, { color: getRatingColor(rating.rating) }])}
                        >
                          {rating.rating}/10
                        </Text>
                      </View>
                    </View>
                  </View>
                </CardHeader>

                <CardContent style={styles.cardContent}>
                  {rating.photo_url && (
                    <Image
                      source={{ uri: rating.photo_url }}
                      style={styles.photo}
                      resizeMode="cover"
                    />
                  )}

                  <View style={styles.detailsContainer}>
                    <View style={styles.detailRow}>
                      <Icon name="credit-card-outline" style={styles.detailIcon} fill="#A8A29E" />
                      <Text style={styles.detailText}>{t('form.mobilePayPhone')}: {rating.mobilepay_phone}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Icon name="clock-outline" style={styles.detailIcon} fill="#A8A29E" />
                      <Text style={styles.detailText}>{formatDate(rating.created_at)}</Text>
                    </View>
                    {rating.location_latitude && rating.location_longitude && (
                      <View style={styles.detailRow}>
                        <Icon name="pin-outline" style={styles.detailIcon} fill="#A8A29E" />
                        <Text style={styles.detailText}>
                          {rating.location_latitude.toFixed(4)}, {rating.location_longitude.toFixed(4)}
                        </Text>
                      </View>
                    )}
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {/* <AppFooter /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1917',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  backText: {
    marginLeft: 8,
    color: '#FF9500',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 96,
    paddingHorizontal: 20,
  },
  noRatingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    color: '#FFFFFF',
  },
  noRatingsText: {
    textAlign: 'center',
    color: '#A8A29E',
  },
  content: {
    padding: 20,
    gap: 16,
  },
  card: {
    backgroundColor: '#292524',
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.15)',
    borderRadius: 20,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  ratingBadge: {
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.3)',
  },
  ratingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingIcon: {
    width: 18,
    height: 18,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  starIcon: {
    width: 14,
    height: 14,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardContent: {
    gap: 12,
    paddingTop: 8,
  },
  photo: {
    width: '100%',
    height: 192,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 149, 0, 0.3)',
  },
  detailsContainer: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailIcon: {
    width: 16,
    height: 16,
  },
  detailText: {
    color: '#A8A29E',
    fontSize: 14,
  },
});