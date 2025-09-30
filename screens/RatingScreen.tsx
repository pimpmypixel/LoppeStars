import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
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
      setSubmissionStep('Rating submitted successfully!');
      
      // Show success message briefly
      setTimeout(() => {
        Alert.alert(t('form.success'), t('form.submitSuccess'));
        
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
      }, 500);

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
      <View style={styles.container}>
      <AppHeader title={t('form.rateStall')} />
      
      <KeyboardAvoidingView 
        style={styles.keyboardContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('form.stallName')} *</Text>
            <TextInput
              style={styles.input}
              value={formData.stallName}
              onChangeText={(text) => handleInputChange('stallName', text)}
              placeholder={t('form.stallNamePlaceholder')}
              maxLength={100}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('form.mobilePayPhone')} *</Text>
            <TextInput
              style={styles.input}
              value={formData.mobilePayPhone}
              onChangeText={(text) => handleInputChange('mobilePayPhone', text)}
              placeholder={t('form.mobilePayPhonePlaceholder')}
              keyboardType="phone-pad"
              maxLength={20}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('form.photo')}</Text>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={() => setShowCamera(true)}
            >
              {selectedImage ? (
                <Image source={{ uri: selectedImage }} style={styles.photoPreview} />
              ) : (
                <>
                  <Text style={styles.photoButtonIcon}>📷</Text>
                  <Text style={styles.photoButtonText}>{t('form.addPhoto')}</Text>
                </>
              )}
            </TouchableOpacity>
            {selectedImage && (
              <TouchableOpacity
                style={styles.removePhotoButton}
                onPress={() => setSelectedImage(null)}
              >
                <Text style={styles.removePhotoText}>{t('form.removePhoto')}</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('form.ratingLabel')}</Text>
            <RatingSlider
              value={rating}
              onValueChange={setRating}
              min={1}
              max={10}
            />
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? t('form.submitting') : t('form.submit')}
            </Text>
          </TouchableOpacity>

          {submissionStep ? (
            <View style={styles.submissionStatus}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.submissionStatusText}>{submissionStep}</Text>
            </View>
          ) : null}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 48,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  photoButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  photoButtonIcon: {
    fontSize: 30,
    marginBottom: 8,
  },
  photoButtonText: {
    fontSize: 16,
    color: '#666',
  },
  photoPreview: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removePhotoButton: {
    marginTop: 8,
    alignSelf: 'center',
  },
  removePhotoText: {
    color: '#ff3b30',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  submissionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 8,
  },
  submissionStatusText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
});