import { useEffect } from 'react';
import { usePathname } from '@/i18n/config';
import { UserRole } from '@/lib/api/types';
import { isNewsfeedPathname } from '@/lib/newsfeed/isNewsfeedPathname';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNewsfeedBadgeStore } from '@/stores/useNewsfeedBadgeStore';

/** Coordinates badge state with authentication, routing and tab visibility. */
export function useNewsfeedBadgeInit() {
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userId = useAuthStore((state) => state.user?.id);
  const userRole = useAuthStore((state) => state.user?.role);
  const fetchCount = useNewsfeedBadgeStore((state) => state.fetchCount);
  const markAsRead = useNewsfeedBadgeStore((state) => state.markAsRead);
  const reset = useNewsfeedBadgeStore((state) => state.reset);
  const canUseNewsfeed =
    isAuthenticated && Boolean(userId) && userRole !== UserRole.GUEST;
  const isOnNewsfeed = isNewsfeedPathname(pathname);

  // Clear state when the active identity changes. Route changes are handled by
  // the next effect and must not reset an otherwise valid badge count.
  useEffect(() => {
    reset();
  }, [canUseNewsfeed, userId, reset]);

  useEffect(() => {
    if (!canUseNewsfeed) return;

    if (isOnNewsfeed) {
      void markAsRead();
    } else {
      void fetchCount();
    }
  }, [canUseNewsfeed, userId, isOnNewsfeed, fetchCount, markAsRead]);

  useEffect(() => {
    if (!canUseNewsfeed) return;

    const handleVisibilityChange = () => {
      if (document.hidden) return;

      if (isOnNewsfeed) {
        void markAsRead();
      } else {
        void fetchCount();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [canUseNewsfeed, isOnNewsfeed, fetchCount, markAsRead]);
}
