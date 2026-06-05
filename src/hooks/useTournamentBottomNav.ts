'use client';

import { useCallback, useMemo } from 'react';
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
}

interface UseTournamentBottomNavResult {
  tabs: NavigationTab[];
  activeTab: number;
  handleTabChange: (tabId: number) => void;
}

/**
 * Builds the shared tournament bottom navigation tabs and navigation handler.
 * Management tabs are derived only from the currently resolved auth state so
 * host/manager-only menus cannot leak to guests or normal accounts.
 */
export function useTournamentBottomNav({
  slug,
  activeTabId,
  canManage,
  isHostOrAdmin,
}: UseTournamentBottomNavOptions): UseTournamentBottomNavResult {
  const t = useTranslations('pages.tournaments.detail');
  const router = useRouter();

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
      if (tab.id === 4) return canManage;
      if (tab.id === 5) return isHostOrAdmin;
      return true;
    });
  }, [canManage, isHostOrAdmin, t]);

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
