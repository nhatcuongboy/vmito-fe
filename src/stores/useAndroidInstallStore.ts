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
  /** Result of `navigator.getInstalledRelatedApps()`. Not persisted (kept
   * in-memory only) so a later uninstall doesn't leave a stale positive —
   * re-checked once per session on first mount, cheap since it needs no
   * navigation. `null` = not checked yet. */
  androidRelatedAppInstalled: boolean | null;
  /** Set when the *banner* (not the popup) has been dismissed for the
   * current cooldown cycle. Needed because the banner only ever appears
   * once `dismissedTargetKey`/`dismissedAt` already show a dismissal (see
   * useAppInstallEligibility's shouldShowBanner) — without a separate
   * flag, dismissing the banner would just re-write the same dismissal
   * state and the banner would stay visible. Reset back to false by
   * `dismiss()` itself, since that call always starts a fresh cycle. */
  bannerDismissed: boolean;

  dismiss: (targetKey: string) => void;
  dismissBanner: () => void;
  openAndroidGuide: (target: InstallTarget) => void;
  closeAndroidGuide: () => void;
  setAndroidRelatedAppInstalled: (installed: boolean) => void;
  _setHasHydrated: (value: boolean) => void;
}

export const useAppInstallStore = create<AppInstallState>()(
  persist(
    (set) => ({
      dismissedTargetKey: null,
      dismissedAt: null,
      isAndroidGuideOpen: false,
      _hasHydrated: false,
      androidRelatedAppInstalled: null,
      bannerDismissed: false,

      dismiss: (targetKey) => {
        set({
          dismissedTargetKey: targetKey,
          dismissedAt: Date.now(),
          bannerDismissed: false,
        });
      },
      dismissBanner: () => set({ bannerDismissed: true }),

      openAndroidGuide: (target) => {
        if (target.channel === 'apk') {
          set({ isAndroidGuideOpen: true });
        }
      },
      closeAndroidGuide: () => set({ isAndroidGuideOpen: false }),

      setAndroidRelatedAppInstalled: (installed) =>
        set({ androidRelatedAppInstalled: installed }),

      _setHasHydrated: (value) => set({ _hasHydrated: value }),
    }),
    {
      name: 'vmito-android-install-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        dismissedTargetKey: state.dismissedTargetKey,
        dismissedAt: state.dismissedAt,
        bannerDismissed: state.bannerDismissed,
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
