'use client';

import { useNewsfeedBadgeInit } from '@/hooks/useNewsfeedBadgeInit';

/**
 * Client component to initialize newsfeed badge count.
 * Must be rendered once at app root to fetch unread count on load.
 */
export function NewsfeedBadgeInitializer() {
  useNewsfeedBadgeInit();
  return null;
}
