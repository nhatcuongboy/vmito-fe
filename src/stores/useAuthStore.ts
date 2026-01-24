import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { User } from '@/types/auth';
import { UserRole } from '@/lib/api/types';

interface AuthState {
  // State
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;

  // Actions
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  setUser: (user: User) => void;
  setGuestAuth: (playerId: string, sessionId: string, joinCode: string) => void;
  setLoading: (loading: boolean) => void;
  updateToken: (accessToken: string, refreshToken?: string) => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: true,
        isHydrated: false,

        // Actions
        setAuth: (user, accessToken, refreshToken) =>
          set(
            {
              user,
              accessToken,
              refreshToken,
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
              refreshToken: null,
              isAuthenticated: false,
              isLoading: false,
            },
            false,
            'clearAuth'
          ),

        setUser: (user) => set({ user }, false, 'setUser'),

        setGuestAuth: (playerId, sessionId, joinCode) =>
          set(
            {
              user: {
                id: `guest-${playerId}`,
                name: 'Guest Player',
                email: '',
                role: UserRole.GUEST,
                playerId,
                sessionId,
                joinCode,
              },
              accessToken: null, // No real token for guest
              refreshToken: null,
              isAuthenticated: true, // Treated as authenticated
              isLoading: false,
            },
            false,
            'setGuestAuth'
          ),

        setLoading: (loading) =>
          set({ isLoading: loading }, false, 'setLoading'),

        updateToken: (accessToken, refreshToken) =>
          set(
            (state) => ({
              accessToken,
              refreshToken: refreshToken || state.refreshToken,
            }),
            false,
            'updateToken'
          ),

        setHydrated: (hydrated) =>
          set({ isHydrated: hydrated, isLoading: false }, false, 'setHydrated'),
      }),
      {
        name: 'auth-storage',
        // Only persist user and token, not loading state
        partialize: (state) => ({
          user: state.user,
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
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
