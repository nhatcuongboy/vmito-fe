'use client';

import { Box, Flex, Text, Badge } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { ScoreboardMatch, SportType } from '@/lib/api/types';
import { getRoundDisplayLabel } from '@/lib/tournament/roundLabel';
import { formatCourtLabel } from '@/components/tournament/manage/panels/ResultsPanel';

interface Props {
  match: ScoreboardMatch;
  /** Larger typography when few matches are shown. */
  density: 'comfortable' | 'compact';
  showFullNames: boolean;
}

const STATUS_COLOR: Record<string, string> = {
  IN_PROGRESS: 'green',
  SCHEDULED: 'blue',
  FINISHED: 'gray',
  CANCELLED: 'red',
};

export default function LiveMatchCard({
  match,
  density,
  showFullNames,
}: Props) {
  const t = useTranslations('pages.tournaments.scoreboard');
  const tRounds = useTranslations('pages.tournaments.scoreboard.rounds');

  const s1 = match.currentSet?.side1 ?? 0;
  const s2 = match.currentSet?.side2 ?? 0;
  const winning1 = match.isComplete
    ? match.pendingWinnerId === match.side1.registrationId
    : s1 > s2;
  const winning2 = match.isComplete
    ? match.pendingWinnerId === match.side2.registrationId
    : s2 > s1;
  const showPickleballServer =
    match.sportType === SportType.PICKLEBALL &&
    (match.isDoubles === true || (match.teamSize ?? 0) >= 2) &&
    match.servingSide != null &&
    match.serverNumber != null;

  const scoreFont =
    density === 'comfortable'
      ? { base: '5xl', md: '8xl' }
      : { base: '4xl', md: '6xl' };
  const nameFont = density === 'comfortable' ? 'xl' : 'md';
  const side1Name =
    showFullNames && match.side1.players.length > 0
      ? match.side1.players.join(' / ')
      : match.side1.name;
  const side2Name =
    showFullNames && match.side2.players.length > 0
      ? match.side2.players.join(' / ')
      : match.side2.name;

  return (
    <Flex
      direction="column"
      bg="gray.900"
      borderWidth="1px"
      borderColor="gray.700"
      borderRadius="2xl"
      overflow="hidden"
      h="full"
    >
      {/* Header */}
      <Flex
        align="center"
        justify="space-between"
        px={4}
        py={2}
        bg="gray.800"
        flexShrink={0}
      >
        <Flex align="center" gap={2}>
          {match.court && (
            <Badge colorPalette="blue" fontSize="sm">
              {formatCourtLabel(match.court, t('court'))}
            </Badge>
          )}
          <Text fontSize="sm" color="gray.400" truncate>
            {match.categoryName} · {getRoundDisplayLabel(match.round, tRounds)}
          </Text>
        </Flex>
        <Badge
          colorPalette={STATUS_COLOR[match.status] ?? 'gray'}
          fontSize="xs"
        >
          {match.status === 'IN_PROGRESS'
            ? t('live')
            : match.status === 'FINISHED'
              ? t('final')
              : match.status}
        </Badge>
      </Flex>

      {/* Sides */}
      <Box flex="1">
        <SideRow
          name={side1Name}
          score={s1}
          setWins={match.setWins.side1}
          serverNumber={
            showPickleballServer && match.servingSide === 1
              ? match.serverNumber
              : null
          }
          highlight={winning1}
          scoreFont={scoreFont}
          nameFont={nameFont}
          allowWrap={showFullNames}
        />
        <Box h="1px" bg="gray.700" />
        <SideRow
          name={side2Name}
          score={s2}
          setWins={match.setWins.side2}
          serverNumber={
            showPickleballServer && match.servingSide === 2
              ? match.serverNumber
              : null
          }
          highlight={winning2}
          scoreFont={scoreFont}
          nameFont={nameFont}
          allowWrap={showFullNames}
        />
      </Box>

      {/* Set history */}
      {match.sets.length > 0 && (
        <Flex
          gap={2}
          px={4}
          py={2}
          bg="gray.800"
          wrap="wrap"
          flexShrink={0}
          justify="center"
        >
          {match.sets.map((set, i) => (
            <Text
              key={i}
              fontSize="sm"
              color="gray.400"
              fontVariantNumeric="tabular-nums"
            >
              {set.player1Score}-{set.player2Score}
            </Text>
          ))}
        </Flex>
      )}
    </Flex>
  );
}

interface SideRowProps {
  name: string;
  score: number;
  setWins: number;
  serverNumber?: 1 | 2 | null;
  highlight: boolean;
  scoreFont: { base: string; md: string };
  nameFont: string;
  allowWrap: boolean;
}

function SideRow({
  name,
  score,
  setWins,
  serverNumber,
  highlight,
  scoreFont,
  nameFont,
  allowWrap,
}: SideRowProps) {
  return (
    <Flex align="center" justify="space-between" px={5} py={4} h="50%">
      <Flex direction="column" minW={0} flex="1">
        <Text
          fontSize={nameFont}
          fontWeight="bold"
          color={highlight ? 'white' : 'gray.300'}
          lineClamp={allowWrap ? 2 : 1}
        >
          {name}
        </Text>
        <Text fontSize="xs" color="gray.500">
          {setWins} {setWins === 1 ? 'set' : 'sets'}
        </Text>
      </Flex>
      <Flex align="center" gap={3} flexShrink={0}>
        {serverNumber && <ServerDots count={serverNumber} />}
        <Text
          fontSize={scoreFont}
          fontWeight="black"
          lineHeight={1}
          color={highlight ? 'green.300' : 'gray.100'}
          fontVariantNumeric="tabular-nums"
        >
          {score}
        </Text>
      </Flex>
    </Flex>
  );
}

function ServerDots({ count }: { count: 1 | 2 }) {
  return (
    <Flex gap={2} align="center" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <Box
          key={index}
          w={{ base: 3, md: 4 }}
          h={{ base: 3, md: 4 }}
          borderRadius="full"
          bg="white"
          boxShadow="0 0 10px rgba(255, 255, 255, 0.55)"
        />
      ))}
    </Flex>
  );
}
