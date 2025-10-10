import React, { useRef } from 'react';
import { View, Alert, Image, Modal, useWindowDimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useCameraModalStore } from '../stores/cameraModalStore';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from '../utils/localization';
import { Card, CardContent, CardHeader, CardTitle, Text } from './ui-kitten';
import { Icon } from '@ui-kitten/components';

interface CameraModalProps {
  visible: boolean;
  onClose: () => void;
  onImageTaken: (uri: string) => void;
}

export default function CameraModal({ visible, onClose, onImageTaken }: CameraModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const {
    facing,
    setFacing,
    capturedImage,
    setCapturedImage,
    isProcessing,
    setIsProcessing,
  } = useCameraModalStore();
  const cameraRef = useRef<CameraView>(null);
  const { width, height } = useWindowDimensions();
  const orientation = width > height ? 'landscape' : 'portrait';
  const { t } = useTranslation();

  console.log('Current orientation:', orientation, { width, height });

  if (!permission) {
    return <Modal visible={visible} transparent />;
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.9)',
          paddingHorizontal: 24,
          paddingVertical: orientation === 'landscape' ? 16 : 32
        }}>
          <View style={{
            width: '100%',
            maxWidth: orientation === 'landscape' ? 384 : 320,
            gap: 20,
            padding: 24,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.2)',
            borderRadius: 16,
            backgroundColor: 'rgba(28,25,23,0.95)'
          }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{
                fontSize: orientation === 'landscape' ? 18 : 20,
                fontWeight: 'bold',
                color: '#ffffff',
                textAlign: 'center',
                marginBottom: 8
              }}>
                {t('permissions.camera.title')}
              </Text>
              <Text style={{
                fontSize: orientation === 'landscape' ? 14 : 16,
                color: 'rgba(255,255,255,0.7)',
                textAlign: 'center'
              }}>
                {t('permissions.camera.message')}
              </Text>
            </View>
            <View style={{ gap: 12 }}>
              <TouchableOpacity
                style={{
                  width: '100%',
                  height: 48,
                  backgroundColor: '#FF9500',
                  borderRadius: 12,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
                onPress={requestPermission}
              >
                <Text style={{ fontWeight: '600', color: '#ffffff', fontSize: 16 }}>
                  {t('permissions.camera.grant')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  width: '100%',
                  height: 48,
                  borderRadius: 12,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
                onPress={onClose}
              >
                <Text style={{ fontWeight: '600', color: 'rgba(255,255,255,0.7)', fontSize: 16 }}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(facing === 'back' ? 'front' : 'back');
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        setIsProcessing(true);
        const photo = await cameraRef.current.takePictureAsync();
        if (photo) {
          console.log('Photo taken:', photo.uri);
          // Just save the photo URI - processing will happen in RatingScreen via usePhotoUpload hook
          setCapturedImage(photo.uri);
        }
      } catch (error) {
        Alert.alert(t('common.error'), t('camera.errorCapture'));
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
        console.log('Image selected from library:', result.assets[0].uri);
        // Just save the photo URI - processing will happen in RatingScreen via usePhotoUpload hook
        setCapturedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('camera.errorSelect'));
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
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        {isProcessing && (
          <View style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            zIndex: 20, 
            justifyContent: 'center', 
            alignItems: 'center', 
            backgroundColor: 'rgba(0,0,0,0.7)' 
          }}>
            <View style={{ alignItems: 'center', gap: 16 }}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '600' }}>
                {t('camera.processing')}
              </Text>
            </View>
          </View>
        )}

        {capturedImage ? (
          <View style={{ flex: 1 }}>
            <Image
              source={{ uri: capturedImage }}
              style={{ flex: 1, width: '100%' }}
              resizeMode="contain"
            />
            <View style={{
              flexDirection: orientation === 'landscape' ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              backgroundColor: 'rgba(0,0,0,0.9)',
              paddingHorizontal: 16,
              paddingVertical: 24,
              height: orientation === 'landscape' ? 128 : undefined
            }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  height: 48,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.4)',
                  borderRadius: 12,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }}
                onPress={resetImage}
              >
                <Text style={{ color: '#ffffff', fontWeight: '600' }}>{t('camera.retake')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  height: 48,
                  backgroundColor: '#16a34a',
                  borderRadius: 12,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
                onPress={handleSave}
              >
                <Text style={{ color: '#ffffff', fontWeight: '600' }}>{t('camera.usePhoto')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  height: 48,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
                onPress={handleClose}
              >
                <Text style={{ color: '#ffffff', fontWeight: '600' }}>{t('camera.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <View style={{
              flexDirection: orientation === 'landscape' ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'rgba(0,0,0,0.8)',
              paddingHorizontal: 20,
              paddingTop: 56,
              paddingBottom: 16
            }}>
              <TouchableOpacity
                style={{
                  height: 48,
                  width: 48,
                  borderRadius: 24,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
                onPress={handleClose}
              >
                <Icon name="close" style={{ width: 24, height: 24 }} fill="#ffffff" />
              </TouchableOpacity>
              <Text style={{
                color: '#ffffff',
                fontSize: orientation === 'landscape' ? 18 : 20,
                fontWeight: 'bold',
                marginVertical: orientation === 'landscape' ? 8 : 0
              }}>
                {t('camera.takePhoto')}
              </Text>
              <View style={{ height: 48, width: 48 }} />
            </View>

            <View style={{ flex: 1 }}>
              <CameraView
                style={{ flex: 1, width: '100%', height: '100%' }}
                facing={facing}
                ref={cameraRef}
                responsiveOrientationWhenOrientationLocked={true}
              />

              <View style={{
                position: 'absolute',
                top: orientation === 'landscape' ? 20 : 96,
                left: orientation === 'landscape' ? 8 : 20,
                right: orientation === 'landscape' ? undefined : 20,
                width: orientation === 'landscape' ? 128 : undefined,
                alignItems: 'center',
                borderRadius: 12,
                backgroundColor: 'rgba(0,0,0,0.7)',
                padding: 16
              }}>
                <Text style={{
                  color: '#ffffff',
                  fontSize: orientation === 'landscape' ? 14 : 16,
                  fontWeight: '600',
                  textAlign: 'center'
                }}>
                  {t('camera.instructionsTitle')}
                </Text>
                <Text style={{
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: orientation === 'landscape' ? 12 : 14,
                  textAlign: 'center',
                  marginTop: 4
                }}>
                  {t('camera.instructionsSubtitle')}
                </Text>
              </View>
            </View>

            <View style={{
              position: 'absolute',
              bottom: orientation === 'landscape' ? 32 : 64,
              left: 0,
              right: 0,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-around',
              paddingHorizontal: orientation === 'landscape' ? 16 : 24
            }}>
              <TouchableOpacity
                style={{
                  height: orientation === 'landscape' ? 56 : 64,
                  width: orientation === 'landscape' ? 56 : undefined,
                  paddingHorizontal: orientation === 'landscape' ? 0 : 24,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: 9999,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
                onPress={pickImageFromLibrary}
              >
                <View style={{ alignItems: 'center', gap: 4 }}>
                  <Icon name="image" style={{ width: orientation === 'landscape' ? 20 : 24, height: orientation === 'landscape' ? 20 : 24 }} fill="#ffffff" />
                  {orientation === 'portrait' && (
                    <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 12 }}>
                      {t('camera.fromLibrary')}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{
                  height: 80,
                  width: 80,
                  borderRadius: 40,
                  borderWidth: 4,
                  borderColor: 'rgba(255,255,255,0.4)',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
                onPress={takePicture}
              >
                <Icon name="camera" style={{ width: 32, height: 32 }} fill="#ffffff" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{
                  height: orientation === 'landscape' ? 56 : 64,
                  width: orientation === 'landscape' ? 56 : undefined,
                  paddingHorizontal: orientation === 'landscape' ? 0 : 24,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: 9999,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
                onPress={toggleCameraFacing}
              >
                <View style={{ alignItems: 'center', gap: 4 }}>
                  <Icon name="flip-2" style={{ width: orientation === 'landscape' ? 20 : 24, height: orientation === 'landscape' ? 20 : 24 }} fill="#ffffff" />
                  {orientation === 'portrait' && (
                    <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 12 }}>
                      {t('camera.flip')}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}