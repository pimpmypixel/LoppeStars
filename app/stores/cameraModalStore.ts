import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// UI/UX state for CameraModal
interface CameraModalState {
  facing: 'front' | 'back';
  setFacing: (facing: 'front' | 'back') => void;
  capturedImage: string | null;
  setCapturedImage: (uri: string | null) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

export const useCameraModalStore = create<CameraModalState>()(
  persist(
    (set) => ({
      facing: 'back',
      setFacing: (facing) => set({ facing }),
      capturedImage: null,
      setCapturedImage: (uri) => set({ capturedImage: uri }),
      isProcessing: false,
      setIsProcessing: (processing) => set({ isProcessing: processing }),
    }),
    {
      name: 'camera-modal-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ facing: state.facing }), // Only persist camera facing
    }
  )
);
