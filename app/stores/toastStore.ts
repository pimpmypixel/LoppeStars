import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// UI/UX state for Toast
interface ToastState {
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>()(
  persist(
    (set) => ({
      visible: false,
      message: '',
      type: 'success',
      showToast: (message, type = 'success') => set({ visible: true, message, type }),
      hideToast: () => set({ visible: false, message: '', type: 'success' }),
    }),
    {
      name: 'toast-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({}), // Don't persist toast visibility
    }
  )
);
