import React, { useState, useRef } from 'react';
import { View, Alert, Image, Modal } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { t } from '../utils/localization';
import { detectAndBlurFaces } from '../utils/faceDetection';
import { Button } from './ui/button';
import { Text } from './ui/text';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Camera, ImageIcon, RefreshCcw, X } from 'lucide-react-native';

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
        <View
          className="flex-1 items-center justify-center bg-black/90 px-6"
          {...({} as any)}
        >
          <Card className="w-full max-w-sm gap-5 border border-border/60 bg-card/95">
            <CardHeader className="items-center">
              <CardTitle className="text-center text-lg">
                {t('permissions.camera.title')}
              </CardTitle>
              <CardDescription className="text-center">
                {t('permissions.camera.message')}
              </CardDescription>
            </CardHeader>
            <CardContent className="gap-3">
              <Button className="w-full" onPress={requestPermission} {...({} as any)}>
                <Text className="font-medium">
                  {t('permissions.camera.grant')}
                </Text>
              </Button>
              <Button
                variant="ghost"
                className="w-full"
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
        const processedImage = await detectAndBlurFaces(result.assets[0].uri);
        setCapturedImage(processedImage.uri || result.assets[0].uri);
        
        if (processedImage.error) {
          console.warn('Face detection warning:', processedImage.error);
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
            <Text className="text-white text-lg font-semibold">{t('camera.processing')}</Text>
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
            <View className="flex-row items-center justify-between gap-3 bg-black/90 px-4 py-6" {...({} as any)}>
              <Button
                variant="outline"
                className="flex-1 h-12 border-white/40"
                onPress={resetImage}
                {...({} as any)}
              >
                <Text className="text-white font-medium">{t('camera.retake')}</Text>
              </Button>
              <Button
                className="flex-1 h-12"
                onPress={handleSave}
                {...({} as any)}
              >
                <Text className="text-primary-foreground font-medium">{t('camera.usePhoto')}</Text>
              </Button>
              <Button
                variant="ghost"
                className="flex-1 h-12"
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
              className="flex-row items-center justify-between bg-black/80 px-5 pt-14 pb-4"
              {...({} as any)}
            >
              <Button
                variant="ghost"
                className="h-10 w-10 rounded-full bg-white/10"
                onPress={handleClose}
                {...({} as any)}
              >
                <X size={20} color="#ffffff" />
              </Button>
              <Text className="text-white text-lg font-semibold">
                {t('camera.takePhoto')}
              </Text>
              <View className="h-10 w-10" {...({} as any)} />
            </View>

            <View className="flex-1" {...({} as any)}>
              <CameraView style={{ flex: 1 }} facing={facing} ref={cameraRef} />
              <View
                className="absolute top-24 left-5 right-5 items-center rounded-xl bg-black/70 p-4"
                {...({} as any)}
              >
                <Text className="text-white text-base font-semibold text-center">
                  {t('camera.instructionsTitle')}
                </Text>
                <Text className="text-white/80 text-sm text-center">
                  {t('camera.instructionsSubtitle')}
                </Text>
              </View>
            </View>

            <View
              className="absolute bottom-16 left-0 right-0 flex-row items-center justify-around px-6"
              {...({} as any)}
            >
              <Button
                variant="ghost"
                className="h-12 px-5 bg-white/10"
                onPress={pickImageFromLibrary}
                {...({} as any)}
              >
                <View className="flex-row items-center gap-2" {...({} as any)}>
                  <ImageIcon size={20} color="#ffffff" />
                  <Text className="text-white font-medium">{t('camera.fromLibrary')}</Text>
                </View>
              </Button>
              <Button
                className="h-16 w-16 rounded-full border border-white/40 bg-white/20"
                onPress={takePicture}
                {...({} as any)}
              >
                <Camera size={28} color="#ffffff" />
              </Button>
              <Button
                variant="ghost"
                className="h-12 px-5 bg-white/10"
                onPress={toggleCameraFacing}
                {...({} as any)}
              >
                <View className="flex-row items-center gap-2" {...({} as any)}>
                  <RefreshCcw size={20} color="#ffffff" />
                  <Text className="text-white font-medium">
                    {t('camera.flip')}
                  </Text>
                </View>
              </Button>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}