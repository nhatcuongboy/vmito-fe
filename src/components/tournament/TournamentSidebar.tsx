'use client';

import { Box, Flex, Image, Text, VStack } from '@chakra-ui/react';
import { LucideIcon } from 'lucide-react';
import { Tournament } from '@/lib/api/types';

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

  return (
    <Box
      w="250px"
      flexShrink={0}
      position="sticky"
      top="80px"
      alignSelf="flex-start"
      height="calc(100vh - 100px)"
      bg="white"
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="gray.200"
      boxShadow="sm"
      overflow="hidden"
      display="flex"
      flexDirection="column"
    >
      {/* Tournament banner image */}
      <Box position="relative" bg="gray.100" h="130px" flexShrink={0}>
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

      {/* Content Area */}
      <Box
        px={4}
        pb={4}
        pt={4}
        display="flex"
        flexDirection="column"
        gap={0}
        flex={1}
        overflowY="auto"
      >
        <Box mb={5}>
          {/* Tournament name & date */}
          <Text fontWeight="bold" fontSize="lg" mb={1} lineClamp={2}>
            {tournament.name}
          </Text>
          <Text fontSize="sm" color="gray.500">
            {formattedDate}
          </Text>
        </Box>

        {/* Navigation items */}
        <VStack gap={1} align="stretch" pb={2}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <Flex
                key={tab.id}
                as="button"
                align="center"
                gap={3}
                px={3}
                py={2.5}
                borderRadius="lg"
                cursor="pointer"
                fontWeight={isActive ? 'semibold' : 'medium'}
                color={isActive ? 'gray.900' : 'gray.600'}
                bg={isActive ? 'gray.100' : 'transparent'}
                _hover={{ bg: isActive ? 'gray.100' : 'gray.50' }}
                transition="all 0.15s"
                onClick={() => onTabChange(tab.id)}
                w="full"
                textAlign="left"
              >
                <Icon size={18} />
                <Text fontSize="sm">{tab.label}</Text>
              </Flex>
            );
          })}
        </VStack>
      </Box>
    </Box>
  );
}
