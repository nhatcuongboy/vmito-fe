'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { Badge, Box, HStack, Text, VStack } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { useFormatter, useTranslations } from 'next-intl';
import { formatVenueName } from '@/utils';
import {
  LuUserCheck,
  LuCalendarClock,
  LuMapPin,
  LuTarget,
  LuActivity,
  LuExternalLink,
} from 'react-icons/lu';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import PageLayout from '@/components/layout/PageLayout';
import {
  AppRequestApplicantCard,
  AppRequestDetailSkeleton,
  RequestActionBar,
  RequestInfoList,
  RequestInfoRow,
  RequestNotFoundState,
} from '@/components/request-detail';
import AppConfirmDialog from '@/components/ui/AppConfirmDialog';
import { PlayerService } from '@/lib/api/player.service';
import { RatingService } from '@/lib/api/rating.service';
import { PendingRequest, UserRatingStats } from '@/lib/api/types';
import { toaster } from '@/components/ui/toaster';
import { Link, useRouter } from '@/i18n/config';
import dayjs from '@/lib/dayjs';
import { formatTimeByDevicePreference } from '@/utils/time-helpers';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { useParams } from 'next/navigation';
import { ROUTES } from '@/constants';
import { useConfirmAction } from '@/hooks/useConfirmAction';

const ApprovalDetailContent = () => {
  const t = useTranslations('notification');
  const tCommon = useTranslations('common');
  const tVenue = useTranslations('venue');
  const format = useFormatter();
  const { getLevelLabel } = useLevelLabel();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;
  const playerId = params.playerId as string;

  const [request, setRequest] = useState<PendingRequest | null>(null);
  const [sameUserPlayerIds, setSameUserPlayerIds] = useState<string[]>([]);
  const [sessionsPlayedCount, setSessionsPlayedCount] = useState(0);
  const [ratingStats, setRatingStats] = useState<UserRatingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const confirmAction = useConfirmAction<'APPROVED' | 'REJECTED'>();

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
      setSessionsPlayedCount(found.sessionsPlayedCount ?? 0);
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

  // Best-effort: only shown if the requester has a rated history as a player
  useEffect(() => {
    const userId = request?.userId;
    if (!userId) {
      setRatingStats(null);
      return;
    }
    RatingService.getUserRatingStats(userId)
      .then(setRatingStats)
      .catch(() => setRatingStats(null));
  }, [request?.userId]);

  const handleConfirmAction = () => {
    confirmAction.run(async (status) => {
      const ids = sameUserPlayerIds.length > 0 ? sameUserPlayerIds : [playerId];
      await PlayerService.batchUpdateStatus(ids, status);
      toaster.success({
        title: status === 'APPROVED' ? t('approveSuccess') : t('rejectSuccess'),
      });
      router.replace(ROUTES.HOST.PENDING_JOIN_REQUESTS);
    }, t('approvalActionFailed'));
  };

  if (isLoading) {
    return <AppRequestDetailSkeleton />;
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

  const requesterName =
    request.user?.name || request.name || tCommon('unknown');
  const profileHref = request.userId
    ? ROUTES.USER.PROFILE(request.userId)
    : undefined;

  const genderLabel = request.gender
    ? tCommon(request.gender.toLowerCase())
    : null;
  const levelLabel =
    request.level != null
      ? `${getLevelLabel(request.level)} (Lvl ${request.level})`
      : null;
  const summaryLine = [genderLabel, levelLabel].filter(Boolean).join(' • ');

  const ratingCount =
    ratingStats?.asPlayerCount ?? ratingStats?.totalRatings ?? 0;
  const ratingAvg = ratingStats?.asPlayerAverage ?? ratingStats?.averageRating;
  const sessionsPlayedLabel =
    sessionsPlayedCount > 0
      ? t('approvalSessionsPlayedCount', { count: sessionsPlayedCount })
      : null;
  const ratingLabel =
    ratingCount > 0 && ratingAvg != null ? `★ ${ratingAvg.toFixed(1)}` : null;
  const statsLine = [sessionsPlayedLabel, ratingLabel]
    .filter(Boolean)
    .join(' • ');

  const submittedText = request.createdAt
    ? `${t('approvalSubmittedPrefix')} ${dayjs(request.createdAt).fromNow()}`
    : null;

  const slotIndexSuffix =
    sameUserPlayerIds.length > 1
      ? ` (${sameUserPlayerIds.indexOf(request.id) + 1}/${sameUserPlayerIds.length})`
      : '';
  const sessionDate = format.dateTime(new Date(request.session.startTime), {
    dateStyle: 'full',
  });

  return (
    <Box px={{ base: 4, md: 0 }} py={6} maxW="3xl" w="full" mx="auto">
      <AppRequestApplicantCard
        name={requesterName}
        image={request.user?.image}
        status={
          <Badge colorPalette="orange" size="sm">
            {t('approvalPending')}
          </Badge>
        }
        summary={
          <VStack align="stretch" gap={0.5}>
            {summaryLine && <Text>{summaryLine}</Text>}
            {statsLine && <Text>{statsLine}</Text>}
          </VStack>
        }
        submittedText={submittedText}
        profileHref={profileHref}
        profileLabel={t('approvalViewProfile')}
      >
        <RequestInfoList>
          <RequestInfoRow
            icon={<LuActivity size={17} aria-hidden="true" />}
            label={t('approvalSession')}
          >
            <Link
              href={ROUTES.HOST.SESSIONS.DETAIL(request.session.id)}
              aria-label={t('approvalViewSession', {
                name: request.session.name,
              })}
            >
              <HStack
                as="span"
                gap={1.5}
                minH="40px"
                color="green.700"
                borderRadius="md"
                _dark={{ color: 'green.300' }}
                _hover={{ textDecoration: 'underline' }}
                _focusVisible={{
                  outline: '2px solid',
                  outlineColor: 'green.500',
                  outlineOffset: '2px',
                }}
              >
                <Text as="span" fontSize="md" fontWeight="bold" lineClamp={2}>
                  {request.session.name}
                </Text>
                <LuExternalLink size={15} aria-hidden="true" />
              </HStack>
            </Link>
          </RequestInfoRow>
          <RequestInfoRow
            icon={<LuCalendarClock size={17} aria-hidden="true" />}
            label={t('approvalTime')}
            value={`${sessionDate} · ${formatTimeByDevicePreference(request.session.startTime)}`}
          />
          {request.session.venue?.name && (
            <RequestInfoRow
              icon={<LuMapPin size={17} aria-hidden="true" />}
              label={t('approvalVenue')}
              value={formatVenueName(
                request.session.venue.name,
                tVenue('nameFormat', { name: '{name}' })
              )}
            />
          )}
          <RequestInfoRow
            icon={<LuTarget size={17} aria-hidden="true" />}
            label={t('approvalPlayer')}
            value={`#${request.playerNumber}${slotIndexSuffix}`}
          />
        </RequestInfoList>
      </AppRequestApplicantCard>

      <RequestActionBar
        rejectLabel={t('reject')}
        approveLabel={t('approve')}
        onReject={() => confirmAction.request('REJECTED')}
        onApprove={() => confirmAction.request('APPROVED')}
        loadingAction={confirmAction.isRunning ? confirmAction.target : null}
      />

      <AppConfirmDialog
        isOpen={confirmAction.target !== null}
        title={
          confirmAction.target === 'APPROVED'
            ? t('confirmApproveTitle')
            : t('confirmRejectTitle')
        }
        body={
          confirmAction.target === 'APPROVED'
            ? t('confirmApproveDescription')
            : t('confirmRejectDescription')
        }
        confirmLabel={
          confirmAction.target === 'APPROVED' ? t('approve') : t('reject')
        }
        cancelLabel={tCommon('cancel')}
        colorPalette={confirmAction.target === 'APPROVED' ? 'green' : 'red'}
        isLoading={confirmAction.isRunning}
        error={confirmAction.error}
        onConfirm={handleConfirmAction}
        onClose={confirmAction.close}
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
          title={t('approvalPageTitle')}
          showBackButton
          backHref={ROUTES.HOST.PENDING_JOIN_REQUESTS}
        >
          <ApprovalDetailContent />
        </PageLayout>
      </Suspense>
    </ProtectedRouteGuard>
  );
}
