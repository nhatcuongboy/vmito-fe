export type PWAPlatform = 'ios' | 'android' | 'other';

export interface StandaloneNavigator {
  standalone?: boolean;
}

const DEFAULT_COOLDOWN_DAYS = 7;

const parseCooldownDays = (value: string | undefined): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_COOLDOWN_DAYS;
};

export const APP_INSTALL_DISMISS_COOLDOWN_MS =
  parseCooldownDays(process.env.NEXT_PUBLIC_APP_INSTALL_DISMISS_COOLDOWN_DAYS) *
  24 *
  60 *
  60 *
  1000;

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

/**
 * Only "bare" Mobile Safari renders Apple's native Smart App Banner
 * (`apple-itunes-app` meta tag). Chrome/Firefox/Edge/Opera on iOS use
 * WebKit too but carry their own UA token and never show it, so our custom
 * banner should cover those instead of doubling up with Apple's.
 */
export const isIOSSafari = (userAgent: string): boolean =>
  /iPad|iPhone|iPod/i.test(userAgent) &&
  !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(userAgent);

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
