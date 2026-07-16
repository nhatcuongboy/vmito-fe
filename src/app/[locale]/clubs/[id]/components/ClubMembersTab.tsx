'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  Avatar,
  Badge,
  Box,
  Flex,
  Heading,
  HStack,
  InputGroup,
  SimpleGrid,
  Tabs,
  Text,
  VStack,
} from '@chakra-ui/react';
import {
  Calendar,
  ExternalLink,
  Mars,
  Search,
  Trash2,
  Trophy,
  User,
  UserPlus,
  Users,
  Venus,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, IconButton } from '@/components/ui/chakra-compat';
import { Input } from '@/components/ui/Input';
import { toaster } from '@/components/ui/toaster';
import { VModal } from '@/components/ui/VModal';
import { ROUTES } from '@/constants';
import { useDebounce } from '@/hooks/useDebounce';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { useRouter } from '@/i18n/config';
import { ClubsService } from '@/lib/api/clubs.service';
import {
  EMemberRole,
  IClub,
  IClubMember,
  IClubUserSearchResult,
} from '@/types/club';

interface IClubMembersTabProps {
  club: IClub;
  isUserAdmin: boolean;
  onClubChanged: () => Promise<void>;
}

interface IMemberInfoRowProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  isLast?: boolean;
}

const MemberInfoRow = ({
  icon,
  label,
  value,
  isLast = false,
}: IMemberInfoRowProps) => (
  <Flex
    align="center"
    justify="space-between"
    gap={3}
    px={4}
    py={3}
    borderBottomWidth={isLast ? 0 : '1px'}
    borderColor="gray.100"
    _dark={{ borderColor: 'gray.700' }}
  >
    <HStack gap={2} color="gray.500">
      {icon}
      <Text fontSize="sm">{label}</Text>
    </HStack>
    <Text fontSize="sm" fontWeight="medium" textAlign="right">
      {value}
    </Text>
  </Flex>
);

export const ClubMembersTab = ({
  club,
  isUserAdmin,
  onClubChanged,
}: IClubMembersTabProps) => {
  const t = useTranslations();
  const router = useRouter();
  const { getLevelLabel } = useLevelLabel();
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const debouncedMemberSearchQuery = useDebounce(memberSearchQuery, 400);
  const [memberSearchResults, setMemberSearchResults] = useState<
    IClubUserSearchResult[]
  >([]);
  const [isSearchingMembers, setIsSearchingMembers] = useState(false);
  const [addingMemberId, setAddingMemberId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [visibleMembersCount, setVisibleMembersCount] = useState(8);
  const [selectedMember, setSelectedMember] = useState<IClubMember | null>(
    null
  );
  const [memberToRemove, setMemberToRemove] = useState<IClubMember | null>(
    null
  );

  useEffect(() => {
    setVisibleMembersCount(8);
  }, [club.id]);

  const searchClubMembers = useCallback(
    async (query: string) => {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) {
        setMemberSearchResults([]);
        return;
      }

      try {
        setIsSearchingMembers(true);
        const results = await ClubsService.searchUsers(trimmedQuery, club.id);
        setMemberSearchResults(results);
      } catch (error) {
        console.error('Failed to search users:', error);
        toaster.error({ title: t('common.error') });
      } finally {
        setIsSearchingMembers(false);
      }
    },
    [club.id, t]
  );

  useEffect(() => {
    if (!isAddMemberModalOpen) return;
    searchClubMembers(debouncedMemberSearchQuery);
  }, [debouncedMemberSearchQuery, isAddMemberModalOpen, searchClubMembers]);

  const handleCloseAddMemberModal = () => {
    setIsAddMemberModalOpen(false);
    setMemberSearchQuery('');
    setMemberSearchResults([]);
    setAddingMemberId(null);
  };

  const handleAddMember = async (userId: string) => {
    try {
      setAddingMemberId(userId);
      await ClubsService.addMemberToClub(club.id, userId);
      toaster.success({ title: t('clubs.clubMemberAddedSuccess') });
      setMemberSearchResults((previousResults) =>
        previousResults.filter((user) => user.id !== userId)
      );
      await onClubChanged();
    } catch (error) {
      console.error('Failed to add club member:', error);
      toaster.error({ title: t('clubs.failedToAddClubMember') });
    } finally {
      setAddingMemberId(null);
    }
  };

  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove) return;
    const userId = memberToRemove.user.id;

    try {
      setRemovingMemberId(userId);
      await ClubsService.removeMemberFromClub(club.id, userId);
      toaster.success({ title: t('clubs.clubMemberRemovedSuccess') });
      setMemberToRemove(null);
      setSelectedMember(null);
      await onClubChanged();
    } catch (error) {
      console.error('Failed to remove club member:', error);
      toaster.error({ title: t('clubs.failedToRemoveClubMember') });
    } finally {
      setRemovingMemberId(null);
    }
  };

  const visibleMembers = club.members?.slice(0, visibleMembersCount) ?? [];
  const hasMoreMembers = (club.members?.length ?? 0) > visibleMembersCount;

  return (
    <>
      <Tabs.Content value="members" pt={0}>
        <Box
          p={6}
          bg="white"
          _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
          borderRadius="2xl"
          borderWidth="1px"
          borderColor="gray.100"
          shadow="sm"
        >
          <Flex
            justify="space-between"
            align={{ base: 'flex-start', sm: 'center' }}
            direction={{ base: 'column', sm: 'row' }}
            gap={3}
            mb={2}
          >
            <Box>
              <Heading size="md">{t('clubs.clubMembers')}</Heading>
              <Badge colorPalette="gray" size="sm" mt={2}>
                {club.memberCount} {t('clubs.members')}
              </Badge>
            </Box>
            {isUserAdmin && (
              <Button
                size="sm"
                colorPalette="green"
                onClick={() => setIsAddMemberModalOpen(true)}
              >
                <UserPlus size={16} />
                {t('clubs.addClubMember')}
              </Button>
            )}
          </Flex>
          <Text fontSize="sm" color="gray.500" mb={5}>
            {t('clubs.showingMembers', {
              visible: visibleMembers.length,
              total: club.memberCount,
            })}
          </Text>

          {visibleMembers.length > 0 ? (
            <>
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
                {visibleMembers.map((member) => (
                  <Flex
                    key={member.id}
                    p={4}
                    bg="gray.50"
                    borderRadius="2xl"
                    borderWidth="1px"
                    borderColor="gray.100"
                    _dark={{ bg: 'gray.900', borderColor: 'gray.700' }}
                    align="center"
                    gap={3}
                    transition="all 0.2s"
                    cursor="pointer"
                    onClick={() => setSelectedMember(member)}
                    _hover={{
                      bg: 'gray.100',
                      _dark: { bg: 'gray.800' },
                      shadow: 'sm',
                    }}
                  >
                    <Avatar.Root size="lg">
                      <Avatar.Image src={member.user.image} objectFit="cover" />
                      <Avatar.Fallback>{member.user.name[0]}</Avatar.Fallback>
                    </Avatar.Root>
                    <Box flex="1" minW={0}>
                      <Text fontWeight="semibold" fontSize="sm" lineClamp={1}>
                        {member.user.name}
                      </Text>
                      <HStack gap={2} mt={1}>
                        <Badge
                          size="xs"
                          colorPalette={
                            member.role === EMemberRole.ADMIN
                              ? 'orange'
                              : member.role === EMemberRole.MODERATOR
                                ? 'blue'
                                : 'gray'
                          }
                          variant="subtle"
                        >
                          {t(
                            `clubs.memberRole.${member.role.toLowerCase() as 'admin' | 'moderator' | 'member'}`
                          )}
                        </Badge>
                        {member.user.level && (
                          <Text fontSize="xs" color="gray.500">
                            {getLevelLabel(member.user.level)}
                          </Text>
                        )}
                      </HStack>
                    </Box>
                    {isUserAdmin ? (
                      <IconButton
                        aria-label={t('common.remove')}
                        icon={<Trash2 size={16} />}
                        size="sm"
                        colorPalette="red"
                        variant="ghost"
                        loading={removingMemberId === member.user.id}
                        onClick={(event) => {
                          event.stopPropagation();
                          setMemberToRemove(member);
                        }}
                      />
                    ) : (
                      <ExternalLink
                        size={14}
                        color="var(--chakra-colors-gray-400)"
                      />
                    )}
                  </Flex>
                ))}
              </SimpleGrid>
              {hasMoreMembers && (
                <Flex justify="center" mt={4}>
                  <Button
                    variant="outline"
                    colorPalette="green"
                    size="sm"
                    onClick={() =>
                      setVisibleMembersCount(
                        (previousCount) => previousCount + 8
                      )
                    }
                  >
                    {t('clubs.viewMoreMembers')}
                  </Button>
                </Flex>
              )}
            </>
          ) : (
            <Flex
              direction="column"
              align="center"
              justify="center"
              py={10}
              color="gray.400"
              gap={2}
            >
              <Users size={40} strokeWidth={1.2} />
              <Text fontSize="sm" fontStyle="italic">
                {t('clubs.adminApproval.noMembersYet')}
              </Text>
              {isUserAdmin && (
                <Button
                  mt={3}
                  size="sm"
                  colorPalette="green"
                  onClick={() => setIsAddMemberModalOpen(true)}
                >
                  <UserPlus size={16} />
                  {t('clubs.addFirstMember')}
                </Button>
              )}
            </Flex>
          )}
        </Box>
      </Tabs.Content>

      <VModal
        isOpen={isAddMemberModalOpen}
        onClose={handleCloseAddMemberModal}
        title={t('clubs.addClubMember')}
        size="lg"
        hideSecondaryAction={true}
        maxBodyHeight={{
          base: 'calc(100vh - 120px)',
          md: 'calc(100vh - 112px)',
        }}
      >
        <VStack align="stretch" gap={4}>
          <HStack gap={3} align="center">
            <InputGroup startElement={<Search size={16} color="#A0AEC0" />}>
              <Input
                placeholder={t('clubs.searchUserPlaceholder')}
                value={memberSearchQuery}
                onChange={(event) => setMemberSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    searchClubMembers(memberSearchQuery);
                  }
                }}
              />
            </InputGroup>
            <Button
              onClick={() => searchClubMembers(memberSearchQuery)}
              loading={isSearchingMembers}
              flexShrink={0}
            >
              {t('common.search')}
            </Button>
          </HStack>

          <VStack align="stretch" gap={2} maxH="360px" overflowY="auto">
            {memberSearchResults.map((user) => {
              const isMember = club.members?.some(
                (member) => member.user.id === user.id
              );

              return (
                <Flex
                  key={user.id}
                  p={3}
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor="gray.100"
                  bg="gray.50"
                  _dark={{ bg: 'gray.900', borderColor: 'gray.700' }}
                  align="center"
                  justify="space-between"
                  gap={3}
                >
                  <HStack gap={3} minW={0}>
                    <Avatar.Root size="sm" flexShrink={0}>
                      <Avatar.Image src={user.image} />
                      <Avatar.Fallback>
                        {user.name?.slice(0, 2).toUpperCase()}
                      </Avatar.Fallback>
                    </Avatar.Root>
                    <Box minW={0}>
                      <Text fontWeight="semibold" fontSize="sm" truncate>
                        {user.name}
                      </Text>
                      <Text fontSize="xs" color="gray.500" truncate>
                        {user.email}
                      </Text>
                    </Box>
                  </HStack>

                  {isMember ? (
                    <Badge colorPalette="green" variant="subtle" flexShrink={0}>
                      {t('clubs.alreadyMember')}
                    </Badge>
                  ) : (
                    <Button
                      size="xs"
                      colorPalette="green"
                      loading={addingMemberId === user.id}
                      onClick={() => handleAddMember(user.id)}
                      flexShrink={0}
                    >
                      {t('common.add')}
                    </Button>
                  )}
                </Flex>
              );
            })}

            {memberSearchQuery.trim() &&
              memberSearchResults.length === 0 &&
              !isSearchingMembers && (
                <Text textAlign="center" color="gray.500" py={6}>
                  {t('clubs.noUsersFound')}
                </Text>
              )}
          </VStack>
        </VStack>
      </VModal>

      <VModal
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        title={t('clubs.memberDetails')}
        size="sm"
        footer={
          selectedMember && (
            <HStack gap={2} justify="flex-end" w="full">
              {isUserAdmin && (
                <Button
                  variant="outline"
                  colorPalette="red"
                  onClick={() => {
                    setMemberToRemove(selectedMember);
                    setSelectedMember(null);
                  }}
                >
                  <Trash2 size={16} />
                  {t('clubs.removeFromClub')}
                </Button>
              )}
              <Button
                colorPalette="green"
                onClick={() => {
                  router.push(ROUTES.USER.PROFILE(selectedMember.user.id));
                  setSelectedMember(null);
                }}
              >
                {t('clubs.viewProfile')}
              </Button>
            </HStack>
          )
        }
      >
        {selectedMember && (
          <VStack gap={5} align="stretch" py={2}>
            <VStack gap={3} align="center">
              <Avatar.Root size="2xl">
                <Avatar.Image
                  src={selectedMember.user.image}
                  objectFit="cover"
                />
                <Avatar.Fallback>{selectedMember.user.name[0]}</Avatar.Fallback>
              </Avatar.Root>
              <VStack gap={1}>
                <Text fontWeight="bold" fontSize="lg" textAlign="center">
                  {selectedMember.user.name}
                </Text>
                <Badge
                  colorPalette={
                    selectedMember.role === EMemberRole.ADMIN
                      ? 'orange'
                      : selectedMember.role === EMemberRole.MODERATOR
                        ? 'blue'
                        : 'gray'
                  }
                  variant="subtle"
                >
                  {t(
                    `clubs.memberRole.${selectedMember.role.toLowerCase() as 'admin' | 'moderator' | 'member'}`
                  )}
                </Badge>
              </VStack>
            </VStack>

            <VStack
              gap={0}
              align="stretch"
              borderWidth="1px"
              borderColor="gray.100"
              _dark={{ borderColor: 'gray.700' }}
              borderRadius="xl"
              overflow="hidden"
            >
              <MemberInfoRow
                icon={
                  selectedMember.user.gender === 'MALE' ? (
                    <Mars size={16} />
                  ) : selectedMember.user.gender === 'FEMALE' ? (
                    <Venus size={16} />
                  ) : (
                    <User size={16} />
                  )
                }
                label={t('clubs.memberGender')}
                value={
                  selectedMember.user.gender === 'MALE'
                    ? t('clubs.memberGenderMale')
                    : selectedMember.user.gender === 'FEMALE'
                      ? t('clubs.memberGenderFemale')
                      : selectedMember.user.gender
                        ? t('clubs.memberGenderOther')
                        : t('clubs.memberInfoNotUpdated')
                }
              />
              <MemberInfoRow
                icon={<Trophy size={16} />}
                label={t('clubs.memberLevel')}
                value={
                  selectedMember.user.level != null
                    ? getLevelLabel(selectedMember.user.level)
                    : t('clubs.memberInfoNotUpdated')
                }
              />
              <MemberInfoRow
                icon={<Calendar size={16} />}
                label={t('clubs.memberJoinedDate')}
                value={new Date(selectedMember.createdAt).toLocaleDateString()}
                isLast
              />
            </VStack>
          </VStack>
        )}
      </VModal>

      <VModal
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        title={t('clubs.confirmRemoveMemberTitle')}
        size="sm"
        primaryActionText={t('common.remove')}
        onPrimaryAction={handleConfirmRemoveMember}
        isPrimaryLoading={removingMemberId === memberToRemove?.user.id}
        primaryColorScheme="red"
        secondaryActionText={t('common.cancel')}
        isSecondaryDisabled={removingMemberId === memberToRemove?.user.id}
      >
        <Text color="fg.muted">{t('clubs.confirmRemoveClubMember')}</Text>
      </VModal>
    </>
  );
};
