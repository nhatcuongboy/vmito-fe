'use client';

import { useState } from 'react';
import {
  Avatar,
  Box,
  Field,
  Flex,
  HStack,
  InputGroup,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/chakra-compat';
import VModal from '@/components/ui/VModal';
import { IClubUserSearchResult } from '@/types/club';

interface IAddClubMemberDialogProps {
  isOpen: boolean;
  memberIds: ReadonlySet<string>;
  onClose: () => void;
  onSearch: (query: string) => Promise<IClubUserSearchResult[]>;
  onAdd: (userId: string) => Promise<void>;
}

export default function AddClubMemberDialog({
  isOpen,
  memberIds,
  onClose,
  onSearch,
  onAdd,
}: IAddClubMemberDialogProps) {
  const t = useTranslations('clubs');
  const tCommon = useTranslations('common');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<IClubUserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const hasSearched = query.trim().length > 0;

  const handleClose = () => {
    if (isSearching || addingUserId) return;
    setQuery('');
    setResults([]);
    setError('');
    onClose();
  };

  const handleSearch = async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;
    setIsSearching(true);
    setError('');
    try {
      setResults(await onSearch(trimmedQuery));
    } catch {
      setError(t('searchUsersFailed'));
    } finally {
      setIsSearching(false);
    }
  };

  const handleAdd = async (userId: string) => {
    setAddingUserId(userId);
    setError('');
    try {
      await onAdd(userId);
      setResults((current) => current.filter((user) => user.id !== userId));
    } catch {
      setError(t('failedToAddClubMember'));
    } finally {
      setAddingUserId(null);
    }
  };

  return (
    <VModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('addClubMember')}
      size="lg"
      maxBodyHeight={{ base: '70vh', md: '60vh' }}
      closeOnOverlayClick={!isSearching && !addingUserId}
      closeButtonAriaLabel={tCommon('close')}
      hideSecondaryAction
    >
      <VStack align="stretch" gap={4}>
        <Field.Root>
          <Field.Label>{t('searchUserLabel')}</Field.Label>
          <HStack align="stretch">
            <InputGroup
              flex={1}
              startElement={<Search size={16} aria-hidden="true" />}
            >
              <Input
                name="clubMemberSearch"
                autoComplete="off"
                placeholder={t('searchUserPlaceholder')}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleSearch();
                }}
              />
            </InputGroup>
            <Button
              onClick={handleSearch}
              loading={isSearching}
              disabled={!query.trim() || addingUserId !== null}
            >
              {t('search')}
            </Button>
          </HStack>
        </Field.Root>

        {error && (
          <Text color="red.600" fontSize="sm" role="alert" aria-live="polite">
            {error}
          </Text>
        )}

        <VStack
          align="stretch"
          gap={2}
          overflowY="auto"
          overscrollBehavior="contain"
        >
          {results.map((user) => {
            const isMember = memberIds.has(user.id);
            return (
              <Flex
                key={user.id}
                p={3}
                borderRadius="md"
                borderWidth="1px"
                borderColor="border.muted"
                align="center"
                justify="space-between"
                gap={3}
              >
                <HStack minW={0} align="flex-start">
                  <Avatar.Root size="sm" flexShrink={0}>
                    <Avatar.Fallback>
                      {user.name?.slice(0, 2).toUpperCase()}
                    </Avatar.Fallback>
                    <Avatar.Image src={user.image} />
                  </Avatar.Root>
                  <Box minW={0}>
                    <Text fontWeight="medium" lineClamp={1}>
                      {user.name}
                    </Text>
                    <Text fontSize="xs" color="fg.muted" wordBreak="break-word">
                      {user.email}
                    </Text>
                  </Box>
                </HStack>
                {isMember ? (
                  <Text
                    flexShrink={0}
                    fontSize="xs"
                    color="green.600"
                    fontWeight="bold"
                  >
                    {t('alreadyMember')}
                  </Text>
                ) : (
                  <Button
                    flexShrink={0}
                    size="sm"
                    colorPalette="green"
                    loading={addingUserId === user.id}
                    disabled={addingUserId !== null}
                    onClick={() => handleAdd(user.id)}
                  >
                    {t('add')}
                  </Button>
                )}
              </Flex>
            );
          })}
          {hasSearched && results.length === 0 && !isSearching && !error && (
            <Text textAlign="center" color="fg.muted" py={8}>
              {t('noUsersFound')}
            </Text>
          )}
        </VStack>
      </VStack>
    </VModal>
  );
}
