export const COOKIE_CONSENT_COOKIE = 'vmito_cookie_consent';
export const COOKIE_CONSENT_VERSION = 'v1';
export const COOKIE_CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export type CookieConsentChoice = 'necessary' | 'all';

const choices = new Set<CookieConsentChoice>(['necessary', 'all']);

export function parseCookieConsent(
  value: string | undefined
): CookieConsentChoice | null {
  if (!value) return null;

  const [version, choice] = value.split('.');
  if (
    version !== COOKIE_CONSENT_VERSION ||
    !choices.has(choice as CookieConsentChoice)
  ) {
    return null;
  }

  return choice as CookieConsentChoice;
}

export function serializeCookieConsent(choice: CookieConsentChoice): string {
  return `${COOKIE_CONSENT_VERSION}.${choice}`;
}

export function writeCookieConsent(choice: CookieConsentChoice): void {
  if (typeof document === 'undefined') return;

  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie =
    `${COOKIE_CONSENT_COOKIE}=${serializeCookieConsent(choice)}; ` +
    `path=/; max-age=${COOKIE_CONSENT_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}
