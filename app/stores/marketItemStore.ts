import { create } from 'zustand';
import { Market } from '../types/common/market';

export interface RatingData {
  averageRating: number;
  ratingsCount: number;
}

export interface MarketItemState {
  ratingData: RatingData;
  setRatingData: (data: RatingData) => void;
}

export const useMarketItemStore = create<MarketItemState>((set) => ({
  ratingData: { averageRating: 0, ratingsCount: 0 },
  setRatingData: (data) => set({ ratingData: data }),
}));
