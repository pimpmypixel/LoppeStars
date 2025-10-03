import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Market } from '../types/common/market';
import { getHealth, processImage, getMarketsToday } from '../utils/baseApi';

interface AppState {
    selectedMarket: Market | null;
    setSelectedMarket: (market: Market | null) => void;
    language: 'en' | 'da';
    setLanguage: (language: 'en' | 'da') => void;
    apiHealthy: boolean | null;
    apiError: string | null;
    checkApi: () => Promise<void>;
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
            apiHealthy: null,
            apiError: null,
            checkApi: async () => {
                set({ apiHealthy: null, apiError: null });
                try {
                    await getHealth();
                    await processImage({ imagePath: 'https://example.com/test.jpg', userId: 'test-user', blurStrength: 31 });
                    await getMarketsToday();
                    set({ apiHealthy: true });
                } catch (error) {
                    const msg = error instanceof Error ? error.message : 'Unknown error';
                    console.error('API connectivity check failed:', msg);
                    set({ apiHealthy: false, apiError: msg });
                }
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

// Hook for direct access to API health status
export const useApiHealth = () => {
    const { apiHealthy, apiError, checkApi } = useAppStore();
    return { apiHealthy, apiError, checkApi };
};