import { Button as CompatButton } from '@/components/ui/chakra-compat';
import { CommonModal } from '@/components/ui/CommonModal';
import { CourtService } from '@/lib/api/court.service';
import { CourtDirection, SuggestedPlayersResponse } from '@/lib/api/types';
import { Court, Player } from '@/types/session';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { Badge, Box, Flex, HStack, Text, VStack } from '@chakra-ui/react';
import {
  ArrowLeft,
  HelpCircle,
  Mars,
  Play,
  Sparkles,
  User,
  Venus,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import BadmintonCourt from '../court/BadmintonCourt';

interface MatchPreviewModalProps {
  isOpen: boolean;
  court: Court | null;
  waitingPlayersCount?: number; // Total number of waiting players (optional if no topCount selection)
  numberOfCourts?: number; // Number of courts in the session
  currentTopCount?: number; // Current topCount value
  onConfirm: (
    suggestedPlayers: SuggestedPlayersResponse,
    direction?: CourtDirection
  ) => void; // Updated to pass suggestedPlayers
  onCancel: () => void;
  onBack?: () => void; // Optional back button for manual selection flow
  getCourtDisplayName: (
    courtName: string | undefined,
    courtNumber: number
  ) => string;
  title?: string; // Custom title for the modal
  description?: string; // Custom description text
  isLoadingConfirm?: boolean; // External loading state
  courtColor?: string; // Court color from session settings
}

// Helper functions for gender display
function getGenderIcon(gender?: string) {
  if (gender === 'MALE') return Mars;
  if (gender === 'FEMALE') return Venus;
  if (gender === 'OTHER') return User;
  if (gender === 'PREFER_NOT_TO_SAY') return HelpCircle;
  return User;
}

function getGenderColorHex(gender?: string): string {
  if (gender === 'MALE') return '#3182ce';
  if (gender === 'FEMALE') return '#d53f8c';
  if (gender === 'OTHER') return '#805ad5';
  if (gender === 'PREFER_NOT_TO_SAY') return '#718096';
  return '#718096';
}

const MatchPreviewModal: React.FC<MatchPreviewModalProps> = ({
  isOpen,
  court,
  waitingPlayersCount,
  numberOfCourts = 1,
  currentTopCount,
  onConfirm,
  onCancel,
  onBack,
  getCourtDisplayName,
  title,
  description,
  isLoadingConfirm: externalLoading = false,
  courtColor,
}) => {
  const t = useTranslations('SessionDetail');
  const { getLevelShortLabel } = useLevelLabel();

  // Calculate default topCount: 4 * numberOfCourts, but not more than waitingPlayersCount
  const defaultTopCount = useMemo(() => {
    if (!numberOfCourts || !waitingPlayersCount) {
      return waitingPlayersCount || 4;
    }
    const calculatedDefault = 4 * numberOfCourts;
    return Math.min(calculatedDefault, waitingPlayersCount);
  }, [numberOfCourts, waitingPlayersCount]);

  // Use currentTopCount if provided, otherwise use calculated default
  const initialTopCount = currentTopCount || defaultTopCount;

  // Internal state for managing suggested players and loading
  const [suggestedPlayers, setSuggestedPlayers] =
    useState<SuggestedPlayersResponse | null>(null);
  const [isLoadingConfirm, setIsLoading] = useState(false);
  const [topCount, setTopCount] = useState(initialTopCount);
  const [direction] = useState<CourtDirection>(CourtDirection.HORIZONTAL);
  const [useAi, setUseAi] = useState(false);

  // Use external loading state for confirming
  const isConfirming = externalLoading;

  // Fetch suggested players when modal opens or topCount changes
  const fetchSuggestedPlayers = useCallback(
    async (courtId: string, count: number, enableAi: boolean = false) => {
      try {
        setIsLoading(true);
        const response = await CourtService.getSuggestedPlayersForCourt(
          courtId,
          count,
          enableAi
        );
        setSuggestedPlayers(response);
      } catch (error) {
        console.error('Error getting suggested players:', error);
        // You might want to add error handling here
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Combine players from both pairs
  const allPlayers = useMemo(() => {
    return suggestedPlayers
      ? [
          ...suggestedPlayers.pair1.players.map((player: Player, index) => ({
            ...player,
            pairNumber: 1,
            isCurrentPlayer: false,
            courtPosition: index,
          })),
          ...suggestedPlayers.pair2.players.map((player: Player, index) => ({
            ...player,
            pairNumber: 2,
            isCurrentPlayer: false,
            courtPosition: index + 2,
          })),
        ]
      : [];
  }, [suggestedPlayers]);

  // Effect to fetch data when modal opens or court changes
  useEffect(() => {
    if (isOpen && court?.id) {
      setTopCount(initialTopCount);
      fetchSuggestedPlayers(court.id, initialTopCount, useAi);
    } else if (!isOpen) {
      // Reset state when modal closes
      setSuggestedPlayers(null);
      setIsLoading(false);
      setUseAi(false);
    }
  }, [isOpen, court?.id, initialTopCount, fetchSuggestedPlayers, useAi]);

  // Handle topCount change
  const handleTopCountChange = (newTopCount: number) => {
    if (!court?.id) return;
    setTopCount(newTopCount);
    fetchSuggestedPlayers(court.id, newTopCount, useAi);
  };

  // Handle AI toggle
  const handleAiToggle = () => {
    if (!court?.id) return;
    const newUseAi = !useAi;
    setUseAi(newUseAi);
    fetchSuggestedPlayers(court.id, topCount, newUseAi);
  };

  // Handle confirm
  const handleConfirm = async () => {
    if (!suggestedPlayers) return;

    try {
      await onConfirm(suggestedPlayers, direction);
    } catch (error) {
      console.error('Error confirming match:', error);
    }
  };

  if (!isOpen || !court) return null;

  const modalTitle =
    title ||
    t('courtsTab.autoAssignMatchTitle', { courtNumber: court.courtNumber });
  const modalDescription =
    description || t('courtsTab.autoAssignMatchDescription');

  return (
    <CommonModal
      isOpen={isOpen}
      onClose={onCancel}
      title={modalTitle}
      description={modalDescription}
      size="md"
      showCloseButton={true}
      footer={
        <Flex justify="flex-end" gap={2} width="full">
          {onBack && (
            <CompatButton
              variant="outline"
              onClick={onBack}
              disabled={isLoadingConfirm}
            >
              <Box as={ArrowLeft} boxSize={4} mr={1} />
              {t('courtsTab.back')}
            </CompatButton>
          )}
          <CompatButton
            variant="outline"
            onClick={onCancel}
            disabled={isLoadingConfirm || isConfirming}
          >
            {t('courtsTab.cancel')}
          </CompatButton>
          <CompatButton
            onClick={handleConfirm}
            loading={isConfirming}
            disabled={isLoadingConfirm}
          >
            <Box as={Play} boxSize={4} mr={1} />
            {t('courtsTab.confirmMatch')}
          </CompatButton>
        </Flex>
      }
    >
      <Box pt={0} flex="1">
        {/* TopCount Selection */}
        {waitingPlayersCount && (
          <Box bg="gray.50" p={3} borderRadius="md" mb={4}>
            <HStack gap={3} align="center">
              <Text fontSize="sm" fontWeight="medium" color="gray.700">
                {t('courtsTab.playersToConsider')}:
              </Text>
              <Box flex="1" maxW="130px">
                <select
                  style={{
                    fontSize: '14px',
                    backgroundColor: 'white',
                    borderColor: '#d1d5db',
                    borderWidth: '1px',
                    borderRadius: '6px',
                    padding: '8px',
                    width: '100%',
                    cursor: isLoadingConfirm ? 'not-allowed' : 'pointer',
                    opacity: isLoadingConfirm ? 0.6 : 1,
                  }}
                  value={topCount}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    handleTopCountChange(parseInt(e.target.value))
                  }
                  disabled={isLoadingConfirm}
                >
                  {Array.from(
                    { length: Math.max(0, waitingPlayersCount - 3) },
                    (_, i) => i + 4
                  ).map((count) => (
                    <option key={count} value={count}>
                      {count} {t('courtsTab.players')}
                    </option>
                  ))}
                </select>
              </Box>
              <Box fontSize="sm" color="gray.500">
                {t('courtsTab.longestWait')}
              </Box>
            </HStack>
          </Box>
        )}

        {/* AI Toggle */}
        <Box bg="purple.50" p={3} borderRadius="md" mb={4}>
          <HStack gap={3} align="center" justify="space-between">
            <HStack gap={2}>
              <Box as={Sparkles} boxSize={4} color="purple.500" />
              <Text fontSize="sm" fontWeight="medium" color="purple.700">
                AI-Powered Matching
              </Text>
            </HStack>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={useAi}
                onChange={handleAiToggle}
                disabled={isLoadingConfirm}
                style={{
                  marginRight: '8px',
                  cursor: isLoadingConfirm ? 'not-allowed' : 'pointer',
                }}
              />
              <Text fontSize="sm" color="purple.600">
                {useAi ? 'On' : 'Off'}
              </Text>
            </label>
          </HStack>
          {suggestedPlayers?.usedAi && suggestedPlayers?.aiReason && (
            <Box
              mt={2}
              p={2}
              bg="white"
              borderRadius="md"
              fontSize="xs"
              color="purple.600"
            >
              <Text fontWeight="medium">AI Reasoning:</Text>
              <Text>{suggestedPlayers.aiReason}</Text>
            </Box>
          )}
        </Box>

        <Box>
          <BadmintonCourt
            players={allPlayers}
            isActive={true}
            courtName={getCourtDisplayName(court.courtName, court.courtNumber)}
            width="100%"
            showTimeInCenter={false}
            isLoading={isLoadingConfirm}
            direction={court?.direction || CourtDirection.HORIZONTAL}
            courtColor={courtColor}
          />
        </Box>

        {/* Display pair information */}
        <VStack gap={2} mt={2}>
          {!isLoadingConfirm && suggestedPlayers && (
            <HStack justify="space-between" width="full" px={4} align="center">
              <HStack gap={2} justify="center" flex="1">
                <Badge colorPalette="blue" variant="solid" fontSize="sm">
                  {t('courtsTab.pair1')}
                </Badge>
              </HStack>

              <Text
                fontSize="lg"
                fontWeight="bold"
                color="gray.600"
                minW="80px"
                textAlign="center"
              >
                Vs
              </Text>

              <HStack gap={2} justify="center" flex="1">
                <Badge colorPalette="orange" variant="solid" fontSize="sm">
                  {t('courtsTab.pair2')}
                </Badge>
              </HStack>
            </HStack>
          )}

          {!isLoadingConfirm && suggestedPlayers ? (
            <Box
              bg="gray.50"
              borderRadius="lg"
              p={3}
              border="1px solid"
              borderColor="gray.200"
              maxHeight="280px"
              overflowY="auto"
              width="full"
            >
              <HStack gap={2} width="full" justify="center" align="stretch">
                {/* Pair 1 */}
                <Box
                  bg="blue.50"
                  border="2px solid"
                  borderColor="blue.200"
                  borderRadius="lg"
                  p={3}
                  textAlign="center"
                  flex="1"
                  minW="140px"
                  position="relative"
                >
                  <Badge
                    colorPalette="yellow"
                    variant="solid"
                    fontSize="xs"
                    position="absolute"
                    top={2}
                    right={2}
                    borderRadius="full"
                  >
                    {suggestedPlayers.pair1.totalLevelScore}
                  </Badge>
                  <VStack gap={1.5}>
                    {suggestedPlayers.pair1.players.map((player: Player) => (
                      <Box
                        key={player.id}
                        bg="white"
                        borderRadius="md"
                        p={2}
                        border="1px solid"
                        borderColor="blue.100"
                        width="full"
                      >
                        <Text
                          fontSize="xs"
                          fontWeight="semibold"
                          color="gray.800"
                        >
                          #{player.playerNumber}
                        </Text>
                        <Text
                          fontSize="xs"
                          color="gray.600"
                          mb={1}
                          overflow="hidden"
                          whiteSpace="nowrap"
                          textOverflow="ellipsis"
                        >
                          {player.name ||
                            t('courtsTab.playerFallback', {
                              number: player.playerNumber,
                            })}
                        </Text>
                        <HStack justify="center" gap={1}>
                          {player.gender && (
                            <Box
                              as={getGenderIcon(player.gender)}
                              boxSize={3}
                              color={getGenderColorHex(player.gender)}
                            />
                          )}
                          {player.level && (
                            <Badge
                              colorPalette="red"
                              size="sm"
                              variant="solid"
                              fontSize="xs"
                            >
                              {getLevelShortLabel(player.level)}
                            </Badge>
                          )}
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                </Box>

                {/* Gap indicator */}
                <Flex
                  direction="column"
                  align="center"
                  justify="center"
                  minW="60px"
                >
                  <Text
                    fontSize="sm"
                    color="gray.600"
                    textAlign="center"
                    mb={1}
                  >
                    {t('courtsTab.gapLabel')}
                  </Text>
                  <Badge colorPalette="yellow" variant="solid" fontSize="xs">
                    {suggestedPlayers.scoreDifference}
                  </Badge>
                </Flex>

                {/* Pair 2 */}
                <Box
                  bg="orange.50"
                  border="2px solid"
                  borderColor="orange.200"
                  borderRadius="lg"
                  p={3}
                  textAlign="center"
                  flex="1"
                  minW="140px"
                  position="relative"
                >
                  <Badge
                    colorPalette="yellow"
                    variant="solid"
                    fontSize="xs"
                    position="absolute"
                    top={2}
                    left={2}
                    borderRadius="full"
                  >
                    {suggestedPlayers.pair2.totalLevelScore}
                  </Badge>
                  <VStack gap={1.5}>
                    {suggestedPlayers.pair2.players.map((player: Player) => (
                      <Box
                        key={player.id}
                        bg="white"
                        borderRadius="md"
                        p={2}
                        border="1px solid"
                        borderColor="orange.100"
                        width="full"
                      >
                        <Text
                          fontSize="xs"
                          fontWeight="semibold"
                          color="gray.800"
                        >
                          #{player.playerNumber}
                        </Text>
                        <Text
                          fontSize="xs"
                          color="gray.600"
                          mb={1}
                          overflow="hidden"
                          whiteSpace="nowrap"
                          textOverflow="ellipsis"
                        >
                          {player.name ||
                            t('courtsTab.playerFallback', {
                              number: player.playerNumber,
                            })}
                        </Text>
                        <HStack justify="center" gap={1}>
                          {player.gender && (
                            <Box
                              as={getGenderIcon(player.gender)}
                              boxSize={3}
                              color={getGenderColorHex(player.gender)}
                            />
                          )}
                          {player.level && (
                            <Badge
                              colorPalette="red"
                              size="sm"
                              variant="solid"
                              fontSize="xs"
                            >
                              {getLevelShortLabel(player.level)}
                            </Badge>
                          )}
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                </Box>
              </HStack>
            </Box>
          ) : null}
        </VStack>
      </Box>
    </CommonModal>
  );
};

export default MatchPreviewModal;
