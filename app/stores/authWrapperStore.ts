import { create } from 'zustand';

interface AuthWrapperState {
  showSplash: boolean;
  setShowSplash: (show: boolean) => void;
}

export const useAuthWrapperStore = create<AuthWrapperState>((set) => ({
  showSplash: true,
  setShowSplash: (show) => set({ showSplash: show }),
}));
