'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Avatar,
  Input,
  InputGroup,
  useDisclosure,
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogCloseTrigger,
} from '@chakra-ui/react';
import { Button, IconButton } from '@/components/ui/chakra-compat';
import { Trash2, Search, Plus } from 'lucide-react';
import { useRouter } from '@/i18n/config';
import { useParams } from 'next/navigation';
import { FixedMemberGroupsService } from '@/lib/api/fixed-member-groups.service';
import {
  IFixedMemberGroup,
  IFixedMemberGroupMember,
  IUserSearchResult,
} from '@/types/fixed-member';
import { toaster } from '@/components/ui/toaster';
import LoadingSpinner from '@/components/ui/loading-spinner';
import PageLayout from '@/components/layout/PageLayout';

const GroupMembersPage = () => {
  const t = useTranslations('fixedMembers');
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const [group, setGroup] = useState<IFixedMemberGroup | null>(null);
  const [members, setMembers] = useState<IFixedMemberGroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<IUserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { open: isOpen, onOpen, onClose } = useDisclosure();

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [groupData, membersData] = await Promise.all([
        FixedMemberGroupsService.getGroup(groupId),
        FixedMemberGroupsService.getGroupMembers(groupId),
      ]);
      setGroup(groupData);
      setMembers(membersData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toaster.error({ title: t('failedToLoadData') });
    } finally {
      setIsLoading(false);
    }
  }, [groupId, t]);

  useEffect(() => {
    if (groupId) {
      loadData();
    }
  }, [groupId, loadData]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      setIsSearching(true);
      const results = await FixedMemberGroupsService.searchUsers(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    try {
      await FixedMemberGroupsService.addMemberToGroup(groupId, userId);
      toaster.success({ title: t('memberAddedSuccess') });
      loadData(); // Reload list
      setSearchResults((prev) => prev.filter((u) => u.id !== userId)); // Remove from search results
    } catch (error) {
      console.error('Failed to add member:', error);
      toaster.error({ title: t('failedToAddMember') }); // Need to handle already exists error specifically if needed
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm(t('confirmRemoveMember'))) return;

    try {
      await FixedMemberGroupsService.removeMemberFromGroup(groupId, userId);
      toaster.success({ title: t('memberRemovedSuccess') });
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
    } catch (error) {
      console.error('Failed to remove member:', error);
      toaster.error({ title: t('failedToRemoveMember') });
    }
  };

  if (isLoading) {
    return (
      <PageLayout
        title={t('manageMembers')}
        maxW="container.md"
        isLoading={true}
        loadingComponent={<LoadingSpinner />}
      />
    );
  }

  if (!group) {
    return (
      <PageLayout title={t('manageMembers')} maxW="container.md">
        <Text>{t('groupNotFound')}</Text>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={group.name} maxW="container.md">
      <Flex mb={8} align="center" justify="space-between">
        <Flex align="center">
          <Button variant="ghost" onClick={() => router.back()} mr={4}>
            {t('back')}
          </Button>
          <Box>
            <Heading size="lg">{group.name}</Heading>
            <Text color="gray.500">
              {members.length} {t('members')}
            </Text>
          </Box>
        </Flex>
        <Button leftIcon={<Plus />} colorPalette="blue" onClick={onOpen}>
          {t('addMember')}
        </Button>
      </Flex>

      <VStack gap={4} align="stretch">
        {members.length === 0 ? (
          <Box p={8} textAlign="center" bg="gray.50" borderRadius="lg">
            <Text color="gray.500">{t('noMembersYet')}</Text>
            <Button mt={4} colorPalette="blue" variant="plain" onClick={onOpen}>
              {t('addFirstMember')}
            </Button>
          </Box>
        ) : (
          Array.isArray(members) &&
          members.map((member) => (
            <Flex
              key={member.id}
              p={4}
              bg="white"
              borderRadius="lg"
              borderWidth="1px"
              align="center"
              justify="space-between"
            >
              <HStack gap={4}>
                <Avatar.Root>
                  <Avatar.Fallback>
                    {member.user.name?.slice(0, 2).toUpperCase()}
                  </Avatar.Fallback>
                  <Avatar.Image src={member.user.image} />
                </Avatar.Root>
                <Box>
                  <Text fontWeight="bold">{member.user.name}</Text>
                  <Text fontSize="sm" color="gray.500">
                    {member.user.email}
                  </Text>
                  {member.user.phone && (
                    <Text fontSize="xs" color="gray.400">
                      {member.user.phone}
                    </Text>
                  )}
                </Box>
              </HStack>
              <IconButton
                icon={<Trash2 />}
                aria-label="Remove member"
                colorPalette="red"
                variant="ghost"
                onClick={() => handleRemoveMember(member.userId)}
              />
            </Flex>
          ))
        )}
      </VStack>

      <DialogRoot
        open={isOpen}
        onOpenChange={(e) => !e.open && onClose()}
        size="lg"
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('addMemberToGroup')}</DialogTitle>
          </DialogHeader>
          <DialogCloseTrigger />
          <DialogBody pb={6}>
            <HStack mb={4}>
              <InputGroup startElement={<Search size={16} color="#CBD5E0" />}>
                <Input
                  placeholder={t('searchUserPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </InputGroup>
              <Button onClick={handleSearch} loading={isSearching}>
                {t('search')}
              </Button>
            </HStack>

            <VStack align="stretch" gap={2} maxH="300px" overflowY="auto">
              {Array.isArray(searchResults) &&
                searchResults.map((user) => {
                  const isMember = members.some((m) => m.userId === user.id);
                  return (
                    <Flex
                      key={user.id}
                      p={3}
                      borderRadius="md"
                      _hover={{ bg: 'gray.50' }}
                      align="center"
                      justify="space-between"
                    >
                      <HStack>
                        <Avatar.Root size="sm">
                          <Avatar.Fallback>
                            {user.name?.slice(0, 2).toUpperCase()}
                          </Avatar.Fallback>
                          <Avatar.Image src={user.image} />
                        </Avatar.Root>
                        <Box>
                          <Text fontWeight="medium">{user.name}</Text>
                          <Text fontSize="xs" color="gray.500">
                            {user.email}
                          </Text>
                        </Box>
                      </HStack>
                      {isMember ? (
                        <Text fontSize="xs" color="green.500" fontWeight="bold">
                          {t('alreadyMember')}
                        </Text>
                      ) : (
                        <Button
                          size="xs"
                          colorPalette="blue"
                          onClick={() => handleAddMember(user.id)}
                        >
                          {t('add')}
                        </Button>
                      )}
                    </Flex>
                  );
                })}
              {searchQuery && searchResults.length === 0 && !isSearching && (
                <Text textAlign="center" color="gray.500" py={4}>
                  {t('noUsersFound')}
                </Text>
              )}
            </VStack>
          </DialogBody>
        </DialogContent>
      </DialogRoot>
    </PageLayout>
  );
};

export default GroupMembersPage;
