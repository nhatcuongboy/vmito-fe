import React, { useState, useMemo, useEffect } from 'react';
import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import { X, Check } from 'lucide-react';
import { PlayerGrid } from '@/components/player/PlayerGrid';
import { Button as CompatButton } from '@/components/ui/chakra-compat';
import { Player, Court } from '@/types/session';
import BadmintonCourt from '@/components/court/BadmintonCourt';
import { useTranslations } from 'next-intl';
import { CourtDirection } from '@/lib/api/types';

interface ManualSelectPlayersModalProps {
  isOpen: boolean;
  court: Court | null;
  waitingPlayers: Player[];
  selectedPlayers: string[];
  onPlayerToggle: (playerId: string) => void;
  onConfirm: (
    playersWithPosition: Array<{ playerId: string; position: number }>
  ) => void;
  onCancel: () => void;
  formatWaitTime: (waitTimeInMinutes: number) => string;
  isLoading?: boolean; // Add loading prop
  getCourtDisplayName?: (
    courtName: string | undefined,
    courtNumber: number
  ) => string;
  title?: string; // Custom title for different modes
}

const ManualSelectPlayersModal: React.FC<ManualSelectPlayersModalProps> = ({
  isOpen,
  court,
  waitingPlayers,
  selectedPlayers,
  onPlayerToggle,
  onConfirm,
  onCancel,
  formatWaitTime,
  isLoading = false, // Add isLoading prop with default
  getCourtDisplayName = (name, number) => name || `Court ${number}`,
  title, // Custom title prop
}) => {
  const t = useTranslations('SessionDetail');
  const [showPreview, setShowPreview] = useState(false);
  const [currentPlayerPosition, setCurrentPlayerPosition] = useState(0);
  // Remove local isLoading state since we're using the prop
  // const [isLoading, setIsLoading] = useState(false);

  // Create selectedPositions array for BadmintonCourt
  const selectedPositions = useMemo(() => {
    const positions: (Player | undefined)[] = [
      undefined,
      undefined,
      undefined,
      undefined,
    ];

    // Fill positions sequentially based on selectedPlayers order
    selectedPlayers.forEach((playerId, index) => {
      if (index < 4) {
        const player = waitingPlayers.find((p) => p.id === playerId);
        if (player) {
          positions[index] = player;
        }
      }
    });

    return positions;
  }, [selectedPlayers, waitingPlayers]);

  // Update current position to next empty slot
  const updateCurrentPosition = () => {
    // If all 4 positions are filled, don't change current position
    if (selectedPlayers.length >= 4) {
      return;
    }

    // Find first empty position
    for (let i = 0; i < 4; i++) {
      if (!selectedPositions[i]) {
        setCurrentPlayerPosition(i);
        return;
      }
    }

    // If somehow all positions are filled, reset to 0
    setCurrentPlayerPosition(0);
  };

  // Handle removing player from specific position
  const handleRemoveFromPosition = (position: number) => {
    const playerAtPosition = selectedPositions[position];
    if (playerAtPosition) {
      onPlayerToggle(playerAtPosition.id);
      setCurrentPlayerPosition(position);
    }
  };

  // Update current position when selectedPlayers changes
  useEffect(() => {
    updateCurrentPosition();
  }, [selectedPlayers, selectedPositions]);

  // Early return after all hooks have been called
  if (!isOpen || !court) return null;

  const handleConfirmSelection = () => {
    // Send players with their visual position info
    if (selectedPlayers.length === 4) {
      const playersWithPosition = selectedPlayers.map((playerId, index) => ({
        playerId,
        position: index, // 0=top-left, 1=top-right, 2=bottom-left, 3=bottom-right
      }));
      if (typeof onConfirm === 'function') {
        onConfirm(playersWithPosition);
      }
    }
  };

  return (
    <>
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="blackAlpha.600"
        zIndex={1000}
        display="flex"
        alignItems="center"
        justifyContent="center"
        p={4}
      >
        <Box
          bg="white"
          borderRadius="lg"
          boxShadow="xl"
          maxW="6xl"
          w="full"
          maxH="90vh"
          overflow="hidden"
          display="flex"
          flexDirection="column"
        >
          <Flex
            justify="space-between"
            align="center"
            p={4}
            borderBottom="1px"
            borderColor="gray.200"
            flexShrink={0}
          >
            <Heading size="md">
              {title ||
                t('courtsTab.manualPlayerSelectionTitle', {
                  courtNumber: court.courtNumber,
                })}
            </Heading>
            <Box
              as="button"
              onClick={onCancel}
              p={1}
              borderRadius="md"
              _hover={{ bg: 'gray.100' }}
            >
              <Box as={X} boxSize={5} />
            </Box>
          </Flex>

          <Box flexShrink={0} p={4}>
            {/* Court Preview and Selected Players Section */}
            <Box flex={{ base: '1', lg: '0 0 400px' }} minW="0">
              <Text fontSize="sm" fontWeight="medium" mb={3}>
                {t('courtsTab.selectedPlayersCount', {
                  count: selectedPlayers.length,
                })}
              </Text>

              {/* BadmintonCourt for Selected Players */}
              <Box maxW="400px" mx="auto">
                <BadmintonCourt
                  players={[]} // Empty array since we use selectedPositions
                  isActive={false}
                  mode="selection"
                  selectedPositions={selectedPositions}
                  currentPlayerPosition={currentPlayerPosition}
                  onPlayerRemove={handleRemoveFromPosition}
                  courtName={getCourtDisplayName(
                    court.courtName,
                    court.courtNumber
                  )}
                  width="100%"
                  showTimeInCenter={false}
                  direction={court?.direction || CourtDirection.HORIZONTAL}
                />
              </Box>
            </Box>
          </Box>

          <Box flex={1} overflow="auto" p={4}>
            {/* Available Players */}
            <Box>
              <Text fontSize="md" fontWeight="medium" mb={3}>
                {t('courtsTab.availablePlayers')}
              </Text>
              {waitingPlayers.length === 0 ? (
                <Text fontSize="sm" color="gray.500" textAlign="center" py={8}>
                  {t('courtsTab.noPlayersWaiting')}
                </Text>
              ) : (
                <PlayerGrid
                  players={waitingPlayers}
                  playerFilter="WAITING"
                  formatWaitTime={formatWaitTime}
                  selectedPlayers={selectedPlayers}
                  onPlayerToggle={onPlayerToggle}
                  selectionMode={true}
                />
              )}
            </Box>
          </Box>

          <Flex
            justify="flex-end"
            gap={2}
            p={4}
            borderTop="1px"
            borderColor="gray.200"
            flexShrink={0}
          >
            <CompatButton variant="outline" onClick={onCancel}>
              {t('courtsTab.cancel')}
            </CompatButton>
            <CompatButton
              colorScheme="blue"
              onClick={handleConfirmSelection}
              disabled={selectedPlayers.length !== 4 || isLoading}
              loading={isLoading}
            >
              <Box as={Check} boxSize={4} mr={1} />
              {t('courtsTab.confirmMatchManual', {
                count: selectedPlayers.length,
              })}
            </CompatButton>
          </Flex>
        </Box>
      </Box>
    </>
  );
};

export default ManualSelectPlayersModal;
