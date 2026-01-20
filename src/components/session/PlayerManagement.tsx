'use client';

import QRCodeGenerator from '@/components/QRCodeGenerator';
import NewPlayerList from '@/components/session/player-management/NewPlayerList';
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

interface PlayerManagementProps {
  session: ISession;
  onDataRefresh?: () => void;
}

const PlayerManagement: React.FC<PlayerManagementProps> = ({
  session,
  onDataRefresh,
}) => {
  const t = useTranslations('pages.playerManagement');
  const tCommon = useTranslations('common');

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
  } = usePlayerManagement(session, onDataRefresh);

  // QR Modal State (UI specific)
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const [selectedPlayerForQR, setSelectedPlayerForQR] = useState<Player | null>(
    null
  );

  const showPlayerQR = (player: Player) => {
    setSelectedPlayerForQR(player);
    setShowQRModal(true);
  };

  const closeQRModal = () => {
    setShowQRModal(false);
    setSelectedPlayerForQR(null);
  };

  return (
    <VStack spacing={8} align="stretch" p={{ base: 2, md: 4 }}>
      {/* Header section with stats */}
      <PlayerStatsHeader
        session={session}
        newPlayersCount={newPlayers.length}
        maxPlayers={maxPlayers}
      />

      {/* Add Player button when no new players (handled inside NewPlayerList but needed here if list empty) */}
      {/* Actually, PlayerStatsHeader doesn't have the button. The original code had it below header. */}
      {newPlayers.length === 0 && (
        <NewPlayerList
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
          onSaveAll={savePlayerChanges}
          onCancelAll={clearAllNewPlayers}
          isUserAlreadyUsed={isUserAlreadyUsed}
        />
      )}

      {newPlayers.length > 0 && (
        <NewPlayerList
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
          onSaveAll={savePlayerChanges}
          onCancelAll={clearAllNewPlayers}
          isUserAlreadyUsed={isUserAlreadyUsed}
        />
      )}

      {/* Logic correction: NewPlayerList renders nothing if newPlayers.length === 0.
          But we need the "Add Player" button initially.
          The original code had:
          {newPlayers.length === 0 && ( <Button ... onClick={handleAddNewPlayer} ... /> )}
          NewPlayerList only renders if items exist.
          I should expose the "Empty State Add Button" or add it here.
      */}

      {newPlayers.length === 0 && (
        <HStack justify="flex-end" w="100%">
          <Button
            leftIcon={<Box as={Plus} boxSize={4} />}
            colorScheme="green"
            onClick={handleAddNewPlayer}
          >
            {t('addPlayer')}
          </Button>
        </HStack>
      )}

      {/* Re-evaluating NewPlayerList. 
          NewPlayerList returns null if length is 0.
          So we need to render the "Add Player" button explicitly when length is 0.
      */}

      {/* Player List */}
      <PlayerList
        players={session.players || []}
        editingPlayers={editingPlayers}
        availableLevels={availableLevels}
        isSaving={isSaving}
        onAddNewPlayer={handleAddNewPlayer}
        onEditPlayer={startEditingPlayer}
        onCancelEditPlayer={cancelEditingPlayer}
        onSavePlayer={saveIndividualPlayer}
        onUpdateEditingPlayer={updateEditingPlayer}
        onDeletePlayer={deletePlayer}
        onShowQR={showPlayerQR}
      />

      {/* Warning popup for exceeding recommended player limit */}
      <CommonModal
        isOpen={showMaxPlayersWarning}
        onClose={cancelAddPlayer}
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

      {/* QR Code Modal */}
      <CommonModal
        isOpen={showQRModal && !!selectedPlayerForQR}
        onClose={closeQRModal}
        title={
          selectedPlayerForQR &&
          t('qrCodeModal.title', {
            number: selectedPlayerForQR.playerNumber,
          })
        }
        size="sm"
        showCloseButton={true}
        primaryActionText={tCommon('close')}
        onPrimaryAction={closeQRModal}
      >
        {selectedPlayerForQR && (
          <VStack gap={6} py={4}>
            <Text
              textAlign="center"
              color="gray.800"
              fontWeight="semibold"
              fontSize="lg"
            >
              {selectedPlayerForQR.name ||
                `Player ${selectedPlayerForQR.playerNumber}`}
            </Text>

            <Box
              p={4}
              bg="gray.50"
              borderRadius="xl"
              border="1px solid"
              borderColor="gray.100"
            >
              {selectedPlayerForQR.joinCode ? (
                <QRCodeGenerator
                  joinCode={selectedPlayerForQR.joinCode}
                  size={200}
                />
              ) : (
                <VStack p={10} justify="center" align="center">
                  <Box as={AlertCircle} boxSize={10} color="red.400" mb={2} />
                  <Text color="red.500" textAlign="center" fontWeight="medium">
                    {t('qrCodeModal.joinCodeNotAvailable')}
                  </Text>
                </VStack>
              )}
            </Box>

            <Text fontSize="sm" color="gray.500" textAlign="center" px={4}>
              {t('qrCodeModal.shareInstructions')}
            </Text>
          </VStack>
        )}
      </CommonModal>

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
