'use client';

import BadmintonCourt from '@/components/court/BadmintonCourt';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import { UserRole, PlayerStatus } from '@/lib/api/types';
import CourtsTab from '@/components/session/CourtsTab';
import PlayersTab, { PlayerFilter } from '@/components/session/PlayersTab';
import { IconButton } from '@/components/ui/chakra-compat';
import { NextLinkButton } from '@/components/ui/NextLinkButton';
import TopBar from '@/components/ui/TopBar';
import { SessionService } from '@/lib/api/session.service';
import { PlayerService } from '@/lib/api/player.service';
import { type Court, type Match, type Player } from '@/lib/api/types';
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
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { toaster } from '@/components/ui/toaster';
import { ISession } from '@/lib/api/types';

// Constants
const REFRESH_INTERVAL_SECONDS = 60;
const BACKGROUND_REFRESH_MS = 1000;

// Enums
enum PageError {
  MISSING_PLAYER_ID = 'MISSING_PLAYER_ID',
  PLAYER_NOT_FOUND = 'PLAYER_NOT_FOUND',
  GENERAL_ERROR = 'GENERAL_ERROR',
}

enum StatusPageTab {
  STATUS = 0,
  COURTS = 1,
  PLAYERS = 2,
}

function StatusPageContent() {
  const searchParams = useSearchParams();
  const playerId = searchParams.get('playerId');
  const t = useTranslations('pages.join.status');
  const common = useTranslations('common');
  // const { data: sessionData } = useSession();
  // console.log(sessionData);
  const [refreshInterval, setRefreshInterval] = useState(
    REFRESH_INTERVAL_SECONDS
  );
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // For background refresh
  const [error, setError] = useState<PageError | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [session, setSession] = useState<ISession | null>(null);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [currentCourt, setCurrentCourt] = useState<Court | null>(null);
  const [courtPlayers, setCourtPlayers] = useState<Player[]>([]);
  const [activeTab, setActiveTab] = useState<StatusPageTab>(
    StatusPageTab.STATUS
  );
  const [playerFilter, setPlayerFilter] = useState<PlayerFilter>([]);

  // Helper function to format elapsed time for match display
  const formatMatchElapsedTime = (startTime: Date): string => {
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
  const getCurrentMatch = (courtId: string): any => {
    // For player status page, we'll get match info from court data
    const courtData = session?.courts?.find((c) => c.id === courtId);
    return courtData?.currentMatch || null;
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
    return (
      session?.players?.filter((p) => p.status === PlayerStatus.WAITING) || []
    );
  };

  // Helper function to get active courts
  const getActiveCourts = () => {
    return (
      session?.courts
        ?.filter((court) => court.currentMatch)
        .map((court) => ({
          ...court,
          currentPlayers: court.currentPlayers || [],
        })) || []
    );
  };

  // Function to fetch player data
  const fetchPlayerData = async (isBackgroundRefresh = false) => {
    if (!playerId) return;

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

      const playerData = await PlayerService.getPlayer(playerId);

      // Only update player state if we got valid data
      if (playerData) {
        setPlayer(playerData);
      }

      // Fetch session data
      if (playerData?.sessionId) {
        const sessionData = await SessionService.getSession(
          playerData.sessionId
        );

        // Only update session state if we got valid data
        if (sessionData) {
          setSession(sessionData);

          // Get match and court info if player is playing or ready
          if (
            (playerData.status === PlayerStatus.PLAYING ||
              playerData.status === PlayerStatus.READY) &&
            playerData.currentCourtId
          ) {
            const court = sessionData.courts?.find(
              (c) => c.id === playerData.currentCourtId
            );
            if (court) {
              setCurrentCourt(court);
              setCourtPlayers(court.currentPlayers || []);

              // Get the current match from the court
              if (court.currentMatch) {
                setCurrentMatch(court.currentMatch);
              }
            }
          } else {
            // Clear match and court info if not playing or ready
            setCurrentMatch(null);
            setCurrentCourt(null);
            setCourtPlayers([]);
          }
        }
      }

      // Clear error state after successful fetch
      setError(null);
    } catch (error: any) {
      console.error('Error fetching player data:', error);

      // Handle different types of errors
      if (error.response?.status === 404) {
        // Only set error for initial load, not background refresh
        if (!isBackgroundRefresh) {
          setError(PageError.PLAYER_NOT_FOUND);
        }
      } else {
        // Only show toast for background refresh errors
        if (isBackgroundRefresh) {
          toaster.error({
            title: t('errors.refreshFailed') || 'Không thể cập nhật dữ liệu',
          });
          // Don't set error state for background refresh failures
        } else {
          setError(PageError.GENERAL_ERROR);
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

  // Initial data fetch
  useEffect(() => {
    if (!playerId) {
      setError(PageError.MISSING_PLAYER_ID);
      setLoading(false);
      return;
    }

    fetchPlayerData(false); // Initial load, not background refresh
  }, [playerId, t]);

  // Set up auto-refresh
  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshInterval((prev) => {
        if (prev <= 1) {
          fetchPlayerData(true); // Background refresh to prevent white screen
          return REFRESH_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, BACKGROUND_REFRESH_MS);

    return () => clearInterval(timer);
  }, [playerId]);

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
            <Spinner size="xl" color="green.500" mb={4} />
            <Text>{common('loading')}</Text>
          </Flex>
        </Container>
      </>
    );
  }

  if (error || (!loading && (!player || !session))) {
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
                {error === PageError.MISSING_PLAYER_ID
                  ? t('errors.missingPlayerId')
                  : error === PageError.PLAYER_NOT_FOUND
                    ? t('errors.playerNotFound')
                    : t('errors.loadFailed')}
              </Heading>
              <Text>
                {error === PageError.MISSING_PLAYER_ID
                  ? t('errors.missingPlayerIdDescription')
                  : error === PageError.PLAYER_NOT_FOUND
                    ? t('errors.playerNotFoundDescription')
                    : t('errors.generalErrorDescription')}
              </Text>
            </Box>
            <Flex gap={3}>
              <NextLinkButton href="/join" colorPalette="green">
                {t('errors.returnToJoin')}
              </NextLinkButton>
              {error === PageError.GENERAL_ERROR && (
                <NextLinkButton
                  href="#"
                  variant="outline"
                  colorPalette="green"
                  onClick={(e) => {
                    e.preventDefault();
                    fetchPlayerData(false); // Initial load for retry
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

      <Container maxW="3xl" pt={'70px'} pb={'80px'}>
        {/* Tab Content */}
        {!player || !session ? (
          <Center>
            <Spinner size="xl" />
          </Center>
        ) : (
          <Box minH="60vh">
            {/* Manual Refresh Button */}
            <Box w="100%" textAlign="right" mb={2}>
              <IconButton
                aria-label="Refresh"
                icon={<Box as={RefreshCw} boxSize={{ base: 3, md: 4 }} />}
                size={{ base: 'xs', md: 'sm' }}
                isLoading={refreshing || loading}
                onClick={() => fetchPlayerData(false)}
                disabled={loading || refreshing}
              />
            </Box>

            {/* Status Tab */}
            {activeTab === StatusPageTab.STATUS && (
              <Box
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
                    <Box as={User} boxSize={5} color="green.500" mr={2} />
                    <Box>
                      <Heading size="md">{t('yourStatus')}</Heading>
                      {/* <Text color="gray.500" fontSize="sm">
                        {t('statusDescription')}
                      </Text> */}
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
                      {player.status === PlayerStatus.PLAYING ? (
                        <>
                          <Box mb={1}>
                            <CheckCircle2
                              size={28}
                              color="var(--chakra-colors-green-500)"
                            />
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
                      ) : player.status === PlayerStatus.WAITING ? (
                        <>
                          <Box mb={1}>
                            <Clock
                              size={28}
                              color="var(--chakra-colors-blue-500)"
                            />
                          </Box>
                          <Text fontWeight="bold" fontSize="md" mb={0.5}>
                            {t('waiting.title')}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            {t('waiting.description')}
                          </Text>
                        </>
                      ) : player.status === PlayerStatus.READY ? (
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
                            <CheckCircle2
                              size={28}
                              color="var(--chakra-colors-gray-400)"
                            />
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
                    {(player.status === PlayerStatus.PLAYING ||
                      player.status === PlayerStatus.READY) &&
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
                                        color="green.700"
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
                                            color="green.600"
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
            {activeTab === StatusPageTab.COURTS && (
              <CourtsTab
                session={session}
                waitingPlayers={getWaitingPlayers()}
                getCurrentMatch={getCurrentMatch}
                getCourtDisplayName={getCourtDisplayName}
                onDataRefresh={() => fetchPlayerData(true)} // Use background refresh
                mode="view" // Set to view mode for player status page
                formatWaitTime={formatWaitTime}
                selectedPlayers={[]}
              />
            )}

            {/* Players Tab */}
            {activeTab === StatusPageTab.PLAYERS && (
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
            onClick={() => setActiveTab(StatusPageTab.STATUS)}
            display="flex"
            flexDirection="column"
            alignItems="center"
            color={activeTab === StatusPageTab.STATUS ? 'blue.500' : 'gray.500'}
            fontWeight={activeTab === StatusPageTab.STATUS ? 'bold' : 'normal'}
          >
            <Box as={User} boxSize={6} mb={1} />
            Status
          </Box>
          <Box
            as="button"
            flex={1}
            py={2}
            onClick={() => setActiveTab(StatusPageTab.COURTS)}
            display="flex"
            flexDirection="column"
            alignItems="center"
            color={activeTab === StatusPageTab.COURTS ? 'blue.500' : 'gray.500'}
            fontWeight={activeTab === StatusPageTab.COURTS ? 'bold' : 'normal'}
          >
            <Box as={Activity} boxSize={6} mb={1} />
            Courts
          </Box>
          <Box
            as="button"
            flex={1}
            py={2}
            onClick={() => setActiveTab(StatusPageTab.PLAYERS)}
            display="flex"
            flexDirection="column"
            alignItems="center"
            color={
              activeTab === StatusPageTab.PLAYERS ? 'blue.500' : 'gray.500'
            }
            fontWeight={activeTab === StatusPageTab.PLAYERS ? 'bold' : 'normal'}
          >
            <Box as={Users} boxSize={6} mb={1} />
            Players
          </Box>
        </Box>
      </Container>
    </>
  );
}

export default function StatusPage() {
  return (
    <ProtectedRouteGuard requiredRole={[UserRole.GUEST]}>
      <Suspense
        fallback={
          <Center>
            <Spinner size="xl" />
          </Center>
        }
      >
        <StatusPageContent />
      </Suspense>
    </ProtectedRouteGuard>
  );
}
