import { create } from 'zustand';

interface ScrapingState {
  isScrapingActive: boolean;
  lastScrapingResult: {
    success: boolean;
    message: string;
    timestamp: string;
  } | null;
  setScrapingActive: (active: boolean) => void;
  setScrapingResult: (result: { success: boolean; message: string; timestamp: string }) => void;
  clearScrapingResult: () => void;
}

export const useScrapingStore = create<ScrapingState>((set) => ({
  isScrapingActive: false,
  lastScrapingResult: null,
  setScrapingActive: (active: boolean) => set({ isScrapingActive: active }),
  setScrapingResult: (result: { success: boolean; message: string; timestamp: string }) =>
    set({ lastScrapingResult: result, isScrapingActive: false }),
  clearScrapingResult: () => set({ lastScrapingResult: null }),
}));