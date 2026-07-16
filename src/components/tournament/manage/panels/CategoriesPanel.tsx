'use client';

import { useState } from 'react';
import { toaster } from '@/components/ui/toaster';
import { Box, Field, Flex, Heading, Text } from '@chakra-ui/react';
import { Button, VStack } from '@/components/ui/chakra-compat';
import { Input } from '@/components/ui/Input';
import { Layers, Plus, Pencil, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Category,
  CategoryRegistrationMode,
  CategoryType,
  SportType,
} from '@/lib/api/types';
import { CategoryService } from '@/lib/api/category.service';
import { VModal, useModal } from '@/components/ui/VModal';
import { getTournamentSportProfile } from '@/lib/tournament/sports';
import TournamentManageEmptyState from './TournamentManageEmptyState';

interface CategoriesPanelProps {
  tournamentId: string;
  sportType?: SportType | null;
  categories: Category[];
  onCategoriesChange: () => void;
}

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

type CategoryFieldErrors = Partial<{
  name: string;
  teamSize: string;
}>;

export default function CategoriesPanel({
  tournamentId,
  sportType,
  categories,
  onCategoriesChange,
}: CategoriesPanelProps) {
  const t = useTranslations('pages.tournaments.detail.manage');

  const createModal = useModal();
  const editModal = useModal();
  const deleteModal = useModal();

  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>(CategoryType.CUSTOM);
  const [registrationMode, setRegistrationMode] =
    useState<CategoryRegistrationMode>(CategoryRegistrationMode.TEAM);
  const [teamSize, setTeamSize] = useState(2);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateErrors, setShowCreateErrors] = useState(false);
  const [showEditErrors, setShowEditErrors] = useState(false);

  const getFieldErrors = (ignoredCategoryId?: string): CategoryFieldErrors => {
    const errors: CategoryFieldErrors = {};
    const normalizedName = name.trim().toLocaleLowerCase();

    if (!normalizedName) {
      errors.name = t('panels.categories.validation.nameRequired');
    } else if (
      categories.some(
        (category) =>
          category.id !== ignoredCategoryId &&
          category.name.trim().toLocaleLowerCase() === normalizedName
      )
    ) {
      errors.name = t('panels.categories.validation.nameDuplicate');
    }

    if (
      registrationMode === CategoryRegistrationMode.TEAM &&
      (!Number.isInteger(teamSize) || teamSize < 2)
    ) {
      errors.teamSize = t('panels.categories.validation.teamSizeMin');
    }

    return errors;
  };

  const createErrors = getFieldErrors();
  const editErrors = getFieldErrors(editingCategory?.id);

  // ── Create ──────────────────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setName('');
    setType(CategoryType.CUSTOM);
    setRegistrationMode(CategoryRegistrationMode.TEAM);
    setTeamSize(2);
    setShowCreateErrors(false);
    createModal.onOpen();
  };

  const handleCreate = async () => {
    if (Object.keys(createErrors).length > 0) {
      setShowCreateErrors(true);
      return;
    }
    try {
      setIsSubmitting(true);
      const defaultScoring =
        sportType === SportType.PICKLEBALL
          ? getTournamentSportProfile(sportType).defaultScoring
          : null;
      await CategoryService.createCategory(tournamentId, {
        name: name.trim(),
        type,
        registrationMode,
        teamSize,
        ...(defaultScoring && {
          matchFormat: defaultScoring.matchFormat,
          pointsToWin: defaultScoring.pointsToWin,
          winByTwo: defaultScoring.winByTwo,
          pointCap: defaultScoring.pointCap,
        }),
      });
      onCategoriesChange();
      createModal.onClose();
    } catch (error) {
      console.error('Error creating category:', error);
      toaster.error({
        title: t('panels.categories.createFailed'),
        description:
          error instanceof Error
            ? error.message
            : t('panels.categories.unknownError'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Edit ────────────────────────────────────────────────────────────────────
  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setType(cat.type);
    setRegistrationMode(cat.registrationMode);
    setTeamSize(cat.teamSize);
    setShowEditErrors(false);
    editModal.onOpen();
  };

  const handleEdit = async () => {
    if (!editingCategory) return;
    if (Object.keys(editErrors).length > 0) {
      setShowEditErrors(true);
      return;
    }
    // Skip if no actual change
    if (
      editingCategory.name === name.trim() &&
      editingCategory.type === type &&
      editingCategory.registrationMode === registrationMode &&
      editingCategory.teamSize === teamSize
    ) {
      editModal.onClose();
      return;
    }
    try {
      setIsSubmitting(true);
      await CategoryService.updateCategory(editingCategory.id, {
        name: name.trim(),
        type,
        registrationMode,
        teamSize,
      });
      onCategoriesChange();
      editModal.onClose();
    } catch (error) {
      console.error('Error updating category:', error);
      toaster.error({
        title: t('panels.categories.updateFailed'),
        description:
          error instanceof Error
            ? error.message
            : t('panels.categories.unknownError'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleOpenDelete = (cat: Category) => {
    setDeletingCategory(cat);
    deleteModal.onOpen();
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    try {
      setIsSubmitting(true);
      await CategoryService.deleteCategory(deletingCategory.id);
      onCategoriesChange();
      deleteModal.onClose();
    } catch (error) {
      console.error('Error deleting category:', error);
      toaster.error({
        title: t('panels.categories.deleteFailed'),
        description:
          error instanceof Error
            ? error.message
            : t('panels.categories.unknownError'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <VStack gap={4} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Heading size="md">{t('panels.categories.title')}</Heading>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Plus size={14} />}
            onClick={handleOpenCreate}
          >
            {t('panels.categories.addCategory')}
          </Button>
        </Flex>

        {/* Category list */}
        {categories.length === 0 ? (
          <TournamentManageEmptyState
            icon={<Layers size={24} />}
            title={t('panels.categories.emptyTitle')}
            description={t('panels.categories.emptyDescription')}
            actionLabel={t('panels.categories.addCategory')}
            onAction={handleOpenCreate}
          />
        ) : (
          <VStack gap={0} align="stretch">
            {categories.map((cat, idx) => (
              <Flex
                key={cat.id}
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
                <Box
                  w="10px"
                  h="10px"
                  borderRadius="full"
                  bg={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}
                  flexShrink={0}
                />
                <Text flex="1" fontSize="sm" fontWeight="medium">
                  {cat.name}
                </Text>
                <Text
                  fontSize="xs"
                  color="gray.500"
                  _dark={{ color: 'gray.400' }}
                >
                  {cat.registrationMode === CategoryRegistrationMode.TEAM
                    ? t('panels.categories.teamSizeSummary', {
                        count: cat.teamSize,
                      })
                    : t('panels.categories.individual')}
                </Text>
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
                    onClick={() => handleOpenEdit(cat)}
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
                    onClick={() => handleOpenDelete(cat)}
                  >
                    <Trash2 size={16} />
                  </Box>
                </Flex>
              </Flex>
            ))}
          </VStack>
        )}
      </VStack>

      {/* Create Modal */}
      <VModal
        isOpen={createModal.isOpen}
        onClose={createModal.onClose}
        title={t('panels.categories.createCategory')}
        primaryActionText={t('panels.categories.save')}
        onPrimaryAction={handleCreate}
        isPrimaryLoading={isSubmitting}
        secondaryActionText={t('panels.categories.cancel')}
      >
        <CategoryFields
          name={name}
          type={type}
          registrationMode={registrationMode}
          teamSize={teamSize}
          onNameChange={setName}
          onTypeChange={setType}
          onRegistrationModeChange={setRegistrationMode}
          onTeamSizeChange={setTeamSize}
          errors={showCreateErrors ? createErrors : {}}
        />
      </VModal>

      {/* Edit Modal */}
      <VModal
        isOpen={editModal.isOpen}
        onClose={editModal.onClose}
        title={t('panels.categories.editCategory')}
        primaryActionText={t('panels.categories.save')}
        onPrimaryAction={handleEdit}
        isPrimaryLoading={isSubmitting}
        secondaryActionText={t('panels.categories.cancel')}
      >
        <CategoryFields
          name={name}
          type={type}
          registrationMode={registrationMode}
          teamSize={teamSize}
          onNameChange={setName}
          onTypeChange={setType}
          onRegistrationModeChange={setRegistrationMode}
          onTeamSizeChange={setTeamSize}
          errors={showEditErrors ? editErrors : {}}
        />
      </VModal>

      {/* Delete Confirmation Modal */}
      <VModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.onClose}
        title={t('panels.categories.deleteCategory')}
        primaryActionText={t('panels.categories.delete')}
        onPrimaryAction={handleDelete}
        isPrimaryLoading={isSubmitting}
        primaryColorScheme="red"
        secondaryActionText={t('panels.categories.cancel')}
      >
        <Text fontSize="sm" color="gray.600">
          {t('panels.categories.deleteConfirm')}
        </Text>
        {deletingCategory && (
          <Text fontSize="sm" fontWeight="semibold" mt={2}>
            "{deletingCategory.name}"
          </Text>
        )}
      </VModal>
    </>
  );
}

function CategoryFields({
  name,
  type,
  registrationMode,
  teamSize,
  onNameChange,
  onTypeChange,
  onRegistrationModeChange,
  onTeamSizeChange,
  errors,
}: {
  name: string;
  type: CategoryType;
  registrationMode: CategoryRegistrationMode;
  teamSize: number;
  onNameChange: (value: string) => void;
  onTypeChange: (value: CategoryType) => void;
  onRegistrationModeChange: (value: CategoryRegistrationMode) => void;
  onTeamSizeChange: (value: number) => void;
  errors: CategoryFieldErrors;
}) {
  const t = useTranslations(
    'pages.tournaments.detail.manage.panels.categories'
  );
  const isCustom = type === CategoryType.CUSTOM;
  const handleTypeChange = (nextType: CategoryType) => {
    onTypeChange(nextType);
    if (
      nextType === CategoryType.MENS_SINGLE ||
      nextType === CategoryType.WOMENS_SINGLE
    ) {
      onRegistrationModeChange(CategoryRegistrationMode.INDIVIDUAL);
      onTeamSizeChange(1);
    } else if (nextType !== CategoryType.CUSTOM) {
      onRegistrationModeChange(CategoryRegistrationMode.TEAM);
      onTeamSizeChange(2);
    }
  };
  const handleRegistrationModeChange = (nextMode: CategoryRegistrationMode) => {
    onRegistrationModeChange(nextMode);
    onTeamSizeChange(nextMode === CategoryRegistrationMode.INDIVIDUAL ? 1 : 2);
  };
  const handleTeamSizeChange = (nextValue: string) => {
    const nextTeamSize = Number(nextValue);
    onTeamSizeChange(Number.isFinite(nextTeamSize) ? nextTeamSize : 0);
  };

  return (
    <VStack gap={4} align="stretch">
      <Field.Root invalid={!!errors.name} required>
        <Field.Label>
          {t('nameLabel')} <Field.RequiredIndicator />
        </Field.Label>
        <Input
          name="categoryName"
          autoComplete="off"
          placeholder={t('namePlaceholder')}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
        />
        <Field.ErrorText>{errors.name}</Field.ErrorText>
      </Field.Root>

      <Field.Root required>
        <Field.Label>
          {t('typeLabel')} <Field.RequiredIndicator />
        </Field.Label>
        <select
          name="categoryType"
          value={type}
          onChange={(event) =>
            handleTypeChange(event.target.value as CategoryType)
          }
          style={{
            width: '100%',
            border: '1px solid #E2E8F0',
            borderRadius: 6,
            padding: 8,
            minHeight: 40,
            background: 'transparent',
          }}
        >
          <option value={CategoryType.MENS_SINGLE}>
            {t('types.mensSingle')}
          </option>
          <option value={CategoryType.WOMENS_SINGLE}>
            {t('types.womensSingle')}
          </option>
          <option value={CategoryType.MENS_DOUBLE}>
            {t('types.mensDouble')}
          </option>
          <option value={CategoryType.WOMENS_DOUBLE}>
            {t('types.womensDouble')}
          </option>
          <option value={CategoryType.MIXED_DOUBLE}>
            {t('types.mixedDouble')}
          </option>
          <option value={CategoryType.CUSTOM}>{t('types.custom')}</option>
        </select>
      </Field.Root>

      {isCustom && (
        <>
          <Field.Root required>
            <Field.Label>
              {t('registrationModeLabel')} <Field.RequiredIndicator />
            </Field.Label>
            <select
              name="categoryRegistrationMode"
              value={registrationMode}
              onChange={(event) =>
                handleRegistrationModeChange(
                  event.target.value as CategoryRegistrationMode
                )
              }
              style={{
                width: '100%',
                border: '1px solid #E2E8F0',
                borderRadius: 6,
                padding: 8,
                minHeight: 40,
                background: 'transparent',
              }}
            >
              <option value={CategoryRegistrationMode.INDIVIDUAL}>
                {t('individual')}
              </option>
              <option value={CategoryRegistrationMode.TEAM}>{t('team')}</option>
            </select>
          </Field.Root>

          {registrationMode === CategoryRegistrationMode.TEAM && (
            <Field.Root invalid={!!errors.teamSize} required>
              <Field.Label>
                {t('teamSizeLabel')} <Field.RequiredIndicator />
              </Field.Label>
              <Input
                type="number"
                name="categoryTeamSize"
                inputMode="numeric"
                autoComplete="off"
                min={2}
                step={1}
                value={teamSize || ''}
                onChange={(event) => handleTeamSizeChange(event.target.value)}
                placeholder={t('teamSizePlaceholder')}
              />
              <Field.HelperText>{t('teamSizeHelp')}</Field.HelperText>
              <Field.ErrorText>{errors.teamSize}</Field.ErrorText>
            </Field.Root>
          )}
        </>
      )}
    </VStack>
  );
}
