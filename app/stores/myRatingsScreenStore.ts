import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// State for MyRatingsScreen
interface MyRatingsScreenState {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  refreshing: boolean;
  setRefreshing: (refreshing: boolean) => void;
}

export const useMyRatingsScreenStore = create<MyRatingsScreenState>()(
  persist(
    (set) => ({
      loading: true,
      setLoading: (loading) => set({ loading }),
      refreshing: false,
      setRefreshing: (refreshing) => set({ refreshing }),
    }),
    {
      name: 'my-ratings-screen-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({}),
    }
  )
);
