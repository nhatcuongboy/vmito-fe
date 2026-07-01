'use client';

import { Box, Skeleton, Text } from '@chakra-ui/react';
import { Image } from '@/components/ui/chakra-compat';
import { LucideIcon, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Tournament } from '@/lib/api/types';
import SidebarNav from '@/components/ui/SidebarNav';
import { useLocale, useTranslations } from 'next-intl';

interface SidebarTab {
  id: number;
  label: string;
  icon: LucideIcon;
}

const TOURNAMENT_SIDEBAR_COLLAPSED_KEY = 'vmito.tournament.sidebarCollapsed';

interface TournamentSidebarProps {
  tournament: Tournament | null;
  tabs: SidebarTab[];
  activeTab: number;
  onTabChange: (tabIndex: number) => void;
  showStatusBadge?: boolean;
  variant?: 'card' | 'embedded';
}

export default function TournamentSidebar({
  tournament,
  tabs,
  activeTab,
  onTabChange,
  showStatusBadge = false,
  variant = 'card',
}: TournamentSidebarProps) {
  const t = useTranslations('pages.tournaments.detail.publicationStatus');
  const locale = useLocale();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    setIsCollapsed(
      window.localStorage.getItem(TOURNAMENT_SIDEBAR_COLLAPSED_KEY) === 'true'
    );
  }, []);

  const handleToggleCollapsed = useCallback(() => {
    setIsCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(
        TOURNAMENT_SIDEBAR_COLLAPSED_KEY,
        String(next)
      );
      return next;
    });
  }, []);

  const header = tournament ? (
    <TournamentSidebarHeader
      tournament={tournament}
      locale={locale}
      publishedLabel={t('published')}
      draftLabel={t('draft')}
      showStatusBadge={showStatusBadge}
      isCollapsed={isCollapsed}
      onToggleCollapsed={handleToggleCollapsed}
    />
  ) : (
    <TournamentSidebarHeaderSkeleton
      isCollapsed={isCollapsed}
      onToggleCollapsed={handleToggleCollapsed}
    />
  );

  return (
    <SidebarNav
      header={header}
      items={tabs}
      activeId={activeTab}
      onItemClick={(id) => onTabChange(Number(id))}
      width="250px"
      isCollapsed={isCollapsed}
      topOffset="80px"
      variant={variant}
    />
  );
}

interface TournamentSidebarHeaderProps {
  tournament: Tournament;
  locale: string;
  publishedLabel: string;
  draftLabel: string;
  showStatusBadge: boolean;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}

function TournamentSidebarHeader({
  tournament,
  locale,
  publishedLabel,
  draftLabel,
  showStatusBadge,
  isCollapsed,
  onToggleCollapsed,
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
        h={isCollapsed ? '76px' : '130px'}
        transition="height 0.2s ease"
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
        <SidebarCollapseButton
          isCollapsed={isCollapsed}
          onToggle={onToggleCollapsed}
        />
        {/* Status badge — only visible to the host / managers */}
        {showStatusBadge && !isCollapsed && (
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
      <Box px={4} pt={4} pb={2} display={isCollapsed ? 'none' : 'block'}>
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

interface SidebarCollapseButtonProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

function SidebarCollapseButton({
  isCollapsed,
  onToggle,
}: SidebarCollapseButtonProps) {
  const Icon = isCollapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <Box
      as="button"
      aria-label={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
      aria-pressed={isCollapsed}
      position="absolute"
      top={2}
      right={2}
      zIndex={1}
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      w="32px"
      h="32px"
      borderRadius="md"
      bg="rgba(15, 23, 42, 0.72)"
      color="white"
      borderWidth="1px"
      borderColor="rgba(255, 255, 255, 0.28)"
      boxShadow="0 8px 20px rgba(15, 23, 42, 0.22)"
      backdropFilter="blur(10px)"
      transition="all 0.15s"
      _hover={{ bg: 'rgba(15, 23, 42, 0.86)' }}
      _active={{ transform: 'scale(0.96)' }}
      onClick={onToggle}
    >
      <Icon size={17} />
    </Box>
  );
}

interface TournamentSidebarHeaderSkeletonProps {
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}

function TournamentSidebarHeaderSkeleton({
  isCollapsed,
  onToggleCollapsed,
}: TournamentSidebarHeaderSkeletonProps) {
  return (
    <>
      <Box
        position="relative"
        bg="gray.100"
        h={isCollapsed ? '76px' : '130px'}
        transition="height 0.2s ease"
        _dark={{
          bg: 'var(--tournament-surface-muted, var(--chakra-colors-gray-800))',
        }}
      >
        <Skeleton h="100%" w="100%" />
        <SidebarCollapseButton
          isCollapsed={isCollapsed}
          onToggle={onToggleCollapsed}
        />
      </Box>
      <Box px={4} pt={4} pb={2} display={isCollapsed ? 'none' : 'block'}>
        <Skeleton height="20px" width="80%" mb={2} borderRadius="md" />
        <Skeleton height="14px" width="55%" borderRadius="md" />
      </Box>
    </>
  );
}
