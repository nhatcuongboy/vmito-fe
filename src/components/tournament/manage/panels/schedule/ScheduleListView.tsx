'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import { VStack, Button } from '@/components/ui/chakra-compat';
import { useTranslations, useLocale } from 'next-intl';
import { formatTimeByDevicePreference } from '@/utils/time-helpers';
import { Edit } from 'lucide-react';
import { CategoryMatch, TournamentCourt, Category } from '@/lib/api/types';
import { getTeamLabel } from '@/lib/tournament/teamLabel';

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

export default function ScheduleListView({
  matches,
  categories,
  courts,
  onEditMatch,
}: ScheduleListViewProps) {
  const t = useTranslations(
    'pages.tournaments.detail.manage.organize.schedule.list'
  );
  const locale = useLocale();

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

    // Get first letter of court name or 'R' as default prefix
    const prefix = court.courtName
      ? court.courtName.charAt(0).toUpperCase()
      : 'R';
    const courtDisplay =
      court.courtName || `${t('courtPrefix')} ${court.courtNumber}`;

    return `${prefix} · ${courtDisplay}`;
  };

  const getRoundLabel = (round: string): string => {
    const roundMap: Record<string, string> = {
      GROUP: t('roundGroup'),
      QF: t('roundQF'),
      SF: t('roundSF'),
      F: t('roundF'),
      '3RD': t('round3rd'),
    };
    return roundMap[round] || round;
  };

  const formatMatchTime = (match: CategoryMatch): string => {
    if (!match.startTime) return '';
    const start = new Date(match.startTime);

    // endTime = actual end (match finished), estimatedEndTime = scheduled end
    // For display, prefer estimatedEndTime (scheduled), fall back to endTime (actual),
    // or calculate from startTime + 60 min if neither is available
    const rawEnd = match.estimatedEndTime ?? match.endTime;
    const end = rawEnd
      ? new Date(rawEnd)
      : new Date(start.getTime() + 60 * 60 * 1000);

    const dateStr = start.toLocaleDateString(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    const startStr = formatTimeByDevicePreference(start);
    const endStr = formatTimeByDevicePreference(end);

    return `${dateStr} @ ${startStr} - ${endStr}`;
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
            gridTemplateColumns="40px 80px 1fr 40px 1fr 2fr 1.5fr 40px"
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
              {t('round')}
            </Text>
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color="gray.500"
              textAlign="right"
            >
              {t('team1')}
            </Text>
            <Box /> {/* VS column */}
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color="gray.500"
              textAlign="left"
            >
              {t('team2')}
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
                gridTemplateColumns="40px 80px 1fr 40px 1fr 2fr 1.5fr 40px"
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
                <Text fontSize="xs" color="gray.600" fontWeight="medium">
                  {getRoundLabel(match.round)}
                </Text>
                <Text fontSize="sm" fontWeight="medium" textAlign="right">
                  {getTeamLabel(match, 1)}
                </Text>
                <Flex justify="center" align="center">
                  <Text fontSize="xs" color="gray.400" fontWeight="bold">
                    VS
                  </Text>
                </Flex>
                <Text fontSize="sm" fontWeight="medium" textAlign="left">
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
