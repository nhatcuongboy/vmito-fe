'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { Badge, Box, HStack, Text, VStack } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { useFormatter, useTranslations } from 'next-intl';
import {
  LuBadgeCheck,
  LuExternalLink,
  LuMail,
  LuMessageSquareText,
  LuReply,
  LuUsers,
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
import { ClubsService } from '@/lib/api/clubs.service';
import { RatingService } from '@/lib/api/rating.service';
import { UserRatingStats } from '@/lib/api/types';
import { EJoinRequestStatus, IClub, IClubJoinRequest } from '@/types/club';
import { toaster } from '@/components/ui/toaster';
import { Link, useRouter } from '@/i18n/config';
import dayjs from '@/lib/dayjs';
import { formatTimeByDevicePreference } from '@/utils/time-helpers';
import { useParams } from 'next/navigation';
import { ROUTES } from '@/constants';
import { useConfirmAction } from '@/hooks/useConfirmAction';

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
  const tClubs = useTranslations('clubs');
  const format = useFormatter();
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string;
  const requestId = params.requestId as string;

  const [request, setRequest] = useState<IClubJoinRequest | null>(null);
  const [club, setClub] = useState<IClub | null>(null);
  const [ratingStats, setRatingStats] = useState<UserRatingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const confirmAction = useConfirmAction<'APPROVED' | 'REJECTED'>();

  const fetchRequest = useCallback(async () => {
    try {
      setIsLoading(true);
      const [found, foundClub] = await Promise.all([
        ClubsService.getJoinRequestById(clubId, requestId),
        ClubsService.getClub(clubId).catch(() => null),
      ]);
      setRequest(found);
      setClub(foundClub);
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

  // Best-effort: only shown if the requester has a rated history as a player
  useEffect(() => {
    const userId = request?.user?.id;
    if (!userId) {
      setRatingStats(null);
      return;
    }
    RatingService.getUserRatingStats(userId)
      .then(setRatingStats)
      .catch(() => setRatingStats(null));
  }, [request?.user?.id]);

  const handleConfirmAction = () => {
    confirmAction.run(async (status) => {
      if (status === 'APPROVED') {
        await ClubsService.approveJoinRequest(clubId, requestId);
      } else {
        await ClubsService.rejectJoinRequest(clubId, requestId);
      }
      toaster.success({
        title: status === 'APPROVED' ? t('approveSuccess') : t('rejectSuccess'),
      });
      router.replace(ROUTES.HOST.CLUBS.MEMBERS(clubId, 'requests'));
    }, t('approvalActionFailed'));
  };

  if (isLoading) {
    return <AppRequestDetailSkeleton infoRowCount={3} />;
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

  const isPending = request.status === EJoinRequestStatus.PENDING;
  const statusBadge = STATUS_BADGES[request.status];

  const profileHref = request.user?.id
    ? ROUTES.USER.PROFILE(request.user.id)
    : undefined;

  const genderLabel = request.user.gender
    ? tCommon(request.user.gender.toLowerCase())
    : null;
  const ratingCount =
    ratingStats?.asPlayerCount ?? ratingStats?.totalRatings ?? 0;
  const ratingAvg = ratingStats?.asPlayerAverage ?? ratingStats?.averageRating;
  const ratingLabel =
    ratingCount > 0 && ratingAvg != null ? `★ ${ratingAvg.toFixed(1)}` : null;
  const sessionsPlayedLabel =
    request.sessionsPlayedCount && request.sessionsPlayedCount > 0
      ? t('approvalSessionsPlayedCount', { count: request.sessionsPlayedCount })
      : null;
  const memberSinceLabel = request.user.createdAt
    ? t('approvalMemberSince', {
        year: dayjs(request.user.createdAt).format('YYYY'),
      })
    : null;
  const summaryLine = [
    genderLabel,
    ratingLabel,
    sessionsPlayedLabel,
    memberSinceLabel,
  ]
    .filter(Boolean)
    .join(' • ');

  const submittedFull = `${format.dateTime(new Date(request.createdAt), {
    dateStyle: 'full',
  })} · ${formatTimeByDevicePreference(request.createdAt)}`;
  const submittedText = `${t('approvalSubmittedPrefix')} ${dayjs(request.createdAt).fromNow()}`;

  const isEmailVerified = Boolean(request.user.emailVerified);

  return (
    <Box px={{ base: 4, md: 0 }} py={6} maxW="3xl" w="full" mx="auto">
      <AppRequestApplicantCard
        name={request.user.name}
        image={request.user.image}
        status={
          <Badge colorPalette={statusBadge.palette} size="sm">
            {t(statusBadge.labelKey as Parameters<typeof t>[0])}
          </Badge>
        }
        summary={summaryLine ? <Text>{summaryLine}</Text> : undefined}
        submittedText={submittedText}
        submittedTitle={submittedFull}
        profileHref={profileHref}
        profileLabel={t('approvalViewProfile')}
      >
        <RequestInfoList>
          <RequestInfoRow
            icon={<LuUsers size={17} aria-hidden="true" />}
            label={t('approvalClub')}
          >
            <HStack gap={3} justify="space-between" w="full" minW={0}>
              <Text fontSize="sm" fontWeight="semibold" lineClamp={2}>
                {club?.name ?? request.club?.name ?? t('unknownClub')}
              </Text>
              <Link href={ROUTES.HOST.CLUBS.DETAIL(clubId)}>
                <HStack
                  as="span"
                  gap={1}
                  minH="40px"
                  px={2}
                  color="green.600"
                  fontSize="sm"
                  fontWeight="semibold"
                  whiteSpace="nowrap"
                  borderRadius="md"
                  _dark={{ color: 'green.300' }}
                  _hover={{ bg: 'green.50', _dark: { bg: 'green.900/30' } }}
                >
                  {tClubs('clubDetails')}
                  <LuExternalLink size={14} aria-hidden="true" />
                </HStack>
              </Link>
            </HStack>
          </RequestInfoRow>
          {request.user.email && (
            <RequestInfoRow
              icon={<LuMail size={17} aria-hidden="true" />}
              label={t('approvalEmail')}
            >
              <VStack align="stretch" gap={1} minW={0}>
                <Text fontSize="sm" fontWeight="medium" wordBreak="break-word">
                  {request.user.email}
                </Text>
                <HStack
                  gap={1.5}
                  color={isEmailVerified ? 'green.600' : 'orange.600'}
                  _dark={{
                    color: isEmailVerified ? 'green.300' : 'orange.300',
                  }}
                >
                  <LuBadgeCheck size={14} aria-hidden="true" />
                  <Text fontSize="xs">
                    {isEmailVerified
                      ? t('approvalEmailVerified')
                      : t('approvalEmailNotVerified')}
                  </Text>
                </HStack>
              </VStack>
            </RequestInfoRow>
          )}
          {request.message && (
            <RequestInfoRow
              icon={<LuMessageSquareText size={17} aria-hidden="true" />}
              label={t('approvalMessage')}
            >
              <Text fontSize="sm" whiteSpace="pre-wrap" wordBreak="break-word">
                {request.message}
              </Text>
            </RequestInfoRow>
          )}
          {!isPending && request.response && (
            <RequestInfoRow
              icon={<LuReply size={17} aria-hidden="true" />}
              label={t('approvalResponse')}
            >
              <Text fontSize="sm" whiteSpace="pre-wrap" wordBreak="break-word">
                {request.response}
              </Text>
            </RequestInfoRow>
          )}
        </RequestInfoList>
      </AppRequestApplicantCard>

      {isPending && (
        <RequestActionBar
          rejectLabel={t('reject')}
          approveLabel={t('approve')}
          onReject={() => confirmAction.request('REJECTED')}
          onApprove={() => confirmAction.request('APPROVED')}
          loadingAction={confirmAction.isRunning ? confirmAction.target : null}
        />
      )}

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
