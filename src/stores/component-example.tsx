/**
 * Example: Converting a component to use Zustand
 *
 * This shows how to refactor a component that currently uses props
 * to use Zustand stores instead.
 */

import React from 'react';
import { useSessionStore, useCourtStore } from '@/stores';

// Before: Component with many props
interface OldComponentProps {
  selectedPlayers: string[];
  setSelectedPlayers: (players: string[]) => void;
  matchMode: 'auto' | 'manual';
  setMatchMode: (mode: 'auto' | 'manual') => void;
  selectedCourt: string | null;
  setSelectedCourt: (court: string | null) => void;
  showMatchCreation: boolean;
  setShowMatchCreation: (show: boolean) => void;
  autoAssignModalOpen: boolean;
  openAutoAssignModal: (court: any) => void;
  closeAutoAssignModal: () => void;
}

// After: Component with minimal props (only essential data)
interface NewComponentProps {
  session: any; // Essential data that comes from parent
  waitingPlayers: any[]; // Data that might be fetched by parent
}

export function ExampleComponentWithZustand({
  session,
  waitingPlayers,
}: NewComponentProps) {
  // Get state and actions from stores
  const {
    selectedPlayers,
    matchMode,
    selectedCourt,
    showMatchCreation,
    addSelectedPlayer,
    removeSelectedPlayer,
    setMatchMode,
    setSelectedCourt,
    setShowMatchCreation,
    togglePlayerSelection,
    startManualMatchCreation,
    cancelMatchCreation,
  } = useSessionStore();

  const {
    autoAssignModalOpen,
    openAutoAssignModal,
    closeAutoAssignModal,
    manualSelectedPlayers,
    toggleManualPlayer,
  } = useCourtStore();

  // Component logic stays the same
  const handlePlayerClick = (playerId: string) => {
    togglePlayerSelection(playerId);
  };

  const handleStartManualMatch = (courtId: string) => {
    startManualMatchCreation(courtId);
  };

  const handleConfirmMatch = () => {
    if (selectedPlayers.length === 4 && selectedCourt) {
      // Create match logic...
      cancelMatchCreation();
    }
  };

  return (
    <div>
      <h3>Match Mode: {matchMode}</h3>
      <p>Selected Players: {selectedPlayers.length}/4</p>

      {/* Player selection */}
      <div>
        {waitingPlayers.map((player) => (
          <button
            key={player.id}
            onClick={() => handlePlayerClick(player.id)}
            className={selectedPlayers.includes(player.id) ? 'selected' : ''}
          >
            {player.name}
          </button>
        ))}
      </div>

      {/* Court selection */}
      <div>
        {session.courts.map((court: any) => (
          <button
            key={court.id}
            onClick={() => handleStartManualMatch(court.id)}
          >
            Court {court.courtNumber}
          </button>
        ))}
      </div>

      {/* Match creation controls */}
      {showMatchCreation && (
        <div>
          <button onClick={handleConfirmMatch}>Confirm Match</button>
          <button onClick={cancelMatchCreation}>Cancel</button>
        </div>
      )}

      {/* Auto assign modal */}
      {autoAssignModalOpen && (
        <div>
          <h4>Auto Assign Players</h4>
          <button onClick={closeAutoAssignModal}>Close</button>
        </div>
      )}
    </div>
  );
}

// Usage in parent component:
export function ParentComponent() {
  // Assume these are fetched/provided by parent
  const session = {}; // Your session data
  const waitingPlayers: any[] = []; // Your waiting players data

  // Parent only needs to provide essential data
  // No need to manage and pass down all the state
  return (
    <ExampleComponentWithZustand
      session={session}
      waitingPlayers={waitingPlayers}
    />
  );
}
