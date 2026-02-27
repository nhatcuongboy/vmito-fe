import { useAuthStore } from '@/stores/useAuthStore';
import { usePathname } from '@/i18n/config';
import { UserRole } from '@/lib/api/types';
import { useMemo } from 'react';

export function useBottomNavVisibility() {
  const { user, isAuthenticated } = useAuthStore();
  const pathname = usePathname();

  const isExcluded = useMemo(() => {
    if (!pathname) return false;

    // Explicitly exclude /host/tournaments/[id] which has its own tabs
    if (pathname.match(/\/host\/tournaments\/[^/]+$/)) return true;

    return (
      // Exclude auth pages - they have their own full-screen layout (no MainLayout)
      // Prevents bottom nav from showing during "Redirecting..." state after login
      pathname.includes('/auth/') ||
      // Exclude session detail pages
      pathname.includes('/host/sessions/') ||
      pathname.includes('/player/sessions/') ||
      // Public session detail
      pathname.match(/\/sessions\/[^/]+$/) ||
      // Also potentially exclude specific full-screen flows like /join/confirm if needed
      pathname.includes('/join/confirm')
    );
  }, [pathname]);

  const isVisible = useMemo(() => {
    if (!isAuthenticated || isExcluded || user?.role === UserRole.GUEST) {
      return false;
    }

    // Check if role has tabs defined (mimicking the logic in GlobalBottomNav)
    if (!user) return false;

    // All roles seem to have tabs in the original logic except GUEST (handled above)
    return true;
  }, [isAuthenticated, isExcluded, user]);

  return isVisible;
}
