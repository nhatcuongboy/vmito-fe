'use client';

import { useMemo, useState } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { VStack, Button } from '@/components/ui/chakra-compat';
import { Link } from '@/i18n/config';
import { useTranslations, useLocale } from 'next-intl';
import { formatTimeByDevicePreference } from '@/utils/time-helpers';
import { ArrowDown, ArrowUp, ChevronsUpDown, Edit, Trash2 } from 'lucide-react';
import { CategoryMatch, TournamentCourt, Category } from '@/lib/api/types';
import { resolveMatchSideLabel } from '@/lib/tournament/bracketSlots';
import { usePlayoffSlotLabels } from '@/lib/tournament/usePlayoffSlotLabels';
import { getMatchDisplayCode } from '@/lib/tournament/codes';

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
  onDeleteMatch?: (matchId: string) => void;
  tournamentId?: string;
  courtAbbreviation?: string;
}

const REGISTRATION_CODE_LENGTH = 8;
type SortKey = 'matchCode' | 'time';
type SortDirection = 'asc' | 'desc';

const getUniqueRegistrationCode = (
  registrationId: string,
  registrationIds: string[]
) => {
  const normalizedIds = registrationIds.map((id) => id.toLowerCase());
  const normalizedId = registrationId.toLowerCase();
  let codeLength = Math.min(REGISTRATION_CODE_LENGTH, registrationId.length);

  while (codeLength < registrationId.length) {
    const candidate = normalizedId.slice(0, codeLength);
    const matches = normalizedIds.filter((id) => id.startsWith(candidate));

    if (matches.length <= 1) return candidate;
    codeLength += 1;
  }

  return normalizedId;
};

export default function ScheduleListView({
  matches,
  categories,
  courts,
  onEditMatch,
  onDeleteMatch,
  tournamentId,
  courtAbbreviation,
}: ScheduleListViewProps) {
  const t = useTranslations(
    'pages.tournaments.detail.manage.organize.schedule.list'
  );
  const slotLabels = usePlayoffSlotLabels();
  const locale = useLocale();
  const [sort, setSort] = useState<{
    key: SortKey;
    direction: SortDirection;
  }>({ key: 'time', direction: 'asc' });

  // Group matches by category
  const matchesByCategory = useMemo(
    () =>
      categories
        .map((cat, idx) => ({
          category: cat,
          color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
          matches: sortMatches(
            matches.filter((m) => m.categoryId === cat.id),
            sort
          ),
        }))
        .filter((g) => g.matches.length > 0),
    [categories, matches, sort]
  );

  const toggleSort = (key: SortKey) => {
    setSort((current) => ({
      key,
      direction:
        current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const registrationCodeById = useMemo(() => {
    const registrationIds = Array.from(
      new Set(
        matches.flatMap(
          (match) =>
            match.participants?.map(
              (participant) => participant.categoryRegistrationId
            ) ?? []
        )
      )
    );

    return new Map(
      registrationIds.map((id) => [
        id,
        getUniqueRegistrationCode(id, registrationIds),
      ])
    );
  }, [matches]);

  const getAbbreviation = (value?: string): string => {
    const normalized = value?.trim();
    if (!normalized) return '';

    const firstToken = normalized.split(/\s+/)[0];
    if (/^\d+$/.test(normalized)) return '';
    if (/^[a-z0-9]{2,4}$/i.test(firstToken)) return firstToken.toUpperCase();

    const initials = normalized
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .toUpperCase();

    return initials || '';
  };

  const getCourtLabel = (courtId?: string): string => {
    if (!courtId) return '';
    const court = courts.find((c) => c.id === courtId);
    if (!court) return '';

    const prefix =
      getAbbreviation(court.courtName) ||
      getAbbreviation(courtAbbreviation) ||
      getAbbreviation(t('courtPrefix')) ||
      'C';

    return `${prefix} · ${court.courtNumber}`;
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

  const renderTeamName = (
    match: CategoryMatch,
    position: number,
    category?: Category
  ) => {
    const label = resolveMatchSideLabel(match, position as 1 | 2, {
      allMatches: matches,
      category,
      labels: slotLabels,
    });
    const participant = match.participants?.find(
      (item) => item.position === position
    );
    const registrationCode = participant?.categoryRegistrationId
      ? registrationCodeById.get(participant.categoryRegistrationId)
      : undefined;

    if (!tournamentId || !registrationCode) {
      return label;
    }

    return (
      <Link
        href={`/t/${tournamentId}/team/${registrationCode}`}
        style={{ color: 'inherit', textDecoration: 'none' }}
      >
        <Box
          as="span"
          color="green.700"
          fontWeight="700"
          _dark={{ color: 'green.200' }}
          _hover={{ textDecoration: 'underline' }}
        >
          {label}
        </Box>
      </Link>
    );
  };

  // Trailing action columns (edit / delete) are only present when their
  // callbacks are supplied, so the public read-only view keeps a clean layout.
  const actionColCount = (onEditMatch ? 1 : 0) + (onDeleteMatch ? 1 : 0);
  const gridTemplateColumns = `56px 80px 1fr 40px 1fr 2fr 1.5fr${' 40px'.repeat(
    actionColCount
  )}`;

  return (
    <VStack gap={6} align="stretch">
      {matchesByCategory.map(({ category, color, matches: catMatches }) => (
        <Box
          key={category.id}
          borderWidth="1px"
          borderColor="green.100"
          borderRadius="xl"
          overflow="hidden"
          bg={{
            base: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(240,253,244,0.82) 100%)',
            _dark:
              'linear-gradient(180deg, rgba(31,41,55,0.96) 0%, rgba(6,78,59,0.34) 100%)',
          }}
          boxShadow="0 12px 28px rgba(15, 118, 110, 0.08)"
        >
          {/* Category header */}
          <Flex
            align="center"
            gap={2}
            px={4}
            py={3}
            bg={{
              base: 'rgba(236, 253, 245, 0.72)',
              _dark: 'rgba(6, 78, 59, 0.32)',
            }}
            borderBottomWidth="1px"
            borderColor="green.100"
          >
            <Box
              w="10px"
              h="10px"
              borderRadius="full"
              bg={color}
              boxShadow={`0 0 0 4px ${color}22`}
            />
            <Text
              fontWeight="semibold"
              color="gray.800"
              _dark={{ color: 'gray.50' }}
            >
              {category.name}
            </Text>
          </Flex>

          {/* Horizontally scrollable table on narrow viewports */}
          <Box overflowX="auto" px={{ base: 3, md: 4 }} py={{ base: 3, md: 4 }}>
            <Box minW={{ base: '720px', md: 'auto' }}>
              {/* Table header */}
              <Box
                display="grid"
                gridTemplateColumns={gridTemplateColumns}
                gap={2}
                px={3}
                py={2}
                bg={{ base: 'white', _dark: 'gray.800' }}
                borderRadius="lg"
                mb={1}
                boxShadow="0 1px 0 rgba(15, 23, 42, 0.04)"
              >
                <SortableHeader
                  label={t('matchCode')}
                  active={sort.key === 'matchCode'}
                  direction={sort.direction}
                  onClick={() => toggleSort('matchCode')}
                />
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
                <SortableHeader
                  label={t('time')}
                  active={sort.key === 'time'}
                  direction={sort.direction}
                  onClick={() => toggleSort('time')}
                />
                <Text fontSize="xs" fontWeight="semibold" color="gray.500">
                  {t('court')}
                </Text>
                {onEditMatch && <Box />}
                {onDeleteMatch && <Box />}
              </Box>

              {/* Match rows */}
              <VStack gap={0} align="stretch">
                {catMatches.map((match) => (
                  <Box
                    key={match.id}
                    display="grid"
                    gridTemplateColumns={gridTemplateColumns}
                    gap={2}
                    px={3}
                    py={3}
                    borderBottomWidth="1px"
                    borderColor="green.50"
                    borderRadius="md"
                    _hover={{
                      bg: {
                        base: 'rgba(236, 253, 245, 0.72)',
                        _dark: 'rgba(6, 78, 59, 0.32)',
                      },
                    }}
                    alignItems="center"
                  >
                    <Text fontSize="sm" color="gray.500">
                      {getMatchDisplayCode(match)}
                    </Text>
                    <Text fontSize="xs" color="gray.600" fontWeight="medium">
                      {getRoundLabel(match.round)}
                    </Text>
                    <Text fontSize="sm" fontWeight="medium" textAlign="right">
                      {renderTeamName(match, 1, category)}
                    </Text>
                    <Flex justify="center" align="center">
                      <Text fontSize="xs" color="gray.400" fontWeight="bold">
                        VS
                      </Text>
                    </Flex>
                    <Text fontSize="sm" fontWeight="medium" textAlign="left">
                      {renderTeamName(match, 2, category)}
                    </Text>
                    <Text
                      fontSize="sm"
                      color={match.startTime ? 'gray.700' : 'gray.400'}
                      whiteSpace="nowrap"
                    >
                      {match.startTime ? formatMatchTime(match) : t('noTime')}
                    </Text>
                    <Text
                      fontSize="sm"
                      color={match.courtId ? 'gray.700' : 'gray.400'}
                      whiteSpace="nowrap"
                    >
                      {match.courtId
                        ? getCourtLabel(match.courtId)
                        : t('noCourt')}
                    </Text>
                    {onEditMatch && (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => onEditMatch(match.id)}
                      >
                        <Edit size={14} />
                      </Button>
                    )}
                    {onDeleteMatch && (
                      <Button
                        variant="ghost"
                        size="xs"
                        color="red.500"
                        _hover={{ bg: 'red.50', color: 'red.600' }}
                        aria-label={t('delete')}
                        onClick={() => onDeleteMatch(match.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </Box>
                ))}
              </VStack>
            </Box>
          </Box>
        </Box>
      ))}
    </VStack>
  );
}

function SortableHeader({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
}) {
  const Icon = active
    ? direction === 'asc'
      ? ArrowUp
      : ArrowDown
    : ChevronsUpDown;

  return (
    <Button
      variant="ghost"
      size="xs"
      justifyContent="flex-start"
      px={0}
      minW={0}
      color={active ? 'green.700' : 'gray.500'}
      fontWeight="semibold"
      onClick={onClick}
      _dark={{ color: active ? 'green.200' : 'gray.400' }}
    >
      <Text as="span" fontSize="xs">
        {label}
      </Text>
      <Icon size={13} />
    </Button>
  );
}

function sortMatches(
  matches: CategoryMatch[],
  sort: { key: SortKey; direction: SortDirection }
) {
  const direction = sort.direction === 'asc' ? 1 : -1;

  return [...matches].sort((a, b) => {
    const primary =
      sort.key === 'matchCode'
        ? compareMatchCode(a, b)
        : compareMatchTime(a, b);
    if (primary !== 0) return primary * direction;
    return a.matchNumber - b.matchNumber;
  });
}

function compareMatchCode(a: CategoryMatch, b: CategoryMatch) {
  return getMatchDisplayCode(a).localeCompare(
    getMatchDisplayCode(b),
    undefined,
    {
      numeric: true,
      sensitivity: 'base',
    }
  );
}

function compareMatchTime(a: CategoryMatch, b: CategoryMatch) {
  const aTime = a.startTime
    ? new Date(a.startTime).getTime()
    : Number.MAX_SAFE_INTEGER;
  const bTime = b.startTime
    ? new Date(b.startTime).getTime()
    : Number.MAX_SAFE_INTEGER;
  if (aTime !== bTime) return aTime - bTime;

  const aEnd = a.estimatedEndTime ?? a.endTime;
  const bEnd = b.estimatedEndTime ?? b.endTime;
  const aEndTime = aEnd ? new Date(aEnd).getTime() : Number.MAX_SAFE_INTEGER;
  const bEndTime = bEnd ? new Date(bEnd).getTime() : Number.MAX_SAFE_INTEGER;
  return aEndTime - bEndTime;
}
