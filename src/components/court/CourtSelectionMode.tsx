import React, { useState } from 'react';
import { Box, VStack, HStack, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import BadmintonCourt from '@/components/court/BadmintonCourt';
import { useCourtSelection } from '@/hooks/useCourtSelection';
import { BadmintonCourtPlayer } from '@/components/court/CourtPlayer';
import { Button } from '../ui/chakra-compat';

interface CourtSelectionModeProps {
  availablePlayers: BadmintonCourtPlayer[];
  onSelectionComplete?: (selectedPlayers: BadmintonCourtPlayer[]) => void;
  onCancel?: () => void;
}

export default function CourtSelectionMode({
  availablePlayers,
  onSelectionComplete,
  onCancel,
}: CourtSelectionModeProps) {
  const t = useTranslations('SessionDetail');
  const [selectedFromList, setSelectedFromList] = useState<string | null>(null);

  const {
    allPositions,
    currentPlayerPosition,
    selectPlayer,
    removePlayer,
    resetSelection,
    isSelectionComplete,
  } = useCourtSelection({
    onSelectionChange: () => {
      // Optional: Handle selection changes
    },
  });

  const handlePlayerSelect = (player: BadmintonCourtPlayer) => {
    selectPlayer(player);
    setSelectedFromList(null); // Clear selection from list
  };

  const handleConfirm = () => {
    // Map selected players to [0,2,1,3] order for consistency
    const mapping = [0, 2, 1, 3];
    const mappedPlayers = mapping
      .map((i) => allPositions[i])
      .filter((p): p is BadmintonCourtPlayer => !!p);
    onSelectionComplete?.(mappedPlayers);
  };

  const handleReset = () => {
    resetSelection();
    setSelectedFromList(null);
  };

  return (
    <VStack gap={6} p={4}>
      <Text fontSize="lg" fontWeight="bold">
        {t('selectPlayersForCourt')}
      </Text>

      {/* Court Display */}
      <BadmintonCourt
        players={[]} // Empty for selection mode
        isActive={false}
        mode="selection"
        selectedPositions={allPositions}
        currentPlayerPosition={currentPlayerPosition}
        onPlayerRemove={removePlayer}
        courtName="Selection Court"
      />

      {/* Available Players List */}
      <Box w="100%" maxW="600px">
        <Text fontSize="md" fontWeight="semibold" mb={3}>
          Available Players
        </Text>
        <VStack gap={2} maxH="300px" overflowY="auto">
          {availablePlayers.map((player) => {
            const isAlreadySelected = allPositions.some(
              (p) => p && p.id === player.id
            );
            const isSelectedFromList = selectedFromList === player.id;

            return (
              <HStack
                key={player.id}
                w="100%"
                p={3}
                borderRadius="md"
                border="1px"
                borderColor={
                  isAlreadySelected
                    ? 'green.300'
                    : isSelectedFromList
                      ? 'blue.300'
                      : 'gray.200'
                }
                bg={
                  isAlreadySelected
                    ? 'green.50'
                    : isSelectedFromList
                      ? 'blue.50'
                      : 'white'
                }
                cursor={isAlreadySelected ? 'not-allowed' : 'pointer'}
                opacity={isAlreadySelected ? 0.6 : 1}
                onClick={() => {
                  if (!isAlreadySelected) {
                    if (isSelectedFromList) {
                      handlePlayerSelect(player);
                    } else {
                      setSelectedFromList(player.id);
                    }
                  }
                }}
                _hover={{
                  bg: isAlreadySelected
                    ? 'green.50'
                    : isSelectedFromList
                      ? 'blue.100'
                      : 'gray.50',
                }}
              >
                <Box
                  w="40px"
                  h="40px"
                  borderRadius="full"
                  bg="blue.500"
                  color="white"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="sm"
                  fontWeight="bold"
                >
                  {player.name?.charAt(0).toUpperCase() || '?'}
                </Box>
                <VStack align="start" gap={0} flex={1}>
                  <Text fontWeight="semibold">{player.name}</Text>
                  <Text fontSize="sm" color="gray.600">
                    Level: {player.level}
                  </Text>
                </VStack>
                <Text fontSize="sm" color="gray.500">
                  {isAlreadySelected
                    ? 'Selected'
                    : isSelectedFromList
                      ? 'Click again to add'
                      : 'Click to select'}
                </Text>
              </HStack>
            );
          })}
        </VStack>
      </Box>

      {/* Action Buttons */}
      <HStack gap={3}>
        <Button
          colorPalette="green"
          onClick={handleConfirm}
          disabled={!isSelectionComplete}
        >
          Confirm Selection ({allPositions.filter(Boolean).length}/4)
        </Button>
        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </HStack>
    </VStack>
  );
}
