import React from 'react';
import { VStack, Flex, Heading, HStack, Text, Box } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { PlayerGrid } from '@/components/player/PlayerGrid';
import PlayerManagement from '@/components/session/PlayerManagement';
import { LayoutGrid, List } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ISession, Player, PlayerStatus } from '@/lib/api/types';
import AddPlayerModal from '@/components/session/player-management/AddPlayerModal';
import { usePlayerManagement } from '@/components/session/player-management/usePlayerManagement';
import { CommonModal } from '@/components/ui/CommonModal';
import { AlertCircle, Plus } from 'lucide-react';
import PendingPlayersSection from './PendingPlayersSection';
import PlayerStatusFilter from './PlayerStatusFilter';
import PlayerEmptyState from './player-management/PlayerEmptyState';
import EditPlayerModal from './player-management/EditPlayerModal';
import { PlayerDetailModal } from '../player/PlayerDetailModal';

// Updated PlayerFilter type to be an array of statuses
export type PlayerFilter = PlayerStatus[];

// Sub-tab type for Grid/List views
export type PlayersSubTab = 'grid' | 'list';

interface PlayersTabProps {
  sessionPlayers: Player[];
  playerFilter: PlayerFilter;
  setPlayerFilter: (filter: PlayerFilter) => void;
  formatWaitTime: (waitTimeInMinutes: number) => string;
  mode?: 'view' | 'manage'; // Optional mode prop to control UI
  sessionId: string; // Add sessionId prop
  onPlayerUpdate?: () => void;
  session?: ISession; // Add session prop
  subTab?: PlayersSubTab; // Sub-tab state from parent
  onSubTabChange?: (subTab: PlayersSubTab) => void; // Callback to change sub-tab
}

const PlayersTab: React.FC<PlayersTabProps> = ({
  sessionPlayers,
  playerFilter,
  setPlayerFilter,
  formatWaitTime,
  mode = 'manage', // Default to manage mode
  sessionId, // Destructure sessionId from props
  onPlayerUpdate,
  session,
  subTab: externalSubTab,
  onSubTabChange,
}) => {
  const t = useTranslations('SessionDetail');
  const tPlayer = useTranslations('pages.playerManagement');
  const tCommon = useTranslations('common');
  const [showAddPlayerModal, setShowAddPlayerModal] = React.useState(false);

  // Safe session object for hook
  const safeSession = (session || {
    id: sessionId,
    players: sessionPlayers,
    numberOfCourts: 0,
    maxPlayersPerCourt: 0,
    requiredLevels: [] as number[],
  }) as ISession;

  const {
    newPlayers,
    availableUsers,
    isLoadingUsers,
    newPlayerErrors,
    availableLevels,
    isSaving,
    showMaxPlayersWarning,
    currentPlayerCount,
    maxPlayers,
    removeNewPlayerRow,
    clearAllNewPlayers,
    handleUserSelection,
    updateNewPlayer,
    savePlayerChanges,
    handleAddNewPlayer,
    confirmAddPlayerDespiteWarning,
    cancelAddPlayer,
    isUserAlreadyUsed,
    // Add missing from hook for Grid view
    startEditingPlayer,
    cancelEditingPlayer,
    updateEditingPlayer,
    saveIndividualPlayer,
    deletePlayer,
    confirmDeletePlayer,
    playerToDelete,
    setPlayerToDelete,
    togglePlayerStatus,
    editingPlayers,
    clubs: fixedMemberGroups,
  } = usePlayerManagement(safeSession, onPlayerUpdate);

  const openAddPlayerModal = () => {
    handleAddNewPlayer();
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

  const handleCancelWarning = () => {
    cancelAddPlayer();
    setShowAddPlayerModal(false);
  };

  // State for modals in Grid view
  const [showEditPlayerModal, setShowEditPlayerModal] = React.useState(false);
  const [selectedPlayerForEdit, setSelectedPlayerForEdit] =
    React.useState<Player | null>(null);
  const [showDetailModal, setShowDetailModal] = React.useState(false);
  const [selectedPlayerForDetail, setSelectedPlayerForDetail] =
    React.useState<Player | null>(null);

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

  const openDetailModal = (player: Player) => {
    setSelectedPlayerForDetail(player);
    setShowDetailModal(true);
  };

  const formatWaitTimeGrid = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return t('hoursMinutes', { hours, minutes: mins });
    }
    return t('minutesShort', { minutes: mins });
  };

  // Internal sub-tab state (used when no external control is provided)
  const [internalSubTab, setInternalSubTab] =
    React.useState<PlayersSubTab>('grid');

  // Use external sub-tab if provided, otherwise use internal state
  const subTab = externalSubTab ?? internalSubTab;
  const setSubTab = onSubTabChange ?? setInternalSubTab;

  // Separate pending players from approved players
  const pendingPlayers =
    session?.pendingPlayers ||
    sessionPlayers.filter((player) => player.registrationStatus === 'PENDING');

  // Filter only approved players for display
  const approvedPlayers = sessionPlayers.filter(
    (player) => player.registrationStatus !== 'PENDING'
  );

  const counts = {
    PLAYING: approvedPlayers.filter((p) => p.status === 'PLAYING').length,
    WAITING: approvedPlayers.filter((p) => p.status === 'WAITING').length,
    READY: approvedPlayers.filter((p) => p.status === 'READY').length,
    INACTIVE: approvedPlayers.filter((p) => p.status === 'INACTIVE').length,
  };

  return (
    <VStack gap={6} align="stretch">
      {/* Players Section Header with Sub-tabs */}
      <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
        <HStack gap={4}>
          <Heading size="md">
            {t('playersTab.players')}
            {session && ` (${approvedPlayers.length}/${maxPlayers})`}
          </Heading>
        </HStack>

        {/* Sub-tabs: Grid / List */}
        <HStack
          bg="gray.100"
          _dark={{ bg: 'gray.700' }}
          borderRadius="lg"
          p={1}
          gap={0}
        >
          <Button
            size="sm"
            onClick={() => setSubTab('grid')}
            leftIcon={<LayoutGrid size={14} />}
            variant={subTab === 'grid' ? 'solid' : 'ghost'}
            colorPalette={subTab === 'grid' ? 'blue' : 'gray'}
            borderRadius="md"
          >
            {t('playersTab.grid')}
          </Button>
          <Button
            size="sm"
            onClick={() => setSubTab('list')}
            leftIcon={<List size={14} />}
            variant={subTab === 'list' ? 'solid' : 'ghost'}
            colorPalette={subTab === 'list' ? 'blue' : 'gray'}
            borderRadius="md"
          >
            {t('playersTab.list')}
          </Button>
        </HStack>
      </Flex>

      {/* Pending Players Section */}
      {pendingPlayers.length > 0 && (
        <PendingPlayersSection
          sessionId={sessionId}
          pendingPlayers={pendingPlayers}
          onPlayerUpdate={onPlayerUpdate || (() => {})}
        />
      )}

      {/* Filter and Add Player row */}
      <Flex justify="space-between" align="center" mb={2}>
        <PlayerStatusFilter
          selected={playerFilter}
          onChange={setPlayerFilter}
          counts={counts}
          totalCount={approvedPlayers.length}
        />
        <Button
          size="sm"
          colorPalette="green"
          onClick={openAddPlayerModal}
          leftIcon={<Box as={Plus} boxSize={4} />}
        >
          {tPlayer('addPlayer')}
        </Button>
      </Flex>

      {/* Grid View Content */}
      {subTab === 'grid' && (
        <>
          {/* Filtered Players Grid */}
          {(() => {
            const filteredPlayers = approvedPlayers.filter((player) => {
              if (playerFilter.length === 0) return true;
              return playerFilter.includes(player.status as PlayerStatus);
            });
            if (filteredPlayers.length === 0) {
              const filterName = playerFilter
                .map((s) => t(`playersTab.${s.toLowerCase()}`))
                .join(', ');

              return (
                <PlayerEmptyState
                  isFiltered={playerFilter.length > 0}
                  filterName={filterName}
                />
              );
            }
            return (
              <PlayerGrid
                players={filteredPlayers}
                playerFilter={playerFilter}
                formatWaitTime={formatWaitTime}
                mode={mode}
                sessionId={sessionId}
                onPlayerUpdate={onPlayerUpdate}
                isShowWaitTime={false}
                onEdit={openEditPlayerModal}
                onDelete={deletePlayer}
                onToggleStatus={togglePlayerStatus}
                onShowQR={openDetailModal}
              />
            );
          })()}
        </>
      )}

      {/* List View Content - Player Management with shared filter */}
      {subTab === 'list' && session && (
        <PlayerManagement
          session={session}
          onDataRefresh={onPlayerUpdate}
          playerFilter={playerFilter}
        />
      )}

      {/* Add Player Modal */}
      <AddPlayerModal
        isOpen={showAddPlayerModal && !showMaxPlayersWarning}
        onClose={closeAddPlayerModal}
        newPlayers={newPlayers}
        availableUsers={availableUsers}
        clubs={fixedMemberGroups}
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

      {/* Warning popup for exceeding recommended player limit */}
      <CommonModal
        isOpen={showMaxPlayersWarning}
        onClose={handleCancelWarning}
        title={
          <HStack gap={3}>
            <Box as={AlertCircle} boxSize={6} color="orange.500" />
            <Text>{tPlayer('limitWarningModal.title')}</Text>
          </HStack>
        }
        size="md"
        primaryActionText={tPlayer('limitWarningModal.addAnyway')}
        onPrimaryAction={confirmAddPlayerDespiteWarning}
        primaryColorScheme="orange"
        secondaryActionText={tCommon('cancel')}
      >
        <VStack gap={4} align="stretch" py={2}>
          <Text color="gray.600" lineHeight="1.6">
            {tPlayer('limitWarningModal.description', {
              currentPlayerCount,
              numberOfCourts: session?.numberOfCourts || 0,
              maxPlayersPerCourt: session?.maxPlayersPerCourt || 0,
            })}
          </Text>

          <VStack
            align="start"
            gap={2}
            pl={4}
            bg="gray.50"
            p={4}
            borderRadius="md"
          >
            <Text fontSize="sm" color="gray.600" fontWeight="medium">
              {tPlayer('limitWarningModal.addingMoreMayResultIn')}
            </Text>
            <Text fontSize="sm" color="gray.600">
              • {tPlayer('limitWarningModal.longerWaitingTimes')}
            </Text>
            <Text fontSize="sm" color="gray.600">
              • {tPlayer('limitWarningModal.complexScheduling')}
            </Text>
            <Text fontSize="sm" color="gray.600">
              • {tPlayer('limitWarningModal.potentialDissatisfaction')}
            </Text>
          </VStack>

          <Text fontSize="sm" color="gray.600" fontStyle="italic">
            {tPlayer('limitWarningModal.confirmQuestion')}
          </Text>
        </VStack>
      </CommonModal>

      {/* Edit Player Modal (Grid View) */}
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
        clubs={fixedMemberGroups}
      />

      {/* Player Detail Modal (Grid View) */}
      {selectedPlayerForDetail && (
        <PlayerDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedPlayerForDetail(null);
          }}
          player={selectedPlayerForDetail}
          sessionId={sessionId}
          formatWaitTime={formatWaitTimeGrid}
          onPlayerUpdate={onPlayerUpdate}
        />
      )}

      {/* Delete Player Confirmation Modal (Grid View) */}
      <CommonModal
        isOpen={!!playerToDelete}
        onClose={() => setPlayerToDelete(null)}
        title={tCommon('delete')}
        primaryActionText={tCommon('delete')}
        secondaryActionText={tCommon('cancel')}
        onPrimaryAction={confirmDeletePlayer}
        isPrimaryLoading={isSaving}
        primaryColorScheme="red"
      >
        <Text>
          {playerToDelete &&
            tPlayer('deleteConfirmation', {
              name:
                playerToDelete.name ||
                tPlayer('playerWithNumber', {
                  number: playerToDelete.playerNumber || '',
                }),
            })}
        </Text>
      </CommonModal>
    </VStack>
  );
};

export default PlayersTab;
