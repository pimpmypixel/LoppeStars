import { Market } from '../common/market';

export interface MarketContextType {
  selectedMarket: Market | null;
  setSelectedMarket: (market: Market | null) => void;
}

export interface MarketProviderProps {
  children: React.ReactNode;
}