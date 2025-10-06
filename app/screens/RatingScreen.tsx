import React, { useState } from 'react';
import { View, Alert, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Modal, Platform, ToastAndroid } from 'react-native';
import { useMarket } from '../contexts/MarketContext';
import { useAuth } from '../contexts/AuthContext';
import { Text, Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from '../components/ui-kitten';
import { Layout, Icon } from '@ui-kitten/components';
import AuthGuard from '../components/AuthGuard';
import AppHeader from '../components/AppHeader';
import RatingSlider from '../components/RatingSlider';
import CameraModal from '../components/CameraModal';
import PhotoUploadProgress from '../components/PhotoUploadProgress';
import { usePhotoUpload } from '../hooks/usePhotoUpload';
import { useTranslation } from '../utils/localization';
import { supabase } from '../utils/supabase';
import { logEvent } from '../utils/eventLogger';

// Simple gradient background without native dependencies
const GradientBackground = () => {
  return (
    <View 
      style={[
        StyleSheet.absoluteFillObject, 
        { 
          backgroundColor: '#FFA500',
          // Create a subtle gradient effect with overlapping views
        }
      ]} 
      pointerEvents="none"
    >
      <View 
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: 'rgba(255, 215, 0, 0.3)', // Gold overlay
            borderRadius: 16,
          }
        ]}
      />
    </View>
  );
};

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

      const { data: ratingData, error } = await supabase
        .from('stall_ratings')
        .insert({
          user_id: user.id,
          market_id: selectedMarket.id,
          stall_name: stallName.trim(),
          mobilepay_phone: mobilePayCode.trim() || null,
          rating: rating,
          photo_url: photoUrl,
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      // Log stall_rated event
      await logEvent(
        user.id,
        'stall_rated',
        'rating',
        ratingData.id,
        {
          market_id: selectedMarket.id,
          market_name: selectedMarket.name,
          stall_name: stallName.trim(),
          rating_value: rating,
          has_photo: !!photoUrl,
          has_mobilepay: !!mobilePayCode.trim(),
          has_comments: !!comments.trim(),
          rated_at: new Date().toISOString(),
        }
      );

      // Log photo_added event if photo was uploaded
      if (photoUrl) {
        await logEvent(
          user.id,
          'photo_added',
          'photo',
          ratingData.id,
          {
            market_id: selectedMarket.id,
            market_name: selectedMarket.name,
            stall_name: stallName.trim(),
            photo_url: photoUrl,
            added_at: new Date().toISOString(),
          }
        );
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
      <View style={styles.container}>
        <AppHeader title={t('rating.title')} />
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
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
                <View style={{ ...styles.fieldContainer, marginBottom: 10, width: '50%' }}>
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
                    <TouchableOpacity
                      style={styles.photoButton}
                      onPress={() => setShowCamera(true)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.photoIconContainer}>
                        <Icon name="camera" style={styles.buttonIcon} fill="#FF9500" />
                      </View>
                      <Text style={styles.buttonText}>{t('rating.takePhoto')}</Text>
                    </TouchableOpacity>
                    {photoUri && (
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => setPhotoUri(null)}
                        activeOpacity={0.7}
                      >
                        <Icon name="trash-2" style={styles.deleteIcon} fill="#EF4444" />
                      </TouchableOpacity>
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

                {/* Rating Stars */}
                <View style={styles.fieldContainer}>
                  <Label>{t('rating.rating')}</Label>
                  <RatingSlider
                    value={rating}
                    onValueChange={setRating}
                    min={1}
                    max={10}
                  />
                  {/* <Text variant="muted" style={styles.ratingValue}>
                    {rating}/10
                  </Text> */}
                </View>


                {/* Submit Button */}
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  activeOpacity={0.85}
                >
                  <GradientBackground />
                  <Text style={styles.submitButtonText}>
                    {isSubmitting ? t('form.submitting') : t('form.submit')}
                  </Text>
                </TouchableOpacity>
              </CardContent>
            </Card>
          </View>
        </ScrollView>
      </View>

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
    backgroundColor: '#1C1917',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 16,
  },
  formCard: {
    marginBottom: 20,
    backgroundColor: '#292524',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  formContent: {
    gap: 24,
    paddingTop: 12,
  },
  fieldContainer: {
    marginBottom: 4,
  },
  input: {
    marginTop: 8,
    backgroundColor: '#1C1917',
    borderColor: 'rgba(255, 149, 0, 0.2)',
    borderRadius: 14,
  },
  photoButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.2)',
    borderRadius: 14,
    backgroundColor: '#1C1917',
  },
  photoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 56,
    height: 56,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonIcon: {
    width: 22,
    height: 22,
  },
  deleteIcon: {
    width: 22,
    height: 22,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  photoPreviewContainer: {
    marginTop: 20,
    width: '100%',
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 149, 0, 0.3)',
  },
  previewImage: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  progressText: {
    fontSize: 13,
    color: '#A8A29E',
    marginTop: 10,
    fontWeight: '500',
  },
  fullscreenModal: {
    flex: 1,
    backgroundColor: '#1C1917',
  },
  fullscreenImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  ratingValue: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 18,
    fontWeight: '700',
    color: '#FF9500',
  },
  textArea: {
    height: 100,
    paddingTop: 14,
    marginTop: 8,
    backgroundColor: '#1C1917',
    borderColor: 'rgba(255, 149, 0, 0.2)',
    borderRadius: 14,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 28,
    height: 64,
    borderRadius: 16,
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
    letterSpacing: 1,
    textTransform: 'uppercase',
    zIndex: 1,
  },
});