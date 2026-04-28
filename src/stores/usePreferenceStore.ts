import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DEFAULT_USE_AI_FOR_CREATION } from '@/constants';

interface PreferenceState {
  preferredCity: string | null;
  preferredDistricts: string[];
  onboardingCompleted: boolean;

  useAiForCreation: boolean;

  // Actions
  setPreferredArea: (city: string | null, districts: string[]) => void;
  setUseAiForCreation: (useAi: boolean) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  resetPreferences: () => void;
}

export const usePreferenceStore = create<PreferenceState>()(
  persist(
    (set) => ({
      preferredCity: null,
      preferredDistricts: [],
      onboardingCompleted: false,

      useAiForCreation: DEFAULT_USE_AI_FOR_CREATION,

      setPreferredArea: (city, districts) =>
        set({
          preferredCity: city,
          preferredDistricts: districts,
        }),

      setUseAiForCreation: (useAi) => set({ useAiForCreation: useAi }),

      setOnboardingCompleted: (completed) =>
        set({ onboardingCompleted: completed }),

      resetPreferences: () =>
        set({
          preferredCity: null,
          preferredDistricts: [],
          onboardingCompleted: false,
          useAiForCreation: DEFAULT_USE_AI_FOR_CREATION,
        }),
    }),
    {
      name: 'user-preferences',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
