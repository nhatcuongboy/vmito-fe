'use client';

import { Box, Text, VStack, HStack, Flex } from '@chakra-ui/react';
import { IconButton } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import { useState, ChangeEvent } from 'react';
import { Button } from '@/components/ui/chakra-compat';
import { Input } from '@/components/ui/Input';
import { VModal } from '@/components/ui/VModal';
import { ISessionExpense } from '@/lib/api/types';
import { FeeService } from '@/lib/api/fee.service';
import { Plus, Pencil, Trash2, ReceiptText } from 'lucide-react';

interface SessionExpenseSectionProps {
  sessionId: string;
  expenses: ISessionExpense[];
  onAdd: (name: string, amount: number) => Promise<void>;
  onUpdate: (expenseId: string, name: string, amount: number) => Promise<void>;
  onDelete: (expenseId: string) => Promise<void>;
  isLoading?: boolean;
}

const formatAmountDisplay = (raw: string): string => {
  const stripped = raw.replace(/[^\d]/g, '');
  if (!stripped) return '';
  const num = parseInt(stripped, 10);
  if (isNaN(num)) return raw;
  return num.toLocaleString('vi-VN');
};

const parseAmountInput = (input: string): string => {
  return input.replace(/[^\d]/g, '');
};

interface DraftRow {
  name: string;
  amount: string;
}

export default function SessionExpenseSection({
  expenses,
  onAdd,
  onUpdate,
  onDelete,
  isLoading = false,
}: SessionExpenseSectionProps) {
  const t = useTranslations('payment');
  const tCommon = useTranslations('common');

  // Edit mode: expenseId → { name, amount }
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');

  // Add mode: array of draft rows
  const [isAdding, setIsAdding] = useState(false);
  const [draftRows, setDraftRows] = useState<DraftRow[]>([]);

  // Per-item loading
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSavingDrafts, setIsSavingDrafts] = useState(false);

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] =
    useState<ISessionExpense | null>(null);

  const handleStartEdit = (expense: ISessionExpense) => {
    setEditingId(expense.id);
    setEditName(expense.name);
    setEditAmount(String(expense.amount));
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditAmount('');
  };

  const handleSaveEdit = async (expenseId: string) => {
    const amount = parseInt(editAmount, 10);
    if (!editName.trim() || isNaN(amount) || amount < 0) return;

    setSavingId(expenseId);
    try {
      await onUpdate(expenseId, editName.trim(), amount);
      setEditingId(null);
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteClick = (expense: ISessionExpense) => {
    setExpenseToDelete(expense);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!expenseToDelete) return;

    setDeletingId(expenseToDelete.id);
    try {
      await onDelete(expenseToDelete.id);
      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setExpenseToDelete(null);
  };

  const handleOpenAdd = () => {
    setDraftRows([{ name: '', amount: '' }]);
    setIsAdding(true);
  };

  const handleAddDraftRow = () => {
    setDraftRows((prev) => [...prev, { name: '', amount: '' }]);
  };

  const handleRemoveDraftRow = (index: number) => {
    setDraftRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDraftChange = (
    index: number,
    field: 'name' | 'amount',
    value: string
  ) => {
    setDraftRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const handleSaveDrafts = async () => {
    const validRows = draftRows.filter((row) => {
      const amount = parseInt(row.amount, 10);
      return row.name.trim() && !isNaN(amount) && amount >= 0;
    });
    if (validRows.length === 0) return;

    setIsSavingDrafts(true);
    try {
      for (const row of validRows) {
        await onAdd(row.name.trim(), parseInt(row.amount, 10));
      }
      setIsAdding(false);
      setDraftRows([]);
    } finally {
      setIsSavingDrafts(false);
    }
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setDraftRows([]);
  };

  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="xl"
      p={{ base: 4, md: 5 }}
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
    >
      {/* Header */}
      <Flex
        justify="space-between"
        align="center"
        mb={4}
        gap={3}
        flexWrap="wrap"
      >
        <Text fontWeight="semibold" fontSize="md">
          {t('expenses')}
        </Text>
        {!isAdding && (
          <Button
            size="sm"
            variant="outline"
            colorPalette="green"
            onClick={handleOpenAdd}
            disabled={isLoading}
            flexShrink={0}
          >
            <Plus size={16} />
            <Text ml={1.5}>{t('addExpense')}</Text>
          </Button>
        )}
      </Flex>

      <VStack gap={3} align="stretch">
        {/* Existing expenses */}
        {expenses.length === 0 && !isAdding && (
          <Box
            py={8}
            px={4}
            borderRadius="xl"
            bg="gray.50"
            border="1px dashed"
            borderColor="gray.200"
            textAlign="center"
            _dark={{ bg: 'gray.900', borderColor: 'gray.700' }}
          >
            <Box
              color="gray.400"
              mb={3}
              display="inline-flex"
              p={3}
              borderRadius="full"
              bg="gray.100"
              _dark={{ bg: 'gray.800' }}
            >
              <ReceiptText size={28} />
            </Box>
            <Text fontSize="sm" color="gray.500" fontWeight="medium">
              {t('noExpenses')}
            </Text>
          </Box>
        )}

        {expenses.map((expense) =>
          editingId === expense.id ? (
            // Edit row
            <Box
              key={expense.id}
              p={{ base: 3, md: 4 }}
              border="1px solid"
              borderColor="green.200"
              borderRadius="xl"
              bg="green.50"
              _dark={{ bg: 'green.950', borderColor: 'green.800' }}
            >
              <VStack gap={3} align="stretch">
                <Flex gap={2} align="flex-start">
                  <Input
                    size="md"
                    placeholder={t('expenseName')}
                    value={editName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setEditName(e.target.value)
                    }
                    flex={1}
                    disabled={savingId === expense.id}
                    bg="white"
                    _dark={{ bg: 'gray.800' }}
                    borderRadius="lg"
                  />
                  <Input
                    size="md"
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={formatAmountDisplay(editAmount)}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setEditAmount(parseAmountInput(e.target.value))
                    }
                    w={{ base: '120px', md: '180px' }}
                    disabled={savingId === expense.id}
                    bg="white"
                    _dark={{ bg: 'gray.800' }}
                    borderRadius="lg"
                    flexShrink={0}
                  />
                </Flex>
                <HStack gap={2} justify="flex-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={savingId === expense.id}
                  >
                    {t('cancel')}
                  </Button>
                  <Button
                    size="sm"
                    colorPalette="green"
                    onClick={() => handleSaveEdit(expense.id)}
                    loading={savingId === expense.id}
                    disabled={
                      !editName.trim() ||
                      !editAmount ||
                      isNaN(parseInt(editAmount, 10))
                    }
                  >
                    {t('save')}
                  </Button>
                </HStack>
              </VStack>
            </Box>
          ) : (
            // Display row
            <Box
              key={expense.id}
              p={{ base: 3, md: 4 }}
              border="1px solid"
              borderColor="gray.100"
              borderRadius="xl"
              bg="gray.50"
              _dark={{ bg: 'gray.900', borderColor: 'gray.700' }}
              transition="all 0.2s"
              _hover={{
                borderColor: 'gray.200',
                boxShadow: 'sm',
                _dark: { borderColor: 'gray.600' },
              }}
            >
              <Flex align="center" justify="space-between" gap={3}>
                <HStack gap={2.5} flex={1} minW={0}>
                  <Box
                    color="red.500"
                    bg="red.50"
                    borderRadius="lg"
                    p={2}
                    display="flex"
                    flexShrink={0}
                    _dark={{ bg: 'red.950' }}
                  >
                    <ReceiptText size={18} />
                  </Box>
                  <Text
                    fontSize="sm"
                    fontWeight="medium"
                    lineClamp={1}
                    flex={1}
                  >
                    {expense.name}
                  </Text>
                </HStack>
                <Flex align="center" gap={2} flexShrink={0}>
                  <Text fontSize="md" fontWeight="bold" color="red.600">
                    {FeeService.formatFeeExact(expense.amount)}
                  </Text>
                  <HStack gap={1}>
                    <IconButton
                      size="sm"
                      aria-label={t('editExpense')}
                      variant="ghost"
                      colorPalette="gray"
                      bg="gray.100"
                      _dark={{ bg: 'gray.800' }}
                      _hover={{
                        bg: 'gray.200',
                        _dark: { bg: 'gray.700' },
                      }}
                      borderRadius="full"
                      boxShadow="sm"
                      onClick={() => handleStartEdit(expense)}
                      disabled={
                        isLoading ||
                        deletingId === expense.id ||
                        editingId !== null
                      }
                    >
                      <Pencil size={14} />
                    </IconButton>
                    <IconButton
                      size="sm"
                      aria-label={t('deleteExpense')}
                      variant="ghost"
                      colorPalette="red"
                      bg="red.50"
                      _dark={{ bg: 'red.950' }}
                      _hover={{
                        bg: 'red.100',
                        _dark: { bg: 'red.900' },
                      }}
                      borderRadius="full"
                      boxShadow="sm"
                      onClick={() => handleDeleteClick(expense)}
                      loading={deletingId === expense.id}
                      disabled={isLoading || editingId !== null}
                    >
                      <Trash2 size={14} />
                    </IconButton>
                  </HStack>
                </Flex>
              </Flex>
            </Box>
          )
        )}

        {/* Add draft rows */}
        {isAdding && (
          <Box
            bg="green.50"
            borderRadius="xl"
            p={{ base: 3, md: 4 }}
            border="1px dashed"
            borderColor="green.300"
            _dark={{ bg: 'green.950', borderColor: 'green.700' }}
          >
            <VStack gap={3} align="stretch">
              {draftRows.map((row, idx) => (
                <Flex key={idx} gap={2} align="flex-start">
                  <Input
                    size="md"
                    placeholder={t('expenseNamePlaceholder')}
                    value={row.name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      handleDraftChange(idx, 'name', e.target.value)
                    }
                    flex={1}
                    disabled={isSavingDrafts}
                    bg="white"
                    _dark={{ bg: 'gray.800' }}
                    borderRadius="lg"
                  />
                  <Input
                    size="md"
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={formatAmountDisplay(row.amount)}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      handleDraftChange(
                        idx,
                        'amount',
                        parseAmountInput(e.target.value)
                      )
                    }
                    w={{ base: '120px', md: '180px' }}
                    disabled={isSavingDrafts}
                    bg="white"
                    _dark={{ bg: 'gray.800' }}
                    borderRadius="lg"
                    flexShrink={0}
                  />
                  {draftRows.length > 1 && (
                    <IconButton
                      size="md"
                      aria-label="Remove row"
                      variant="ghost"
                      colorPalette="red"
                      onClick={() => handleRemoveDraftRow(idx)}
                      disabled={isSavingDrafts}
                      flexShrink={0}
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  )}
                </Flex>
              ))}

              <Flex
                justify="space-between"
                align="center"
                gap={3}
                mt={2}
                pt={3}
                borderTop="1px solid"
                borderColor="green.200"
                _dark={{ borderColor: 'green.800' }}
                flexWrap="wrap"
              >
                <Button
                  size="sm"
                  variant="ghost"
                  colorPalette="gray"
                  onClick={handleAddDraftRow}
                  disabled={isSavingDrafts}
                >
                  <Plus size={14} />
                  <Text ml={1}>{t('addExpense')}</Text>
                </Button>
                <HStack gap={2}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelAdd}
                    disabled={isSavingDrafts}
                  >
                    {t('cancel')}
                  </Button>
                  <Button
                    size="sm"
                    colorPalette="green"
                    onClick={handleSaveDrafts}
                    loading={isSavingDrafts}
                    disabled={draftRows.every(
                      (r) => !r.name.trim() || !r.amount
                    )}
                  >
                    {t('save')}
                  </Button>
                </HStack>
              </Flex>
            </VStack>
          </Box>
        )}
      </VStack>

      {/* Delete Confirmation Dialog */}
      <VModal
        isOpen={deleteDialogOpen}
        onClose={handleCancelDelete}
        title={t('deleteExpenseConfirmTitle')}
        size="sm"
        footer={
          <HStack gap={2} justify="flex-end" w="full">
            <Button variant="outline" onClick={handleCancelDelete}>
              {tCommon('cancel')}
            </Button>
            <Button
              colorPalette="red"
              onClick={handleConfirmDelete}
              loading={deletingId === expenseToDelete?.id}
            >
              {tCommon('delete')}
            </Button>
          </HStack>
        }
      >
        <VStack gap={3} align="stretch">
          <Text fontSize="sm" color="fg.muted">
            {t('deleteExpenseConfirmMessage')}
          </Text>
          {expenseToDelete && (
            <Box
              p={3}
              bg="gray.50"
              borderRadius="lg"
              border="1px solid"
              borderColor="gray.200"
              _dark={{ bg: 'gray.900', borderColor: 'gray.700' }}
            >
              <HStack gap={2.5}>
                <Box
                  color="red.500"
                  bg="red.50"
                  borderRadius="md"
                  p={1.5}
                  display="flex"
                  _dark={{ bg: 'red.950' }}
                >
                  <ReceiptText size={16} />
                </Box>
                <VStack gap={0.5} align="flex-start" flex={1}>
                  <Text fontSize="sm" fontWeight="medium">
                    {expenseToDelete.name}
                  </Text>
                  <Text fontSize="sm" fontWeight="bold" color="red.600">
                    {FeeService.formatFeeExact(expenseToDelete.amount)}
                  </Text>
                </VStack>
              </HStack>
            </Box>
          )}
        </VStack>
      </VModal>
    </Box>
  );
}
