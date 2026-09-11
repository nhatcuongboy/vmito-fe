import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { WelcomePopupService } from '@/lib/api/welcome-popup.service';
import { IWelcomePopup } from '@/lib/api/types';

interface WelcomePopupState {
  activePopup: IWelcomePopup | null;
  isLoaded: boolean;
  dismissedVersions: string[];
  _hasHydrated: boolean;

  fetchActive: () => Promise<void>;
  dismiss: (popup: IWelcomePopup) => void;
  _setHasHydrated: (value: boolean) => void;
}

const versionKey = (popup: IWelcomePopup) => `${popup.id}:${popup.updatedAt}`;

/** Global active welcome popup fetched from GET /welcome-popups/active, with
 *  per-browser dismissal tracked by `${id}:${updatedAt}` so editing a popup's
 *  content (which bumps updatedAt) reshows it to users who already dismissed
 *  the previous version. */
export const useWelcomePopupStore = create<WelcomePopupState>()(
  persist(
    (set, get) => ({
      activePopup: null,
      isLoaded: false,
      dismissedVersions: [],
      _hasHydrated: false,

      fetchActive: async () => {
        try {
          const popup = await WelcomePopupService.getActive();
          set({ activePopup: popup, isLoaded: true });
        } catch {
          set({ isLoaded: true });
        }
      },

      dismiss: (popup) => {
        set({
          dismissedVersions: [...get().dismissedVersions, versionKey(popup)],
        });
      },

      _setHasHydrated: (value) => set({ _hasHydrated: value }),
    }),
    {
      name: 'welcome-popup-dismissals',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ dismissedVersions: state.dismissedVersions }),
      onRehydrateStorage: () => (state) => state?._setHasHydrated(true),
    }
  )
);

/** The active popup to show right now, or null if none, not yet loaded/hydrated,
 *  or already dismissed at its current version. */
export function useVisibleWelcomePopup(): IWelcomePopup | null {
  return useWelcomePopupStore((s) => {
    if (!s._hasHydrated || !s.isLoaded || !s.activePopup) return null;
    return s.dismissedVersions.includes(versionKey(s.activePopup))
      ? null
      : s.activePopup;
  });
}
