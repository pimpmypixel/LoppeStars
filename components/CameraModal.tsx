import React, { useState, useRef } from 'react';
import { View, Alert, Image, Modal, useWindowDimensions, ActivityIndicator } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { getInfoAsync, readAsStringAsync } from 'expo-file-system/legacy';
import { t } from '../utils/localization';
import { Button } from './ui/button';
import { Text } from './ui/text';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Camera, ImageIcon, RefreshCcw, X } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';

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
  const { width, height } = useWindowDimensions();
  const orientation = width > height ? 'landscape' : 'portrait';
  const { user } = useAuth();

  console.log('Current orientation:', orientation, { width, height });

  if (!permission) {
    return <Modal visible={visible} transparent />;
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <View
          className={`flex-1 items-center justify-center bg-black/90 px-6 ${
            orientation === 'landscape' ? 'py-4' : 'py-8'
          }`}
          {...({} as any)}
        >
          <Card className={`w-full max-w-sm gap-5 border border-border/60 bg-card/95 ${
            orientation === 'landscape' ? 'max-w-md' : 'max-w-sm'
          }`}>
            <CardHeader className="items-center">
              <CardTitle className={`text-center ${
                orientation === 'landscape' ? 'text-lg' : 'text-xl'
              }`}>
                {t('permissions.camera.title')}
              </CardTitle>
              <CardDescription className={`text-center ${
                orientation === 'landscape' ? 'text-sm' : 'text-base'
              }`}>
                {t('permissions.camera.message')}
              </CardDescription>
            </CardHeader>
            <CardContent className="gap-3">
              <Button className="w-full h-12" onPress={requestPermission} {...({} as any)}>
                <Text className="font-medium">
                  {t('permissions.camera.grant')}
                </Text>
              </Button>
              <Button
                variant="ghost"
                className="w-full h-12"
                onPress={onClose}
                {...({} as any)}
              >
                <Text className="text-muted-foreground font-medium">
                  {t('common.cancel')}
                </Text>
              </Button>
            </CardContent>
          </Card>
        </View>
      </Modal>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const processImageWithEdgeFunction = async (imageUri: string) => {
    try {
      console.log('Uploading image to stall-photos bucket...');
      
      // Check if user is authenticated
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Read image file as base64
      console.log('Reading image file...');
      const fileInfo = await getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        throw new Error('Image file does not exist');
      }

      const base64Data = await readAsStringAsync(imageUri, {
        encoding: 'base64',
      });

      // Convert base64 to Uint8Array for upload
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      // Use the existing authenticated Supabase client
      const { supabase } = await import('../utils/supabase');

      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `${user.id}/${timestamp}.jpg`;
      
      // Upload to stall-photos bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('stall-photos')
        .upload(fileName, binaryData, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      console.log('Image uploaded successfully:', uploadData.path);

      // Call Edge Function to process the image
      console.log('Calling edge function to process image...');
      const { data, error } = await supabase.functions.invoke('process-image', {
        body: { 
          imagePath: uploadData.path,
          userId: user.id 
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Processing failed: ${error.message}`);
      }

      console.log('Edge function response:', data);
      
      if (!data.processedImageUrl) {
        throw new Error('No processed image URL returned');
      }

      return { success: true, uri: data.processedImageUrl };
    } catch (error) {
      console.error('Error in image processing flow:', error);
      return { 
        success: false, 
        uri: imageUri, 
        error: error instanceof Error ? error.message : 'Processing failed' 
      };
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        setIsProcessing(true);
        const photo = await cameraRef.current.takePictureAsync();
        if (photo) {
          console.log('Photo taken, processing with edge function...');
          // Process image for GDPR compliance (blur faces if detected)
          const processedImage = await processImageWithEdgeFunction(photo.uri);
          console.log('Edge function result:', processedImage);
          setCapturedImage(processedImage.uri || photo.uri);

          if (processedImage.error) {
            console.warn('Edge function warning:', processedImage.error);
          }
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
        // Process selected image for GDPR compliance
        const processedImage = await processImageWithEdgeFunction(result.assets[0].uri);
        setCapturedImage(processedImage.uri || result.assets[0].uri);

        if (processedImage.error) {
          console.warn('Edge function warning:', processedImage.error);
        }
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
      <View className="flex-1 bg-black" {...({} as any)}>
        {isProcessing && (
          <View className="absolute inset-0 z-20 items-center justify-center bg-black/70" {...({} as any)}>
            <View className="items-center gap-4" {...({} as any)}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text className="text-white text-lg font-semibold">{t('camera.processing')}</Text>
            </View>
          </View>
        )}

        {capturedImage ? (
          <View className="flex-1" {...({} as any)}>
            <Image
              source={{ uri: capturedImage }}
              className="flex-1 w-full"
              resizeMode="contain"
              {...({} as any)}
            />
            <View
              className={`flex-row items-center justify-between gap-3 bg-black/90 px-4 py-6 ${
                orientation === 'landscape' ? 'flex-col h-32' : 'flex-row'
              }`}
              {...({} as any)}
            >
              <Button
                variant="outline"
                className={`border-white/40 ${orientation === 'landscape' ? 'flex-1 h-12' : 'flex-1 h-12'}`}
                onPress={resetImage}
                {...({} as any)}
              >
                <Text className="text-white font-medium">{t('camera.retake')}</Text>
              </Button>
              <Button
                className={`bg-green-600 hover:bg-green-700 ${orientation === 'landscape' ? 'flex-1 h-12' : 'flex-1 h-12'}`}
                onPress={handleSave}
                {...({} as any)}
              >
                <Text className="text-white font-medium">{t('camera.usePhoto')}</Text>
              </Button>
              <Button
                variant="ghost"
                className={`text-white ${orientation === 'landscape' ? 'flex-1 h-12' : 'flex-1 h-12'}`}
                onPress={handleClose}
                {...({} as any)}
              >
                <Text className="text-white font-medium">{t('camera.cancel')}</Text>
              </Button>
            </View>
          </View>
        ) : (
          <>
            <View
              className={`flex-row items-center justify-between bg-black/80 px-5 pt-14 pb-4 ${
                orientation === 'landscape' ? 'flex-col py-2' : 'flex-row'
              }`}
              {...({} as any)}
            >
              <Button
                variant="ghost"
                className="h-12 w-12 rounded-full bg-white/10"
                onPress={handleClose}
                {...({} as any)}
              >
                <X size={24} color="#ffffff" />
              </Button>
              <Text className={`text-white text-xl font-bold ${
                orientation === 'landscape' ? 'text-lg my-2' : 'text-lg'
              }`}>
                {t('camera.takePhoto')}
              </Text>
              <View className="h-12 w-12" {...({} as any)} />
            </View>

            <View className="flex-1" {...({} as any)}>
              <CameraView
                style={{ flex: 1 }}
                facing={facing}
                ref={cameraRef}
                responsiveOrientationWhenOrientationLocked={true}
              />

              <View
                id='instructionsBox'
                className={`absolute items-center rounded-xl bg-black/70 p-4 ${
                  orientation === 'landscape' 
                    ? 'top-5 bottom-5 left-2 right-auto w-32' 
                    : 'top-24 left-5 right-5'
                }`}
                style={{
                  transform: orientation === 'landscape' 
                    ? [{ rotate: '90deg' }] 
                    : [{ rotate: '0deg' }]
                }}
                {...({} as any)}
              >
                <Text className={`text-white text-base font-semibold text-center ${
                  orientation === 'landscape' ? 'text-sm' : ''
                }`}>
                  {t('camera.instructionsTitle')}
                </Text>
                <Text className={`text-white/80 text-sm text-center ${
                  orientation === 'landscape' ? 'text-xs' : ''
                }`}>
                  {t('camera.instructionsSubtitle')}
                </Text>
              </View>
            </View>

            <View
              className={`absolute bottom-16 left-0 right-0 flex-row items-center justify-around px-6 ${
                orientation === 'landscape' ? 'bottom-8 px-4' : 'bottom-16 px-6'
              }`}
              {...({} as any)}
            >
              <Button
                variant="ghost"
                className={`bg-white/10 rounded-full ${orientation === 'landscape' ? 'h-14 w-14' : 'h-16 px-6'}`}
                onPress={pickImageFromLibrary}
                {...({} as any)}
              >
                <View className="items-center gap-1" {...({} as any)}>
                  <ImageIcon size={orientation === 'landscape' ? 20 : 24} color="#ffffff" />
                  {orientation === 'portrait' && (
                    <Text className="text-white font-medium text-xs">{t('camera.fromLibrary')}</Text>
                  )}
                </View>
              </Button>
              
              <Button
                className="h-20 w-20 rounded-full border-4 border-white/40 bg-white/20"
                onPress={takePicture}
                {...({} as any)}
              >
                <Camera size={32} color="#ffffff" />
              </Button>
              
              <Button
                variant="ghost"
                className={`bg-white/10 rounded-full ${orientation === 'landscape' ? 'h-14 w-14' : 'h-16 px-6'}`}
                onPress={toggleCameraFacing}
                {...({} as any)}
              >
                <View className="items-center gap-1" {...({} as any)}>
                  <RefreshCcw size={orientation === 'landscape' ? 20 : 24} color="#ffffff" />
                  {orientation === 'portrait' && (
                    <Text className="text-white font-medium text-xs">{t('camera.flip')}</Text>
                  )}
                </View>
              </Button>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}