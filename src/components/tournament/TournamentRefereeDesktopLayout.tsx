'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import {
  BarChart3,
  CalendarDays,
  Home,
  LayoutGrid,
  Settings,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/config';
import { TournamentManagerService } from '@/lib/api/tournament-manager.service';
import { Tournament, TournamentMyAccess, UserRole } from '@/lib/api/types';
import { useAuthStore } from '@/stores/useAuthStore';
import TournamentSidebar from '@/components/tournament/TournamentSidebar';

interface TournamentRefereeDesktopLayoutProps {
  tournament: Tournament | null;
  activeTab?: number;
  showSidebar?: boolean;
  children: ReactNode;
}

const TAB_TO_PATH: Record<number, string> = {
  0: '',
  1: '/teams',
  2: '/schedule',
  3: '/standings',
  4: '/manage',
  5: '/dashboard',
};

export default function TournamentRefereeDesktopLayout({
  tournament,
  activeTab = 2,
  showSidebar = true,
  children,
}: TournamentRefereeDesktopLayoutProps) {
  const t = useTranslations('pages.tournaments.detail');
  const router = useRouter();
  const { user } = useAuthStore();
  const [myAccess, setMyAccess] = useState<TournamentMyAccess | null>(null);

  const isHost = !!user && user.id === tournament?.hostId;
  const isAdmin = user?.role === UserRole.ADMIN;

  useEffect(() => {
    if (!user || !tournament) {
      setMyAccess(null);
      return;
    }

    let active = true;
    TournamentManagerService.getMyAccess(tournament.id)
      .then((access) => {
        if (active) setMyAccess(access);
      })
      .catch(() => {
        if (active) setMyAccess(null);
      });

    return () => {
      active = false;
    };
  }, [tournament, user]);

  const canManage =
    isHost || isAdmin || (myAccess?.permissions.length ?? 0) > 0;

  const tabs = useMemo(() => {
    const allTabs = [
      { id: 0, label: t('tabs.home'), icon: Home },
      { id: 1, label: t('tabs.teams'), icon: Users },
      { id: 2, label: t('tabs.schedule'), icon: CalendarDays },
      { id: 3, label: t('tabs.standings'), icon: BarChart3 },
      { id: 4, label: t('tabs.manage'), icon: Settings },
      { id: 5, label: t('tabs.dashboard'), icon: LayoutGrid },
    ];

    return allTabs.filter((tab) => {
      if (tab.id === 4) return canManage;
      if (tab.id === 5) return isHost || isAdmin;
      return true;
    });
  }, [canManage, isHost, isAdmin, t]);

  const handleTabChange = (tabId: number) => {
    if (!tournament) return;
    const path = TAB_TO_PATH[tabId] ?? '';
    router.push(`/tournament/${tournament.slug || tournament.id}${path}`);
  };

  return (
    <Flex
      gap={{ base: 0, md: 6 }}
      pt={{ md: 6 }}
      pl={{ md: 4 }}
      pr={{ md: 6 }}
      align="flex-start"
    >
      {showSidebar && (
        <Flex display={{ base: 'none', md: 'flex' }} flexShrink={0}>
          <TournamentSidebar
            tournament={tournament}
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </Flex>
      )}

      <Box flex="1" minW={0}>
        {children}
      </Box>
    </Flex>
  );
}
