import React, { useState, useEffect } from 'react';
import { View, ScrollView, Image, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../utils/supabase';
import { t } from '../../utils/localization';
import AppHeader from '../../components/AppHeader';
import AppFooter from '../../components/AppFooter';
import { Button } from '../../components/ui/button';
import { Text } from '../../components/ui/text';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

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
    <View className="flex-1 bg-[#f5f5f5]" {...({} as any)}>
      <AppHeader title={t('myRatings.title')} />

      <Button
        variant="ghost"
        className="flex-row items-center mx-5 mt-3 mb-2"
        onPress={() => navigation.goBack()}
        {...({} as any)}
      >
        <Ionicons name="arrow-back" size={24} color="#007AFF" />
        <Text className="ml-2 text-primary">{t('common.back')}</Text>
      </Button>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        {...({} as any)}
      >
        {loading ? (
          <View className="flex-1 justify-center items-center pt-24" {...({} as any)}>
            <Text variant="lead">{t('common.loading')}</Text>
          </View>
        ) : ratings.length === 0 ? (
          <View className="flex-1 justify-center items-center pt-24 px-5" {...({} as any)}>
            <Text className="text-lg font-semibold text-center mb-2">{t('myRatings.noRatings')}</Text>
            <Text variant="lead" className="text-center">{t('myRatings.startRating')}</Text>
          </View>
        ) : (
          <View className="p-5 gap-4" {...({} as any)}>
            {ratings.map((rating) => (
              <Card key={rating.id}>
                <CardHeader>
                  <View className="flex-row justify-between items-center" {...({} as any)}>
                    <CardTitle className="flex-1">{rating.stall_name}</CardTitle>
                    <View className="bg-muted px-3 py-1 rounded-full" {...({} as any)}>
                      <Text
                        className="text-sm font-semibold"
                        style={{ color: getRatingColor(rating.rating) }}
                      >
                        {getRatingEmoji(rating.rating)} {rating.rating}/10
                      </Text>
                    </View>
                  </View>
                </CardHeader>

                <CardContent className="gap-3">
                  {rating.photo_url && (
                    <Image
                      source={{ uri: rating.photo_url }}
                      className="w-full h-48 rounded-lg"
                      resizeMode="cover"
                      {...({} as any)}
                    />
                  )}

                  <View className="gap-2" {...({} as any)}>
                    <View className="flex-row items-center gap-2" {...({} as any)}>
                      <Ionicons name="card-outline" size={16} color="#666" />
                      <Text variant="muted">MobilePay: {rating.mobilepay_phone}</Text>
                    </View>
                    <View className="flex-row items-center gap-2" {...({} as any)}>
                      <Ionicons name="time-outline" size={16} color="#666" />
                      <Text variant="muted">{formatDate(rating.created_at)}</Text>
                    </View>
                    {rating.location_latitude && rating.location_longitude && (
                      <View className="flex-row items-center gap-2" {...({} as any)}>
                        <Ionicons name="location-outline" size={16} color="#666" />
                        <Text variant="muted">
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

      <AppFooter />
    </View>
  );
}