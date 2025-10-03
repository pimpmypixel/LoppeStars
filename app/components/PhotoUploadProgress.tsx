import React from 'react';
import { View, Modal, ActivityIndicator } from 'react-native';
import { useTranslation } from '../utils/localization';
import { Card, CardContent } from './ui-kitten';
import { Text } from './ui-kitten';
import { PhotoUploadProgressProps } from '../types/components/PhotoUploadProgress';

export default function PhotoUploadProgress({
  visible,
  progress,
  isProcessing,
  isUploading,
  error
}: PhotoUploadProgressProps) {
  const { t } = useTranslation();
  if (!visible) return null;

  const getStatusText = () => {
    if (error) return t('form.photoUploadError');
    if (isProcessing) return t('formPhotoStatus.detecting');
    if (isUploading && progress < 50) return t('formPhotoStatus.preparing');
    if (isUploading && progress < 80) return t('formPhotoStatus.uploading');
    if (isUploading && progress >= 80) return t('formPhotoStatus.finishing');
    return t('formPhotoStatus.processing');
  };

  const getProgressColor = () => {
    if (error) return '#ff3b30';
    if (progress >= 100) return '#34c759';
    return '#007AFF';
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 items-center justify-center bg-black/70" {...({} as any)}>
        <Card className="w-72">
          <CardContent className="items-center gap-4 py-6">
            <ActivityIndicator
              size="large"
              color={getProgressColor()}
            />

            <Text className="text-center text-base font-semibold">
              {getStatusText()}
            </Text>

            <View className="w-full items-center" {...({} as any)}>
              <View className="w-full h-2 bg-muted rounded-full overflow-hidden" {...({} as any)}>
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(0, Math.min(100, progress))}%`,
                    backgroundColor: getProgressColor(),
                  }}
                />
              </View>
              <Text variant="muted" className="mt-2 text-sm font-medium">
                {Math.round(progress)}%
              </Text>
            </View>

            {error && (
              <Text className="text-destructive text-sm text-center">
                {error}
              </Text>
            )}
          </CardContent>
        </Card>
      </View>
    </Modal>
  );
}