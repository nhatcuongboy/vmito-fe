'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import { Image } from '@/components/ui/chakra-compat';
import {
  Calendar,
  ListChecks,
  LucideIcon,
  MapPin,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Tournament } from '@/lib/api/types';
import SidebarNav from '@/components/ui/SidebarNav';
import { useLocale, useTranslations } from 'next-intl';
import { getPrimaryVenueDisplay } from '@/utils';
import { FavoriteEngagementControl } from '@/components/favorites/FavoriteEngagementControl';
import { TournamentGuideButton } from './TournamentGuideButton';
import { useTournamentGuideVisibilityStore } from '@/stores/useTournamentGuideVisibilityStore';

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
  showFavorite?: boolean;
  showGuideToggle?: boolean;
  variant?: 'card' | 'embedded';
}

export default function TournamentSidebar({
  tournament,
  tabs,
  activeTab,
  onTabChange,
  showStatusBadge = false,
  showFavorite = false,
  showGuideToggle = false,
  variant = 'card',
}: TournamentSidebarProps) {
  const t = useTranslations('pages.tournaments.detail.publicationStatus');
  const navigation = useTranslations('navigation');
  const locale = useLocale();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isGuideWidgetVisible = useTournamentGuideVisibilityStore(
    (state) => state.isVisible
  );

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
      showFavorite={showFavorite}
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
      footer={
        showGuideToggle && !isGuideWidgetVisible ? (
          <Box px={isCollapsed ? 1.5 : 2} pb={4}>
            <TournamentGuideButton isCollapsed={isCollapsed} />
          </Box>
        ) : undefined
      }
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
  showFavorite: boolean;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}

function TournamentSidebarHeader({
  tournament,
  locale,
  publishedLabel,
  draftLabel,
  showStatusBadge,
  showFavorite,
  isCollapsed,
  onToggleCollapsed,
}: TournamentSidebarHeaderProps) {
  const formattedDate = new Date(tournament.startDate).toLocaleDateString(
    locale,
    {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }
  );

  const statusLabel = tournament.isPublished ? publishedLabel : draftLabel;
  const statusColor = tournament.isPublished ? 'green' : 'gray';
  const primaryVenue = getPrimaryVenueDisplay(tournament);
  const bannerImage =
    tournament.coverPhoto ||
    primaryVenue?.coverPhoto ||
    primaryVenue?.images?.[0];

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
        {bannerImage ? (
          <Image
            src={bannerImage}
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
        {showFavorite && !isCollapsed && (
          <Box position="absolute" bottom={2} right={2} zIndex={1}>
            <FavoriteEngagementControl
              type="TOURNAMENT"
              targetId={tournament.id}
              initialIsFavorite={tournament.isFavorite}
              returnUrl={`/tournament/${tournament.slug || tournament.id}`}
              variant="overlay-dark"
            />
          </Box>
        )}
      </Box>

      {/* Tournament name & date */}
      <Box px={4} pt={4} pb={2} display={isCollapsed ? 'none' : 'block'}>
        <Text fontWeight="bold" fontSize="lg" mb={1} lineClamp={2}>
          {tournament.name}
        </Text>
        <Flex
          align="center"
          gap={1.5}
          color="gray.500"
          _dark={{ color: 'gray.400' }}
        >
          <Calendar size={13} aria-hidden="true" />
          <Text fontSize="sm" color="inherit">
            {formattedDate}
          </Text>
        </Flex>
        {primaryVenue?.name && (
          <Flex
            align="center"
            gap={1.5}
            color="gray.500"
            _dark={{ color: 'gray.400' }}
          >
            <MapPin size={13} aria-hidden="true" style={{ flexShrink: 0 }} />
            <Text fontSize="sm" color="inherit" lineClamp={1}>
              {primaryVenue.name}
            </Text>
          </Flex>
        )}
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
      w="26px"
      h="26px"
      borderRadius="md"
      bg="white"
      color="gray.500"
      borderWidth="1px"
      borderColor="gray.200"
      boxShadow="xs"
      transition="all 0.15s"
      _hover={{ bg: 'gray.50', color: 'gray.700', borderColor: 'gray.300' }}
      _active={{ transform: 'scale(0.95)' }}
      _dark={{
        bg: 'gray.800',
        color: 'gray.400',
        borderColor: 'gray.700',
        _hover: { bg: 'gray.700', color: 'gray.200' },
      }}
      onClick={onToggle}
    >
      <Icon size={14} />
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
        <Box
          h="100%"
          w="100%"
          bg="gray.200"
          _dark={{
            bg: 'var(--tournament-surface-raised, var(--chakra-colors-gray-700))',
          }}
        />
        <SidebarCollapseButton
          isCollapsed={isCollapsed}
          onToggle={onToggleCollapsed}
        />
      </Box>
      <Box px={4} pt={4} pb={2} display={isCollapsed ? 'none' : 'block'}>
        <Box
          height="20px"
          width="80%"
          mb={2}
          borderRadius="md"
          bg="gray.100"
          _dark={{ bg: 'gray.700' }}
        />
        <Box
          height="14px"
          width="55%"
          borderRadius="md"
          bg="gray.100"
          _dark={{ bg: 'gray.700' }}
        />
      </Box>
    </>
  );
}
