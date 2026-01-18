import { useState } from 'react';
import { Court, Match } from '@/types/session';

export const useCourtsTabModals = () => {
  // Auto-assign modal state
  const [autoAssignModalOpen, setAutoAssignModalOpen] = useState(false);
  const [selectedAutoAssignCourt, setSelectedAutoAssignCourt] =
    useState<Court | null>(null);
  const [loadingConfirmAutoAssign, setLoadingConfirmAutoAssign] =
    useState(false);

  // Manual selection modal state
  const [manualSelectModalOpen, setManualSelectModalOpen] = useState(false);
  const [selectedManualCourt, setSelectedManualCourt] = useState<Court | null>(
    null
  );
  const [manualSelectedPlayers, setManualSelectedPlayers] = useState<
    (string | null)[]
  >([null, null, null, null]);
  const [manualCurrentPosition, setManualCurrentPosition] = useState(0);
  const [confirmingManualMatch, setConfirmingManualMatch] = useState(false);

  // Match result modal state
  const [matchResultModalOpen, setMatchResultModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  // Pre-select modal state
  const [preSelectModalOpen, setPreSelectModalOpen] = useState(false);
  const [selectedPreSelectCourt, setSelectedPreSelectCourt] =
    useState<Court | null>(null);
  const [preSelectPlayers, setPreSelectPlayers] = useState<(string | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const [preSelectCurrentPosition, setPreSelectCurrentPosition] = useState(0);
  const [confirmingPreSelect, setConfirmingPreSelect] = useState(false);

  // Loading states
  const [loadingEndMatchId, setLoadingEndMatchId] = useState<string | null>(
    null
  );
  const [loadingStartMatchCourtId, setLoadingStartMatchCourtId] = useState<
    string | null
  >(null);
  const [loadingCancelCourtId, setLoadingCancelCourtId] = useState<
    string | null
  >(null);
  const [loadingCancelPreSelect, setLoadingCancelPreSelect] = useState<
    string | null
  >(null);

  // Auto-assign modal handlers
  const openAutoAssignModal = (court: Court) => {
    setSelectedAutoAssignCourt(court);
    setAutoAssignModalOpen(true);
  };

  const closeAutoAssignModal = () => {
    setAutoAssignModalOpen(false);
    setSelectedAutoAssignCourt(null);
  };

  // Manual selection modal handlers
  const openManualSelectionModal = (court: Court) => {
    setSelectedManualCourt(court);
    setManualSelectedPlayers([null, null, null, null]);
    setManualCurrentPosition(0);
    setManualSelectModalOpen(true);
  };

  const closeManualSelectionModal = () => {
    setManualSelectModalOpen(false);
    setSelectedManualCourt(null);
    setManualSelectedPlayers([null, null, null, null]);
    setManualCurrentPosition(0);
  };

  // Pre-select modal handlers
  const openPreSelectModal = (court: Court) => {
    setSelectedPreSelectCourt(court);
    setPreSelectPlayers([null, null, null, null]);
    setPreSelectCurrentPosition(0);
    setPreSelectModalOpen(true);
  };

  const closePreSelectModal = () => {
    setPreSelectModalOpen(false);
    setSelectedPreSelectCourt(null);
    setPreSelectPlayers([null, null, null, null]);
    setPreSelectCurrentPosition(0);
  };

  // Match result modal handlers
  const openMatchResultModal = (match: Match) => {
    setSelectedMatch(match);
    setMatchResultModalOpen(true);
  };

  const closeMatchResultModal = () => {
    setMatchResultModalOpen(false);
    setSelectedMatch(null);
  };

  // Manual player toggle - adds player to current position
  const toggleManualPlayer = (playerId: string) => {
    setManualSelectedPlayers((prev) => {
      // If player is already selected, remove them from their position
      const existingIndex = prev.indexOf(playerId);
      if (existingIndex !== -1) {
        const newArr = [...prev];
        newArr[existingIndex] = null;
        return newArr;
      }
      // Add player to current position
      const newArr = [...prev];
      newArr[manualCurrentPosition] = playerId;
      return newArr;
    });
    // Auto-advance to next empty position after adding
    setManualSelectedPlayers((prev) => {
      const nextEmpty = prev.findIndex((p, i) => p === null && i !== manualCurrentPosition);
      if (nextEmpty !== -1) {
        setManualCurrentPosition(nextEmpty);
      } else {
        // Find any empty position
        const anyEmpty = prev.findIndex((p) => p === null);
        if (anyEmpty !== -1) {
          setManualCurrentPosition(anyEmpty);
        }
      }
      return prev;
    });
  };

  // Set player to specific position
  const setManualPlayerAtPosition = (playerId: string | null, position: number) => {
    setManualSelectedPlayers((prev) => {
      const newArr = [...prev];
      // If setting a player, first remove them from any existing position
      if (playerId) {
        const existingIndex = prev.indexOf(playerId);
        if (existingIndex !== -1 && existingIndex !== position) {
          newArr[existingIndex] = null;
        }
      }
      newArr[position] = playerId;
      return newArr;
    });
  };

  // Clear player from specific position
  const clearManualPlayerAtPosition = (position: number) => {
    setManualSelectedPlayers((prev) => {
      const newArr = [...prev];
      newArr[position] = null;
      return newArr;
    });
    setManualCurrentPosition(position);
  };

  // Pre-select player toggle - adds player to current position
  const togglePreSelectPlayer = (playerId: string) => {
    setPreSelectPlayers((prev) => {
      // If player is already selected, remove them from their position
      const existingIndex = prev.indexOf(playerId);
      if (existingIndex !== -1) {
        const newArr = [...prev];
        newArr[existingIndex] = null;
        return newArr;
      }
      // Add player to current position
      const newArr = [...prev];
      newArr[preSelectCurrentPosition] = playerId;
      return newArr;
    });
    // Auto-advance to next empty position after adding
    setPreSelectPlayers((prev) => {
      const nextEmpty = prev.findIndex((p, i) => p === null && i !== preSelectCurrentPosition);
      if (nextEmpty !== -1) {
        setPreSelectCurrentPosition(nextEmpty);
      } else {
        // Find any empty position
        const anyEmpty = prev.findIndex((p) => p === null);
        if (anyEmpty !== -1) {
          setPreSelectCurrentPosition(anyEmpty);
        }
      }
      return prev;
    });
  };

  // Set pre-select player to specific position
  const setPreSelectPlayerAtPosition = (playerId: string | null, position: number) => {
    setPreSelectPlayers((prev) => {
      const newArr = [...prev];
      // If setting a player, first remove them from any existing position
      if (playerId) {
        const existingIndex = prev.indexOf(playerId);
        if (existingIndex !== -1 && existingIndex !== position) {
          newArr[existingIndex] = null;
        }
      }
      newArr[position] = playerId;
      return newArr;
    });
  };

  // Clear pre-select player from specific position
  const clearPreSelectPlayerAtPosition = (position: number) => {
    setPreSelectPlayers((prev) => {
      const newArr = [...prev];
      newArr[position] = null;
      return newArr;
    });
    setPreSelectCurrentPosition(position);
  };

  return {
    // States
    autoAssignModalOpen,
    selectedAutoAssignCourt,
    loadingConfirmAutoAssign,
    setLoadingConfirmAutoAssign,

    manualSelectModalOpen,
    selectedManualCourt,
    manualSelectedPlayers,
    manualCurrentPosition,
    setManualCurrentPosition,
    confirmingManualMatch,
    setConfirmingManualMatch,

    matchResultModalOpen,
    selectedMatch,

    preSelectModalOpen,
    selectedPreSelectCourt,
    preSelectPlayers,
    preSelectCurrentPosition,
    setPreSelectCurrentPosition,
    confirmingPreSelect,
    setConfirmingPreSelect,

    loadingEndMatchId,
    setLoadingEndMatchId,
    loadingStartMatchCourtId,
    setLoadingStartMatchCourtId,
    loadingCancelCourtId,
    setLoadingCancelCourtId,
    loadingCancelPreSelect,
    setLoadingCancelPreSelect,

    // Handlers
    openAutoAssignModal,
    closeAutoAssignModal,
    openManualSelectionModal,
    closeManualSelectionModal,
    openPreSelectModal,
    closePreSelectModal,
    openMatchResultModal,
    closeMatchResultModal,
    toggleManualPlayer,
    togglePreSelectPlayer,
    setManualPlayerAtPosition,
    clearManualPlayerAtPosition,
    setPreSelectPlayerAtPosition,
    clearPreSelectPlayerAtPosition,
  };
};
