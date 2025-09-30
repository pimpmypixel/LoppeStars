import React from 'react';
import { View, Modal, ActivityIndicator } from 'react-native';
import { t } from '../utils/localization';
import { Card, CardContent } from './ui/card';
import { Text } from './ui/text';

interface PhotoUploadProgressProps {
  visible: boolean;
  progress: number;
  isProcessing: boolean;
  isUploading: boolean;
  error?: string;
}

export default function PhotoUploadProgress({
  visible,
  progress,
  isProcessing,
  isUploading,
  error
}: PhotoUploadProgressProps) {
  if (!visible) return null;

  const getStatusText = () => {
    if (error) return t('form.photoUploadError');
    if (isProcessing) return 'Detecting and blurring faces...';
    if (isUploading && progress < 50) return 'Preparing upload...';
    if (isUploading && progress < 80) return 'Uploading photo...';
    if (isUploading && progress >= 80) return 'Finishing upload...';
    return 'Processing...';
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