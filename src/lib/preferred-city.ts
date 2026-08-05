/**
 * The saved "browse this city" preference, shared between server and client.
 *
 * The preference itself lives in usePreferenceStore (localStorage), but the
 * browse list is server-rendered, and the server cannot read localStorage. It
 * is therefore mirrored into a cookie — the same trick `view-mode-*` uses — so
 * a server component can run the *same* query the client is about to run. When
 * it could not, the first paint showed a nationwide list that was then replaced
 * by the user's city a moment later.
 *
 * Kept free of 'use client': functions exported from a client module become
 * client references and throw when called during a server render.
 */

import {
  VIETNAM_CITIES,
  normalizeCityForApi,
} from '@/constants/vietnam-locations';

export const PREFERRED_CITY_COOKIE = 'preferred-city';

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/**
 * Resolve a stored city code (e.g. 'HCM') to the city name the API expects
 * (e.g. 'Hồ Chí Minh'). Unknown codes are passed through so a city added to
 * the backend before this table still filters correctly.
 */
export function cityCodeToApiName(
  code: string | null | undefined
): string | undefined {
  if (!code) return undefined;
  const name = VIETNAM_CITIES.find((c) => c.code === code)?.name ?? code;
  return normalizeCityForApi(name);
}

export function readPreferredCityCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${PREFERRED_CITY_COOKIE}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function writePreferredCityCookie(code: string | null): void {
  if (typeof document === 'undefined') return;
  if (code) {
    document.cookie =
      `${PREFERRED_CITY_COOKIE}=${encodeURIComponent(code)}; path=/; ` +
      `max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
  } else {
    document.cookie = `${PREFERRED_CITY_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  }
}
