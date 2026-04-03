'use client';

import { useState, useEffect, useCallback } from 'react';
import { toaster } from '@/components/ui/toaster';
import {
  Box,
  Flex,
  Heading,
  Text,
  Spinner,
  Input,
  Textarea,
} from '@chakra-ui/react';
import { Button, VStack } from '@/components/ui/chakra-compat';
import { Plus, Pencil, Trash2, Users, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Category, CategoryRegistration } from '@/lib/api/types';
import { CategoryService } from '@/lib/api/category.service';
import { TournamentPlayerService } from '@/lib/api/tournament-player.service';
import { VModal, useModal } from '@/components/ui/VModal';

interface TeamsPanelProps {
  categories: Category[];
  selectedCategory: Category | null;
  onSelectCategory: (category: Category) => void;
}

type TAddMode = 'single' | 'multiple';

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

  // Category dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Add modal
  const addModal = useModal();
  const [addMode, setAddMode] = useState<TAddMode>('single');
  const [addName, setAddName] = useState('');
  const [addMultiText, setAddMultiText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit modal
  const editModal = useModal();
  const [editingReg, setEditingReg] = useState<CategoryRegistration | null>(
    null
  );
  const [editName, setEditName] = useState('');

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
    }
  }, [activeCategory?.id, loadRegistrations]);

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
    addModal.onOpen();
  };

  const handleAdd = async () => {
    if (!activeCategory) return;
    const tournamentId = activeCategory.tournamentId;
    try {
      setIsSubmitting(true);
      if (addMode === 'single') {
        if (!addName.trim()) return;
        const player = await TournamentPlayerService.createPlayer(
          tournamentId,
          {
            name: addName.trim(),
          }
        );
        await CategoryService.createRegistration(activeCategory.id, {
          tournamentPlayerId: player.id,
        });
      } else {
        const lines = addMultiText
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);
        for (const line of lines) {
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
        if (lines.length > 0) {
          toaster.success({
            title: `Added ${lines.length} teams successfully`,
          });
        }
      }
      await loadRegistrations(activeCategory.id);
      addModal.onClose();
    } catch (error) {
      console.error('Error adding team(s):', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Edit Team ────────────────────────────────────────────────────────────────
  const handleOpenEdit = (reg: CategoryRegistration) => {
    setEditingReg(reg);
    setEditName(getRegName(reg));
    editModal.onOpen();
  };

  const handleEdit = async () => {
    if (!editingReg || !editName.trim()) return;
    const playerId = editingReg.player?.id ?? editingReg.tournamentPlayerId;
    if (!playerId) return;
    try {
      setIsSubmitting(true);
      await TournamentPlayerService.updatePlayer(playerId, {
        name: editName.trim(),
      });
      if (activeCategory) {
        await loadRegistrations(activeCategory.id);
      }
      editModal.onClose();
    } catch (error) {
      console.error('Error editing team:', error);
    } finally {
      setIsSubmitting(false);
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
          <Flex justify="center" py={8}>
            <Spinner />
          </Flex>
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
                >
                  <Flex
                    w="32px"
                    h="32px"
                    bg="gray.100"
                    borderRadius="full"
                    align="center"
                    justify="center"
                    flexShrink={0}
                  >
                    <Users size={16} color="#A0AEC0" />
                  </Flex>
                  <Text flex="1" fontSize="sm" fontWeight="medium">
                    {name}
                  </Text>
                  <Flex gap={1}>
                    <Box
                      as="button"
                      p={1.5}
                      borderRadius="md"
                      color="gray.400"
                      _hover={{ bg: 'gray.100', color: 'gray.600' }}
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
                      onClick={() => handleOpenDelete(reg)}
                    >
                      <Trash2 size={16} />
                    </Box>
                  </Flex>
                </Flex>
              );
            })}
            <Text fontSize="xs" color="gray.400" textAlign="center" pt={3}>
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
          <Flex bg="gray.100" borderRadius="full" p={1}>
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
                boxShadow={addMode === mode ? 'sm' : 'none'}
                transition="all 0.2s"
                onClick={() => setAddMode(mode)}
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
              }}
            />
          ) : (
            <Textarea
              placeholder={t('panels.teams.multiPlaceholder')}
              value={addMultiText}
              onChange={(e) => setAddMultiText(e.target.value)}
              rows={6}
              resize="vertical"
            />
          )}
        </VStack>
      </VModal>

      {/* Edit Team Modal */}
      <VModal
        isOpen={editModal.isOpen}
        onClose={editModal.onClose}
        title={t('panels.teams.editTeam')}
        primaryActionText={t('panels.teams.save')}
        onPrimaryAction={handleEdit}
        isPrimaryLoading={isSubmitting}
        isPrimaryDisabled={!editName.trim()}
        secondaryActionText={t('panels.teams.cancel')}
      >
        <Input
          placeholder={t('panels.teams.namePlaceholder')}
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleEdit();
          }}
        />
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
