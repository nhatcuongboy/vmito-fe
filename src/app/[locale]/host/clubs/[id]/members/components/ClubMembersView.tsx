'use client';

import {
  Badge,
  Box,
  Flex,
  Heading,
  Image,
  Tabs,
  Text,
  VStack,
} from '@chakra-ui/react';
import { ClipboardList, ExternalLink, Plus, Users } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/chakra-compat';
import { DEFAULT_CLUB_LOGO, ROUTES } from '@/constants';
import { Link } from '@/i18n/config';
import {
  EMemberRole,
  IClub,
  IClubJoinRequest,
  IClubMember,
} from '@/types/club';
import ClubJoinRequestRow from './ClubJoinRequestRow';
import ClubMemberRow from './ClubMemberRow';

interface IClubMembersViewProps {
  groupId: string;
  group: IClub;
  members: IClubMember[];
  joinRequests: IClubJoinRequest[];
  activeTab: 'members' | 'requests';
  updatingRoleId: string | null;
  removingMemberId?: string;
  loadingRequestId?: string;
  loadingRequestAction: 'APPROVED' | 'REJECTED' | null;
  onTabChange: (tab: 'members' | 'requests') => void;
  onOpenAdd: () => void;
  onUpdateRole: (userId: string, role: EMemberRole) => void;
  onRemove: (member: IClubMember) => void;
  onApprove: (request: IClubJoinRequest) => void;
  onReject: (request: IClubJoinRequest) => void;
}

export default function ClubMembersView({
  groupId,
  group,
  members,
  joinRequests,
  activeTab,
  updatingRoleId,
  removingMemberId,
  loadingRequestId,
  loadingRequestAction,
  onTabChange,
  onOpenAdd,
  onUpdateRole,
  onRemove,
  onApprove,
  onReject,
}: IClubMembersViewProps) {
  const t = useTranslations('clubs');
  const format = useFormatter();
  const roleLabels: Record<EMemberRole, string> = {
    [EMemberRole.ADMIN]: t('memberRole.admin'),
    [EMemberRole.MODERATOR]: t('memberRole.moderator'),
    [EMemberRole.MEMBER]: t('memberRole.member'),
  };

  return (
    <>
      <Flex
        mb={6}
        align={{ base: 'stretch', md: 'center' }}
        justify="space-between"
        direction={{ base: 'column', md: 'row' }}
        gap={4}
      >
        <Flex align="center" gap={3} minW={0}>
          <Box
            w="56px"
            h="56px"
            flexShrink={0}
            overflow="hidden"
            borderRadius="full"
            borderWidth="1px"
            borderColor="border.muted"
            bg="bg"
            shadow="sm"
          >
            <Image
              src={group.logo || DEFAULT_CLUB_LOGO}
              alt={group.name}
              w="full"
              h="full"
              objectFit="cover"
              onError={(event) => {
                event.currentTarget.src = DEFAULT_CLUB_LOGO;
              }}
            />
          </Box>
          <Box minW={0}>
            <Heading size="lg" lineClamp={2}>
              {group.name}
            </Heading>
            <Flex mt={2} align="center" gap={2} flexWrap="wrap">
              <Badge colorPalette="green" variant="subtle">
                <Users size={14} aria-hidden="true" />
                {members.length} {t('members')}
              </Badge>
              {joinRequests.length > 0 && (
                <Badge colorPalette="orange" variant="subtle">
                  {joinRequests.length} {t('pendingRequest')}
                </Badge>
              )}
              <Link href={ROUTES.HOST.CLUBS.DETAIL(groupId)}>
                <Flex
                  as="span"
                  align="center"
                  gap={1}
                  minH="32px"
                  px={2}
                  color="green.700"
                  fontSize="sm"
                  fontWeight="semibold"
                  borderRadius="md"
                  _dark={{ color: 'green.300' }}
                  _hover={{ bg: 'green.50', _dark: { bg: 'green.900/30' } }}
                  _focusVisible={{
                    outline: '2px solid',
                    outlineColor: 'green.500',
                    outlineOffset: '2px',
                  }}
                >
                  {t('clubDetails')}
                  <ExternalLink size={14} aria-hidden="true" />
                </Flex>
              </Link>
            </Flex>
          </Box>
        </Flex>
        <Button
          w={{ base: 'full', md: 'auto' }}
          h="48px"
          px={5}
          colorPalette="green"
          onClick={onOpenAdd}
        >
          <Plus size={18} aria-hidden="true" />
          {t('addMember')}
        </Button>
      </Flex>

      <Tabs.Root
        value={activeTab}
        onValueChange={(event) =>
          onTabChange(event.value as 'members' | 'requests')
        }
        variant="plain"
      >
        <Tabs.List
          w={{ base: 'full', md: 'fit-content' }}
          p={1}
          bg="bg.muted"
          borderRadius="lg"
        >
          <Tabs.Trigger
            value="members"
            gap={2}
            minH="48px"
            flex={{ base: 1, md: 'none' }}
            justifyContent="center"
            borderRadius="md"
            fontWeight="semibold"
            color="fg.muted"
            _selected={{ bg: 'bg', color: 'green.700', shadow: 'sm' }}
            _dark={{
              _selected: { bg: 'gray.700', color: 'green.300' },
            }}
          >
            <Users size={16} aria-hidden="true" />
            {t('allMembers')}
          </Tabs.Trigger>
          <Tabs.Trigger
            value="requests"
            gap={2}
            minH="48px"
            flex={{ base: 1, md: 'none' }}
            justifyContent="center"
            borderRadius="md"
            fontWeight="semibold"
            color="fg.muted"
            _selected={{ bg: 'bg', color: 'green.700', shadow: 'sm' }}
            _dark={{
              _selected: { bg: 'gray.700', color: 'green.300' },
            }}
          >
            <ClipboardList size={16} aria-hidden="true" />
            {t('joinRequests')}
            {joinRequests.length > 0 && (
              <Badge colorPalette="orange" size="xs" borderRadius="full">
                {joinRequests.length}
              </Badge>
            )}
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="members" pt={4}>
          <VStack gap={3} align="stretch">
            {members.length === 0 ? (
              <Box p={8} textAlign="center" bg="bg.muted" borderRadius="lg">
                <Text color="fg.muted">{t('noMembersYet')}</Text>
                <Button
                  mt={4}
                  colorPalette="green"
                  variant="plain"
                  onClick={onOpenAdd}
                >
                  {t('addFirstMember')}
                </Button>
              </Box>
            ) : (
              members.map((member) => (
                <ClubMemberRow
                  key={member.id}
                  member={member}
                  roleLabels={roleLabels}
                  attendanceLabel={t('attendance')}
                  roleSelectLabel={t('roleSelectLabel')}
                  removeLabel={t('removeFromClub')}
                  isUpdatingRole={updatingRoleId === member.userId}
                  isRemoving={removingMemberId === member.id}
                  onUpdateRole={onUpdateRole}
                  onRemove={onRemove}
                />
              ))
            )}
          </VStack>
        </Tabs.Content>

        <Tabs.Content value="requests" pt={4}>
          <VStack gap={3} align="stretch">
            {joinRequests.length === 0 ? (
              <Box p={8} textAlign="center" bg="bg.muted" borderRadius="lg">
                <ClipboardList
                  size={48}
                  color="#CBD5E0"
                  style={{ margin: '0 auto 16px' }}
                  aria-hidden="true"
                />
                <Text color="fg.muted">{t('noPendingRequests')}</Text>
              </Box>
            ) : (
              joinRequests.map((request) => (
                <ClubJoinRequestRow
                  key={request.id}
                  request={request}
                  submittedText={format.dateTime(new Date(request.createdAt), {
                    dateStyle: 'medium',
                  })}
                  detailHref={ROUTES.HOST.APPROVAL.CLUB_REQUEST(
                    groupId,
                    request.id
                  )}
                  viewDetailsLabel={t('viewDetails')}
                  approveLabel={t('approve')}
                  rejectLabel={t('reject')}
                  loadingAction={
                    loadingRequestId === request.id
                      ? loadingRequestAction
                      : null
                  }
                  onApprove={onApprove}
                  onReject={onReject}
                />
              ))
            )}
          </VStack>
        </Tabs.Content>
      </Tabs.Root>
    </>
  );
}
