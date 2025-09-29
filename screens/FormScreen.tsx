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
import { supabase } from '../utils/supabase';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import CameraModal from '../components/CameraModal';

export default function FormScreen() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    location: '',
  });
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
    if (!formData.title.trim()) {
      Alert.alert('Validation Error', 'Title is required');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Validation Error', 'Description is required');
      return false;
    }
    if (!formData.price.trim()) {
      Alert.alert('Validation Error', 'Price is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Error', 'You must be logged in to submit');
        return;
      }

      // Here you would typically save to Supabase database
      // For now, we'll just simulate a submission
      console.log('Submitting form data:', { 
        ...formData, 
        userId: user.id,
        imageUri: selectedImage 
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert('Success', 'Form submitted successfully!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        price: '',
        location: '',
      });
      setSelectedImage(null);
    } catch (error) {
      console.error('Form submission error:', error);
      Alert.alert('Error', 'Failed to submit form');
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
      <AppHeader title="Add New Item" />
      
      <KeyboardAvoidingView 
        style={styles.keyboardContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Photo</Text>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={() => setShowCamera(true)}
            >
              {selectedImage ? (
                <Image source={{ uri: selectedImage }} style={styles.photoPreview} />
              ) : (
                <>
                  <Text style={styles.photoButtonIcon}>📷</Text>
                  <Text style={styles.photoButtonText}>Add Photo</Text>
                </>
              )}
            </TouchableOpacity>
            {selectedImage && (
              <TouchableOpacity
                style={styles.removePhotoButton}
                onPress={() => setSelectedImage(null)}
              >
                <Text style={styles.removePhotoText}>Remove Photo</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => handleInputChange('title', text)}
              placeholder="Enter item title"
              maxLength={100}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              placeholder="Describe your item"
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Category</Text>
            <TextInput
              style={styles.input}
              value={formData.category}
              onChangeText={(text) => handleInputChange('category', text)}
              placeholder="e.g., Electronics, Clothing, Books"
              maxLength={50}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Price *</Text>
            <TextInput
              style={styles.input}
              value={formData.price}
              onChangeText={(text) => handleInputChange('price', text)}
              placeholder="0.00"
              keyboardType="numeric"
              maxLength={10}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={formData.location}
              onChangeText={(text) => handleInputChange('location', text)}
              placeholder="City, State"
              maxLength={100}
            />
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
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