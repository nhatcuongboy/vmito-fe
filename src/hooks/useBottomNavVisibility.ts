import { useAuthStore } from '@/stores/useAuthStore';
import { usePathname } from '@/i18n/config';
import { UserRole } from '@/lib/api/types';
import { MAIN_PAGE_PATHS } from '@/constants';
import { useMemo } from 'react';

// Pages that use their own bottom nav (HostSessionsNavPanel, ClubsNavPanel)
const CUSTOM_BOTTOM_NAV_PATHS = [
  '/host/sessions',
  '/host/sessions/pending',
  '/host/sessions/joined',
  '/host/tournaments',
  '/host/tournaments/joined',
  '/my-clubs',
  '/my-clubs/managing',
  '/my-clubs/member',
];

// Returns true if current page is a "main" page (shows main top bar)
export function useIsMainPage(): boolean {
  const pathname = usePathname();
  return useMemo(() => {
    if (!pathname) return false;
    // Normalize: strip locale prefix if present (e.g. /vi/host/sessions → /host/sessions)
    const normalized =
      pathname.replace(/^\/[a-z]{2}(\/|$)/, '/').replace(/\/$/, '') || '/';
    if ((MAIN_PAGE_PATHS as readonly string[]).includes(normalized))
      return true;
    // /user/[id] is also a main page
    if (/^\/user\/[^/]+$/.test(normalized)) return true;
    return false;
  }, [pathname]);
}

// Returns true if GlobalBottomNav should be visible
export function useBottomNavVisibility() {
  const { user, isAuthenticated } = useAuthStore();
  const pathname = usePathname();
  const isMainPage = useIsMainPage();

  return useMemo(() => {
    if (!isAuthenticated || !user || user.role === UserRole.GUEST) return false;
    if (!isMainPage) return false;
    // /host/sessions and sub-pages use HostSessionsNavPanel instead
    const normalized = pathname
      ? pathname.replace(/^\/[a-z]{2}(\/|$)/, '/').replace(/\/$/, '') || '/'
      : '';
    if (CUSTOM_BOTTOM_NAV_PATHS.includes(normalized)) return false;
    return true;
  }, [isAuthenticated, user, isMainPage, pathname]);
}
