import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ANDROID_APP_CONFIG } from '@/constants/android-app';

interface AndroidInstallState {
  dismissedVersion: string | null;
  dismissedAt: number | null;
  isModalOpen: boolean;
  step: 'prompt' | 'guide';
  _hasHydrated: boolean;

  openModal: (step?: 'prompt' | 'guide') => void;
  closeModal: () => void;
  setStep: (step: 'prompt' | 'guide') => void;
  dismiss: () => void;
  _setHasHydrated: (value: boolean) => void;
}

// 7 days cooldown for dismissal if version hasn't changed
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

export const useAndroidInstallStore = create<AndroidInstallState>()(
  persist(
    (set, _get) => ({
      dismissedVersion: null,
      dismissedAt: null,
      isModalOpen: false,
      step: 'prompt',
      _hasHydrated: false,

      openModal: (step = 'prompt') => {
        set({ isModalOpen: true, step });
      },

      closeModal: () => {
        set({ isModalOpen: false, step: 'prompt' });
      },

      setStep: (step) => {
        set({ step });
      },

      dismiss: () => {
        set({
          isModalOpen: false,
          dismissedVersion: ANDROID_APP_CONFIG.version,
          dismissedAt: Date.now(),
        });
      },

      _setHasHydrated: (value) => set({ _hasHydrated: value }),
    }),
    {
      name: 'vmito-android-install-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        dismissedVersion: state.dismissedVersion,
        dismissedAt: state.dismissedAt,
      }),
      onRehydrateStorage: () => (state) => state?._setHasHydrated(true),
    }
  )
);

/**
 * Hook to check if the Android install prompt should be displayed automatically.
 */
export function useShouldShowAndroidPrompt(
  isAndroid: boolean,
  isStandalone: boolean
): boolean {
  return useAndroidInstallStore((s) => {
    if (!s._hasHydrated) return false;
    if (!isAndroid || isStandalone) return false;
    if (!ANDROID_APP_CONFIG.isEnabled) return false;

    // If version changed, always show prompt for new version
    if (
      s.dismissedVersion &&
      s.dismissedVersion !== ANDROID_APP_CONFIG.version
    ) {
      return true;
    }

    // If user dismissed this version recently, respect cooldown
    if (s.dismissedAt && Date.now() - s.dismissedAt < DISMISS_COOLDOWN_MS) {
      return false;
    }

    return true;
  });
}
