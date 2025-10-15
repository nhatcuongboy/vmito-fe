import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface CourtState {
  // Court modals state
  autoAssignModalOpen: boolean;
  manualSelectModalOpen: boolean;
  preSelectModalOpen: boolean;
  matchResultModalOpen: boolean;

  // Selected entities
  selectedAutoAssignCourt: any | null;
  selectedManualCourt: any | null;
  selectedPreSelectCourt: any | null;
  selectedMatch: any | null;

  // Manual selection
  manualSelectedPlayers: string[];
  preSelectPlayers: string[];

  // Loading states
  loadingConfirmAutoAssign: boolean;
  confirmingManualMatch: boolean;
  confirmingPreSelect: boolean;
  loadingEndMatchId: string | null;
  loadingStartMatchCourtId: string | null;
  loadingCancelCourtId: string | null;
  loadingCancelPreSelect: string | null;

  // Actions for modals
  openAutoAssignModal: (court: any) => void;
  closeAutoAssignModal: () => void;
  openManualSelectionModal: (court: any) => void;
  closeManualSelectionModal: () => void;
  openPreSelectModal: (court: any) => void;
  closePreSelectModal: () => void;
  openMatchResultModal: (match: any) => void;
  closeMatchResultModal: () => void;

  // Player selection actions
  toggleManualPlayer: (playerId: string) => void;
  togglePreSelectPlayer: (playerId: string) => void;
  clearManualSelection: () => void;
  clearPreSelection: () => void;

  // Loading state setters
  setLoadingConfirmAutoAssign: (loading: boolean) => void;
  setConfirmingManualMatch: (confirming: boolean) => void;
  setConfirmingPreSelect: (confirming: boolean) => void;
  setLoadingEndMatchId: (matchId: string | null) => void;
  setLoadingStartMatchCourtId: (courtId: string | null) => void;
  setLoadingCancelCourtId: (courtId: string | null) => void;
  setLoadingCancelPreSelect: (loading: string | null) => void;
}

export const useCourtStore = create<CourtState>()(
  devtools(
    (set) => ({
      // Initial state
      autoAssignModalOpen: false,
      manualSelectModalOpen: false,
      preSelectModalOpen: false,
      matchResultModalOpen: false,

      selectedAutoAssignCourt: null,
      selectedManualCourt: null,
      selectedPreSelectCourt: null,
      selectedMatch: null,

      manualSelectedPlayers: [],
      preSelectPlayers: [],

      loadingConfirmAutoAssign: false,
      confirmingManualMatch: false,
      confirmingPreSelect: false,
      loadingEndMatchId: null,
      loadingStartMatchCourtId: null,
      loadingCancelCourtId: null,
      loadingCancelPreSelect: null,

      // Modal actions
      openAutoAssignModal: (court) =>
        set(
          {
            autoAssignModalOpen: true,
            selectedAutoAssignCourt: court,
          },
          false,
          'openAutoAssignModal'
        ),

      closeAutoAssignModal: () =>
        set(
          {
            autoAssignModalOpen: false,
            selectedAutoAssignCourt: null,
          },
          false,
          'closeAutoAssignModal'
        ),

      openManualSelectionModal: (court) =>
        set(
          {
            manualSelectModalOpen: true,
            selectedManualCourt: court,
            manualSelectedPlayers: [],
          },
          false,
          'openManualSelectionModal'
        ),

      closeManualSelectionModal: () =>
        set(
          {
            manualSelectModalOpen: false,
            selectedManualCourt: null,
            manualSelectedPlayers: [],
          },
          false,
          'closeManualSelectionModal'
        ),

      openPreSelectModal: (court) =>
        set(
          {
            preSelectModalOpen: true,
            selectedPreSelectCourt: court,
            preSelectPlayers: [],
          },
          false,
          'openPreSelectModal'
        ),

      closePreSelectModal: () =>
        set(
          {
            preSelectModalOpen: false,
            selectedPreSelectCourt: null,
            preSelectPlayers: [],
          },
          false,
          'closePreSelectModal'
        ),

      openMatchResultModal: (match) =>
        set(
          {
            matchResultModalOpen: true,
            selectedMatch: match,
          },
          false,
          'openMatchResultModal'
        ),

      closeMatchResultModal: () =>
        set(
          {
            matchResultModalOpen: false,
            selectedMatch: null,
          },
          false,
          'closeMatchResultModal'
        ),

      // Player selection
      toggleManualPlayer: (playerId) =>
        set(
          (state) => {
            const current = state.manualSelectedPlayers;
            if (current.includes(playerId)) {
              return {
                manualSelectedPlayers: current.filter((id) => id !== playerId),
              };
            } else if (current.length < 4) {
              return { manualSelectedPlayers: [...current, playerId] };
            }
            return state;
          },
          false,
          'toggleManualPlayer'
        ),

      togglePreSelectPlayer: (playerId) =>
        set(
          (state) => {
            const current = state.preSelectPlayers;
            if (current.includes(playerId)) {
              return {
                preSelectPlayers: current.filter((id) => id !== playerId),
              };
            } else if (current.length < 4) {
              return { preSelectPlayers: [...current, playerId] };
            }
            return state;
          },
          false,
          'togglePreSelectPlayer'
        ),

      clearManualSelection: () =>
        set({ manualSelectedPlayers: [] }, false, 'clearManualSelection'),
      clearPreSelection: () =>
        set({ preSelectPlayers: [] }, false, 'clearPreSelection'),

      // Loading setters
      setLoadingConfirmAutoAssign: (loading) =>
        set(
          { loadingConfirmAutoAssign: loading },
          false,
          'setLoadingConfirmAutoAssign'
        ),
      setConfirmingManualMatch: (confirming) =>
        set(
          { confirmingManualMatch: confirming },
          false,
          'setConfirmingManualMatch'
        ),
      setConfirmingPreSelect: (confirming) =>
        set(
          { confirmingPreSelect: confirming },
          false,
          'setConfirmingPreSelect'
        ),
      setLoadingEndMatchId: (matchId) =>
        set({ loadingEndMatchId: matchId }, false, 'setLoadingEndMatchId'),
      setLoadingStartMatchCourtId: (courtId) =>
        set(
          { loadingStartMatchCourtId: courtId },
          false,
          'setLoadingStartMatchCourtId'
        ),
      setLoadingCancelCourtId: (courtId) =>
        set(
          { loadingCancelCourtId: courtId },
          false,
          'setLoadingCancelCourtId'
        ),
      setLoadingCancelPreSelect: (loading) =>
        set(
          { loadingCancelPreSelect: loading },
          false,
          'setLoadingCancelPreSelect'
        ),
    }),
    {
      name: 'court-store',
    }
  )
);
