import { Box, Center, Flex, Heading, Stack, Text } from '@chakra-ui/react';
import { CheckCircle2, Clock, User, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import BadmintonCourt from '@/components/court/BadmintonCourt';
import { getCourtDisplayName } from '@/utils/session-helpers';
import { type Court, type Match, type Player } from '@/lib/api/types';

interface PlayerStatusTabProps {
  player: Player;
  currentCourt: Court | null;
  currentMatch: Match | null;
  courtPlayers: Player[];
  formatMatchElapsedTime: (startTime: Date | string) => string;
  sessionId?: string;
}

export default function PlayerStatusTab({
  player,
  currentCourt,
  currentMatch,
  courtPlayers,
  formatMatchElapsedTime,
}: PlayerStatusTabProps) {
  const t = useTranslations('pages.join.status');

  return (
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
                    : `Court ${player.currentCourt?.courtNumber || '?'}`}
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
                        time: formatMatchElapsedTime(currentMatch.startTime),
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
                <Text fontSize="xs" color="gray.500" mt={2} textAlign="center">
                  {t('court.playerHighlight')}
                </Text>

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
                            <Flex justify="center" wrap="wrap" gap={2}>
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
                <Clock size={16} color="var(--chakra-colors-gray-500)" />
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
                <Users size={16} color="var(--chakra-colors-gray-500)" />
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
  );
}
