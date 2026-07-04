'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { Badge, Box } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { useTranslations } from 'next-intl';
import {
  LuCalendarClock,
  LuGauge,
  LuMail,
  LuMessageSquare,
  LuUser,
  LuUsers,
} from 'react-icons/lu';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import PageLayout from '@/components/layout/PageLayout';
import {
  RequestActionBar,
  RequestCompletedState,
  RequestDetailCard,
  RequestInfoList,
  RequestInfoRow,
  RequestLoadingState,
  RequestNotFoundState,
} from '@/components/request-detail';
import { ClubsService } from '@/lib/api/clubs.service';
import { EJoinRequestStatus, IClubJoinRequest } from '@/types/club';
import { toaster } from '@/components/ui/toaster';
import { useRouter } from '@/i18n/config';
import dayjs from '@/lib/dayjs';
import { formatTimeByDevicePreference } from '@/utils/time-helpers';
import { useParams } from 'next/navigation';
import { ROUTES } from '@/constants';

const STATUS_BADGES: Record<
  EJoinRequestStatus,
  { palette: string; labelKey: string }
> = {
  [EJoinRequestStatus.PENDING]: {
    palette: 'orange',
    labelKey: 'approvalPending',
  },
  [EJoinRequestStatus.APPROVED]: {
    palette: 'green',
    labelKey: 'approvalStatusApproved',
  },
  [EJoinRequestStatus.REJECTED]: {
    palette: 'red',
    labelKey: 'approvalStatusRejected',
  },
};

const ClubRequestDetailContent = () => {
  const t = useTranslations('notification');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string;
  const requestId = params.requestId as string;

  const [request, setRequest] = useState<IClubJoinRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<
    'APPROVED' | 'REJECTED' | null
  >(null);
  const [isActioned, setIsActioned] = useState(false);

  const fetchRequest = useCallback(async () => {
    try {
      setIsLoading(true);
      const found = await ClubsService.getJoinRequestById(clubId, requestId);
      setRequest(found);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        setRequest(null);
      } else {
        toaster.error({ title: tCommon('error') });
      }
    } finally {
      setIsLoading(false);
    }
  }, [clubId, requestId, tCommon]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  const handleAction = async (status: 'APPROVED' | 'REJECTED') => {
    try {
      setActionLoading(status);
      if (status === 'APPROVED') {
        await ClubsService.approveJoinRequest(clubId, requestId);
      } else {
        await ClubsService.rejectJoinRequest(clubId, requestId);
      }
      toaster.success({
        title: status === 'APPROVED' ? t('approveSuccess') : t('rejectSuccess'),
      });
      if (status === 'APPROVED') {
        router.replace(ROUTES.HOST.CLUBS.MEMBERS(clubId));
        return;
      }
      setIsActioned(true);
    } catch {
      toaster.error({ title: t('approvalActionFailed') });
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return <RequestLoadingState />;
  }

  if (!request) {
    return (
      <RequestNotFoundState
        icon={<LuUsers size={32} />}
        title={t('approvalNotFound')}
        description={t('approvalNotFoundDescription')}
      />
    );
  }

  if (isActioned) {
    return (
      <RequestCompletedState
        title={t('approvalActionCompleted')}
        backLabel={tCommon('back')}
        onBack={() => router.push(ROUTES.HOST.CLUBS.MEMBERS(clubId))}
      />
    );
  }

  const isPending = request.status === EJoinRequestStatus.PENDING;
  const statusBadge = STATUS_BADGES[request.status];

  return (
    <Box px={{ base: 4, md: 6 }} py={6} maxW="container.sm" mx="auto">
      <RequestDetailCard
        accent="blue"
        icon={<LuUsers size={28} />}
        title={request.user.name}
        badges={
          <Badge colorPalette={statusBadge.palette} size="sm">
            {t(statusBadge.labelKey as Parameters<typeof t>[0])}
          </Badge>
        }
      >
        <RequestInfoList>
          {/* Club */}
          <RequestInfoRow
            icon={<LuUsers size={16} />}
            label={t('approvalClub')}
            value={request.club?.name || t('unknownClub')}
          />

          {/* Requested at */}
          <RequestInfoRow
            icon={<LuCalendarClock size={16} />}
            label={t('approvalRequestedAt')}
            value={`${dayjs(request.createdAt).format('dddd, DD/MM/YYYY')} · ${formatTimeByDevicePreference(request.createdAt)}`}
          />

          {/* Level */}
          {request.user.level != null && (
            <RequestInfoRow
              icon={<LuGauge size={16} />}
              label={t('approvalLevel')}
            >
              <Badge colorPalette="purple" size="sm">
                {tCommon(`levels.${request.user.level}`)} (Lvl{' '}
                {request.user.level})
              </Badge>
            </RequestInfoRow>
          )}

          {/* Gender */}
          {request.user.gender && (
            <RequestInfoRow
              icon={<LuUser size={16} />}
              label={t('approvalGender')}
              value={tCommon(request.user.gender.toLowerCase())}
            />
          )}

          {/* Email */}
          {request.user.email && (
            <RequestInfoRow
              icon={<LuMail size={16} />}
              label={t('approvalEmail')}
              value={request.user.email}
            />
          )}

          {/* Message from requester */}
          {request.message && (
            <RequestInfoRow
              icon={<LuMessageSquare size={16} />}
              label={t('approvalMessage')}
              value={request.message}
            />
          )}

          {/* Response given when the request was processed */}
          {!isPending && request.response && (
            <RequestInfoRow
              icon={<LuMessageSquare size={16} />}
              label={t('approvalResponse')}
              value={request.response}
            />
          )}
        </RequestInfoList>
      </RequestDetailCard>

      {isPending && (
        <RequestActionBar
          rejectLabel={t('reject')}
          approveLabel={t('approve')}
          onReject={() => handleAction('REJECTED')}
          onApprove={() => handleAction('APPROVED')}
          loadingAction={actionLoading}
        />
      )}
    </Box>
  );
};

export default function ClubRequestDetailPage() {
  const t = useTranslations('notification');
  const params = useParams();
  const clubId = params.clubId as string;

  return (
    <ProtectedRouteGuard>
      <Suspense>
        <PageLayout
          title={t('clubRequestDetailTitle')}
          showBackButton
          backHref={ROUTES.HOST.CLUBS.MEMBERS(clubId)}
        >
          <ClubRequestDetailContent />
        </PageLayout>
      </Suspense>
    </ProtectedRouteGuard>
  );
}
