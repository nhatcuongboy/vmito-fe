export type PWAPlatform = 'ios' | 'android' | 'other';

export interface StandaloneNavigator {
  standalone?: boolean;
}

export const APP_INSTALL_DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

export interface AppInstallPromptState {
  hasHydrated: boolean;
  isStandalone: boolean;
  targetKey: string | null;
  dismissedTargetKey: string | null;
  dismissedAt: number | null;
  now?: number;
}

/**
 * Keep browser sniffing isolated from React so it can be tested without a DOM.
 * iPadOS can identify as macOS, but still exposes touch points like an iPad.
 */
export const detectPWAPlatform = (
  userAgent: string,
  maxTouchPoints = 0
): PWAPlatform => {
  if (
    /iPad|iPhone|iPod/i.test(userAgent) ||
    (/Macintosh/i.test(userAgent) && maxTouchPoints > 1)
  ) {
    return 'ios';
  }
  if (/Android/i.test(userAgent)) return 'android';
  return 'other';
};

export const isPWAStandalone = (
  displayModeStandalone: boolean,
  navigator: StandaloneNavigator
): boolean => displayModeStandalone || navigator.standalone === true;

/** Pure eligibility check so install prompting remains predictable and testable. */
export const isAppInstallPromptDue = ({
  hasHydrated,
  isStandalone,
  targetKey,
  dismissedTargetKey,
  dismissedAt,
  now = Date.now(),
}: AppInstallPromptState): boolean => {
  if (!hasHydrated || isStandalone || !targetKey) return false;
  if (!dismissedTargetKey || dismissedTargetKey !== targetKey) return true;
  if (!dismissedAt) return true;
  return now - dismissedAt >= APP_INSTALL_DISMISS_COOLDOWN_MS;
};
