/**
 * Lightweight, per-session cache of a user's tournament management visibility
 * (Manage / Dashboard bottom-nav tabs).
 *
 * Each tournament tab is a separate route, so navigating between tabs fully
 * remounts the page shell and its bottom navigation. Without a cache the
 * management tabs briefly disappear (the route `loading.tsx` fallback and the
 * shell's initial render both default to the 4 public tabs) and then reappear,
 * producing a visible flicker for hosts/admins/managers.
 *
 * The cache is intentionally scoped by `userId` and disabled for logged-out
 * users so management menus can never leak to guests sharing the same browser
 * session.
 */

export interface TournamentNavAccess {
  canManage: boolean;
  isHostOrAdmin: boolean;
}

const buildKey = (slug: string): string => `vmito.canManage.${slug}`;

export const readTournamentNavCache = (
  slug: string
): TournamentNavAccess | null => {
  if (!slug || typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(buildKey(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<TournamentNavAccess>;
    return {
      canManage: !!parsed.canManage,
      isHostOrAdmin: !!parsed.isHostOrAdmin,
    };
  } catch {
    return null;
  }
};

export const writeTournamentNavCache = (
  slug: string,
  access: TournamentNavAccess
): void => {
  if (!slug || typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(buildKey(slug), JSON.stringify(access));
  } catch {
    // Ignore quota / serialization errors — the cache is best-effort.
  }
};

export const clearTournamentNavCache = (slug: string): void => {
  if (!slug || typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(buildKey(slug));
  } catch {
    // ignore
  }
};
