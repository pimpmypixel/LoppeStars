import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, Modal } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { t } from '../utils/localization';
import { detectAndBlurFaces } from '../utils/faceDetection';

interface CameraModalProps {
  visible: boolean;
  onClose: () => void;
  onImageTaken: (uri: string) => void;
}

export default function CameraModal({ visible, onClose, onImageTaken }: CameraModalProps) {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <Modal visible={visible} transparent />;
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.container}>
          <Text style={styles.message}>{t('permissions.camera.message')}</Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        setIsProcessing(true);
        const photo = await cameraRef.current.takePictureAsync();
        if (photo) {
          // Process image for GDPR compliance (blur faces if detected)
          const processedImage = await detectAndBlurFaces(photo.uri);
          setCapturedImage(processedImage.uri || photo.uri);
          
          if (processedImage.error) {
            console.warn('Face detection warning:', processedImage.error);
          }
        }
      } catch (error) {
        Alert.alert(t('common.error'), 'Failed to take picture');
        console.log('Camera error:', error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const pickImageFromLibrary = async () => {
    setIsProcessing(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        // Process selected image for GDPR compliance
        const processedImage = await detectAndBlurFaces(result.assets[0].uri);
        setCapturedImage(processedImage.uri || result.assets[0].uri);
        
        if (processedImage.error) {
          console.warn('Face detection warning:', processedImage.error);
        }
      }
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to select image');
      console.log('Image picker error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = () => {
    if (capturedImage) {
      onImageTaken(capturedImage);
      setCapturedImage(null);
      onClose();
    }
  };

  const resetImage = () => {
    setCapturedImage(null);
  };

  const handleClose = () => {
    setCapturedImage(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <Text style={styles.processingText}>{t('camera.processing')}</Text>
          </View>
        )}
        
        {capturedImage ? (
          <>
            <Image source={{ uri: capturedImage }} style={styles.previewImage} />
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={resetImage}>
                <Text style={styles.buttonText}>{t('camera.retake')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
                <Text style={styles.buttonText}>{t('camera.usePhoto')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={handleClose}>
                <Text style={styles.buttonText}>{t('camera.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.header}>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{t('camera.takePhoto')}</Text>
              <View style={styles.placeholder} />
            </View>
            
            <CameraView style={styles.camera} facing={facing} ref={cameraRef} />
            <View style={styles.cameraButtonContainer}>
              <TouchableOpacity style={styles.button} onPress={pickImageFromLibrary}>
                <Text style={styles.buttonText}>{t('camera.fromLibrary')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.captureButton]} onPress={takePicture}>
                <Text style={styles.buttonText}>📷</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
                <Text style={styles.buttonText}>Flip</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: 'white',
    fontSize: 16,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 20,
    justifyContent: 'space-around',
  },
  cameraButtonContainer: {
    position: 'absolute',
    bottom: 64,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    marginHorizontal: 64,
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  button: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  cancelButton: {
    backgroundColor: '#666',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    color: 'white',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  previewImage: {
    flex: 1,
    width: '100%',
    resizeMode: 'cover',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  processingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});