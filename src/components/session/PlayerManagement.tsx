'use client';

import QRCodeGenerator from '@/components/QRCodeGenerator';
import {
  Button,
  Card,
  CardBody,
  HStack,
  IconButton,
  VStack,
  useToast,
} from '@/components/ui/chakra-compat';
import { PlayerService } from '@/lib/api/player.service';
import { UserService, UserOption } from '@/lib/api/user.service';
import { Level } from '@/lib/api/types';
import { getLevelLabel } from '@/utils/level-mapping';
import {
  Badge,
  Box,
  Flex,
  Grid,
  Heading,
  Input,
  Text,
  Textarea,
} from '@chakra-ui/react';
import {
  AlertCircle,
  Edit,
  HelpCircle,
  Mars,
  Plus,
  QrCode,
  Save,
  Trash2,
  User,
  UserCheck,
  Users,
  Venus,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

interface Player {
  id: string;
  playerNumber: number;
  name: string;
  gender?: string;
  level?: Level;
  status: string;
  currentWaitTime: number;
  totalWaitTime: number;
  matchesPlayed: number;
  currentCourtId?: string;
  preFilledByHost: boolean;
  confirmedByPlayer: boolean;
  levelDescription?: string; // New field
  requireConfirmInfo?: boolean; // New field
}

// Helper functions for gender display
function getGenderIcon(gender?: string) {
  if (gender === 'MALE') return Mars;
  if (gender === 'FEMALE') return Venus;
  if (gender === 'OTHER') return User;
  if (gender === 'PREFER_NOT_TO_SAY') return HelpCircle;
  return User;
}

function getGenderColor(gender?: string): string {
  if (gender === 'MALE') return 'blue';
  if (gender === 'FEMALE') return 'pink';
  if (gender === 'OTHER') return 'purple';
  if (gender === 'PREFER_NOT_TO_SAY') return 'gray';
  return 'gray';
}

function getGenderSymbol(gender?: string): string {
  if (gender === 'MALE') return '♂';
  if (gender === 'FEMALE') return '♀';
  if (gender === 'OTHER') return '◈';
  if (gender === 'PREFER_NOT_TO_SAY') return '?';
  return '?';
}

function getGenderLabel(gender?: string): string {
  if (gender === 'MALE') return 'M';
  if (gender === 'FEMALE') return 'F';
  if (gender === 'OTHER') return 'O';
  if (gender === 'PREFER_NOT_TO_SAY') return 'P';
  return '?';
}

interface PlayerManagementProps {
  session: any;
  onDataRefresh?: () => void; // Callback to refresh parent data
}

const PlayerManagement: React.FC<PlayerManagementProps> = ({
  session,
  onDataRefresh,
}) => {
  const t = useTranslations('pages.playerManagement');
  const tCommon = useTranslations('common');
  
  // Internal state management
  const [newPlayers, setNewPlayers] = useState<
    Array<{
      playerNumber: number;
      name: string;
      gender: string;
      level: Level;
      levelDescription?: string;
      requireConfirmInfo?: boolean;
      userId?: string; // Added to track selected user
    }>
  >([]);
  const [editingPlayers, setEditingPlayers] = useState<{
    [key: string]: Player;
  }>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showMaxPlayersWarning, setShowMaxPlayersWarning] =
    useState<boolean>(false);
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const [selectedPlayerForQR, setSelectedPlayerForQR] = useState<any>(null);
  const [availableUsers, setAvailableUsers] = useState<UserOption[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);

  const toast = useToast();

  // Load available users on mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoadingUsers(true);
        const users = await UserService.getAllUsers();
        setAvailableUsers(users);
      } catch (error) {
        console.error('Error loading users:', error);
        toast.toast({
          title: t('failedToLoadUsers'),
          status: 'error',
          duration: 3000,
        });
      } finally {
        setIsLoadingUsers(false);
      }
    };
    loadUsers();
  }, []);

  // Player management functions
  const addNewPlayerRow = () => {
    // Find the highest player number from both existing players and new players being added
    const existingMaxPlayerNumber = Math.max(
      0,
      ...session.players.map((p: any) => p.playerNumber || 0)
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
        gender: 'MALE',
        level: Level.TB_MINUS,
        levelDescription: '',
        requireConfirmInfo: true,
      },
    ]);
  };

  const removeNewPlayerRow = (index: number) => {
    setNewPlayers(newPlayers.filter((_, i) => i !== index));
  };

  const clearAllNewPlayers = () => {
    setNewPlayers([]);
  };

  // Handle user selection from dropdown
  const handleUserSelection = (index: number, userId: string) => {
    if (!userId) {
      // Clear selection
      updateNewPlayer(index, 'userId', '');
      updateNewPlayer(index, 'name', `Player ${newPlayers[index].playerNumber}`);
      updateNewPlayer(index, 'gender', 'MALE');
      updateNewPlayer(index, 'level', Level.TB_MINUS);
      updateNewPlayer(index, 'levelDescription', '');
      return;
    }

    // Check if user is already selected in other new players
    const isUserAlreadySelected = newPlayers.some(
      (p, idx) => idx !== index && p.userId === userId
    );

    if (isUserAlreadySelected) {
      toast.toast({
        title: t('userAlreadySelected'),
        description: t('userAlreadySelectedDescription'),
        status: 'error',
        duration: 3000,
      });
      return;
    }

    // Check if user is already in existing players
    const isUserInExistingPlayers = session.players.some(
      (p: any) => p.userId === userId
    );

    if (isUserInExistingPlayers) {
      toast.toast({
        title: t('userAlreadyExists'),
        description: t('userAlreadyExistsDescription'),
        status: 'error',
        duration: 3000,
      });
      return;
    }

    // Find the selected user
    const selectedUser = availableUsers.find((u) => u.id === userId);
    if (selectedUser) {
      // Auto-fill player information from user data
      updateNewPlayer(index, 'userId', selectedUser.id);
      updateNewPlayer(index, 'name', selectedUser.name);
      if (selectedUser.gender) {
        updateNewPlayer(index, 'gender', selectedUser.gender);
      }
      if (selectedUser.level) {
        updateNewPlayer(index, 'level', selectedUser.level as Level);
      }
      if (selectedUser.levelDescription) {
        updateNewPlayer(index, 'levelDescription', selectedUser.levelDescription);
      }
    }
  };

  const updateNewPlayer = (
    index: number,
    field: string,
    value: string | boolean
  ) => {
    setNewPlayers((prev) =>
      prev.map((player, i) =>
        i === index ? { ...player, [field]: value } : player
      )
    );
  };

  const startEditingPlayer = (player: Player) => {
    setEditingPlayers((prev) => ({
      ...prev,
      [player.id]: { ...player },
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
    value: string | boolean
  ) => {
    setEditingPlayers((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [field]: value,
      },
    }));
  };

  const savePlayerChanges = async () => {
    try {
      setIsSaving(true);

      // Prepare data for API
      const playersToUpdate = Object.values(editingPlayers);
      const playersToCreate = newPlayers.filter((p) => p.name.trim() !== '');

      // Update existing players
      if (playersToUpdate.length > 0) {
        await PlayerService.bulkUpdatePlayers(
          session.id,
          playersToUpdate as any
        );
      }

      // Create new players
      if (playersToCreate.length > 0) {
        // Include levelDescription and requireConfirmInfo fields when sending to API
        await PlayerService.createBulkPlayers(
          session.id,
          playersToCreate as any
        );
      }

      // Clear editing states
      setEditingPlayers({});
      setNewPlayers([]);

      // Refresh session data
      if (onDataRefresh) {
        onDataRefresh();
      }

      toast.toast({
        title: t('playerChangesSavedSuccess'),
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error saving player changes:', error);
      toast.toast({
        title: t('failedToSavePlayerChanges'),
        status: 'error',
        duration: 3000,
      });
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

      await PlayerService.updatePlayerBySession(
        session.id,
        playerId,
        playerToUpdate as any
      );

      // Remove from editing state
      setEditingPlayers((prev) => {
        const newState = { ...prev };
        delete newState[playerId];
        return newState;
      });

      // Refresh session data
      if (onDataRefresh) {
        onDataRefresh();
      }

      toast.toast({
        title: t('playerUpdatedSuccess'),
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error updating player:', error);
      toast.toast({
        title: t('failedToUpdatePlayer'),
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const deletePlayer = async (playerId: string) => {
    // Find player name for confirmation
    const player = session.players.find((p: any) => p.id === playerId);
    const playerName = player?.name || `Player ${player?.playerNumber || ''}`;

    // Show confirmation dialog
    const confirmed = window.confirm(
      t('deleteConfirmation', { name: playerName })
    );

    if (!confirmed) {
      return; // User cancelled
    }

    try {
      await PlayerService.deletePlayerBySession(session.id, playerId);
      if (onDataRefresh) {
        onDataRefresh();
      }
      toast.toast({
        title: t('playerDeletedSuccess', { name: playerName }),
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error deleting player:', error);
      toast.toast({
        title: t('failedToDeletePlayer'),
        status: 'error',
        duration: 3000,
      });
    }
  };
  // Calculate maximum players based on courts and players per court
  const maxPlayers = session.numberOfCourts * session.maxPlayersPerCourt;
  const currentPlayerCount = session.players.length + newPlayers.length;
  const isMaxPlayersReached = currentPlayerCount >= maxPlayers;

  // Function to get next available player number
  const getNextPlayerNumber = () => {
    const existingNumbers = [
      ...session.players.map((p: any) => p.playerNumber),
      ...newPlayers.map((p: any) => p.playerNumber),
    ];

    // Find the smallest number that isn't used yet
    let nextNumber = 1;
    while (existingNumbers.includes(nextNumber)) {
      nextNumber++;
    }

    return nextNumber;
  };

  // Override addNewPlayerRow to use the next available player number
  const handleAddNewPlayer = () => {
    // Check if we're at or exceeding the recommended limit
    if (isMaxPlayersReached) {
      setShowMaxPlayersWarning(true);
    } else {
      addNewPlayerRow();
    }
  };

  // Function to confirm adding player despite warning
  const confirmAddPlayerDespiteWarning = () => {
    setShowMaxPlayersWarning(false);
    addNewPlayerRow();
  };

  // Function to cancel adding player
  const cancelAddPlayer = () => {
    setShowMaxPlayersWarning(false);
  };

  const showPlayerQR = (player: any) => {
    console.log(player);
    setSelectedPlayerForQR(player);
    setShowQRModal(true);
  };

  const closeQRModal = () => {
    setShowQRModal(false);
    setSelectedPlayerForQR(null);
  };

  // Track the last player count to know when a new player is added
  const lastPlayerCount = useRef(newPlayers.length);

  // Set default value for newly added players
  useEffect(() => {
    if (newPlayers.length > lastPlayerCount.current) {
      // A new player was added
      const newPlayerIndex = newPlayers.length - 1;
      const newPlayer = newPlayers[newPlayerIndex];
      if (newPlayer && (!newPlayer.name || newPlayer.name.trim() === '')) {
        // Use setTimeout to avoid state update conflicts
        setTimeout(() => {
          updateNewPlayer(
            newPlayerIndex,
            'name',
            `Player ${newPlayer.playerNumber}`
          );
        }, 10);
      }
    }
    lastPlayerCount.current = newPlayers.length;
  }, [newPlayers.length, newPlayers, updateNewPlayer]);

  // State for validation errors for new players
  const [newPlayerErrors, setNewPlayerErrors] = useState<{
    [index: number]: string;
  }>({});

  // Validate all new players before saving
  const validateNewPlayers = () => {
    const errors: { [index: number]: string } = {};
    newPlayers.forEach((player: any, idx: any) => {
      if (!player.name || player.name.trim() === '') {
        errors[idx] = t('playerNameRequired');
      }
    });
    setNewPlayerErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Wrap savePlayerChanges to validate before saving
  const handleSavePlayerChanges = () => {
    if (validateNewPlayers()) {
      savePlayerChanges();
    }
  };

  // Function to cancel adding players (clear all newPlayers)
  const cancelAddPlayers = () => {
    console.log(
      'cancelAddPlayers called, newPlayers.length:',
      newPlayers.length
    );
    console.log('clearAllNewPlayers prop:', clearAllNewPlayers);

    if (newPlayers.length > 0) {
      // If clearAllNewPlayers prop exists, use it (clear all at once)
      if (clearAllNewPlayers) {
        console.log('Using clearAllNewPlayers prop');
        clearAllNewPlayers();
        // Clear validation errors
        setNewPlayerErrors({});
      } else {
        console.log('Using fallback removeNewPlayerRow loop');
        // Fallback: remove all by calling removeNewPlayerRow multiple times
        // Create copy of array to avoid issues with changing indices
        const playerCount = newPlayers.length;

        // Remove from end to beginning to avoid index shift
        for (let i = playerCount - 1; i >= 0; i--) {
          if (removeNewPlayerRow) {
            removeNewPlayerRow(i);
          }
        }
        // Clear validation errors
        setNewPlayerErrors({});
      }
    }
  };

  // Wrapper to ensure all fields are loaded when editing existing players
  const handleStartEditingPlayer = (player: any) => {
    startEditingPlayer({
      ...player,
      levelDescription: player.levelDescription || '',
      requireConfirmInfo: !!player.requireConfirmInfo,
    });
  };

  // Helper function to check if a user is already selected
  const isUserAlreadyUsed = (userId: string, currentIndex?: number): boolean => {
    // Check in new players (excluding current index if provided)
    const inNewPlayers = newPlayers.some(
      (p, idx) => p.userId === userId && (currentIndex === undefined || idx !== currentIndex)
    );
    
    // Check in existing players
    const inExistingPlayers = session.players.some(
      (p: any) => p.userId === userId
    );
    
    return inNewPlayers || inExistingPlayers;
  };

  return (
    <VStack spacing={8} align="stretch" p={{ base: 2, md: 4 }}>
      {/* Header section with stats */}
      <Box>
        <Flex justify="space-between" align="center" mb={2}>
          <HStack spacing={3}>
            <Box as={Users} boxSize={5} color="blue.600" />
            <Heading size="md" color="gray.800">
              {t('playerManagementTitle')}
            </Heading>
          </HStack>
          <Badge
            colorScheme={isMaxPlayersReached ? 'red' : 'green'}
            variant="subtle"
            px={3}
            py={1}
            borderRadius="full"
            fontSize="sm"
            fontWeight="semibold"
          >
            {t('playerCount', { current: currentPlayerCount, max: maxPlayers })}
          </Badge>
        </Flex>

        {/* Quick stats */}
        <HStack spacing={6} fontSize="sm" color="gray.600">
          <HStack spacing={1}>
            <Text fontWeight="medium">{session.players.length}</Text>
            <Text>{t('existing')}</Text>
          </HStack>
          <HStack spacing={1}>
            <Text fontWeight="medium">{newPlayers.length}</Text>
            <Text>{t('new')}</Text>
          </HStack>
          <HStack spacing={1}>
            <Text fontWeight="medium">{session.numberOfCourts}</Text>
            <Text>{t('courts')}</Text>
          </HStack>
        </HStack>
      </Box>

      {/* Add Player button when no new players */}
      {newPlayers.length === 0 && (
        <HStack justify="flex-end" w="100%">
          <Button
            size="sm"
            leftIcon={<Box as={Plus} boxSize={4} />}
            onClick={handleAddNewPlayer}
            colorScheme="green"
            bg="white"
            color="green.600"
            borderRadius="md"
            fontWeight="medium"
            fontSize="sm"
            px={3}
            py={2}
            border="1px solid #38a169"
            boxShadow="none"
            _hover={{ bg: '#f0fff4' }}
            width={{ base: 'auto', md: 'auto' }}
            title="Add new player"
          >
            {t('addPlayer')}
          </Button>
        </HStack>
      )}

      {/* Maximum players notification */}
      {isMaxPlayersReached && (
        <Card variant="outline" borderColor="orange.200" bg="orange.50">
          <CardBody>
            <HStack spacing={6} align="stretch">
              <Box as={AlertCircle} boxSize={5} color="orange.500" />
              <VStack align="start" spacing={1}>
                <Text fontSize="sm" fontWeight="semibold" color="orange.700">
                  {t('limitWarning')}
                </Text>
                <Text fontSize="sm" color="orange.600">
                  {t('limitWarningDescription', {
                    currentPlayerCount,
                    numberOfCourts: session.numberOfCourts,
                    maxPlayersPerCourt: session.maxPlayersPerCourt,
                  })}
                </Text>
              </VStack>
            </HStack>
          </CardBody>
        </Card>
      )}

      {/* New Players Section */}
      {newPlayers.length > 0 && (
        <Card variant="outline" borderColor="green.200" bg="green.50">
          <CardBody>
            <VStack spacing={6} align="stretch">
              {/* Header */}
              <HStack spacing={3}>
                <Box as={UserCheck} boxSize={5} color="green.600" />
                <Heading size="sm" color="green.700">
                  {t('newPlayersTitle', { count: newPlayers.length })}
                </Heading>
              </HStack>

              {/* Player cards */}
              <VStack spacing={4}>
                {newPlayers.map((player, index) => (
                  <Card
                    key={index}
                    width="100%"
                    variant="outline"
                    bg="white"
                    shadow="sm"
                  >
                    <CardBody p={{ base: 4, md: 5 }}>
                      <VStack spacing={4} align="stretch">
                        {/* Header with player number and delete button */}
                        <Flex justify="space-between" align="center">
                          <HStack spacing={3}>
                            <Badge
                              colorScheme="green"
                              variant="solid"
                              borderRadius="full"
                              px={3}
                            >
                              #{player.playerNumber}
                            </Badge>
                            <Text
                              fontSize="sm"
                              color="gray.600"
                              fontWeight="medium"
                            >
                              {t('newPlayer')}
                            </Text>
                          </HStack>
                          <IconButton
                            aria-label="Remove player"
                            icon={<Box as={Trash2} boxSize={4} />}
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => removeNewPlayerRow(index)}
                          />
                        </Flex>

                        {/* Player name - full width on mobile */}
                        <Box>
                          <Text
                            fontSize="sm"
                            mb={2}
                            color="gray.600"
                            fontWeight="medium"
                          >
                            {t('selectExistingPlayer')}
                          </Text>
                          <select
                            value={player.userId || ''}
                            onChange={(e) => handleUserSelection(index, e.target.value)}
                            style={{
                              width: '100%',
                              padding: '12px',
                              borderRadius: '6px',
                              border: '1px solid #E2E8F0',
                              backgroundColor: 'white',
                              fontSize: '14px',
                              marginBottom: '12px',
                            }}
                            disabled={isLoadingUsers}
                          >
                            <option value="">{t('createNewPlayer')}</option>
                            {availableUsers.map((user) => {
                              const isUsed = isUserAlreadyUsed(user.id, index);
                              return (
                                <option 
                                  key={user.id} 
                                  value={user.id}
                                  disabled={isUsed}
                                  style={{
                                    color: isUsed ? '#A0AEC0' : 'inherit',
                                    fontStyle: isUsed ? 'italic' : 'normal',
                                  }}
                                >
                                  {user.name} ({user.email}){isUsed ? ` - ${t('alreadySelected')}` : ''}
                                </option>
                              );
                            })}
                          </select>
                        </Box>

                        <Box>
                          <Text
                            fontSize="sm"
                            mb={2}
                            color="gray.600"
                            fontWeight="medium"
                          >
                            {t('playerName')}
                          </Text>
                          <Input
                            placeholder={t('enterPlayerName')}
                            value={player.name}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) => {
                              updateNewPlayer(index, 'name', e.target.value);
                              // Clear error when user starts typing
                              if (newPlayerErrors[index]) {
                                setNewPlayerErrors((prev) => ({
                                  ...prev,
                                  [index]: '',
                                }));
                              }
                            }}
                            size="md"
                            borderColor={
                              newPlayerErrors[index] ? 'red.400' : undefined
                            }
                            boxShadow={
                              newPlayerErrors[index]
                                ? '0 0 0 1px #F56565'
                                : undefined
                            }
                            _focus={{
                              borderColor: newPlayerErrors[index]
                                ? 'red.400'
                                : 'blue.500',
                              boxShadow: newPlayerErrors[index]
                                ? '0 0 0 1px #F56565'
                                : '0 0 0 1px #3182ce',
                            }}
                            disabled={!!player.userId}
                            opacity={player.userId ? 0.6 : 1}
                            cursor={player.userId ? 'not-allowed' : 'text'}
                          />
                          {newPlayerErrors[index] && (
                            <Text fontSize="xs" color="red.500" mt={1}>
                              {newPlayerErrors[index]}
                            </Text>
                          )}
                        </Box>

                        {/* Gender and Level - responsive grid */}
                        <Grid
                          templateColumns={{ base: '1fr', md: '1fr 1fr' }}
                          gap={4}
                        >
                          <Box>
                            <Text
                              fontSize="sm"
                              mb={2}
                              color="gray.600"
                              fontWeight="medium"
                            >
                              {t('gender')}
                            </Text>
                            <select
                              value={player.gender}
                              onChange={(e: any) =>
                                updateNewPlayer(index, 'gender', e.target.value)
                              }
                              style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '6px',
                                border: '1px solid #E2E8F0',
                                backgroundColor: player.userId ? '#F7FAFC' : 'white',
                                fontSize: '14px',
                                opacity: player.userId ? 0.6 : 1,
                                cursor: player.userId ? 'not-allowed' : 'pointer',
                              }}
                              disabled={!!player.userId}
                            >
                              <option value="MALE">{t('male')}</option>
                              <option value="FEMALE">{t('female')}</option>
                              <option value="OTHER">{t('other')}</option>
                              <option value="PREFER_NOT_TO_SAY">
                                {t('preferNotToSay')}
                              </option>
                            </select>
                          </Box>
                          <Box>
                            <Text
                              fontSize="sm"
                              mb={2}
                              color="gray.600"
                              fontWeight="medium"
                            >
                              {t('level')}
                            </Text>
                            <select
                              value={player.level}
                              onChange={(e: any) =>
                                updateNewPlayer(index, 'level', e.target.value)
                              }
                              style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '6px',
                                border: '1px solid #E2E8F0',
                                backgroundColor: player.userId ? '#F7FAFC' : 'white',
                                fontSize: '14px',
                                opacity: player.userId ? 0.6 : 1,
                                cursor: player.userId ? 'not-allowed' : 'pointer',
                              }}
                              disabled={!!player.userId}
                            >
                              <option value="">{t('selectLevel')}</option>
                              <option value={Level.Y_MINUS}>Y-</option>
                              <option value={Level.Y}>Y</option>
                              <option value={Level.Y_PLUS}>Y+</option>
                              <option value={Level.TBY}>TBY</option>
                              <option value={Level.TB_MINUS}>TB-</option>
                              <option value={Level.TB}>TB</option>
                              <option value={Level.TB_PLUS}>TB+</option>
                              <option value={Level.K}>K</option>
                            </select>
                          </Box>
                        </Grid>

                        {/* Level description */}
                        <Box>
                          <Text
                            fontSize="sm"
                            mb={2}
                            color="gray.600"
                            fontWeight="medium"
                          >
                            {t('levelDescription')}
                          </Text>
                          <Textarea
                            placeholder={t('levelDescriptionPlaceholder')}
                            size="md"
                            value={player.levelDescription || ''}
                            onChange={(
                              e: React.ChangeEvent<HTMLTextAreaElement>
                            ) =>
                              updateNewPlayer(
                                index,
                                'levelDescription',
                                e.target.value
                              )
                            }
                            rows={3}
                            disabled={!!player.userId}
                            opacity={player.userId ? 0.6 : 1}
                            cursor={player.userId ? 'not-allowed' : 'text'}
                            bg={player.userId ? 'gray.50' : 'white'}
                          />
                        </Box>

                        {/* Confirmation checkbox */}
                        <Box>
                          <Flex align="center" gap={3}>
                            <input
                              type="checkbox"
                              id={`requireConfirm-${index}`}
                              checked={player.requireConfirmInfo || false}
                              onChange={(e) =>
                                updateNewPlayer(
                                  index,
                                  'requireConfirmInfo',
                                  e.target.checked
                                )
                              }
                              style={{
                                width: '16px',
                                height: '16px',
                                accentColor: '#3182ce',
                              }}
                            />
                            <label
                              htmlFor={`requireConfirm-${index}`}
                              style={{
                                fontSize: '14px',
                                color: '#4A5568',
                                lineHeight: '1.4',
                              }}
                            >
                              {t('requirePlayerConfirmInfo')}
                            </label>
                          </Flex>
                        </Box>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </VStack>

              {/* Action buttons for new players */}
              <Flex
                justify="space-between"
                gap={3}
                pt={4}
                borderTop="1px solid"
                borderColor="green.200"
                flexWrap="wrap"
              >
                <Button
                  size="sm"
                  leftIcon={<Box as={Plus} boxSize={4} />}
                  onClick={handleAddNewPlayer}
                  colorScheme="green"
                  variant="outline"
                  title="Add another player"
                >
                  {t('addAnother')}
                </Button>

                <HStack spacing={2}>
                  <Button
                    size="sm"
                    leftIcon={<Box as={Save} boxSize={4} />}
                    colorScheme="green"
                    onClick={handleSavePlayerChanges}
                    loading={isSaving}
                    disabled={Object.keys(newPlayerErrors).length > 0}
                  >
                    {t('saveAll', { count: newPlayers.length })}
                  </Button>
                  <Button
                    size="sm"
                    leftIcon={<Box as={Trash2} boxSize={4} />}
                    colorScheme="red"
                    variant="outline"
                    onClick={cancelAddPlayers}
                  >
                    {tCommon('cancel')}
                  </Button>
                </HStack>
              </Flex>
            </VStack>
          </CardBody>
        </Card>
      )}

      {/* Existing Players Section */}
      <Card variant="outline">
        <CardBody p={1}>
          <VStack spacing={6} align="stretch">
            {/* Header */}
            <Flex justify="space-between" align="center">
              <HStack spacing={3}>
                <Box as={Users} boxSize={5} color="blue.600" />
                <VStack align="start" spacing={1}>
                  <Heading size="sm" color="gray.800">
                    {t('existingPlayers', { count: session.players.length })}
                  </Heading>
                  <Text fontSize="xs" color="gray.500">
                    {t('clickEditToModify')}
                  </Text>
                </VStack>
              </HStack>
            </Flex>

            {/* Player list or empty state */}
            {session.players.length === 0 ? (
              <Card variant="outline" bg="gray.50" borderStyle="dashed">
                <CardBody p={8}>
                  <VStack spacing={4}>
                    <Box fontSize="4xl">👥</Box>
                    <VStack spacing={2}>
                      <Text fontSize="lg" fontWeight="medium" color="gray.600">
                        {t('noPlayersYet')}
                      </Text>
                      <Text fontSize="sm" color="gray.500" textAlign="center">
                        {t('noPlayersYetDescription')}
                      </Text>
                    </VStack>
                    <Button
                      size="md"
                      leftIcon={<Box as={Plus} boxSize={4} />}
                      onClick={handleAddNewPlayer}
                      colorScheme="green"
                    >
                      {t('addFirstPlayer')}
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            ) : (
              <VStack spacing={3}>
                {session.players
                  .sort((a: any, b: any) => a.playerNumber - b.playerNumber)
                  .map((player: any) => {
                    const isEditing = editingPlayers[player.id];
                    return (
                      <Card
                        key={player.id}
                        width="100%"
                        variant="outline"
                        bg={isEditing ? 'blue.50' : 'white'}
                        borderColor={isEditing ? 'blue.200' : undefined}
                        boxShadow="md"
                        mb={4}
                      >
                        {' '}
                        <CardBody p={{ base: 4, md: 5 }}>
                          {isEditing ? (
                            // Editing mode
                            <VStack spacing={4} align="stretch">
                              {/* Header with player number and action buttons */}
                              <Flex justify="space-between" align="center">
                                <HStack spacing={3}>
                                  <Badge
                                    colorScheme="blue"
                                    variant="solid"
                                    borderRadius="full"
                                    px={3}
                                  >
                                    #{player.playerNumber}
                                  </Badge>
                                  <Text
                                    fontSize="sm"
                                    color="blue.600"
                                    fontWeight="medium"
                                  >
                                    {t('editingPlayer')}
                                  </Text>
                                </HStack>
                                <HStack>
                                  <IconButton
                                    aria-label="Save changes"
                                    icon={<Box as={Save} boxSize={4} />}
                                    size="sm"
                                    colorScheme="green"
                                    onClick={() =>
                                      saveIndividualPlayer(player.id)
                                    }
                                    loading={isSaving}
                                  />
                                  <IconButton
                                    aria-label="Cancel editing"
                                    icon={<Text fontSize="sm">✕</Text>}
                                    size="sm"
                                    colorScheme="gray"
                                    variant="ghost"
                                    onClick={() =>
                                      cancelEditingPlayer(player.id)
                                    }
                                  />
                                </HStack>
                              </Flex>

                              {/* Player name - full width on mobile */}
                              <Box>
                                <Text
                                  fontSize="sm"
                                  mb={2}
                                  color="gray.600"
                                  fontWeight="medium"
                                >
                                  {t('playerName')}
                                </Text>
                                <Input
                                  value={isEditing.name}
                                  onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>
                                  ) =>
                                    updateEditingPlayer(
                                      player.id,
                                      'name',
                                      e.target.value
                                    )
                                  }
                                  size="md"
                                  placeholder={t('enterPlayerName')}
                                />
                              </Box>

                              {/* Gender and Level - responsive grid */}
                              <Grid
                                templateColumns={{ base: '1fr', md: '1fr 1fr' }}
                                gap={4}
                              >
                                <Box>
                                  <Text
                                    fontSize="sm"
                                    mb={2}
                                    color="gray.600"
                                    fontWeight="medium"
                                  >
                                    {t('gender')}
                                  </Text>
                                  <select
                                    value={isEditing.gender}
                                    onChange={(e: any) =>
                                      updateEditingPlayer(
                                        player.id,
                                        'gender',
                                        e.target.value
                                      )
                                    }
                                    style={{
                                      width: '100%',
                                      padding: '12px',
                                      borderRadius: '6px',
                                      border: '1px solid #E2E8F0',
                                      backgroundColor: 'white',
                                      fontSize: '14px',
                                    }}
                                  >
                                    <option value="MALE">{t('male')}</option>
                                    <option value="FEMALE">{t('female')}</option>
                                    <option value="OTHER">{t('other')}</option>
                                    <option value="PREFER_NOT_TO_SAY">
                                      {t('preferNotToSay')}
                                    </option>
                                  </select>
                                </Box>
                                <Box>
                                  <Text
                                    fontSize="sm"
                                    mb={2}
                                    color="gray.600"
                                    fontWeight="medium"
                                  >
                                    {t('level')}
                                  </Text>
                                  <select
                                    value={isEditing.level}
                                    onChange={(e: any) =>
                                      updateEditingPlayer(
                                        player.id,
                                        'level',
                                        e.target.value
                                      )
                                    }
                                    style={{
                                      width: '100%',
                                      padding: '12px',
                                      borderRadius: '6px',
                                      border: '1px solid #E2E8F0',
                                      backgroundColor: 'white',
                                      fontSize: '14px',
                                    }}
                                  >
                                    <option value="">{t('selectLevel')}</option>
                                    <option value={Level.Y_MINUS}>Y-</option>
                                    <option value={Level.Y}>Y</option>
                                    <option value={Level.Y_PLUS}>Y+</option>
                                    <option value={Level.TBY}>TBY</option>
                                    <option value={Level.TB_MINUS}>TB-</option>
                                    <option value={Level.TB}>TB</option>
                                    <option value={Level.TB_PLUS}>TB+</option>
                                    <option value={Level.K}>K</option>
                                  </select>
                                </Box>
                              </Grid>

                              {/* Level description */}
                              <Box>
                                <Text
                                  fontSize="sm"
                                  mb={2}
                                  color="gray.600"
                                  fontWeight="medium"
                                >
                                  {t('levelDescription')}
                                </Text>
                                <Textarea
                                  placeholder={t('levelDescriptionPlaceholder')}
                                  size="md"
                                  value={isEditing.levelDescription || ''}
                                  onChange={(
                                    e: React.ChangeEvent<HTMLTextAreaElement>
                                  ) =>
                                    updateEditingPlayer(
                                      player.id,
                                      'levelDescription',
                                      e.target.value
                                    )
                                  }
                                  rows={3}
                                />
                              </Box>

                              {/* Confirmation checkboxes */}
                              <Box>
                                <Flex align="center" gap={3} mb={2}>
                                  <input
                                    type="checkbox"
                                    id={`requireConfirm-edit-${player.id}`}
                                    checked={
                                      isEditing.requireConfirmInfo || false
                                    }
                                    onChange={(e) =>
                                      updateEditingPlayer(
                                        player.id,
                                        'requireConfirmInfo',
                                        e.target.checked
                                      )
                                    }
                                    style={{
                                      width: '16px',
                                      height: '16px',
                                      accentColor: '#3182ce',
                                    }}
                                  />
                                  <label
                                    htmlFor={`requireConfirm-edit-${player.id}`}
                                    style={{
                                      fontSize: '14px',
                                      color: '#4A5568',
                                      lineHeight: '1.4',
                                    }}
                                  >
                                    {t('requirePlayerConfirmInfo')}
                                  </label>
                                </Flex>
                                <Flex align="center" gap={3}>
                                  <input
                                    type="checkbox"
                                    id={`confirmedByPlayer-edit-${player.id}`}
                                    checked={
                                      isEditing.confirmedByPlayer || false
                                    }
                                    onChange={(e) =>
                                      updateEditingPlayer(
                                        player.id,
                                        'confirmedByPlayer',
                                        e.target.checked
                                      )
                                    }
                                    style={{
                                      width: '16px',
                                      height: '16px',
                                      accentColor: '#38a169',
                                    }}
                                  />
                                  <label
                                    htmlFor={`confirmedByPlayer-edit-${player.id}`}
                                    style={{
                                      fontSize: '14px',
                                      color: '#22543d',
                                      lineHeight: '1.4',
                                    }}
                                  >
                                    {t('confirmedByPlayer')}
                                  </label>
                                </Flex>
                              </Box>
                            </VStack>
                          ) : (
                            // Display mode - Enhanced player card
                            <VStack spacing={3} align="stretch">
                              {/* Main info row */}
                              <Flex justify="space-between" align="center">
                                <HStack spacing={4} flex="1" align="center">
                                  {/* Player info */}
                                  <HStack spacing={3} flex="1">
                                    <Badge
                                      colorScheme="blue"
                                      variant="outline"
                                      borderRadius="full"
                                      px={3}
                                      py={1}
                                      fontSize="sm"
                                      fontWeight="bold"
                                    >
                                      #{player.playerNumber}
                                    </Badge>
                                    <Text
                                      fontWeight="semibold"
                                      fontSize="md"
                                      color="gray.800"
                                      style={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      {player.name ||
                                        `Player ${player.playerNumber}`}
                                    </Text>
                                  </HStack>

                                  {/* Status badges - desktop only */}
                                  <HStack
                                    spacing={2}
                                    display={{ base: 'none', md: 'flex' }}
                                  >
                                    {/* Gender badge */}
                                    <Badge
                                      colorScheme={getGenderColor(
                                        player.gender
                                      )}
                                      variant="subtle"
                                      borderRadius="md"
                                      px={2}
                                      py={1}
                                    >
                                      <HStack spacing={1}>
                                        <Box
                                          as={getGenderIcon(player.gender)}
                                          boxSize="12px"
                                        />
                                        <Text fontSize="xs">
                                          {getGenderLabel(player.gender)}
                                        </Text>
                                      </HStack>
                                    </Badge>

                                    {/* Level badge */}
                                    <Badge
                                      colorScheme="purple"
                                      variant="solid"
                                      borderRadius="md"
                                      px={2}
                                      py={1}
                                      fontSize="xs"
                                      fontWeight="bold"
                                    >
                                      {getLevelLabel(player.level)}
                                    </Badge>

                                    {/* Status badge */}
                                    <Badge
                                      colorScheme={
                                        player.status === 'PLAYING'
                                          ? 'green'
                                          : player.status === 'WAITING'
                                            ? 'orange'
                                            : player.status === 'READY'
                                              ? 'blue'
                                              : 'gray'
                                      }
                                      variant="solid"
                                      borderRadius="md"
                                      px={2}
                                      py={1}
                                      fontSize="xs"
                                      fontWeight="medium"
                                    >
                                      {player.status}
                                    </Badge>
                                  </HStack>
                                </HStack>

                                {/* Action buttons */}
                                <HStack spacing={1}>
                                  <IconButton
                                    aria-label="Show QR code"
                                    icon={<Box as={QrCode} boxSize={4} />}
                                    size="sm"
                                    colorScheme="green"
                                    variant="ghost"
                                    onClick={() => showPlayerQR(player)}
                                  />
                                  <IconButton
                                    aria-label="Edit player"
                                    icon={<Box as={Edit} boxSize={4} />}
                                    size="sm"
                                    colorScheme="blue"
                                    variant="ghost"
                                    onClick={() =>
                                      handleStartEditingPlayer(player)
                                    }
                                  />
                                  <IconButton
                                    aria-label="Delete player"
                                    icon={<Box as={Trash2} boxSize={4} />}
                                    size="sm"
                                    colorScheme="red"
                                    variant="ghost"
                                    onClick={() => deletePlayer(player.id)}
                                  />
                                </HStack>
                              </Flex>
                              {/* Mobile badges row */}
                              <HStack
                                spacing={2}
                                display={{ base: 'flex', md: 'none' }}
                                flexWrap="wrap"
                              >
                                <Badge
                                  colorScheme={getGenderColor(player.gender)}
                                  variant="subtle"
                                  borderRadius="md"
                                  px={2}
                                  py={1}
                                >
                                  <HStack spacing={1}>
                                    <Box
                                      as={getGenderIcon(player.gender)}
                                      boxSize="12px"
                                    />
                                    <Text fontSize="xs">
                                      {player.gender || 'Unknown'}
                                    </Text>
                                  </HStack>
                                </Badge>

                                <Badge
                                  colorScheme="purple"
                                  variant="solid"
                                  borderRadius="md"
                                  px={2}
                                  py={1}
                                  fontSize="xs"
                                >
                                  {getLevelLabel(player.level)}
                                </Badge>

                                <Badge
                                  colorScheme={
                                    player.status === 'PLAYING'
                                      ? 'green'
                                      : player.status === 'WAITING'
                                        ? 'orange'
                                        : player.status === 'READY'
                                          ? 'blue'
                                          : 'gray'
                                  }
                                  variant="solid"
                                  borderRadius="md"
                                  px={2}
                                  py={1}
                                  fontSize="xs"
                                >
                                  {player.status}
                                </Badge>
                              </HStack>{' '}
                              {/* Additional info section - enhanced styling */}
                              {(player.levelDescription ||
                                player.requireConfirmInfo ||
                                player.confirmedByPlayer) && (
                                <Card
                                  variant="outline"
                                  bg="gray.50"
                                  borderColor="gray.200"
                                >
                                  <CardBody p={3}>
                                    <VStack align="stretch" spacing={3}>
                                      {player.levelDescription && (
                                        <Box>
                                          {/* <HStack spacing={2} mb={2}>
                                            <Box
                                              w={1}
                                              h={1}
                                              bg="blue.400"
                                              borderRadius="full"
                                            />
                                            <Text
                                              fontSize="xs"
                                              color="blue.600"
                                              fontWeight="semibold"
                                              textTransform="uppercase"
                                            >
                                              Level Description
                                            </Text>
                                          </HStack> */}
                                          <Text
                                            fontSize="sm"
                                            color="gray.700"
                                            lineHeight="1.5"
                                            fontStyle="italic"
                                          >
                                            "{player.levelDescription}"
                                          </Text>
                                        </Box>
                                      )}
                                      {player.requireConfirmInfo && (
                                        <HStack spacing={2} align="center">
                                          <Box
                                            as={AlertCircle}
                                            boxSize={3}
                                            color="orange.500"
                                          />
                                          <Text
                                            fontSize="xs"
                                            color="orange.600"
                                            fontWeight="medium"
                                          >
                                            Requires confirmation from player
                                          </Text>
                                        </HStack>
                                      )}
                                      {player.confirmedByPlayer && (
                                        <HStack spacing={2} align="center">
                                          <Box
                                            as={UserCheck}
                                            boxSize={3}
                                            color="green.500"
                                          />
                                          <Text
                                            fontSize="xs"
                                            color="green.600"
                                            fontWeight="medium"
                                          >
                                            {t('confirmedByPlayer')}
                                          </Text>
                                        </HStack>
                                      )}
                                    </VStack>
                                  </CardBody>
                                </Card>
                              )}
                            </VStack>
                          )}
                        </CardBody>
                      </Card>
                    );
                  })}
              </VStack>
            )}
          </VStack>
        </CardBody>
      </Card>

      {/* Warning popup for exceeding recommended player limit */}
      {showMaxPlayersWarning && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.600"
          zIndex={9999}
          display="flex"
          alignItems="center"
          justifyContent="center"
          onClick={cancelAddPlayer}
        >
          <Box
            bg="white"
            _dark={{ bg: 'gray.800' }}
            borderRadius="lg"
            boxShadow="xl"
            p={6}
            maxW="md"
            mx={4}
            onClick={(e) => e.stopPropagation()}
          >
            <VStack spacing={4} align="stretch">
              <HStack spacing={3}>
                <Box as={AlertCircle} boxSize={6} color="orange.500" />
                <Heading size="md" color="orange.600">
                  {t('limitWarningModal.title')}
                </Heading>
              </HStack>

              <Text
                color="gray.600"
                _dark={{ color: 'gray.300' }}
                lineHeight="1.6"
              >
                {t('limitWarningModal.description', {
                  currentPlayerCount,
                  numberOfCourts: session.numberOfCourts,
                  maxPlayersPerCourt: session.maxPlayersPerCourt,
                })}
                <br />
                <br />
                {t('limitWarningModal.addingMoreMayResultIn')}
              </Text>

              <VStack align="start" spacing={2} pl={4}>
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

              <Flex gap={3} justifyContent="flex-end" pt={2}>
                <Button variant="outline" onClick={cancelAddPlayer} size="sm">
                  {tCommon('cancel')}
                </Button>
                <Button
                  colorScheme="orange"
                  onClick={confirmAddPlayerDespiteWarning}
                  size="sm"
                >
                  {t('limitWarningModal.addAnyway')}
                </Button>
              </Flex>
            </VStack>
          </Box>
        </Box>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedPlayerForQR && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.800"
          zIndex={9999}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p={4}
          onClick={closeQRModal}
        >
          <Box
            bg="white"
            borderRadius="lg"
            p={6}
            maxW="sm"
            w="full"
            onClick={(e) => e.stopPropagation()}
          >
            <VStack gap={4}>
              <HStack justify="space-between" w="full">
                <Text fontSize="lg" fontWeight="bold">
                  {t('qrCodeModal.title', { number: selectedPlayerForQR.playerNumber })}
                </Text>
                <Button size="sm" variant="ghost" onClick={closeQRModal}>
                  ✕
                </Button>
              </HStack>

              <Text textAlign="center" color="gray.600">
                {selectedPlayerForQR.name ||
                  `Player ${selectedPlayerForQR.playerNumber}`}
              </Text>

              {selectedPlayerForQR.joinCode && (
                <QRCodeGenerator
                  joinCode={selectedPlayerForQR.joinCode}
                  size={200}
                />
              )}

              {!selectedPlayerForQR.joinCode && (
                <Text color="red.500" textAlign="center">
                  {t('qrCodeModal.joinCodeNotAvailable')}
                </Text>
              )}

              <Text fontSize="sm" color="gray.500" textAlign="center">
                {t('qrCodeModal.shareInstructions')}
              </Text>
            </VStack>
          </Box>
        </Box>
      )}
    </VStack>
  );
};

export default PlayerManagement;
