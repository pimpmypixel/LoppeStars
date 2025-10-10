import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type OAuthProvider = 'google' | 'facebook' | null;

export interface OAuthState {
  isLoading: boolean;
  loadingProvider: OAuthProvider;
  setIsLoading: (isLoading: boolean) => void;
  setLoadingProvider: (provider: OAuthProvider) => void;
  resetOAuthLoading: () => void;
}

export const useOAuthStore = create<OAuthState>()(
  persist(
    (set) => ({
      isLoading: false,
      loadingProvider: null,
      setIsLoading: (isLoading) => set({ isLoading }),
      setLoadingProvider: (provider) => set({ loadingProvider: provider }),
      resetOAuthLoading: () => set({ isLoading: false, loadingProvider: null }),
    }),
    {
      name: 'oauth-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
