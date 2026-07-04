'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { Badge, Box, Text } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { useTranslations } from 'next-intl';
import { formatVenueName } from '@/utils';
import {
  LuUserCheck,
  LuCalendarClock,
  LuMapPin,
  LuHash,
  LuGauge,
  LuPhone,
  LuMessageSquare,
  LuActivity,
  LuUser,
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
import { PlayerService } from '@/lib/api/player.service';
import { PendingRequest } from '@/lib/api/types';
import { toaster } from '@/components/ui/toaster';
import { useRouter } from '@/i18n/config';
import dayjs from '@/lib/dayjs';
import { formatTimeByDevicePreference } from '@/utils/time-helpers';
import { useParams } from 'next/navigation';
import { ROUTES } from '@/constants';

const ApprovalDetailContent = () => {
  const t = useTranslations('notification');
  const tCommon = useTranslations('common');
  const tVenue = useTranslations('venue');
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;
  const playerId = params.playerId as string;

  const [request, setRequest] = useState<PendingRequest | null>(null);
  const [sameUserPlayerIds, setSameUserPlayerIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<
    'APPROVED' | 'REJECTED' | null
  >(null);
  const [isActioned, setIsActioned] = useState(false);

  const fetchRequest = useCallback(async () => {
    try {
      setIsLoading(true);
      const found = await PlayerService.getPendingRequestById(playerId);
      if (found.sessionId !== sessionId) {
        setRequest(null);
        setSameUserPlayerIds([]);
        return;
      }
      setRequest(found);
      // All pending slots registered by the same user in this session,
      // approved/rejected together as one group
      setSameUserPlayerIds(
        found.relatedPlayerIds?.length ? found.relatedPlayerIds : [found.id]
      );
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        setRequest(null);
      } else {
        toaster.error({ title: tCommon('error') });
      }
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, playerId, tCommon]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  const handleAction = async (status: 'APPROVED' | 'REJECTED') => {
    try {
      setActionLoading(status);
      const ids = sameUserPlayerIds.length > 0 ? sameUserPlayerIds : [playerId];
      await PlayerService.batchUpdateStatus(ids, status);
      toaster.success({
        title: status === 'APPROVED' ? t('approveSuccess') : t('rejectSuccess'),
      });
      if (status === 'APPROVED') {
        router.replace(ROUTES.HOST.SESSIONS.PLAYERS(sessionId));
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
        icon={<LuUserCheck size={32} />}
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
        onBack={() => router.push(ROUTES.HOST.PENDING_JOIN_REQUESTS)}
      />
    );
  }

  return (
    <Box px={{ base: 4, md: 6 }} py={6} maxW="container.sm" mx="auto">
      <RequestDetailCard
        accent="orange"
        icon={<LuUserCheck size={28} />}
        title={request.name || `#${request.playerNumber}`}
        badges={
          <Badge colorPalette="orange" size="sm">
            {t('approvalPending')}
          </Badge>
        }
      >
        <RequestInfoList>
          {/* Session */}
          <RequestInfoRow
            icon={<LuActivity size={16} />}
            label={t('approvalSession')}
            value={request.session.name}
          />

          {/* Time */}
          <RequestInfoRow
            icon={<LuCalendarClock size={16} />}
            label={t('approvalTime')}
            value={`${dayjs(request.session.startTime).format('dddd, DD/MM/YYYY')} · ${formatTimeByDevicePreference(request.session.startTime)}`}
          />

          {/* Venue */}
          {request.session.venue?.name && (
            <RequestInfoRow
              icon={<LuMapPin size={16} />}
              label={t('approvalVenue')}
              value={formatVenueName(
                request.session.venue.name,
                tVenue('nameFormat', { name: '{name}' })
              )}
            />
          )}

          {/* Level */}
          {request.level != null && (
            <RequestInfoRow
              icon={<LuGauge size={16} />}
              label={t('approvalLevel')}
            >
              <Badge colorPalette="purple" size="sm">
                {tCommon(`levels.${request.level}`)} (Lvl {request.level})
              </Badge>
            </RequestInfoRow>
          )}

          {/* Slot count — shown when user registered multiple slots */}
          {sameUserPlayerIds.length > 1 && (
            <RequestInfoRow
              icon={<LuHash size={16} />}
              label={t('approvalSlotCount')}
              value={`${sameUserPlayerIds.length} slot`}
            />
          )}

          {/* Player Number */}
          <RequestInfoRow
            icon={<LuHash size={16} />}
            label={t('approvalPlayer')}
          >
            <Text fontSize="sm" fontWeight="medium">
              #{request.playerNumber}
              {sameUserPlayerIds.length > 1 && (
                <Text as="span" fontSize="xs" color="gray.400" ml={1}>
                  ({sameUserPlayerIds.indexOf(request.id) + 1}/
                  {sameUserPlayerIds.length})
                </Text>
              )}
            </Text>
          </RequestInfoRow>

          {/* Phone */}
          {request.phone && (
            <RequestInfoRow
              icon={<LuPhone size={16} />}
              label={t('approvalPhone')}
              value={request.phone}
            />
          )}

          {/* Desire / Note */}
          {request.desire && (
            <RequestInfoRow
              icon={<LuMessageSquare size={16} />}
              label={t('approvalNote')}
              value={request.desire}
            />
          )}

          {/* Gender */}
          {request.gender && (
            <RequestInfoRow
              icon={<LuUser size={16} />}
              label={t('approvalGender')}
              value={tCommon(request.gender.toLowerCase())}
            />
          )}
        </RequestInfoList>
      </RequestDetailCard>

      <RequestActionBar
        rejectLabel={t('reject')}
        approveLabel={t('approve')}
        onReject={() => handleAction('REJECTED')}
        onApprove={() => handleAction('APPROVED')}
        loadingAction={actionLoading}
      />
    </Box>
  );
};

export default function ApprovalDetailPage() {
  const t = useTranslations('notification');

  return (
    <ProtectedRouteGuard>
      <Suspense>
        <PageLayout
          title={t('sessionRequestDetailTitle')}
          showBackButton
          backHref={ROUTES.HOST.PENDING_JOIN_REQUESTS}
        >
          <ApprovalDetailContent />
        </PageLayout>
      </Suspense>
    </ProtectedRouteGuard>
  );
}
