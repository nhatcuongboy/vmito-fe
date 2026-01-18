import { useState, useCallback } from 'react';
import { BadmintonCourtPlayer } from '@/components/court/CourtPlayer';

export interface UseCourtSelectionOptions {
  onSelectionChange?: (players: BadmintonCourtPlayer[]) => void;
  maxPlayers?: number;
}

export function useCourtSelection(options: UseCourtSelectionOptions = {}) {
  const { onSelectionChange, maxPlayers = 4 } = options;

  const [selectedPlayers, setSelectedPlayers] = useState<
    BadmintonCourtPlayer[]
  >([]);
  const [currentPlayerPosition, setCurrentPlayerPosition] = useState(0);

  // Get next available position, prioritizing pair partner
  const getNextPosition = useCallback(
    (currentPos: number, players: BadmintonCourtPlayer[]) => {
      // Find empty positions
      const emptyPositions = [];
      for (let i = 0; i < maxPlayers; i++) {
        if (!players.find((_, index) => index === i)) {
          emptyPositions.push(i);
        }
      }

      if (emptyPositions.length === 0) return currentPos;

      // Priority: pair partner first
      const currentPair = Math.floor(currentPos / 2); // 0-1 -> pair 0, 2-3 -> pair 1
      const pairPositions = currentPair === 0 ? [0, 2] : [1, 3];

      // Find empty position in same pair first
      const emptyInPair = emptyPositions.find((pos) =>
        pairPositions.includes(pos)
      );
      if (emptyInPair !== undefined) {
        return emptyInPair;
      }

      // Otherwise, return first empty position
      return emptyPositions[0];
    },
    [maxPlayers]
  );

  // Add player at current position
  const selectPlayer = useCallback(
    (player: BadmintonCourtPlayer) => {
      const newPlayers = [...selectedPlayers];

      // Place player at current position
      newPlayers[currentPlayerPosition] = player;

      setSelectedPlayers(newPlayers);

      // Move to next available position
      const nextPos = getNextPosition(currentPlayerPosition, newPlayers);
      setCurrentPlayerPosition(nextPos);

      onSelectionChange?.(newPlayers.filter(Boolean)); // Remove null values
    },
    [selectedPlayers, currentPlayerPosition, getNextPosition, onSelectionChange]
  );

  // Remove player from specific position
  const removePlayer = useCallback(
    (position: number) => {
      const newPlayers = [...selectedPlayers];
      newPlayers[position] = undefined as unknown as BadmintonCourtPlayer; // Remove player at position

      setSelectedPlayers(newPlayers);

      // Set current position to the removed position
      setCurrentPlayerPosition(position);

      onSelectionChange?.(newPlayers.filter(Boolean)); // Remove null values
    },
    [selectedPlayers, onSelectionChange]
  );

  // Reset selection
  const resetSelection = useCallback(() => {
    setSelectedPlayers([]);
    setCurrentPlayerPosition(0);
    onSelectionChange?.([]);
  }, [onSelectionChange]);

  // Check if selection is complete
  const isSelectionComplete =
    selectedPlayers.filter(Boolean).length === maxPlayers;

  return {
    selectedPlayers: selectedPlayers.filter(Boolean), // Return only non-null players
    allPositions: selectedPlayers, // Return all positions including nulls
    currentPlayerPosition,
    selectPlayer,
    removePlayer,
    resetSelection,
    isSelectionComplete,
    setCurrentPlayerPosition,
  };
}
