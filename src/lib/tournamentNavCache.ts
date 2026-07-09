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

const buildKey = (userId: string, slug: string): string =>
  `vmito.canManage.${userId}.${slug}`;

export const readTournamentNavCache = (
  userId: string | null | undefined,
  slug: string
): TournamentNavAccess | null => {
  if (!userId || !slug || typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(buildKey(userId, slug));
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
  userId: string | null | undefined,
  slug: string,
  access: TournamentNavAccess
): void => {
  if (!userId || !slug || typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(
      buildKey(userId, slug),
      JSON.stringify(access)
    );
  } catch {
    // Ignore quota / serialization errors — the cache is best-effort.
  }
};
