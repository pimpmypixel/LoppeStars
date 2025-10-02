import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Market } from '../types/common/market';

interface AppState {
    selectedMarket: Market | null;
    setSelectedMarket: (market: Market | null) => void;
    language: 'en' | 'da';
    setLanguage: (language: 'en' | 'da') => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            selectedMarket: null,
            setSelectedMarket: (market: Market | null) => set({ selectedMarket: market }),
            language: 'da', // Default to Danish
            setLanguage: (language: 'en' | 'da') => {
                set({ language })
            },
        }),
        {
            name: 'app-store-v2', // Changed version to clear old persisted data
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);

// Hook for direct access to selected market
export const useSelectedMarket = () => {
    const { selectedMarket, setSelectedMarket } = useAppStore();
    return { selectedMarket, setSelectedMarket };
};

// Hook for direct access to language
export const useLanguage = () => {
    const { language, setLanguage } = useAppStore();
    return { language, setLanguage };
};