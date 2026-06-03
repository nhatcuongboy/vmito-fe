'use client';

import { Box, Skeleton, Text } from '@chakra-ui/react';
import { Image } from '@/components/ui/chakra-compat';
import { LucideIcon } from 'lucide-react';
import { Tournament } from '@/lib/api/types';
import SidebarNav from '@/components/ui/SidebarNav';
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
}

export default function TournamentSidebar({
  tournament,
  tabs,
  activeTab,
  onTabChange,
}: TournamentSidebarProps) {
  const t = useTranslations('pages.tournaments.detail.publicationStatus');
  const locale = useLocale();

  const header = tournament ? (
    <TournamentSidebarHeader
      tournament={tournament}
      locale={locale}
      publishedLabel={t('published')}
      draftLabel={t('draft')}
    />
  ) : (
    <TournamentSidebarHeaderSkeleton />
  );

  return (
    <SidebarNav
      header={header}
      items={tabs}
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
}

function TournamentSidebarHeader({
  tournament,
  locale,
  publishedLabel,
  draftLabel,
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
      <Box position="relative" bg="gray.100" h="130px">
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
          <Box w="100%" h="100%" bg="gray.200" />
        )}
        {/* Status badge */}
        <Box
          position="absolute"
          bottom={2}
          left={2}
          bg={`${statusColor}.100`}
          color={`${statusColor}.700`}
          px={2}
          py={0.5}
          borderRadius="md"
          fontSize="xs"
          fontWeight="semibold"
        >
          {statusLabel}
        </Box>
      </Box>

      {/* Tournament name & date */}
      <Box px={4} pt={4} pb={2}>
        <Text fontWeight="bold" fontSize="lg" mb={1} lineClamp={2}>
          {tournament.name}
        </Text>
        <Text fontSize="sm" color="gray.500">
          {formattedDate}
        </Text>
      </Box>
    </>
  );
}

function TournamentSidebarHeaderSkeleton() {
  return (
    <>
      <Box bg="gray.100" h="130px">
        <Skeleton h="100%" w="100%" />
      </Box>
      <Box px={4} pt={4} pb={2}>
        <Skeleton height="20px" width="80%" mb={2} borderRadius="md" />
        <Skeleton height="14px" width="55%" borderRadius="md" />
      </Box>
    </>
  );
}
