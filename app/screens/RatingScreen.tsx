import React, { useState } from 'react';
import { View, Alert, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Modal, Platform, ToastAndroid } from 'react-native';
import { useMarket } from '../contexts/MarketContext';
import { useAuth } from '../contexts/AuthContext';
import { Text, Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from '../components/ui-kitten';
import { Layout } from '@ui-kitten/components';
import AuthGuard from '../components/AuthGuard';
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
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { uploadProgress, uploadPhoto, resetUpload } = usePhotoUpload();

  const handleImageTaken = async (uri: string) => {
    console.log('Photo taken:', uri);
    if (!user) {
      Alert.alert(t('common.error'), t('form.loginRequired'));
      return;
    }
    setPhotoUri(uri);
    // Immediately upload with progress spinner
    try {
      const result = await uploadPhoto(uri, user.id);
      if (result.success && result.processedUrl) {
        setPhotoUri(result.processedUrl);
        // Show toast on Android or alert on iOS
        const msg = t('rating.uploadSuccessToast');
        if (Platform.OS === 'android') {
          ToastAndroid.show(msg, ToastAndroid.SHORT);
        } else {
          Alert.alert(msg);
        }
      }
    } catch (err) {
      console.error('Upload error:', err);
    }
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
        console.log('Handling photo URI:', photoUri);
        // If photoUri is a remote URL (e.g., processed image), skip upload and use it directly
        if (/^https?:\/\//.test(photoUri)) {
          console.log('Using existing remote photo URL');
          photoUrl = photoUri;
        } else {
          console.log('Uploading local photo...');
          const uploadResult = await uploadPhoto(photoUri, user.id);
          if (!uploadResult.success) {
            throw new Error(uploadResult.error || t('rating.errorPhotoUpload'));
          }
          photoUrl = uploadResult.processedUrl || uploadResult.originalUrl;
        }
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
      <Layout style={styles.container} level="2">
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            {/* Selected Market Display */}
            {selectedMarket && selectedMarket.name ? (
              <Card style={styles.marketCard}>
                <CardContent style={styles.marketCardContent}>
                  <View style={styles.marketRow}>
                    <Ionicons name="storefront" size={20} color="#3b82f6" />
                    <Text style={styles.marketText}>
                      {t('rating.selectedMarket')}: {selectedMarket.name}
                    </Text>
                  </View>
                  {selectedMarket.city && (
                    <Text style={styles.marketCity}>
                      {selectedMarket.city}
                    </Text>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card style={styles.marketCard}>
                <CardContent style={styles.marketCardContent}>
                  <View style={styles.marketRow}>
                    <Ionicons name="storefront" size={20} color="#3b82f6" />
                    <Text style={styles.marketText}>
                      {t('rating.noMarketSelected')}
                    </Text>
                  </View>
                </CardContent>
              </Card>
            )}

            {/* Rating Form */}
            <Card style={styles.formCard}>
              <CardHeader>
                <CardTitle>{t('rating.rateStall')}</CardTitle>
              </CardHeader>
              <CardContent style={styles.formContent}>

                {/* Stall Name */}
                <View style={styles.fieldContainer}>
                  <Label>{t('rating.stallName')}</Label>
                  <Input
                    placeholder={t('rating.stallNamePlaceholder')}
                    value={stallName}
                    onChangeText={setStallName}
                    style={styles.input}
                  />
                </View>

                {/* MobilePay Code */}
                <View style={styles.fieldContainer}>
                  <Label>{t('form.mobilePayPhone')}</Label>
                  <Input
                    placeholder={t('form.mobilePayPhonePlaceholder')}
                    value={mobilePayCode}
                    onChangeText={setMobilePayCode}
                    keyboardType="number-pad"
                    style={styles.input}
                  />
                </View>

                {/* Photo Upload */}
                <View style={styles.fieldContainer}>
                  <Label>{t('rating.photo')} ({t('common.optional')})</Label>
                  <View style={styles.photoButtonRow}>
                    <Button
                      variant="outline"
                      style={styles.photoButton}
                      onPress={() => setShowCamera(true)}
                    >
                      <View style={styles.buttonContent}>
                        <Ionicons name="camera" size={20} color="#374151" />
                        <Text style={styles.buttonText}>{t('rating.takePhoto')}</Text>
                      </View>
                    </Button>
                    {photoUri && (
                      <Button
                        variant="outline"
                        style={styles.deleteButton}
                        onPress={() => setPhotoUri(null)}
                      >
                        <Ionicons name="trash" size={20} color="#ef4444" />
                      </Button>
                    )}
                  </View>
                  {photoUri && (
                    <View style={styles.photoPreviewContainer}>
                      <TouchableOpacity onPress={() => setShowFullScreen(true)}>
                        <View style={styles.imageContainer}>
                          <Image
                            source={{ uri: photoUri }}
                            style={styles.previewImage}
                          />
                          {(uploadProgress.isUploading || uploadProgress.isProcessing) && (
                            <View style={styles.uploadOverlay}>
                              <ActivityIndicator size="large" color="#fff" />
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                      {/* Progress or processed status */}
                      {uploadProgress.progress > 0 && uploadProgress.progress < 100 && (
                        <Text style={styles.progressText}>
                          {uploadProgress.progress}%
                        </Text>
                      )}
                      {uploadProgress.progress === 100 && (
                        <Text style={styles.progressText}>
                          {t('rating.imageProcessed')}
                        </Text>
                      )}
                      {/* Fullscreen modal */}
                      <Modal visible={showFullScreen} transparent={true} onRequestClose={() => setShowFullScreen(false)}>
                        <TouchableOpacity style={styles.fullscreenModal} onPress={() => setShowFullScreen(false)}>
                          <Image
                            source={{ uri: photoUri }}
                            style={styles.fullscreenImage}
                          />
                        </TouchableOpacity>
                      </Modal>
                    </View>
                  )}
                </View>

                {/* Rating Stars */}
                <View style={styles.fieldContainer}>
                  <Label>{t('rating.rating')}</Label>
                  <RatingSlider
                    value={rating}
                    onValueChange={setRating}
                    min={1}
                    max={10}
                  />
                  <Text variant="muted" style={styles.ratingValue}>
                    {rating}/10
                  </Text>
                </View>

                {/* Comments */}
                <View style={styles.fieldContainer}>
                  <Label>{t('rating.comments')} ({t('common.optional')})</Label>
                  <Input
                    placeholder={t('rating.commentsPlaceholder')}
                    value={comments}
                    onChangeText={setComments}
                    multiline
                    numberOfLines={3}
                    style={styles.textArea}
                  />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  activeOpacity={0.85}
                >
                  <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                    <LinearGradient
                      colors={['#FFD700', '#FFA500', '#FF8C00']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.gradientButton}
                    />
                  </View>
                  <Text style={styles.submitButtonText}>
                    {isSubmitting ? t('form.submitting') : t('form.submit')}
                  </Text>
                </TouchableOpacity>
              </CardContent>
            </Card>
          </View>
        </ScrollView>
      </Layout>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  marketCard: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    marginBottom: 20,
  },
  marketCardContent: {
    padding: 16,
  },
  marketRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  marketText: {
    color: '#1e40af',
    fontWeight: '500',
    marginLeft: 8,
    fontSize: 15,
  },
  marketCity: {
    color: '#2563eb',
    fontSize: 14,
    marginTop: 4,
    marginLeft: 28,
  },
  formCard: {
    marginBottom: 20,
  },
  formContent: {
    gap: 20,
    paddingTop: 8,
  },
  fieldContainer: {
    marginBottom: 4,
  },
  input: {
    marginTop: 4,
  },
  photoButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  photoButton: {
    flex: 1,
  },
  deleteButton: {
    width: 48,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 14,
  },
  photoPreviewContainer: {
    marginTop: 16,
    width: '100%',
  },
  imageContainer: {
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 8,
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
  fullscreenModal: {
    flex: 1,
    backgroundColor: 'black',
  },
  fullscreenImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  ratingValue: {
    textAlign: 'center',
    marginTop: 8,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    marginTop: 4,
  },
  submitButton: {
    marginTop: 20,
    height: 56,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientButton: {
    flex: 1,
    borderRadius: 12,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    zIndex: 1,
  },
});