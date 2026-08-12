import { useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNewsfeedBadgeStore } from '@/stores/useNewsfeedBadgeStore';

/**
 * Hook to initialize newsfeed badge count when app loads.
 * Fetches unread count from API for authenticated users.
 * Should be called once at app root (layout or provider).
 */
export function useNewsfeedBadgeInit() {
  const { isAuthenticated, user } = useAuthStore();
  const fetchCount = useNewsfeedBadgeStore((state) => state.fetchCount);
  const reset = useNewsfeedBadgeStore((state) => state.reset);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      // Fetch initial count when user is authenticated
      fetchCount();
    } else {
      // Reset count when user logs out
      reset();
    }
  }, [isAuthenticated, user?.id, fetchCount, reset]);
}
