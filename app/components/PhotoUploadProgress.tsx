import React from 'react';
import { View, Modal, ActivityIndicator, StyleSheet } from 'react-native';
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
      <View style={styles.overlay}>
        <Card style={styles.card}>
          <CardContent style={styles.cardContent}>
            <ActivityIndicator
              size="large"
              color={getProgressColor()}
            />

            <Text style={styles.statusText}>
              {getStatusText()}
            </Text>

            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={{
                    ...styles.progressFill,
                    width: `${Math.max(0, Math.min(100, progress))}%`,
                    backgroundColor: getProgressColor(),
                  }}
                />
              </View>
              <Text variant="muted" style={styles.progressText}>
                {Math.round(progress)}%
              </Text>
            </View>

            {error && (
              <Text style={styles.errorText}>
                {error}
              </Text>
            )}
          </CardContent>
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  card: {
    width: 288,
  },
  cardContent: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 24,
  },
  statusText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    textAlign: 'center',
  },
});