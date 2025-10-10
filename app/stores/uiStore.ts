
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Market } from '../types/common/market';


export interface UIState {
  refreshKey: number;
  setRefreshKey: (key: number) => void;
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
  stats: { ratingsCount: number; marketsCount: number };
  setStats: (stats: { ratingsCount: number; marketsCount: number }) => void;
  markets: Market[];
  setMarkets: (markets: Market[]) => void;
  userLocation: { latitude: number; longitude: number } | null;
  setUserLocation: (loc: { latitude: number; longitude: number } | null) => void;
  filteredMarkets: Market[];
  setFilteredMarkets: (markets: Market[]) => void;
  ratings: any[];
  setRatings: (ratings: any[]) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      refreshKey: 0,
      setRefreshKey: (key) => set({ refreshKey: key }),
      isAdmin: false,
      setIsAdmin: (isAdmin) => set({ isAdmin }),
      stats: { ratingsCount: 0, marketsCount: 0 },
      setStats: (stats) => set({ stats }),
      markets: [],
      setMarkets: (markets) => set({ markets }),
      userLocation: null,
      setUserLocation: (loc) => set({ userLocation: loc }),
  filteredMarkets: [],
  setFilteredMarkets: (markets) => set({ filteredMarkets: markets }),
  ratings: [],
  setRatings: (ratings) => set({ ratings }),
    }),
    {
      name: 'ui-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ stats: state.stats }),
    }
  )
);
