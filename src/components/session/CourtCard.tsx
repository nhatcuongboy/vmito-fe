import React from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button as CompatButton,
} from '@/components/ui/chakra-compat';
import { CourtDirection } from '@/lib/api/types';
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
  session: any;
  mode: 'manage' | 'view';
  isRefreshing: boolean;
  waitingPlayers: any[];

  // Handlers
  onAutoAssignClick: (court: Court) => void;
  onManualSelectionClick: (court: Court) => void;
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

  // Optional props
  startManualMatchCreation?: (courtId: string) => void;
}

const CourtCard: React.FC<CourtCardProps> = ({
  court,
  currentMatch,
  session,
  mode,
  isRefreshing,
  waitingPlayers,
  onAutoAssignClick,
  onManualSelectionClick,
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
  startManualMatchCreation,
}) => {
  const t = useTranslations('SessionDetail');

  const isActive = court.status === 'IN_USE' || court.status === 'READY';
  const isCourtReady = court.status === 'READY';

  const handleEndMatchClick = () => {
    if (currentMatch) {
      const matchWithCourt = {
        ...currentMatch,
        court: {
          ...court,
          direction: court.direction || CourtDirection.HORIZONTAL,
        },
      };
      onEndMatch(matchWithCourt);
    }
  };

  return (
    <Card key={court.id} variant="outline" boxShadow="md">
      <CardHeader
        bg={isCourtReady ? 'yellow.50' : isActive ? 'green.50' : 'gray.50'}
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
                  ? 'yellow.700'
                  : isActive
                    ? 'green.700'
                    : 'gray.700'
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
                colorPalette="blue"
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
                  ? elapsedTimeFormatter(currentMatch.startTime)
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
        {isActive && court.currentPlayers.length > 0 ? (
          <VStack gap={4}>
            <BadmintonCourt
              players={court.currentPlayers}
              isActive={isActive}
              elapsedTime={
                currentMatch
                  ? elapsedTimeFormatter(currentMatch.startTime)
                  : t('courtsTab.playing')
              }
              courtName={getCourtDisplayName(
                court.courtName,
                court.courtNumber
              )}
              width="100%"
              showTimeInCenter={true}
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
                    colorScheme="green"
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
                court.currentPlayers.length > 0 && (
                  <CompatButton
                    size="sm"
                    colorScheme="red"
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
                    colorScheme="blue"
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
                    colorScheme="orange"
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
                    colorScheme="red"
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
              showTimeInCenter={false}
              isLoading={isRefreshing}
              status="EMPTY"
              direction={court.direction || CourtDirection.HORIZONTAL}
            />
            {session.status === 'IN_PROGRESS' && mode === 'manage' ? (
              <VStack gap={2}>
                <CompatButton
                  colorScheme="green"
                  onClick={() => onAutoAssignClick(court)}
                  size="sm"
                  width="full"
                  disabled={waitingPlayers.length < 4 || isRefreshing}
                >
                  <Box as={Shuffle} boxSize={4} mr={1} />
                  {t('courtsTab.autoAssignMatch')}
                </CompatButton>
                {startManualMatchCreation && (
                  <CompatButton
                    colorScheme="blue"
                    onClick={() => onManualSelectionClick(court)}
                    size="sm"
                    width="full"
                    variant="outline"
                    disabled={waitingPlayers.length < 4 || isRefreshing}
                  >
                    <Box as={Plus} boxSize={4} mr={1} />
                    {t('courtsTab.manualSelection')}
                  </CompatButton>
                )}
              </VStack>
            ) : session.status === 'IN_PROGRESS' ? (
              <Text fontSize="sm" color="gray.500" textAlign="center" mt={2}>
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
