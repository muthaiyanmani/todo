import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { authApi } from '../services/api/auth.api';

interface AuthStore {
  user: User | null;
  isInitialized: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  clearUser: () => void;
  setInitialized: (initialized: boolean) => void;
  
  // Computed properties
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isInitialized: false,

      setUser: (user: User | null) => {
        set({ user });
      },

      clearUser: () => {
        set({ user: null });
        authApi.clearTokens();
      },

      setInitialized: (initialized: boolean) => {
        set({ isInitialized: initialized });
      },

      isAuthenticated: () => {
        return !!get().user && authApi.isAuthenticated();
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
);

// Initialize auth state on app start
export const initializeAuth = async () => {
  const { setUser, setInitialized } = useAuthStore.getState();
  
  try {
    if (authApi.isAuthenticated()) {
      // Try to get current user to validate token
      const user = await authApi.getCurrentUser();
      setUser(user);
    }
  } catch (error) {
    // Token is invalid, clear everything
    console.warn('Token validation failed:', error);
    authApi.clearTokens();
    setUser(null);
  } finally {
    setInitialized(true);
  }
};