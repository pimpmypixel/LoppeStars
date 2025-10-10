import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ConnectivityStatus } from '../utils/connectivityCheck';

export interface ConnectivityState {
  status: ConnectivityStatus | null;
  isChecking: boolean;
  setStatus: (status: ConnectivityStatus | null) => void;
  setIsChecking: (isChecking: boolean) => void;
}

export const useConnectivityStore = create<ConnectivityState>()(
  persist(
    (set) => ({
      status: null,
      isChecking: true,
      setStatus: (status) => set({ status }),
      setIsChecking: (isChecking) => set({ isChecking }),
    }),
    {
      name: 'connectivity-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ status: state.status }),
    }
  )
);
