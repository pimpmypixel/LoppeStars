import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { supabase } from '../utils/supabase';
import { t } from '../utils/localization';
import { useAuth } from '../contexts/AuthContext';
import { checkLocationPermission } from '../utils/permissions';
import AppHeader from '../components/AppHeader';
import AuthGuard from '../components/AuthGuard';
import CameraModal from '../components/CameraModal';
import RatingSlider from '../components/RatingSlider';
import { Button } from '../components/ui/button';
import { Text } from '../components/ui/text';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Camera } from 'lucide-react-native';

export default function FormScreen() {
  const { user } = useAuth();
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
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState<string | null>(null);
  const [processedPhotoUrl, setProcessedPhotoUrl] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    let processedValue = value;

    if (field === 'mobilePayPhone') {
      processedValue = value.replace(/\D/g, '').slice(0, 8);
    }

    setFormData(prev => ({
      ...prev,
      [field]: processedValue
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
    const phoneRegex = /^\d{8,10}$/;
    if (!phoneRegex.test(formData.mobilePayPhone)) {
      Alert.alert(t('form.validationError'), t('formAlerts.phoneInvalid'));
      return false;
    }
    return true;
  };

  const getCurrentLocation = async () => {
    let wasSuccessful = false;

    try {
      console.log('[rating] Checking location permission');
      const hasPermission = await checkLocationPermission();

      if (!hasPermission) {
        console.log('[rating] Location permission not granted');
        Alert.alert(
          t('formAlerts.locationPermissionTitle'),
          t('formAlerts.locationPermissionMessage')
        );
        return null;
      }

      console.log('[rating] Getting current position');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      console.log('[rating] Location obtained', {
        lat: location.coords.latitude,
        lng: location.coords.longitude
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('[rating] Error getting location', error);
      Alert.alert(
        t('formAlerts.locationErrorTitle'),
        t('formAlerts.locationErrorMessage')
      );
      return null;
    }
  };

  const handleSubmit = async () => {
    console.log('[rating] Starting form submission');

    if (!user) {
      console.log('[rating] No user session found');
      Alert.alert(t('common.error'), t('form.loginRequired'));
      return;
    }

    console.log('[rating] User session verified', user.id);

    if (!validateForm()) {
      console.log('[rating] Form validation failed');
      return;
    }

    console.log('[rating] Form validation passed');

    setIsSubmitting(true);
    setSubmissionStep(t('formStatus.validating'));

    let wasSuccessful = false;

    try {
      // Get current user
      setSubmissionStep(t('formStatus.fetchingUser'));
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert(t('common.error'), t('form.loginRequired'));
        return;
      }

      // Get current location
      setSubmissionStep(t('formStatus.requestingLocation'));
      console.log('[rating] Getting location');
      const location = await getCurrentLocation();

      // Use the processed photo URL for database storage (face-blurred version for privacy)
      let finalPhotoUrl = processedPhotoUrl || photoUrl;

      // If there's a selected image but no uploaded URL, this shouldn't happen
      // because we now upload immediately when image is taken/selected
      if (selectedImage && !photoUrl) {
        console.log('[rating] Photo selected but not uploaded');
        // Alert.alert(t('common.error'), t('formAlerts.missingPhotoUpload'));
        // return;
      }

      // Save stall rating to database
      setSubmissionStep(t('formStatus.saving'));
      console.log('[rating] Saving rating to database');
      const ratingData = {
        user_id: user.id,
        stall_name: formData.stallName,
        photo_url: finalPhotoUrl,
        mobilepay_phone: formData.mobilePayPhone,
        rating: rating,
        location_latitude: location?.latitude,
        location_longitude: location?.longitude,
      };

      console.log('[rating] Rating payload', ratingData);

      const { data, error } = await supabase
        .from('stall_ratings')
        .insert(ratingData)
        .select()
        .single();

      if (error) {
        console.error('[rating] Database error', error);
        Alert.alert(t('common.error'), t('form.submitError'));
        return;
      }

      console.log('[rating] Rating saved successfully', data);
      setSubmissionStep(t('formStatus.thanks'));
      wasSuccessful = true;

      // Show success message briefly
      setTimeout(() => {
        Alert.alert(
          t('formAlerts.submitSuccessTitle'),
          t('formAlerts.submitSuccessMessage')
        );

        // Reset form
        setFormData({
          stallName: '',
          mobilePayPhone: '',
        });
        setRating(5);
        setSelectedImage(null);
        setPhotoUrl(null);
        setOriginalPhotoUrl(null);
        setProcessedPhotoUrl(null);
        setSubmissionStep('');

        console.log('[rating] Form reset completed');
      }, 1000);

    } catch (error) {
      console.error('[rating] Submit error', error);
      Alert.alert(t('common.error'), t('form.submitError'));
    } finally {
      setIsSubmitting(false);
      if (!wasSuccessful) {
        setSubmissionStep('');
      }
      console.log('[rating] Form submission completed');
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

    // The CameraModal already processed the image, so we just need to set the URLs
    // The URI returned is the processed image URL from Supabase storage
    setSelectedImage(uri);
    setPhotoUrl(uri);
    setProcessedPhotoUrl(uri);
    setOriginalPhotoUrl(null); // We don't have the original URL from CameraModal

    console.log('[rating] Photo from camera processed successfully', {
      processedUrl: uri
    });
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
                  <CardTitle className="text-xl font-bold">{t('form.stallName')} *</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">{t('form.stallNameDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    value={formData.stallName}
                    onChangeText={(text: string) => handleInputChange('stallName', text)}
                    placeholder={t('form.stallNamePlaceholder')}
                    maxLength={10}
                    className="text-center text-lg h-12 w-[80%] mx-auto"
                    {...({} as any)}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold">{t('form.mobilePayPhone')} *</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">{t('form.mobilePayPhoneDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    value={formData.mobilePayPhone}
                    onChangeText={(text: string) => handleInputChange('mobilePayPhone', text)}
                    placeholder={t('form.mobilePayPhonePlaceholder')}
                    keyboardType="phone-pad"
                    maxLength={10}
                    className="text-center text-lg h-12 w-1/2 mx-auto"
                    {...({} as any)}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold">{t('form.photo')}</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">{t('form.photoDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="border-dashed border-2 h-32 items-center justify-center"
                    onPress={() => setShowCamera(true)}
                    {...({} as any)}
                  >
                    {photoUrl || selectedImage ? (
                      <Image
                        source={{ uri: photoUrl || selectedImage || undefined }}
                        className="h-32 w-full rounded"
                        resizeMode="cover"
                        {...({} as any)}
                      />
                    ) : (
                      <View className="items-center gap-2" {...({} as any)}>
                        <Camera size={28} color="#2563eb" />
                        <Text variant="muted">{t('form.addPhoto')}</Text>
                      </View>
                    )}
                  </Button>
                  {selectedImage && (
                    <Button
                      variant="ghost"
                      className="mt-2 text-destructive"
                      onPress={() => {
                        setSelectedImage(null);
                        setPhotoUrl(null);
                        setOriginalPhotoUrl(null);
                        setProcessedPhotoUrl(null);
                      }}
                      {...({} as any)}
                    >
                      <Text className="text-destructive">{t('form.removePhoto')}</Text>
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold">{t('form.ratingLabel')}</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">{t('form.ratingDescription')}</CardDescription>
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

              <TouchableOpacity
                className="mt-5 h-14 rounded-xl shadow-lg overflow-hidden"
                onPress={handleSubmit}
                disabled={isSubmitting}
                {...({} as any)}
              >
                <LinearGradient
                  colors={['#FFD700', '#FFA500', '#FF8C00']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="flex-1 justify-center items-center"
                  {...({} as any)}
                >
                  <Text className="text-white font-bold text-lg">
                    {isSubmitting ? t('form.submitting') : t('form.submit')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

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

        <CameraModal
          visible={showCamera}
          onClose={handleCameraClose}
          onImageTaken={handleImageTaken}
        />
      </View>
    </AuthGuard>
  );
}