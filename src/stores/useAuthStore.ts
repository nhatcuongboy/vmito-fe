import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { User } from '@/types/auth';

interface AuthState {
  // State
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;

  // Actions
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  updateToken: (token: string) => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: true,
        isHydrated: false,

        // Actions
        setAuth: (user, token) =>
          set(
            {
              user,
              accessToken: token,
              isAuthenticated: true,
              isLoading: false,
            },
            false,
            'setAuth'
          ),

        clearAuth: () =>
          set(
            {
              user: null,
              accessToken: null,
              isAuthenticated: false,
              isLoading: false,
            },
            false,
            'clearAuth'
          ),

        setUser: (user) => set({ user }, false, 'setUser'),

        setLoading: (loading) =>
          set({ isLoading: loading }, false, 'setLoading'),

        updateToken: (token) =>
          set({ accessToken: token }, false, 'updateToken'),

        setHydrated: (hydrated) =>
          set({ isHydrated: hydrated, isLoading: false }, false, 'setHydrated'),
      }),
      {
        name: 'auth-storage',
        // Only persist user and token, not loading state
        partialize: (state) => ({
          user: state.user,
          accessToken: state.accessToken,
          isAuthenticated: state.isAuthenticated,
        }),
        onRehydrateStorage: () => (state) => {
          // Mark as hydrated when storage is loaded
          state?.setHydrated(true);
        },
      }
    ),
    { name: 'auth-store' }
  )
);

// Helper hook to wait for hydration
export const useAuthHydration = () => {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  return isHydrated;
};
