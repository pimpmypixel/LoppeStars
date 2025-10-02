import React, { createContext, useContext } from 'react';
import { useAppStore } from '../stores/appStore';
import { Market } from '../types/common/market';
import { MarketContextType, MarketProviderProps } from '../types/contexts/MarketContext';

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export function MarketProvider({ children }: MarketProviderProps) {
  const { selectedMarket, setSelectedMarket } = useAppStore();

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