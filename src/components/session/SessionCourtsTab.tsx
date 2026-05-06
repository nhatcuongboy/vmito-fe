import { SimpleGrid } from '@/components/ui/chakra-compat';
import {
  CourtDirection,
  ISession,
  SessionStatus,
  SuggestedPlayersResponse,
} from '@/lib/api/types';
import { Court, Match, Player } from '@/types/session';
import { Box, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import React from 'react';
import { createCourtElapsedTimeFormatter } from '@/utils/time-helpers';
import CourtPlayerSelectionModal from './CourtPlayerSelectionModal';
import MatchResultModal from './MatchResultModal';
import CourtCard from './CourtCard';
import WaitingPlayers from './WaitingPlayers';
import { useCourtsTabModals } from '@/hooks/useCourtsTabModals';
import { useCourtsTabActions } from '@/hooks/useCourtsTabActions';

interface SessionCourtsTabProps {
  session: ISession;
  waitingPlayers: Player[];
  getCurrentMatch: (courtId: string) => Match | null;
  getCourtDisplayName: (
    courtName: string | undefined,
    courtNumber: number
  ) => string;
  mode?: 'manage' | 'view';
  onDataRefresh?: () => void;
  isRefreshing?: boolean;
  formatWaitTime: (waitTimeInMinutes: number) => string;
  selectedPlayers: string[];
}

const SessionCourtsTab: React.FC<SessionCourtsTabProps> = ({
  session,
  waitingPlayers,
  selectedPlayers,
  getCurrentMatch,
  getCourtDisplayName,
  mode = 'manage',
  onDataRefresh,
  isRefreshing = false,
  formatWaitTime,
}) => {
  const t = useTranslations('SessionDetail');

  const elapsedTimeFormatter = createCourtElapsedTimeFormatter(t);

  const modals = useCourtsTabModals({
    defaultMatchType: session.defaultMatchType,
  });
  const actions = useCourtsTabActions({ onDataRefresh });

  const hasPreSelectedPlayers = (court: Court): boolean => {
    return !!(
      court.preSelectedPlayers &&
      Array.isArray(court.preSelectedPlayers) &&
      court.preSelectedPlayers.length > 0
    );
  };

  // Unified modal: auto-assign confirm handler
  const handleConfirmAutoAssign = (
    suggestedPlayers: SuggestedPlayersResponse,
    direction: CourtDirection = CourtDirection.HORIZONTAL
  ) => {
    actions.handleConfirmAutoAssign(
      suggestedPlayers,
      modals.selectedPlayerSelectionCourt,
      direction,
      modals.setLoadingConfirmAutoAssign,
      modals.closePlayerSelectionModal,
      modals.matchType
    );
  };

  // Unified modal: manual confirm handler
  const handleConfirmManual = (
    playersWithPosition: Array<{ playerId: string; position: number }>
  ) => {
    if (!modals.selectedPlayerSelectionCourt) return;
    actions.handleChoosePlayersForCourt(
      playersWithPosition,
      modals.selectedPlayerSelectionCourt.id,
      modals.setLoadingConfirmAutoAssign,
      modals.setConfirmingManualMatch,
      modals.closePlayerSelectionModal
    );
  };

  const handleConfirmPreSelect = (
    playersWithPosition: Array<{ playerId: string; position: number }>
  ) => {
    actions.handleConfirmPreSelect(
      playersWithPosition,
      modals.selectedPreSelectCourt,
      modals.setConfirmingPreSelect,
      modals.closePreSelectModal
    );
  };

  // Auto-assign confirm for pre-select flow
  const handlePreSelectAutoConfirm = (
    suggestedPlayers: SuggestedPlayersResponse,
    direction: CourtDirection = CourtDirection.HORIZONTAL
  ) => {
    const playersWithPosition: Array<{ playerId: string; position: number }> = [
      ...suggestedPlayers.pair1.players.map((p, index) => ({
        playerId: p.id,
        position:
          direction === CourtDirection.HORIZONTAL ? index : index === 0 ? 0 : 2,
      })),
      ...suggestedPlayers.pair2.players.map((p, index) => ({
        playerId: p.id,
        position:
          direction === CourtDirection.HORIZONTAL
            ? index + 2
            : index === 0
              ? 1
              : 3,
      })),
    ];
    handleConfirmPreSelect(playersWithPosition);
  };

  const handleCancelCourtPreSelect = async (courtId: string) => {
    await actions.handleCancelCourtPreSelect(
      courtId,
      modals.setLoadingCancelPreSelect
    );
  };

  const handleMatchResultSubmit = (result: {
    score?: Array<{ playerId: string; score: number }>;
    winnerIds?: string[];
    isDraw?: boolean;
    notes?: string;
  }) => {
    if (!modals.selectedMatch) return;

    actions.handleMatchResultSubmit(
      result,
      modals.selectedMatch,
      session,
      modals.setLoadingEndMatchId,
      modals.closeMatchResultModal
    );
  };

  const handleStartMatch = async (courtId: string) => {
    await actions.handleStartMatch(courtId, modals.setLoadingStartMatchCourtId);
  };

  const handleDeselectPlayers = async (courtId: string) => {
    await actions.handleDeselectPlayers(
      courtId,
      modals.setLoadingCancelCourtId
    );
  };

  const waitTimeFormatter = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <>
      {/* Courts Section */}
      <Box>
        {session.status !== SessionStatus.IN_PROGRESS && (
          <Text fontSize="lg" color="fg.muted" textAlign="center" mt={4}>
            {session.status === SessionStatus.PREPARING
              ? t('courtsTab.startSessionToBeginMatches')
              : t('courtsTab.sessionHasEnded')}
          </Text>
        )}
        <Box>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={6} mt={4} p={1}>
            {(session.courts ?? []).map((court: Court) => {
              const currentMatch = getCurrentMatch(court.id);
              return (
                <CourtCard
                  key={court.id}
                  court={court}
                  currentMatch={currentMatch}
                  session={session}
                  mode={mode}
                  isRefreshing={isRefreshing}
                  waitingPlayers={waitingPlayers}
                  onAssignPlayersClick={modals.openPlayerSelectionModal}
                  onPreSelectClick={modals.openPreSelectModal}
                  onStartMatch={handleStartMatch}
                  onDeselectPlayers={handleDeselectPlayers}
                  onCancelPreSelect={handleCancelCourtPreSelect}
                  onEndMatch={modals.openMatchResultModal}
                  elapsedTimeFormatter={elapsedTimeFormatter}
                  getCourtDisplayName={getCourtDisplayName}
                  hasPreSelectedPlayers={hasPreSelectedPlayers}
                  loadingStartMatchCourtId={modals.loadingStartMatchCourtId}
                  loadingCancelCourtId={modals.loadingCancelCourtId}
                  loadingCancelPreSelect={modals.loadingCancelPreSelect}
                  loadingEndMatchId={modals.loadingEndMatchId}
                />
              );
            })}
          </SimpleGrid>
        </Box>
      </Box>

      {/* Unified Player Selection Modal (Auto + Manual) */}
      <CourtPlayerSelectionModal
        isOpen={modals.playerSelectionModalOpen}
        court={modals.selectedPlayerSelectionCourt}
        waitingPlayers={waitingPlayers}
        waitingPlayersCount={waitingPlayers.length}
        numberOfCourts={session.numberOfCourts}
        matchType={modals.matchType}
        onMatchTypeChange={modals.handleMatchTypeChange}
        selectedPlayers={modals.manualSelectedPlayers}
        currentPosition={modals.manualCurrentPosition}
        onPlayerToggle={modals.toggleManualPlayer}
        onPositionSelect={modals.setManualCurrentPosition}
        onPlayerRemove={modals.clearManualPlayerAtPosition}
        onConfirmAuto={handleConfirmAutoAssign}
        onConfirmManual={handleConfirmManual}
        onCancel={modals.closePlayerSelectionModal}
        getCourtDisplayName={getCourtDisplayName}
        formatWaitTime={waitTimeFormatter}
        isLoadingAutoConfirm={modals.loadingConfirmAutoAssign}
        isLoadingManualConfirm={modals.confirmingManualMatch}
        courtColor={session.courtColor}
      />

      {/* Pre-select Players Modal (unified auto + manual) */}
      <CourtPlayerSelectionModal
        isOpen={modals.preSelectModalOpen}
        court={modals.selectedPreSelectCourt}
        waitingPlayers={waitingPlayers}
        waitingPlayersCount={waitingPlayers.length}
        numberOfCourts={session.numberOfCourts}
        matchType={modals.preSelectMatchType}
        onMatchTypeChange={modals.handlePreSelectMatchTypeChange}
        selectedPlayers={modals.preSelectPlayers}
        currentPosition={modals.preSelectCurrentPosition}
        onPlayerToggle={modals.togglePreSelectPlayer}
        onPositionSelect={modals.setPreSelectCurrentPosition}
        onPlayerRemove={modals.clearPreSelectPlayerAtPosition}
        onConfirmAuto={handlePreSelectAutoConfirm}
        onConfirmManual={handleConfirmPreSelect}
        onCancel={modals.closePreSelectModal}
        getCourtDisplayName={getCourtDisplayName}
        formatWaitTime={waitTimeFormatter}
        isLoadingAutoConfirm={modals.confirmingPreSelect}
        isLoadingManualConfirm={modals.confirmingPreSelect}
        courtColor={session.courtColor}
        title={
          modals.selectedPreSelectCourt
            ? t('courtsTab.preSelectTitle', {
                courtNumber: modals.selectedPreSelectCourt.courtNumber,
              })
            : undefined
        }
      />

      {/* Match Result Modal */}
      <MatchResultModal
        isOpen={modals.matchResultModalOpen}
        match={modals.selectedMatch}
        onConfirm={handleMatchResultSubmit}
        onCancel={modals.closeMatchResultModal}
        isLoading={modals.loadingEndMatchId === modals.selectedMatch?.id}
        direction={
          (session.courts ?? []).find(
            (c: Court) => c.id === modals.selectedMatch?.courtId
          )?.direction || CourtDirection.HORIZONTAL
        }
      />

      {/* Waiting Players Section */}
      <WaitingPlayers
        waitingPlayers={waitingPlayers}
        formatWaitTime={formatWaitTime}
        selectedPlayers={selectedPlayers}
        mode={mode}
      />
    </>
  );
};

export default SessionCourtsTab;
