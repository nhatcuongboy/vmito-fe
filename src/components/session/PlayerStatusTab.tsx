import { Box, Center, Flex, Heading, Stack, Text } from '@chakra-ui/react';
import {
  CheckCircle2,
  Clock,
  Handshake,
  Swords,
  User,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import BadmintonCourt from '@/components/court/BadmintonCourt';
import { getCourtDisplayName } from '@/utils/session-helpers';
import {
  type Court,
  type Match,
  type Player,
  SessionStatus,
} from '@/lib/api/types';

interface PlayerStatusTabProps {
  player: Player;
  currentCourt: Court | null;
  currentMatch: Match | null;
  courtPlayers: Player[];
  formatMatchElapsedTime: (startTime: Date | string) => string;
  sessionId?: string;
  sessionStatus?: SessionStatus;
}

export default function PlayerStatusTab({
  player,
  currentCourt,
  currentMatch,
  courtPlayers,
  formatMatchElapsedTime,
  sessionStatus,
}: PlayerStatusTabProps) {
  const t = useTranslations('pages.join.status');
  const isPlaying = player.status === 'PLAYING';
  const isWaiting = player.status === 'WAITING';
  const isReady = player.status === 'READY';
  const isSessionFinished = sessionStatus === SessionStatus.FINISHED;
  const matchElapsedTime = currentMatch
    ? formatMatchElapsedTime(currentMatch.startTime)
    : null;
  const playingCourtLabel =
    player.currentCourt?.courtName ||
    String(player.currentCourt?.courtNumber || '?');
  const statusColor = isPlaying
    ? 'green.600'
    : isWaiting
      ? 'blue.600'
      : isReady
        ? 'orange.600'
        : 'gray.600';
  const footerMessage = isPlaying
    ? t('footerPlaying')
    : isWaiting
      ? t('footerWaiting')
      : t('footerFinished');

  const formatPlayerBadge = (targetPlayer: Player) =>
    `#${targetPlayer.playerNumber} ${
      targetPlayer.name?.trim() || `P${targetPlayer.playerNumber}`
    }`;

  return (
    <Stack maxW="2xl" mx="auto" mb={6} gap={4}>
      <Box
        borderWidth="1px"
        borderRadius="lg"
        overflow="hidden"
        boxShadow="md"
        bg="white"
        _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
      >
        {/* Card Header */}
        {/* <Box
          p={4}
          pb={2}
          borderBottomWidth="1px"
          borderBottomColor="gray.100"
          _dark={{ borderBottomColor: 'gray.700' }}
        >
          <Flex align="center">
            <Box as={User} boxSize={5} color="green.500" mr={2} aria-hidden />
            <Box>
              <Heading size="md">{t('yourStatus')}</Heading>
            </Box>
          </Flex>
        </Box> */}

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
            >
              <Text
                color={statusColor}
                fontWeight="bold"
                mb={2}
                lineClamp={1}
                wordBreak="break-word"
              >
                {t('playerInfo', {
                  number: player.playerNumber,
                  name: player.name || `Player ${player.playerNumber}`,
                })}
              </Text>
              {player.status === 'PLAYING' ? (
                <Stack gap={1} align="center">
                  <Flex align="center" gap={2}>
                    <CheckCircle2 size={20} color="#38A169" />
                    <Text fontWeight="bold" fontSize="md">
                      {t('playing.title')}
                    </Text>
                  </Flex>
                  <Text fontSize="sm" color="gray.600">
                    {t('playing.description', {
                      courtNumber: playingCourtLabel,
                    })}
                  </Text>
                </Stack>
              ) : player.status === 'WAITING' ? (
                <Stack gap={1} align="center">
                  <Flex align="center" gap={2}>
                    <Clock size={20} color="#3182CE" />
                    <Text fontWeight="bold" fontSize="md">
                      {t('waiting.title')}
                    </Text>
                  </Flex>
                  <Text fontSize="sm" color="gray.600">
                    {t('waiting.description')}
                  </Text>
                </Stack>
              ) : player.status === 'READY' ? (
                <Stack gap={1} align="center">
                  <Flex align="center" gap={2}>
                    <Clock size={20} color="#DD6B20" />
                    <Text fontWeight="bold" fontSize="md">
                      {t('ready.title')}
                    </Text>
                  </Flex>
                  <Text fontSize="sm" color="gray.600">
                    {t('ready.description')}
                  </Text>
                </Stack>
              ) : (
                <Stack gap={1} align="center">
                  <Flex align="center" gap={2}>
                    <CheckCircle2 size={20} color="#A0AEC0" />
                    <Text fontWeight="bold" fontSize="md">
                      {t('finished.title')}
                    </Text>
                  </Flex>
                  <Text fontSize="sm" color="gray.600">
                    {t('finished.description')}
                  </Text>
                </Stack>
              )}
            </Box>

            {/* Court Visual - Show when player is playing or ready */}
            {(player.status === 'PLAYING' || player.status === 'READY') &&
              currentCourt &&
              courtPlayers.length > 0 && (
                <Box
                  borderWidth="1px"
                  p={4}
                  borderRadius="md"
                  bg="white"
                  _dark={{ bg: 'gray.800' }}
                  boxShadow="sm"
                >
                  <Flex justify="space-between" align="center" mb={3}>
                    <Heading size="md" color="green.600">
                      {t('court.title', {
                        number: currentCourt.courtNumber,
                      })}
                    </Heading>
                    {matchElapsedTime && (
                      <Flex
                        align="center"
                        gap={1.5}
                        bg="green.50"
                        color="green.700"
                        px={2.5}
                        py={1}
                        borderRadius="full"
                        borderWidth="1px"
                        borderColor="green.200"
                        _dark={{
                          bg: 'green.900/30',
                          color: 'green.200',
                          borderColor: 'green.800',
                        }}
                      >
                        <Box as={Clock} boxSize={3.5} />
                        <Text fontSize="xs" fontWeight="bold">
                          {t('court.elapsed', {
                            time: matchElapsedTime,
                          })}
                        </Text>
                      </Flex>
                    )}
                  </Flex>
                  <BadmintonCourt
                    players={courtPlayers.map((p) => ({
                      ...p,
                      isCurrentPlayer: p.id === player.id,
                    }))}
                    isActive={true}
                    elapsedTime={matchElapsedTime ?? undefined}
                    courtName={getCourtDisplayName(
                      currentCourt?.courtName,
                      currentCourt?.courtNumber
                    )}
                    width="100%"
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
                  {/* <Flex
                    mt={2}
                    gap={3}
                    wrap="wrap"
                    justify="center"
                    fontSize="xs"
                    color="gray.600"
                  >
                    <Flex align="center" gap={1}>
                      <Box
                        boxSize={2.5}
                        borderRadius="full"
                        bg="white"
                        borderWidth="1px"
                        borderColor="blue.300"
                        aria-hidden
                      />
                      <Text>{t('court.legend.you')}</Text>
                    </Flex>
                    <Flex align="center" gap={1}>
                      <Box
                        boxSize={2.5}
                        borderRadius="full"
                        bg="green.200"
                        aria-hidden
                      />
                      <Text>{t('court.legend.teammate')}</Text>
                    </Flex>
                    <Flex align="center" gap={1}>
                      <Box
                        boxSize={2.5}
                        borderRadius="full"
                        bg="orange.200"
                        aria-hidden
                      />
                      <Text>{t('court.legend.opponent')}</Text>
                    </Flex>
                  </Flex> */}

                  {/* Show partner information */}
                  {courtPlayers.length > 1 &&
                    (() => {
                      // Helper to infer pair number (first 2 players = pair 1, last 2 = pair 2)
                      const getPairNumber = (idx: number) => (idx < 2 ? 1 : 2);
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
                          bg="brand.50"
                          borderRadius="md"
                          _dark={{ bg: 'brand.900' }}
                        >
                          {partners.length > 0 && (
                            <Box mb={2}>
                              <Flex
                                align="center"
                                justify="center"
                                gap={1.5}
                                fontSize="sm"
                                fontWeight="semibold"
                                color="green.700"
                                _dark={{ color: 'brand.300' }}
                                mb={1}
                              >
                                <Box as={Handshake} boxSize={4} aria-hidden />
                                <Text as="span">{t('court.partnerWith')}</Text>
                              </Flex>
                              <Flex justify="center" wrap="wrap" gap={2}>
                                {partners.map((p) => (
                                  <Text
                                    key={p.id}
                                    fontSize="sm"
                                    color="green.600"
                                    bg="brand.100"
                                    _dark={{
                                      bg: 'brand.800',
                                      color: 'brand.200',
                                    }}
                                    px={3}
                                    py={1}
                                    borderRadius="md"
                                    fontWeight="medium"
                                    lineClamp={1}
                                    maxW="full"
                                  >
                                    {formatPlayerBadge(p)}
                                  </Text>
                                ))}
                              </Flex>
                            </Box>
                          )}

                          {opponents.length > 0 && (
                            <Box>
                              <Flex
                                align="center"
                                justify="center"
                                gap={1.5}
                                fontSize="sm"
                                fontWeight="semibold"
                                color="orange.700"
                                _dark={{ color: 'orange.300' }}
                                mb={1}
                              >
                                <Box as={Swords} boxSize={4} aria-hidden />
                                <Text as="span">{t('court.opponents')}</Text>
                              </Flex>
                              <Flex justify="center" wrap="wrap" gap={2}>
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
                                    lineClamp={1}
                                    maxW="full"
                                  >
                                    {formatPlayerBadge(p)}
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
              >
                <Center mb={1}>
                  <Clock size={16} color="var(--chakra-colors-gray-500)" />
                </Center>
                <Text fontSize="xl" fontWeight="semibold">
                  {isPlaying && matchElapsedTime
                    ? matchElapsedTime
                    : `${player.currentWaitTime} ${t('stats.minutes')}`}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {isPlaying && matchElapsedTime
                    ? t('stats.matchElapsed')
                    : t('stats.currentWait')}
                </Text>
              </Box>

              <Box
                borderWidth="1px"
                p={3}
                borderRadius="md"
                textAlign="center"
                flex={1}
              >
                <Center mb={1}>
                  <Users size={16} color="var(--chakra-colors-gray-500)" />
                </Center>
                <Text fontSize="xl" fontWeight="semibold">
                  {isWaiting && player.position
                    ? `#${player.position}`
                    : player.matchesPlayed}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {isWaiting && player.position
                    ? t('queue.position')
                    : t('stats.matchesPlayed')}
                </Text>
              </Box>
            </Flex>
          </Stack>
        </Box>

        {/* Card Footer */}
        <Box p={4} borderTopWidth="1px" textAlign="center">
          <Text fontSize="xs" color="gray.500">
            {footerMessage}
          </Text>
        </Box>
      </Box>
    </Stack>
  );
}
