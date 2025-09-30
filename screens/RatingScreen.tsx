import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator
} from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '../utils/supabase';
import { t } from '../utils/localization';
import { useAuth } from '../contexts/AuthContext';
import { usePhotoUpload } from '../hooks/usePhotoUpload';
import { checkLocationPermission } from '../utils/permissions';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import AuthGuard from '../components/AuthGuard';
import CameraModal from '../components/CameraModal';
import RatingSlider from '../components/RatingSlider';
import PhotoUploadProgress from '../components/PhotoUploadProgress';
import { Button } from '../components/ui/button';
import { Text } from '../components/ui/text';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export default function FormScreen() {
  const { user } = useAuth();
  const { uploadProgress, uploadPhoto, resetUpload } = usePhotoUpload();
  const [formData, setFormData] = useState({
    stallName: '',
    mobilePayPhone: '',
  });
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStep, setSubmissionStep] = useState<string>('');
  const [showCamera, setShowCamera] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.stallName.trim()) {
      Alert.alert(t('form.validationError'), t('form.stallNameRequired'));
      return false;
    }
    if (!formData.mobilePayPhone.trim()) {
      Alert.alert(t('form.validationError'), t('form.mobilePayPhoneRequired'));
      return false;
    }
    // Basic phone number validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(formData.mobilePayPhone.replace(/\s/g, ''))) {
      Alert.alert(t('form.validationError'), 'Please enter a valid phone number');
      return false;
    }
    return true;
  };

  const getCurrentLocation = async () => {
    try {
      console.log('📍 Rating: checking location permission...');
      const hasPermission = await checkLocationPermission();
      
      if (!hasPermission) {
        console.log('❌ Location permission not granted');
        Alert.alert(
          'Location Permission',
          'Location permission is needed to save your rating location. The rating will be saved without location data.'
        );
        return null;
      }

      console.log('🗺️ Getting current position...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      console.log('✅ Location obtained:', {
        lat: location.coords.latitude,
        lng: location.coords.longitude
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('❌ Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Could not get your location. The rating will be saved without location data.'
      );
      return null;
    }
  };

  const handleSubmit = async () => {
    console.log('🚀 Starting form submission...');

    if (!user) {
      console.log('❌ No user session found');
      Alert.alert(t('common.error'), 'Please sign in to submit a rating');
      return;
    }

    console.log('👤 User session verified:', user.id);

    if (!validateForm()) {
      console.log('❌ Form validation failed');
      return;
    }

    console.log('✅ Form validation passed');

    setIsSubmitting(true);
    setSubmissionStep('Validating user session...');

    try {
      // Get current user
      setSubmissionStep('Getting user information...');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert(t('common.error'), t('form.loginRequired'));
        return;
      }

      // Get current location
      setSubmissionStep('Getting your location...');
      console.log('📍 Getting location...');
      const location = await getCurrentLocation();
      
      // Use already uploaded photo URL if available
      let finalPhotoUrl = photoUrl;
      
      // If there's a selected image but no uploaded URL, this shouldn't happen
      // because we now upload immediately when image is taken/selected
      if (selectedImage && !photoUrl) {
        console.log('⚠️ Photo selected but not uploaded, this should not happen');
        Alert.alert(t('common.error'), 'Photo not uploaded properly. Please try taking/selecting the photo again.');
        return;
      }

      // Save stall rating to database
      setSubmissionStep('Saving your rating...');
      console.log('💾 Saving to database...');
      const ratingData = {
        user_id: user.id,
        stall_name: formData.stallName,
        photo_url: finalPhotoUrl,
        mobilepay_phone: formData.mobilePayPhone,
        rating: rating,
        location_latitude: location?.latitude,
        location_longitude: location?.longitude,
      };

      console.log('📊 Rating data:', ratingData);

      const { data, error } = await supabase
        .from('stall_ratings')
        .insert(ratingData)
        .select()
        .single();

      if (error) {
        console.error('❌ Database error:', error);
        Alert.alert(t('common.error'), t('form.submitError'));
        return;
      }
      
      console.log('✅ Rating saved successfully:', data);
      setSubmissionStep('Thank you for your rating! 🎉');
      
      // Show success message briefly
      setTimeout(() => {
        Alert.alert(
          'Thank You! 🎉', 
          'Your rating has been submitted successfully. Thank you for helping other shoppers find great stalls!',
          [
            { text: 'OK', onPress: () => {} }
          ]
        );
        
        // Reset form
        setFormData({
          stallName: '',
          mobilePayPhone: '',
        });
        setRating(5);
        setSelectedImage(null);
        setPhotoUrl(null);
        resetUpload();
        setSubmissionStep('');

        console.log('🔄 Form reset completed');
      }, 1000);

    } catch (error) {
      console.error('❌ Submit error:', error);
      Alert.alert(t('common.error'), t('form.submitError'));
    } finally {
      setIsSubmitting(false);
      if (!submissionStep.includes('successfully')) {
        setSubmissionStep('');
      }
      console.log('✨ Form submission completed');
    }
  };

  const handleCameraClose = () => {
    setShowCamera(false);
  };

  const handleImageTaken = async (uri: string) => {
    if (!user) {
      Alert.alert(t('common.error'), t('form.loginRequired'));
      return;
    }

    setSelectedImage(uri);
    
    // Upload immediately in the background
    console.log('🚀 Starting immediate photo upload...');
    const uploadResult = await uploadPhoto(uri, user.id);
    
    if (uploadResult.success) {
      setPhotoUrl(uploadResult.url || null);
      console.log('✅ Photo uploaded immediately:', uploadResult.url);
    } else {
      console.log('❌ Immediate photo upload failed:', uploadResult.error);
      Alert.alert(t('common.error'), t('form.photoUploadError'));
      setSelectedImage(null);
    }
  };

  return (
    <AuthGuard>
      <View className="flex-1 bg-[#f5f5f5]" {...({} as any)}>
      <AppHeader title={t('form.rateStall')} />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        {...({} as any)}
      >
        <ScrollView className="flex-1" {...({} as any)}>
          <View className="p-5 gap-5" {...({} as any)}>

            <Card>
              <CardHeader>
                <CardTitle>{t('form.stallName')} *</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  value={formData.stallName}
                  onChangeText={(text: string) => handleInputChange('stallName', text)}
                  placeholder={t('form.stallNamePlaceholder')}
                  maxLength={100}
                  {...({} as any)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('form.mobilePayPhone')} *</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  value={formData.mobilePayPhone}
                  onChangeText={(text: string) => handleInputChange('mobilePayPhone', text)}
                  placeholder={t('form.mobilePayPhonePlaceholder')}
                  keyboardType="phone-pad"
                  maxLength={20}
                  {...({} as any)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('form.photo')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="border-dashed border-2 h-32 items-center justify-center"
                  onPress={() => setShowCamera(true)}
                  {...({} as any)}
                >
                  {selectedImage ? (
                    <Image source={{ uri: selectedImage }} className="w-full h-32 rounded" {...({} as any)} />
                  ) : (
                    <View className="items-center" {...({} as any)}>
                      <Text className="text-3xl mb-2">📷</Text>
                      <Text variant="muted">{t('form.addPhoto')}</Text>
                    </View>
                  )}
                </Button>
                {selectedImage && (
                  <Button
                    variant="ghost"
                    className="mt-2 text-destructive"
                    onPress={() => setSelectedImage(null)}
                    {...({} as any)}
                  >
                    <Text className="text-destructive">{t('form.removePhoto')}</Text>
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('form.ratingLabel')}</CardTitle>
              </CardHeader>
              <CardContent>
                <RatingSlider
                  value={rating}
                  onValueChange={setRating}
                  min={1}
                  max={10}
                />
              </CardContent>
            </Card>

            <Button
              className="mt-5"
              onPress={handleSubmit}
              disabled={isSubmitting}
              {...({} as any)}
            >
              <Text className="text-primary-foreground font-bold">
                {isSubmitting ? t('form.submitting') : t('form.submit')}
              </Text>
            </Button>

            {submissionStep ? (
              <Card className="mt-4">
                <CardContent className="flex-row items-center justify-center p-4">
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text className="ml-3 text-primary font-medium">{submissionStep}</Text>
                </CardContent>
              </Card>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <AppFooter />

      <CameraModal
        visible={showCamera}
        onClose={handleCameraClose}
        onImageTaken={handleImageTaken}
      />

      <PhotoUploadProgress
        visible={uploadProgress.isUploading}
        progress={uploadProgress.progress}
        isProcessing={uploadProgress.isProcessing}
        isUploading={uploadProgress.isUploading}
        error={uploadProgress.error}
      />
    </View>
    </AuthGuard>
  );
}