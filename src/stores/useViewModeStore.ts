import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type ViewMode = 'grid' | 'list' | 'map';

interface ViewModeState {
  viewModes: Record<string, ViewMode>;
  setViewMode: (scope: string, mode: ViewMode) => void;
  getViewMode: (scope: string) => ViewMode;
}

export const useViewModeStore = create<ViewModeState>()(
  persist(
    (set, get) => ({
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
    }),
    {
      name: 'app-view-modes',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
