import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface PreferenceState {
  preferredCity: string | null;
  preferredDistricts: string[];
  onboardingCompleted: boolean;

  // Actions
  setPreferredArea: (city: string | null, districts: string[]) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  resetPreferences: () => void;
}

export const usePreferenceStore = create<PreferenceState>()(
  persist(
    (set) => ({
      preferredCity: null,
      preferredDistricts: [],
      onboardingCompleted: false,

      setPreferredArea: (city, districts) =>
        set({
          preferredCity: city,
          preferredDistricts: districts,
        }),

      setOnboardingCompleted: (completed) =>
        set({ onboardingCompleted: completed }),

      resetPreferences: () =>
        set({
          preferredCity: null,
          preferredDistricts: [],
          onboardingCompleted: false,
        }),
    }),
    {
      name: 'user-preferences',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
