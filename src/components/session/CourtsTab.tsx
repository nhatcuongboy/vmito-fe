import { SimpleGrid } from '@/components/ui/chakra-compat';
import { CourtDirection, SessionStatus } from '@/lib/api/types';
import { Court, Match, Player } from '@/types/session';
import { Box, Flex, Heading, HStack, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import React from 'react';
import { createCourtElapsedTimeFormatter } from '@/utils/time-helpers';
import ManualSelectPlayersModal from './ManualSelectPlayersModal';
import MatchPreviewModal from './MatchPreviewModal';
import MatchResultModal from './MatchResultModal';
import CourtCard from './CourtCard';
import WaitingPlayers from './WaitingPlayers';
import { useCourtsTabModals } from '@/hooks/useCourtsTabModals';
import { useCourtsTabActions } from '@/hooks/useCourtsTabActions';

interface CourtsTabProps {
  session: any;
  waitingPlayers: Player[];
  getCurrentMatch: (courtId: string) => Match | null;
  getCourtDisplayName: (
    courtName: string | undefined,
    courtNumber: number
  ) => string;
  mode?: 'manage' | 'view'; // New prop: "manage" (default) allows actions, "view" is read-only
  startManualMatchCreation?: (courtId: string) => void;
  onDataRefresh?: () => void;
  isRefreshing?: boolean;
  formatWaitTime: (waitTimeInMinutes: number) => string;
  selectedPlayers: string[]; // Only needed for WaitingPlayers component
}

const CourtsTab: React.FC<CourtsTabProps> = ({
  session,
  waitingPlayers,
  selectedPlayers,
  getCurrentMatch,
  getCourtDisplayName,
  mode = 'manage',
  startManualMatchCreation,
  onDataRefresh,
  isRefreshing = false,
  formatWaitTime,
}) => {
  const t = useTranslations('SessionDetail');

  // Create formatter function if not provided via props
  const elapsedTimeFormatter = createCourtElapsedTimeFormatter(t);

  // Custom hooks for modals and actions
  const modals = useCourtsTabModals();
  const actions = useCourtsTabActions({ onDataRefresh });

  // Helper function to check if court has valid pre-selected players
  const hasPreSelectedPlayers = (court: Court): boolean => {
    return !!(
      court.preSelectedPlayers &&
      Array.isArray(court.preSelectedPlayers) &&
      court.preSelectedPlayers.length > 0
    );
  };

  // Wrapper functions that connect hooks with actions
  const handleConfirmAutoAssign = (
    suggestedPlayers: any,
    direction: CourtDirection = CourtDirection.HORIZONTAL
  ) => {
    actions.handleConfirmAutoAssign(
      suggestedPlayers,
      modals.selectedAutoAssignCourt,
      direction,
      modals.setLoadingConfirmAutoAssign,
      modals.closeAutoAssignModal
    );
  };

  const handleChoosePlayersForCourt = (
    playersData: string[] | Array<{ playerId: string; position: number }>,
    courtId: string
  ) => {
    const closeModals = () => {
      modals.closeAutoAssignModal();
      modals.closeManualSelectionModal();
    };

    actions.handleChoosePlayersForCourt(
      playersData,
      courtId,
      modals.setLoadingConfirmAutoAssign,
      modals.setConfirmingManualMatch,
      closeModals
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

  return (
    <>
      {/* Courts Section */}
      <Box>
        <Box paddingY="3" width="100%">
          <Flex justifyContent="space-between" alignItems="center">
            <HStack gap={2} alignItems="center">
              <Heading size="md">{t('courtsTab.activeCourts')}</Heading>
            </HStack>
            <HStack gap={2}>
              {session.status === 'IN_PROGRESS' && <HStack gap={2}></HStack>}
            </HStack>
          </Flex>
        </Box>
        {session.status !== SessionStatus.IN_PROGRESS && (
          <Text fontSize="lg" color="gray.500" textAlign="center" mt={4}>
            {session.status === SessionStatus.PREPARING
              ? t('courtsTab.startSessionToBeginMatches')
              : t('courtsTab.sessionHasEnded')}
          </Text>)}
        <Box>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={6} mt={4} p={1}>
            {session.courts.map((court: Court) => {
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
                  onAutoAssignClick={modals.openAutoAssignModal}
                  onManualSelectionClick={modals.openManualSelectionModal}
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
                  startManualMatchCreation={startManualMatchCreation}
                />
              );
            })}
          </SimpleGrid>
        </Box>
      </Box>

      {/* Auto Assign Match Modal */}
      <MatchPreviewModal
        isOpen={modals.autoAssignModalOpen}
        court={modals.selectedAutoAssignCourt}
        waitingPlayersCount={waitingPlayers.length}
        numberOfCourts={session.numberOfCourts}
        onConfirm={handleConfirmAutoAssign}
        onCancel={modals.closeAutoAssignModal}
        getCourtDisplayName={getCourtDisplayName}
        isLoadingConfirm={modals.loadingConfirmAutoAssign}
        title={
          modals.selectedAutoAssignCourt
            ? t('courtsTab.autoAssignMatchTitle', {
              courtNumber: modals.selectedAutoAssignCourt.courtNumber,
            })
            : undefined
        }
        description={t('courtsTab.autoAssignMatchDescription')}
        courtColor={session.courtColor}
      />

      {/* Manual Selection Modal */}
      <ManualSelectPlayersModal
        isOpen={modals.manualSelectModalOpen}
        court={modals.selectedManualCourt}
        waitingPlayers={waitingPlayers}
        selectedPlayers={modals.manualSelectedPlayers}
        currentPosition={modals.manualCurrentPosition}
        onPlayerToggle={modals.toggleManualPlayer}
        onPositionSelect={modals.setManualCurrentPosition}
        onPlayerRemove={modals.clearManualPlayerAtPosition}
        onConfirm={(playersWithPosition) => {
          if (modals.selectedManualCourt) {
            handleChoosePlayersForCourt(
              playersWithPosition,
              modals.selectedManualCourt.id
            );
          }
        }}
        onCancel={modals.closeManualSelectionModal}
        isLoading={modals.confirmingManualMatch}
        formatWaitTime={(minutes) => {
          const hours = Math.floor(minutes / 60);
          const mins = minutes % 60;
          if (hours > 0) {
            return `${hours}h${mins}m`;
          }
          return `${mins}m`;
        }}
      />

      {/* Pre-select Players Modal */}
      <ManualSelectPlayersModal
        isOpen={modals.preSelectModalOpen}
        court={modals.selectedPreSelectCourt}
        waitingPlayers={waitingPlayers}
        selectedPlayers={modals.preSelectPlayers}
        currentPosition={modals.preSelectCurrentPosition}
        onPlayerToggle={modals.togglePreSelectPlayer}
        onPositionSelect={modals.setPreSelectCurrentPosition}
        onPlayerRemove={modals.clearPreSelectPlayerAtPosition}
        onConfirm={handleConfirmPreSelect}
        onCancel={modals.closePreSelectModal}
        isLoading={modals.confirmingPreSelect}
        title={
          modals.selectedPreSelectCourt
            ? t('courtsTab.preSelectTitle', {
              courtNumber: modals.selectedPreSelectCourt.courtNumber,
            })
            : undefined
        }
        formatWaitTime={(minutes) => {
          const hours = Math.floor(minutes / 60);
          const mins = minutes % 60;
          if (hours > 0) {
            return `${hours}h${mins}m`;
          }
          return `${mins}m`;
        }}
      />

      {/* Match Result Modal */}
      <MatchResultModal
        isOpen={modals.matchResultModalOpen}
        match={modals.selectedMatch}
        onConfirm={handleMatchResultSubmit}
        onCancel={modals.closeMatchResultModal}
        isLoading={modals.loadingEndMatchId === modals.selectedMatch?.id}
        direction={
          session.courts.find(
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

export default CourtsTab;
