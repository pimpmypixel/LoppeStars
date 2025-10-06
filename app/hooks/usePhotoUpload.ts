import { useState, useCallback } from 'react';
import { getInfoAsync, readAsStringAsync } from 'expo-file-system/legacy';
import { supabase } from '../utils/supabase';
import { getAPIBaseUrl } from '../utils/api';

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

      // Step 1: Upload original photo to stall-photos bucket (25% progress)
      setUploadProgress(prev => ({
        ...prev,
        progress: 25,
      }));

      console.log('[photo-upload] Uploading original photo to stall-photos bucket');

      // Read image file as base64
      const fileInfo = await getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        throw new Error('Image file does not exist');
      }

      const base64Data = await readAsStringAsync(imageUri, {
        encoding: 'base64',
      });

      // Convert base64 to Uint8Array for upload
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `${userId}/${timestamp}.jpg`;

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

      console.log('[photo-upload] Original photo uploaded successfully:', uploadData.path);

      // Get public URL for original image
      const { data: originalUrlData } = supabase.storage
        .from('stall-photos')
        .getPublicUrl(uploadData.path);

      // Step 2: Process image via FastAPI /process endpoint (50% progress)
      setUploadProgress(prev => ({
        ...prev,
        progress: 50,
      }));

      console.log('[photo-upload] Processing image with FastAPI /process endpoint');

      // Get API base URL (auto-detects local or production)
      const API_BASE_URL = await getAPIBaseUrl();
      console.log('[photo-upload] Using API:', API_BASE_URL);
      
      const processResponse = await fetch(`${API_BASE_URL}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imagePath: uploadData.path,
          userId: userId,
          mode: 'pixelate',
          pixelateSize: 15,
          blurStrength: 31,
          downscaleForDetection: 800
        })
      });

      if (!processResponse.ok) {
        const errorText = await processResponse.text();
        console.error('Processing error:', processResponse.status, errorText);
        throw new Error(`Processing failed: ${processResponse.statusText}`);
      }

      const processData = await processResponse.json();
      console.log('[photo-upload] API response:', processData);

      if (!processData?.processedImageUrl) {
        throw new Error('No processed image URL returned from API');
      }

      // Step 3: Complete (100% progress)
      setUploadProgress(prev => ({
        ...prev,
        isProcessing: false,
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
        originalUrl: originalUrlData.publicUrl,
        processedUrl: processData.processedImageUrl,
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