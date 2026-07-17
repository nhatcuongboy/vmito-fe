'use client';

import { useCallback, useMemo } from 'react';
import { BarChart3, CalendarDays, Home, Settings, Users } from 'lucide-react';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

import BottomNavigationBar from '@/components/ui/BottomNavigationBar';
import type { NavigationTab } from '@/components/ui/BottomNavigationBar';
import { useRouter } from '@/i18n/config';
import { useTournamentNavCache } from '@/hooks/useTournamentNavCache';

const TAB_TO_SEGMENT: Record<number, string> = {
  0: '',
  1: 'teams',
  2: 'schedule',
  3: 'standings',
  4: 'manage',
  5: 'dashboard',
};

const SEGMENT_TO_TAB: Record<string, number> = {
  teams: 1,
  schedule: 2,
  standings: 3,
  manage: 4,
  dashboard: 5,
};

export default function TournamentLoadingBottomTabs() {
  const t = useTranslations('pages.tournaments.detail');
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const tournamentSlug = String(params?.id ?? '');

  // Reuse the per-session management cache so hosts/admins/managers keep their
  // Manage tab during the route transition instead of flickering back to the
  // 4 public tabs. The cache is read in a layout effect so the hydration
  // render matches the server HTML; the bar is hidden until then so the menu
  // only ever appears with the right tab set. The Dashboard tab is never shown
  // here — this bar is mobile-only and Dashboard is reached via the FAB.
  const { access: cachedAccess, ready: navCacheReady } =
    useTournamentNavCache(tournamentSlug);

  const tabs = useMemo<NavigationTab[]>(() => {
    const allTabs: NavigationTab[] = [
      { id: 0, label: t('tabs.home'), icon: Home },
      { id: 1, label: t('tabs.teams'), icon: Users },
      { id: 2, label: t('tabs.schedule'), icon: CalendarDays },
      { id: 3, label: t('tabs.standings'), icon: BarChart3 },
      { id: 4, label: t('tabs.manage'), icon: Settings },
    ];
    return allTabs.filter((tab) => {
      if (tab.id === 4) return !!cachedAccess?.canManage;
      return true;
    });
  }, [cachedAccess, t]);

  const activeTab = useMemo(() => {
    const segment = pathname.split('/').filter(Boolean).at(-1) ?? '';
    return SEGMENT_TO_TAB[segment] ?? 0;
  }, [pathname]);

  const handleTabChange = useCallback(
    (tabId: number) => {
      const segment = TAB_TO_SEGMENT[tabId];
      router.push(
        segment
          ? `/tournament/${tournamentSlug}/${segment}`
          : `/tournament/${tournamentSlug}`
      );
    },
    [router, tournamentSlug]
  );

  if (!navCacheReady) return null;

  return (
    <BottomNavigationBar
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
    />
  );
}
