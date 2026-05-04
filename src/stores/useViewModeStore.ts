import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type ViewMode = 'grid' | 'list' | 'map';

interface ViewModeState {
  viewModes: Record<string, ViewMode>;
  setViewMode: (scope: string, mode: ViewMode) => void;
  getViewMode: (scope: string) => ViewMode;
}

/**
 * @deprecated This store is deprecated in favor of the useViewMode hook which syncs with URL.
 * Please use `useViewMode(scope)` instead for URL-synced view mode management.
 *
 * Migration guide:
 * - Old: `const { getViewMode, setViewMode } = useViewModeStore(); const mode = getViewMode('venues');`
 * - New: `const [viewMode, setViewMode] = useViewMode('venues');`
 *
 * This store will be removed in a future version.
 */
export const useViewModeStore = create<ViewModeState>()(
  persist(
    (set, get) => {
      // Add deprecation warning in development
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          '[DEPRECATED] useViewModeStore is deprecated. Use useViewMode hook instead for URL-synced view mode management.'
        );
      }

      return {
        viewModes: {
          venues: 'list',
          clubs: 'list',
        },

        setViewMode: (scope, mode) =>
          set((state) => ({
            viewModes: {
              ...state.viewModes,
              [scope]: mode,
            },
          })),

        getViewMode: (scope) => {
          const state = get();
          // Default to 'list' for venues and clubs if not set
          if (
            (scope === 'venues' || scope === 'clubs') &&
            !state.viewModes[scope]
          ) {
            return 'list';
          }
          return state.viewModes[scope] || 'list';
        },
      };
    },
    {
      name: 'app-view-modes',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
