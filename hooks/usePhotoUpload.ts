import { useState, useCallback } from 'react';
import { uploadImageToSupabase } from '../utils/imageUpload';
import { detectAndBlurFaces } from '../utils/faceDetection';

interface UploadProgress {
  isUploading: boolean;
  isProcessing: boolean;
  progress: number;
  error?: string;
}

interface UploadResult {
  success: boolean;
  originalUrl?: string;
  processedUrl?: string;
  error?: string;
}

export const usePhotoUpload = () => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    isUploading: false,
    isProcessing: false,
    progress: 0,
  });

  const uploadPhoto = useCallback(async (
    imageUri: string,
    userId: string
  ): Promise<UploadResult> => {
    try {
      // Start processing
      setUploadProgress({
        isUploading: true,
        isProcessing: true,
        progress: 10,
      });

      console.log('[photo-upload] Starting photo upload process');

      // Step 1: Upload original photo to stall_photos bucket (25% progress)
      setUploadProgress(prev => ({
        ...prev,
        progress: 25,
      }));

      console.log('[photo-upload] Uploading original photo to stall-photos bucket');
      const originalUploadResult = await uploadImageToSupabase(imageUri, userId, 'stall-photos');

      if (!originalUploadResult.success) {
        throw new Error(originalUploadResult.error || 'Original photo upload failed');
      }

      console.log('[photo-upload] Original photo uploaded successfully');

      // Step 2: Face detection and blur (50% progress)
      setUploadProgress(prev => ({
        ...prev,
        progress: 50,
      }));

      console.log('[photo-upload] Detecting and blurring faces');
      const faceProcessResult = await detectAndBlurFaces(imageUri);

      if (!faceProcessResult.success) {
        throw new Error(faceProcessResult.error || 'Face processing failed');
      }

      const processedImageUri = faceProcessResult.uri || imageUri;
      console.log('[photo-upload] Face processing completed');

      // Step 3: Upload processed photo to stall_photos_processed bucket (75% progress)
      setUploadProgress(prev => ({
        ...prev,
        isProcessing: false,
        progress: 75,
      }));

      console.log('[photo-upload] Uploading processed photo to stall-photos-processed bucket');
      const processedUploadResult = await uploadImageToSupabase(processedImageUri, userId, 'stall-photos-processed');

      if (!processedUploadResult.success) {
        throw new Error(processedUploadResult.error || 'Processed photo upload failed');
      }

      console.log('[photo-upload] Processed photo uploaded successfully');

      // Step 4: Complete (100% progress)
      setUploadProgress(prev => ({
        ...prev,
        progress: 100,
      }));

      console.log('[photo-upload] Photo upload completed successfully');

      // Reset after short delay to show completion
      setTimeout(() => {
        setUploadProgress({
          isUploading: false,
          isProcessing: false,
          progress: 0,
        });
      }, 500);

      return {
        success: true,
        originalUrl: originalUploadResult.url,
        processedUrl: processedUploadResult.url,
      };

    } catch (error) {
      console.error('❌ Photo upload error:', error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      setUploadProgress({
        isUploading: false,
        isProcessing: false,
        progress: 0,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }, []);

  const resetUpload = useCallback(() => {
    setUploadProgress({
      isUploading: false,
      isProcessing: false,
      progress: 0,
    });
  }, []);

  return {
    uploadProgress,
    uploadPhoto,
    resetUpload,
  };
};