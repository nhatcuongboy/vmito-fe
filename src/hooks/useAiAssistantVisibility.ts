'use client';

import { useMemo } from 'react';
import { usePathname } from '@/i18n/config';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSessionFilterStore } from '@/stores/useSessionFilterStore';

const HIDDEN_PATHS = ['/auth', '/admin', '/guest', '/join'];

export function useAiAssistantVisibility() {
  const { isAuthenticated, isHydrated } = useAuthStore();
  const pathname = usePathname();
  const { viewMode } = useSessionFilterStore();

  return useMemo(() => {
    if (!isHydrated || !isAuthenticated) return false;
    if (viewMode === 'map') return false;

    const normalized =
      pathname?.replace(/^\/[a-z]{2}(\/|$)/, '/').replace(/\/$/, '') || '/';

    return !HIDDEN_PATHS.some((path) => normalized.startsWith(path));
  }, [isAuthenticated, isHydrated, pathname, viewMode]);
}
