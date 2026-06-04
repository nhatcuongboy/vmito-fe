'use client';

import { useState, useEffect, useCallback } from 'react';
import { toaster } from '@/components/ui/toaster';
import { Box, Flex, Heading, Text, Input, Textarea } from '@chakra-ui/react';
import { Button, VStack } from '@/components/ui/chakra-compat';
import { Plus, Pencil, Trash2, Users, ChevronDown } from 'lucide-react';
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

interface TeamsPanelProps {
  categories: Category[];
  selectedCategory: Category | null;
  onSelectCategory: (category: Category) => void;
}

type TAddMode = 'single' | 'multiple';
type BulkProgress = {
  current: number;
  total: number;
  currentName: string;
};

type ApiErrorLike = {
  message?: string;
  response?: {
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

export default function TeamsPanel({
  categories,
  selectedCategory,
  onSelectCategory,
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<BulkProgress | null>(null);

  // Edit modal
  const editModal = useModal();
  const [editingReg, setEditingReg] = useState<CategoryRegistration | null>(
    null
  );
  const [editName, setEditName] = useState('');
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');

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
  const legacyPlaceholderIds = new Set(
    registrations
      .filter((registration) => !registration.pair)
      .map((registration) => registration.tournamentPlayerId)
      .filter((playerId): playerId is string => Boolean(playerId))
  );
  const availablePlayers = players.filter(
    (player) =>
      !legacyPlaceholderIds.has(player.id) || memberIds.includes(player.id)
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

  const getRegName = (reg: CategoryRegistration): string =>
    reg.player?.name ||
    reg.pair?.name ||
    reg.pair?.members?.map((m) => m.player?.name).join(' & ') ||
    'Unknown';

  // ── Add Teams ────────────────────────────────────────────────────────────────
  const handleOpenAdd = () => {
    setAddMode('single');
    setAddName('');
    setAddMultiText('');
    setBulkProgress(null);
    addModal.onOpen();
  };

  const handleAdd = async () => {
    if (!activeCategory) return;
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
          title: t('panels.teams.addSuccess'),
        });
      } else {
        const lines = parseBulkTeamNames(addMultiText);
        if (lines.length === 0) {
          toaster.error({
            title: t('panels.teams.enterAtLeastOne'),
          });
          return;
        }
        for (const [index, line] of lines.entries()) {
          setBulkProgress({
            current: index + 1,
            total: lines.length,
            currentName: line,
          });

          try {
            if (isTeamCategory) {
              const pair = await TournamentPairService.createPair(
                tournamentId,
                { name: line, playerIds: [], type: activeCategory.type }
              );
              await CategoryService.createRegistration(
                activeCategory.id,
                { tournamentPairId: pair.id },
                { showToast: false }
              );
            } else {
              const player = await TournamentPlayerService.createPlayer(
                tournamentId,
                { name: line },
                { showToast: false }
              );
              await CategoryService.createRegistration(
                activeCategory.id,
                { tournamentPlayerId: player.id },
                { showToast: false }
              );
            }
          } catch (error) {
            throw new Error(
              t('panels.teams.bulkAddItemFailed', {
                name: line,
                current: index + 1,
                total: lines.length,
                error: getErrorMessage(error, t('panels.teams.unknownError')),
              })
            );
          }
        }
        toaster.success({
          title: t('panels.teams.bulkAddSuccess', { count: lines.length }),
        });
      }
      await loadRegistrations(activeCategory.id);
      setAddName('');
      setAddMultiText('');
      addModal.onClose();
    } catch (error) {
      console.error('Error adding team(s):', error);
      toaster.error({
        title: t('panels.teams.addFailed'),
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
    setEditName(getRegName(reg));
    setMemberIds(reg.pair?.members?.map((member) => member.playerId) ?? []);
    setNewPlayerName('');
    editModal.onOpen();
  };

  const handleEdit = async () => {
    if (!editingReg || !editName.trim()) return;
    try {
      setIsSubmitting(true);
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
      toaster.error({
        title: t('panels.teams.updateFailed'),
        description:
          error instanceof Error
            ? error.message
            : t('panels.teams.unknownError'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateMember = async () => {
    if (!activeCategory || !newPlayerName.trim()) return;
    try {
      const player = await TournamentPlayerService.createPlayer(
        activeCategory.tournamentId,
        { name: newPlayerName.trim() },
        { showToast: false }
      );
      setPlayers((current) => [player, ...current]);
      setMemberIds((current) => [...current, player.id]);
      setNewPlayerName('');
    } catch (error) {
      toaster.error({
        title: t('panels.teams.addFailed'),
        description: getErrorMessage(error, t('panels.teams.unknownError')),
      });
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
        title: t('panels.teams.deleteFailed'),
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
            <Heading size="md">{t('panels.teams.title')}</Heading>
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

          <Button
            size="sm"
            variant="outline"
            leftIcon={<Plus size={14} />}
            onClick={handleOpenAdd}
          >
            {t('panels.teams.addTeams')}
          </Button>
        </Flex>

        {/* Registrations list */}
        {loading ? (
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
            <Text fontSize="sm">{t('panels.teams.noTeams')}</Text>
          </Flex>
        ) : (
          <VStack gap={0} align="stretch">
            {registrations.map((reg) => {
              const name = getRegName(reg);
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
                      p={1.5}
                      borderRadius="md"
                      color="gray.400"
                      _hover={{ bg: 'gray.100', color: 'gray.600' }}
                      _dark={{
                        color: 'gray.400',
                        _hover: { bg: 'gray.700', color: 'gray.200' },
                      }}
                      onClick={() => handleOpenEdit(reg)}
                    >
                      <Pencil size={16} />
                    </Box>
                    <Box
                      as="button"
                      p={1.5}
                      borderRadius="md"
                      color="gray.400"
                      _hover={{ bg: 'red.50', color: 'red.500' }}
                      _dark={{
                        color: 'gray.400',
                        _hover: { bg: 'red.900', color: 'red.200' },
                      }}
                      onClick={() => handleOpenDelete(reg)}
                    >
                      <Trash2 size={16} />
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
              {t('panels.teams.teamsCount', { count: registrations.length })}
            </Text>
          </VStack>
        )}
      </VStack>

      {/* Add Teams Modal */}
      <VModal
        isOpen={addModal.isOpen}
        onClose={addModal.onClose}
        title={t('panels.teams.addTeamsTitle')}
        primaryActionText={t('panels.teams.save')}
        onPrimaryAction={handleAdd}
        isPrimaryLoading={isSubmitting}
        isPrimaryDisabled={
          addMode === 'single' ? !addName.trim() : !addMultiText.trim()
        }
        secondaryActionText={t('panels.teams.cancel')}
      >
        <VStack gap={4} align="stretch">
          {/* Single / Multiple toggle */}
          <Flex
            bg="gray.100"
            borderRadius="full"
            p={1}
            _dark={{ bg: 'gray.700' }}
          >
            {(['single', 'multiple'] as TAddMode[]).map((mode) => (
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
                transition="all 0.2s"
                opacity={isSubmitting ? 0.6 : 1}
                onClick={() => {
                  if (isSubmitting) return;
                  setAddMode(mode);
                }}
              >
                {mode === 'single'
                  ? t('panels.teams.single')
                  : t('panels.teams.multiple')}
              </Box>
            ))}
          </Flex>

          {addMode === 'single' ? (
            <Input
              placeholder={t('panels.teams.namePlaceholder')}
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              disabled={isSubmitting}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
              }}
            />
          ) : (
            <VStack gap={2} align="stretch">
              <Textarea
                placeholder={t('panels.teams.multiPlaceholder')}
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
        onClose={editModal.onClose}
        title={
          isTeamCategory
            ? t('panels.teams.teamDetails')
            : t('panels.teams.editTeam')
        }
        primaryActionText={t('panels.teams.save')}
        onPrimaryAction={handleEdit}
        isPrimaryLoading={isSubmitting}
        isPrimaryDisabled={!editName.trim()}
        secondaryActionText={t('panels.teams.cancel')}
      >
        <VStack gap={4} align="stretch">
          <Input
            placeholder={t('panels.teams.namePlaceholder')}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          {isTeamCategory && (
            <>
              <Text
                fontSize="sm"
                color="gray.600"
                _dark={{ color: 'gray.300' }}
              >
                {t('panels.teams.members', {
                  current: memberIds.length,
                  total: activeCategory?.teamSize ?? 2,
                })}
              </Text>
              <VStack gap={2} align="stretch" maxH="220px" overflowY="auto">
                {availablePlayers.map((player) => {
                  const checked = memberIds.includes(player.id);
                  return (
                    <Flex
                      key={player.id}
                      align="center"
                      gap={3}
                      borderWidth="1px"
                      borderRadius="md"
                      px={3}
                      py={2}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={
                          !checked &&
                          memberIds.length >= (activeCategory?.teamSize ?? 2)
                        }
                        onChange={() =>
                          setMemberIds((current) =>
                            checked
                              ? current.filter((id) => id !== player.id)
                              : [...current, player.id]
                          )
                        }
                      />
                      <Text flex="1" fontSize="sm">
                        {player.name}
                      </Text>
                    </Flex>
                  );
                })}
              </VStack>
              <Flex gap={2}>
                <Input
                  placeholder={t('panels.teams.quickCreatePlayer')}
                  value={newPlayerName}
                  onChange={(event) => setNewPlayerName(event.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCreateMember}
                  disabled={
                    !newPlayerName.trim() ||
                    memberIds.length >= (activeCategory?.teamSize ?? 2)
                  }
                >
                  <Plus size={16} />
                </Button>
              </Flex>
              {memberIds.length < (activeCategory?.teamSize ?? 2) && (
                <Text fontSize="xs" color="orange.600">
                  {t('panels.teams.draftTeamWarning')}
                </Text>
              )}
            </>
          )}
        </VStack>
      </VModal>

      {/* Delete Team Confirmation Modal */}
      <VModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.onClose}
        title={t('panels.teams.deleteTeam')}
        primaryActionText={t('panels.teams.delete')}
        onPrimaryAction={handleDelete}
        isPrimaryLoading={isSubmitting}
        primaryColorScheme="red"
        secondaryActionText={t('panels.teams.cancel')}
      >
        <Text fontSize="sm" color="gray.600">
          {t('panels.teams.deleteConfirm')}
        </Text>
        {deletingReg && (
          <Text fontSize="sm" fontWeight="semibold" mt={2}>
            "{getRegName(deletingReg)}"
          </Text>
        )}
      </VModal>
    </>
  );
}
