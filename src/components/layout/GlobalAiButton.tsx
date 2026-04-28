'use client';

import { useAuthStore } from '@/stores/useAuthStore';
import { usePathname } from '@/i18n/config';
import { useMemo } from 'react';
import AiAssistant from '@/components/session/AiAssistant';
import { useBottomNavVisibility } from '@/hooks/useBottomNavVisibility';

// Pages where AI button should NOT appear
const HIDDEN_PATHS = ['/auth', '/admin', '/guest', '/join', '/sessions/new'];

// Bottom nav bar height (matches BottomNavigationBar: 64px + safe-area)
const BOTTOM_NAV_HEIGHT = 64;
const BUTTON_MARGIN = 16; // gap between button and bottom nav / screen edge

export default function GlobalAiButton() {
  const { isAuthenticated, isHydrated } = useAuthStore();
  const pathname = usePathname();
  const isGlobalVisible = useBottomNavVisibility();

  const shouldShow = useMemo(() => {
    if (!isHydrated || !isAuthenticated) return false;
    const normalized =
      pathname?.replace(/^\/[a-z]{2}(\/|$)/, '/').replace(/\/$/, '') || '/';
    return !HIDDEN_PATHS.some((p) => normalized.startsWith(p));
  }, [isHydrated, isAuthenticated, pathname]);

  const bottomOffset = useMemo(() => {
    const smallOffset = `calc(${BUTTON_MARGIN + 8}px + env(safe-area-inset-bottom))`;
    const largeOffset = `calc(${BOTTOM_NAV_HEIGHT + BUTTON_MARGIN}px + env(safe-area-inset-bottom))`;

    if (!pathname) return smallOffset;

    const normalized =
      pathname.replace(/^\/[a-z]{2}(\/|$)/, '/').replace(/\/$/, '') || '/';

    // 1. HostSessionPage: Bottom Nav is ALWAYS visible (both mobile & desktop)
    if (normalized.match(/^\/host\/sessions\/[^/]+$/)) {
      return largeOffset;
    }

    // 2. These pages have a mobile-only bottom nav
    const CUSTOM_BOTTOM_NAV_PATHS = [
      '/host/sessions',
      '/host/sessions/pending',
      '/host/sessions/joined',
    ];

    const hasMobileNav =
      isGlobalVisible ||
      CUSTOM_BOTTOM_NAV_PATHS.includes(normalized) ||
      normalized.match(/^\/player\/sessions\/[^/]+$/) ||
      normalized.match(/^\/tournament\/[^/]+(\/[^/]+)?$/);

    if (hasMobileNav) {
      return { base: largeOffset, md: smallOffset };
    }

    return smallOffset;
  }, [isGlobalVisible, pathname]);

  if (!shouldShow) return null;

  return <AiAssistant bottomOffset={bottomOffset} />;
}
