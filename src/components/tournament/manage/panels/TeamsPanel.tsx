'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toaster } from '@/components/ui/toaster';
import {
  Box,
  Field,
  Flex,
  Heading,
  Input,
  Text,
  Textarea,
} from '@chakra-ui/react';
import { Button, VStack } from '@/components/ui/chakra-compat';
import {
  AlertCircle,
  ChevronDown,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Category,
  CategoryRegistration,
  CategoryRegistrationMode,
  TournamentPlayer,
} from '@/lib/api/types';
import { CategoryService } from '@/lib/api/category.service';
import { TournamentPlayerService } from '@/lib/api/tournament-player.service';
import { TournamentPairService } from '@/lib/api/tournament-pair.service';
import { TournamentMatchListSkeleton } from '@/components/tournament/skeletons';
import { VModal, useModal } from '@/components/ui/VModal';
import {
  buildPlayerTeamAssignments,
  getOtherTeamAssignments,
  getRegistrationPlayerIds,
} from '@/lib/tournament/teamRoster';
import TournamentManageEmptyState from './TournamentManageEmptyState';

interface TeamsPanelProps {
  categories: Category[];
  selectedCategory: Category | null;
  onSelectCategory: (category: Category) => void;
  onOpenCategoriesPanel: () => void;
}

type TAddMode = 'single' | 'select' | 'multiple';
type BulkProgress = {
  current: number;
  total: number;
  currentName: string;
};

type ApiErrorLike = {
  message?: string;
  response?: {
    status?: number;
    data?: {
      message?: string | string[];
      error?: string;
    };
  };
};

const CATEGORY_COLORS = [
  'yellow.400',
  'blue.300',
  'green.400',
  'purple.400',
  'pink.400',
  'orange.400',
  'cyan.400',
  'red.400',
];

const parseBulkTeamNames = (value: string): string[] =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const getErrorMessage = (error: unknown, fallback: string): string => {
  const apiError = error as ApiErrorLike;
  const responseMessage = apiError?.response?.data?.message;

  if (Array.isArray(responseMessage)) {
    return responseMessage.join(', ');
  }

  if (responseMessage) {
    return responseMessage;
  }

  if (apiError?.response?.data?.error) {
    return apiError.response.data.error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

const getRegistrationName = (reg: CategoryRegistration): string =>
  reg.player?.name ||
  reg.pair?.name ||
  reg.pair?.members?.map((member) => member.player?.name).join(' & ') ||
  'Unknown';

const isConflictError = (error: unknown): boolean =>
  (error as ApiErrorLike)?.response?.status === 409;

export default function TeamsPanel({
  categories,
  selectedCategory,
  onSelectCategory,
  onOpenCategoriesPanel,
}: TeamsPanelProps) {
  const t = useTranslations('pages.tournaments.detail.manage');
  const [registrations, setRegistrations] = useState<CategoryRegistration[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);

  // Category dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Add modal
  const addModal = useModal();
  const [addMode, setAddMode] = useState<TAddMode>('single');
  const [addName, setAddName] = useState('');
  const [addMultiText, setAddMultiText] = useState('');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [playerSearch, setPlayerSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<BulkProgress | null>(null);

  // Edit modal
  const editModal = useModal();
  const [editingReg, setEditingReg] = useState<CategoryRegistration | null>(
    null
  );
  const [editName, setEditName] = useState('');
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isCreatePlayerOpen, setIsCreatePlayerOpen] = useState(false);
  const [isCreatingMember, setIsCreatingMember] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete modal
  const deleteModal = useModal();
  const [deletingReg, setDeletingReg] = useState<CategoryRegistration | null>(
    null
  );

  const activeCategory = selectedCategory || categories[0];
  const activeCategoryIndex = categories.findIndex(
    (c) => c.id === activeCategory?.id
  );
  const activeCategoryColor =
    CATEGORY_COLORS[activeCategoryIndex % CATEGORY_COLORS.length];
  const isTeamCategory =
    activeCategory?.registrationMode === CategoryRegistrationMode.TEAM;
  const participantCopyScope = isTeamCategory ? 'team' : 'player';
  const tc = (key: string, values?: Record<string, string | number>) =>
    t(`panels.teams.${participantCopyScope}.${key}`, values);
  const teamSize = activeCategory?.teamSize ?? 2;
  const assignmentMap = useMemo(
    () => buildPlayerTeamAssignments(registrations, getRegistrationName),
    [registrations]
  );
  const memberIdSet = useMemo(() => new Set(memberIds), [memberIds]);
  const playerNamesById = useMemo(() => {
    const names = new Map(players.map((player) => [player.id, player.name]));

    for (const registration of registrations) {
      if (registration.player?.id) {
        names.set(registration.player.id, registration.player.name);
      }
      for (const member of registration.pair?.members ?? []) {
        if (member.player?.name) {
          names.set(member.playerId, member.player.name);
        }
      }
    }

    return names;
  }, [players, registrations]);
  const normalizedMemberSearch = memberSearch.trim().toLocaleLowerCase();
  const rosterCandidates = useMemo(
    () =>
      players.filter(
        (player) =>
          !memberIdSet.has(player.id) &&
          (normalizedMemberSearch.length === 0 ||
            player.name.toLocaleLowerCase().includes(normalizedMemberSearch))
      ),
    [memberIdSet, normalizedMemberSearch, players]
  );
  const conflictingMemberIds = memberIds.filter(
    (playerId) =>
      getOtherTeamAssignments(assignmentMap, playerId, editingReg?.id).length >
      0
  );
  const hasRosterConflict = conflictingMemberIds.length > 0;
  const isRosterFull = memberIds.length >= teamSize;

  // Players that exist in the tournament but are NOT yet registered in this
  // (individual) category — used by the "select from list" add mode.
  const registeredPlayerIds = new Set(
    registrations
      .map(
        (registration) =>
          registration.player?.id ?? registration.tournamentPlayerId
      )
      .filter((playerId): playerId is string => Boolean(playerId))
  );
  const normalizedPlayerSearch = playerSearch.trim().toLowerCase();
  const registrablePlayers = players.filter(
    (player) =>
      !registeredPlayerIds.has(player.id) &&
      (normalizedPlayerSearch.length === 0 ||
        player.name.toLowerCase().includes(normalizedPlayerSearch))
  );

  const loadRegistrations = useCallback(async (categoryId: string) => {
    try {
      setLoading(true);
      const data = await CategoryService.getRegistrations(categoryId);
      setRegistrations(data);
    } catch (error) {
      console.error('Error loading registrations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeCategory) {
      loadRegistrations(activeCategory.id);
      TournamentPlayerService.getPlayers(activeCategory.tournamentId).then(
        setPlayers
      );
    }
  }, [activeCategory, loadRegistrations]);

  // ── Add Teams ────────────────────────────────────────────────────────────────
  const handleOpenAdd = () => {
    setAddMode('single');
    setAddName('');
    setAddMultiText('');
    setSelectedPlayerIds([]);
    setPlayerSearch('');
    setBulkProgress(null);
    addModal.onOpen();
  };

  const handleAdd = async () => {
    if (!activeCategory) {
      toaster.error({ title: tc('noCategorySelected') });
      return;
    }
    const tournamentId = activeCategory.tournamentId;
    try {
      setIsSubmitting(true);
      setBulkProgress(null);
      if (addMode === 'single') {
        if (!addName.trim()) return;
        if (isTeamCategory) {
          const pair = await TournamentPairService.createPair(tournamentId, {
            name: addName.trim(),
            playerIds: [],
            type: activeCategory.type,
          });
          await CategoryService.createRegistration(activeCategory.id, {
            tournamentPairId: pair.id,
          });
        } else {
          const player = await TournamentPlayerService.createPlayer(
            tournamentId,
            {
              name: addName.trim(),
            }
          );
          await CategoryService.createRegistration(activeCategory.id, {
            tournamentPlayerId: player.id,
          });
        }
        toaster.success({
          title: tc('addSuccess'),
        });
      } else if (addMode === 'select') {
        if (selectedPlayerIds.length === 0) {
          toaster.error({
            title: tc('enterAtLeastOne'),
          });
          return;
        }
        // Single request: register every selected existing player in one
        // transaction instead of firing N parallel API calls.
        const created = await CategoryService.bulkCreateRegistrations(
          activeCategory.id,
          { tournamentPlayerIds: selectedPlayerIds }
        );
        toaster.success({
          title: tc('bulkAddSuccess', { count: created.length }),
        });
      } else {
        const lines = parseBulkTeamNames(addMultiText);
        if (lines.length === 0) {
          toaster.error({
            title: tc('enterAtLeastOne'),
          });
          return;
        }
        // Single request: the backend creates every pair/player + registration
        // in one transaction, so we no longer fire N parallel API calls.
        const created = await CategoryService.bulkCreateRegistrations(
          activeCategory.id,
          { names: lines }
        );
        toaster.success({
          title: tc('bulkAddSuccess', { count: created.length }),
        });
      }
      await loadRegistrations(activeCategory.id);
      setAddName('');
      setAddMultiText('');
      setSelectedPlayerIds([]);
      setPlayerSearch('');
      addModal.onClose();
    } catch (error) {
      console.error('Error adding team(s):', error);
      toaster.error({
        title: tc('addFailed'),
        description: getErrorMessage(error, t('panels.teams.unknownError')),
      });
    } finally {
      setBulkProgress(null);
      setIsSubmitting(false);
    }
  };

  // ── Edit Team ────────────────────────────────────────────────────────────────
  const handleOpenEdit = (reg: CategoryRegistration) => {
    setEditingReg(reg);
    setEditName(getRegistrationName(reg));
    setMemberIds(getRegistrationPlayerIds(reg));
    setMemberSearch('');
    setNewPlayerName('');
    setIsCreatePlayerOpen(false);
    setEditError('');
    editModal.onOpen();
  };

  const handleEdit = async () => {
    if (
      !editingReg ||
      !editName.trim() ||
      hasRosterConflict ||
      memberIds.length > teamSize
    ) {
      return;
    }
    try {
      setIsSubmitting(true);
      setEditError('');
      if (isTeamCategory) {
        if (editingReg.pair) {
          await TournamentPairService.updatePair(editingReg.pair.id, {
            name: editName.trim(),
            playerIds: memberIds,
            type: activeCategory?.type,
          });
        } else if (activeCategory) {
          await CategoryService.convertLegacyRegistrationToPair(
            activeCategory.id,
            editingReg.id,
            {
              name: editName.trim(),
              playerIds: memberIds,
              type: activeCategory.type,
            }
          );
        }
      } else {
        const playerId = editingReg.player?.id ?? editingReg.tournamentPlayerId;
        if (!playerId) return;
        await TournamentPlayerService.updatePlayer(playerId, {
          name: editName.trim(),
        });
      }
      if (activeCategory) {
        await loadRegistrations(activeCategory.id);
      }
      editModal.onClose();
    } catch (error) {
      console.error('Error editing team:', error);
      if (isConflictError(error) && activeCategory) {
        await loadRegistrations(activeCategory.id);
      }
      setEditError(
        isConflictError(error)
          ? t('panels.teams.rosterConflictServer')
          : getErrorMessage(error, t('panels.teams.unknownError'))
      );
      toaster.error({
        title: tc('updateFailed'),
        description: getErrorMessage(error, t('panels.teams.unknownError')),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateMember = async () => {
    if (!activeCategory || !newPlayerName.trim() || isRosterFull) return;
    try {
      setIsCreatingMember(true);
      setEditError('');
      const player = await TournamentPlayerService.createPlayer(
        activeCategory.tournamentId,
        { name: newPlayerName.trim() },
        { showToast: false }
      );
      setPlayers((current) => [player, ...current]);
      setMemberIds((current) => [...current, player.id]);
      setNewPlayerName('');
      setIsCreatePlayerOpen(false);
    } catch (error) {
      setEditError(
        getErrorMessage(error, t('panels.teams.memberCreateFailedHelp'))
      );
      toaster.error({
        title: t('panels.teams.memberAddFailed'),
        description: getErrorMessage(error, t('panels.teams.unknownError')),
      });
    } finally {
      setIsCreatingMember(false);
    }
  };

  // ── Delete Team ──────────────────────────────────────────────────────────────
  const handleOpenDelete = (reg: CategoryRegistration) => {
    setDeletingReg(reg);
    deleteModal.onOpen();
  };

  const handleDelete = async () => {
    if (!deletingReg || !activeCategory) return;
    try {
      setIsSubmitting(true);
      await CategoryService.deleteRegistration(
        activeCategory.id,
        deletingReg.id
      );
      await loadRegistrations(activeCategory.id);
      deleteModal.onClose();
    } catch (error) {
      console.error('Error deleting team:', error);
      toaster.error({
        title: tc('deleteFailed'),
        description:
          error instanceof Error
            ? error.message
            : t('panels.teams.unknownError'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <VStack gap={4} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center" gap={3}>
          <Flex align="center" gap={2} flexShrink={0}>
            <Heading size="md">{tc('title')}</Heading>
          </Flex>

          {/* Category dropdown */}
          {categories.length > 1 && (
            <Box position="relative" flex="1" maxW="180px">
              <Flex
                as="button"
                align="center"
                gap={2}
                px={3}
                py={1.5}
                borderRadius="full"
                bg="gray.100"
                _hover={{ bg: 'gray.200' }}
                _dark={{
                  bg: 'gray.700',
                  _hover: { bg: 'gray.600' },
                }}
                cursor="pointer"
                fontSize="sm"
                fontWeight="medium"
                w="full"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
              >
                <Box
                  w="8px"
                  h="8px"
                  borderRadius="full"
                  bg={activeCategoryColor}
                  flexShrink={0}
                />
                <Text flex="1" textAlign="left" lineClamp={1}>
                  {activeCategory?.name}
                </Text>
                <ChevronDown size={14} />
              </Flex>

              {isDropdownOpen && (
                <>
                  {/* Click-away overlay */}
                  <Box
                    position="fixed"
                    inset={0}
                    zIndex={10}
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <Box
                    position="absolute"
                    top="calc(100% + 4px)"
                    left={0}
                    zIndex={11}
                    bg="white"
                    borderRadius="xl"
                    boxShadow="md"
                    minW="160px"
                    py={1}
                    border="1px solid"
                    borderColor="gray.100"
                    _dark={{
                      bg: 'gray.800',
                      borderColor: 'gray.700',
                    }}
                  >
                    {categories.map((cat, idx) => (
                      <Flex
                        key={cat.id}
                        as="button"
                        align="center"
                        gap={2}
                        px={4}
                        py={2.5}
                        w="full"
                        fontSize="sm"
                        _hover={{ bg: 'gray.50' }}
                        _dark={{ _hover: { bg: 'gray.700' } }}
                        onClick={() => {
                          onSelectCategory(cat);
                          setIsDropdownOpen(false);
                        }}
                      >
                        <Box
                          w="8px"
                          h="8px"
                          borderRadius="full"
                          bg={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}
                          flexShrink={0}
                        />
                        <Text>{cat.name}</Text>
                      </Flex>
                    ))}
                  </Box>
                </>
              )}
            </Box>
          )}

          {categories.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Plus size={14} />}
              onClick={handleOpenAdd}
            >
              {tc('add')}
            </Button>
          )}
        </Flex>

        {/* Registrations list */}
        {categories.length === 0 ? (
          <TournamentManageEmptyState
            icon={<Users size={24} />}
            title={t('panels.categoryRequired.emptyTitle')}
            description={t('panels.categoryRequired.emptyDescription')}
            actionLabel={t('panels.categoryRequired.action')}
            onAction={onOpenCategoriesPanel}
          />
        ) : loading ? (
          <TournamentMatchListSkeleton count={4} />
        ) : registrations.length === 0 ? (
          <Flex
            direction="column"
            align="center"
            py={8}
            gap={2}
            color="gray.400"
          >
            <Users size={32} />
            <Text fontSize="sm">{tc('empty')}</Text>
          </Flex>
        ) : (
          <VStack gap={0} align="stretch">
            {registrations.map((reg) => {
              const name = getRegistrationName(reg);
              const memberCount = reg.pair?.members?.length ?? 0;
              return (
                <Flex
                  key={reg.id}
                  py={3}
                  px={2}
                  align="center"
                  gap={3}
                  borderBottomWidth="1px"
                  borderColor="gray.100"
                  _hover={{ bg: 'gray.50' }}
                  _dark={{
                    borderColor: 'gray.700',
                    _hover: { bg: 'gray.700' },
                  }}
                >
                  <Flex
                    w="32px"
                    h="32px"
                    bg="gray.100"
                    borderRadius="full"
                    align="center"
                    justify="center"
                    flexShrink={0}
                    _dark={{ bg: 'gray.700' }}
                  >
                    <Users size={16} color="#A0AEC0" />
                  </Flex>
                  <Text flex="1" fontSize="sm" fontWeight="medium">
                    {name}
                  </Text>
                  {isTeamCategory && (
                    <Text
                      fontSize="xs"
                      color={
                        memberCount < (activeCategory?.teamSize ?? 2)
                          ? 'orange.600'
                          : 'green.600'
                      }
                      _dark={{
                        color:
                          memberCount < (activeCategory?.teamSize ?? 2)
                            ? 'orange.300'
                            : 'green.300',
                      }}
                    >
                      {t('panels.teams.memberCount', {
                        current: memberCount,
                        total: activeCategory?.teamSize ?? 2,
                      })}
                    </Text>
                  )}
                  <Flex gap={1}>
                    <Box
                      as="button"
                      {...({ type: 'button' } as Record<string, unknown>)}
                      aria-label={tc('editTitle')}
                      p={1.5}
                      borderRadius="md"
                      color="gray.400"
                      _hover={{ bg: 'gray.100', color: 'gray.600' }}
                      _focusVisible={{
                        outline: '2px solid',
                        outlineColor: 'green.500',
                        outlineOffset: '2px',
                      }}
                      _dark={{
                        color: 'gray.400',
                        _hover: { bg: 'gray.700', color: 'gray.200' },
                      }}
                      onClick={() => handleOpenEdit(reg)}
                    >
                      <Pencil size={16} aria-hidden="true" />
                    </Box>
                    <Box
                      as="button"
                      {...({ type: 'button' } as Record<string, unknown>)}
                      aria-label={tc('deleteTitle')}
                      p={1.5}
                      borderRadius="md"
                      color="gray.400"
                      _hover={{ bg: 'red.50', color: 'red.500' }}
                      _focusVisible={{
                        outline: '2px solid',
                        outlineColor: 'red.500',
                        outlineOffset: '2px',
                      }}
                      _dark={{
                        color: 'gray.400',
                        _hover: { bg: 'red.900', color: 'red.200' },
                      }}
                      onClick={() => handleOpenDelete(reg)}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </Box>
                  </Flex>
                </Flex>
              );
            })}
            <Text
              fontSize="xs"
              color="gray.400"
              textAlign="center"
              pt={3}
              _dark={{ color: 'gray.500' }}
            >
              {tc('count', { count: registrations.length })}
            </Text>
          </VStack>
        )}
      </VStack>

      {/* Add Teams Modal */}
      <VModal
        isOpen={addModal.isOpen}
        onClose={addModal.onClose}
        title={tc('addTitle')}
        headerRightContent={
          activeCategory ? (
            <Flex
              align="center"
              gap={1.5}
              px={2.5}
              py={1}
              borderRadius="full"
              bg="gray.100"
              maxW="180px"
              _dark={{ bg: 'gray.700' }}
            >
              <Box
                w={2}
                h={2}
                borderRadius="full"
                bg={activeCategoryColor}
                flexShrink={0}
              />
              <Text
                fontSize="xs"
                fontWeight="medium"
                color="gray.700"
                _dark={{ color: 'gray.200' }}
                truncate
              >
                {activeCategory.name}
              </Text>
            </Flex>
          ) : undefined
        }
        primaryActionText={t('panels.teams.save')}
        onPrimaryAction={handleAdd}
        isPrimaryLoading={isSubmitting}
        isPrimaryDisabled={
          addMode === 'single'
            ? !addName.trim()
            : addMode === 'select'
              ? selectedPlayerIds.length === 0
              : !addMultiText.trim()
        }
        secondaryActionText={t('panels.teams.cancel')}
      >
        <VStack gap={4} align="stretch">
          {/* Add mode toggle */}
          <Flex
            bg="gray.100"
            borderRadius="full"
            p={1}
            _dark={{ bg: 'gray.700' }}
          >
            {(isTeamCategory
              ? (['single', 'multiple'] as TAddMode[])
              : (['single', 'select', 'multiple'] as TAddMode[])
            ).map((mode) => (
              <Box
                key={mode}
                as="button"
                flex={1}
                py={1.5}
                borderRadius="full"
                fontSize="sm"
                fontWeight="medium"
                textAlign="center"
                bg={addMode === mode ? 'white' : 'transparent'}
                color={addMode === mode ? 'gray.900' : 'gray.500'}
                _dark={{
                  bg: addMode === mode ? 'gray.900' : 'transparent',
                  color: addMode === mode ? 'gray.50' : 'gray.300',
                }}
                boxShadow={addMode === mode ? 'sm' : 'none'}
                transition="background-color 0.2s, color 0.2s, box-shadow 0.2s, opacity 0.2s"
                opacity={isSubmitting ? 0.6 : 1}
                onClick={() => {
                  if (isSubmitting) return;
                  setAddMode(mode);
                }}
              >
                {mode === 'single'
                  ? t('panels.teams.single')
                  : mode === 'select'
                    ? t('panels.teams.selectFromList')
                    : t('panels.teams.multiple')}
              </Box>
            ))}
          </Flex>

          {addMode === 'single' && (
            <Input
              placeholder={tc('namePlaceholder')}
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              disabled={isSubmitting}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
              }}
            />
          )}

          {addMode === 'select' && (
            <VStack gap={2} align="stretch">
              <Input
                placeholder={t('panels.teams.searchPlayerPlaceholder')}
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                disabled={isSubmitting}
              />
              {selectedPlayerIds.length > 0 && (
                <Text
                  fontSize="sm"
                  color="gray.500"
                  _dark={{ color: 'gray.400' }}
                >
                  {t('panels.teams.selectedCount', {
                    count: selectedPlayerIds.length,
                  })}
                </Text>
              )}
              {registrablePlayers.length === 0 ? (
                <Box
                  py={6}
                  textAlign="center"
                  fontSize="sm"
                  color="gray.500"
                  _dark={{ color: 'gray.400' }}
                >
                  {t('panels.teams.noAvailablePlayers')}
                </Box>
              ) : (
                <VStack gap={2} align="stretch" maxH="280px" overflowY="auto">
                  {registrablePlayers.map((player) => {
                    const checked = selectedPlayerIds.includes(player.id);
                    return (
                      <Flex
                        key={player.id}
                        align="center"
                        gap={3}
                        borderWidth="1px"
                        borderRadius="md"
                        px={3}
                        py={2}
                        cursor="pointer"
                        bg={checked ? 'green.50' : 'transparent'}
                        borderColor={checked ? 'green.300' : 'border'}
                        _dark={{
                          bg: checked ? 'green.900' : 'transparent',
                          borderColor: checked ? 'green.600' : 'gray.600',
                        }}
                        onClick={() => {
                          if (isSubmitting) return;
                          setSelectedPlayerIds((current) =>
                            checked
                              ? current.filter((id) => id !== player.id)
                              : [...current, player.id]
                          );
                        }}
                      >
                        <input type="checkbox" checked={checked} readOnly />
                        <Text fontSize="sm" color="fg">
                          {player.name}
                        </Text>
                      </Flex>
                    );
                  })}
                </VStack>
              )}
            </VStack>
          )}

          {addMode === 'multiple' && (
            <VStack gap={2} align="stretch">
              <Textarea
                placeholder={tc('multiPlaceholder')}
                value={addMultiText}
                onChange={(e) => setAddMultiText(e.target.value)}
                rows={6}
                resize="vertical"
                disabled={isSubmitting}
              />
              {bulkProgress && (
                <Text
                  fontSize="sm"
                  color="gray.500"
                  _dark={{ color: 'gray.400' }}
                >
                  {t('panels.teams.bulkProgress', {
                    current: bulkProgress.current,
                    total: bulkProgress.total,
                    name: bulkProgress.currentName,
                  })}
                </Text>
              )}
            </VStack>
          )}
        </VStack>
      </VModal>

      {/* Edit Team Modal */}
      <VModal
        isOpen={editModal.isOpen}
        onClose={() => {
          if (!isSubmitting && !isCreatingMember) editModal.onClose();
        }}
        title={isTeamCategory ? t('panels.teams.teamDetails') : tc('editTitle')}
        primaryActionText={t('panels.teams.save')}
        onPrimaryAction={handleEdit}
        isPrimaryLoading={isSubmitting}
        isPrimaryDisabled={
          !editName.trim() ||
          hasRosterConflict ||
          memberIds.length > teamSize ||
          isCreatingMember
        }
        isSecondaryDisabled={isCreatingMember}
        secondaryActionText={t('panels.teams.cancel')}
        closeOnOverlayClick={false}
        size="lg"
        maxBodyHeight={{ base: '68vh', md: '72vh' }}
      >
        <VStack gap={4} align="stretch">
          <Field.Root required>
            <Field.Label htmlFor="team-roster-name">
              {t('panels.teams.teamNameLabel')}
            </Field.Label>
            <Input
              id="team-roster-name"
              name="teamName"
              autoComplete="off"
              placeholder={tc('namePlaceholder')}
              value={editName}
              disabled={isSubmitting}
              onChange={(event) => {
                setEditName(event.target.value);
                setEditError('');
              }}
            />
          </Field.Root>
          {isTeamCategory && (
            <>
              <Box>
                <Flex justify="space-between" align="center" gap={3} mb={2}>
                  <Text fontSize="sm" fontWeight="semibold">
                    {t('panels.teams.selectedMembers')}
                  </Text>
                  <Text
                    fontSize="sm"
                    color={
                      memberIds.length === teamSize ? 'green.600' : 'orange.600'
                    }
                    fontVariantNumeric="tabular-nums"
                    _dark={{
                      color:
                        memberIds.length === teamSize
                          ? 'green.300'
                          : 'orange.300',
                    }}
                  >
                    {t('panels.teams.members', {
                      current: memberIds.length,
                      total: teamSize,
                    })}
                  </Text>
                </Flex>

                {memberIds.length === 0 ? (
                  <Box
                    borderWidth="1px"
                    borderStyle="dashed"
                    borderRadius="lg"
                    px={3}
                    py={4}
                    textAlign="center"
                    color="fg.muted"
                  >
                    <Text fontSize="sm">
                      {t('panels.teams.noSelectedMembers')}
                    </Text>
                  </Box>
                ) : (
                  <VStack gap={2} align="stretch">
                    {memberIds.map((playerId) => {
                      const otherAssignments = getOtherTeamAssignments(
                        assignmentMap,
                        playerId,
                        editingReg?.id
                      );
                      const hasConflict = otherAssignments.length > 0;
                      return (
                        <Flex
                          key={playerId}
                          align="center"
                          gap={3}
                          borderWidth="1px"
                          borderColor={hasConflict ? 'red.300' : 'border'}
                          bg={hasConflict ? 'red.50' : 'bg.subtle'}
                          borderRadius="lg"
                          px={3}
                          py={2.5}
                          _dark={{
                            borderColor: hasConflict ? 'red.700' : 'gray.600',
                            bg: hasConflict ? 'red.950' : 'gray.750',
                          }}
                        >
                          <Flex
                            w="32px"
                            h="32px"
                            borderRadius="full"
                            bg="bg.muted"
                            align="center"
                            justify="center"
                            flexShrink={0}
                          >
                            <Users size={16} aria-hidden="true" />
                          </Flex>
                          <Box flex="1" minW={0}>
                            <Text fontSize="sm" fontWeight="medium" truncate>
                              {playerNamesById.get(playerId) ??
                                t('panels.teams.unknownPlayer')}
                            </Text>
                            {hasConflict ? (
                              <Text fontSize="xs" color="red.600">
                                {t('panels.teams.memberConflict', {
                                  teams: otherAssignments
                                    .map(({ teamName }) => teamName)
                                    .join(', '),
                                })}
                              </Text>
                            ) : null}
                          </Box>
                          <Box
                            as="button"
                            {...({
                              type: 'button',
                              disabled: isSubmitting || isCreatingMember,
                            } as Record<string, unknown>)}
                            aria-label={t('panels.teams.removeMemberAria', {
                              name:
                                playerNamesById.get(playerId) ??
                                t('panels.teams.unknownPlayer'),
                            })}
                            p={2}
                            borderRadius="md"
                            color="red.500"
                            _hover={{ bg: 'red.100' }}
                            _focusVisible={{
                              outline: '2px solid',
                              outlineColor: 'green.500',
                              outlineOffset: '2px',
                            }}
                            _disabled={{ opacity: 0.5, cursor: 'not-allowed' }}
                            onClick={() => {
                              setMemberIds((current) =>
                                current.filter((id) => id !== playerId)
                              );
                              setEditError('');
                            }}
                          >
                            <X size={16} aria-hidden="true" />
                          </Box>
                        </Flex>
                      );
                    })}
                  </VStack>
                )}
              </Box>

              <Box borderTopWidth="1px" borderColor="border" pt={4}>
                <Field.Root>
                  <Field.Label htmlFor="team-member-search">
                    {t('panels.teams.addMembersLabel')}
                  </Field.Label>
                  <Box position="relative">
                    <Box
                      position="absolute"
                      left={3}
                      top="50%"
                      transform="translateY(-50%)"
                      color="fg.muted"
                      pointerEvents="none"
                    >
                      <Search size={16} aria-hidden="true" />
                    </Box>
                    <Input
                      id="team-member-search"
                      name="teamMemberSearch"
                      autoComplete="off"
                      pl={9}
                      placeholder={t('panels.teams.searchPlayerPlaceholder')}
                      value={memberSearch}
                      disabled={isSubmitting || isCreatingMember}
                      onChange={(event) => setMemberSearch(event.target.value)}
                    />
                  </Box>
                </Field.Root>

                {isRosterFull ? (
                  <Text fontSize="xs" color="orange.600" mt={2}>
                    {t('panels.teams.rosterFullHelp')}
                  </Text>
                ) : null}

                <VStack
                  gap={2}
                  align="stretch"
                  maxH="240px"
                  overflowY="auto"
                  overscrollBehavior="contain"
                  mt={3}
                  pr={1}
                >
                  {rosterCandidates.length === 0 ? (
                    <Box py={5} textAlign="center" color="fg.muted">
                      <Text fontSize="sm">
                        {t('panels.teams.noRosterCandidates')}
                      </Text>
                    </Box>
                  ) : (
                    rosterCandidates.map((player) => {
                      const otherAssignments = getOtherTeamAssignments(
                        assignmentMap,
                        player.id,
                        editingReg?.id
                      );
                      const isAssigned = otherAssignments.length > 0;
                      const isDisabled =
                        isAssigned ||
                        isRosterFull ||
                        isSubmitting ||
                        isCreatingMember;
                      const statusText = isAssigned
                        ? t('panels.teams.assignedToTeam', {
                            teams: otherAssignments
                              .map(({ teamName }) => teamName)
                              .join(', '),
                          })
                        : isRosterFull
                          ? t('panels.teams.rosterFullStatus')
                          : t('panels.teams.addToTeam');

                      return (
                        <Box
                          key={player.id}
                          as="button"
                          {...({
                            type: 'button',
                            disabled: isDisabled,
                          } as Record<string, unknown>)}
                          w="full"
                          textAlign="left"
                          borderWidth="1px"
                          borderColor="border"
                          borderRadius="lg"
                          px={3}
                          py={2.5}
                          cursor={isDisabled ? 'not-allowed' : 'pointer'}
                          opacity={isDisabled ? 0.65 : 1}
                          _hover={
                            isDisabled
                              ? undefined
                              : { borderColor: 'green.400', bg: 'green.50' }
                          }
                          _focusVisible={{
                            outline: '2px solid',
                            outlineColor: 'green.500',
                            outlineOffset: '2px',
                          }}
                          _dark={{
                            borderColor: 'gray.600',
                            _hover: isDisabled
                              ? undefined
                              : { borderColor: 'green.500', bg: 'green.950' },
                          }}
                          css={{
                            contentVisibility: 'auto',
                            containIntrinsicSize: '0 52px',
                          }}
                          onClick={() => {
                            if (isDisabled) return;
                            setMemberIds((current) => [...current, player.id]);
                            setEditError('');
                          }}
                        >
                          <Flex align="center" gap={3}>
                            <Flex
                              w="32px"
                              h="32px"
                              borderRadius="full"
                              bg={isAssigned ? 'bg.muted' : 'green.100'}
                              color={isAssigned ? 'fg.muted' : 'green.700'}
                              align="center"
                              justify="center"
                              flexShrink={0}
                              _dark={{
                                bg: isAssigned ? 'gray.700' : 'green.900',
                                color: isAssigned ? 'gray.400' : 'green.200',
                              }}
                            >
                              <UserPlus size={16} aria-hidden="true" />
                            </Flex>
                            <Box flex="1" minW={0}>
                              <Text fontSize="sm" fontWeight="medium" truncate>
                                {player.name}
                              </Text>
                              <Text
                                fontSize="xs"
                                color={isAssigned ? 'orange.600' : 'fg.muted'}
                                truncate
                              >
                                {statusText}
                              </Text>
                            </Box>
                          </Flex>
                        </Box>
                      );
                    })
                  )}
                </VStack>
              </Box>

              <Box borderTopWidth="1px" borderColor="border" pt={4}>
                {!isCreatePlayerOpen ? (
                  <Button
                    type="button"
                    variant="outline"
                    leftIcon={<Plus size={16} aria-hidden="true" />}
                    onClick={() => setIsCreatePlayerOpen(true)}
                    disabled={isRosterFull || isSubmitting}
                  >
                    {t('panels.teams.quickCreatePlayer')}
                  </Button>
                ) : (
                  <Field.Root>
                    <Field.Label htmlFor="team-new-player-name">
                      {t('panels.teams.newPlayerNameLabel')}
                    </Field.Label>
                    <Flex gap={2} align="flex-start">
                      <Input
                        id="team-new-player-name"
                        name="newPlayerName"
                        autoComplete="off"
                        placeholder={t('panels.teams.newPlayerNamePlaceholder')}
                        value={newPlayerName}
                        disabled={isCreatingMember || isSubmitting}
                        onChange={(event) => {
                          setNewPlayerName(event.target.value);
                          setEditError('');
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            handleCreateMember();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={handleCreateMember}
                        loading={isCreatingMember}
                        disabled={
                          !newPlayerName.trim() || isRosterFull || isSubmitting
                        }
                        flexShrink={0}
                      >
                        {t('panels.teams.createAndAdd')}
                      </Button>
                    </Flex>
                  </Field.Root>
                )}
              </Box>

              {hasRosterConflict ? (
                <Flex gap={2} align="flex-start" color="red.600" role="alert">
                  <AlertCircle size={16} aria-hidden="true" />
                  <Text fontSize="sm" flex="1">
                    {t('panels.teams.rosterConflictHelp')}
                  </Text>
                </Flex>
              ) : null}

              {editError ? (
                <Text fontSize="sm" color="red.600" role="alert">
                  {editError}
                </Text>
              ) : null}

              {memberIds.length < teamSize ? (
                <Text fontSize="xs" color="orange.600" aria-live="polite">
                  {t('panels.teams.draftTeamWarning')}
                </Text>
              ) : null}
            </>
          )}
        </VStack>
      </VModal>

      {/* Delete Team Confirmation Modal */}
      <VModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.onClose}
        title={tc('deleteTitle')}
        primaryActionText={t('panels.teams.delete')}
        onPrimaryAction={handleDelete}
        isPrimaryLoading={isSubmitting}
        primaryColorScheme="red"
        secondaryActionText={t('panels.teams.cancel')}
      >
        <Text fontSize="sm" color="gray.600">
          {tc('deleteConfirm')}
        </Text>
        {deletingReg && (
          <Text fontSize="sm" fontWeight="semibold" mt={2}>
            &quot;{getRegistrationName(deletingReg)}&quot;
          </Text>
        )}
      </VModal>
    </>
  );
}
