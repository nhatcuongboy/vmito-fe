import { useToast } from '@/components/ui/chakra-compat';
import { CourtService } from '@/lib/api/court.service';
import { CourtDirection, SuggestedPlayersResponse } from '@/lib/api/types';
import { Court, Player } from '@/types/session';
import { useTranslations } from 'next-intl';

interface UseCourtsTabActionsProps {
  onDataRefresh?: () => void;
}

export const useCourtsTabActions = ({
  onDataRefresh,
}: UseCourtsTabActionsProps) => {
  const toast = useToast();
  const t = useTranslations('SessionDetail');

  // Handle confirm from modal with suggested players
  const handleConfirmAutoAssign = async (
    suggestedPlayers: SuggestedPlayersResponse,
    selectedAutoAssignCourt: Court | null,
    direction: CourtDirection = CourtDirection.HORIZONTAL,
    setLoadingConfirmAutoAssign: (loading: boolean) => void,
    closeModal: () => void
  ) => {
    if (!selectedAutoAssignCourt) return;

    try {
      setLoadingConfirmAutoAssign(true);

      const playerIds = [
        ...suggestedPlayers.pair1.players.map((p: Player) => p.id),
        ...suggestedPlayers.pair2.players.map((p: Player) => p.id),
      ];

      const playersWithPosition: Array<{ playerId: string; position: number }> =
        [
          ...suggestedPlayers.pair1.players.map((p: Player, index: number) => ({
            playerId: p.id,
            position:
              direction === CourtDirection.HORIZONTAL
                ? index
                : index === 0
                  ? 0
                  : 2,
          })),
          ...suggestedPlayers.pair2.players.map((p: Player, index: number) => ({
            playerId: p.id,
            position:
              direction === CourtDirection.HORIZONTAL
                ? index + 2
                : index === 0
                  ? 1
                  : 3,
          })),
        ];

      await CourtService.selectPlayers(
        selectedAutoAssignCourt.id,
        playerIds,
        playersWithPosition
      );

      closeModal();

      if (onDataRefresh) {
        onDataRefresh();
      }

      toast.toast({
        title: t('courtsTab.playersAssignedToCourt'),
        description: t('courtsTab.pleaseStartMatchManually'),
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error selecting players for court:', error);
      toast.toast({
        title: t('courtsTab.errorAssigningPlayers'),
        description: t('courtsTab.pleaseRetryLater'),
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoadingConfirmAutoAssign(false);
    }
  };

  // Select players for court (used by both auto-assign and manual selection)
  const handleChoosePlayersForCourt = async (
    playersData: string[] | Array<{ playerId: string; position: number }>,
    courtId: string,
    setLoadingConfirmAutoAssign: (loading: boolean) => void,
    setConfirmingManualMatch: (confirming: boolean) => void,
    closeModals: () => void
  ) => {
    try {
      setLoadingConfirmAutoAssign(true);
      setConfirmingManualMatch(true);

      // Handle different data formats
      let playerIds: string[];
      let playersWithPosition:
        | Array<{ playerId: string; position: number }>
        | undefined;

      if (Array.isArray(playersData) && playersData.length > 0) {
        if (typeof playersData[0] === 'string') {
          playerIds = playersData as string[];
          playersWithPosition = undefined;
        } else {
          const playersWithPos = playersData as Array<{
            playerId: string;
            position: number;
          }>;
          const sortedPlayers = playersWithPos.sort(
            (a, b) => a.position - b.position
          );
          playerIds = sortedPlayers.map((p) => p.playerId);
          playersWithPosition = sortedPlayers;
        }
      } else {
        playerIds = [];
        playersWithPosition = undefined;
      }

      await CourtService.selectPlayers(courtId, playerIds, playersWithPosition);

      closeModals();

      if (onDataRefresh) {
        onDataRefresh();
      }

      toast.toast({
        title: t('courtsTab.playersAssignedToCourt'),
        description: t('courtsTab.pleaseStartMatchManually'),
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error selecting players for court:', error);
      toast.toast({
        title: t('courtsTab.errorAssigningPlayers'),
        description: t('courtsTab.pleaseRetryLater'),
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoadingConfirmAutoAssign(false);
      setConfirmingManualMatch(false);
    }
  };

  // Confirm pre-select
  const handleConfirmPreSelect = async (
    playersWithPosition: Array<{ playerId: string; position: number }>,
    selectedPreSelectCourt: Court | null,
    setConfirmingPreSelect: (confirming: boolean) => void,
    closeModal: () => void
  ) => {
    if (!selectedPreSelectCourt) return;

    try {
      setConfirmingPreSelect(true);
      await CourtService.preSelectPlayers(
        selectedPreSelectCourt.id,
        playersWithPosition
      );

      closeModal();

      if (onDataRefresh) {
        onDataRefresh();
      }
    } catch (error) {
      console.error('Error pre-selecting players:', error);
      toast.toast({
        title: t('courtsTab.errorPreSelecting'),
        description: t('courtsTab.pleaseRetryLater'),
        status: 'error',
        duration: 3000,
      });
    } finally {
      setConfirmingPreSelect(false);
    }
  };

  // Cancel pre-selection for a court
  const handleCancelCourtPreSelect = async (
    courtId: string,
    setLoadingCancelPreSelect: (courtId: string | null) => void
  ) => {
    try {
      setLoadingCancelPreSelect(courtId);
      await CourtService.cancelPreSelect(courtId);

      if (onDataRefresh) {
        onDataRefresh();
      }

      toast.toast({
        title: t('courtsTab.preSelectCancelled'),
        description: t('courtsTab.preSelectCancelledDesc'),
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error cancelling pre-selection:', error);
      toast.toast({
        title: t('courtsTab.errorCancellingPreSelect'),
        description: t('courtsTab.pleaseRetryLater'),
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoadingCancelPreSelect(null);
    }
  };

  // Handle match result submission
  const handleMatchResultSubmit = async (
    result: {
      score?: Array<{ playerId: string; score: number }>;
      winnerIds?: string[];
      isDraw?: boolean;
      notes?: string;
    },
    selectedMatch: any,
    session: any,
    setLoadingEndMatchId: (matchId: string | null) => void,
    closeModal: () => void
  ) => {
    if (!selectedMatch) return;

    try {
      setLoadingEndMatchId(selectedMatch.id);

      const court = session.courts.find(
        (c: Court) => c.id === selectedMatch.courtId
      );
      if (!court) return;

      await CourtService.endMatch(court.id, result);

      closeModal();

      if (onDataRefresh) onDataRefresh();

      toast.toast({
        title: t('courtsTab.matchEndedSuccessfully'),
        description: t('courtsTab.courtAvailableForPlay'),
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error ending match:', error);
      toast.toast({
        title: t('courtsTab.errorEndingMatch'),
        description: t('courtsTab.pleaseRetryLater'),
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoadingEndMatchId(null);
    }
  };

  // Start match
  const handleStartMatch = async (
    courtId: string,
    setLoadingStartMatchCourtId: (courtId: string | null) => void
  ) => {
    setLoadingStartMatchCourtId(courtId);
    try {
      await CourtService.startMatch(courtId);
      if (onDataRefresh) onDataRefresh();
      toast.toast({
        title: t('courtsTab.matchStartedSuccessfully'),
        description: t('courtsTab.matchHasStarted'),
        status: 'success',
        duration: 3000,
      });
    } finally {
      setLoadingStartMatchCourtId(null);
    }
  };

  // Deselect players
  const handleDeselectPlayers = async (
    courtId: string,
    setLoadingCancelCourtId: (courtId: string | null) => void
  ) => {
    setLoadingCancelCourtId(courtId);
    try {
      await CourtService.deselectPlayers(courtId);
      if (onDataRefresh) onDataRefresh();
      toast.toast({
        title: t('courtsTab.playersDeselected'),
        description: t('courtsTab.courtAvailableForPlay'),
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error deselecting players:', error);
    } finally {
      setLoadingCancelCourtId(null);
    }
  };

  return {
    handleConfirmAutoAssign,
    handleChoosePlayersForCourt,
    handleConfirmPreSelect,
    handleCancelCourtPreSelect,
    handleMatchResultSubmit,
    handleStartMatch,
    handleDeselectPlayers,
  };
};
