/**
 * Connectivity Context
 * 
 * Manages app connectivity state and provides it to all components
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ConnectivityStatus, performConnectivityCheck } from '../utils/connectivityCheck';

interface ConnectivityContextType {
  status: ConnectivityStatus | null;
  isChecking: boolean;
  recheckConnectivity: () => Promise<void>;
}

const ConnectivityContext = createContext<ConnectivityContextType | undefined>(undefined);

interface ConnectivityProviderProps {
  children: ReactNode;
}

export function ConnectivityProvider({ children }: ConnectivityProviderProps) {
  const [status, setStatus] = useState<ConnectivityStatus | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  const checkConnectivity = async () => {
    setIsChecking(true);
    try {
      const result = await performConnectivityCheck();
      setStatus(result);
    } catch (error) {
      console.error('❌ Connectivity check failed:', error);
      // Set offline status if check fails
      setStatus({
        database: { connected: false, error: 'Check failed' },
        api: { connected: false, error: 'Check failed' },
        overall: 'offline',
      });
    } finally {
      setIsChecking(false);
    }
  };

  // Perform initial connectivity check on mount
  useEffect(() => {
    checkConnectivity();
  }, []);

  const value: ConnectivityContextType = {
    status,
    isChecking,
    recheckConnectivity: checkConnectivity,
  };

  return (
    <ConnectivityContext.Provider value={value}>
      {children}
    </ConnectivityContext.Provider>
  );
}

export function useConnectivity() {
  const context = useContext(ConnectivityContext);
  if (context === undefined) {
    throw new Error('useConnectivity must be used within a ConnectivityProvider');
  }
  return context;
}
