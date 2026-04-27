'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import {
  Box,
  Badge,
  Flex,
  Text,
  Spinner,
  Center,
  VStack,
  HStack,
  EmptyState,
} from '@chakra-ui/react';
import { Button, Card, CardBody } from '@/components/ui/chakra-compat';
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
  LuArrowLeft,
  LuActivity,
  LuUser,
} from 'react-icons/lu';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import PageLayout from '@/components/layout/PageLayout';
import { PlayerService } from '@/lib/api/player.service';
import { PendingRequest } from '@/lib/api/types';
import { toaster } from '@/components/ui/toaster';
import { useRouter } from '@/i18n/config';
import dayjs from '@/lib/dayjs';
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
      const result = await PlayerService.getPendingRequests({ limit: 100 });
      const found = result.data.find(
        (r) => r.id === playerId && r.sessionId === sessionId
      );
      setRequest(found || null);
      // Collect all slots of the same user in the same session
      // Prefer createdByUserId (who registered), fallback to userId
      const groupId = found?.createdByUserId ?? found?.userId;
      if (found && groupId) {
        const ids = result.data
          .filter(
            (r) =>
              (r.createdByUserId ?? r.userId) === groupId &&
              r.sessionId === found.sessionId
          )
          .map((r) => r.id);
        setSameUserPlayerIds(ids);
      } else {
        setSameUserPlayerIds(found ? [found.id] : []);
      }
    } catch {
      toaster.error({ title: tCommon('error') });
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
      setIsActioned(true);
      toaster.success({
        title: status === 'APPROVED' ? t('approveSuccess') : t('rejectSuccess'),
      });
    } catch {
      toaster.error({ title: t('approvalActionFailed') });
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <Center py={20}>
        <Spinner size="lg" />
      </Center>
    );
  }

  if (!request) {
    return (
      <Center py={20}>
        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Indicator>
              <LuUserCheck size={32} />
            </EmptyState.Indicator>
            <EmptyState.Title>{t('approvalNotFound')}</EmptyState.Title>
            <EmptyState.Description>
              {t('approvalNotFoundDescription')}
            </EmptyState.Description>
          </EmptyState.Content>
        </EmptyState.Root>
      </Center>
    );
  }

  if (isActioned) {
    return (
      <Center py={20}>
        <VStack gap={4}>
          <Box
            w="64px"
            h="64px"
            borderRadius="full"
            bg="green.100"
            display="flex"
            alignItems="center"
            justifyContent="center"
            color="green.600"
          >
            <LuUserCheck size={32} />
          </Box>
          <Text fontSize="lg" fontWeight="semibold" textAlign="center">
            {t('approvalActionCompleted')}
          </Text>
          <Button
            variant="outline"
            onClick={() => router.push(ROUTES.HOST.PENDING_JOIN_REQUESTS)}
          >
            <LuArrowLeft size={16} style={{ marginRight: '6px' }} />
            {tCommon('back')}
          </Button>
        </VStack>
      </Center>
    );
  }

  return (
    <Box px={{ base: 4, md: 6 }} py={6} maxW="container.sm" mx="auto">
      {/* Player Info Card */}
      <Card mb={4}>
        <CardBody>
          <VStack gap={4} align="stretch">
            {/* Header */}
            <HStack gap={4} align="center">
              <Box
                w="56px"
                h="56px"
                borderRadius="full"
                bg="orange.100"
                _dark={{ bg: 'rgba(251,146,60,0.2)' }}
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="orange.600"
                flexShrink={0}
              >
                <LuUserCheck size={28} />
              </Box>
              <VStack align="start" gap={0.5}>
                <Text fontSize="xl" fontWeight="bold">
                  {request.name}
                </Text>
                <Badge colorPalette="orange" size="sm">
                  {t('approvalPending')}
                </Badge>
              </VStack>
            </HStack>

            {/* Details */}
            <VStack
              gap={3}
              align="stretch"
              bg="gray.50"
              _dark={{ bg: 'whiteAlpha.50' }}
              borderRadius="lg"
              p={4}
            >
              {/* Session */}
              <HStack gap={3}>
                <LuActivity size={16} color="gray" />
                <VStack align="start" gap={0}>
                  <Text fontSize="xs" color="gray.500">
                    {t('approvalSession')}
                  </Text>
                  <Text fontSize="sm" fontWeight="medium">
                    {request.session.name}
                  </Text>
                </VStack>
              </HStack>

              {/* Time */}
              <HStack gap={3}>
                <LuCalendarClock size={16} color="gray" />
                <VStack align="start" gap={0}>
                  <Text fontSize="xs" color="gray.500">
                    {t('approvalTime')}
                  </Text>
                  <Text fontSize="sm" fontWeight="medium">
                    {dayjs(request.session.startTime).format(
                      'dddd, DD/MM/YYYY · HH:mm'
                    )}
                  </Text>
                </VStack>
              </HStack>

              {/* Venue */}
              {request.session.venue?.name && (
                <HStack gap={3}>
                  <LuMapPin size={16} color="gray" />
                  <VStack align="start" gap={0}>
                    <Text fontSize="xs" color="gray.500">
                      {t('approvalVenue')}
                    </Text>
                    <Text fontSize="sm" fontWeight="medium">
                      {formatVenueName(
                        request.session.venue.name,
                        tVenue('nameFormat', { name: '{name}' })
                      )}
                    </Text>
                  </VStack>
                </HStack>
              )}

              {/* Level */}
              {request.level != null && (
                <HStack gap={3}>
                  <LuGauge size={16} color="gray" />
                  <VStack align="start" gap={0}>
                    <Text fontSize="xs" color="gray.500">
                      {t('approvalLevel')}
                    </Text>
                    <Badge colorPalette="purple" size="sm">
                      {tCommon(`levels.${request.level}`)} (Lvl {request.level})
                    </Badge>
                  </VStack>
                </HStack>
              )}

              {/* Slot count — shown when user registered multiple slots */}
              {sameUserPlayerIds.length > 1 && (
                <HStack gap={3}>
                  <LuHash size={16} color="gray" />
                  <VStack align="start" gap={0}>
                    <Text fontSize="xs" color="gray.500">
                      {t('approvalSlotCount')}
                    </Text>
                    <Text fontSize="sm" fontWeight="medium">
                      {sameUserPlayerIds.length} slot
                    </Text>
                  </VStack>
                </HStack>
              )}

              {/* Player Number */}
              <HStack gap={3}>
                <LuHash size={16} color="gray" />
                <VStack align="start" gap={0}>
                  <Text fontSize="xs" color="gray.500">
                    {t('approvalPlayer')}
                  </Text>
                  <Text fontSize="sm" fontWeight="medium">
                    #{request.playerNumber}
                    {sameUserPlayerIds.length > 1 && (
                      <Text as="span" fontSize="xs" color="gray.400" ml={1}>
                        ({sameUserPlayerIds.indexOf(request.id) + 1}/
                        {sameUserPlayerIds.length})
                      </Text>
                    )}
                  </Text>
                </VStack>
              </HStack>

              {/* Phone */}
              {request.phone && (
                <HStack gap={3}>
                  <LuPhone size={16} color="gray" />
                  <VStack align="start" gap={0}>
                    <Text fontSize="xs" color="gray.500">
                      {t('approvalPhone')}
                    </Text>
                    <Text fontSize="sm" fontWeight="medium">
                      {request.phone}
                    </Text>
                  </VStack>
                </HStack>
              )}

              {/* Desire / Note */}
              {request.desire && (
                <HStack gap={3} align="start">
                  <Box mt={0.5}>
                    <LuMessageSquare size={16} color="gray" />
                  </Box>
                  <VStack align="start" gap={0}>
                    <Text fontSize="xs" color="gray.500">
                      {t('approvalNote')}
                    </Text>
                    <Text fontSize="sm" fontWeight="medium">
                      {request.desire}
                    </Text>
                  </VStack>
                </HStack>
              )}

              {/* Gender */}
              {request.gender && (
                <HStack gap={3}>
                  <LuUser size={16} color="gray" />
                  <VStack align="start" gap={0}>
                    <Text fontSize="xs" color="gray.500">
                      {t('approvalGender')}
                    </Text>
                    <Text fontSize="sm" fontWeight="medium">
                      {tCommon(request.gender.toLowerCase())}
                    </Text>
                  </VStack>
                </HStack>
              )}
            </VStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Action Buttons */}
      <Flex gap={3}>
        <Button
          flex={1}
          size="lg"
          colorPalette="red"
          variant="outline"
          onClick={() => handleAction('REJECTED')}
          loading={actionLoading === 'REJECTED'}
          disabled={actionLoading !== null}
        >
          {t('reject')}
        </Button>
        <Button
          flex={1}
          size="lg"
          colorPalette="green"
          onClick={() => handleAction('APPROVED')}
          loading={actionLoading === 'APPROVED'}
          disabled={actionLoading !== null}
        >
          {t('approve')}
        </Button>
      </Flex>
    </Box>
  );
};

export default function ApprovalDetailPage() {
  const t = useTranslations('notification');

  return (
    <ProtectedRouteGuard>
      <Suspense>
        <PageLayout
          title={t('approvalDetailTitle')}
          showBackButton
          backHref={ROUTES.HOST.PENDING_JOIN_REQUESTS}
        >
          <ApprovalDetailContent />
        </PageLayout>
      </Suspense>
    </ProtectedRouteGuard>
  );
}
