import React, { useState } from 'react';
import { View, Alert, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useMarket } from '../contexts/MarketContext';
import { useAuth } from '../contexts/AuthContext';
import { Text } from '../components/ui/text';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import AuthGuard from '../components/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Ionicons } from '@expo/vector-icons';
import RatingSlider from '../components/RatingSlider';
import CameraModal from '../components/CameraModal';
import PhotoUploadProgress from '../components/PhotoUploadProgress';
import { usePhotoUpload } from '../hooks/usePhotoUpload';
import { useTranslation } from '../utils/localization';
import { supabase } from '../utils/supabase';
import { LinearGradient } from 'expo-linear-gradient';

export default function RatingScreen() {
  console.log('=== RATING SCREEN MOUNTED ===');
  const { selectedMarket } = useMarket();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [rating, setRating] = useState(5);
  const [stallName, setStallName] = useState('');
  const [mobilePayCode, setMobilePayCode] = useState('');
  const [comments, setComments] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { uploadProgress, uploadPhoto, resetUpload } = usePhotoUpload();

  const handleImageTaken = async (uri: string) => {
    setPhotoUri(uri);
    console.log('Photo taken:', uri);
  };

  const handleSubmit = async () => {
    if (!selectedMarket || !user) {
      Alert.alert(t('common.error'), t('rating.errorNoMarket'));
      return;
    }


    if (!stallName.trim()) {
      Alert.alert(t('common.error'), t('rating.errorNoStallName'));
      return;
    }

    // Optionally validate MobilePay code (e.g., length or numeric)

    setIsSubmitting(true);

    try {
      let photoUrl = null;

      // Upload photo if one was taken
      if (photoUri) {
        console.log('Uploading photo...');
        const uploadResult = await uploadPhoto(photoUri, user.id);
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || t('rating.errorPhotoUpload'));
        }
        photoUrl = uploadResult.processedUrl || uploadResult.originalUrl;
      }

      // Submit rating to database
      console.log('Submitting rating...');

      const { error } = await supabase
        .from('ratings')
        .insert({
          user_id: user.id,
          market_id: selectedMarket.id,
          stall_name: stallName.trim(),
          mobilepay_code: mobilePayCode.trim() || null,
          rating: rating,
          comments: comments.trim() || null,
          photo_url: photoUrl,
          created_at: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }

      // Success
      Alert.alert(t('common.success'), t('rating.successMessage'), [
        {
          text: t('common.ok'),
          onPress: () => {
            // Reset form
            setStallName('');
            setMobilePayCode('');
            setComments('');
            setRating(5);
            setPhotoUri(null);
            resetUpload();
          }
        }
      ]);

    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert(t('common.error'), error instanceof Error ? error.message : t('rating.errorSubmit'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <ScrollView className="flex-1 bg-[#f5f5f5]" {...({} as any)}>
        <View className="p-5" {...({} as any)}>
          {/* Selected Market Display */}
          {selectedMarket && selectedMarket.name ? (
            <Card className="bg-blue-50 border-blue-200 mb-5">
              <CardContent className="p-0">
                <View className="flex-row items-center" {...({} as any)}>
                  <Ionicons name="storefront" size={20} color="#3b82f6" />
                  <Text className="text-blue-800 font-medium ml-2">
                    {t('rating.selectedMarket')}: {selectedMarket.name}
                  </Text>
                </View>
                {selectedMarket.city && (
                  <Text className="text-blue-600 text-sm mt-1 ml-7">
                    {selectedMarket.city}
                  </Text>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-blue-50 border-blue-200 mb-5">
              <CardContent className="p-4">
                <View className="flex-row items-center" {...({} as any)}>
                  <Ionicons name="storefront" size={20} color="#3b82f6" />
                  <Text className="text-blue-800 font-medium ml-2">
                    {t('rating.noMarketSelected')}
                  </Text>
                </View>
              </CardContent>
            </Card>
          )}

          {/* Rating Form */}
          <Card className="mb-5">
            <CardHeader>
              <CardTitle>{t('rating.rateStall')}</CardTitle>
            </CardHeader>
            <CardContent className="gap-4">

              {/* Stall Name */}
              <View {...({} as any)}>
                <Label htmlFor="stallName">{t('rating.stallName')}</Label>
                <Input
                  id="stallName"
                  placeholder={t('rating.stallNamePlaceholder')}
                  value={stallName}
                  onChangeText={setStallName}
                  className="mt-1"
                />
              </View>

              {/* MobilePay Code */}
              <View {...({} as any)}>
                <Label htmlFor="mobilePayCode">{t('form.mobilePayPhone')}</Label>
                <Input
                  id="mobilePayCode"
                  placeholder={t('form.mobilePayPhonePlaceholder')}
                  value={mobilePayCode}
                  onChangeText={setMobilePayCode}
                  className="mt-1"
                  keyboardType="number-pad"
                />
              </View>
               {/* Photo Upload */}
              <View {...({} as any)}>
                <Label>{t('rating.photo')} ({t('common.optional')})</Label>
                <View className="flex-row gap-3 mt-2" {...({} as any)}>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onPress={() => setShowCamera(true)}
                    {...({} as any)}
                  >
                    <Ionicons name="camera" size={20} color="#374151" />
                    <Text className="ml-2">{t('rating.takePhoto')}</Text>
                  </Button>
                  {photoUri && (
                    <Button
                      variant="outline"
                      onPress={() => setPhotoUri(null)}
                      {...({} as any)}
                    >
                      <Ionicons name="trash" size={20} color="#ef4444" />
                    </Button>
                  )}
                </View>
                {photoUri && (
                  <Text className="text-sm text-green-600 mt-2">
                    ✓ {t('rating.photoAttached')}
                  </Text>
                )}
              </View>

              {/* Rating Stars */}
              <View {...({} as any)}>
                <Label>{t('rating.rating')}</Label>
                <RatingSlider
                  value={rating}
                  onValueChange={setRating}
                  min={1}
                  max={10}
                />
                <Text className="text-center mt-2 text-muted-foreground">
                  {rating}/10
                </Text>
              </View>

              {/* Comments */}
              <View {...({} as any)}>
                <Label htmlFor="comments">{t('rating.comments')} ({t('common.optional')})</Label>
                <Input
                  id="comments"
                  placeholder={t('rating.commentsPlaceholder')}
                  value={comments}
                  onChangeText={setComments}
                  multiline
                  numberOfLines={3}
                  className="mt-1"
                  style={{ height: 80, textAlignVertical: 'top' }}
                />
              </View>

             

              {/* Submit Button */}
              <TouchableOpacity
                className="mt-5 h-14 rounded-xl shadow-lg overflow-hidden justify-center items-center"
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.85}
                style={{ position: 'relative' }}
                {...({} as any)}
              >
                <View style={{ ...StyleSheet.absoluteFillObject, zIndex: 0 }} pointerEvents="none">
                  <LinearGradient
                    colors={['#FFD700', '#FFA500', '#FF8C00']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1, borderRadius: 12 }}
                  />
                </View>
                <Text className="text-white font-bold text-lg" style={{ zIndex: 1 }}>
                  {isSubmitting ? t('form.submitting') : t('form.submit')}
                </Text>
              </TouchableOpacity>
              {/* The Button block above is replaced by the TouchableOpacity/LinearGradient submit button. Properly close CardContent here. */}
            </CardContent>
          </Card>
        </View>
      </ScrollView>

      {/* Camera Modal */}
      <CameraModal
        visible={showCamera}
        onClose={() => setShowCamera(false)}
        onImageTaken={handleImageTaken}
      />

      {/* Photo Upload Progress */}
      <PhotoUploadProgress
        visible={uploadProgress.isUploading || uploadProgress.isProcessing}
        progress={uploadProgress.progress}
        isProcessing={uploadProgress.isProcessing}
        isUploading={uploadProgress.isUploading}
        error={uploadProgress.error}
      />
    </AuthGuard>
  );
}