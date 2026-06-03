'use client';

import { useMemo } from 'react';
import { Badge, Box, Flex, Text } from '@chakra-ui/react';
import { Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { CategoryMatch, MatchStatus } from '@/lib/api/types';
import { getTeamLabel } from '@/lib/tournament/teamLabel';

interface PublicTournamentBracketProps {
  // Playoff (elimination) matches of a single category.
  matches: CategoryMatch[];
  t: ReturnType<typeof useTranslations>;
}

// Left-to-right column order of an elimination bracket. The 3rd-place match is
// rendered as a trailing column (handled separately).
const ROUND_ORDER = ['R128', 'R64', 'R32', 'R16', 'QF', 'SF', 'F'];
const THIRD_PLACE_ROUND = '3RD';

function getRoundLabel(round: string, t: ReturnType<typeof useTranslations>) {
  const normalized = round.toUpperCase();
  if (normalized === 'F') return t('playoffsRounds.final');
  if (normalized === 'SF') return t('playoffsRounds.semiFinals');
  if (normalized === 'QF') return t('playoffsRounds.quarterFinals');
  if (normalized === THIRD_PLACE_ROUND) return t('playoffsRounds.thirdPlace');
  return round;
}

function getWinnerPosition(match: CategoryMatch): number | undefined {
  if (!match.winnerId || match.isDraw) return undefined;
  return match.participants?.find(
    (participant) => participant.categoryRegistrationId === match.winnerId
  )?.position;
}

export default function PublicTournamentBracket({
  matches,
  t,
}: PublicTournamentBracketProps) {
  const columns = useMemo(() => {
    const byRound = new Map<string, CategoryMatch[]>();
    for (const match of matches) {
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
  }, [matches, t]);

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
  match: CategoryMatch;
  t: ReturnType<typeof useTranslations>;
}) {
  const winnerPosition = getWinnerPosition(match);
  const isFinished = match.status === MatchStatus.FINISHED;

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
        label={getTeamLabel(match, 1)}
        isWinner={isFinished && winnerPosition === 1}
        isDecided={isFinished}
      />
      <Box h="1px" bg="gray.100" _dark={{ bg: 'gray.700' }} />
      <BracketSide
        label={getTeamLabel(match, 2)}
        isWinner={isFinished && winnerPosition === 2}
        isDecided={isFinished}
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
