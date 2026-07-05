'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { Badge, Box, Flex, Text, VStack } from '@chakra-ui/react';
import { Card, CardBody } from '@/components/ui/chakra-compat';
import { isAxiosError } from 'axios';
import { useTranslations } from 'next-intl';
import { LuUsers } from 'react-icons/lu';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import PageLayout from '@/components/layout/PageLayout';
import PostAvatar from '@/components/post/PostAvatar';
import {
  RequestActionBar,
  RequestCompletedState,
  RequestLoadingState,
  RequestNotFoundState,
} from '@/components/request-detail';
import { ClubsService } from '@/lib/api/clubs.service';
import { RatingService } from '@/lib/api/rating.service';
import { UserRatingStats } from '@/lib/api/types';
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
  const [ratingStats, setRatingStats] = useState<UserRatingStats | null>(null);
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

  const goToProfile = request.user?.id
    ? () => router.push(ROUTES.USER.PROFILE(request.user.id))
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

  const submittedFull = `${dayjs(request.createdAt).format('dddd, DD/MM/YYYY')} · ${formatTimeByDevicePreference(request.createdAt)}`;
  const submittedText = `${t('approvalSubmittedPrefix')} ${dayjs(request.createdAt).fromNow()}`;

  const emailVerified = request.user.emailVerified
    ? true
    : request.user.emailVerified === null
      ? false
      : undefined;

  return (
    <Box px={{ base: 4, md: 6 }} py={6} maxW="container.sm" mx="auto">
      <Card mb={3}>
        <CardBody px={4} py={4}>
          <VStack align="stretch" gap={3}>
            {/* Requester info */}
            <Flex align="flex-start" gap={3}>
              <Box
                onClick={goToProfile}
                cursor={goToProfile ? 'pointer' : 'default'}
              >
                <PostAvatar
                  name={request.user.name}
                  image={request.user.image}
                  size={48}
                />
              </Box>
              <Box flex={1} minW={0}>
                <Flex justify="space-between" align="center" gap={2}>
                  <Text
                    fontWeight="bold"
                    fontSize="md"
                    lineClamp={1}
                    onClick={goToProfile}
                    cursor={goToProfile ? 'pointer' : 'default'}
                    _hover={
                      goToProfile ? { textDecoration: 'underline' } : undefined
                    }
                  >
                    {request.user.name}
                  </Text>
                  <Badge
                    colorPalette={statusBadge.palette}
                    size="sm"
                    flexShrink={0}
                  >
                    {t(statusBadge.labelKey as Parameters<typeof t>[0])}
                  </Badge>
                </Flex>
                {summaryLine && (
                  <Text
                    fontSize="sm"
                    color="gray.600"
                    _dark={{ color: 'gray.400' }}
                    mt={0.5}
                  >
                    {summaryLine}
                  </Text>
                )}
                <Text fontSize="xs" color="gray.400" title={submittedFull}>
                  {submittedText}
                </Text>
              </Box>
            </Flex>

            {/* Email + verification, reason for joining, host response */}
            {(request.user.email ||
              request.message ||
              (!isPending && request.response)) && (
              <VStack
                align="stretch"
                gap={3}
                pt={3}
                borderTopWidth="1px"
                borderColor="gray.100"
                _dark={{ borderColor: 'whiteAlpha.100' }}
              >
                {request.user.email && (
                  <Box>
                    <Text fontSize="xs" color="gray.500">
                      {t('approvalEmail')}
                    </Text>
                    <Text
                      fontSize="sm"
                      color="gray.700"
                      _dark={{ color: 'gray.300' }}
                    >
                      {request.user.email}
                    </Text>
                    {emailVerified !== undefined && (
                      <Text
                        fontSize="xs"
                        mt={0.5}
                        color={emailVerified ? 'green.600' : 'orange.600'}
                        _dark={{
                          color: emailVerified ? 'green.300' : 'orange.300',
                        }}
                      >
                        {emailVerified
                          ? `✓ ${t('approvalEmailVerified')}`
                          : `⚠ ${t('approvalEmailNotVerified')}`}
                      </Text>
                    )}
                  </Box>
                )}

                {request.message && (
                  <Box>
                    <Text fontSize="xs" color="gray.500">
                      {t('approvalMessage')}
                    </Text>
                    <Text
                      fontSize="sm"
                      fontStyle="italic"
                      color="gray.700"
                      _dark={{ color: 'gray.300' }}
                    >
                      &ldquo;{request.message}&rdquo;
                    </Text>
                  </Box>
                )}

                {!isPending && request.response && (
                  <Box>
                    <Text fontSize="xs" color="gray.500">
                      {t('approvalResponse')}
                    </Text>
                    <Text
                      fontSize="sm"
                      color="gray.700"
                      _dark={{ color: 'gray.300' }}
                    >
                      {request.response}
                    </Text>
                  </Box>
                )}
              </VStack>
            )}
          </VStack>
        </CardBody>
      </Card>

      {goToProfile && (
        <Flex justify="center" mb={3}>
          <Text
            as="span"
            cursor="pointer"
            fontSize="sm"
            fontWeight="medium"
            color="teal.600"
            _dark={{ color: 'teal.300' }}
            onClick={goToProfile}
          >
            {t('approvalViewProfile')}
          </Text>
        </Flex>
      )}

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
