'use client';

import { SessionService } from '@/lib/api/session.service';
import { CourtDirection } from '@/lib/api/types';
import { parseScoreData } from '@/utils/match-result-utils';
import {
  Box,
  Center,
  Flex,
  Grid,
  Heading,
  Spinner,
  Text,
} from '@chakra-ui/react';
import React, { useState, useEffect, ChangeEvent, useMemo } from 'react';
import {
  HistoryMatchCard,
  HistoryMatch,
} from '@/components/session/HistoryMatchCard';
import { useTranslations } from 'next-intl';

interface PlayerMatchHistoryProps {
  sessionId: string;
  playerId: string;
}

type ResultFilter = 'ALL' | 'WIN' | 'LOSS' | 'DRAW';

export default function PlayerMatchHistory({
  sessionId,
  playerId,
}: PlayerMatchHistoryProps) {
  const t = useTranslations('SessionDetail.results'); // Assuming we will add keys here
  const [matches, setMatches] = useState<HistoryMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedCourt, setSelectedCourt] = useState<string>('ALL');
  const [resultFilter, setResultFilter] = useState<ResultFilter>('ALL');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch matches specifically for this player
      const result = await SessionService.getSessionMatchesWithFilters(
        sessionId,
        { playerId }
      );

      const sessionMatches = result.matches;
      const completedMatches = sessionMatches.filter(
        (m) => m.status === 'FINISHED' || (m.status as string) === 'COMPLETED'
      );

      const allMatches: HistoryMatch[] = [];

      for (const match of completedMatches) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const matchData = match as unknown as Record<string, any>;

        // Court Name Logic
        let courtName = 'Court ?';
        if (
          matchData.court &&
          matchData.court.courtName &&
          matchData.court.courtNumber
        ) {
          courtName = `Court ${matchData.court.courtNumber} (${matchData.court.courtName})`;
        } else if (matchData.court && matchData.court.courtName) {
          courtName = matchData.court.courtName;
        } else if (matchData.court && matchData.court.courtNumber) {
          courtName = `Court ${matchData.court.courtNumber}`;
        } else if (matchData.courtId) {
          courtName = matchData.courtId;
        }

        // Get player names and IDs sorted by courtPosition
        let playerNames: string[] = [];
        let playerIds: string[] = [];
        if (Array.isArray(matchData.players)) {
          const sortedMatchPlayers = [...matchData.players].sort((a, b) => {
            const posA = a.player?.courtPosition ?? a.position ?? 0;
            const posB = b.player?.courtPosition ?? b.position ?? 0;
            return posA - posB;
          });
          playerNames = sortedMatchPlayers.map((mp) => mp.player?.name || '?');
          playerIds = sortedMatchPlayers.map(
            (mp) => mp.player?.id || mp.playerId
          );
        }

        // Parse Scores
        let scores;
        let winningPair;

        // Ensure score is parsed if it arrives as a string
        if (typeof matchData.score === 'string') {
          try {
            matchData.score = JSON.parse(matchData.score);
          } catch (_e) {
            // ignore error
          }
        }
        // Ensure winnerIds is parsed if it arrives as a string
        if (typeof matchData.winnerIds === 'string') {
          try {
            matchData.winnerIds = JSON.parse(matchData.winnerIds);
          } catch (_e) {
            // ignore error
          }
        }

        const playersWithPosition = Array.isArray(matchData.players)
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            matchData.players.map((mp: any, index: number) => ({
              playerId: mp.player?.id || mp.playerId,
              position: mp.player?.courtPosition ?? mp.position ?? index,
            }))
          : [];

        const matchResult = parseScoreData(matchData, playersWithPosition);
        if (matchResult) {
          scores = matchResult.scores;
          winningPair = matchResult.winningPair;
        }

        allMatches.push({
          id: matchData.id,
          sessionId,
          court: courtName,
          players: playerNames,
          playerIds,
          startTime: matchData.startTime,
          endTime: matchData.endTime,
          winner: matchData.winner,
          scores,
          winningPair,
          isExtra: Boolean(matchData.isExtra),
        });
      }

      // Sort by startTime descending
      allMatches.sort((a, b) => {
        const aDate = a.startTime ? new Date(a.startTime).getTime() : 0;
        const bDate = b.startTime ? new Date(b.startTime).getTime() : 0;
        return bDate - aDate;
      });

      setMatches(allMatches);
    } catch (err) {
      setError('Failed to load match history.');
      console.error('Error fetching match history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId && playerId) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, playerId]);

  // Derived filtered matches
  const filteredMatches = useMemo(() => {
    return matches.filter((match) => {
      // Filter by Court
      if (selectedCourt !== 'ALL' && match.court !== selectedCourt) {
        return false;
      }

      // Filter by Result (Win/Loss/Draw)
      if (resultFilter !== 'ALL') {
        // Find which pair the current player belongs to
        // P1 & P2 = Pair 1, P3 & P4 = Pair 2
        // Indices: 0, 1 -> Pair 1; 2, 3 -> Pair 2
        // match.playerIds is sorted by position [P1, P2, P3, P4]

        const playerIndex = match.playerIds?.indexOf(playerId) ?? -1;
        if (playerIndex === -1) return false; // Should not happen given API filter

        const playerPair = playerIndex <= 1 ? 1 : 2;

        if (resultFilter === 'DRAW') {
          // Check if it's a draw
          // scores: { pair1Score: number, pair2Score: number }
          return (
            match.scores && match.scores.pair1Score === match.scores.pair2Score
          );
        }

        if (resultFilter === 'WIN') {
          return match.winningPair === playerPair;
        }

        if (resultFilter === 'LOSS') {
          // Not draw AND Not winner
          const isDraw =
            match.scores && match.scores.pair1Score === match.scores.pair2Score;
          return !isDraw && match.winningPair !== playerPair;
        }
      }

      return true;
    });
  }, [matches, selectedCourt, resultFilter, playerId]);

  // Get unique courts for filter
  const uniqueCourts = useMemo(() => {
    const courts = new Set(matches.map((m) => m.court));
    return Array.from(courts).sort();
  }, [matches]);

  if (loading) {
    return (
      <Center py={10}>
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  if (error) {
    return (
      <Box p={4} bg="red.50" color="red.600" borderRadius="md">
        <Text>{error}</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Text fontWeight="semibold" mb={3} fontSize="lg">
        {/* Using translation key defined in step 1 */}
      </Text>

      {/* Filters */}
      <Box
        mb={6}
        p={4}
        bg="gray.50"
        _dark={{ bg: 'gray.700' }}
        borderRadius="lg"
      >
        <Flex gap={4} flexWrap="wrap">
          {/* Court Filter */}
          <Box minW="140px" flex="1">
            <Text
              fontSize="sm"
              color="gray.600"
              _dark={{ color: 'gray.400' }}
              mb={1}
            >
              {t('filter.court')}
            </Text>
            <select
              value={selectedCourt}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setSelectedCourt(e.target.value)
              }
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                fontSize: '14px',
                backgroundColor: 'white',
              }}
            >
              <option value="ALL">{t('allCourts')}</option>
              {uniqueCourts.map((court) => (
                <option key={court} value={court}>
                  {court}
                </option>
              ))}
            </select>
          </Box>

          {/* Result Filter */}
          <Box minW="140px" flex="1">
            <Text
              fontSize="sm"
              color="gray.600"
              _dark={{ color: 'gray.400' }}
              mb={1}
            >
              {t('filter.result')}
            </Text>
            <select
              value={resultFilter}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setResultFilter(e.target.value as ResultFilter)
              }
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                fontSize: '14px',
                backgroundColor: 'white',
              }}
            >
              <option value="ALL">{t('allResults')}</option>
              <option value="WIN">{t('win')}</option>
              <option value="LOSS">{t('loss')}</option>
              <option value="DRAW">{t('draw')}</option>
            </select>
          </Box>
        </Flex>
      </Box>

      {/* List */}
      {filteredMatches.length === 0 ? (
        <Box
          textAlign="center"
          py={10}
          px={6}
          borderWidth="1px"
          borderRadius="lg"
          bg="white"
          _dark={{ bg: 'gray.800' }}
        >
          <Heading size="md" mb={2}>
            {t('noMatchesFound')}
          </Heading>
          <Text color="gray.500">{t('noMatchesDescription')}</Text>
        </Box>
      ) : (
        <Grid
          templateColumns={{
            base: '1fr',
            md: 'repeat(2, 1fr)',
            xl: 'repeat(3, 1fr)',
          }}
          gap={4}
        >
          {filteredMatches.map((match) => (
            <HistoryMatchCard
              key={match.id}
              match={match}
              direction={CourtDirection.HORIZONTAL}
              // No onEdit prop as players can't edit matches
            />
          ))}
        </Grid>
      )}
    </Box>
  );
}
