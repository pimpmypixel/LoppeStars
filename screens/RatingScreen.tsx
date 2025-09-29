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
  Image
} from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '../utils/supabase';
import { t } from '../utils/localization';
import { uploadImageToSupabase } from '../utils/imageUpload';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import CameraModal from '../components/CameraModal';
import RatingSlider from '../components/RatingSlider';

export default function FormScreen() {
  const [formData, setFormData] = useState({
    stallName: '',
    mobilePayPhone: '',
  });
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert(t('common.error'), t('form.loginRequired'));
        return;
      }

      // Get current location
      const location = await getCurrentLocation();

      let photoUrl = null;
      
      // Upload photo if selected
      if (selectedImage) {
        const uploadResult = await uploadImageToSupabase(selectedImage, user.id);
        if (uploadResult.success) {
          photoUrl = uploadResult.url;
        } else {
          Alert.alert(t('common.error'), t('form.photoUploadError'));
          return;
        }
      }

      // Save stall rating to database
      const { data, error } = await supabase
        .from('stall_ratings')
        .insert([
          {
            user_id: user.id,
            stall_name: formData.stallName,
            photo_url: photoUrl,
            mobilepay_phone: formData.mobilePayPhone,
            rating: rating,
            location_latitude: location?.latitude,
            location_longitude: location?.longitude,
          }
        ]);

      if (error) {
        console.error('Database error:', error);
        Alert.alert(t('common.error'), t('form.submitError'));
        return;
      }
      
      Alert.alert(t('common.success'), t('form.submitSuccess'));
      
      // Reset form
      setFormData({
        stallName: '',
        mobilePayPhone: '',
      });
      setRating(5);
      setSelectedImage(null);
    } catch (error) {
      console.error('Form submission error:', error);
      Alert.alert(t('common.error'), t('form.submitError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCameraClose = () => {
    setShowCamera(false);
  };

  const handleImageTaken = (uri: string) => {
    setSelectedImage(uri);
  };

  return (
    <View style={styles.container}>
      <AppHeader title={t('form.rateStall')} />
      
      <KeyboardAvoidingView 
        style={styles.keyboardContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          
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
        </ScrollView>
      </KeyboardAvoidingView>
      
      <AppFooter />
      
      <CameraModal
        visible={showCamera}
        onClose={handleCameraClose}
        onImageTaken={handleImageTaken}
      />
    </View>
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
});