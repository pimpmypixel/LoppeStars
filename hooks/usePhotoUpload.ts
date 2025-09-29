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
  url?: string;
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

      console.log('📷 Starting photo upload process...');

      // Step 1: Face detection and blur (30% progress)
      setUploadProgress(prev => ({
        ...prev,
        progress: 30,
      }));

      console.log('🔍 Detecting and blurring faces...');
      const faceProcessResult = await detectAndBlurFaces(imageUri);
      
      if (!faceProcessResult.success) {
        throw new Error(faceProcessResult.error || 'Face processing failed');
      }

      const processedImageUri = faceProcessResult.uri || imageUri;
      console.log('✅ Face processing completed');

      // Step 2: Start upload process (50% progress)
      setUploadProgress(prev => ({
        ...prev,
        isProcessing: false,
        progress: 50,
      }));

      console.log('☁️ Uploading to Supabase...');

      // Step 3: Upload to Supabase (80% progress)
      setUploadProgress(prev => ({
        ...prev,
        progress: 80,
      }));

      const uploadResult = await uploadImageToSupabase(processedImageUri, userId);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      // Step 4: Complete (100% progress)
      setUploadProgress(prev => ({
        ...prev,
        progress: 100,
      }));

      console.log('✅ Photo upload completed successfully');
      
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
        url: uploadResult.url,
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