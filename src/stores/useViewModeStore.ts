import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type ViewMode = 'grid' | 'list';

interface ViewModeState {
  viewModes: Record<string, ViewMode>;
  setViewMode: (scope: string, mode: ViewMode) => void;
  getViewMode: (scope: string) => ViewMode;
}

export const useViewModeStore = create<ViewModeState>()(
  persist(
    (set, get) => ({
      viewModes: {
        venues: 'grid',
        clubs: 'grid',
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
        return state.viewModes[scope] || 'grid';
      },
    }),
    {
      name: 'app-view-modes',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
