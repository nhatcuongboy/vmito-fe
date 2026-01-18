import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Player, Court } from '@/types/session';

interface SessionState {
  // Current session data
  currentSessionId: string | null;
  selectedPlayers: string[];
  selectedCourt: string | null;
  matchMode: 'auto' | 'manual';
  showMatchCreation: boolean;

  // Players management
  waitingPlayers: Player[];
  playingPlayers: Player[];

  // Court management
  activeCourts: Court[];

  // UI state for session
  activeTab: number;
  isRefreshing: boolean;

  // Actions
  setCurrentSession: (sessionId: string | null) => void;
  setSelectedPlayers: (playerIds: string[]) => void;
  addSelectedPlayer: (playerId: string) => void;
  removeSelectedPlayer: (playerId: string) => void;
  clearSelectedPlayers: () => void;
  setSelectedCourt: (courtId: string | null) => void;
  setMatchMode: (mode: 'auto' | 'manual') => void;
  setShowMatchCreation: (show: boolean) => void;
  setWaitingPlayers: (players: Player[]) => void;
  setPlayingPlayers: (players: Player[]) => void;
  setActiveCourts: (courts: Court[]) => void;
  setActiveTab: (tab: number) => void;
  setRefreshing: (refreshing: boolean) => void;

  // Combined actions
  togglePlayerSelection: (playerId: string) => void;
  cancelMatchCreation: () => void;
  startManualMatchCreation: (courtId: string) => void;
}

export const useSessionStore = create<SessionState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentSessionId: null,
        selectedPlayers: [],
        selectedCourt: null,
        matchMode: 'auto',
        showMatchCreation: false,
        waitingPlayers: [],
        playingPlayers: [],
        activeCourts: [],
        activeTab: 0,
        isRefreshing: false,

        // Basic setters
        setCurrentSession: (sessionId) =>
          set({ currentSessionId: sessionId }, false, 'setCurrentSession'),
        setSelectedPlayers: (playerIds) =>
          set({ selectedPlayers: playerIds }, false, 'setSelectedPlayers'),
        setSelectedCourt: (courtId) =>
          set({ selectedCourt: courtId }, false, 'setSelectedCourt'),
        setMatchMode: (mode) => set({ matchMode: mode }, false, 'setMatchMode'),
        setShowMatchCreation: (show) =>
          set({ showMatchCreation: show }, false, 'setShowMatchCreation'),
        setWaitingPlayers: (players) =>
          set({ waitingPlayers: players }, false, 'setWaitingPlayers'),
        setPlayingPlayers: (players) =>
          set({ playingPlayers: players }, false, 'setPlayingPlayers'),
        setActiveCourts: (courts) =>
          set({ activeCourts: courts }, false, 'setActiveCourts'),
        setActiveTab: (tab) => set({ activeTab: tab }, false, 'setActiveTab'),
        setRefreshing: (refreshing) =>
          set({ isRefreshing: refreshing }, false, 'setRefreshing'),

        // Player selection actions
        addSelectedPlayer: (playerId) =>
          set(
            (state) => {
              if (
                !state.selectedPlayers.includes(playerId) &&
                state.selectedPlayers.length < 4
              ) {
                return {
                  selectedPlayers: [...state.selectedPlayers, playerId],
                };
              }
              return state;
            },
            false,
            'addSelectedPlayer'
          ),

        removeSelectedPlayer: (playerId) =>
          set(
            (state) => ({
              selectedPlayers: state.selectedPlayers.filter(
                (id) => id !== playerId
              ),
            }),
            false,
            'removeSelectedPlayer'
          ),

        clearSelectedPlayers: () =>
          set({ selectedPlayers: [] }, false, 'clearSelectedPlayers'),

        // Combined actions
        togglePlayerSelection: (playerId) => {
          const state = get();
          if (state.selectedPlayers.includes(playerId)) {
            state.removeSelectedPlayer(playerId);
          } else if (state.selectedPlayers.length < 4) {
            state.addSelectedPlayer(playerId);
          }
        },

        cancelMatchCreation: () =>
          set(
            {
              selectedCourt: null,
              matchMode: 'auto',
              showMatchCreation: false,
              selectedPlayers: [],
            },
            false,
            'cancelMatchCreation'
          ),

        startManualMatchCreation: (courtId) =>
          set(
            {
              selectedCourt: courtId,
              matchMode: 'manual',
              showMatchCreation: true,
              selectedPlayers: [],
            },
            false,
            'startManualMatchCreation'
          ),
      }),
      {
        name: 'session-store',
        // Only persist some fields, not all
        partialize: (state) => ({
          activeTab: state.activeTab,
          matchMode: state.matchMode,
        }),
      }
    ),
    {
      name: 'session-store',
    }
  )
);
