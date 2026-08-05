export type PWAPlatform = 'ios' | 'android' | 'other';

export interface StandaloneNavigator {
  standalone?: boolean;
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
