import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  APP_INSTALL_CONFIG,
  resolveInstallTarget,
  type InstallTarget,
} from '@/constants/android-app';
import { isAppInstallPromptDue } from '@/lib/pwa/install';

interface AppInstallState {
  dismissedTargetKey: string | null;
  dismissedAt: number | null;
  isAndroidGuideOpen: boolean;
  _hasHydrated: boolean;

  dismiss: (targetKey: string) => void;
  openAndroidGuide: (target: InstallTarget) => void;
  closeAndroidGuide: () => void;
  _setHasHydrated: (value: boolean) => void;
}

export const useAppInstallStore = create<AppInstallState>()(
  persist(
    (set) => ({
      dismissedTargetKey: null,
      dismissedAt: null,
      isAndroidGuideOpen: false,
      _hasHydrated: false,

      dismiss: (targetKey) => {
        set({
          dismissedTargetKey: targetKey,
          dismissedAt: Date.now(),
        });
      },

      openAndroidGuide: (target) => {
        if (target.channel === 'apk') {
          set({ isAndroidGuideOpen: true });
        }
      },
      closeAndroidGuide: () => set({ isAndroidGuideOpen: false }),

      _setHasHydrated: (value) => set({ _hasHydrated: value }),
    }),
    {
      name: 'vmito-android-install-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        dismissedTargetKey: state.dismissedTargetKey,
        dismissedAt: state.dismissedAt,
      }),
      version: 1,
      migrate: (persistedState, version) => {
        const oldState = persistedState as {
          dismissedVersion?: string | null;
          dismissedAt?: number | null;
          dismissedTargetKey?: string | null;
        };

        if (version >= 1) return oldState;

        const androidTarget = resolveInstallTarget('android');
        const canKeepOldDismissal =
          androidTarget?.channel === 'apk' &&
          oldState.dismissedVersion === APP_INSTALL_CONFIG.android.version;

        return {
          dismissedTargetKey: canKeepOldDismissal
            ? (androidTarget?.targetKey ?? null)
            : null,
          dismissedAt: oldState.dismissedAt ?? null,
        };
      },
      onRehydrateStorage: () => (state) => state?._setHasHydrated(true),
    }
  )
);

export function useShouldShowAppInstallPrompt(
  target: InstallTarget | null,
  isStandalone: boolean
): boolean {
  return useAppInstallStore((state) => {
    return isAppInstallPromptDue({
      hasHydrated: state._hasHydrated,
      isStandalone,
      targetKey: target?.targetKey ?? null,
      dismissedTargetKey: state.dismissedTargetKey,
      dismissedAt: state.dismissedAt,
    });
  });
}
