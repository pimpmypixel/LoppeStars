import React, { createContext, useContext, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import { useAuth } from './AuthContext';
import { Market } from '../types/common/market';
import { MarketContextType, MarketProviderProps } from '../types/contexts/MarketContext';
import { logEvent, getLastSelectedMarket } from '../utils/eventLogger';

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export function MarketProvider({ children }: MarketProviderProps) {
  const { selectedMarket, setSelectedMarket: setStoreMarket } = useAppStore();
  const { user } = useAuth();

  // Load last selected market on mount
  useEffect(() => {
    if (user?.id && !selectedMarket) {
      loadLastSelectedMarket();
    }
  }, [user?.id]);

  const loadLastSelectedMarket = async () => {
    if (!user?.id) return;

    const { marketId } = await getLastSelectedMarket(user.id);
    if (marketId) {
      // Note: We'd need to fetch the full market data here
      // For now, just log that we found a previous selection
      console.log('Last selected market ID:', marketId);
    }
  };

  // Enhanced setSelectedMarket that enforces one-at-a-time and logs event
  const setSelectedMarket = async (market: Market | null) => {
    if (!user?.id) {
      console.warn('Cannot select market: user not authenticated');
      return;
    }

    // Unselect previous market (one at a time)
    if (selectedMarket && market && selectedMarket.id !== market.id) {
      console.log('Unselecting previous market:', selectedMarket.name);
    }

    // Update store
    setStoreMarket(market);

    // Log event if selecting a market
    if (market) {
      await logEvent(
        user.id,
        'market_selected',
        'market',
        market.id,
        {
          market_name: market.name,
          market_city: market.city,
          market_address: market.address,
          selected_at: new Date().toISOString(),
        }
      );
      console.log('Market selected and event logged:', market.name);
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