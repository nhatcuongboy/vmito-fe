'use client';

import { Box, Skeleton, Text } from '@chakra-ui/react';
import { Image } from '@/components/ui/chakra-compat';
import { LucideIcon } from 'lucide-react';
import { useMemo } from 'react';
import { Tournament } from '@/lib/api/types';
import SidebarNav, { SidebarNavItem } from '@/components/ui/SidebarNav';
import { useLocale, useTranslations } from 'next-intl';

interface SidebarTab {
  id: number;
  label: string;
  icon: LucideIcon;
}

interface TournamentSidebarProps {
  tournament: Tournament | null;
  tabs: SidebarTab[];
  activeTab: number;
  onTabChange: (tabIndex: number) => void;
  showStatusBadge?: boolean;
}

export default function TournamentSidebar({
  tournament,
  tabs,
  activeTab,
  onTabChange,
  showStatusBadge = false,
}: TournamentSidebarProps) {
  const t = useTranslations('pages.tournaments.detail.publicationStatus');
  const locale = useLocale();
  const sidebarItems = useMemo<SidebarNavItem[]>(() => {
    const manageTab = tabs.find((tab) => tab.id === 4);
    const dashboardTab = tabs.find((tab) => tab.id === 5);
    const publicTabs = tabs.filter((tab) => tab.id !== 4 && tab.id !== 5);

    if (!manageTab) {
      return publicTabs;
    }

    return [
      ...publicTabs,
      {
        ...manageTab,
        children: dashboardTab ? [dashboardTab] : undefined,
        defaultExpanded: activeTab === 4 || activeTab === 5,
      },
    ];
  }, [activeTab, tabs]);

  const header = tournament ? (
    <TournamentSidebarHeader
      tournament={tournament}
      locale={locale}
      publishedLabel={t('published')}
      draftLabel={t('draft')}
      showStatusBadge={showStatusBadge}
    />
  ) : (
    <TournamentSidebarHeaderSkeleton />
  );

  return (
    <SidebarNav
      header={header}
      items={sidebarItems}
      activeId={activeTab}
      onItemClick={(id) => onTabChange(Number(id))}
      width="250px"
      topOffset="80px"
    />
  );
}

interface TournamentSidebarHeaderProps {
  tournament: Tournament;
  locale: string;
  publishedLabel: string;
  draftLabel: string;
  showStatusBadge: boolean;
}

function TournamentSidebarHeader({
  tournament,
  locale,
  publishedLabel,
  draftLabel,
  showStatusBadge,
}: TournamentSidebarHeaderProps) {
  const formattedDate = new Date(tournament.startDate).toLocaleDateString(
    locale,
    {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  );

  const statusLabel = tournament.isPublished ? publishedLabel : draftLabel;
  const statusColor = tournament.isPublished ? 'green' : 'gray';

  return (
    <>
      {/* Tournament banner image */}
      <Box
        position="relative"
        bg="gray.100"
        h="130px"
        _dark={{
          bg: 'var(--tournament-surface-muted, var(--chakra-colors-gray-800))',
        }}
      >
        {tournament.coverPhoto ||
        tournament.venue?.coverPhoto ||
        tournament.venue?.images?.[0] ? (
          <Image
            src={
              tournament.coverPhoto ||
              tournament.venue?.coverPhoto ||
              tournament.venue!.images![0]
            }
            alt={tournament.name}
            w="100%"
            h="100%"
            objectFit="cover"
          />
        ) : (
          <Box
            w="100%"
            h="100%"
            bg="gray.200"
            _dark={{
              bg: 'var(--tournament-surface-raised, var(--chakra-colors-gray-700))',
            }}
          />
        )}
        {/* Status badge — only visible to the host / managers */}
        {showStatusBadge && (
          <Box
            position="absolute"
            bottom={2}
            left={2}
            bg={`${statusColor}.100`}
            color={`${statusColor}.700`}
            _dark={{
              bg:
                statusColor === 'green'
                  ? 'rgba(34, 197, 94, 0.18)'
                  : 'rgba(148, 163, 184, 0.16)',
              color: `${statusColor}.100`,
              borderColor: `${statusColor}.500`,
            }}
            borderWidth="1px"
            px={2}
            py={0.5}
            borderRadius="md"
            fontSize="xs"
            fontWeight="semibold"
          >
            {statusLabel}
          </Box>
        )}
      </Box>

      {/* Tournament name & date */}
      <Box px={4} pt={4} pb={2}>
        <Text fontWeight="bold" fontSize="lg" mb={1} lineClamp={2}>
          {tournament.name}
        </Text>
        <Text fontSize="sm" color="gray.500" _dark={{ color: 'gray.400' }}>
          {formattedDate}
        </Text>
      </Box>
    </>
  );
}

function TournamentSidebarHeaderSkeleton() {
  return (
    <>
      <Box
        bg="gray.100"
        h="130px"
        _dark={{
          bg: 'var(--tournament-surface-muted, var(--chakra-colors-gray-800))',
        }}
      >
        <Skeleton h="100%" w="100%" />
      </Box>
      <Box px={4} pt={4} pb={2}>
        <Skeleton height="20px" width="80%" mb={2} borderRadius="md" />
        <Skeleton height="14px" width="55%" borderRadius="md" />
      </Box>
    </>
  );
}
