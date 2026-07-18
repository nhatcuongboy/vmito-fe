'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

/**
 * View mode types - unified across all pages
 * Migrated from old values: 'full' → 'grid', 'compact' → 'list'
 */
export type ViewMode = 'grid' | 'list' | 'map';

/**
 * Migration map for old localStorage values
 */
const MIGRATION_MAP: Record<string, ViewMode> = {
  full: 'grid',
  compact: 'list',
  map: 'map',
};

/**
 * Custom hook for managing view mode with URL synchronization
 *
 * Priority chain: URL param → localStorage → defaultMode
 *
 * @param scope - Unique identifier for the page (e.g., 'sessions', 'venues', 'clubs')
 * @param defaultMode - View mode to fall back to when there's no URL param or
 * localStorage value yet (first-ever visit for that scope). Defaults to 'grid'.
 * @returns [viewMode, setViewMode] - Current view mode and setter function
 *
 * @example
 * ```tsx
 * const [viewMode, setViewMode] = useViewMode('sessions');
 * // URL: ?view=list → viewMode = 'list'
 * // No URL param + localStorage has 'grid' → viewMode = 'grid'
 * // No URL param + no localStorage → viewMode = 'grid' (the default)
 * ```
 */
export function useViewMode(
  scope: string,
  defaultMode: ViewMode = 'grid'
): readonly [ViewMode, (mode: ViewMode) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read view mode with priority: URL → localStorage → default
  const viewMode = useMemo<ViewMode>(() => {
    // 1. Check URL parameter
    const urlView = searchParams.get('view');
    if (urlView && isValidViewMode(urlView)) {
      return urlView as ViewMode;
    }

    // 2. Check localStorage (with migration)
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`view-mode-${scope}`);
        if (stored) {
          // Handle migration from old values
          const migrated = MIGRATION_MAP[stored] || stored;
          if (isValidViewMode(migrated)) {
            return migrated as ViewMode;
          }
        }
      } catch (error) {
        console.error('Failed to read view mode from localStorage:', error);
      }
    }

    // 3. Fall back to the caller's default
    return defaultMode;
  }, [searchParams, scope, defaultMode]);

  // Update view mode in both URL and localStorage
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

      // Update localStorage
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

/**
 * Type guard to check if a string is a valid ViewMode
 */
function isValidViewMode(value: string): value is ViewMode {
  return value === 'grid' || value === 'list' || value === 'map';
}
