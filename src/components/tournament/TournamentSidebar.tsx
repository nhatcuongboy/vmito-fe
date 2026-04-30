'use client';

import { Box, Text } from '@chakra-ui/react';
import { Image } from '@/components/ui/chakra-compat';
import { LucideIcon } from 'lucide-react';
import { Tournament } from '@/lib/api/types';
import SidebarNav from '@/components/ui/SidebarNav';

interface SidebarTab {
  id: number;
  label: string;
  icon: LucideIcon;
}

interface TournamentSidebarProps {
  tournament: Tournament;
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
  const formattedDate = new Date(tournament.startDate).toLocaleDateString(
    'en-US',
    {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  );

  const statusLabel = tournament.isPublished ? 'Published' : 'Draft';
  const statusColor = tournament.isPublished ? 'green' : 'gray';

  const header = (
    <>
      {/* Tournament banner image */}
      <Box position="relative" bg="gray.100" h="130px">
        {tournament.venue?.coverPhoto || tournament.venue?.images?.[0] ? (
          <Image
            src={tournament.venue.coverPhoto || tournament.venue.images![0]}
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
