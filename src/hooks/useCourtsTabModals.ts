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
  const [manualSelectedPlayers, setManualSelectedPlayers] = useState<string[]>(
    []
  );
  const [confirmingManualMatch, setConfirmingManualMatch] = useState(false);

  // Match result modal state
  const [matchResultModalOpen, setMatchResultModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);

  // Pre-select modal state
  const [preSelectModalOpen, setPreSelectModalOpen] = useState(false);
  const [selectedPreSelectCourt, setSelectedPreSelectCourt] =
    useState<Court | null>(null);
  const [preSelectPlayers, setPreSelectPlayers] = useState<string[]>([]);
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
    setManualSelectedPlayers([]);
    setManualSelectModalOpen(true);
  };

  const closeManualSelectionModal = () => {
    setManualSelectModalOpen(false);
    setSelectedManualCourt(null);
    setManualSelectedPlayers([]);
  };

  // Pre-select modal handlers
  const openPreSelectModal = (court: Court) => {
    setSelectedPreSelectCourt(court);
    setPreSelectPlayers([]);
    setPreSelectModalOpen(true);
  };

  const closePreSelectModal = () => {
    setPreSelectModalOpen(false);
    setSelectedPreSelectCourt(null);
    setPreSelectPlayers([]);
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

  // Manual player toggle
  const toggleManualPlayer = (playerId: string) => {
    setManualSelectedPlayers((prev) => {
      if (prev.includes(playerId)) {
        return prev.filter((id) => id !== playerId);
      } else if (prev.length < 4) {
        return [...prev, playerId];
      }
      return prev;
    });
  };

  // Pre-select player toggle
  const togglePreSelectPlayer = (playerId: string) => {
    setPreSelectPlayers((prev) => {
      if (prev.includes(playerId)) {
        return prev.filter((id) => id !== playerId);
      } else if (prev.length < 4) {
        return [...prev, playerId];
      }
      return prev;
    });
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
    confirmingManualMatch,
    setConfirmingManualMatch,

    matchResultModalOpen,
    selectedMatch,

    preSelectModalOpen,
    selectedPreSelectCourt,
    preSelectPlayers,
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
  };
};
