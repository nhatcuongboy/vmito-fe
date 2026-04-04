'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import { VStack, Button } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import { Edit } from 'lucide-react';
import { CategoryMatch, TournamentCourt, Category } from '@/lib/api/types';

const CATEGORY_COLORS = [
  '#ECC94B',
  '#90CDF4',
  '#68D391',
  '#B794F4',
  '#FBB6CE',
  '#FBD38D',
  '#76E4F7',
  '#FEB2B2',
];

interface ScheduleListViewProps {
  matches: CategoryMatch[];
  categories: Category[];
  courts: TournamentCourt[];
  onEditMatch?: (matchId: string) => void;
}

const getTeamLabel = (match: CategoryMatch, position: number): string => {
  const participant = match.participants?.find((p) => p.position === position);
  if (!participant?.categoryRegistration) {
    // Placeholder for future matches
    if (match.round === 'SF') return `Winner of ${match.matchNumber}`;
    if (match.round === 'F') return `Winner of ${match.matchNumber}`;
    if (match.round === '3RD') return `Loser of ${match.matchNumber}`;
    return 'TBD';
  }
  const reg = participant.categoryRegistration;
  if (reg.pair?.members) {
    return (
      reg.pair.name ||
      reg.pair.members.map((m) => m.player?.name || '?').join(' / ')
    );
  }
  return reg.player?.name || 'Unknown';
};

const formatMatchTime = (match: CategoryMatch): string => {
  if (!match.startTime) return '';
  const start = new Date(match.startTime);
  const end = match.endTime ? new Date(match.endTime) : null;

  const dateStr = start.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const startStr = start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (end) {
    const endStr = end.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `${dateStr} @ ${startStr} - ${endStr}`;
  }
  return `${dateStr} @ ${startStr}`;
};

export default function ScheduleListView({
  matches,
  categories,
  courts,
  onEditMatch,
}: ScheduleListViewProps) {
  const t = useTranslations(
    'pages.tournaments.detail.manage.organize.schedule.list'
  );

  // Group matches by category
  const matchesByCategory = categories
    .map((cat, idx) => ({
      category: cat,
      color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      matches: matches
        .filter((m) => m.categoryId === cat.id)
        .sort((a, b) => a.matchNumber - b.matchNumber),
    }))
    .filter((g) => g.matches.length > 0);

  const getCourtLabel = (courtId?: string): string => {
    if (!courtId) return '';
    const court = courts.find((c) => c.id === courtId);
    if (!court) return '';
    return court.courtName || `Court ${court.courtNumber}`;
  };

  return (
    <VStack gap={6} align="stretch">
      {matchesByCategory.map(({ category, color, matches: catMatches }) => (
        <Box key={category.id}>
          {/* Category header */}
          <Flex align="center" gap={2} mb={3}>
            <Box w="10px" h="10px" borderRadius="full" bg={color} />
            <Text fontWeight="semibold">{category.name}</Text>
          </Flex>

          {/* Table header */}
          <Box
            display="grid"
            gridTemplateColumns="40px 1fr 1fr 2fr 1.5fr 40px"
            gap={2}
            px={3}
            py={2}
            bg="gray.50"
            borderRadius="lg"
            mb={1}
          >
            <Text fontSize="xs" fontWeight="semibold" color="gray.500">
              #
            </Text>
            <Text fontSize="xs" fontWeight="semibold" color="gray.500">
              {t('team')}
            </Text>
            <Text fontSize="xs" fontWeight="semibold" color="gray.500">
              {t('team')}
            </Text>
            <Text fontSize="xs" fontWeight="semibold" color="gray.500">
              {t('time')}
            </Text>
            <Text fontSize="xs" fontWeight="semibold" color="gray.500">
              {t('court')}
            </Text>
            <Box />
          </Box>

          {/* Match rows */}
          <VStack gap={0} align="stretch">
            {catMatches.map((match) => (
              <Box
                key={match.id}
                display="grid"
                gridTemplateColumns="40px 1fr 1fr 2fr 1.5fr 40px"
                gap={2}
                px={3}
                py={3}
                borderBottomWidth="1px"
                borderColor="gray.100"
                _hover={{ bg: 'gray.50' }}
                alignItems="center"
              >
                <Text fontSize="sm" color="gray.500">
                  {match.matchNumber}
                </Text>
                <Text fontSize="sm" fontWeight="medium">
                  {getTeamLabel(match, 1)}
                </Text>
                <Text fontSize="sm" fontWeight="medium">
                  {getTeamLabel(match, 2)}
                </Text>
                <Text
                  fontSize="sm"
                  color={match.startTime ? 'gray.700' : 'gray.400'}
                >
                  {match.startTime ? formatMatchTime(match) : t('noTime')}
                </Text>
                <Text
                  fontSize="sm"
                  color={match.courtId ? 'gray.700' : 'gray.400'}
                >
                  {match.courtId ? getCourtLabel(match.courtId) : t('noCourt')}
                </Text>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => onEditMatch?.(match.id)}
                >
                  <Edit size={14} />
                </Button>
              </Box>
            ))}
          </VStack>
        </Box>
      ))}
    </VStack>
  );
}
