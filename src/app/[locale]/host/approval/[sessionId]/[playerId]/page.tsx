'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { Badge, Box, Flex, HStack, Text, VStack } from '@chakra-ui/react';
import { Card, CardBody } from '@/components/ui/chakra-compat';
import { isAxiosError } from 'axios';
import { useTranslations } from 'next-intl';
import { formatVenueName } from '@/utils';
import {
  LuUserCheck,
  LuCalendarClock,
  LuMapPin,
  LuTarget,
  LuActivity,
  LuCheck,
  LuX,
} from 'react-icons/lu';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import PageLayout from '@/components/layout/PageLayout';
import PostAvatar from '@/components/post/PostAvatar';
import {
  RequestActionBar,
  RequestCompletedState,
  RequestLoadingState,
  RequestNotFoundState,
} from '@/components/request-detail';
import { PlayerService } from '@/lib/api/player.service';
import { RatingService } from '@/lib/api/rating.service';
import { PendingRequest, UserRatingStats } from '@/lib/api/types';
import { toaster } from '@/components/ui/toaster';
import { useRouter } from '@/i18n/config';
import dayjs from '@/lib/dayjs';
import { formatTimeByDevicePreference } from '@/utils/time-helpers';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { useParams } from 'next/navigation';
import { ROUTES } from '@/constants';
import type { ReactNode } from 'react';

// Single-line "icon + label: value" row used for the compact session-info
// section. `strong` bumps the value's visual weight for time/venue, which
// matter most to a host deciding whether to approve.
const InfoLine = ({
  icon,
  label,
  value,
  strong = false,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  strong?: boolean;
}) => (
  <HStack gap={2} align="start">
    <Box color="gray.400" mt="2px" flexShrink={0}>
      {icon}
    </Box>
    <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
      {label}:{' '}
      <Text
        as="span"
        fontWeight={strong ? 'semibold' : 'medium'}
        color={strong ? 'gray.900' : 'gray.700'}
        _dark={{ color: strong ? 'white' : 'gray.200' }}
      >
        {value}
      </Text>
    </Text>
  </HStack>
);

const ApprovalDetailContent = () => {
  const t = useTranslations('notification');
  const tCommon = useTranslations('common');
  const tVenue = useTranslations('venue');
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

  const requesterName =
    request.user?.name || request.name || tCommon('unknown');
  const goToProfile = request.userId
    ? () => router.push(ROUTES.USER.PROFILE(request.userId!))
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

  return (
    <Box px={{ base: 4, md: 6 }} py={6} maxW="container.sm" mx="auto">
      <Card mb={4}>
        <CardBody px={4} py={4}>
          <VStack align="stretch" gap={3}>
            {/* Requester info */}
            <Flex align="flex-start" gap={3}>
              <Box
                onClick={goToProfile}
                cursor={goToProfile ? 'pointer' : 'default'}
              >
                <PostAvatar
                  name={requesterName}
                  image={request.user?.image}
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
                    {requesterName}
                  </Text>
                  <Badge colorPalette="orange" size="sm" flexShrink={0}>
                    {t('approvalPending')}
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
                {statsLine && (
                  <Text
                    fontSize="sm"
                    color="gray.600"
                    _dark={{ color: 'gray.400' }}
                  >
                    {statsLine}
                  </Text>
                )}
                <Flex
                  align="center"
                  justify="space-between"
                  mt={1}
                  gap={2}
                  wrap="wrap"
                >
                  {submittedText && (
                    <Text fontSize="xs" color="gray.400">
                      {submittedText}
                    </Text>
                  )}
                  {goToProfile && (
                    <Text
                      as="span"
                      cursor="pointer"
                      fontSize="xs"
                      fontWeight="medium"
                      color="teal.600"
                      _dark={{ color: 'teal.300' }}
                      onClick={goToProfile}
                    >
                      {t('approvalViewProfile')}
                    </Text>
                  )}
                </Flex>
              </Box>
            </Flex>

            {/* Session info */}
            <VStack
              align="stretch"
              gap={2}
              pt={3}
              borderTopWidth="1px"
              borderColor="gray.100"
              _dark={{ borderColor: 'whiteAlpha.100' }}
            >
              <InfoLine
                icon={<LuActivity size={15} />}
                label={t('approvalSession')}
                value={request.session.name}
              />
              <InfoLine
                icon={<LuCalendarClock size={15} />}
                label={t('approvalTime')}
                strong
                value={`${dayjs(request.session.startTime).format('dddd, DD/MM/YYYY')} · ${formatTimeByDevicePreference(request.session.startTime)}`}
              />
              {request.session.venue?.name && (
                <InfoLine
                  icon={<LuMapPin size={15} />}
                  label={t('approvalVenue')}
                  strong
                  value={formatVenueName(
                    request.session.venue.name,
                    tVenue('nameFormat', { name: '{name}' })
                  )}
                />
              )}
              <InfoLine
                icon={<LuTarget size={15} />}
                label={t('approvalPlayer')}
                value={`#${request.playerNumber}${slotIndexSuffix}`}
              />
            </VStack>
          </VStack>
        </CardBody>
      </Card>

      <RequestActionBar
        rejectLabel={
          <HStack gap={1.5} justify="center">
            <LuX size={16} />
            <Text>{t('reject')}</Text>
          </HStack>
        }
        approveLabel={
          <HStack gap={1.5} justify="center">
            <LuCheck size={16} />
            <Text>{t('approve')}</Text>
          </HStack>
        }
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
