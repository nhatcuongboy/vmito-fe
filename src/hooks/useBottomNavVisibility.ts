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
      // Exclude session detail pages
      pathname.includes('/host/sessions/') ||
      pathname.includes('/player/sessions/') ||
      // Exclude tournament sub-pages management that might need full screen or have their own nav
      // But keep bottom nav for main lists if desired. For now based on requirements:
      // "Except session detail content" -> We only definitely exclude session details.
      // However, host tournament management usually has many tabs (Overview, Categories, etc)
      // so we might want to exclude it to avoid double bottom bars if they use bottom bars too.
      // The requirement only mentioned SessionDetailContent.
      // Let's stick to excluding Session Details for now.
      
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
