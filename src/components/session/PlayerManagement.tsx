'use client';

import AddPlayerModal from '@/components/session/player-management/AddPlayerModal';
import EditPlayerModal from '@/components/session/player-management/EditPlayerModal';
import { PlayerDetailModal } from '@/components/player/PlayerDetailModal';
import PlayerList from '@/components/session/player-management/PlayerList';
import PlayerStatsHeader from '@/components/session/player-management/PlayerStatsHeader';
import { usePlayerManagement } from '@/components/session/player-management/usePlayerManagement';
import { ISession, Player } from '@/lib/api/types';
import { Box, Text } from '@chakra-ui/react';
import { Button, HStack, VStack } from '@/components/ui/chakra-compat';
import { CommonModal } from '@/components/ui/CommonModal';
import { AlertCircle, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useState } from 'react';

// Import PlayerFilter type from PlayersTab
import { PlayerFilter } from './PlayersTab';

interface PlayerManagementProps {
  session: ISession;
  onDataRefresh?: () => void;
  playerFilter?: PlayerFilter;
}

const PlayerManagement: React.FC<PlayerManagementProps> = ({
  session,
  onDataRefresh,
  playerFilter = [],
}) => {
  const t = useTranslations('pages.playerManagement');
  const tDetail = useTranslations('SessionDetail');
  const tCommon = useTranslations('common');

  const formatWaitTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return tDetail('hoursMinutes', { hours, minutes: mins });
    }
    return tDetail('minutesShort', { minutes: mins });
  };

  const {
    newPlayers,
    editingPlayers,
    isSaving,
    showMaxPlayersWarning,
    availableUsers,
    isLoadingUsers,
    newPlayerErrors,
    availableLevels,
    maxPlayers,
    currentPlayerCount,
    removeNewPlayerRow,
    clearAllNewPlayers,
    handleUserSelection,
    updateNewPlayer,
    startEditingPlayer,
    cancelEditingPlayer,
    updateEditingPlayer,
    savePlayerChanges,
    saveIndividualPlayer,
    deletePlayer,
    confirmDeletePlayer,
    playerToDelete,
    handleAddNewPlayer,
    confirmAddPlayerDespiteWarning,
    cancelAddPlayer,
    isUserAlreadyUsed,
    setPlayerToDelete,
    togglePlayerStatus,
  } = usePlayerManagement(session, onDataRefresh);

  // Detail Modal State (UI specific)
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [selectedPlayerForDetail, setSelectedPlayerForDetail] =
    useState<Player | null>(null);

  // Add Player Modal State
  const [showAddPlayerModal, setShowAddPlayerModal] = useState<boolean>(false);

  // Edit Player Modal State
  const [showEditPlayerModal, setShowEditPlayerModal] =
    useState<boolean>(false);
  const [selectedPlayerForEdit, setSelectedPlayerForEdit] =
    useState<Player | null>(null);

  const showPlayerDetail = (player: Player) => {
    setSelectedPlayerForDetail(player);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedPlayerForDetail(null);
  };

  const openAddPlayerModal = () => {
    handleAddNewPlayer(); // This adds the first empty player row
    setShowAddPlayerModal(true);
  };

  const closeAddPlayerModal = () => {
    clearAllNewPlayers();
    setShowAddPlayerModal(false);
  };

  const handleSaveAndClose = async () => {
    await savePlayerChanges();
    setShowAddPlayerModal(false);
  };

  // Handle cancel from warning modal - also close Add Player modal
  const handleCancelWarning = () => {
    cancelAddPlayer();
    setShowAddPlayerModal(false);
  };

  // Edit Player Modal handlers
  const openEditPlayerModal = (player: Player) => {
    startEditingPlayer(player);
    setSelectedPlayerForEdit(player);
    setShowEditPlayerModal(true);
  };

  const closeEditPlayerModal = () => {
    if (selectedPlayerForEdit) {
      cancelEditingPlayer(selectedPlayerForEdit.id);
    }
    setSelectedPlayerForEdit(null);
    setShowEditPlayerModal(false);
  };

  const handleSaveEditAndClose = async (playerId: string) => {
    await saveIndividualPlayer(playerId);
    setSelectedPlayerForEdit(null);
    setShowEditPlayerModal(false);
  };

  return (
    <VStack spacing={8} align="stretch" p={{ base: 2, md: 4 }}>
      {/* Header section with stats */}
      {/* <PlayerStatsHeader
        session={session}
        newPlayersCount={newPlayers.length}
        maxPlayers={maxPlayers}
      /> */}

      {/* Add Player Button */}

      {/* Add Player Modal */}
      <AddPlayerModal
        isOpen={showAddPlayerModal && !showMaxPlayersWarning}
        onClose={closeAddPlayerModal}
        newPlayers={newPlayers}
        availableUsers={availableUsers}
        isLoadingUsers={isLoadingUsers}
        errors={newPlayerErrors}
        availableLevels={availableLevels}
        isSaving={isSaving}
        onUpdatePlayer={updateNewPlayer}
        onRemovePlayer={removeNewPlayerRow}
        onUserSelect={handleUserSelection}
        onAddPlayer={handleAddNewPlayer}
        onSaveAll={handleSaveAndClose}
        onCancelAll={clearAllNewPlayers}
        isUserAlreadyUsed={isUserAlreadyUsed}
      />

      {/* Player List - apply filter */}
      {/* Player List - apply filter */}
      {(() => {
        const allPlayers = session.players || [];
        const filteredPlayers =
          playerFilter.length === 0
            ? allPlayers
            : allPlayers.filter((p) => playerFilter.includes(p.status as any));

        // Get translated filter name for empty state
        const filterName = playerFilter
          .map((status) => {
            switch (status) {
              case 'PLAYING':
                return t('filter.playing');
              case 'WAITING':
                return t('filter.waiting');
              case 'READY':
                return t('filter.ready');
              case 'INACTIVE':
                return t('filter.inactive');
              default:
                return status;
            }
          })
          .join(', ');

        return (
          <PlayerList
            players={filteredPlayers}
            editingPlayers={editingPlayers}
            availableLevels={availableLevels}
            isSaving={isSaving}
            onAddNewPlayer={handleAddNewPlayer}
            onEditPlayer={openEditPlayerModal}
            onCancelEditPlayer={cancelEditingPlayer}
            onSavePlayer={saveIndividualPlayer}
            onUpdateEditingPlayer={updateEditingPlayer}
            onDeletePlayer={deletePlayer}
            onTogglePlayerStatus={togglePlayerStatus}
            onShowQR={showPlayerDetail}
            isFiltered={playerFilter.length > 0}
            filterName={filterName}
          />
        );
      })()}

      {/* Edit Player Modal */}
      <EditPlayerModal
        isOpen={showEditPlayerModal}
        onClose={closeEditPlayerModal}
        player={selectedPlayerForEdit}
        editingData={
          selectedPlayerForEdit
            ? editingPlayers[selectedPlayerForEdit.id]
            : null
        }
        availableLevels={availableLevels}
        isSaving={isSaving}
        onUpdateEditing={updateEditingPlayer}
        onSave={handleSaveEditAndClose}
      />

      {/* Warning popup for exceeding recommended player limit */}
      <CommonModal
        isOpen={showMaxPlayersWarning}
        onClose={handleCancelWarning}
        title={
          <HStack spacing={3}>
            <Box as={AlertCircle} boxSize={6} color="orange.500" />
            <Text>{t('limitWarningModal.title')}</Text>
          </HStack>
        }
        size="md"
        primaryActionText={t('limitWarningModal.addAnyway')}
        onPrimaryAction={confirmAddPlayerDespiteWarning}
        primaryColorScheme="orange"
        secondaryActionText={tCommon('cancel')}
      >
        <VStack spacing={4} align="stretch" py={2}>
          <Text color="gray.600" lineHeight="1.6">
            {t('limitWarningModal.description', {
              currentPlayerCount,
              numberOfCourts: session.numberOfCourts,
              maxPlayersPerCourt: session.maxPlayersPerCourt,
            })}
          </Text>

          <VStack
            align="start"
            spacing={2}
            pl={4}
            bg="gray.50"
            p={4}
            borderRadius="md"
          >
            <Text fontSize="sm" color="gray.600" fontWeight="medium">
              Adding more players may result in:
            </Text>
            <Text fontSize="sm" color="gray.600">
              • {t('limitWarningModal.longerWaitingTimes')}
            </Text>
            <Text fontSize="sm" color="gray.600">
              • {t('limitWarningModal.complexScheduling')}
            </Text>
            <Text fontSize="sm" color="gray.600">
              • {t('limitWarningModal.potentialDissatisfaction')}
            </Text>
          </VStack>

          <Text fontSize="sm" color="gray.600" fontStyle="italic">
            {t('limitWarningModal.confirmQuestion')}
          </Text>
        </VStack>
      </CommonModal>

      {/* Player Detail Modal */}
      {selectedPlayerForDetail && (
        <PlayerDetailModal
          isOpen={showDetailModal}
          onClose={closeDetailModal}
          player={selectedPlayerForDetail}
          sessionId={session.id}
          formatWaitTime={formatWaitTime}
          onPlayerUpdate={onDataRefresh}
        />
      )}

      {/* Delete Player Confirmation Modal */}
      <CommonModal
        isOpen={!!playerToDelete}
        onClose={() => setPlayerToDelete(null)}
        title={t('deletePlayer')}
        primaryActionText={tCommon('delete')}
        secondaryActionText={tCommon('cancel')}
        onPrimaryAction={confirmDeletePlayer}
        isPrimaryLoading={isSaving}
        primaryColorScheme="red"
      >
        <Text>
          {playerToDelete &&
            t('deleteConfirmation', {
              name:
                playerToDelete.name ||
                `Player ${playerToDelete.playerNumber || ''}`,
            })}
        </Text>
      </CommonModal>
    </VStack>
  );
};

export default PlayerManagement;
