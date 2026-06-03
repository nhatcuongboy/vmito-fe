'use client';

import { useMemo } from 'react';
import { Badge, Box, Flex, Text } from '@chakra-ui/react';
import { Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  Category,
  CategoryFormat,
  CategoryMatch,
  MatchStatus,
} from '@/lib/api/types';
import { getTeamLabel } from '@/lib/tournament/teamLabel';

interface PublicTournamentBracketProps {
  // Playoff (elimination) matches of a single category.
  matches: CategoryMatch[];
  category: Category;
  groupStageMatchCount?: number;
  t: ReturnType<typeof useTranslations>;
}

interface BracketDisplayMatch {
  id: string;
  round: string;
  matchNumber: number;
  status: MatchStatus;
  score?: string;
  side1Label: string;
  side2Label: string;
  winnerPosition?: number;
  isFinished: boolean;
}

// Left-to-right column order of an elimination bracket. The 3rd-place match is
// rendered as a trailing column (handled separately).
const ROUND_ORDER = ['R128', 'R64', 'R32', 'R16', 'QF', 'SF', 'F'];
const THIRD_PLACE_ROUND = '3RD';
const POOL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

function getRoundLabel(round: string, t: ReturnType<typeof useTranslations>) {
  const normalized = round.toUpperCase();
  if (normalized === 'F') return t('playoffsRounds.final');
  if (normalized === 'SF') return t('playoffsRounds.semiFinals');
  if (normalized === 'QF') return t('playoffsRounds.quarterFinals');
  if (normalized === THIRD_PLACE_ROUND) return t('playoffsRounds.thirdPlace');
  return round;
}

function nextPowerOf2(n: number): number {
  let power = 1;
  while (power < n) power *= 2;
  return power;
}

function getRoundCode(roundIndex: number, totalRounds: number): string {
  const fromFinal = totalRounds - 1 - roundIndex;
  if (fromFinal === 0) return 'F';
  if (fromFinal === 1) return 'SF';
  if (fromFinal === 2) return 'QF';
  return `R${2 ** (fromFinal + 1)}`;
}

function getOrdinalLabel(rank: number, t: ReturnType<typeof useTranslations>) {
  const oneBased = rank + 1;
  const key = oneBased >= 1 && oneBased <= 8 ? String(oneBased) : 'other';
  return t(`ordinals.${key}`, { rank: oneBased });
}

function generateAdvancingSlots(
  groupCount: number,
  winnersPerGroup: number,
  t: ReturnType<typeof useTranslations>
): string[] {
  const slots: string[] = [];
  for (let rank = 0; rank < winnersPerGroup; rank++) {
    for (let groupIndex = 0; groupIndex < groupCount; groupIndex++) {
      slots.push(
        t('nthPoolLabel', {
          rank: getOrdinalLabel(rank, t),
          pool: POOL_LABELS[groupIndex] ?? String(groupIndex + 1),
        })
      );
    }
  }
  return slots;
}

function generateStandardSeeding(bracketSize: number): number[] {
  if (bracketSize === 1) return [1];
  const half = generateStandardSeeding(bracketSize / 2);
  const result: number[] = [];
  for (const seed of half) {
    result.push(seed);
    result.push(bracketSize + 1 - seed);
  }
  return result;
}

function computeDefaultSlots(
  groupCount: number,
  winnersPerGroup: number,
  t: ReturnType<typeof useTranslations>
): string[] {
  const advancingSlots = generateAdvancingSlots(groupCount, winnersPerGroup, t);
  if (advancingSlots.length < 2) return [];

  const bracketSize = nextPowerOf2(advancingSlots.length);
  const seedOrder = generateStandardSeeding(bracketSize);
  const slots = new Array<string>(bracketSize).fill('');

  for (let position = 0; position < bracketSize; position++) {
    const seed = seedOrder[position];
    slots[position] =
      seed <= advancingSlots.length ? advancingSlots[seed - 1] : '';
  }

  return slots;
}

function resolveConfiguredSlots(
  category: Category,
  groupCount: number,
  winnersPerGroup: number,
  t: ReturnType<typeof useTranslations>
): string[] {
  const defaultSlots = computeDefaultSlots(groupCount, winnersPerGroup, t);
  const config = category.formatConfig as Record<string, unknown> | undefined;
  const playoffs = config?.playoffs as Record<string, unknown> | undefined;
  const singleElimination = config?.singleElimination as
    | Record<string, unknown>
    | undefined;
  const customSlots =
    category.format === CategoryFormat.SINGLE_ELIMINATION
      ? (singleElimination?.seedOrder as string[] | undefined)
      : (playoffs?.seedOrder as string[] | undefined);

  if (!customSlots?.length) return defaultSlots;
  if (category.format === CategoryFormat.SINGLE_ELIMINATION) return customSlots;

  const validSlots = new Set(
    generateAdvancingSlots(groupCount, winnersPerGroup, t)
  );
  const hasStaleSlot = customSlots.some(
    (slot) => slot && !validSlots.has(slot)
  );
  return hasStaleSlot || customSlots.length !== defaultSlots.length
    ? defaultSlots
    : customSlots;
}

function getWinnerPosition(match: CategoryMatch): number | undefined {
  if (!match.winnerId || match.isDraw) return undefined;
  return match.participants?.find(
    (participant) => participant.categoryRegistrationId === match.winnerId
  )?.position;
}

function toDisplayMatch(match: CategoryMatch): BracketDisplayMatch {
  return {
    id: match.id,
    round: match.round,
    matchNumber: match.matchNumber,
    status: match.status,
    score: match.score,
    side1Label: getTeamLabel(match, 1),
    side2Label: getTeamLabel(match, 2),
    winnerPosition: getWinnerPosition(match),
    isFinished: match.status === MatchStatus.FINISHED,
  };
}

function buildPreviewMatches({
  category,
  groupStageMatchCount,
  t,
}: {
  category: Category;
  groupStageMatchCount: number;
  t: ReturnType<typeof useTranslations>;
}): BracketDisplayMatch[] {
  const isSingleElimination =
    category.format === CategoryFormat.SINGLE_ELIMINATION;
  const groupCount = isSingleElimination ? 1 : (category.groupCount ?? 0);
  const winnersPerGroup = isSingleElimination
    ? (category._count?.registrations ?? category.registrations?.length ?? 0)
    : (category.winnersPerGroup ?? 0);
  const teamCount = groupCount * winnersPerGroup;
  const bracketSize = nextPowerOf2(teamCount);

  if (bracketSize < 2) return [];

  const totalRounds = Math.log2(bracketSize);
  const roundMatchNumbers: number[][] = [];
  let matchNumber = isSingleElimination ? 1 : groupStageMatchCount + 1;

  for (let roundIndex = 0; roundIndex < totalRounds; roundIndex++) {
    const matchCount = bracketSize / 2 ** (roundIndex + 1);
    const numbers: number[] = [];
    for (let index = 0; index < matchCount; index++) {
      numbers.push(matchNumber++);
    }
    roundMatchNumbers.push(numbers);
  }

  const slots = resolveConfiguredSlots(
    category,
    groupCount,
    winnersPerGroup,
    t
  );
  const previewMatches: BracketDisplayMatch[] = [];

  for (let roundIndex = 0; roundIndex < totalRounds; roundIndex++) {
    const currentRound = roundMatchNumbers[roundIndex] ?? [];
    const previousRound = roundMatchNumbers[roundIndex - 1] ?? [];

    for (let index = 0; index < currentRound.length; index++) {
      const side1Label =
        roundIndex === 0
          ? slots[index * 2] || t('bye')
          : t('winnerOf', { match: previousRound[index * 2] });
      const side2Label =
        roundIndex === 0
          ? slots[index * 2 + 1] || t('bye')
          : t('winnerOf', { match: previousRound[index * 2 + 1] });

      previewMatches.push({
        id: `preview-${currentRound[index]}`,
        round: getRoundCode(roundIndex, totalRounds),
        matchNumber: currentRound[index],
        status: MatchStatus.SCHEDULED,
        side1Label,
        side2Label,
        isFinished: false,
      });
    }
  }

  const semiFinalNumbers = roundMatchNumbers[totalRounds - 2];
  if (category.thirdPlaceMatch && semiFinalNumbers?.length === 2) {
    previewMatches.push({
      id: `preview-${matchNumber}`,
      round: THIRD_PLACE_ROUND,
      matchNumber,
      status: MatchStatus.SCHEDULED,
      side1Label: t('loserOf', { match: semiFinalNumbers[0] }),
      side2Label: t('loserOf', { match: semiFinalNumbers[1] }),
      isFinished: false,
    });
  }

  return previewMatches;
}

export default function PublicTournamentBracket({
  matches,
  category,
  groupStageMatchCount = 0,
  t,
}: PublicTournamentBracketProps) {
  const displayMatches = useMemo(() => {
    if (matches.length > 0) return matches.map(toDisplayMatch);
    return buildPreviewMatches({ category, groupStageMatchCount, t });
  }, [category, groupStageMatchCount, matches, t]);

  const columns = useMemo(() => {
    const byRound = new Map<string, BracketDisplayMatch[]>();
    for (const match of displayMatches) {
      const key = match.round.toUpperCase();
      if (!byRound.has(key)) byRound.set(key, []);
      byRound.get(key)!.push(match);
    }

    const orderOf = (round: string) => {
      const index = ROUND_ORDER.indexOf(round);
      return index === -1 ? ROUND_ORDER.length : index;
    };

    const mainRounds = Array.from(byRound.keys())
      .filter((round) => round !== THIRD_PLACE_ROUND)
      .sort((first, second) => orderOf(first) - orderOf(second));

    const ordered = byRound.has(THIRD_PLACE_ROUND)
      ? [...mainRounds, THIRD_PLACE_ROUND]
      : mainRounds;

    return ordered.map((round) => ({
      round,
      label: getRoundLabel(round, t),
      items: [...(byRound.get(round) ?? [])].sort(
        (first, second) => first.matchNumber - second.matchNumber
      ),
    }));
  }, [displayMatches, t]);

  if (columns.length === 0) {
    return (
      <Text color="gray.500" fontSize="sm">
        {t('emptyPlayoffs')}
      </Text>
    );
  }

  return (
    <Box overflowX="auto" pb={2}>
      <Flex gap={{ base: 4, md: 6 }} align="stretch" minW="fit-content">
        {columns.map((column) => (
          <Flex
            key={column.round}
            direction="column"
            justify="space-around"
            gap={3}
            minW={{ base: '190px', md: '220px' }}
          >
            <Text
              fontSize="xs"
              fontWeight="700"
              textTransform="uppercase"
              letterSpacing="0.04em"
              color="gray.500"
              _dark={{ color: 'gray.400' }}
              mb={1}
            >
              {column.label}
            </Text>
            {column.items.map((match) => (
              <BracketMatchCard key={match.id} match={match} t={t} />
            ))}
          </Flex>
        ))}
      </Flex>
    </Box>
  );
}

function BracketMatchCard({
  match,
  t,
}: {
  match: BracketDisplayMatch;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <Box
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="lg"
      bg="white"
      boxShadow="0 1px 2px rgba(15, 23, 42, 0.06)"
      overflow="hidden"
      _dark={{ bg: 'gray.900', borderColor: 'gray.700' }}
    >
      <Flex align="center" justify="space-between" px={2.5} pt={2} pb={1}>
        <Badge colorPalette="gray" size="sm" borderRadius="full">
          {t('matchNumber', { number: match.matchNumber })}
        </Badge>
        {match.score ? (
          <Text fontSize="xs" fontWeight="700" color="gray.600">
            {match.score}
          </Text>
        ) : (
          <Text fontSize="2xs" color="gray.400">
            {t(`matchStatus.${match.status}`)}
          </Text>
        )}
      </Flex>

      <BracketSide
        label={match.side1Label}
        isWinner={match.isFinished && match.winnerPosition === 1}
        isDecided={match.isFinished}
      />
      <Box h="1px" bg="gray.100" _dark={{ bg: 'gray.700' }} />
      <BracketSide
        label={match.side2Label}
        isWinner={match.isFinished && match.winnerPosition === 2}
        isDecided={match.isFinished}
      />
    </Box>
  );
}

function BracketSide({
  label,
  isWinner,
  isDecided,
}: {
  label: string;
  isWinner: boolean;
  isDecided: boolean;
}) {
  return (
    <Flex
      align="center"
      gap={1.5}
      px={2.5}
      py={2}
      bg={isWinner ? 'green.50' : 'transparent'}
      _dark={{ bg: isWinner ? 'green.900' : 'transparent' }}
    >
      <Text
        flex="1"
        minW={0}
        fontSize="sm"
        fontWeight={isWinner ? '800' : '500'}
        color={isWinner ? 'green.800' : isDecided ? 'gray.400' : 'gray.700'}
        overflow="hidden"
        textOverflow="ellipsis"
        whiteSpace="nowrap"
        _dark={{
          color: isWinner ? 'green.200' : isDecided ? 'gray.500' : 'gray.200',
        }}
      >
        {label}
      </Text>
      {isWinner && <Trophy size={13} color="var(--chakra-colors-green-600)" />}
    </Flex>
  );
}
