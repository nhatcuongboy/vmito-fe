'use client';

import { Box, Flex, Text, Badge } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { ScoreboardMatch } from '@/lib/api/types';

interface Props {
  match: ScoreboardMatch;
  /** Larger typography when few matches are shown. */
  density: 'comfortable' | 'compact';
}

const STATUS_COLOR: Record<string, string> = {
  IN_PROGRESS: 'green',
  SCHEDULED: 'blue',
  FINISHED: 'gray',
  CANCELLED: 'red',
};

export default function LiveMatchCard({ match, density }: Props) {
  const t = useTranslations('pages.tournaments.scoreboard');

  const s1 = match.currentSet?.side1 ?? 0;
  const s2 = match.currentSet?.side2 ?? 0;
  const winning1 = match.isComplete
    ? match.pendingWinnerId === match.side1.registrationId
    : s1 > s2;
  const winning2 = match.isComplete
    ? match.pendingWinnerId === match.side2.registrationId
    : s2 > s1;

  const scoreFont =
    density === 'comfortable'
      ? { base: '5xl', md: '8xl' }
      : { base: '4xl', md: '6xl' };
  const nameFont = density === 'comfortable' ? 'xl' : 'md';

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
              {t('court')} {match.court.courtNumber}
            </Badge>
          )}
          <Text fontSize="sm" color="gray.400" truncate>
            {match.categoryName} · {match.round}
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
          name={match.side1.name}
          score={s1}
          setWins={match.setWins.side1}
          highlight={winning1}
          scoreFont={scoreFont}
          nameFont={nameFont}
        />
        <Box h="1px" bg="gray.700" />
        <SideRow
          name={match.side2.name}
          score={s2}
          setWins={match.setWins.side2}
          highlight={winning2}
          scoreFont={scoreFont}
          nameFont={nameFont}
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
  highlight: boolean;
  scoreFont: { base: string; md: string };
  nameFont: string;
}

function SideRow({
  name,
  score,
  setWins,
  highlight,
  scoreFont,
  nameFont,
}: SideRowProps) {
  return (
    <Flex align="center" justify="space-between" px={5} py={4} h="50%">
      <Flex direction="column" minW={0} flex="1">
        <Text
          fontSize={nameFont}
          fontWeight="bold"
          color={highlight ? 'white' : 'gray.300'}
          truncate
        >
          {name}
        </Text>
        <Text fontSize="xs" color="gray.500">
          {setWins} {setWins === 1 ? 'set' : 'sets'}
        </Text>
      </Flex>
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
  );
}
