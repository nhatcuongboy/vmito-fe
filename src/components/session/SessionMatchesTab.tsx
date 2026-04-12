'use client';

import { SessionService } from '@/lib/api/session.service';
import { CourtDirection, Player, Court } from '@/lib/api/types';
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
import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import { EditMatchModal } from './EditMatchModal';
import { toaster } from '@/components/ui/toaster';
import { VModal } from '@/components/ui/VModal';
import {
  HistoryMatchCard,
  HistoryMatch,
} from '@/components/session/HistoryMatchCard';

// ... (rest of the file)
import { ChevronDown } from 'lucide-react';
import VSelect from '@/components/ui/VSelect';

interface SessionMatchesTabProps {
  sessionId: string;
  sessionData?: {
    players: Array<{
      id: string;
      playerNumber: number;
      name?: string;
    }>;
    courts: Array<{
      id: string;
      courtNumber: number;
      courtName?: string;
    }>;
  };
  defaultPlayerId?: string;
  readOnly?: boolean;
}

export default function SessionMatchesTab({
  sessionId,
  sessionData,
  defaultPlayerId,
  readOnly,
}: SessionMatchesTabProps) {
  const t = useTranslations('SessionDetail.matchs');
  const [matches, setMatches] = useState<HistoryMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(
    defaultPlayerId || ''
  );
  const [selectedCourtId, setSelectedCourtId] = useState<string>('');
  const [players, setPlayers] = useState<
    (Player | { id: string; playerNumber: number; name?: string })[]
  >(sessionData?.players || []);

  // Sync defaultPlayerId when it changes and selectedPlayerId is empty
  useEffect(() => {
    if (defaultPlayerId) {
      setSelectedPlayerId(defaultPlayerId);
    }
  }, [defaultPlayerId]);
  const [courts, setCourts] = useState<
    (Court | { id: string; courtNumber: number; courtName?: string })[]
  >(sessionData?.courts || []);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<HistoryMatch | null>(null);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [matchToDelete, setMatchToDelete] = useState<HistoryMatch | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Use ref to store sessionData to avoid triggering effect on object reference changes
  const sessionDataRef = useRef(sessionData);
  sessionDataRef.current = sessionData;

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Step 1: Load players and courts
      const currentSessionData = sessionDataRef.current;
      let currentPlayers = currentSessionData?.players || [];
      let currentCourts = currentSessionData?.courts || [];

      if (!currentSessionData) {
        const [playersData, courtsData] = await Promise.all([
          SessionService.getSessionPlayers(sessionId),
          SessionService.getSessionCourts(sessionId),
        ]);
        currentPlayers = playersData;
        currentCourts = courtsData;
      }

      setPlayers(currentPlayers);
      setCourts(currentCourts);

      // Step 2: Load matches
      const filters: { playerId?: string; courtId?: string } = {};
      if (selectedPlayerId) filters.playerId = selectedPlayerId;
      if (selectedCourtId) filters.courtId = selectedCourtId;

      const result = await SessionService.getSessionMatchesWithFilters(
        sessionId,
        Object.keys(filters).length > 0 ? filters : undefined
      );

      const sessionMatches = result.matches;
      const completedMatches = sessionMatches.filter(
        (m) => m.status === 'FINISHED' || (m.status as string) === 'COMPLETED'
      );

      const allMatches: HistoryMatch[] = [];
      for (const match of completedMatches) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const matchData = match as unknown as Record<string, any>;

        // ... (existing courtName logic)
        let courtName = t('courtUnknown');
        if (
          matchData.court &&
          matchData.court.courtName &&
          matchData.court.courtNumber
        ) {
          courtName = t('courtNumberWithName', {
            number: matchData.court.courtNumber,
            name: matchData.court.courtName,
          });
        } else if (matchData.court && matchData.court.courtName) {
          courtName = matchData.court.courtName;
        } else if (matchData.court && matchData.court.courtNumber) {
          courtName = t('courtNumber', { number: matchData.court.courtNumber });
        } else if (matchData.courtId) {
          courtName = t('courtNumber', { number: matchData.courtId });
        }

        // Get player names and IDs sorted by courtPosition
        let playerNames: string[] = [];
        let playerIds: string[] = [];
        if (Array.isArray(matchData.players)) {
          // Sort by match_player position for correct pairing
          const sortedMatchPlayers = [...matchData.players].sort((a, b) => {
            const posA = a.position ?? 0;
            const posB = b.position ?? 0;
            return posA - posB;
          });
          playerNames = sortedMatchPlayers.map((mp) => mp.player?.name || '?');
          playerIds = sortedMatchPlayers.map(
            (mp) => mp.player?.id || mp.playerId
          );
        }

        // ... (existing score parsing logic)
        let scores;
        let winningPair;

        // Ensure score is parsed if it arrives as a string (handling potential API inconsistencies)
        if (typeof matchData.score === 'string') {
          try {
            matchData.score = JSON.parse(matchData.score);
          } catch {
            // ignore error, will fail gracefully later
          }
        }

        // Ensure winnerIds is parsed if it arrives as a string
        if (typeof matchData.winnerIds === 'string') {
          try {
            matchData.winnerIds = JSON.parse(matchData.winnerIds);
          } catch {
            // ignore error
          }
        }

        // Use match player's position for pair calculation
        const playersWithPosition = Array.isArray(matchData.players)
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            matchData.players.map((mp: any, index: number) => ({
              playerId: mp.player?.id || mp.playerId,
              position: mp.position ?? index,
            }))
          : [];

        const matchResult = parseScoreData(matchData, playersWithPosition);
        if (matchResult) {
          scores = matchResult.scores;
          winningPair = matchResult.winningPair;
        } else {
          // ... (legacy parsing fallback)
          const scoreData =
            matchData.score ||
            matchData.result ||
            matchData.scores ||
            matchData.matchResult;

          if (scoreData) {
            try {
              if (
                typeof scoreData === 'string' &&
                scoreData.startsWith('[') &&
                scoreData.endsWith(']')
              ) {
                const scoreArray = JSON.parse(scoreData);
                if (Array.isArray(scoreArray) && scoreArray.length === 2) {
                  scores = {
                    pair1Score: scoreArray[0],
                    pair2Score: scoreArray[1],
                  };
                  if (scores.pair1Score > scores.pair2Score) {
                    winningPair = 1 as const;
                  } else if (scores.pair2Score > scores.pair1Score) {
                    winningPair = 2 as const;
                  }
                }
              } else {
                const parsedScore =
                  typeof scoreData === 'string'
                    ? JSON.parse(scoreData)
                    : scoreData;

                if (parsedScore && typeof parsedScore === 'object') {
                  const scoresObj = parsedScore.scores || parsedScore;
                  const pair1Score =
                    scoresObj.pair1 || scoresObj.team1 || scoresObj.score1 || 0;
                  const pair2Score =
                    scoresObj.pair2 || scoresObj.team2 || scoresObj.score2 || 0;

                  scores = {
                    pair1Score: Number(pair1Score),
                    pair2Score: Number(pair2Score),
                  };

                  if (scores.pair1Score > scores.pair2Score) {
                    winningPair = 1 as const;
                  } else if (scores.pair2Score > scores.pair1Score) {
                    winningPair = 2 as const;
                  }
                }
              }
            } catch (e) {
              console.warn('Failed to parse match score:', e);
            }
          }
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
          notes: matchData.notes || matchData.note,
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
      setError(t('failedToLoadMatchHistory'));
      console.error('Error fetching match history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, selectedPlayerId, selectedCourtId]);

  const handleEditMatch = (match: HistoryMatch) => {
    setSelectedMatch(match);
    setIsEditModalOpen(true);
  };

  const handleModalClose = () => {
    setIsEditModalOpen(false);
    setSelectedMatch(null);
  };

  const handleMatchUpdate = () => {
    loadData(); // Refresh data
  };

  const handleDeleteMatch = (match: HistoryMatch) => {
    setMatchToDelete(match);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteMatch = async () => {
    if (!matchToDelete) return;

    try {
      setIsDeleting(true);
      await SessionService.deleteMatch(matchToDelete.id);
      toaster.create({
        title: t('deleteMatchSuccess') || 'Đã xoá trận đấu',
        type: 'success',
        duration: 3000,
        closable: true,
      });
      loadData();
      setIsDeleteModalOpen(false);
      setMatchToDelete(null);
    } catch (err) {
      console.error('Error deleting match:', err);
      toaster.create({
        title: t('deleteMatchError') || 'Không thể xoá trận đấu',
        type: 'error',
        duration: 3000,
        closable: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleExtra = async (match: HistoryMatch) => {
    try {
      await SessionService.updateMatch(match.id, { isExtra: !match.isExtra });
      toaster.create({
        title: t('updateMatchSuccess') || 'Cập nhật trận đấu thành công',
        type: 'success',
        duration: 3000,
        closable: true,
      });
      loadData();
    } catch (err) {
      console.error('Error toggling extra status:', err);
      toaster.create({
        title: t('updateMatchError') || 'Lỗi cập nhật trận đấu',
        type: 'error',
        duration: 3000,
        closable: true,
      });
    }
  };

  return (
    <Box>
      {/* <Text fontWeight="semibold" mb={3}>
        {t('matches')}
      </Text> */}

      <Flex
        mb={6}
        mt={2}
        flexDirection={{ base: 'column', md: 'row' }}
        align={{ base: 'flex-start', md: 'center' }}
        justify="space-between"
        gap={4}
      >
        <Heading size="md">
          {t('matchCount', { count: matches.length })}
        </Heading>

        <Flex gap={3} flexWrap="wrap" width={{ base: '100%', md: 'auto' }}>
          {/* Player Filter */}
          <Box
            width={{ base: 'calc(50% - 6px)', sm: '180px' }}
            bg="white"
            _dark={{ bg: 'gray.800' }}
            borderRadius="md"
            boxShadow="sm"
          >
            <VSelect
              value={selectedPlayerId}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setSelectedPlayerId(e.target.value)
              }
              size="sm"
              variant="outline"
              rightElement={<ChevronDown size={14} color="gray" />}
            >
              <option value="">{t('allPlayers')}</option>
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  #{player.playerNumber} - {player.name || t('unnamed')}
                </option>
              ))}
            </VSelect>
          </Box>

          {/* Court Filter */}
          <Box
            width={{ base: 'calc(50% - 6px)', sm: '150px' }}
            bg="white"
            _dark={{ bg: 'gray.800' }}
            borderRadius="md"
            boxShadow="sm"
          >
            <VSelect
              value={selectedCourtId}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setSelectedCourtId(e.target.value)
              }
              size="sm"
              variant="outline"
              rightElement={<ChevronDown size={14} color="gray" />}
            >
              <option value="">{t('allCourts')}</option>
              {courts.map((court) => (
                <option key={court.id} value={court.id}>
                  {court.courtName
                    ? t('courtNumberWithName', {
                        number: court.courtNumber,
                        name: court.courtName,
                      })
                    : t('courtNumber', { number: court.courtNumber })}
                </option>
              ))}
            </VSelect>
          </Box>
        </Flex>
      </Flex>

      {/* Results */}
      {loading ? (
        <Center py={10}>
          <Spinner size="xl" color="green.500" />
        </Center>
      ) : error ? (
        <Box
          p={4}
          bg="red.50"
          color="red.600"
          borderRadius="md"
          mb={6}
          borderWidth="1px"
          borderColor="red.200"
        >
          <Text fontWeight="medium">{error}</Text>
        </Box>
      ) : matches.length === 0 ? (
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
            {t('noCompletedMatches')}
          </Heading>
          <Text color="gray.500">
            {selectedPlayerId || selectedCourtId
              ? t('noMatchesWithFilters')
              : t('noMatchesYet')}
          </Text>
        </Box>
      ) : (
        <Grid
          templateColumns={{
            base: '1fr',
            md: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)',
          }}
          gap={6}
        >
          {matches.map((match) => (
            <HistoryMatchCard
              key={match.id}
              match={match}
              direction={CourtDirection.HORIZONTAL}
              onEdit={readOnly ? undefined : handleEditMatch}
              onDelete={readOnly ? undefined : handleDeleteMatch}
              onToggleExtra={readOnly ? undefined : handleToggleExtra}
            />
          ))}
        </Grid>
      )}

      {/* Edit Match Modal */}
      {selectedMatch && (
        <EditMatchModal
          isOpen={isEditModalOpen}
          onClose={handleModalClose}
          match={selectedMatch}
          sessionId={sessionId}
          players={players}
          onUpdate={handleMatchUpdate}
        />
      )}

      {/* Delete Match Confirmation Modal */}
      <VModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setMatchToDelete(null);
        }}
        title={t('deleteConfirm')}
        primaryActionText={t('delete')}
        onPrimaryAction={confirmDeleteMatch}
        isPrimaryLoading={isDeleting}
        primaryColorScheme="red"
        secondaryActionText={t('cancel')}
      >
        <Text>
          {t('confirmDeleteMatch') ||
            'Bạn có chắc chắn muốn xoá trận đấu này không?'}
        </Text>
      </VModal>
    </Box>
  );
}
