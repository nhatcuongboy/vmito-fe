'use client';

import { useMemo } from 'react';
import { Badge, Box, Flex, Text } from '@chakra-ui/react';
import { Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Category, CategoryMatch, MatchStatus } from '@/lib/api/types';
import { getRegistrationLabel } from '@/lib/tournament/teamLabel';
import { usePlayoffSlotLabels } from '@/lib/tournament/usePlayoffSlotLabels';

interface PublicDoubleEliminationBracketProps {
  matches: CategoryMatch[];
  category: Category;
  showPlayerNames?: boolean;
  t: ReturnType<typeof useTranslations>;
}

interface BracketDisplayMatch {
  id: string;
  matchNumber: number;
  status: MatchStatus;
  score?: string;
  side1Label: string;
  side2Label: string;
  winnerPosition?: number;
  isFinished: boolean;
}

interface BracketColumn {
  key: string;
  label: string;
  items: BracketDisplayMatch[];
}

// Upper-bracket round codes are "UB-<RoundName>" (e.g. UB-R16, UB-QF, UB-SF,
// UB-F). This drives their left-to-right column order.
const UPPER_ROUND_ORDER = ['R128', 'R64', 'R32', 'R16', 'QF', 'SF', 'F'];

function getUpperRoundLabel(
  round: string,
  t: ReturnType<typeof useTranslations>
): string {
  const code = round.replace(/^UB-/, '').toUpperCase();
  if (code === 'F') return t('playoffsRounds.semiFinals');
  if (code === 'SF') return t('playoffsRounds.quarterFinals');
  if (code === 'QF') return t('deBracket.preQuarterFinals');
  // R16 / R32 ... fall back to a generic "Round of N".
  const size = Number(code.replace('R', ''));
  return Number.isFinite(size)
    ? t('deBracket.roundOf', { count: size })
    : round;
}

function getLowerRoundLabel(
  round: string,
  index: number,
  t: ReturnType<typeof useTranslations>
): string {
  if (round.toUpperCase() === 'LB-F') return t('deBracket.lowerFinal');
  return t('deBracket.lowerRound', { number: index + 1 });
}

function getWinnerPosition(match: CategoryMatch): number | undefined {
  if (!match.winnerId || match.isDraw) return undefined;
  return match.participants?.find(
    (participant) => participant.categoryRegistrationId === match.winnerId
  )?.position;
}

export default function PublicDoubleEliminationBracket({
  matches,
  category,
  showPlayerNames = false,
  t,
}: PublicDoubleEliminationBracketProps) {
  void category;
  const labels = usePlayoffSlotLabels();

  const { upperColumns, lowerColumns, finalColumn } = useMemo(() => {
    // Reverse feeder lookup: which match (and as winner/loser) feeds a given
    // target match's slot. Lets shell matches read "Winner of 7" / "Loser of 4"
    // exactly like the seeded bracket preview.
    const feederBySlot = new Map<string, { winner?: number; loser?: number }>();
    const keyOf = (matchId: string, slot: number) => `${matchId}:${slot}`;
    for (const feeder of matches) {
      if (feeder.winnerNextMatchId && feeder.winnerNextSlot) {
        const key = keyOf(feeder.winnerNextMatchId, feeder.winnerNextSlot);
        const entry = feederBySlot.get(key) ?? {};
        entry.winner = feeder.matchNumber;
        feederBySlot.set(key, entry);
      }
      if (feeder.loserNextMatchId && feeder.loserNextSlot) {
        const key = keyOf(feeder.loserNextMatchId, feeder.loserNextSlot);
        const entry = feederBySlot.get(key) ?? {};
        entry.loser = feeder.matchNumber;
        feederBySlot.set(key, entry);
      }
    }

    const sideLabel = (match: CategoryMatch, position: 1 | 2): string => {
      const participant = match.participants?.find(
        (p) => p.position === position
      );
      if (participant?.categoryRegistration) {
        return getRegistrationLabel(participant.categoryRegistration, {
          showPlayerNames,
        });
      }
      const feeder = feederBySlot.get(keyOf(match.id, position));
      if (feeder?.winner !== undefined) return labels.winnerOf(feeder.winner);
      if (feeder?.loser !== undefined) return labels.loserOf(feeder.loser);
      return labels.tbd();
    };

    const toDisplay = (match: CategoryMatch): BracketDisplayMatch => ({
      id: match.id,
      matchNumber: match.matchNumber,
      status: match.status,
      score: match.score,
      side1Label: sideLabel(match, 1),
      side2Label: sideLabel(match, 2),
      winnerPosition: getWinnerPosition(match),
      isFinished: match.status === MatchStatus.FINISHED,
    });

    const upper = matches.filter((m) => m.bracketType === 'UPPER');
    const lower = matches.filter((m) => m.bracketType === 'LOWER');
    const finals = matches
      .filter((m) => m.bracketType === 'GF')
      .sort((a, b) => a.matchNumber - b.matchNumber);

    // Group upper rounds by their UB-<code> round, ordered earliest → final.
    const upperByRound = new Map<string, CategoryMatch[]>();
    for (const m of upper) {
      const key = m.round.toUpperCase();
      if (!upperByRound.has(key)) upperByRound.set(key, []);
      upperByRound.get(key)!.push(m);
    }
    const upperOrder = (round: string) => {
      const code = round.replace(/^UB-/, '').toUpperCase();
      const idx = UPPER_ROUND_ORDER.indexOf(code);
      return idx === -1 ? UPPER_ROUND_ORDER.length : idx;
    };
    const upperColumns: BracketColumn[] = Array.from(upperByRound.keys())
      .sort((a, b) => upperOrder(a) - upperOrder(b))
      .map((round) => ({
        key: round,
        label: getUpperRoundLabel(round, t),
        items: [...upperByRound.get(round)!]
          .sort((a, b) => a.matchNumber - b.matchNumber)
          .map(toDisplay),
      }));

    // Lower rounds: order by the lowest matchNumber in each round (generation
    // order already follows LB-1, LB-2, …, LB-F).
    const lowerByRound = new Map<string, CategoryMatch[]>();
    for (const m of lower) {
      const key = m.round.toUpperCase();
      if (!lowerByRound.has(key)) lowerByRound.set(key, []);
      lowerByRound.get(key)!.push(m);
    }
    const lowerKeys = Array.from(lowerByRound.keys()).sort((a, b) => {
      const minA = Math.min(...lowerByRound.get(a)!.map((m) => m.matchNumber));
      const minB = Math.min(...lowerByRound.get(b)!.map((m) => m.matchNumber));
      return minA - minB;
    });
    const lowerColumns: BracketColumn[] = lowerKeys.map((round, index) => ({
      key: round,
      label: getLowerRoundLabel(round, index, t),
      items: [...lowerByRound.get(round)!]
        .sort((a, b) => a.matchNumber - b.matchNumber)
        .map(toDisplay),
    }));

    const finalColumn: BracketColumn | null =
      finals.length > 0
        ? {
            key: 'GF',
            label: t('deBracket.grandFinal'),
            items: finals.map((m, index) => {
              const display = toDisplay(m);
              return {
                ...display,
                // Tag the reset game so its header reads differently.
                matchNumber: display.matchNumber,
                _isReset: index > 0,
              } as BracketDisplayMatch;
            }),
          }
        : null;

    return { upperColumns, lowerColumns, finalColumn };
  }, [matches, labels, showPlayerNames, t]);

  if (upperColumns.length === 0 && lowerColumns.length === 0) {
    return (
      <Text color="gray.500" fontSize="sm" _dark={{ color: 'gray.400' }}>
        {t('emptyPlayoffs')}
      </Text>
    );
  }

  return (
    <Box overflowX="auto" pb={2}>
      <Flex direction="column" gap={6} minW="fit-content">
        {/* Upper bracket */}
        <BracketSection
          sectionLabel={t('deBracket.upperBracket')}
          columns={upperColumns}
          trailingColumn={finalColumn}
          t={t}
        />

        {/* Lower bracket */}
        {lowerColumns.length > 0 && (
          <BracketSection
            sectionLabel={t('deBracket.lowerBracket')}
            columns={lowerColumns}
            t={t}
          />
        )}
      </Flex>
    </Box>
  );
}

function BracketSection({
  sectionLabel,
  columns,
  trailingColumn,
  t,
}: {
  sectionLabel: string;
  columns: BracketColumn[];
  trailingColumn?: BracketColumn | null;
  t: ReturnType<typeof useTranslations>;
}) {
  const allColumns = trailingColumn ? [...columns, trailingColumn] : columns;

  return (
    <Box>
      <Text
        fontSize="xs"
        fontWeight="800"
        textTransform="uppercase"
        letterSpacing="0.06em"
        color="gray.400"
        mb={2}
        _dark={{ color: 'gray.500' }}
      >
        {sectionLabel}
      </Text>
      <Flex gap={{ base: 4, md: 6 }} align="stretch" minW="fit-content">
        {allColumns.map((column) => (
          <Flex
            key={column.key}
            direction="column"
            gap={3}
            minW={{ base: '180px', md: '210px' }}
          >
            <Text
              fontSize="xs"
              fontWeight="700"
              textTransform="uppercase"
              letterSpacing="0.04em"
              color="gray.500"
              textAlign="center"
              _dark={{ color: 'gray.400' }}
            >
              {column.label}
            </Text>
            <Flex direction="column" justify="center" gap={3} flex="1">
              {column.items.map((match) => (
                <BracketMatchCard key={match.id} match={match} t={t} />
              ))}
            </Flex>
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
  match: BracketDisplayMatch & { _isReset?: boolean };
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
        <Badge
          colorPalette={match._isReset ? 'orange' : 'gray'}
          size="sm"
          borderRadius="full"
        >
          {match._isReset
            ? t('deBracket.ifNecessary')
            : t('matchNumber', { number: match.matchNumber })}
        </Badge>
        {match.score ? (
          <Text
            fontSize="xs"
            fontWeight="700"
            color="gray.600"
            _dark={{ color: 'gray.300' }}
          >
            {match.score}
          </Text>
        ) : (
          <Text fontSize="2xs" color="gray.400" _dark={{ color: 'gray.500' }}>
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
      {isWinner && (
        <Box
          as="span"
          flexShrink={0}
          color="yellow.500"
          _dark={{ color: 'yellow.400' }}
        >
          <Trophy size={16} fill="currentColor" />
        </Box>
      )}
    </Flex>
  );
}
