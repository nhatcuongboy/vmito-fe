'use client';

import { useAuthStore } from '@/stores/useAuthStore';
import { usePathname } from '@/i18n/config';
import { useMemo } from 'react';
import AiAssistant from '@/components/session/AiAssistant';
import { useBottomNavVisibility } from '@/hooks/useBottomNavVisibility';

// Pages where AI button should NOT appear
const HIDDEN_PATHS = ['/auth', '/admin', '/guest', '/join'];

// Bottom nav bar height (matches BottomNavigationBar: 64px + safe-area)
const BOTTOM_NAV_HEIGHT = 64;
const BUTTON_MARGIN = 16; // gap between button and bottom nav / screen edge

export default function GlobalAiButton() {
  const { isAuthenticated, isHydrated } = useAuthStore();
  const pathname = usePathname();
  const isBottomNavVisible = useBottomNavVisibility();

  const shouldShow = useMemo(() => {
    if (!isHydrated || !isAuthenticated) return false;
    const normalized =
      pathname?.replace(/^\/[a-z]{2}(\/|$)/, '/').replace(/\/$/, '') || '/';
    return !HIDDEN_PATHS.some((p) => normalized.startsWith(p));
  }, [isHydrated, isAuthenticated, pathname]);

  if (!shouldShow) return null;

  // When bottom nav is visible: float above it (64px bar + 16px gap)
  // When no bottom nav: just 24px from the bottom edge + safe area
  const bottomOffset = isBottomNavVisible
    ? `calc(${BOTTOM_NAV_HEIGHT + BUTTON_MARGIN}px + env(safe-area-inset-bottom))`
    : `calc(${BUTTON_MARGIN + 8}px + env(safe-area-inset-bottom))`;

  return <AiAssistant bottomOffset={bottomOffset} />;
}
