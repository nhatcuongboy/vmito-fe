'use client';

import { Box, Text, VStack, HStack, Flex } from '@chakra-ui/react';
import { IconButton } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import { useState, ChangeEvent } from 'react';
import { Button } from '@/components/ui/chakra-compat';
import { Input } from '@/components/ui/Input';
import { ISessionExpense } from '@/lib/api/types';
import { FeeService } from '@/lib/api/fee.service';
import { Plus, Pencil, Trash2, Check, X, ReceiptText } from 'lucide-react';

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

  const handleDelete = async (expenseId: string) => {
    setDeletingId(expenseId);
    try {
      await onDelete(expenseId);
    } finally {
      setDeletingId(null);
    }
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

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="lg"
      p={4}
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
    >
      {/* Header */}
      <Flex justify="space-between" align="center" mb={3}>
        <HStack gap={2}>
          <Text fontWeight="semibold">{t('expenses')}</Text>
          {expenses.length > 0 && (
            <Text fontSize="sm" color="red.600" fontWeight="medium">
              ({FeeService.formatFeeExact(totalExpenses)})
            </Text>
          )}
        </HStack>
        {!isAdding && (
          <Button
            size="sm"
            variant="outline"
            colorPalette="gray"
            onClick={handleOpenAdd}
            disabled={isLoading}
          >
            <Plus size={14} />
            <Text ml={1}>{t('addExpense')}</Text>
          </Button>
        )}
      </Flex>

      <VStack gap={2.5} align="stretch">
        {/* Existing expenses */}
        {expenses.length === 0 && !isAdding && (
          <Box
            py={6}
            px={4}
            borderRadius="lg"
            bg="gray.50"
            border="1px dashed"
            borderColor="gray.200"
            textAlign="center"
            _dark={{ bg: 'gray.900', borderColor: 'gray.700' }}
          >
            <Box color="gray.400" mb={2} display="inline-flex">
              <ReceiptText size={24} />
            </Box>
            <Text fontSize="sm" color="gray.500">
              {t('noExpenses')}
            </Text>
          </Box>
        )}

        {expenses.map((expense) =>
          editingId === expense.id ? (
            // Edit row
            <Box
              key={expense.id}
              p={3}
              border="1px solid"
              borderColor="green.200"
              borderRadius="lg"
              bg="green.50"
              _dark={{ bg: 'green.950', borderColor: 'green.800' }}
            >
              <Flex gap={2} direction={{ base: 'column', sm: 'row' }}>
                <Input
                  size="sm"
                  placeholder={t('expenseName')}
                  value={editName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setEditName(e.target.value)
                  }
                  flex={1}
                  disabled={savingId === expense.id}
                  bg="white"
                  _dark={{ bg: 'gray.800' }}
                />
                <Input
                  size="sm"
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={formatAmountDisplay(editAmount)}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setEditAmount(parseAmountInput(e.target.value))
                  }
                  w={{ base: '100%', sm: '132px' }}
                  disabled={savingId === expense.id}
                  bg="white"
                  _dark={{ bg: 'gray.800' }}
                />
                <HStack gap={1} justify={{ base: 'flex-end', sm: 'initial' }}>
                  <IconButton
                    size="sm"
                    aria-label="Save"
                    colorPalette="green"
                    variant="solid"
                    onClick={() => handleSaveEdit(expense.id)}
                    loading={savingId === expense.id}
                    disabled={
                      !editName.trim() ||
                      !editAmount ||
                      isNaN(parseInt(editAmount, 10))
                    }
                  >
                    <Check size={14} />
                  </IconButton>
                  <IconButton
                    size="sm"
                    aria-label="Cancel"
                    variant="ghost"
                    onClick={handleCancelEdit}
                    disabled={savingId === expense.id}
                  >
                    <X size={14} />
                  </IconButton>
                </HStack>
              </Flex>
            </Box>
          ) : (
            // Display row
            <Box
              key={expense.id}
              p={3}
              border="1px solid"
              borderColor="gray.100"
              borderRadius="lg"
              bg="gray.50"
              _dark={{ bg: 'gray.900', borderColor: 'gray.700' }}
            >
              <Flex align="center" justify="space-between" gap={3}>
                <HStack gap={2.5} flex={1} minW={0}>
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
                  <Text fontSize="sm" fontWeight="medium" lineClamp={2}>
                    {expense.name}
                  </Text>
                </HStack>
                <VStack gap={1} align="flex-end" flexShrink={0}>
                  <Text fontSize="sm" fontWeight="bold" color="red.600">
                    {FeeService.formatFeeExact(expense.amount)}
                  </Text>
                  <HStack gap={1}>
                    <IconButton
                      size="xs"
                      aria-label={t('editExpense')}
                      variant="ghost"
                      colorPalette="gray"
                      onClick={() => handleStartEdit(expense)}
                      disabled={
                        isLoading ||
                        deletingId === expense.id ||
                        editingId !== null
                      }
                    >
                      <Pencil size={12} />
                    </IconButton>
                    <IconButton
                      size="xs"
                      aria-label={t('deleteExpense')}
                      variant="ghost"
                      colorPalette="red"
                      onClick={() => handleDelete(expense.id)}
                      loading={deletingId === expense.id}
                      disabled={isLoading || editingId !== null}
                    >
                      <Trash2 size={12} />
                    </IconButton>
                  </HStack>
                </VStack>
              </Flex>
            </Box>
          )
        )}

        {/* Add draft rows */}
        {isAdding && (
          <Box
            bg="green.50"
            borderRadius="lg"
            p={3}
            border="1px dashed"
            borderColor="green.300"
            _dark={{ bg: 'green.950', borderColor: 'green.700' }}
          >
            <VStack gap={2} align="stretch">
              {draftRows.map((row, idx) => (
                <Flex
                  key={idx}
                  gap={2}
                  direction={{ base: 'column', sm: 'row' }}
                >
                  <Input
                    size="sm"
                    placeholder={t('expenseNamePlaceholder')}
                    value={row.name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      handleDraftChange(idx, 'name', e.target.value)
                    }
                    flex={1}
                    disabled={isSavingDrafts}
                    bg="white"
                    _dark={{ bg: 'gray.800' }}
                  />
                  <Input
                    size="sm"
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
                    w={{ base: '100%', sm: '132px' }}
                    disabled={isSavingDrafts}
                    bg="white"
                    _dark={{ bg: 'gray.800' }}
                  />
                  {draftRows.length > 1 && (
                    <IconButton
                      size="sm"
                      aria-label="Remove row"
                      variant="ghost"
                      colorPalette="red"
                      onClick={() => handleRemoveDraftRow(idx)}
                      disabled={isSavingDrafts}
                    >
                      <X size={14} />
                    </IconButton>
                  )}
                </Flex>
              ))}

              <Flex
                justify="space-between"
                align={{ base: 'stretch', sm: 'center' }}
                direction={{ base: 'column', sm: 'row' }}
                gap={2}
                mt={1}
              >
                <Button
                  size="xs"
                  variant="ghost"
                  colorPalette="gray"
                  onClick={handleAddDraftRow}
                  disabled={isSavingDrafts}
                >
                  <Plus size={12} />
                  <Text ml={1}>{t('addExpense')}</Text>
                </Button>
                <HStack gap={2} justify="flex-end">
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
    </Box>
  );
}
