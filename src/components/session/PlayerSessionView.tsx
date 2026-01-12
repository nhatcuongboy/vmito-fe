'use client';

import BadmintonCourt from '@/components/court/BadmintonCourt';
import CourtsTab from '@/components/session/CourtsTab';
import PlayersTab, { PlayerFilter } from '@/components/session/PlayersTab';
import { IconButton } from '@/components/ui/chakra-compat';
import { NextLinkButton } from '@/components/ui/NextLinkButton';
import TopBar from '@/components/ui/TopBar';
import { SessionService } from '@/lib/api/session.service';
import { PlayerService } from '@/lib/api/player.service';
import { type Court, type Player, ISession, type Match as ApiMatch } from '@/lib/api/types';
import { type Match } from '@/types/session';
import { getCourtDisplayName } from '@/utils/session-helpers';
import {
  Box,
  Center,
  Container,
  Flex,
  Heading,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import {
  Activity,
  CheckCircle2,
  Clock,
  RefreshCw,
  User,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toaster } from '@/components/ui/toaster';
import { useSocket } from '@/contexts/SocketContext';

export interface PlayerSessionViewProps {
  /**
   * Mode to determine how to fetch player data:
   * - 'guest': Use playerId directly (for GUEST role)
   * - 'player': Use sessionId + userId to find player (for PLAYER role)
   */
  mode: 'guest' | 'player';
  /**
   * Player ID - required when mode is 'guest'
   */
  playerId?: string;
  /**
   * Session ID - required when mode is 'player'
   */
  sessionId?: string;
  /**
   * User ID - required when mode is 'player' to find player in session
   */
  userId?: string;
  /**
   * Error redirect path
   */
  errorRedirectPath?: string;
}

export default function PlayerSessionView({
  mode,
  playerId: propPlayerId,
  sessionId: propSessionId,
  userId,
  errorRedirectPath = '/join',
}: PlayerSessionViewProps) {
  const t = useTranslations('pages.join.status');
  const common = useTranslations('common');
  
  const { socket, joinSession, leaveSession } = useSocket();

  const [refreshInterval, setRefreshInterval] = useState(60); // seconds
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // For background refresh
  const [error, setError] = useState<string | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [session, setSession] = useState<ISession | null>(null);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [currentCourt, setCurrentCourt] = useState<Court | null>(null);
  const [courtPlayers, setCourtPlayers] = useState<Player[]>([]);
  const [activeTab, setActiveTab] = useState<number>(0); // 0: Status, 1: Courts, 2: Players
  const [playerFilter, setPlayerFilter] = useState<PlayerFilter>('ALL');

  // Helper function to convert ApiMatch to Match (for type compatibility)
  const convertToMatch = (apiMatch: ApiMatch): Match => ({
    id: apiMatch.id,
    status: apiMatch.status,
    courtId: apiMatch.courtId,
    startTime: apiMatch.startTime instanceof Date 
      ? apiMatch.startTime.toISOString() 
      : String(apiMatch.startTime),
    endTime: apiMatch.endTime instanceof Date 
      ? apiMatch.endTime.toISOString() 
      : apiMatch.endTime ? String(apiMatch.endTime) : undefined,
    players: (apiMatch.players || []).map(mp => ({
      id: mp.id,
      matchId: mp.matchId,
      playerId: mp.playerId,
      position: mp.position,
      player: {
        id: mp.player.id,
        playerNumber: mp.player.playerNumber,
        name: mp.player.name,
        gender: mp.player.gender,
        level: mp.player.level,
        levelDescription: mp.player.levelDescription,
        status: mp.player.status,
        currentWaitTime: mp.player.currentWaitTime,
        totalWaitTime: mp.player.totalWaitTime,
        matchesPlayed: mp.player.matchesPlayed,
        currentCourtId: mp.player.currentCourtId,
        preFilledByHost: mp.player.preFilledByHost,
        confirmedByPlayer: mp.player.confirmedByPlayer,
        requireConfirmInfo: mp.player.requireConfirmInfo,
        phone: mp.player.phone,
        position: mp.player.position,
        courtPosition: mp.player.courtPosition,
      },
    })),
  });

  // Helper function to format elapsed time for match display
  const formatMatchElapsedTime = (startTime: Date | string): string => {
    const start = new Date(startTime);
    const elapsedMs = Date.now() - start.getTime();
    const elapsedMinutes = Math.floor(elapsedMs / 60000);

    if (elapsedMinutes === 0) {
      return t('time.lessThanMinute');
    } else if (elapsedMinutes === 1) {
      return t('time.oneMinute');
    } else {
      return t('time.minutes', { count: elapsedMinutes });
    }
  };

  // Helper function to get current match for a court
  const getCurrentMatch = (courtId: string): Match | null => {
    const courtData = session?.courts?.find((c) => c.id === courtId);
    const match = courtData?.currentMatch;
    if (!match) return null;
    return convertToMatch(match);
  };

  // Format wait time to display in mm:ss format
  const formatWaitTime = (waitTimeInMinutes: number) => {
    const hours = Math.floor(waitTimeInMinutes / 60);
    const minutes = waitTimeInMinutes % 60;

    if (hours > 0) {
      return `${hours}h${minutes}m`;
    }

    return `${minutes} min`;
  };

  // Helper function to get waiting players
  const getWaitingPlayers = () => {
    return session?.players?.filter((p) => p.status === 'WAITING') || [];
  };

  // Function to fetch player data
  const fetchPlayerData = async (isBackgroundRefresh = false) => {
    try {
      // Show different loading states for initial vs background refresh
      if (isBackgroundRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Only clear error state, don't clear data during background refresh
      if (!isBackgroundRefresh) {
        setError(null);
      }

      let playerData: Player | null = null;
      let sessionData: ISession | null = null;
      let sessionId: string | null = null;

      if (mode === 'guest') {
        // GUEST mode: first get sessionId from player, then fetch full session
        if (!propPlayerId) {
          setError('MISSING_PLAYER_ID');
          return;
        }
        
        // Get player to retrieve sessionId
        const basicPlayerData = await PlayerService.getPlayer(propPlayerId);
        
        if (!basicPlayerData?.sessionId) {
          setError('PLAYER_NOT_FOUND');
          return;
        }
        
        sessionId = basicPlayerData.sessionId;
      } else {
        // PLAYER mode: use provided sessionId
        if (!propSessionId) {
          setError('MISSING_SESSION_ID');
          return;
        }
        if (!userId) {
          setError('MISSING_USER_ID');
          return;
        }
        
        sessionId = propSessionId;
      }

      // Fetch full session data (includes all players with complete info)
      sessionData = await SessionService.getSession(sessionId);
      
      if (!sessionData) {
        setError('SESSION_NOT_FOUND');
        return;
      }

      // Find player from session data for consistency
      // This ensures we have the same data structure as other players
      if (mode === 'guest') {
        playerData = sessionData.players?.find((p) => p.id === propPlayerId) || null;
        
        if (!playerData) {
          setError('PLAYER_NOT_FOUND');
          return;
        }
      } else {
        // PLAYER mode: find player by userId
        playerData = sessionData.players?.find((p) => p.userId === userId) || null;
        
        if (!playerData) {
          setError('PLAYER_NOT_IN_SESSION');
          return;
        }
      }

      // Update player state
      setPlayer(playerData);
      setSession(sessionData);


      // Get match and court info if player is playing or ready
      if (
        (playerData.status === 'PLAYING' || playerData.status === 'READY') &&
        playerData.currentCourtId
      ) {
        const court = sessionData.courts?.find(
          (c) => c.id === playerData.currentCourtId
        );
        if (court) {
          setCurrentCourt(court);
          setCourtPlayers(court.currentPlayers || []);

          // Get the current match from the court and convert to Match type
          if (court.currentMatch) {
            setCurrentMatch(convertToMatch(court.currentMatch));
          } else {
            setCurrentMatch(null);
          }
        } else {
          // Court not found, clear states
          setCurrentCourt(null);
          setCourtPlayers([]);
          setCurrentMatch(null);
        }
      } else {
        // Clear match and court info if not playing or ready
        setCurrentMatch(null);
        setCurrentCourt(null);
        setCourtPlayers([]);
      }

      // Clear error state after successful fetch
      setError(null);
    } catch (error: any) {
      console.error('Error fetching player data:', error);

      // Handle different types of errors
      if (error.response?.status === 404) {
        // Only set error for initial load, not background refresh
        if (!isBackgroundRefresh) {
          setError(mode === 'guest' ? 'PLAYER_NOT_FOUND' : 'SESSION_NOT_FOUND');
        }
      } else {
        // Only show toast for background refresh errors
        if (isBackgroundRefresh) {
          toaster.error({
            title: t('errors.refreshFailed') || 'Không thể cập nhật dữ liệu'
          });
        } else {
          setError('GENERAL_ERROR');
          toaster.error({ title: t('errors.loadFailed') });
        }
      }
    } finally {
      if (isBackgroundRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
      setLastRefreshed(new Date());
    }
  };

  // Socket.io integration
  useEffect(() => {
    if (session?.id) {
      joinSession(session.id);
      return () => leaveSession(session.id);
    }
  }, [session?.id, joinSession, leaveSession]);

  // Listen to session events for real-time updates and toasts
  useEffect(() => {
    if (!socket || !session?.id) return;

    // Helper to get fresh session data (ref) if needed, but for now we use the dependency
    // Note: session in dependency might cause re-registrations, but it ensures we have latest data for lookup

    const handlePlayerCreated = (data: { sessionId: string; playerId: string }) => {
      if (data.sessionId !== session.id) return;
      toaster.create({
        title: t('events.playerJoined'),
        type: 'info',
      });
      fetchPlayerData(true);
    };

    const handlePlayerUpdated = (data: { sessionId: string; playerId: string }) => {
      if (data.sessionId !== session.id) return;
      // Try to find player name from current session state
      const p = session.players?.find(p => p.id === data.playerId);
      const name = p ? (p.name || `Player ${p.playerNumber}`) : 'A player';
      
      toaster.create({
        title: t('events.playerUpdated', { name }),
        type: 'info',
      });
      fetchPlayerData(true);
    };

    const handlePlayerRemoved = (data: { sessionId: string; playerId: string }) => {
      if (data.sessionId !== session.id) return;
      // Try to find player name event if they are being removed (might still be in state)
      const p = session.players?.find(p => p.id === data.playerId);
      const name = p ? (p.name || `Player ${p.playerNumber}`) : 'A player';

      toaster.create({
        title: t('events.playerLeft', { name }),
        type: 'warning',
      });
      fetchPlayerData(true);
    };

    const handlePlayersSelected = (data: { sessionId: string; courtId: string }) => {
      if (data.sessionId !== session.id) return;
      const court = session.courts?.find(c => c.id === data.courtId);
      const courtName = court ? (court.courtName || `Court ${court.courtNumber}`) : 'Court';

      toaster.create({
        title: t('events.playersSelected', { court: courtName }),
        type: 'success',
      });
      fetchPlayerData(true);
    };

    const handlePlayersDeselected = (data: { sessionId: string; courtId: string }) => {
      if (data.sessionId !== session.id) return;
      const court = session.courts?.find(c => c.id === data.courtId);
      const courtName = court ? (court.courtName || `Court ${court.courtNumber}`) : 'Court';

      toaster.create({
        title: t('events.playersDeselected', { court: courtName }),
        type: 'info',
      });
      fetchPlayerData(true);
    };

    const handleGenericEvent = (data: { sessionId: string }) => {
       if (data.sessionId === session.id) {
        fetchPlayerData(true);
       }
    };

    socket.on('player_created', handlePlayerCreated);
    socket.on('player_updated', handlePlayerUpdated);
    socket.on('player_removed', handlePlayerRemoved);
    socket.on('players_selected', handlePlayersSelected);
    socket.on('players_deselected', handlePlayersDeselected);
    
    // Other events that just trigger refresh without specific toast logic yet
    socket.on('session_updated', handleGenericEvent);
    socket.on('match_started', handleGenericEvent);
    socket.on('match_ended', handleGenericEvent);

    return () => {
      socket.off('player_created', handlePlayerCreated);
      socket.off('player_updated', handlePlayerUpdated);
      socket.off('player_removed', handlePlayerRemoved);
      socket.off('players_selected', handlePlayersSelected);
      socket.off('players_deselected', handlePlayersDeselected);
      socket.off('session_updated', handleGenericEvent);
      socket.off('match_started', handleGenericEvent);
      socket.off('match_ended', handleGenericEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, session?.id, session?.players, session?.courts]);

  // Initial data fetch
  useEffect(() => {
    if (mode === 'guest' && !propPlayerId) {
      setError('MISSING_PLAYER_ID');
      setLoading(false);
      return;
    }

    if (mode === 'player' && (!propSessionId || !userId)) {
      setError(propSessionId ? 'MISSING_USER_ID' : 'MISSING_SESSION_ID');
      setLoading(false);
      return;
    }

    fetchPlayerData(false); // Initial load, not background refresh
  }, [propPlayerId, propSessionId, userId, mode]);

  // Set up auto-refresh
  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshInterval((prev) => {
        if (prev <= 1) {
          fetchPlayerData(true); // Background refresh to prevent white screen
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [propPlayerId, propSessionId, userId, mode]);

  // Get error message based on error type
  const getErrorMessage = () => {
    switch (error) {
      case 'MISSING_PLAYER_ID':
        return {
          title: t('errors.missingPlayerId'),
          description: t('errors.missingPlayerIdDescription'),
        };
      case 'MISSING_SESSION_ID':
        return {
          title: 'Session ID không hợp lệ',
          description: 'Không tìm thấy thông tin session.',
        };
      case 'MISSING_USER_ID':
        return {
          title: 'Không tìm thấy thông tin người dùng',
          description: 'Vui lòng đăng nhập lại.',
        };
      case 'PLAYER_NOT_FOUND':
        return {
          title: t('errors.playerNotFound'),
          description: t('errors.playerNotFoundDescription'),
        };
      case 'SESSION_NOT_FOUND':
        return {
          title: 'Session không tồn tại',
          description: 'Session này không tồn tại hoặc đã bị xóa.',
        };
      case 'PLAYER_NOT_IN_SESSION':
        return {
          title: 'Bạn chưa tham gia session này',
          description: 'Bạn cần được thêm vào session bởi Host để xem thông tin.',
        };
      default:
        return {
          title: t('errors.loadFailed'),
          description: t('errors.generalErrorDescription'),
        };
    }
  };

  if (loading && !player) {
    return (
      <>
        <TopBar title={t('yourStatus')} />
        <Container maxW="md" py={12}>
          <Flex
            justify="center"
            align="center"
            height="50vh"
            direction="column"
          >
            <Spinner size="xl" color="blue.500" mb={4} />
            <Text>{common('loading')}</Text>
          </Flex>
        </Container>
      </>
    );
  }

  if (error || (!loading && (!player || !session))) {
    const errorMessage = getErrorMessage();
    return (
      <>
        <TopBar title={t('yourStatus')} />
        <Container maxW="md" py={12}>
          <Flex
            justify="center"
            align="center"
            height="50vh"
            direction="column"
          >
            <Box
              as="div"
              p={5}
              borderRadius="md"
              bg="red.50"
              color="red.500"
              mb={4}
              textAlign="center"
            >
              <Heading size="md" mb={2}>
                {errorMessage.title}
              </Heading>
              <Text>{errorMessage.description}</Text>
            </Box>
            <Flex gap={3}>
              <NextLinkButton href={errorRedirectPath} colorScheme="blue">
                {mode === 'guest' ? t('errors.returnToJoin') : 'Quay lại Dashboard'}
              </NextLinkButton>
              {error === 'GENERAL_ERROR' && (
                <NextLinkButton
                  href="#"
                  variant="outline"
                  colorScheme="blue"
                  onClick={(e) => {
                    e.preventDefault();
                    fetchPlayerData(false);
                  }}
                >
                  {common('retry')}
                </NextLinkButton>
              )}
            </Flex>
          </Flex>
        </Container>
      </>
    );
  }
  
  return (
    <>
      <TopBar title={session?.name} />

      <Container pt={'70px'} pb={'80px'}>
        {/* Tab Content */}
        {!player || !session ? (
          <Center>
            <Spinner size="xl" />
          </Center>
        ) : (
          <Box minH="60vh">
            {/* Manual Refresh Button */}
            {/* <Box w="100%" textAlign="right" mb={2}>
              <IconButton
                aria-label="Refresh"
                icon={<Box as={RefreshCw} boxSize={{ base: 3, md: 4 }} />}
                size={{ base: 'xs', md: 'sm' }}
                isLoading={refreshing || loading}
                onClick={() => fetchPlayerData(false)}
                disabled={loading || refreshing}
              />
            </Box> */}

            {/* Status Tab */}
            {activeTab === 0 && (
              <Box
                maxW="2xl"
                mx="auto"
                borderWidth="1px"
                borderRadius="lg"
                mb={6}
                overflow="hidden"
                boxShadow="md"
                transition="all 0.2s"
                _hover={{ boxShadow: 'lg', transform: 'translateY(-2px)' }}
              >
                {/* Card Header */}
                <Box
                  p={4}
                  pb={2}
                  borderBottomWidth="1px"
                  borderBottomColor="gray.100"
                  _dark={{ borderBottomColor: 'gray.700' }}
                >
                  <Flex align="center">
                    <Box as={User} boxSize={5} color="blue.500" mr={2} />
                    <Box>
                      <Heading size="md">{t('yourStatus')}</Heading>
                      <Text color="gray.500" fontSize="sm">
                        {t('statusDescription')}
                      </Text>
                    </Box>
                  </Flex>
                </Box>

                {/* Card Body */}
                <Box p={4}>
                  <Stack gap={4}>
                    {/* Refactored Status Bar with Player Info */}
                    <Box
                      bg="gray.50"
                      _dark={{ bg: 'gray.700' }}
                      p={3}
                      borderRadius="md"
                      textAlign="center"
                      boxShadow="xs"
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text color="red.500" fontWeight="bold" mb={1}>
                        {t('playerInfo', {
                          number: player.playerNumber,
                          name: player.name || `Player ${player.playerNumber}`,
                        })}
                      </Text>
                      {player.status === 'PLAYING' ? (
                        <>
                          <Box mb={1}>
                            <CheckCircle2 size={28} color="#38A169" />
                          </Box>
                          <Text fontWeight="bold" fontSize="md" mb={0.5}>
                            {t('playing.title')}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            {player.currentCourt?.courtName
                              ? `${player.currentCourt.courtName}`
                              : `Court ${
                                  player.currentCourt?.courtNumber || '?'
                                }`}
                            {` - Enjoy your match!`}
                          </Text>
                        </>
                      ) : player.status === 'WAITING' ? (
                        <>
                          <Box mb={1}>
                            <Clock size={28} color="#3182CE" />
                          </Box>
                          <Text fontWeight="bold" fontSize="md" mb={0.5}>
                            {t('waiting.title')}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            {t('waiting.description')}
                          </Text>
                        </>
                      ) : player.status === 'READY' ? (
                        <>
                          <Text fontWeight="bold" fontSize="md" mb={0.5}>
                            {t('ready.title')}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            {t('ready.description')}
                          </Text>
                        </>
                      ) : (
                        <>
                          <Box mb={1}>
                            <CheckCircle2 size={28} color="#A0AEC0" />
                          </Box>
                          <Text fontWeight="bold" fontSize="md" mb={0.5}>
                            {t('finished.title')}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            {t('finished.description')}
                          </Text>
                        </>
                      )}
                    </Box>

                    {/* Court Visual - Show when player is playing or ready */}
                    {(player.status === 'PLAYING' ||
                      player.status === 'READY') &&
                      currentCourt &&
                      courtPlayers.length > 0 && (
                        <Box
                          borderWidth="1px"
                          p={4}
                          borderRadius="md"
                          bg="white"
                          _dark={{ bg: 'gray.800' }}
                          boxShadow="sm"
                          transition="all 0.2s"
                          _hover={{ boxShadow: 'md' }}
                        >
                          <Flex justify="space-between" align="center" mb={3}>
                            <Heading size="sm" color="green.600">
                              {t('court.title', {
                                number: currentCourt.courtNumber,
                              })}
                            </Heading>
                            {currentMatch && (
                              <Text fontSize="sm" color="gray.500">
                                {t('court.elapsed', {
                                  time: formatMatchElapsedTime(
                                    currentMatch.startTime
                                  ),
                                })}
                              </Text>
                            )}
                          </Flex>
                          <BadmintonCourt
                            players={courtPlayers.map((p) => ({
                              ...p,
                              isCurrentPlayer: p.id === player.id,
                            }))}
                            isActive={true}
                            elapsedTime={
                              currentMatch
                                ? formatMatchElapsedTime(currentMatch.startTime)
                                : undefined
                            }
                            courtName={getCourtDisplayName(
                              currentCourt?.courtName,
                              currentCourt?.courtNumber
                            )}
                            width="100%"
                            showTimeInCenter={true}
                            status={currentCourt.status}
                            mode="view"
                          />
                          <Text
                            fontSize="xs"
                            color="gray.500"
                            mt={2}
                            textAlign="center"
                          >
                            {t('court.playerHighlight')}
                          </Text>

                          {/* Show partner information */}
                          {courtPlayers.length > 1 &&
                            (() => {
                              // Helper to infer pair number (first 2 players = pair 1, last 2 = pair 2)
                              const getPairNumber = (idx: number) =>
                                idx < 2 ? 1 : 2;
                              const myIndex = courtPlayers.findIndex(
                                (p) => p.id === player.id
                              );
                              const myPairNumber = getPairNumber(myIndex);
                              const partners = courtPlayers.filter(
                                (p, idx) =>
                                  getPairNumber(idx) === myPairNumber &&
                                  p.id !== player.id
                              );
                              const opponents = courtPlayers.filter(
                                (p, idx) => getPairNumber(idx) !== myPairNumber
                              );

                              return (
                                <Box
                                  mt={3}
                                  p={3}
                                  bg="blue.50"
                                  borderRadius="md"
                                  _dark={{ bg: 'blue.900' }}
                                >
                                  {partners.length > 0 && (
                                    <Box mb={2}>
                                      <Text
                                        fontSize="sm"
                                        fontWeight="semibold"
                                        color="blue.700"
                                        _dark={{ color: 'blue.300' }}
                                        mb={1}
                                      >
                                        🤝 {t('court.partnerWith')}
                                      </Text>
                                      <Flex
                                        justify="center"
                                        wrap="wrap"
                                        gap={2}
                                      >
                                        {partners.map((p) => (
                                          <Text
                                            key={p.id}
                                            fontSize="sm"
                                            color="blue.600"
                                            bg="blue.100"
                                            _dark={{
                                              bg: 'blue.800',
                                              color: 'blue.200',
                                            }}
                                            px={3}
                                            py={1}
                                            borderRadius="md"
                                            fontWeight="medium"
                                          >
                                            #{p.playerNumber}{' '}
                                            {p.name?.split(' ')[0] ||
                                              `P${p.playerNumber}`}
                                          </Text>
                                        ))}
                                      </Flex>
                                    </Box>
                                  )}

                                  {opponents.length > 0 && (
                                    <Box>
                                      <Text
                                        fontSize="sm"
                                        fontWeight="semibold"
                                        color="orange.700"
                                        _dark={{ color: 'orange.300' }}
                                        mb={1}
                                      >
                                        ⚔️ {t('court.opponents')}
                                      </Text>
                                      <Flex
                                        justify="center"
                                        wrap="wrap"
                                        gap={2}
                                      >
                                        {opponents.map((p) => (
                                          <Text
                                            key={p.id}
                                            fontSize="sm"
                                            color="orange.600"
                                            bg="orange.100"
                                            _dark={{
                                              bg: 'orange.800',
                                              color: 'orange.200',
                                            }}
                                            px={3}
                                            py={1}
                                            borderRadius="md"
                                            fontWeight="medium"
                                          >
                                            #{p.playerNumber}{' '}
                                            {p.name?.split(' ')[0] ||
                                              `P${p.playerNumber}`}
                                          </Text>
                                        ))}
                                      </Flex>
                                    </Box>
                                  )}
                                </Box>
                              );
                            })()}
                        </Box>
                      )}

                    <Flex gap={4}>
                      <Box
                        borderWidth="1px"
                        p={3}
                        borderRadius="md"
                        textAlign="center"
                        flex={1}
                        transition="all 0.2s"
                        _hover={{
                          borderColor: 'blue.200',
                          bg: 'blue.50',
                          transform: 'translateY(-2px)',
                        }}
                        _dark={{
                          _hover: { bg: 'blue.900', borderColor: 'blue.700' },
                        }}
                      >
                        <Center mb={1}>
                          <Clock
                            size={16}
                            color="var(--chakra-colors-gray-500)"
                          />
                        </Center>
                        <Text fontSize="xl" fontWeight="semibold">
                          {player.currentWaitTime} {t('stats.minutes')}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {t('stats.currentWait')}
                        </Text>
                      </Box>

                      <Box
                        borderWidth="1px"
                        p={3}
                        borderRadius="md"
                        textAlign="center"
                        flex={1}
                        transition="all 0.2s"
                        _hover={{
                          borderColor: 'blue.200',
                          bg: 'blue.50',
                          transform: 'translateY(-2px)',
                        }}
                        _dark={{
                          _hover: { bg: 'blue.900', borderColor: 'blue.700' },
                        }}
                      >
                        <Center mb={1}>
                          <Users
                            size={16}
                            color="var(--chakra-colors-gray-500)"
                          />
                        </Center>
                        <Text fontSize="xl" fontWeight="semibold">
                          {player.matchesPlayed}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {t('stats.matchesPlayed')}
                        </Text>
                      </Box>
                    </Flex>


                  </Stack>
                </Box>

                {/* Card Footer */}
                <Box p={4} borderTopWidth="1px" textAlign="center">
                  <Text fontSize="xs" color="gray.500">
                    {t('footer')}
                  </Text>
                </Box>
              </Box>
            )}

            {/* Courts Tab */}
            {activeTab === 1 && (
              <CourtsTab
                session={session}
                waitingPlayers={getWaitingPlayers()}
                getCurrentMatch={getCurrentMatch}
                getCourtDisplayName={getCourtDisplayName}
                onDataRefresh={() => fetchPlayerData(true)}
                mode="view"
                formatWaitTime={formatWaitTime}
                selectedPlayers={[]}
              />
            )}

            {/* Players Tab */}
            {activeTab === 2 && (
              <PlayersTab
                sessionPlayers={session.players || []}
                playerFilter={playerFilter}
                setPlayerFilter={setPlayerFilter}
                formatWaitTime={formatWaitTime}
                mode="view"
                sessionId={session.id}
              />
            )}
          </Box>
        )}

        {/* Bottom Navigation Bar */}
        <Box
          position="fixed"
          left={0}
          right={0}
          bottom={0}
          zIndex={100}
          bg="white"
          borderTopWidth="1px"
          boxShadow="md"
          display="flex"
          justifyContent="space-around"
          alignItems="center"
          height="64px"
        >
          <Box
            as="button"
            flex={1}
            py={2}
            onClick={() => setActiveTab(0)}
            display="flex"
            flexDirection="column"
            alignItems="center"
            color={activeTab === 0 ? 'blue.500' : 'gray.500'}
            fontWeight={activeTab === 0 ? 'bold' : 'normal'}
          >
            <Box as={User} boxSize={6} mb={1} />
            Status
          </Box>
          <Box
            as="button"
            flex={1}
            py={2}
            onClick={() => setActiveTab(1)}
            display="flex"
            flexDirection="column"
            alignItems="center"
            color={activeTab === 1 ? 'blue.500' : 'gray.500'}
            fontWeight={activeTab === 1 ? 'bold' : 'normal'}
          >
            <Box as={Activity} boxSize={6} mb={1} />
            Courts
          </Box>
          <Box
            as="button"
            flex={1}
            py={2}
            onClick={() => setActiveTab(2)}
            display="flex"
            flexDirection="column"
            alignItems="center"
            color={activeTab === 2 ? 'blue.500' : 'gray.500'}
            fontWeight={activeTab === 2 ? 'bold' : 'normal'}
          >
            <Box as={Users} boxSize={6} mb={1} />
            Players
          </Box>
        </Box>
      </Container>
    </>
  );
}
