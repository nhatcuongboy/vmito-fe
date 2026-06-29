'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Box, Flex, Text } from '@chakra-ui/react';
import { Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  Category,
  CategoryFormat,
  CategoryMatch,
  MatchStatus,
} from '@/lib/api/types';
import {
  ROUND_ORDER,
  THIRD_PLACE_ROUND,
  getRoundCode,
  nextPowerOf2,
  resolveConfiguredSlots,
  resolveMatchSideLabel,
  type SlotLabels,
} from '@/lib/tournament/bracketSlots';
import { usePlayoffSlotLabels } from '@/lib/tournament/usePlayoffSlotLabels';

interface PublicTournamentBracketProps {
  // Playoff (elimination) matches of a single category.
  matches: CategoryMatch[];
  category: Category;
  groupStageMatchCount?: number;
  showPlayerNames?: boolean;
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

function toDisplayMatch(
  match: CategoryMatch,
  allMatches: CategoryMatch[],
  category: Category,
  labels: SlotLabels,
  showPlayerNames: boolean
): BracketDisplayMatch {
  return {
    id: match.id,
    round: match.round,
    matchNumber: match.matchNumber,
    status: match.status,
    score: match.score,
    side1Label: resolveMatchSideLabel(match, 1, {
      allMatches,
      category,
      labels,
      showPlayerNames,
    }),
    side2Label: resolveMatchSideLabel(match, 2, {
      allMatches,
      category,
      labels,
      showPlayerNames,
    }),
    winnerPosition: getWinnerPosition(match),
    isFinished: match.status === MatchStatus.FINISHED,
  };
}

function buildPreviewMatches({
  category,
  groupStageMatchCount,
  labels,
}: {
  category: Category;
  groupStageMatchCount: number;
  labels: SlotLabels;
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
    labels
  );
  const previewMatches: BracketDisplayMatch[] = [];

  for (let roundIndex = 0; roundIndex < totalRounds; roundIndex++) {
    const currentRound = roundMatchNumbers[roundIndex] ?? [];
    const previousRound = roundMatchNumbers[roundIndex - 1] ?? [];

    for (let index = 0; index < currentRound.length; index++) {
      const side1Label =
        roundIndex === 0
          ? slots[index * 2] || labels.bye()
          : labels.winnerOf(previousRound[index * 2]);
      const side2Label =
        roundIndex === 0
          ? slots[index * 2 + 1] || labels.bye()
          : labels.winnerOf(previousRound[index * 2 + 1]);

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
      side1Label: labels.loserOf(semiFinalNumbers[0]),
      side2Label: labels.loserOf(semiFinalNumbers[1]),
      isFinished: false,
    });
  }

  return previewMatches;
}

export default function PublicTournamentBracket({
  matches,
  category,
  groupStageMatchCount = 0,
  showPlayerNames = false,
  t,
}: PublicTournamentBracketProps) {
  const labels = usePlayoffSlotLabels();
  const displayMatches = useMemo(() => {
    if (matches.length > 0)
      return matches.map((match) =>
        toDisplayMatch(match, matches, category, labels, showPlayerNames)
      );
    return buildPreviewMatches({ category, groupStageMatchCount, labels });
  }, [category, groupStageMatchCount, matches, labels, showPlayerNames]);

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

  // Main bracket columns drive the winner-advancement connectors. The 3rd-place
  // match is a standalone consolation column, so it is excluded from the lines.
  const mainColumns = useMemo(
    () => columns.filter((column) => column.round !== THIRD_PLACE_ROUND),
    [columns]
  );

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [connectors, setConnectors] = useState<string[]>([]);
  const [svgSize, setSvgSize] = useState({ width: 0, height: 0 });

  // Draw an elbow from each feeder match's right edge into the centre of the
  // match it advances to. Positions are measured so the lines stay aligned
  // regardless of card heights or bracket depth.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const computeConnectors = () => {
      const wrapperRect = wrapper.getBoundingClientRect();
      const measure = (id: string) => {
        const el = wrapper.querySelector<HTMLElement>(
          `[data-bracket-match="${id}"]`
        );
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return {
          left: rect.left - wrapperRect.left,
          right: rect.right - wrapperRect.left,
          centerY: rect.top - wrapperRect.top + rect.height / 2,
        };
      };

      const paths: string[] = [];
      for (let ci = 1; ci < mainColumns.length; ci++) {
        const feeders = mainColumns[ci - 1].items;
        const targets = mainColumns[ci].items;
        targets.forEach((target, index) => {
          const targetBox = measure(target.id);
          if (!targetBox) return;
          [feeders[index * 2], feeders[index * 2 + 1]].forEach((feeder) => {
            if (!feeder) return;
            const feederBox = measure(feeder.id);
            if (!feederBox) return;
            const midX = (feederBox.right + targetBox.left) / 2;
            paths.push(
              `M ${feederBox.right} ${feederBox.centerY} H ${midX} V ${targetBox.centerY} H ${targetBox.left}`
            );
          });
        });
      }

      setSvgSize({ width: wrapper.scrollWidth, height: wrapper.scrollHeight });
      setConnectors(paths);
    };

    computeConnectors();
    const observer = new ResizeObserver(computeConnectors);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [mainColumns]);

  if (columns.length === 0) {
    return (
      <Text color="gray.500" fontSize="sm" _dark={{ color: 'gray.400' }}>
        {t('emptyPlayoffs')}
      </Text>
    );
  }

  return (
    <Box overflowX="auto" pb={2}>
      <Box ref={wrapperRef} position="relative" minW="fit-content">
        <svg
          width={svgSize.width}
          height={svgSize.height}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          {connectors.map((path, index) => (
            <path
              key={index}
              d={path}
              fill="none"
              stroke="#CBD5E0"
              strokeWidth={2}
            />
          ))}
        </svg>
        <Flex
          gap={{ base: 4, md: 6 }}
          align="stretch"
          minW="fit-content"
          position="relative"
          zIndex={1}
        >
          {columns.map((column) => (
            <Flex
              key={column.round}
              direction="column"
              gap={3}
              minW={{ base: '190px', md: '220px' }}
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
              <Flex direction="column" flex="1">
                {column.items.map((match) => (
                  <Flex
                    key={match.id}
                    direction="column"
                    justify="center"
                    flex="1"
                    py={1.5}
                  >
                    <BracketMatchCard match={match} t={t} />
                  </Flex>
                ))}
              </Flex>
            </Flex>
          ))}
        </Flex>
      </Box>
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
      data-bracket-match={match.id}
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
      {isWinner && <Trophy size={13} color="var(--chakra-colors-green-600)" />}
    </Flex>
  );
}
