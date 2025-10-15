'use client';

import { Button } from '@/components/ui/chakra-compat';
import TopBar from '@/components/ui/TopBar';
import { useRouter } from '@/i18n/config';
import { SessionService } from '@/lib/api/session.service';
import { PlayerService } from '@/lib/api/player.service';
import {
  Box,
  Container,
  Flex,
  Heading,
  Input,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import { Activity, ArrowRight, Hash, LogIn, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ISession } from '@/lib/api/types';

const formatRangeTime = (
  startTime?: string | Date,
  endTime?: string | Date
) => {
  return `${dayjs(startTime).format('HH:mm')}-${dayjs(endTime).format(
    'HH:mm'
  )}`;
};

export default function JoinPage() {
  const t = useTranslations('pages.join');
  const common = useTranslations('common');
  const router = useRouter();

  const [sessionId, setSessionId] = useState('');
  const [playerNumber, setPlayerNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessions, setSessions] = useState<ISession[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [selectedSession, setSelectedSession] = useState<ISession | null>(null);
  const [existingPlayers, setExistingPlayers] = useState<any[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);

  // Fetch available sessions on component mount
  useEffect(() => {
    async function fetchSessions() {
      try {
        setLoadingSessions(true);
        const sessionsData = await SessionService.getAllSessions();
        const availableSessions = sessionsData.filter(
          (session) =>
            session.status === 'PREPARING' || session.status === 'IN_PROGRESS'
        );
        setSessions(availableSessions);
      } catch (error) {
        console.error('Error fetching sessions:', error);
        toast.error(t('errors.failedToLoadSessions'));
      } finally {
        setLoadingSessions(false);
      }
    }

    fetchSessions();
  }, []);

  // Handle session selection change
  const handleSessionChange = async (e: any) => {
    const selectedId = e.target.value;
    setSessionId(selectedId);
    setPlayerNumber('');
    setSelectedPlayer(null);

    if (!selectedId) {
      setSelectedSession(null);
      setExistingPlayers([]);
      return;
    }

    try {
      setLoading(true);
      const sessionData = await SessionService.getSession(selectedId);
      setSelectedSession(sessionData);
      const players = sessionData.players || [];
      // Show all players, not just pre-filled ones
      setExistingPlayers(players);
    } catch (error) {
      console.error('Error fetching session details:', error);
      toast.error(t('errors.failedToLoadSessionDetails'));
    } finally {
      setLoading(false);
    }
  };

  // Handle player selection
  const handlePlayerChange = (e: any) => {
    const selectedPlayerNumber = e.target.value;
    setPlayerNumber(selectedPlayerNumber);

    if (!selectedPlayerNumber) {
      setSelectedPlayer(null);
      return;
    }

    const player = existingPlayers.find(
      (p) => p.playerNumber.toString() === selectedPlayerNumber
    );
    setSelectedPlayer(player || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sessionId || !playerNumber || !selectedPlayer) {
      toast.error(t('errors.missingFields'));
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if player requires confirmation info
      if (
        selectedPlayer.requireConfirmInfo &&
        !selectedPlayer.confirmedByPlayer
      ) {
        // Navigate to confirm page if player info is required
        router.push(
          `/join/confirm?sessionId=${sessionId}&playerNumber=${playerNumber}&playerId=${selectedPlayer.id}`
        );
      } else {
        // If no confirmation required, directly confirm the player and go to status page
        // Automatically confirm the player without additional info
        await PlayerService.confirmPlayer(selectedPlayer.id, {
          confirmedByPlayer: true,
        });

        // Navigate directly to status page
        router.push(`/my-session`);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(t('errors.somethingWentWrong'));
      setIsSubmitting(false);
    }
  };

  return (
    <Box minH="100vh">
      {/* Top Bar */}
      <TopBar showBackButton={true} backHref="/" title={t('title')} />

      <Container maxW="md" py={12} pt={24}>
        <Box
          borderRadius="xl"
          overflow="hidden"
          boxShadow="lg"
          borderWidth="1px"
          bg="white"
          _dark={{ bg: 'gray.800' }}
          transition="all 0.2s"
          _hover={{
            transform: 'translateY(-3px)',
            boxShadow: 'xl',
          }}
          position="relative"
        >
          {/* Decorative element */}
          <Box
            position="absolute"
            top={-3}
            right={-3}
            boxSize={16}
            bg="blue.400"
            borderRadius="full"
            opacity={0.2}
            zIndex={0}
          />

          <Box
            bg="blue.50"
            _dark={{ bg: 'blue.900' }}
            borderBottomWidth="1px"
            px={6}
            py={5}
            position="relative"
            zIndex={1}
          >
            <Flex align="center" mb={2}>
              <Box as={LogIn} boxSize={5} color="blue.500" mr={2} />
              <Heading size="md">{t('joinBadmintonSession')}</Heading>
            </Flex>
            <Text color="gray.500" fontSize="sm">
              {t('description')}
            </Text>
          </Box>

          <Box p={6} position="relative" zIndex={1}>
            <form onSubmit={handleSubmit}>
              <Stack gap={6}>
                <Box>
                  <Box mb={2}>
                    <Flex align="center">
                      <Box as={Hash} boxSize={4} color="blue.500" mr={2} />
                      <Text fontWeight="medium">
                        {t('selectSession')}
                        <Box as="span" color="red.500">
                          *
                        </Box>
                      </Text>
                    </Flex>
                  </Box>
                  {loadingSessions ? (
                    <Flex justify="center" py={4}>
                      <Spinner color="blue.500" />
                    </Flex>
                  ) : (
                    <select
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        borderWidth: '1px',
                        borderColor: '#CBD5E0',
                      }}
                      value={sessionId}
                      onChange={handleSessionChange}
                      required
                    >
                      <option value="">{t('selectAvailableSession')}</option>
                      {sessions.length === 0 ? (
                        <option disabled>{t('noAvailableSessions')}</option>
                      ) : (
                        sessions.map((session) => (
                          <option key={session.id} value={session.id}>
                            {session.name} (
                            {formatRangeTime(
                              session.startTime,
                              session.endTime
                            )}
                            )
                          </option>
                        ))
                      )}
                    </select>
                  )}
                  {selectedSession && (
                    <Box mt={2} p={2} bg="blue.50" borderRadius="md">
                      <Text fontSize="sm" color="blue.600">
                        {t('sessionInfo', {
                          host: selectedSession.host.name,
                          courts: selectedSession.numberOfCourts,
                          players: selectedSession.players?.length || 0,
                        })}
                      </Text>
                    </Box>
                  )}
                </Box>

                <Box>
                  <Box mb={2}>
                    <Flex align="center">
                      <Box as={Users} boxSize={4} color="blue.500" mr={2} />
                      <Text fontWeight="medium">
                        {t('playerNumber')}
                        <Box as="span" color="red.500">
                          *
                        </Box>
                      </Text>
                    </Flex>
                  </Box>
                  {loading ? (
                    <Flex justify="center" py={4}>
                      <Spinner color="blue.500" />
                    </Flex>
                  ) : (
                    <>
                      {selectedSession ? (
                        existingPlayers.length > 0 ? (
                          <select
                            style={{
                              width: '100%',
                              padding: '12px',
                              borderRadius: '8px',
                              borderWidth: '1px',
                              borderColor: '#CBD5E0',
                            }}
                            value={playerNumber}
                            onChange={handlePlayerChange}
                            required
                          >
                            <option value="">
                              {t('selectYourPlayerNumber')}
                            </option>
                            {existingPlayers.map((player) => (
                              <option
                                key={player.id}
                                value={player.playerNumber}
                              >
                                {t('playerNumberFormat', {
                                  number: player.playerNumber,
                                })}{' '}
                                {player.name ? `(${player.name})` : ''}
                                {/* {player.confirmedByPlayer
                                  ? ` - ${t("alreadyConfirmed")}`
                                  : ""} */}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <Box
                            p={3}
                            bg="yellow.50"
                            color="yellow.700"
                            borderRadius="md"
                          >
                            <Text>{t('noPlayersAvailable')}</Text>
                          </Box>
                        )
                      ) : (
                        <Input
                          placeholder={t('selectSessionFirst')}
                          disabled
                          borderColor="gray.300"
                          size="lg"
                          borderRadius="md"
                        />
                      )}

                      {/* Player info preview */}
                      {selectedPlayer && (
                        <Box
                          mt={3}
                          p={3}
                          bg={
                            selectedPlayer?.requireConfirmInfo &&
                            !selectedPlayer.confirmedByPlayer
                              ? 'yellow.50'
                              : 'blue.50'
                          }
                          borderRadius="md"
                        >
                          <Text fontWeight="medium" mb={1}>
                            {t('playerInformation')}
                          </Text>
                          <Stack gap={1} fontSize="sm">
                            <Text>
                              {t('number')}:{' '}
                              <strong>#{selectedPlayer.playerNumber}</strong>
                            </Text>
                            {selectedPlayer.name && (
                              <Text>
                                {t('name')}:{' '}
                                <strong>{selectedPlayer.name}</strong>
                              </Text>
                            )}
                            {selectedPlayer.gender && (
                              <Text>
                                {t('gender')}:{' '}
                                <strong>
                                  {selectedPlayer.gender === 'MALE'
                                    ? t('male')
                                    : t('female')}
                                </strong>
                              </Text>
                            )}
                            {selectedPlayer.phone && (
                              <Text>
                                {t('phone')}:{' '}
                                <strong>{selectedPlayer.phone}</strong>
                              </Text>
                            )}
                            <Text>
                              {t('status.yourStatus')}:{' '}
                              <strong
                                color={
                                  selectedPlayer.confirmedByPlayer
                                    ? 'orange.600'
                                    : 'green.600'
                                }
                              >
                                {selectedPlayer?.requireConfirmInfo &&
                                !selectedPlayer.confirmedByPlayer
                                  ? t('needConfirmation')
                                  : t('alreadyConfirmed')}
                              </strong>
                            </Text>
                          </Stack>
                          {/* {selectedPlayer.confirmedByPlayer && (
                            <Box mt={2} p={2} bg="orange.100" borderRadius="md">
                              <Text fontSize="xs" color="orange.700">
                                ⚠️ {t("playerAlreadyJoinedWarning")}
                              </Text>
                            </Box>
                          )} */}
                        </Box>
                      )}
                    </>
                  )}
                  <Text fontSize="sm" color="gray.500" mt={2}>
                    {t('selectPlayerHelpText')}
                  </Text>
                </Box>

                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  width="full"
                  mt={4}
                  loading={isSubmitting}
                  disabled={!sessionId || !playerNumber || isSubmitting}
                >
                  <Flex align="center" justify="center" width="100%">
                    {isSubmitting
                      ? t('processing')
                      : selectedPlayer?.requireConfirmInfo &&
                          !selectedPlayer.confirmedByPlayer
                        ? t('continueToConfirm')
                        : t('joinNow')}
                    {!isSubmitting && (
                      <Box as={ArrowRight} ml={2} boxSize={5} />
                    )}
                  </Flex>
                </Button>
              </Stack>
            </form>
          </Box>

          <Box
            bg="gray.50"
            _dark={{ bg: 'gray.700' }}
            borderTopWidth="1px"
            p={6}
            display="flex"
            justifyContent="center"
            position="relative"
            zIndex={1}
          >
            <Flex direction="column" align="center">
              <Text fontSize="sm" color="gray.500" textAlign="center">
                {t('hostMustAddYou')}
              </Text>
              <Box
                as={Activity}
                boxSize={4}
                color="blue.400"
                mt={2}
                opacity={0.7}
                transform="rotate(0deg)"
                transition="all 0.3s ease-in-out"
                _hover={{
                  opacity: 1,
                  transform: 'rotate(30deg) scale(1.2)',
                }}
              />
            </Flex>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
