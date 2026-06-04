'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
import {
  Home,
  Users,
  CalendarDays,
  BarChart3,
  Settings,
  LayoutGrid,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/config';
import type { NavigationTab } from '@/components/ui/BottomNavigationBar';

const TAB_ROUTES: Record<number, string> = {
  0: '', // /tournament/[slug]
  1: 'teams',
  2: 'schedule',
  3: 'standings',
  4: 'manage',
  5: 'dashboard',
};

interface UseTournamentBottomNavOptions {
  /** Tournament URL slug */
  slug: string;
  /** The tab id that should be highlighted as active (-1 for none) */
  activeTabId: number;
  /** Whether the current user can manage the tournament (host / admin / manager) */
  canManage: boolean;
  /** Whether the current user is the host or a system admin */
  isHostOrAdmin: boolean;
  /** Current user id; used to scope the cache so it never leaks across users. */
  userId?: string | null;
}

interface UseTournamentBottomNavResult {
  tabs: NavigationTab[];
  activeTab: number;
  handleTabChange: (tabId: number) => void;
}

/**
 * Builds the shared tournament bottom navigation tabs and navigation handler.
 * Uses sessionStorage to cache canManage / isHostOrAdmin per (user, slug) so
 * that re-mounting pages (e.g. returning from a sub-page) shows the correct
 * tab count immediately without waiting for API responses. The cache is scoped
 * by user id and disabled for logged-out users so manager menus never leak to
 * guests or normal accounts sharing the same browser session.
 */
export function useTournamentBottomNav({
  slug,
  activeTabId,
  canManage,
  isHostOrAdmin,
  userId,
}: UseTournamentBottomNavOptions): UseTournamentBottomNavResult {
  const t = useTranslations('pages.tournaments.detail');
  const router = useRouter();

  // Only cache for a known, logged-in user. Scoping by user id prevents a
  // previous host/admin session from exposing manager tabs to a guest or a
  // regular account that later views the same tournament.
  const canManageCacheKey =
    slug && userId ? `vmito.canManage.${userId}.${slug}` : null;
  const isHostCacheKey =
    slug && userId ? `vmito.isHost.${userId}.${slug}` : null;

  const [cachedCanManage, setCachedCanManage] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !slug || !userId) return false;
    return (
      window.sessionStorage.getItem(`vmito.canManage.${userId}.${slug}`) === '1'
    );
  });

  const [cachedIsHost, setCachedIsHost] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !slug || !userId) return false;
    return (
      window.sessionStorage.getItem(`vmito.isHost.${userId}.${slug}`) === '1'
    );
  });

  // Keep cached values in sync with the current user. When the resolved value
  // is a definite positive we persist it; otherwise leave the cache untouched
  // so the first-render flicker is avoided only for actual managers.
  useEffect(() => {
    if (!canManageCacheKey) {
      setCachedCanManage(false);
      return;
    }
    setCachedCanManage(
      window.sessionStorage.getItem(canManageCacheKey) === '1'
    );
    if (canManage) {
      window.sessionStorage.setItem(canManageCacheKey, '1');
      setCachedCanManage(true);
    }
  }, [canManage, canManageCacheKey]);

  useEffect(() => {
    if (!isHostCacheKey) {
      setCachedIsHost(false);
      return;
    }
    setCachedIsHost(window.sessionStorage.getItem(isHostCacheKey) === '1');
    if (isHostOrAdmin) {
      window.sessionStorage.setItem(isHostCacheKey, '1');
      setCachedIsHost(true);
    }
  }, [isHostOrAdmin, isHostCacheKey]);

  // A logged-out user is never a manager: ignore any cache entirely.
  const effectiveCanManage = userId ? canManage || cachedCanManage : canManage;
  const effectiveIsHostOrAdmin = userId
    ? isHostOrAdmin || cachedIsHost
    : isHostOrAdmin;

  const tabs = useMemo<NavigationTab[]>(() => {
    const allTabs: NavigationTab[] = [
      { id: 0, label: t('tabs.home'), icon: Home },
      { id: 1, label: t('tabs.teams'), icon: Users },
      { id: 2, label: t('tabs.schedule'), icon: CalendarDays },
      { id: 3, label: t('tabs.standings'), icon: BarChart3 },
      { id: 4, label: t('tabs.manage'), icon: Settings },
      { id: 5, label: t('tabs.dashboard'), icon: LayoutGrid },
    ];
    return allTabs.filter((tab) => {
      if (tab.id === 4) return effectiveCanManage;
      if (tab.id === 5) return effectiveIsHostOrAdmin;
      return true;
    });
  }, [effectiveCanManage, effectiveIsHostOrAdmin, t]);

  const handleTabChange = useCallback(
    (tabId: number) => {
      const route = TAB_ROUTES[tabId];
      if (route === '') {
        router.push(`/tournament/${slug}`);
      } else {
        router.push(`/tournament/${slug}/${route}`);
      }
    },
    [router, slug]
  );

  return { tabs, activeTab: activeTabId, handleTabChange };
}
