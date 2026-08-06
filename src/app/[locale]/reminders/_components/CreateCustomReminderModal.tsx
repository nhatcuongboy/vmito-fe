'use client';

import { Box, Flex, Input, Text, Textarea, VStack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { IconButton } from '@/components/ui/chakra-compat';
import { VModal } from '@/components/ui/VModal';
import { UserService, UserOption } from '@/lib/api/user.service';
import { X } from 'lucide-react';

interface CreateCustomReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    recipientUserId: string;
    amount: number;
    note: string;
  }) => Promise<void>;
}

export default function CreateCustomReminderModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateCustomReminderModalProps) {
  const t = useTranslations('paymentReminder');

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const term = query.trim();
    if (selectedUser || term.length === 0) {
      setResults([]);
      return;
    }
    setSearching(true);
    const handle = setTimeout(async () => {
      try {
        const users = await UserService.getAllUsers(term);
        setResults(users);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query, selectedUser]);

  const resetForm = () => {
    setQuery('');
    setResults([]);
    setSelectedUser(null);
    setAmount('');
    setNote('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const numericAmount = Number(amount);
  const isValid =
    Boolean(selectedUser) &&
    Number.isFinite(numericAmount) &&
    numericAmount > 0 &&
    note.trim().length > 0;

  const handleSubmit = async () => {
    if (!selectedUser || !isValid) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        recipientUserId: selectedUser.id,
        amount: numericAmount,
        note: note.trim(),
      });
      handleClose();
    } catch (error) {
      console.error('Create custom reminder failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <VModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('createCustomReminder')}
      size="md"
      primaryActionText={t('submit')}
      onPrimaryAction={handleSubmit}
      isPrimaryLoading={isSubmitting}
      isPrimaryDisabled={!isValid}
      secondaryActionText={t('cancel')}
    >
      <VStack align="stretch" gap={3}>
        <Box>
          <Text fontSize="sm" fontWeight="medium" mb={2}>
            {t('recipient')}
          </Text>
          {selectedUser ? (
            <Flex
              align="center"
              justify="space-between"
              p={2}
              border="1px solid"
              borderColor="gray.200"
              borderRadius="md"
            >
              <Box minW={0}>
                <Text fontSize="sm" fontWeight="medium" truncate>
                  {selectedUser.name}
                </Text>
                <Text fontSize="xs" color="gray.500" truncate>
                  {selectedUser.email}
                </Text>
              </Box>
              <IconButton
                aria-label={t('cancel')}
                size="sm"
                variant="ghost"
                onClick={() => setSelectedUser(null)}
              >
                <X size={14} />
              </IconButton>
            </Flex>
          ) : (
            <Box position="relative">
              <Input
                placeholder={t('searchUserPlaceholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query.trim().length > 0 && (
                <Box
                  mt={2}
                  borderWidth="1px"
                  borderColor="gray.100"
                  _dark={{ borderColor: 'gray.700' }}
                  borderRadius="md"
                  maxH="220px"
                  overflowY="auto"
                >
                  {searching ? (
                    <Text fontSize="sm" color="gray.500" p={3}>
                      {t('searching')}
                    </Text>
                  ) : results.length === 0 ? (
                    <Text fontSize="sm" color="gray.500" p={3}>
                      {t('noResults')}
                    </Text>
                  ) : (
                    results.map((u) => (
                      <Flex
                        key={u.id}
                        align="center"
                        p={2}
                        cursor="pointer"
                        _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
                        onClick={() => {
                          setSelectedUser(u);
                          setQuery('');
                          setResults([]);
                        }}
                      >
                        <Box minW={0}>
                          <Text fontSize="sm" fontWeight="medium" truncate>
                            {u.name}
                          </Text>
                          <Text fontSize="xs" color="gray.500" truncate>
                            {u.email}
                          </Text>
                        </Box>
                      </Flex>
                    ))
                  )}
                </Box>
              )}
            </Box>
          )}
        </Box>

        <Box>
          <Text fontSize="sm" fontWeight="medium" mb={2}>
            {t('amount')}
          </Text>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
          />
        </Box>

        <Box>
          <Text fontSize="sm" fontWeight="medium" mb={2}>
            {t('note')}
          </Text>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('customReminderNotePlaceholder')}
            rows={3}
          />
        </Box>
      </VStack>
    </VModal>
  );
}
