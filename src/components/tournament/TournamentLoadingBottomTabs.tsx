'use client';

import { useCallback, useMemo } from 'react';
import { BarChart3, CalendarDays, Home, Users } from 'lucide-react';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

import BottomNavigationBar from '@/components/ui/BottomNavigationBar';
import { useRouter } from '@/i18n/config';

const TAB_TO_SEGMENT: Record<number, string> = {
  0: '',
  1: 'teams',
  2: 'schedule',
  3: 'standings',
};

const SEGMENT_TO_TAB: Record<string, number> = {
  teams: 1,
  schedule: 2,
  standings: 3,
};

export default function TournamentLoadingBottomTabs() {
  const t = useTranslations('pages.tournaments.detail');
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const tournamentSlug = String(params?.id ?? '');

  const tabs = useMemo(
    () => [
      { id: 0, label: t('tabs.home'), icon: Home },
      { id: 1, label: t('tabs.teams'), icon: Users },
      { id: 2, label: t('tabs.schedule'), icon: CalendarDays },
      { id: 3, label: t('tabs.standings'), icon: BarChart3 },
    ],
    [t]
  );

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

  return (
    <BottomNavigationBar
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
    />
  );
}
