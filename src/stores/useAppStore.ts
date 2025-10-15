import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface AppState {
  // Theme and UI state
  isDarkMode: boolean;
  sidebarOpen: boolean;

  // Loading states
  isLoading: boolean;

  // Error handling
  error: string | null;

  // Actions
  setDarkMode: (isDark: boolean) => void;
  toggleSidebar: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      // Initial state
      isDarkMode: false,
      sidebarOpen: false,
      isLoading: false,
      error: null,

      // Actions
      setDarkMode: (isDark) =>
        set({ isDarkMode: isDark }, false, 'setDarkMode'),
      toggleSidebar: () =>
        set(
          (state) => ({ sidebarOpen: !state.sidebarOpen }),
          false,
          'toggleSidebar'
        ),
      setLoading: (loading) => set({ isLoading: loading }, false, 'setLoading'),
      setError: (error) => set({ error }, false, 'setError'),
      clearError: () => set({ error: null }, false, 'clearError'),
    }),
    {
      name: 'app-store',
    }
  )
);
