import React, { useState, useEffect } from 'react';
import { View, Alert, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMarket } from '../contexts/MarketContext';
import { useAuth } from '../contexts/AuthContext';
import { Text, Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from '../components/ui-kitten';
import { Layout } from '@ui-kitten/components';
import AuthGuard from '../components/AuthGuard';
import AppHeader from '../components/AppHeader';
import RatingSlider from '../components/RatingSlider';
import CameraModal from '../components/CameraModal';
import PhotoUploadProgress from '../components/PhotoUploadProgress';
import { showToast, ToastContainer } from '../components/Toast';
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
  const [ratingType, setRatingType] = useState<'stall' | 'market'>('stall');
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
    
    // Immediately upload and process with face detection
    console.log('Starting upload and face detection process...');
    try {
      const result = await uploadPhoto(uri, user.id);
      if (result.success && result.processedUrl) {
        console.log('✅ Photo processed successfully:', result.processedUrl);
        setPhotoUri(result.processedUrl); // Store the processed URL
        
        // Show success toast
        showToast(t('rating.uploadSuccessToast', { defaultValue: 'Photo processed successfully!' }), 'success');
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (err) {
      console.error('❌ Upload/processing error:', err);
      showToast(
        t('rating.errorPhotoUpload', { defaultValue: 'Failed to process photo. Please try again.' }),
        'error'
      );
      setPhotoUri(null); // Clear photo on error
    }
  };

  const handleSubmit = async () => {
    if (!selectedMarket || !user) {
      Alert.alert(t('common.error'), t('rating.errorNoMarket'));
      return;
    }

    if (ratingType === 'stall' && !stallName.trim()) {
      Alert.alert(t('common.error'), t('rating.errorNoStallName'));
      return;
    }

    setIsSubmitting(true);

    try {
      // Check for existing rating first
      const { data: existingRatings, error: checkError } = await supabase
        .from('ratings')
        .select('id')
        .eq('user_id', user.id)
        .eq('market_id', selectedMarket.id);

      if (checkError) {
        console.error('Error checking existing ratings:', checkError);
        // Continue anyway, let the database handle uniqueness
      }

      // For stall ratings, check if this specific stall was already rated
      if (ratingType === 'stall' && existingRatings && existingRatings.length > 0) {
        const { data: stallRatings } = await supabase
          .from('ratings')
          .select('id, stall_name')
          .eq('user_id', user.id)
          .eq('market_id', selectedMarket.id)
          .eq('stall_name', stallName.trim());

        if (stallRatings && stallRatings.length > 0) {
          // Show alert asking if they want to update
          Alert.alert(
            t('rating.alreadyRatedStall'),
            t('rating.updateRatingQuestion'),
            [
              { text: t('common.cancel'), style: 'cancel', onPress: () => setIsSubmitting(false) },
              { text: t('common.yes'), onPress: () => continueSubmit(stallRatings[0].id) }
            ]
          );
          return;
        }
      }

      // For market ratings, check if market was already rated
      if (ratingType === 'market' && existingRatings && existingRatings.length > 0) {
        const { data: marketRatings } = await supabase
          .from('ratings')
          .select('id, rating_type')
          .eq('user_id', user.id)
          .eq('market_id', selectedMarket.id)
          .is('stall_name', null); // Market ratings have no stall name

        if (marketRatings && marketRatings.length > 0) {
          Alert.alert(
            t('rating.alreadyRatedMarket'),
            t('rating.updateRatingQuestion'),
            [
              { text: t('common.cancel'), style: 'cancel', onPress: () => setIsSubmitting(false) },
              { text: t('common.yes'), onPress: () => continueSubmit(marketRatings[0].id) }
            ]
          );
          return;
        }
      }

      // No existing rating, proceed with insert
      await continueSubmit();

    } catch (error) {
      console.error('Submit error:', error);
      showToast(error instanceof Error ? error.message : t('rating.errorSubmit'), 'error');
      setIsSubmitting(false);
    }
  };

  const continueSubmit = async (existingRatingId?: string) => {
    try {
      let photoUrl = null;

      // Use the already processed photo URL (uploaded in handleImageTaken)
      if (photoUri) {
        console.log('Using already processed photo URL:', photoUri);
        photoUrl = photoUri;
      }

      // Submit rating to database
      console.log('Submitting rating...');

      // Prepare the data
      const ratingData: any = {
        user_id: user!.id,
        market_id: selectedMarket!.id,
        stall_name: ratingType === 'stall' ? stallName.trim() : null,
        mobilepay_phone: ratingType === 'stall' ? (mobilePayCode.trim() || null) : null,
        rating: rating,
        photo_url: photoUrl,
      };

      // Only add rating_type if we're confident the column exists
      if (ratingType) {
        ratingData.rating_type = ratingType;
      }

      let resultData;
      let resultError;

      if (existingRatingId) {
        // Update existing rating
        const { data, error } = await supabase
          .from('ratings')
          .update(ratingData)
          .eq('id', existingRatingId)
          .select('id')
          .single();
        
        resultData = data;
        resultError = error;
      } else {
        // Insert new rating
        ratingData.created_at = new Date().toISOString();
        const { data, error } = await supabase
          .from('ratings')
          .insert(ratingData)
          .select('id')
          .single();
        
        resultData = data;
        resultError = error;
      }

      if (resultError) {
        throw resultError;
      }

      // Log appropriate rating event based on type
      await logEvent(
        user!.id,
        ratingType === 'stall' ? 'stall_rated' : 'market_rated',
        'rating',
        resultData!.id,
        {
          market_id: selectedMarket!.id,
          market_name: selectedMarket!.name,
          rating_type: ratingType,
          stall_name: ratingType === 'stall' ? stallName.trim() : null,
          rating_value: rating,
          has_photo: !!photoUrl,
          has_mobilepay: ratingType === 'stall' ? !!mobilePayCode.trim() : false,
          has_comments: !!comments.trim(),
          rated_at: new Date().toISOString(),
        }
      );

      // Log photo_added event if photo was uploaded
      if (photoUrl) {
        await logEvent(
          user!.id,
          'photo_added',
          'photo',
          resultData!.id,
          {
            market_id: selectedMarket!.id,
            market_name: selectedMarket!.name,
            stall_name: stallName.trim(),
            photo_url: photoUrl,
            added_at: new Date().toISOString(),
          }
        );
      }

      // Success - Show styled toast
      const successMsg = ratingType === 'stall' 
        ? t('rating.successMessageStall', { defaultValue: 'Thanks for rating this stall!' })
        : t('rating.successMessageMarket', { defaultValue: 'Thanks for rating this market!' });
      
      showToast(successMsg, 'success');

      // Reset form after short delay
      setTimeout(() => {
        setRatingType('stall');
        setStallName('');
        setMobilePayCode('');
        setComments('');
        setRating(5);
        setPhotoUri(null);
        resetUpload();
        setIsSubmitting(false);
      }, 1000);

    } catch (error) {
      console.error('Submit error:', error);
      showToast(error instanceof Error ? error.message : t('rating.errorSubmit'), 'error');
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

                {/* Rating Type Toggle */}
                <View style={styles.fieldContainer}>
                  <Label>{t('form.ratingType')}</Label>
                  <View style={styles.toggleRow}>
                    <TouchableOpacity
                      style={[
                        styles.typeButton,
                        ratingType === 'stall' && styles.typeButtonActive
                      ]}
                      onPress={() => setRatingType('stall')}
                    >
                      <Ionicons name="home-outline" size={24} color={ratingType === 'stall' ? '#FF9500' : '#8F9BB3'} />
                      <Text style={ratingType === 'stall' ? styles.typeButtonTextActive : styles.typeButtonText}>
                        {t('form.stall')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.typeButton,
                        ratingType === 'market' && styles.typeButtonActive
                      ]}
                      onPress={() => setRatingType('market')}
                    >
                      <Ionicons name="location-outline" size={24} color={ratingType === 'market' ? '#FF9500' : '#8F9BB3'} />
                      <Text style={ratingType === 'market' ? styles.typeButtonTextActive : styles.typeButtonText}>
                        {t('form.market')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Stall Name - Only shown for stall ratings */}
                {ratingType === 'stall' && (
                  <View style={{ ...styles.fieldContainer, width: '50%' }}>
                    <Label>{t('rating.stallName')}</Label>
                    <Input
                      placeholder={t('rating.stallNamePlaceholder')}
                      value={stallName}
                      onChangeText={setStallName}
                      style={styles.input}
                    />
                  </View>
                )}

                {/* MobilePay Code - Only shown for stall ratings */}
                {ratingType === 'stall' && (
                  <View style={{ ...styles.fieldContainer, marginBottom: 0, width: '50%' }}>
                    <Label>{t('form.mobilePayPhone')}</Label>
                    <Input
                      placeholder={t('form.mobilePayPhonePlaceholder')}
                      value={mobilePayCode}
                      onChangeText={(text) => {
                        // Only allow alphanumeric characters
                        const alphanumeric = text.replace(/[^a-zA-Z0-9]/g, '');
                        setMobilePayCode(alphanumeric);
                      }}
                      keyboardType="default"
                      style={styles.input}
                    />
                  </View>
                )}

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
                        <Ionicons name="camera-outline" size={32} color="#FF9500" />
                      </View>
                      <Text style={styles.buttonText}>{t('rating.takePhoto')}</Text>
                    </TouchableOpacity>
                    {photoUri && (
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => setPhotoUri(null)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={24} color="#EF4444" />
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

      {/* Toast Container */}
      <ToastContainer />
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
    marginBottom: 2,
  },
  input: {
    marginTop: 2,
    backgroundColor: '#1C1917',
    borderColor: 'rgba(255, 149, 0, 0.2)',
    borderRadius: 18,
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
    // marginTop: 8,
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
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(143, 155, 179, 0.3)',
    borderRadius: 14,
    backgroundColor: 'rgba(143, 155, 179, 0.1)',
  },
  typeButtonActive: {
    borderColor: 'rgba(255, 149, 0, 0.4)',
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
  },
  typeIcon: {
    width: 20,
    height: 20,
  },
  typeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8F9BB3',
    flex: 1,
    textAlign: 'center',
  },
  typeButtonTextActive: {
    color: '#FF9500',
    fontWeight: '700',
  },
});