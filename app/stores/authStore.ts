import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, User } from '@supabase/supabase-js';

export interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  permissionsRequested: boolean;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setPermissionsRequested: (requested: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      user: null,
      loading: true,
      permissionsRequested: false,
      setSession: (session) => set({ session, user: session?.user ?? null }),
      setLoading: (loading) => set({ loading }),
      setPermissionsRequested: (permissionsRequested) => set({ permissionsRequested }),
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ session: state.session, user: state.user }),
    }
  )
);
