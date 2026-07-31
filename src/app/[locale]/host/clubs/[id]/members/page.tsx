'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Text, useDisclosure } from '@chakra-ui/react';
import { useRouter } from '@/i18n/config';
import { useParams, useSearchParams } from 'next/navigation';
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
import PageLayout from '@/components/layout/PageLayout';
import AppConfirmDialog from '@/components/ui/AppConfirmDialog';
import { useConfirmAction } from '@/hooks/useConfirmAction';
import { ROUTES } from '@/constants';
import AddClubMemberDialog from './components/AddClubMemberDialog';
import ClubMembersSkeleton from './components/ClubMembersSkeleton';
import ClubMembersView from './components/ClubMembersView';

type TConfirmedAction =
  | { type: 'remove'; member: IClubMember }
  | { type: 'approve'; request: IClubJoinRequest }
  | { type: 'reject'; request: IClubJoinRequest };

const GroupMembersPage = () => {
  const t = useTranslations('clubs');
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const groupId = params.id as string;
  const activeTab =
    searchParams.get('tab') === 'requests' ? 'requests' : 'members';

  const [group, setGroup] = useState<IClub | null>(null);
  const [members, setMembers] = useState<IClubMember[]>([]);
  const [joinRequests, setJoinRequests] = useState<IClubJoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
  const confirmAction = useConfirmAction<TConfirmedAction>();

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

  const handleSearch = (query: string): Promise<IClubUserSearchResult[]> =>
    ClubsService.searchUsers(query, groupId);

  const handleAddMember = async (userId: string) => {
    try {
      const member = await ClubsService.addMemberToClub(groupId, userId);
      toaster.success({ title: t('clubMemberAddedSuccess') });
      setMembers((current) => [member, ...current]);
    } catch (error) {
      console.error('Failed to add member:', error);
      toaster.error({ title: t('failedToAddClubMember') });
      throw error;
    }
  };

  const handleUpdateRole = async (userId: string, role: EMemberRole) => {
    try {
      setUpdatingRoleId(userId);
      const updatedMember = await ClubsService.updateMemberRole(
        groupId,
        userId,
        role
      );
      toaster.success({ title: t('roleUpdatedSuccessfully') });
      setMembers((current) =>
        current.map((member) =>
          member.userId === userId ? updatedMember : member
        )
      );
    } catch (error) {
      console.error('Failed to update role:', error);
      toaster.error({ title: t('failedToUpdateClub') });
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const handleConfirmAction = () => {
    confirmAction.run(async (target) => {
      if (target.type === 'remove') {
        await ClubsService.removeMemberFromClub(groupId, target.member.userId);
        setMembers((current) =>
          current.filter((member) => member.id !== target.member.id)
        );
        toaster.success({ title: t('clubMemberRemovedSuccess') });
        return;
      }

      if (target.type === 'approve') {
        const approvedMember = await ClubsService.approveJoinRequest(
          groupId,
          target.request.id
        );
        setJoinRequests((current) =>
          current.filter((request) => request.id !== target.request.id)
        );
        if ('user' in approvedMember) {
          setMembers((current) => [approvedMember, ...current]);
        } else {
          setMembers(await ClubsService.getClubMembers(groupId));
        }
        toaster.success({ title: t('requestApprovedSuccessfully') });
        return;
      }

      await ClubsService.rejectJoinRequest(groupId, target.request.id);
      setJoinRequests((current) =>
        current.filter((request) => request.id !== target.request.id)
      );
      toaster.success({ title: t('requestRejectedSuccessfully') });
    }, t('memberActionFailed'));
  };

  const confirmationTarget = confirmAction.target;
  const memberIds = new Set(members.map((member) => member.userId));
  const removingMemberId =
    confirmAction.isRunning && confirmationTarget?.type === 'remove'
      ? confirmationTarget.member.id
      : undefined;
  const loadingRequestId =
    confirmationTarget?.type !== 'remove'
      ? confirmationTarget?.request.id
      : undefined;
  const loadingRequestAction =
    confirmAction.isRunning && confirmationTarget?.type !== 'remove'
      ? confirmationTarget?.type === 'approve'
        ? 'APPROVED'
        : 'REJECTED'
      : null;

  if (isLoading) {
    return (
      <PageLayout
        title={t('manageMembers')}
        maxW="6xl"
        showBackButton
        backHref={ROUTES.HOST.CLUBS.DETAIL(groupId)}
        centerTitle
        isLoading={true}
        loadingComponent={<ClubMembersSkeleton />}
      />
    );
  }

  if (!group) {
    return (
      <PageLayout
        title={t('manageMembers')}
        maxW="3xl"
        showBackButton
        backHref={ROUTES.HOST.CLUBS.DETAIL(groupId)}
        centerTitle
      >
        <Text>{t('clubNotFound')}</Text>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={t('manageMembers')}
      maxW="6xl"
      showBackButton
      backHref={ROUTES.HOST.CLUBS.DETAIL(groupId)}
      centerTitle
    >
      <ClubMembersView
        groupId={groupId}
        group={group}
        members={members}
        joinRequests={joinRequests}
        activeTab={activeTab}
        updatingRoleId={updatingRoleId}
        removingMemberId={removingMemberId}
        loadingRequestId={loadingRequestId}
        loadingRequestAction={loadingRequestAction}
        onTabChange={(tab) =>
          router.replace(ROUTES.HOST.CLUBS.MEMBERS(groupId, tab))
        }
        onOpenAdd={onOpen}
        onUpdateRole={handleUpdateRole}
        onRemove={(member) => confirmAction.request({ type: 'remove', member })}
        onApprove={(request) =>
          confirmAction.request({ type: 'approve', request })
        }
        onReject={(request) =>
          confirmAction.request({ type: 'reject', request })
        }
      />

      <AddClubMemberDialog
        isOpen={isOpen}
        memberIds={memberIds}
        onClose={onClose}
        onSearch={handleSearch}
        onAdd={handleAddMember}
      />

      <AppConfirmDialog
        isOpen={confirmationTarget !== null}
        title={
          confirmationTarget?.type === 'remove'
            ? t('confirmRemoveMemberTitle')
            : confirmationTarget?.type === 'approve'
              ? t('confirmApproveTitle')
              : t('confirmRejectTitle')
        }
        body={
          confirmationTarget?.type === 'remove'
            ? t('confirmRemoveClubMember')
            : confirmationTarget?.type === 'approve'
              ? t('confirmApprove')
              : t('confirmReject')
        }
        confirmLabel={
          confirmationTarget?.type === 'remove'
            ? t('remove')
            : confirmationTarget?.type === 'approve'
              ? t('approve')
              : t('reject')
        }
        cancelLabel={t('cancel')}
        colorPalette={confirmationTarget?.type === 'approve' ? 'green' : 'red'}
        isLoading={confirmAction.isRunning}
        error={confirmAction.error}
        onConfirm={handleConfirmAction}
        onClose={confirmAction.close}
      />
    </PageLayout>
  );
};

export default GroupMembersPage;
