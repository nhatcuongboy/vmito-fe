'use client';

import { useNewsfeedBadgeInit } from '@/hooks/useNewsfeedBadgeInit';

/** Mounts the newsfeed badge lifecycle controller once at the app root. */
export function NewsfeedBadgeInitializer() {
  useNewsfeedBadgeInit();
  return null;
}
