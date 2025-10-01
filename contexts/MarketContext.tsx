import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Market } from '../types/common/market';
import { MarketContextType, MarketProviderProps } from '../types/contexts/MarketContext';

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export function MarketProvider({ children }: MarketProviderProps) {
  const [selectedMarket, setSelectedMarketState] = useState<Market | null>(null);

  useEffect(() => {
    loadSelectedMarket();
  }, []);

  const loadSelectedMarket = async () => {
    try {
      const storedMarket = await AsyncStorage.getItem('selectedMarket');
      if (storedMarket) {
        const market = JSON.parse(storedMarket);
        setSelectedMarketState(market);
      }
    } catch (error) {
      console.error('Error loading selected market:', error);
    }
  };

  const setSelectedMarket = async (market: Market | null) => {
    setSelectedMarketState(market);
    try {
      if (market) {
        await AsyncStorage.setItem('selectedMarket', JSON.stringify(market));
      } else {
        await AsyncStorage.removeItem('selectedMarket');
      }
    } catch (error) {
      console.error('Error saving selected market:', error);
    }
  };

  return (
    <MarketContext.Provider value={{ selectedMarket, setSelectedMarket }}>
      {children}
    </MarketContext.Provider>
  );
}

export function useMarket() {
  const context = useContext(MarketContext);
  if (context === undefined) {
    throw new Error('useMarket must be used within a MarketProvider');
  }
  return context;
}