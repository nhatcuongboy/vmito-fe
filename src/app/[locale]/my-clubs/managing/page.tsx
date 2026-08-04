'use client';

import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import { Input } from '@/components/ui/Input';
import { Field } from '@/components/ui/Field';
import VModal from '@/components/ui/VModal';
import ClubJoinRequestsSection from '@/components/club/ClubJoinRequestsSection';
import AdminPendingClubsSection from '@/components/club/AdminPendingClubsSection';
import ManagedClubsSection from '@/components/club/ManagedClubsSection';
import { useRouter } from '@/i18n/config';
import { ClubsService } from '@/lib/api/clubs.service';
import { toaster } from '@/components/ui/toaster';
import { Text, VStack } from '@chakra-ui/react';
import { ROUTES } from '@/constants';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useMyClubsData } from '@/hooks/useMyClubsData';
import { IMyClub } from '@/types/club';

type RejectTarget =
  | { type: 'club'; clubId: string }
  | { type: 'member'; clubId: string; requestId: string };

export default function ManagingPage() {
  const t = useTranslations();
  const router = useRouter();
  const {
    managedClubs,
    incomingRequests,
    pendingClubs,
    isLoading,
    isLoadingIncoming,
    isLoadingPending,
    isActionLoading,
    canAccessHostFeatures,
    isAdmin,
    handleApprove,
    handleApproveJoinRequest,
    handleReject,
    refetch,
  } = useMyClubsData();

  const [rejectTarget, setRejectTarget] = useState<RejectTarget | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<IMyClub | null>(null);
  const [isDeletingClub, setIsDeletingClub] = useState(false);
  const isRejectDialogOpen = rejectTarget !== null;
  const isDeleteDialogOpen = deleteTarget !== null;

  const handleDeleteClub = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeletingClub(true);
      await ClubsService.deleteClub(deleteTarget.id);
      toaster.create({
        title: t('clubs.clubDeletedSuccess'),
        type: 'success',
      });
      setDeleteTarget(null);
      await refetch();
    } catch (error) {
      console.error('Failed to delete club:', error);
      toaster.create({
        title: t('clubs.failedToDeleteClub'),
        type: 'error',
      });
    } finally {
      setIsDeletingClub(false);
    }
  };

  return (
    <ProtectedRouteGuard>
      <VStack gap={{ base: 6, md: 10 }} align="stretch">
        <ManagedClubsSection
          clubs={managedClubs}
          isAdmin={isAdmin}
          isLoading={isLoading}
          canCreateClub={canAccessHostFeatures}
          onCreate={() => router.push(ROUTES.HOST.CLUBS.CREATE)}
          onDelete={setDeleteTarget}
        />

        <ClubJoinRequestsSection
          requests={incomingRequests}
          isLoading={isLoadingIncoming}
          onApprove={handleApproveJoinRequest}
          onReject={(request) =>
            setRejectTarget({
              type: 'member',
              clubId: request.clubId,
              requestId: request.id,
            })
          }
        />
      </VStack>

      {isAdmin && (
        <AdminPendingClubsSection
          clubs={pendingClubs}
          isLoading={isLoadingPending}
          isActionLoading={isActionLoading}
          onApprove={handleApprove}
          onReject={(clubId) => setRejectTarget({ type: 'club', clubId })}
        />
      )}

      <VModal
        isOpen={isRejectDialogOpen}
        onClose={() => setRejectTarget(null)}
        title={t('clubs.reject')}
        primaryActionText={t('clubs.reject')}
        onPrimaryAction={() => {
          if (rejectTarget) {
            handleReject(rejectTarget, rejectionReason);
            setRejectTarget(null);
          }
        }}
        isPrimaryLoading={isActionLoading}
        primaryColorScheme="red"
        secondaryActionText={t('common.cancel')}
        isPrimaryDisabled={!rejectionReason.trim()}
      >
        <Field
          label={t('clubs.rejectionReason', { reason: '' }).replace(': ', '')}
          required
        >
          <Input
            placeholder={t('clubs.joinMessagePlaceholder')}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </Field>
      </VModal>

      <VModal
        isOpen={isDeleteDialogOpen}
        onClose={() => setDeleteTarget(null)}
        title={t('clubs.deleteClubTitle')}
        primaryActionText={t('common.delete')}
        onPrimaryAction={handleDeleteClub}
        isPrimaryLoading={isDeletingClub}
        primaryColorScheme="red"
        secondaryActionText={t('common.cancel')}
      >
        <Text>
          {t('clubs.deleteClubConfirmation', {
            name: deleteTarget?.name ?? '',
          })}
        </Text>
      </VModal>
    </ProtectedRouteGuard>
  );
}
