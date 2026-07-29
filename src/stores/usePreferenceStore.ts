import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DEFAULT_USE_AI_FOR_CREATION } from '@/constants';

interface PreferenceState {
  preferredCity: string | null;
  preferredDistricts: string[];
  onboardingCompleted: boolean;
  useAiForCreation: boolean;
  _hasHydrated: boolean;

  // Actions
  setPreferredCity: (city: string | null) => void;
  setPreferredArea: (city: string | null, districts: string[]) => void;
  setUseAiForCreation: (useAi: boolean) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  resetPreferences: () => void;
  _setHasHydrated: (value: boolean) => void;
}

export const usePreferenceStore = create<PreferenceState>()(
  persist(
    (set) => ({
      preferredCity: null,
      preferredDistricts: [],
      onboardingCompleted: false,
      useAiForCreation: DEFAULT_USE_AI_FOR_CREATION,
      _hasHydrated: false,

      setPreferredCity: (city) => set({ preferredCity: city }),
      _setHasHydrated: (value) => set({ _hasHydrated: value }),

      setPreferredArea: (city, districts) =>
        set({
          preferredCity: city,
          preferredDistricts: districts,
        }),

      setUseAiForCreation: (useAi) => set({ useAiForCreation: useAi }),

      setOnboardingCompleted: (completed) =>
        set({ onboardingCompleted: completed }),

      // Keeps preferredCity/preferredDistricts intact: the selected city is a
      // browser-level preference, not user-scoped, so it should survive logout.
      resetPreferences: () =>
        set({
          onboardingCompleted: false,
          useAiForCreation: DEFAULT_USE_AI_FOR_CREATION,
        }),
    }),
    {
      name: 'user-preferences',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?._setHasHydrated(true);
      },
    }
  )
);
