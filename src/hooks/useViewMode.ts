'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { isValidViewMode, type ViewMode } from '@/lib/view-mode';

// Re-export so existing client imports keep working; server components must
// import from '@/lib/view-mode' (this module is 'use client').
export { isValidViewMode };
export type { ViewMode };

/**
 * Migration map for old localStorage values
 */
const MIGRATION_MAP: Record<string, ViewMode> = {
  full: 'grid',
  compact: 'list',
  map: 'map',
};

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

const cookieName = (scope: string) => `view-mode-${scope}`;

function readViewModeCookie(scope: string): ViewMode | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${cookieName(scope)}=([^;]*)`)
  );
  const value = match ? decodeURIComponent(match[1]) : undefined;
  return value && isValidViewMode(value) ? value : undefined;
}

function writeViewModeCookie(scope: string, mode: ViewMode): void {
  if (typeof document === 'undefined') return;
  document.cookie =
    `${cookieName(scope)}=${mode}; path=/; ` +
    `max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

/**
 * Custom hook for managing view mode with URL synchronization
 *
 * Priority chain: URL param → cookie → localStorage (legacy) →
 * serverViewMode → defaultMode
 *
 * The preference is persisted in BOTH a cookie and localStorage. The cookie
 * is what lets the server render the correct mode in the first HTML: a page
 * can read it via `cookies()` and pass it down as `serverViewMode`, so SSR
 * and hydration agree and the layout doesn't flash from the default mode to
 * the saved one. localStorage is kept for backward compatibility and is
 * migrated into the cookie on mount.
 *
 * @param scope - Unique identifier for the page (e.g., 'sessions', 'venues', 'clubs')
 * @param defaultMode - View mode to fall back to when there's no URL param and
 * no saved preference (first-ever visit for that scope). Defaults to 'grid'.
 * @param serverViewMode - The saved preference as read from the request cookie
 * by a server component. Lets SSR render the same mode the client will resolve.
 * @returns [viewMode, setViewMode] - Current view mode and setter function
 *
 * @example
 * ```tsx
 * const [viewMode, setViewMode] = useViewMode('sessions');
 * // URL: ?view=list → viewMode = 'list'
 * // No URL param + saved 'grid' → viewMode = 'grid'
 * // No URL param + no saved preference → viewMode = 'grid' (the default)
 * ```
 */
export function useViewMode(
  scope: string,
  defaultMode: ViewMode = 'grid',
  serverViewMode?: ViewMode
): readonly [ViewMode, (mode: ViewMode) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const viewMode = useMemo<ViewMode>(() => {
    // 1. Check URL parameter
    const urlView = searchParams.get('view');
    if (urlView && isValidViewMode(urlView)) {
      return urlView;
    }

    // 2. Check cookie — the canonical store, shared with the server
    const cookieView = readViewModeCookie(scope);
    if (cookieView) {
      return cookieView;
    }

    // 3. Check localStorage (legacy store, with old-value migration)
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`view-mode-${scope}`);
        if (stored) {
          const migrated = MIGRATION_MAP[stored] || stored;
          if (isValidViewMode(migrated)) {
            return migrated;
          }
        }
      } catch (error) {
        console.error('Failed to read view mode from localStorage:', error);
      }
    }

    // 4. Server-provided preference (request cookie read in a server
    // component) — this is what the server render itself resolves to, since
    // document/localStorage don't exist there
    if (serverViewMode && isValidViewMode(serverViewMode)) {
      return serverViewMode;
    }

    // 5. Fall back to the caller's default
    return defaultMode;
  }, [searchParams, scope, defaultMode, serverViewMode]);

  // One-time migration: users from before the cookie store only have
  // localStorage, which the server can't see (their first visit still
  // flashes). Copy it into the cookie so every later visit SSRs correctly.
  useEffect(() => {
    if (readViewModeCookie(scope)) return;
    try {
      const stored = localStorage.getItem(`view-mode-${scope}`);
      const migrated = stored ? MIGRATION_MAP[stored] || stored : undefined;
      if (migrated && isValidViewMode(migrated)) {
        writeViewModeCookie(scope, migrated);
      }
    } catch {
      // localStorage unavailable (private mode) — nothing to migrate
    }
  }, [scope]);

  // Update view mode in URL, cookie, and localStorage
  const setViewMode = useCallback(
    (mode: ViewMode) => {
      if (!isValidViewMode(mode)) {
        console.warn(
          `Invalid view mode: ${mode}. Using '${defaultMode}' instead.`
        );
        mode = defaultMode;
      }

      // Update URL with router.replace (no history entry)
      const params = new URLSearchParams(searchParams.toString());
      params.set('view', mode);
      router.replace(`${pathname}?${params.toString()}`);

      writeViewModeCookie(scope, mode);

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`view-mode-${scope}`, mode);
        } catch (error) {
          console.error('Failed to save view mode to localStorage:', error);
        }
      }
    },
    [router, pathname, searchParams, scope, defaultMode]
  );

  return [viewMode, setViewMode] as const;
}
