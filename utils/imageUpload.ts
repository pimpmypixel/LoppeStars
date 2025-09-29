import { supabase } from './supabase';

export interface UploadImageResult {
  success: boolean;
  url?: string;
  error?: string;
}

export const uploadImageToSupabase = async (
  imageUri: string,
  userId: string,
  bucketName: string = 'stall-photos'
): Promise<UploadImageResult> => {
  try {
    // Generate a unique filename
    const filename = `${userId}/${Date.now()}.jpg`;
    
    // Read the file as a Uint8Array for React Native
    const response = await fetch(imageUri);
    const arrayBuffer = await response.arrayBuffer();
    const fileData = new Uint8Array(arrayBuffer);
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filename, fileData, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }

    // Get the public URL for the uploaded image
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    return {
      success: true,
      url: urlData.publicUrl
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const deleteImageFromSupabase = async (
  imagePath: string,
  bucketName: string = 'stall-photos'
): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([imagePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
};