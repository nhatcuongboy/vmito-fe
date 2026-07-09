import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type CourtDisplayMode = 'number' | 'name';

interface CourtDisplayModeState {
  courtDisplayMode: CourtDisplayMode;
  setCourtDisplayMode: (mode: CourtDisplayMode) => void;
  toggleCourtDisplayMode: () => void;
}

export const useCourtDisplayModeStore = create<CourtDisplayModeState>()(
  persist(
    (set) => ({
      courtDisplayMode: 'number',

      setCourtDisplayMode: (mode) => set({ courtDisplayMode: mode }),

      toggleCourtDisplayMode: () =>
        set((state) => ({
          courtDisplayMode:
            state.courtDisplayMode === 'number' ? 'name' : 'number',
        })),
    }),
    {
      name: 'court-display-mode',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
