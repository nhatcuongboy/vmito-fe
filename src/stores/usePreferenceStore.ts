import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { FEATURE_FLAG_DEFAULTS } from '@/constants';
import { useFeatureFlagsStore } from './useFeatureFlagsStore';
import { writePreferredCityCookie } from '@/lib/preferred-city';

/** Reads the live flag when available, falling back to the default before
 *  it loads — matches the value this store was seeded/reset with. */
const getDefaultUseAiForCreation = () =>
  useFeatureFlagsStore.getState().flags.DEFAULT_USE_AI_FOR_CREATION ??
  FEATURE_FLAG_DEFAULTS.DEFAULT_USE_AI_FOR_CREATION;

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
      useAiForCreation: getDefaultUseAiForCreation(),
      _hasHydrated: false,

      setPreferredCity: (city) => {
        writePreferredCityCookie(city);
        set({ preferredCity: city });
      },
      _setHasHydrated: (value) => set({ _hasHydrated: value }),

      setPreferredArea: (city, districts) => {
        writePreferredCityCookie(city);
        set({
          preferredCity: city,
          preferredDistricts: districts,
        });
      },

      setUseAiForCreation: (useAi) => set({ useAiForCreation: useAi }),

      setOnboardingCompleted: (completed) =>
        set({ onboardingCompleted: completed }),

      // Keeps preferredCity/preferredDistricts intact: the selected city is a
      // browser-level preference, not user-scoped, so it should survive logout.
      resetPreferences: () =>
        set({
          onboardingCompleted: false,
          useAiForCreation: getDefaultUseAiForCreation(),
        }),
    }),
    {
      name: 'user-preferences',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        // Existing installs only have the city in localStorage — mirror it into
        // the cookie on first load after this change so their next server
        // render already knows which city to fetch.
        if (state?.preferredCity) writePreferredCityCookie(state.preferredCity);
        state?._setHasHydrated(true);
      },
    }
  )
);
