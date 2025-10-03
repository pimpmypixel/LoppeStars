import React, { useState, useEffect } from 'react';
import { View, ScrollView, Image, RefreshControl, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../utils/supabase';
import { useTranslation } from '../../utils/localization';
import AppHeader from '../../components/AppHeader';
import AppFooter from '../../components/AppFooter';
import { Card, CardContent, CardHeader, CardTitle, Text } from '../../components/ui-kitten';
import { Frown, Laugh, Meh, Smile, Sparkles, Star } from 'lucide-react-native';

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

      const normalised = (data || []).map((item) => {
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
    if (rating <= 3) return '#ff3b30'; // Red
    if (rating <= 6) return '#ff9500'; // Orange
    if (rating <= 8) return '#ffcc00'; // Yellow
    return '#34c759'; // Green
  };

  const getRatingIcon = (rating: number) => {
    if (rating <= 2) return Frown;
    if (rating <= 4) return Meh;
    if (rating <= 6) return Smile;
    if (rating <= 8) return Laugh;
    return Sparkles;
  };

  return (
    <View className="flex-1 bg-[#f5f5f5]" {...({} as any)}>
      <AppHeader title={t('myRatings.title')} />

      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 12, marginBottom: 8 }}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#007AFF" />
        <Text className="ml-2 text-primary">{t('common.back')}</Text>
      </TouchableOpacity>

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
                      {(() => {
                        const Icon = getRatingIcon(rating.rating);
                        const color = getRatingColor(rating.rating);
                        return (
                          <View className="flex-row items-center gap-2" {...({} as any)}>
                            <Icon size={18} color={color} />
                            <View className="flex-row items-center gap-1" {...({} as any)}>
                              {Array.from({ length: rating.rating }, (_, index) => (
                                <Star
                                  key={index}
                                  size={14}
                                  color={color}
                                  fill={color}
                                />
                              ))}
                            </View>
                            <Text
                              className="text-sm font-semibold"
                              style={{ color }}
                            >
                              {rating.rating}/10
                            </Text>
                          </View>
                        );
                      })()}
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
                        <Text variant="muted">{t('form.mobilePayPhone')}: {rating.mobilepay_phone}</Text>
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