import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MarketDetailsState {
  isCheckedIn: boolean;
  setIsCheckedIn: (checked: boolean) => void;
  stallRatings: any[];
  setStallRatings: (ratings: any[]) => void;
  loadingRatings: boolean;
  setLoadingRatings: (loading: boolean) => void;
  averageRating: number | null;
  setAverageRating: (avg: number | null) => void;
}

export const useMarketDetailsStore = create<MarketDetailsState>()(
  persist(
    (set) => ({
      isCheckedIn: false,
      setIsCheckedIn: (checked) => set({ isCheckedIn: checked }),
      stallRatings: [],
      setStallRatings: (ratings) => set({ stallRatings: ratings }),
      loadingRatings: true,
      setLoadingRatings: (loading) => set({ loadingRatings: loading }),
      averageRating: null,
      setAverageRating: (avg) => set({ averageRating: avg }),
    }),
    {
      name: 'market-details-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({}),
    }
  )
);
