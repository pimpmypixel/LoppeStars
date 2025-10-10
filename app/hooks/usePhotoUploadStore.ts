import { create } from 'zustand';

export interface PhotoUploadProgress {
  isUploading: boolean;
  isProcessing: boolean;
  progress: number;
  error?: string;
}

export interface PhotoUploadState {
  uploadProgress: PhotoUploadProgress;
  setUploadProgress: (progress: PhotoUploadProgress) => void;
  resetUpload: () => void;
}

export const usePhotoUploadStore = create<PhotoUploadState>((set) => ({
  uploadProgress: { isUploading: false, isProcessing: false, progress: 0 },
  setUploadProgress: (progress) => set({ uploadProgress: progress }),
  resetUpload: () => set({ uploadProgress: { isUploading: false, isProcessing: false, progress: 0 } }),
}));
