'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';

import { ScoreboardMatch, SportType } from '@/lib/api/types';
import { getRoundDisplayLabel } from '@/lib/tournament/roundLabel';
import { formatCourtLabel } from '@/components/tournament/manage/panels/ResultsPanel';
import type { OverlayOptions } from './overlayOptions';

interface Props {
  match: ScoreboardMatch;
  options: OverlayOptions;
  /** Optional tournament name shown in the title strip. */
  tournamentName?: string | null;
}

const sideLabel = (side: ScoreboardMatch['side1']): string =>
  side.players.length > 0 ? side.players.join(' / ') : side.name;

/**
 * Broadcast "lower-third" scoreboard for embedding in a livestream (OBS browser
 * source). Renders a single match: a title strip, two team rows with the
 * current-game score and set-win pips, pickleball serve dots, and a round strip.
 * Purely presentational — data + live updates are supplied by the parent.
 */
export default function BroadcastOverlay({
  match,
  options,
  tournamentName,
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

  const showServer =
    match.sportType === SportType.PICKLEBALL &&
    (match.isDoubles === true || (match.teamSize ?? 0) >= 2) &&
    match.servingSide != null &&
    match.serverNumber != null;

  const isFinished = match.status === 'FINISHED';
  const roundText = [
    match.categoryName,
    getRoundDisplayLabel(match.round, tRounds),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Flex
      position="fixed"
      left={0}
      right={0}
      {...(options.position === 'top' ? { top: 0 } : { bottom: 0 })}
      justify="center"
      p={{ base: 3, md: 5 }}
      pointerEvents="none"
    >
      <Box
        style={{ transform: `scale(${options.scale})` }}
        transformOrigin={
          options.position === 'top' ? 'top center' : 'bottom center'
        }
        w="full"
        maxW="720px"
        borderRadius="lg"
        overflow="hidden"
        boxShadow="0 8px 30px rgba(0,0,0,0.45)"
        fontFamily="'Arial Narrow', 'Inter', sans-serif"
      >
        {/* Title strip */}
        {options.showTitle && tournamentName && (
          <Flex align="center" justify="center" bg="blue.700" px={4} py={1.5}>
            <Text
              fontSize={{ base: 'sm', md: 'md' }}
              fontWeight="bold"
              letterSpacing="wide"
              textTransform="uppercase"
              color="white"
              truncate
            >
              {tournamentName}
            </Text>
          </Flex>
        )}

        {/* Team rows */}
        <Box bg="rgba(15, 23, 42, 0.94)">
          <SideRow
            name={sideLabel(match.side1)}
            score={s1}
            setWins={match.setWins.side1}
            server={
              showServer && match.servingSide === 1
                ? (match.serverNumber ?? null)
                : null
            }
            highlight={winning1}
          />
          <Box h="2px" bg="blue.600" />
          <SideRow
            name={sideLabel(match.side2)}
            score={s2}
            setWins={match.setWins.side2}
            server={
              showServer && match.servingSide === 2
                ? (match.serverNumber ?? null)
                : null
            }
            highlight={winning2}
          />
        </Box>

        {/* Round / status strip */}
        {options.showRound && (
          <Flex
            align="center"
            justify="space-between"
            bg="blue.700"
            px={4}
            py={1}
          >
            <Text
              fontSize={{ base: 'xs', md: 'sm' }}
              fontWeight="semibold"
              letterSpacing="wide"
              textTransform="uppercase"
              color="whiteAlpha.900"
              truncate
            >
              {roundText}
            </Text>
            <Flex align="center" gap={2} flexShrink={0}>
              {match.court && (
                <Text
                  fontSize={{ base: 'xs', md: 'sm' }}
                  fontWeight="semibold"
                  color="whiteAlpha.800"
                >
                  {formatCourtLabel(match.court, t('court'))}
                </Text>
              )}
              <Text
                fontSize={{ base: 'xs', md: 'sm' }}
                fontWeight="bold"
                color={isFinished ? 'gray.300' : 'red.300'}
              >
                {isFinished ? t('final') : t('live')}
              </Text>
            </Flex>
          </Flex>
        )}
      </Box>
    </Flex>
  );
}

interface SideRowProps {
  name: string;
  score: number;
  setWins: number;
  server: 1 | 2 | null;
  highlight: boolean;
}

function SideRow({ name, score, setWins, server, highlight }: SideRowProps) {
  return (
    <Flex align="center" gap={3} px={4} py={2}>
      <Text
        flex="1"
        minW={0}
        fontSize={{ base: 'lg', md: '2xl' }}
        fontWeight="bold"
        letterSpacing="wide"
        textTransform="uppercase"
        color={highlight ? 'white' : 'whiteAlpha.800'}
        truncate
      >
        {name}
      </Text>

      {server && <ServerDots count={server} />}

      {setWins > 0 && (
        <Text
          fontSize={{ base: 'md', md: 'xl' }}
          fontWeight="bold"
          color="yellow.300"
          fontVariantNumeric="tabular-nums"
          minW="1.2em"
          textAlign="center"
        >
          {setWins}
        </Text>
      )}

      <Flex
        align="center"
        justify="center"
        minW={{ base: '44px', md: '60px' }}
        px={2}
        bg={highlight ? 'green.500' : 'blackAlpha.500'}
        alignSelf="stretch"
      >
        <Text
          fontSize={{ base: '2xl', md: '4xl' }}
          fontWeight="black"
          lineHeight={1}
          color="white"
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
    <Flex gap={1.5} align="center" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <Box
          key={index}
          w={{ base: 2.5, md: 3 }}
          h={{ base: 2.5, md: 3 }}
          borderRadius="full"
          bg="yellow.300"
          boxShadow="0 0 8px rgba(250, 204, 21, 0.7)"
        />
      ))}
    </Flex>
  );
}
