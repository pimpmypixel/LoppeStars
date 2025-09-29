import React from 'react';
import { View, Text, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { t } from '../utils/localization';

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
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ActivityIndicator
            size="large"
            color={getProgressColor()}
            style={styles.spinner}
          />
          
          <Text style={styles.statusText}>
            {getStatusText()}
          </Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${Math.max(0, Math.min(100, progress))}%`,
                    backgroundColor: getProgressColor(),
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round(progress)}%
            </Text>
          </View>

          {error && (
            <Text style={styles.errorText}>
              {error}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    minWidth: 280,
    maxWidth: 320,
  },
  spinner: {
    marginBottom: 20,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBackground: {
    width: '100%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 14,
    color: '#ff3b30',
    textAlign: 'center',
    marginTop: 10,
  },
});