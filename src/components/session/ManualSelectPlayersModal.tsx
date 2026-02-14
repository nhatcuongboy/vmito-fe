import React, { useMemo } from 'react';
import { Box, Text } from '@chakra-ui/react';
import { PlayerGrid } from '@/components/player/PlayerGrid';
import { VModal } from '@/components/ui/VModal';
import { Player, Court } from '@/types/session';
import BadmintonCourt from '@/components/court/BadmintonCourt';
import { useTranslations } from 'next-intl';
import { CourtDirection } from '@/lib/api/types';

interface ManualSelectPlayersModalProps {
  isOpen: boolean;
  court: Court | null;
  waitingPlayers: Player[];
  selectedPlayers: (string | null)[]; // Changed to fixed 4-slot array
  currentPosition: number; // Current position being filled
  onPlayerToggle: (playerId: string) => void;
  onPositionSelect: (position: number) => void; // New: select position to fill
  onPlayerRemove: (position: number) => void; // New: remove player at position
  onConfirm: (
    playersWithPosition: Array<{ playerId: string; position: number }>
  ) => void;
  onCancel: () => void;
  formatWaitTime: (waitTimeInMinutes: number) => string;
  isLoading?: boolean;
  getCourtDisplayName?: (
    courtName: string | undefined,
    courtNumber: number
  ) => string;
  title?: string;
}

const ManualSelectPlayersModal: React.FC<ManualSelectPlayersModalProps> = ({
  isOpen,
  court,
  waitingPlayers,
  selectedPlayers,
  currentPosition,
  onPlayerToggle,
  onPositionSelect,
  onPlayerRemove,
  onConfirm,
  onCancel,
  formatWaitTime,
  isLoading = false,
  getCourtDisplayName = (name, number) => name || `Court ${number}`,
  title,
}) => {
  const t = useTranslations('SessionDetail');

  // Create selectedPositions array from the fixed-position selectedPlayers
  const selectedPositions = useMemo(() => {
    return selectedPlayers.map((playerId) => {
      if (!playerId) return undefined;
      return waitingPlayers.find((p) => p.id === playerId);
    });
  }, [selectedPlayers, waitingPlayers]);

  // Count selected players (non-null entries)
  const selectedCount = useMemo(
    () => selectedPlayers.filter((p) => p !== null).length,
    [selectedPlayers]
  );

  // Early return after all hooks have been called
  if (!isOpen || !court) return null;

  const handleConfirmSelection = () => {
    if (selectedCount === 4) {
      const playersWithPosition = selectedPlayers
        .map((playerId, index) => ({
          playerId: playerId as string,
          position: index,
        }))
        .filter((p) => p.playerId !== null);
      if (typeof onConfirm === 'function') {
        onConfirm(playersWithPosition);
      }
    }
  };

  return (
    <VModal
      isOpen={isOpen}
      onClose={onCancel}
      title={
        title ||
        t('courtsTab.manualPlayerSelectionTitle', {
          courtNumber: court.courtNumber,
        })
      }
      size="xl" // xl corresponds to 800px, but the original was 6xl (huge). VModal 'xl' or 'full' might be better.
      // Let's use custom maxW if needed, or stick to xl/full.
      // Original maxW="6xl" is very wide. I'll use size="xl" for now or keep it flexible.
      showCloseButton={true}
      primaryActionText={t('courtsTab.confirmMatchManual', {
        count: selectedCount,
      })}
      onPrimaryAction={handleConfirmSelection}
      isPrimaryDisabled={selectedCount !== 4 || isLoading}
      isPrimaryLoading={isLoading}
      secondaryActionText={t('courtsTab.cancel')}
      maxBodyHeight="75vh"
    >
      <Box p={0}>
        {/* Court Preview and Selected Players Section */}
        <Box mb={6}>
          <Text fontSize="sm" fontWeight="medium" mb={3}>
            {t('courtsTab.selectedPlayersCount', {
              count: selectedCount,
            })}
          </Text>

          {/* BadmintonCourt for Selected Players */}
          <Box maxW="400px" mx="auto">
            <BadmintonCourt
              players={[]}
              isActive={false}
              mode="selection"
              selectedPositions={selectedPositions}
              currentPlayerPosition={currentPosition}
              onPlayerRemove={onPlayerRemove}
              onPositionSelect={onPositionSelect}
              courtName={getCourtDisplayName(
                court.courtName,
                court.courtNumber
              )}
              width="100%"
              showTimeInCenter={false}
              direction={court?.direction || CourtDirection.HORIZONTAL}
            />
          </Box>
        </Box>

        {/* Available Players */}
        <Box>
          <Text fontSize="md" fontWeight="medium" mb={3}>
            {t('courtsTab.availablePlayers')}
          </Text>
          {waitingPlayers.length === 0 ? (
            <Text fontSize="sm" color="gray.500" textAlign="center" py={8}>
              {t('courtsTab.noPlayersWaiting')}
            </Text>
          ) : (
            <PlayerGrid
              players={waitingPlayers}
              playerFilter={['WAITING']}
              formatWaitTime={formatWaitTime}
              selectedPlayers={selectedPlayers.filter(
                (p): p is string => p !== null
              )}
              onPlayerToggle={onPlayerToggle}
              selectionMode={true}
            />
          )}
        </Box>
      </Box>
    </VModal>
  );
};

export default ManualSelectPlayersModal;
