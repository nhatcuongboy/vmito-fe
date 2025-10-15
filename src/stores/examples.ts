/**
 * Zustand Store Examples for Badminton App
 *
 * This file contains examples of how to use the Zustand stores
 * in your components and how to migrate from existing hooks.
 */

// ============================================================================
// IMPORT EXAMPLES
// ============================================================================

import { useAppStore, useSessionStore, useCourtStore } from '@/stores';

// ============================================================================
// BASIC USAGE EXAMPLES
// ============================================================================

function ExampleComponent() {
  // App Store - Global app state
  const { isDarkMode, isLoading, setDarkMode, setLoading } = useAppStore();

  // Session Store - Session-specific state
  const {
    selectedPlayers,
    selectedCourt,
    matchMode,
    addSelectedPlayer,
    removeSelectedPlayer,
    setMatchMode,
    togglePlayerSelection,
  } = useSessionStore();

  // Court Store - Court modals and loading states
  const {
    autoAssignModalOpen,
    selectedAutoAssignCourt,
    openAutoAssignModal,
    closeAutoAssignModal,
    toggleManualPlayer,
  } = useCourtStore();

  // Usage examples...
  const handlePlayerSelect = (playerId: string) => {
    togglePlayerSelection(playerId);
  };

  const handleOpenAutoAssign = (court: any) => {
    openAutoAssignModal(court);
  };

  return null; // JSX would go here
}

// ============================================================================
// MIGRATION FROM EXISTING HOOKS
// ============================================================================

/**
 * Before (using useCourtsTabModals hook):
 *
 * const modals = useCourtsTabModals();
 * modals.openAutoAssignModal(court);
 * modals.toggleManualPlayer(playerId);
 *
 * After (using Zustand):
 *
 * const { openAutoAssignModal, toggleManualPlayer } = useCourtStore();
 * openAutoAssignModal(court);
 * toggleManualPlayer(playerId);
 */

/**
 * Before (prop drilling):
 *
 * <CourtsTab
 *   selectedPlayers={selectedPlayers}
 *   setSelectedPlayers={setSelectedPlayers}
 *   matchMode={matchMode}
 *   setMatchMode={setMatchMode}
 *   // ... many other props
 * />
 *
 * After (using Zustand inside CourtsTab):
 *
 * <CourtsTab
 *   session={session}
 *   // Only essential props needed
 * />
 *
 * // Inside CourtsTab component:
 * const { selectedPlayers, matchMode, setSelectedPlayers, setMatchMode } = useSessionStore();
 */

// ============================================================================
// ADVANCED USAGE PATTERNS
// ============================================================================

// 1. Computed values (derived state)
function useComputedSessionData() {
  const { selectedPlayers, waitingPlayers } = useSessionStore();

  const canStartMatch = selectedPlayers.length === 4;
  const availablePlayersCount = waitingPlayers.length;

  return { canStartMatch, availablePlayersCount };
}

// 2. Combined actions
function useSessionActions() {
  const {
    setSelectedCourt,
    setMatchMode,
    setShowMatchCreation,
    clearSelectedPlayers,
  } = useSessionStore();

  const startManualMatchCreation = (courtId: string) => {
    setSelectedCourt(courtId);
    setMatchMode('manual');
    setShowMatchCreation(true);
    clearSelectedPlayers();
  };

  return { startManualMatchCreation };
}

// 3. Cross-store interactions
function useCrossStoreActions() {
  const { setLoading } = useAppStore();
  const { setRefreshing } = useSessionStore();
  const { setLoadingConfirmAutoAssign } = useCourtStore();

  const startGlobalLoading = () => {
    setLoading(true);
    setRefreshing(true);
  };

  const stopGlobalLoading = () => {
    setLoading(false);
    setRefreshing(false);
    setLoadingConfirmAutoAssign(false);
  };

  return { startGlobalLoading, stopGlobalLoading };
}

// ============================================================================
// TESTING WITH ZUSTAND
// ============================================================================

/**
 * For testing, you can easily mock stores:
 *
 * import { useSessionStore } from '@/stores';
 *
 * // Mock the store
 * jest.mock('@/stores', () => ({
 *   useSessionStore: jest.fn(() => ({
 *     selectedPlayers: ['player1', 'player2'],
 *     addSelectedPlayer: jest.fn(),
 *     removeSelectedPlayer: jest.fn(),
 *   }))
 * }));
 */

// ============================================================================
// PERSISTENCE
// ============================================================================

/**
 * The SessionStore is configured with persistence for:
 * - activeTab
 * - matchMode
 *
 * These values will be restored when the app is reloaded.
 * Add more fields to the partialize function if needed.
 */

export {};
