export interface PhotoUploadProgressProps {
  visible: boolean;
  progress: number;
  isProcessing: boolean;
  isUploading: boolean;
  error?: string;
}