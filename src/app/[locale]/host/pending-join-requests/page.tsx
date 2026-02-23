'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import {
  Box,
  Badge,
  Flex,
  Text,
  Spinner,
  Center,
  EmptyState,
} from '@chakra-ui/react';
import { Button, Card, CardBody } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import { ClipboardCheck } from 'lucide-react';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import TopBar from '@/components/ui/TopBar';
import PageWrapper from '@/components/layout/PageWrapper';
import { PlayerService } from '@/lib/api/player.service';
import { PendingRequest, UserRole } from '@/lib/api/types';
import { toaster } from '@/components/ui/toaster';
import dayjs from '@/lib/dayjs';
import PageLayout from '@/components/layout/PageLayout';

function PendingJoinRequestsContent() {
  const t = useTranslations('common');
  const tSession = useTranslations('session');
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const result = await PlayerService.getPendingRequests({ page, limit });
      setRequests(result.data);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (error) {
      console.error(error);
      toaster.error({ title: t('error') });
    } finally {
      setLoading(false);
    }
  }, [page, t]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAction = async (
    playerId: string,
    sessionId: string,
    status: 'APPROVED' | 'REJECTED'
  ) => {
    try {
      setActionLoading(playerId);
      await PlayerService.updatePlayerStatus(sessionId, playerId, status);
      setRequests((prev) => prev.filter((p) => p.id !== playerId));
      setTotal((prev) => prev - 1);
    } catch (error) {
      console.error(error);
      toaster.error({ title: t('error') });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <Center py={20}>
        <Spinner size="lg" />
      </Center>
    );
  }

  if (requests.length === 0 && total === 0) {
    return (
      <Center py={20}>
        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Indicator>
              <ClipboardCheck size={32} />
            </EmptyState.Indicator>
            <EmptyState.Title>
              {t('noData') || 'No pending requests'}
            </EmptyState.Title>
          </EmptyState.Content>
        </EmptyState.Root>
      </Center>
    );
  }

  return (
    <Box px={{ base: 4, md: 6 }} py={4} maxW="container.md" mx="auto">
      <Text color="fg.muted" mb={4}>
        {t('pendingRequests', { count: total })}
      </Text>

      <Flex direction="column" gap={4}>
        {requests.map((request) => (
          <Card key={request.id}>
            <CardBody>
              <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
                <Box>
                  <Text fontWeight="bold" fontSize="lg">
                    {request.name || t('unknown')}
                  </Text>
                  <Text fontSize="sm" color="fg.muted">
                    {tSession('session')}:{' '}
                    {request.session?.venue?.name || request.session?.name} -{' '}
                    {dayjs(request.session?.startTime).format('MMM D, HH:mm')}
                  </Text>
                  <Flex gap={2} mt={1}>
                    {request.level && (
                      <Badge colorPalette="purple">Level {request.level}</Badge>
                    )}
                    <Badge>Player #{request.playerNumber}</Badge>
                  </Flex>
                </Box>
                <Flex gap={2}>
                  <Button
                    size="sm"
                    colorPalette="red"
                    variant="outline"
                    onClick={() =>
                      handleAction(request.id, request.sessionId, 'REJECTED')
                    }
                    disabled={actionLoading === request.id}
                  >
                    {t('reject')}
                  </Button>
                  <Button
                    size="sm"
                    colorPalette="green"
                    onClick={() =>
                      handleAction(request.id, request.sessionId, 'APPROVED')
                    }
                    loading={actionLoading === request.id}
                  >
                    {t('approve')}
                  </Button>
                </Flex>
              </Flex>
            </CardBody>
          </Card>
        ))}
      </Flex>

      {/* Pagination */}
      {totalPages > 1 && (
        <Flex justify="center" gap={2} mt={6}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            {t('previous') || 'Previous'}
          </Button>
          <Flex align="center" px={3}>
            <Text fontSize="sm">
              {page} / {totalPages}
            </Text>
          </Flex>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            {t('next') || 'Next'}
          </Button>
        </Flex>
      )}
    </Box>
  );
}

export default function PendingJoinRequestsPage() {
  const nav = useTranslations('navigation');

  return (
    <ProtectedRouteGuard>
      <Suspense>
        <PageLayout title={nav('pendingJoinRequests')}>
          <PendingJoinRequestsContent />
        </PageLayout>
      </Suspense>
    </ProtectedRouteGuard>
  );
}
