import React from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button as CompatButton,
} from '@/components/ui/chakra-compat';
import { CourtDirection, ISession, Player } from '@/lib/api/types';
import { Court, Match } from '@/types/session';
import {
  Badge,
  Box,
  Flex,
  Heading,
  HStack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Clock, Play, Plus, Shuffle, Square, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import BadmintonCourt from '../court/BadmintonCourt';

interface CourtCardProps {
  court: Court;
  currentMatch: Match | null;
  session: ISession;
  mode: 'manage' | 'view';
  isRefreshing: boolean;
  waitingPlayers: Player[];

  // Handlers
  onAssignPlayersClick: (court: Court) => void;
  onPreSelectClick: (court: Court) => void;
  onStartMatch: (courtId: string) => Promise<void>;
  onDeselectPlayers: (courtId: string) => Promise<void>;
  onCancelPreSelect: (courtId: string) => Promise<void>;
  onEndMatch: (match: Match) => void;

  // Formatters and utilities
  elapsedTimeFormatter: (startTime: string) => string;
  getCourtDisplayName: (
    courtName: string | undefined,
    courtNumber: number
  ) => string;
  hasPreSelectedPlayers: (court: Court) => boolean;

  // Loading states
  loadingStartMatchCourtId: string | null;
  loadingCancelCourtId: string | null;
  loadingCancelPreSelect: string | null;
  loadingEndMatchId: string | null;
}

const CourtCard: React.FC<CourtCardProps> = ({
  court,
  currentMatch,
  session,
  mode,
  isRefreshing,
  waitingPlayers,
  onAssignPlayersClick,
  onPreSelectClick,
  onStartMatch,
  onDeselectPlayers,
  onCancelPreSelect,
  onEndMatch,
  elapsedTimeFormatter,
  getCourtDisplayName,
  hasPreSelectedPlayers,
  loadingStartMatchCourtId,
  loadingCancelCourtId,
  loadingCancelPreSelect,
  loadingEndMatchId,
}) => {
  const t = useTranslations('SessionDetail');

  const isActive = court.status === 'IN_USE' || court.status === 'READY';
  const isCourtReady = court.status === 'READY';

  const handleEndMatchClick = () => {
    if (currentMatch) {
      // Construct players from court.currentPlayers to ensure consistency with visual display
      // MatchResultModal expects MatchPlayer[] structure
      const matchPlayers = (court.currentPlayers || []).map((player) => ({
        id: `mp-${player.id}`,
        matchId: currentMatch.id,
        playerId: player.id,
        position: player.courtPosition ?? 0,
        player: player,
      }));

      const matchWithCourt = {
        ...currentMatch,
        players: matchPlayers,
        court: {
          ...court,
          direction: court.direction || CourtDirection.HORIZONTAL,
        },
      };
      onEndMatch(matchWithCourt as Match);
    }
  };

  return (
    <Card key={court.id} variant="outline" boxShadow="md">
      <CardHeader
        bg={
          isCourtReady
            ? { base: 'yellow.50', _dark: 'yellow.900/20' }
            : isActive
              ? { base: 'green.50', _dark: 'green.900/20' }
              : { base: 'gray.50', _dark: 'whiteAlpha.50' }
        }
        p={4}
        boxShadow="md"
        transition="all 0.2s ease-in-out"
        _hover={{
          boxShadow: 'lg',
          borderColor: isCourtReady
            ? 'yellow.300'
            : isActive
              ? 'green.300'
              : 'gray.300',
          transform: 'translateY(-1px)',
        }}
      >
        <Flex justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={3}>
            <Box
              w={8}
              h={8}
              borderRadius="full"
              bg={
                isCourtReady
                  ? 'yellow.500'
                  : isActive
                    ? 'green.500'
                    : 'gray.500'
              }
              display="flex"
              alignItems="center"
              justifyContent="center"
              color="white"
              fontWeight="bold"
              fontSize="sm"
              boxShadow="sm"
            >
              {court.courtNumber}
            </Box>
            <Heading
              size="md"
              fontWeight="semibold"
              color={
                isCourtReady
                  ? { base: 'yellow.700', _dark: 'yellow.400' }
                  : isActive
                    ? { base: 'green.700', _dark: 'green.400' }
                    : { base: 'gray.700', _dark: 'gray.400' }
              }
            >
              {court.courtName ??
                t('courtsTab.courtNumber', {
                  number: court.courtNumber,
                })}
            </Heading>
          </Box>

          <HStack gap={2} alignItems="center">
            {currentMatch && court.status === 'IN_USE' && (
              <Badge
                colorPalette="green"
                variant="solid"
                display="flex"
                alignItems="center"
                gap={1}
                fontSize="xs"
                px={1.5}
                py={0.5}
                borderRadius="md"
                minWidth="48px"
                minHeight="20px"
                lineHeight={1.2}
                style={{ letterSpacing: 0.2 }}
              >
                <Box as={Clock} boxSize={3} />
                {currentMatch.startTime
                  ? elapsedTimeFormatter(
                      new Date(currentMatch.startTime).toISOString()
                    )
                  : '-'}
              </Badge>
            )}
            <Badge
              colorPalette={
                isCourtReady ? 'yellow' : isActive ? 'green' : 'gray'
              }
              variant="solid"
              fontSize="xs"
              px={1.5}
              py={0.5}
              borderRadius="md"
              fontWeight="semibold"
              minWidth="48px"
              minHeight="20px"
              lineHeight={1.2}
              style={{ letterSpacing: 0.2 }}
            >
              {isCourtReady
                ? t('courtsTab.ready')
                : isActive
                  ? t('courtsTab.inUse')
                  : t('courtsTab.empty')}
            </Badge>
            {hasPreSelectedPlayers(court) && (
              <Badge
                colorPalette="purple"
                variant="solid"
                fontSize="xs"
                px={1.5}
                py={0.5}
                borderRadius="md"
                fontWeight="semibold"
                minWidth="48px"
                minHeight="20px"
                lineHeight={1.2}
                style={{ letterSpacing: 0.2 }}
              >
                {t('courtsTab.nextSelected')}
              </Badge>
            )}
          </HStack>
        </Flex>
      </CardHeader>

      <CardBody pt={0} pb={0} px={0}>
        {isActive && (court.currentPlayers?.length ?? 0) > 0 ? (
          <VStack gap={4}>
            <BadmintonCourt
              players={court.currentPlayers || []}
              isActive={isActive}
              elapsedTime={
                currentMatch
                  ? elapsedTimeFormatter(
                      new Date(currentMatch.startTime).toISOString()
                    )
                  : t('courtsTab.playing')
              }
              courtName={getCourtDisplayName(
                court.courtName,
                court.courtNumber
              )}
              courtNumber={court.courtNumber}
              width="100%"
              isLoading={isRefreshing}
              status={court.status}
              mode={mode}
              courtColor={session.courtColor}
              direction={court.direction || CourtDirection.HORIZONTAL}
            />

            {/* Action buttons for courts with players */}
            <VStack gap={2} pb={4} width="100%">
              {/* Start Match button */}
              {session.status === 'IN_PROGRESS' &&
                mode === 'manage' &&
                court.status === 'READY' &&
                !court.currentMatchId && (
                  <CompatButton
                    size="sm"
                    colorPalette="green"
                    loading={loadingStartMatchCourtId === court.id}
                    onClick={() => onStartMatch(court.id)}
                    disabled={isRefreshing}
                  >
                    <Box as={Play} boxSize={4} mr={1} />
                    {t('startMatch')}
                  </CompatButton>
                )}

              {/* Cancel button */}
              {session.status === 'IN_PROGRESS' &&
                mode === 'manage' &&
                court.status === 'READY' &&
                (court.currentPlayers?.length ?? 0) > 0 && (
                  <CompatButton
                    size="sm"
                    colorPalette="red"
                    variant="outline"
                    loading={loadingCancelCourtId === court.id}
                    onClick={() => onDeselectPlayers(court.id)}
                    disabled={isRefreshing}
                  >
                    <Box as={X} boxSize={4} mr={1} />
                    {t('courtsTab.cancel')}
                  </CompatButton>
                )}

              {/* Pre-select button */}
              {session.status === 'IN_PROGRESS' &&
                mode === 'manage' &&
                court.currentMatchId &&
                court.status !== 'READY' &&
                !hasPreSelectedPlayers(court) && (
                  <CompatButton
                    size="sm"
                    colorPalette="green"
                    variant="outline"
                    onClick={() => onPreSelectClick(court)}
                    disabled={isRefreshing || waitingPlayers.length < 4}
                  >
                    <Box as={Plus} boxSize={4} mr={1} />
                    {t('courtsTab.preSelectNext')}
                  </CompatButton>
                )}

              {/* Cancel pre-select button */}
              {session.status === 'IN_PROGRESS' &&
                mode === 'manage' &&
                court.currentMatchId &&
                court.status !== 'READY' &&
                hasPreSelectedPlayers(court) && (
                  <CompatButton
                    size="sm"
                    colorPalette="orange"
                    variant="outline"
                    loading={loadingCancelPreSelect === court.id}
                    onClick={() => onCancelPreSelect(court.id)}
                    disabled={isRefreshing}
                  >
                    <Box as={X} boxSize={4} mr={1} />
                    {t('courtsTab.cancelPreSelect')}
                  </CompatButton>
                )}

              {/* End Match button */}
              {session.status === 'IN_PROGRESS' &&
                mode === 'manage' &&
                court.currentMatchId &&
                court.status !== 'READY' && (
                  <CompatButton
                    size="sm"
                    colorPalette="red"
                    onClick={handleEndMatchClick}
                    loading={loadingEndMatchId === court.currentMatchId}
                    disabled={isRefreshing}
                  >
                    <Box as={Square} boxSize={4} mr={1} />
                    {t('courtsTab.endMatch')}
                  </CompatButton>
                )}
            </VStack>
          </VStack>
        ) : (
          <VStack gap={4} pb={4} align="center" justify="center" minH="200px">
            <BadmintonCourt
              players={[]}
              isActive={false}
              courtName={getCourtDisplayName(
                court.courtName,
                court.courtNumber
              )}
              width="100%"
              isLoading={isRefreshing}
              status="EMPTY"
              direction={court.direction || CourtDirection.HORIZONTAL}
            />
            {session.status === 'IN_PROGRESS' && mode === 'manage' ? (
              <VStack gap={2}>
                <CompatButton
                  colorPalette="green"
                  onClick={() => onAssignPlayersClick(court)}
                  size="sm"
                  width="full"
                  disabled={waitingPlayers.length < 4 || isRefreshing}
                >
                  <Box as={Shuffle} boxSize={4} mr={1} />
                  {t('courtsTab.assignPlayers')}
                </CompatButton>
              </VStack>
            ) : session.status === 'IN_PROGRESS' ? (
              <Text fontSize="sm" color="fg.muted" textAlign="center" mt={2}>
                {t('courtsTab.courtAvailableForPlay')}
              </Text>
            ) : null}
          </VStack>
        )}
      </CardBody>
    </Card>
  );
};

export default CourtCard;
