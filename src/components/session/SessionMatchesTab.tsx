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
  Skeleton,
  Spinner,
  Text,
} from '@chakra-ui/react';
import React, {
  useState,
  useEffect,
  useRef,
  ChangeEvent,
  useMemo,
} from 'react';
import { useTranslations } from 'next-intl';
import { EditMatchModal } from './EditMatchModal';
import { toaster } from '@/components/ui/toaster';
import { VModal } from '@/components/ui/VModal';
import { Button } from '@/components/ui/chakra-compat';
import { useViewMode } from '@/hooks/useViewMode';
import ViewModeToggle from './ViewModeToggle';
import {
  HistoryMatchCard,
  HistoryMatch,
} from '@/components/session/HistoryMatchCard';

import VSelect from '@/components/ui/VSelect';
import VMultiSelect, { VMultiSelectOption } from '@/components/ui/VMultiSelect';
import {
  CalendarArrowDown,
  CalendarArrowUp,
  Check,
  ChevronDown,
} from 'lucide-react';

type MatchSortBy = 'time_desc' | 'time_asc';
type PlayerSelectOption = VMultiSelectOption & { playerNumber: number };

// Skeleton Loading Component
function MatchesTabSkeleton({ viewMode }: { viewMode: 'list' | 'grid' }) {
  return (
    <Box>
      {/* Filter Controls Skeleton */}
      <Flex mb={6} mt={2} direction="column" gap={3}>
        <Flex
          gap={2.5}
          flexWrap="wrap"
          width="100%"
          justify={{ base: 'stretch', md: 'flex-end' }}
        >
          <Skeleton
            height="38px"
            width={{ base: '100%', md: '260px' }}
            borderRadius="md"
          />
          <Skeleton
            height="38px"
            width={{ base: 'calc(50% - 5px)', md: '150px' }}
            borderRadius="md"
          />
          <Skeleton
            height="38px"
            width={{ base: 'calc(50% - 5px)', md: '150px' }}
            borderRadius="md"
          />
        </Flex>

        <Flex align="center" justify="space-between" gap={3} width="100%">
          <Skeleton height="32px" width="150px" borderRadius="md" />
          <Flex align="center" justify="flex-end" gap={2.5} minW={0}>
            <Skeleton
              height="38px"
              width="132px"
              borderRadius="full"
              flexShrink={0}
            />
            <Skeleton
              height="38px"
              width="80px"
              borderRadius="md"
              flexShrink={0}
            />
          </Flex>
        </Flex>
      </Flex>

      {/* Match Cards Skeleton */}
      <Grid
        templateColumns={{
          base: '1fr',
          md:
            viewMode === 'list'
              ? 'repeat(auto-fit, minmax(420px, 1fr))'
              : 'repeat(2, 1fr)',
          xl:
            viewMode === 'list'
              ? 'repeat(auto-fit, minmax(460px, 1fr))'
              : 'repeat(3, 1fr)',
        }}
        gap={viewMode === 'list' ? 3 : 4}
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <Box
            key={index}
            borderWidth="1px"
            borderRadius="lg"
            overflow="hidden"
            bg="white"
            _dark={{ bg: 'gray.800' }}
            p={4}
          >
            {viewMode === 'list' ? (
              // List view skeleton
              <Flex direction="column" gap={3}>
                <Flex justify="space-between" align="start">
                  <Skeleton height="24px" width="120px" />
                  <Skeleton height="20px" width="80px" borderRadius="full" />
                </Flex>
                <Flex gap={2}>
                  <Skeleton height="20px" width="60px" />
                  <Skeleton height="20px" width="100px" />
                </Flex>
                <Flex justify="space-between" align="center">
                  <Skeleton height="32px" width="140px" />
                  <Skeleton height="32px" width="40px" />
                  <Skeleton height="32px" width="140px" />
                </Flex>
                <Flex gap={2} justify="flex-end">
                  <Skeleton height="32px" width="80px" borderRadius="md" />
                  <Skeleton height="32px" width="80px" borderRadius="md" />
                </Flex>
              </Flex>
            ) : (
              // Grid view skeleton
              <Flex direction="column" gap={3}>
                <Skeleton height="20px" width="100px" />
                <Skeleton height="120px" width="100%" borderRadius="md" />
                <Flex justify="space-between">
                  <Skeleton height="24px" width="60px" />
                  <Skeleton height="24px" width="60px" />
                </Flex>
                <Skeleton height="16px" width="80%" />
              </Flex>
            )}
          </Box>
        ))}
      </Grid>
    </Box>
  );
}

const FILTER_CONTROL_PROPS = {
  bg: 'white',
  _dark: { bg: 'gray.800' },
  borderRadius: 'md',
  boxShadow: 'sm',
  h: '38px',
  minH: '38px',
  overflow: 'hidden',
  css: {
    '& > div': {
      height: '100%',
    },
    '& [data-scope="select"][data-part="trigger"]': {
      minHeight: '38px',
      height: '38px',
      paddingTop: 0,
      paddingBottom: 0,
      alignItems: 'center',
    },
  },
} as const;

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
  restrictedPlayerId?: string;
  readOnly?: boolean;
}

export default function SessionMatchesTab({
  sessionId,
  sessionData,
  defaultPlayerId,
  restrictedPlayerId,
  readOnly,
}: SessionMatchesTabProps) {
  const t = useTranslations('SessionDetail.matchs');
  const [matches, setMatches] = useState<HistoryMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>(
    restrictedPlayerId
      ? [restrictedPlayerId]
      : defaultPlayerId
        ? [defaultPlayerId]
        : []
  );
  const [selectedCourtId, setSelectedCourtId] = useState<string>('');
  const [resultFilter, setResultFilter] = useState<string>(''); // '' = all, 'with' = có kết quả, 'without' = không có kết quả
  const [sortBy, setSortBy] = useState<MatchSortBy>('time_desc');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [viewMode, setViewMode] = useViewMode('session-matches');
  const matchViewMode = viewMode === 'list' ? 'list' : 'grid';
  const [players, setPlayers] = useState<
    (Player | { id: string; playerNumber: number; name?: string })[]
  >(sessionData?.players || []);

  const effectiveSelectedPlayerIds = useMemo(
    () => (restrictedPlayerId ? [restrictedPlayerId] : selectedPlayerIds),
    [restrictedPlayerId, selectedPlayerIds]
  );

  // Sync incoming player constraints only when they change.
  useEffect(() => {
    const incomingPlayerId = restrictedPlayerId ?? defaultPlayerId;
    if (!incomingPlayerId) return;

    setSelectedPlayerIds((currentIds) =>
      currentIds.includes(incomingPlayerId) ? currentIds : [incomingPlayerId]
    );
  }, [defaultPlayerId, restrictedPlayerId]);
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
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  const loadData = async (isRefresh = false) => {
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
      // If multiple players selected, we'll filter client-side
      if (effectiveSelectedPlayerIds.length === 1) {
        filters.playerId = effectiveSelectedPlayerIds[0];
      }
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
          playerNames = sortedMatchPlayers.map((mp) => {
            const name = mp.player?.name || '?';
            const number = mp.player?.playerNumber;
            return number ? `(#${number}) ${name}` : name;
          });
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
          isDraw: Boolean(matchData.isDraw),
          direction: matchData.court?.direction ?? CourtDirection.HORIZONTAL,
          isExtra: Boolean(matchData.isExtra),
          notes: matchData.notes || matchData.note,
        });
      }

      // Client-side filtering for multiple players
      let filteredMatches = allMatches;

      if (effectiveSelectedPlayerIds.length > 0) {
        filteredMatches = filteredMatches.filter((match) =>
          effectiveSelectedPlayerIds.some((playerId) =>
            match.playerIds?.includes(playerId)
          )
        );
      }

      // Filter by result status
      if (resultFilter === 'with') {
        filteredMatches = filteredMatches.filter(
          (match) =>
            match.scores &&
            (match.scores.pair1Score > 0 || match.scores.pair2Score > 0)
        );
      } else if (resultFilter === 'without') {
        filteredMatches = filteredMatches.filter(
          (match) =>
            !match.scores ||
            (match.scores.pair1Score === 0 && match.scores.pair2Score === 0)
        );
      }

      setMatches(filteredMatches);
    } catch (err) {
      setError(t('failedToLoadMatchHistory'));
      console.error('Error fetching match history:', err);
    } finally {
      setLoading(false);
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    }
  };

  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => {
      const aDate = a.startTime ? new Date(a.startTime).getTime() : 0;
      const bDate = b.startTime ? new Date(b.startTime).getTime() : 0;
      return sortBy === 'time_desc' ? bDate - aDate : aDate - bDate;
    });
  }, [matches, sortBy]);

  const playerOptions = useMemo<PlayerSelectOption[]>(
    () =>
      players.map((player) => ({
        value: player.id,
        label: player.name || t('unnamed'),
        playerNumber: player.playerNumber,
      })),
    [players, t]
  );

  const sortOptions = useMemo(
    () => [
      {
        value: 'time_desc' as const,
        label: t('sortNewest'),
        icon: CalendarArrowDown,
      },
      {
        value: 'time_asc' as const,
        label: t('sortOldest'),
        icon: CalendarArrowUp,
      },
    ],
    [t]
  );

  const activeSortOption = sortOptions.find(
    (option) => option.value === sortBy
  );

  const handleSortSelect = (value: MatchSortBy) => {
    setSortBy(value);
    setIsSortOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSortOpen(false);
      }
    };

    if (isSortOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSortOpen]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, effectiveSelectedPlayerIds, selectedCourtId, resultFilter]);

  const handleEditMatch = (match: HistoryMatch) => {
    setSelectedMatch(match);
    setIsEditModalOpen(true);
  };

  const handleModalClose = () => {
    setIsEditModalOpen(false);
    setSelectedMatch(null);
  };

  const handleMatchUpdate = () => {
    loadData(true); // Refresh data without showing skeleton
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
      loadData(true); // Refresh data without showing skeleton
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
      loadData(true); // Refresh data without showing skeleton
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

      <Flex mb={6} mt={2} direction="column" gap={3}>
        <Flex
          gap={2.5}
          flexWrap="wrap"
          width="100%"
          justify={{ base: 'stretch', md: 'flex-end' }}
        >
          {!restrictedPlayerId && (
            <Box
              width={{ base: '100%', md: '260px' }}
              {...FILTER_CONTROL_PROPS}
              css={{
                ...FILTER_CONTROL_PROPS.css,
                '& > div > div:first-of-type': {
                  height: '38px',
                  minHeight: '38px',
                  paddingTop: 0,
                  paddingBottom: 0,
                },
              }}
            >
              <VMultiSelect
                value={selectedPlayerIds}
                onChange={setSelectedPlayerIds}
                options={playerOptions}
                placeholder={t('allPlayers')}
                size="sm"
                variant="outline"
                renderItem={(option) => {
                  const playerOption = option as PlayerSelectOption;
                  return (
                    <Flex align="baseline" gap={1}>
                      <Text color="gray.500" fontSize="xs" fontWeight="medium">
                        #{playerOption.playerNumber}
                      </Text>
                      <Text fontSize="sm">{playerOption.label}</Text>
                    </Flex>
                  );
                }}
                renderSelected={(options) => {
                  const selectedOptions = options as PlayerSelectOption[];
                  if (options.length === 0) return '';
                  if (selectedOptions.length === 1) {
                    return `#${selectedOptions[0].playerNumber} ${selectedOptions[0].label}`;
                  }
                  if (selectedOptions.length === 2) {
                    return `#${selectedOptions[0].playerNumber} ${selectedOptions[0].label}, #${selectedOptions[1].playerNumber} ${selectedOptions[1].label}`;
                  }
                  // Show first player and count for 3+
                  return `#${selectedOptions[0].playerNumber} ${selectedOptions[0].label} +${selectedOptions.length - 1}`;
                }}
              />
            </Box>
          )}

          {/* Court Filter */}
          <Box
            width={{ base: 'calc(50% - 5px)', md: '150px' }}
            {...FILTER_CONTROL_PROPS}
          >
            <VSelect
              value={selectedCourtId}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setSelectedCourtId(e.target.value)
              }
              size="sm"
              variant="outline"
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

          {/* Result Status Filter */}
          <Box
            width={{ base: 'calc(50% - 5px)', md: '150px' }}
            {...FILTER_CONTROL_PROPS}
          >
            <VSelect
              value={resultFilter}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setResultFilter(e.target.value)
              }
              size="sm"
              variant="outline"
            >
              <option value="">{t('allResults') || 'Tất cả'}</option>
              <option value="with">{t('withResults') || 'Có kết quả'}</option>
              <option value="without">
                {t('withoutResults') || 'Không có kết quả'}
              </option>
            </VSelect>
          </Box>
        </Flex>

        <Flex align="center" justify="space-between" gap={3} width="100%">
          <Heading size="md" flexShrink={0}>
            {t('matchCount', { count: sortedMatches.length })}
          </Heading>

          <Flex align="center" justify="flex-end" gap={2.5} minW={0}>
            {/* Sort */}
            <Box
              position="relative"
              ref={sortDropdownRef}
              width={{ base: '132px', sm: '132px', md: '132px' }}
              flexShrink={0}
            >
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsSortOpen((current) => !current)}
                display="flex"
                alignItems="center"
                justifyContent="center"
                gap={2}
                h="38px"
                w="100%"
                px={3}
                borderRadius="full"
                borderColor={
                  isSortOpen
                    ? { base: 'green.500', _dark: 'green.400' }
                    : { base: 'gray.300', _dark: 'gray.600' }
                }
                borderWidth={isSortOpen ? '2px' : '1px'}
                bg={{ base: 'white', _dark: 'gray.800' }}
                color={{
                  base: isSortOpen ? 'green.700' : 'gray.700',
                  _dark: isSortOpen ? 'green.300' : 'gray.200',
                }}
                fontWeight="normal"
                fontSize="sm"
                shadow={isSortOpen ? '0 0 0 3px rgba(22, 163, 74, 0.16)' : 'xs'}
                _hover={{
                  bg: { base: 'gray.50', _dark: 'gray.700' },
                  borderColor: { base: 'green.500', _dark: 'green.400' },
                }}
                _active={{ bg: { base: 'gray.100', _dark: 'gray.600' } }}
              >
                {activeSortOption &&
                  React.createElement(activeSortOption.icon, { size: 16 })}
                <Text as="span" truncate>
                  {activeSortOption?.label}
                </Text>
                <ChevronDown
                  size={14}
                  style={{
                    transition: 'transform 0.2s',
                    transform: isSortOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                />
              </Button>

              {isSortOpen && (
                <Box
                  position="absolute"
                  top="calc(100% + 6px)"
                  right={0}
                  zIndex={200}
                  bg={{ base: 'white', _dark: 'gray.800' }}
                  border="1px solid"
                  borderColor={{ base: 'gray.200', _dark: 'gray.600' }}
                  borderRadius="xl"
                  boxShadow="lg"
                  minW="180px"
                  overflow="hidden"
                  py={1}
                >
                  {sortOptions.map((option) => {
                    const OptionIcon = option.icon;
                    const isActive = option.value === sortBy;

                    return (
                      <Flex
                        key={option.value}
                        align="center"
                        gap={2.5}
                        px={3}
                        py={2.5}
                        cursor="pointer"
                        bg={
                          isActive
                            ? { base: 'green.50', _dark: 'green.900' }
                            : 'transparent'
                        }
                        color={
                          isActive
                            ? 'green.600'
                            : { base: 'gray.700', _dark: 'gray.200' }
                        }
                        fontWeight={isActive ? 'semibold' : 'normal'}
                        fontSize="sm"
                        _hover={{
                          bg: isActive
                            ? { base: 'green.100', _dark: 'green.800' }
                            : { base: 'gray.50', _dark: 'gray.700' },
                        }}
                        onClick={() => handleSortSelect(option.value)}
                      >
                        <OptionIcon size={16} />
                        <Text flex={1}>{option.label}</Text>
                        {isActive && <Check size={14} />}
                      </Flex>
                    );
                  })}
                </Box>
              )}
            </Box>

            <Box flexShrink={0}>
              <ViewModeToggle
                showMap={false}
                viewMode={viewMode}
                setViewMode={setViewMode}
              />
            </Box>
          </Flex>
        </Flex>
      </Flex>

      {/* Results */}
      {loading && isInitialLoad ? (
        <MatchesTabSkeleton viewMode={matchViewMode} />
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
      ) : sortedMatches.length === 0 ? (
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
            {effectiveSelectedPlayerIds.length > 0 ||
            selectedCourtId ||
            resultFilter
              ? t('noMatchesWithFilters')
              : t('noMatchesYet')}
          </Text>
        </Box>
      ) : (
        <Grid
          templateColumns={{
            base: '1fr',
            md:
              matchViewMode === 'list'
                ? 'repeat(auto-fit, minmax(420px, 1fr))'
                : 'repeat(2, 1fr)',
            xl:
              matchViewMode === 'list'
                ? 'repeat(auto-fit, minmax(460px, 1fr))'
                : 'repeat(3, 1fr)',
          }}
          gap={matchViewMode === 'list' ? 3 : 4}
        >
          {sortedMatches.map((match) => (
            <HistoryMatchCard
              key={match.id}
              match={match}
              direction={match.direction ?? CourtDirection.HORIZONTAL}
              variant={matchViewMode}
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
