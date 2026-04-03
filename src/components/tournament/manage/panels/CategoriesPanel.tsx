'use client';

import { useState } from 'react';
import { Box, Flex, Heading, Text, Input } from '@chakra-ui/react';
import { Button, VStack } from '@/components/ui/chakra-compat';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Category } from '@/lib/api/types';
import { CategoryService } from '@/lib/api/category.service';
import { VModal, useModal } from '@/components/ui/VModal';

interface CategoriesPanelProps {
  tournamentId: string;
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

export default function CategoriesPanel({
  tournamentId,
  categories,
  onCategoriesChange,
}: CategoriesPanelProps) {
  const t = useTranslations('pages.tournaments.detail.manage');

  const createModal = useModal();
  const editModal = useModal();
  const deleteModal = useModal();

  const [name, setName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Create ──────────────────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setName('');
    createModal.onOpen();
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      setIsSubmitting(true);
      await CategoryService.createCategory(tournamentId, {
        name: name.trim(),
        type: 'CUSTOM',
      });
      onCategoriesChange();
      createModal.onClose();
    } catch (error) {
      console.error('Error creating category:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Edit ────────────────────────────────────────────────────────────────────
  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    editModal.onOpen();
  };

  const handleEdit = async () => {
    if (!editingCategory || !name.trim()) return;
    try {
      setIsSubmitting(true);
      await CategoryService.updateCategory(editingCategory.id, {
        name: name.trim(),
      });
      onCategoriesChange();
      editModal.onClose();
    } catch (error) {
      console.error('Error updating category:', error);
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
              <Flex gap={1}>
                <Box
                  as="button"
                  p={1.5}
                  borderRadius="md"
                  color="gray.400"
                  _hover={{ bg: 'gray.100', color: 'gray.600' }}
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
                  onClick={() => handleOpenDelete(cat)}
                >
                  <Trash2 size={16} />
                </Box>
              </Flex>
            </Flex>
          ))}
        </VStack>
      </VStack>

      {/* Create Modal */}
      <VModal
        isOpen={createModal.isOpen}
        onClose={createModal.onClose}
        title={t('panels.categories.createCategory')}
        primaryActionText={t('panels.categories.save')}
        onPrimaryAction={handleCreate}
        isPrimaryLoading={isSubmitting}
        isPrimaryDisabled={!name.trim()}
        secondaryActionText={t('panels.categories.cancel')}
      >
        <Input
          placeholder={t('panels.categories.namePlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCreate();
          }}
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
        isPrimaryDisabled={!name.trim()}
        secondaryActionText={t('panels.categories.cancel')}
      >
        <Input
          placeholder={t('panels.categories.namePlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleEdit();
          }}
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
