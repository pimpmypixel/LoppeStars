import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// State for MarketsScreen
interface MarketsScreenState {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  refreshing: boolean;
  setRefreshing: (refreshing: boolean) => void;
}

export const useMarketsScreenStore = create<MarketsScreenState>()(
  persist(
    (set) => ({
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      refreshing: false,
      setRefreshing: (refreshing) => set({ refreshing }),
    }),
    {
      name: 'markets-screen-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ searchQuery: state.searchQuery }),
    }
  )
);
