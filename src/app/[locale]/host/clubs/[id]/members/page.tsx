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
  Tabs,
  Badge,
} from '@chakra-ui/react';
import { Button, IconButton, Select } from '@/components/ui/chakra-compat';
import {
  Trash2,
  Search,
  Plus,
  UserCheck,
  UserX,
  Users,
  ClipboardList,
} from 'lucide-react';
import { useRouter } from '@/i18n/config';
import { useParams } from 'next/navigation';
import { ClubsService } from '@/lib/api/clubs.service';
import {
  IClub,
  IClubMember,
  IClubUserSearchResult,
  IClubJoinRequest,
  EMemberRole,
  EJoinRequestStatus,
} from '@/types/club';
import { toaster } from '@/components/ui/toaster';
import LoadingSpinner from '@/components/ui/loading-spinner';
import PageLayout from '@/components/layout/PageLayout';

const GroupMembersPage = () => {
  const t = useTranslations('clubs');
  const t_clubs = useTranslations('clubs');
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const [group, setGroup] = useState<IClub | null>(null);
  const [members, setMembers] = useState<IClubMember[]>([]);
  const [joinRequests, setJoinRequests] = useState<IClubJoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<IClubUserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>('members');

  const { open: isOpen, onOpen, onClose } = useDisclosure();

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [groupData, membersData, requestsData] = await Promise.all([
        ClubsService.getClub(groupId),
        ClubsService.getClubMembers(groupId),
        ClubsService.getJoinRequests(groupId),
      ]);
      setGroup(groupData);
      setMembers(membersData);
      setJoinRequests(
        requestsData.filter((r) => r.status === EJoinRequestStatus.PENDING)
      );
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
      const results = await ClubsService.searchUsers(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    try {
      await ClubsService.addMemberToClub(groupId, userId);
      toaster.success({ title: t('clubMemberAddedSuccess') });
      loadData();
      setSearchResults((prev) => prev.filter((u) => u.id !== userId));
    } catch (error) {
      console.error('Failed to add member:', error);
      toaster.error({ title: t('failedToAddClubMember') });
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm(t('confirmRemoveMember'))) return;

    try {
      await ClubsService.removeMemberFromClub(groupId, userId);
      toaster.success({ title: t('clubMemberRemovedSuccess') });
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
    } catch (error) {
      console.error('Failed to remove member:', error);
      toaster.error({ title: t('failedToRemoveClubMember') });
    }
  };

  const handleUpdateRole = async (userId: string, role: EMemberRole) => {
    try {
      await ClubsService.updateMemberRole(groupId, userId, role);
      toaster.success({ title: t('roleUpdatedSuccessfully') });
      setMembers((prev) =>
        prev.map((m) => (m.userId === userId ? { ...m, role } : m))
      );
    } catch (error) {
      console.error('Failed to update role:', error);
      toaster.error({ title: t('failedToUpdateClub') });
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    if (!confirm(t_clubs('confirmApprove'))) return;
    try {
      await ClubsService.approveJoinRequest(groupId, requestId);
      toaster.success({ title: t('requestApprovedSuccessfully') });
      loadData();
    } catch (error) {
      console.error('Failed to approve request:', error);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!confirm(t_clubs('confirmReject'))) return;
    try {
      await ClubsService.rejectJoinRequest(groupId, requestId);
      toaster.success({ title: t('requestRejectedSuccessfully') });
      setJoinRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (error) {
      console.error('Failed to reject request:', error);
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
        <Text>{t('clubNotFound')}</Text>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={group.name} maxW="container.lg">
      <Flex
        mb={8}
        align="center"
        justify="space-between"
        direction={{ base: 'column', md: 'row' }}
        gap={4}
      >
        <Flex align="center">
          <Button variant="ghost" onClick={() => router.back()} mr={4}>
            {t('back')}
          </Button>
          <Box>
            <Heading size="lg">{group.name}</Heading>
            <Text color="gray.500" display="flex" alignItems="center" gap={2}>
              <Users size={16} /> {members.length} {t('members')}
              {joinRequests.length > 0 && (
                <Badge
                  colorPalette="orange"
                  variant="solid"
                  borderRadius="full"
                  fontSize="xs"
                >
                  {joinRequests.length} {t_clubs('pendingRequest')}
                </Badge>
              )}
            </Text>
          </Box>
        </Flex>
        <Button leftIcon={<Plus />} colorPalette="green" onClick={onOpen}>
          {t('addMember')}
        </Button>
      </Flex>

      <Tabs.Root
        value={activeTab}
        onValueChange={(e) => setActiveTab(e.value)}
        variant="enclosed"
      >
        <Tabs.List>
          <Tabs.Trigger value="members" gap={2}>
            <Users size={16} />
            {t('allMembers')}
          </Tabs.Trigger>
          <Tabs.Trigger value="requests" gap={2}>
            <ClipboardList size={16} />
            {t_clubs('joinRequests')}
            {joinRequests.length > 0 && (
              <Badge colorPalette="orange" size="xs" borderRadius="full">
                {joinRequests.length}
              </Badge>
            )}
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="members" pt={6}>
          <VStack gap={4} align="stretch">
            {members.length === 0 ? (
              <Box
                p={8}
                textAlign="center"
                bg="gray.50"
                _dark={{ bg: 'gray.900/40' }}
                borderRadius="lg"
              >
                <Text color="gray.500">{t('noMembersYet')}</Text>
                <Button
                  mt={4}
                  colorPalette="blue"
                  variant="plain"
                  onClick={onOpen}
                >
                  {t('addFirstMember')}
                </Button>
              </Box>
            ) : (
              members.map((member) => (
                <Flex
                  key={member.id}
                  p={4}
                  bg="white"
                  _dark={{ bg: 'gray.800' }}
                  borderRadius="lg"
                  borderWidth="1px"
                  align="center"
                  justify="space-between"
                  shadow="sm"
                >
                  <HStack gap={4} flex="1">
                    <Avatar.Root>
                      <Avatar.Fallback>
                        {member.user.name?.slice(0, 2).toUpperCase()}
                      </Avatar.Fallback>
                      <Avatar.Image src={member.user.image} />
                    </Avatar.Root>
                    <Box>
                      <HStack gap={2}>
                        <Text fontWeight="bold">{member.user.name}</Text>
                        <Badge
                          size="xs"
                          colorPalette={
                            member.role === EMemberRole.ADMIN
                              ? 'orange'
                              : member.role === EMemberRole.MODERATOR
                                ? 'blue'
                                : 'gray'
                          }
                        >
                          {t_clubs(
                            `memberRole.${member.role.toLowerCase()}` as any
                          )}
                        </Badge>
                      </HStack>
                      <Text fontSize="sm" color="gray.500">
                        {member.user.email}
                      </Text>
                      <HStack mt={1} gap={4}>
                        <Text
                          fontSize="xs"
                          color="blue.500"
                          display="flex"
                          alignItems="center"
                          gap={1}
                        >
                          <UserCheck size={12} /> {t_clubs('attendance')}:{' '}
                          {member.attendanceCount}
                        </Text>
                        {member.user.level && (
                          <Text fontSize="xs" color="green.500">
                            Lv.{member.user.level}
                          </Text>
                        )}
                      </HStack>
                    </Box>
                  </HStack>

                  <HStack gap={4}>
                    <Box w="140px">
                      <Select
                        size="sm"
                        value={member.role}
                        onChange={(e) =>
                          handleUpdateRole(
                            member.userId,
                            e.target.value as EMemberRole
                          )
                        }
                      >
                        <option value={EMemberRole.MEMBER}>
                          {t_clubs('memberRole.member')}
                        </option>
                        <option value={EMemberRole.MODERATOR}>
                          {t_clubs('memberRole.moderator')}
                        </option>
                        <option value={EMemberRole.ADMIN}>
                          {t_clubs('memberRole.admin')}
                        </option>
                      </Select>
                    </Box>
                    <IconButton
                      icon={<Trash2 size={18} />}
                      aria-label="Remove member"
                      colorPalette="red"
                      variant="ghost"
                      onClick={() => handleRemoveMember(member.userId)}
                    />
                  </HStack>
                </Flex>
              ))
            )}
          </VStack>
        </Tabs.Content>

        <Tabs.Content value="requests" pt={6}>
          <VStack gap={4} align="stretch">
            {joinRequests.length === 0 ? (
              <Box
                p={8}
                textAlign="center"
                bg="gray.50"
                _dark={{ bg: 'gray.900/40' }}
                borderRadius="lg"
              >
                <ClipboardList
                  size={48}
                  color="#CBD5E0"
                  style={{ margin: '0 auto 16px' }}
                />
                <Text color="gray.500">
                  {t_clubs('noPendingRequest' as any) ||
                    'No pending join requests'}
                </Text>
              </Box>
            ) : (
              joinRequests.map((request) => (
                <Flex
                  key={request.id}
                  p={4}
                  bg="white"
                  _dark={{ bg: 'gray.800' }}
                  borderRadius="lg"
                  borderWidth="1px"
                  align="center"
                  justify="space-between"
                  shadow="sm"
                >
                  <HStack gap={4} flex="1">
                    <Avatar.Root>
                      <Avatar.Fallback>
                        {request.user.name?.slice(0, 2).toUpperCase()}
                      </Avatar.Fallback>
                      <Avatar.Image src={request.user.image} />
                    </Avatar.Root>
                    <Box>
                      <Text fontWeight="bold">{request.user.name}</Text>
                      <Text fontSize="sm" color="gray.500">
                        {request.user.email}
                      </Text>
                      {request.message && (
                        <Box
                          mt={2}
                          p={2}
                          bg="gray.50"
                          _dark={{ bg: 'gray.700' }}
                          borderRadius="md"
                          fontSize="xs"
                          fontStyle="italic"
                        >
                          "{request.message}"
                        </Box>
                      )}
                      <Text fontSize="xs" color="gray.400" mt={1}>
                        {new Date(request.createdAt).toLocaleDateString()}
                      </Text>
                    </Box>
                  </HStack>

                  <HStack gap={2}>
                    <Button
                      size="sm"
                      leftIcon={<UserCheck size={16} />}
                      colorPalette="green"
                      onClick={() => handleApproveRequest(request.id)}
                    >
                      {t_clubs('approve')}
                    </Button>
                    <Button
                      size="sm"
                      leftIcon={<UserX size={16} />}
                      variant="outline"
                      colorPalette="red"
                      onClick={() => handleRejectRequest(request.id)}
                    >
                      {t_clubs('reject')}
                    </Button>
                  </HStack>
                </Flex>
              ))
            )}
          </VStack>
        </Tabs.Content>
      </Tabs.Root>

      <DialogRoot
        open={isOpen}
        onOpenChange={(e) => !e.open && onClose()}
        size="lg"
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('addClubMember')}</DialogTitle>
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
              {searchResults.map((user) => {
                const isMember = members.some((m) => m.userId === user.id);
                return (
                  <Flex
                    key={user.id}
                    p={3}
                    borderRadius="md"
                    _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
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
