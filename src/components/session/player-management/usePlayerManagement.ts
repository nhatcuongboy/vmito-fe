import { toaster } from '@/components/ui/toaster';
import { PlayerService } from '@/lib/api/player.service';
import { FeeService } from '@/lib/api/fee.service';
import { LEVELS } from '@/constants/levels';
import { UserOption, UserService } from '@/lib/api/user.service';
import { useTranslations } from 'next-intl';
import { useState, useEffect, useCallback } from 'react';
import { NewPlayer, Player } from './types';
import { ISession, Gender, PlayerStatus } from '@/lib/api/types';
import { ClubsService } from '@/lib/api/clubs.service';
import { IClub } from '@/types/club';
import { useCanAccessHostFeatures } from '@/hooks/useCanAccessHostFeatures';

export const usePlayerManagement = (
  session: ISession,
  onDataRefresh?: () => void,
  mode: 'view' | 'manage' = 'manage'
) => {
  const t = useTranslations('pages.playerManagement');
  const { canAccessHostFeatures } = useCanAccessHostFeatures();
  const isHostOrAdmin = canAccessHostFeatures;

  // Internal state management
  const [newPlayers, setNewPlayers] = useState<NewPlayer[]>([]);
  const [editingPlayers, setEditingPlayers] = useState<{
    [key: string]: Player;
  }>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showMaxPlayersWarning, setShowMaxPlayersWarning] =
    useState<boolean>(false);
  const [availableUsers, setAvailableUsers] = useState<UserOption[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const [newPlayerErrors, setNewPlayerErrors] = useState<{
    [key: string]: string;
  }>({});
  const [clubs, setClubs] = useState<IClub[]>([]);

  useEffect(() => {
    if (mode === 'manage' && isHostOrAdmin) {
      const loadClubs = async () => {
        try {
          const clubsData = await ClubsService.getClubsToManage();
          setClubs(clubsData);
        } catch (error) {
          console.error('Error loading clubs:', error);
        }
      };
      loadClubs();
    }
  }, [mode, isHostOrAdmin]);

  const searchUsers = useCallback(async (query: string) => {
    try {
      setIsLoadingUsers(true);
      const users = await UserService.getAllUsers(query);
      setAvailableUsers(users);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  /**
   * Get default level for new players based on session requiredLevels
   */
  const getDefaultLevel = (): number => {
    if (session.requiredLevels && session.requiredLevels.length > 0) {
      return Math.min(...session.requiredLevels) as number;
    }
    return LEVELS.BEGINNER;
  };

  /**
   * Get available levels for player selection based on session requiredLevels
   */
  const getAvailableLevels = (): number[] => {
    if (session.requiredLevels && session.requiredLevels.length > 0) {
      return session.requiredLevels as number[];
    }
    return Object.values(LEVELS).filter(
      (val) => typeof val === 'number'
    ) as number[];
  };

  // Player management functions
  const addNewPlayerRow = () => {
    const existingMaxPlayerNumber = Math.max(
      0,
      ...(session.players?.map((p: Player) => p.playerNumber || 0) || [])
    );

    const newPlayerMaxNumber =
      newPlayers.length > 0
        ? Math.max(...newPlayers.map((p) => p.playerNumber || 0))
        : 0;

    const nextPlayerNumber =
      Math.max(existingMaxPlayerNumber, newPlayerMaxNumber) + 1;

    setNewPlayers([
      ...newPlayers,
      {
        playerNumber: nextPlayerNumber,
        name: '',
        gender: Gender.MALE,
        level: getDefaultLevel(),
        levelDescription: '',
        requireConfirmInfo: false,
        isClubMember: undefined,
        clubId: undefined,
      },
    ]);
  };

  const removeNewPlayerRow = (index: number) => {
    setNewPlayers(newPlayers.filter((_, i) => i !== index));
    setNewPlayerErrors({});
  };

  const clearAllNewPlayers = () => {
    setNewPlayers([]);
    setNewPlayerErrors({});
  };

  const updateNewPlayer = (
    index: number,
    field: string,
    value: string | boolean | number | null | undefined
  ) => {
    setNewPlayers((prev) =>
      prev.map((player, i) =>
        i === index ? { ...player, [field]: value } : player
      )
    );
    const errorKey = `${index}.${field}`;
    if (newPlayerErrors[errorKey]) {
      setNewPlayerErrors((prev) => {
        const newState = { ...prev };
        delete newState[errorKey];
        return newState;
      });
    }
  };

  // Handle user selection from dropdown
  const handleUserSelection = (index: number, userId: string) => {
    if (!userId) {
      // Clear selection
      updateNewPlayer(index, 'userId', '');
      updateNewPlayer(index, 'name', '');
      updateNewPlayer(index, 'gender', Gender.MALE);
      updateNewPlayer(index, 'level', getDefaultLevel());
      updateNewPlayer(index, 'levelDescription', '');
      return;
    }

    const isUserAlreadySelected = newPlayers.some(
      (p, idx) => idx !== index && p.userId === userId
    );

    if (isUserAlreadySelected) {
      toaster.create({
        title: t('userAlreadySelected'),
        description: t('userAlreadySelectedDescription'),
        type: 'error',
        duration: 3000,
      });
      return;
    }

    const isUserInExistingPlayers =
      session.players?.some((p: Player) => p.userId === userId) || false;

    if (isUserInExistingPlayers) {
      toaster.create({
        title: t('userAlreadyExists'),
        description: t('userAlreadyExistsDescription'),
        type: 'error',
        duration: 3000,
      });
      return;
    }

    const selectedUser = availableUsers.find((u) => u.id === userId);
    if (selectedUser) {
      updateNewPlayer(index, 'userId', selectedUser.id);
      updateNewPlayer(index, 'name', selectedUser.name);
      if (
        selectedUser.gender === Gender.MALE ||
        selectedUser.gender === Gender.FEMALE
      ) {
        updateNewPlayer(index, 'gender', selectedUser.gender);
      } else {
        updateNewPlayer(index, 'gender', Gender.MALE);
      }
      if (selectedUser.level) {
        updateNewPlayer(index, 'level', selectedUser.level);
      }
      if (selectedUser.levelDescription) {
        updateNewPlayer(
          index,
          'levelDescription',
          selectedUser.levelDescription
        );
      }
    }
  };

  const startEditingPlayer = (player: Player) => {
    setEditingPlayers((prev) => ({
      ...prev,
      [player.id]: {
        ...player,
        levelDescription: player.levelDescription || '',
        requireConfirmInfo: !!player.requireConfirmInfo,
        isClubMember: !!player.isClubMember,
        clubId: player.clubId || undefined,
      },
    }));
  };

  const cancelEditingPlayer = (playerId: string) => {
    setEditingPlayers((prev) => {
      const newState = { ...prev };
      delete newState[playerId];
      return newState;
    });
  };

  const updateEditingPlayer = (
    playerId: string,
    field: string,
    value: string | boolean | number | null | undefined
  ) => {
    setEditingPlayers((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [field]: value,
      },
    }));
  };

  const validateNewPlayers = () => {
    const errors: { [key: string]: string } = {};
    newPlayers.forEach((player: NewPlayer, idx: number) => {
      if (!player.name || player.name.trim() === '') {
        errors[`${idx}.name`] = t('playerNameRequired');
      }
      if (player.level === null || player.level === undefined) {
        errors[`${idx}.level`] = t('levelRequired');
      }
      if (player.isClubMember && !player.clubId) {
        errors[`${idx}.clubId`] = t('clubRequired');
      }
    });
    setNewPlayerErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const savePlayerChanges = async () => {
    if (!validateNewPlayers()) {
      return false;
    }

    try {
      setIsSaving(true);
      const playersToUpdate = Object.values(editingPlayers);
      const playersToCreate = newPlayers.filter((p) => p.name.trim() !== '');

      if (playersToUpdate.length > 0) {
        await PlayerService.bulkUpdatePlayers(
          session.id,
          playersToUpdate as Player[]
        );
      }

      if (playersToCreate.length > 0) {
        const playersToCreateSubmitted = playersToCreate.map(
          ({
            playerNumber: _playerNumber,
            level,
            isClubMember,
            clubId,
            ...rest
          }: NewPlayer) => {
            const playerData = {
              ...rest,
              level: level === null ? undefined : level,
            };

            if (isClubMember) {
              return { ...playerData, isClubMember, clubId };
            }

            return playerData;
          }
        );
        await PlayerService.createBulkPlayers(
          session.id,
          playersToCreateSubmitted
        );
      }

      setEditingPlayers({});
      setNewPlayers([]);
      if (onDataRefresh) {
        onDataRefresh();
      }
      toaster.create({
        title: t('playerChangesSavedSuccess'),
        type: 'success',
        duration: 3000,
      });
      return true;
    } catch (error) {
      console.error('Error saving player changes:', error);
      toaster.create({
        title: t('failedToSavePlayerChanges'),
        type: 'error',
        duration: 3000,
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const saveIndividualPlayer = async (playerId: string) => {
    try {
      setIsSaving(true);
      const playerToUpdate = editingPlayers[playerId];
      if (!playerToUpdate) {
        throw new Error('No player data to update');
      }

      const originalPlayer = session.players?.find(
        (player: Player) => player.id === playerId
      );
      const shouldRecalculatePayments = originalPlayer
        ? originalPlayer.clubId !== playerToUpdate.clubId ||
          Boolean(originalPlayer.isClubMember) !==
            Boolean(playerToUpdate.isClubMember) ||
          originalPlayer.gender !== playerToUpdate.gender
        : Boolean(playerToUpdate.clubId || playerToUpdate.isClubMember);

      const { customFee, ...playerUpdatePayload } = playerToUpdate;

      await PlayerService.updatePlayerBySession(session.id, playerId, {
        ...playerUpdatePayload,
        customFee: customFee ?? null,
      });

      if (shouldRecalculatePayments) {
        try {
          await FeeService.recalculateAllPayments(session.id);
        } catch (recalculateError) {
          console.error('Failed to recalculate payments:', recalculateError);
        }
      }

      setEditingPlayers((prev) => {
        const newState = { ...prev };
        delete newState[playerId];
        return newState;
      });

      if (onDataRefresh) {
        onDataRefresh();
      }

      toaster.create({
        title: t('playerUpdatedSuccess'),
        type: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error updating player:', error);
      toaster.create({
        title: t('failedToUpdatePlayer'),
        description: error instanceof Error ? error.message : 'Unknown error',
        type: 'error',
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const deletePlayer = (playerId: string) => {
    const player = session.players?.find((p: Player) => p.id === playerId);
    if (player) {
      setPlayerToDelete(player);
    }
  };

  const confirmDeletePlayer = async () => {
    if (!playerToDelete) return;

    const playerName =
      playerToDelete.name ||
      t('playerWithNumber', { number: playerToDelete.playerNumber || '' });
    console.debug('Deleting player:', playerName);

    try {
      setIsSaving(true);
      await PlayerService.deletePlayerBySession(session.id, playerToDelete.id);
      if (onDataRefresh) {
        onDataRefresh();
      }
      toaster.create({
        title: t('playerDeletedSuccess', { name: playerName }),
        type: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error deleting player:', error);
      toaster.create({
        title: t('failedToDeletePlayer'),
        type: 'error',
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
      setPlayerToDelete(null);
    }
  };

  // Max players logic
  const maxPlayers =
    (session.numberOfCourts || 0) * (session.maxPlayersPerCourt || 0);
  const currentPlayerCount = (session.players?.length || 0) + newPlayers.length;
  const isMaxPlayersReached = currentPlayerCount >= maxPlayers;

  const handleAddNewPlayer = () => {
    if (isMaxPlayersReached && !showMaxPlayersWarning) {
      setShowMaxPlayersWarning(true);
      return false;
    } else {
      setShowMaxPlayersWarning(false);
      addNewPlayerRow();
      return true;
    }
  };

  const confirmAddPlayerDespiteWarning = () => {
    setShowMaxPlayersWarning(false);
    addNewPlayerRow();
    return true;
  };

  const cancelAddPlayer = () => {
    setShowMaxPlayersWarning(false);
  };

  const isUserAlreadyUsed = (
    userId: string,
    currentIndex?: number
  ): boolean => {
    const inNewPlayers = newPlayers.some(
      (p, idx) =>
        p.userId === userId &&
        (currentIndex === undefined || idx !== currentIndex)
    );
    const inExistingPlayers =
      session.players?.some((p: Player) => p.userId === userId) || false;
    return inNewPlayers || inExistingPlayers;
  };

  return {
    // State
    newPlayers,
    editingPlayers,
    isSaving,
    showMaxPlayersWarning,
    availableUsers,
    isLoadingUsers,
    newPlayerErrors,
    availableLevels: getAvailableLevels(),
    maxPlayers,
    currentPlayerCount,
    isMaxPlayersReached,
    clubs,
    searchUsers,

    // Actions
    addNewPlayerRow,
    removeNewPlayerRow,
    clearAllNewPlayers,
    handleUserSelection,
    updateNewPlayer,
    startEditingPlayer,
    cancelEditingPlayer,
    updateEditingPlayer,
    savePlayerChanges,
    saveIndividualPlayer,
    deletePlayer, // Starts the delete process (sets item to delete)
    confirmDeletePlayer, // ACTUALLY deletes
    playerToDelete,
    handleAddNewPlayer,
    confirmAddPlayerDespiteWarning,
    cancelAddPlayer,
    isUserAlreadyUsed,
    setPlayerToDelete, // Needed to clear modal

    /**
     * Toggles player status between INACTIVE and WAITING
     */
    togglePlayerStatus: async (playerId: string) => {
      const player = session.players?.find((p: Player) => p.id === playerId);
      if (!player) return;

      const newStatus =
        player.status === PlayerStatus.INACTIVE
          ? PlayerStatus.WAITING
          : PlayerStatus.INACTIVE;

      try {
        setIsSaving(true);
        await PlayerService.updatePlayerBySession(session.id, playerId, {
          status: newStatus,
        });
        if (onDataRefresh) {
          onDataRefresh();
        }
      } catch (error) {
        console.error('Error toggling player status:', error);
        toaster.create({
          title: t('failedToUpdatePlayer'),
          type: 'error',
          duration: 3000,
        });
      } finally {
        setIsSaving(false);
      }
    },
  };
};
