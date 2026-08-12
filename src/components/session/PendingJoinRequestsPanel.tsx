'use client';

import { DebouncedAppSearchBar } from '@/components/common/DebouncedAppSearchBar';
import { Button, Card, CardBody } from '@/components/ui/chakra-compat';
import { toaster } from '@/components/ui/toaster';
import { useRouter } from '@/i18n/config';
import { PlayerService } from '@/lib/api/player.service';
import { PendingRequest } from '@/lib/api/types';
import dayjs from '@/lib/dayjs';
import { formatTimeByDevicePreference } from '@/utils/time-helpers';
import {
  Badge,
  Box,
  Center,
  EmptyState,
  Flex,
  Spinner,
  Text,
} from '@chakra-ui/react';
import { ChevronRight, ClipboardCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface PendingJoinRequestsPanelProps {
  onCountChange?: (count: number) => void;
  onMutated?: () => void | Promise<void>;
}

export function PendingJoinRequestsPanel({
  onCountChange,
  onMutated,
}: PendingJoinRequestsPanelProps) {
  const router = useRouter();
  const t = useTranslations('common');
  const tSession = useTranslations('session');
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [batchActionLoading, setBatchActionLoading] = useState<string | null>(
    null
  );
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const limit = 20;

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const result = await PlayerService.getPendingRequests({ page, limit });
      setRequests(result.data);
      setTotalPages(result.totalPages);
      setTotal(result.total);
      onCountChange?.(result.total);
    } catch (error) {
      console.error(error);
      toaster.error({ title: t('error') });
    } finally {
      setLoading(false);
    }
  }, [page, t, onCountChange]);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  const filteredRequests = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return requests;
    return requests.filter((request) => {
      const playerNumber = request.playerNumber
        ? `#${request.playerNumber}`
        : '';
      return [
        request.name,
        request.session?.name,
        request.session?.venue?.name,
        playerNumber,
      ].some((value) => value?.toLowerCase().includes(query));
    });
  }, [requests, searchQuery]);

  const updateLocalTotal = (removed: number) => {
    setTotal((current) => {
      const next = Math.max(0, current - removed);
      onCountChange?.(next);
      return next;
    });
  };

  const handleAction = async (
    request: PendingRequest,
    status: 'APPROVED' | 'REJECTED'
  ) => {
    try {
      setActionLoading(request.id);
      await PlayerService.updatePlayerStatus(
        request.sessionId,
        request.id,
        status
      );
      setRequests((current) =>
        current.filter((item) => item.id !== request.id)
      );
      updateLocalTotal(1);
      await onMutated?.();
    } catch (error) {
      console.error(error);
      toaster.error({ title: t('error') });
    } finally {
      setActionLoading(null);
    }
  };

  const handleBatchAction = async (status: 'APPROVED' | 'REJECTED') => {
    if (requests.length === 0) return;
    try {
      setBatchActionLoading(status);
      const playerIds = requests.map((request) => request.id);
      await PlayerService.batchUpdateStatus(playerIds, status);
      setRequests([]);
      updateLocalTotal(playerIds.length);
      toaster.success({ title: t('success') });
      await onMutated?.();
      await fetchRequests();
    } catch (error) {
      console.error(error);
      toaster.error({ title: t('error') });
    } finally {
      setBatchActionLoading(null);
    }
  };

  return (
    <Box minW={0}>
      <Box mb={4} mx={{ base: -4, md: 0 }}>
        <DebouncedAppSearchBar
          value={searchQuery}
          onChange={(query) => setSearchQuery(query)}
          placeholder={tSession('searchJoinRequests')}
          showFilter={false}
        />
      </Box>

      {loading ? (
        <Center py={16}>
          <Spinner size="lg" />
        </Center>
      ) : filteredRequests.length === 0 ? (
        <Center py={16}>
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <ClipboardCheck size={32} />
              </EmptyState.Indicator>
              <EmptyState.Title>
                {tSession('noPendingRequest')}
              </EmptyState.Title>
            </EmptyState.Content>
          </EmptyState.Root>
        </Center>
      ) : (
        <>
          <Flex
            justify="space-between"
            align="center"
            mb={4}
            gap={2}
            wrap="wrap"
          >
            <Text color="fg.muted">
              {t('pendingRequests', { count: total })}
            </Text>
            <Flex gap={2}>
              <Button
                size="sm"
                colorPalette="red"
                variant="outline"
                loading={batchActionLoading === 'REJECTED'}
                disabled={!!batchActionLoading}
                onClick={() => void handleBatchAction('REJECTED')}
              >
                {t('rejectAll')}
              </Button>
              <Button
                size="sm"
                colorPalette="green"
                loading={batchActionLoading === 'APPROVED'}
                disabled={!!batchActionLoading}
                onClick={() => void handleBatchAction('APPROVED')}
              >
                {t('approveAll')}
              </Button>
            </Flex>
          </Flex>

          <Flex direction="column" gap={3}>
            {filteredRequests.map((request) => (
              <Card
                key={request.id}
                cursor="pointer"
                onClick={() =>
                  router.push(
                    `/host/approval/${request.sessionId}/${request.id}`
                  )
                }
                _hover={{ bg: 'blackAlpha.50' }}
              >
                <CardBody>
                  <Flex justify="space-between" align="center" gap={3}>
                    <Box flex={1} minW={0}>
                      <Text fontWeight="bold" truncate>
                        {request.name || t('unknown')}
                      </Text>
                      <Text fontSize="sm" color="fg.muted" truncate>
                        {request.session?.venue?.name || request.session?.name}
                        {request.session?.startTime
                          ? ` · ${dayjs(request.session.startTime).format('MMM D')}, ${formatTimeByDevicePreference(request.session.startTime)}`
                          : ''}
                      </Text>
                      <Flex gap={2} mt={1} wrap="wrap">
                        {request.level ? (
                          <Badge colorPalette="purple">
                            {tSession('levelValue', { level: request.level })}
                          </Badge>
                        ) : null}
                        <Badge>
                          {tSession('playerNumberValue', {
                            number: request.playerNumber,
                          })}
                        </Badge>
                      </Flex>
                    </Box>
                    <Flex
                      gap={2}
                      align="center"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Button
                        size="sm"
                        colorPalette="red"
                        variant="outline"
                        disabled={
                          actionLoading === request.id || !!batchActionLoading
                        }
                        onClick={() => void handleAction(request, 'REJECTED')}
                      >
                        {t('reject')}
                      </Button>
                      <Button
                        size="sm"
                        colorPalette="green"
                        loading={actionLoading === request.id}
                        disabled={!!batchActionLoading}
                        onClick={() => void handleAction(request, 'APPROVED')}
                      >
                        {t('approve')}
                      </Button>
                      <ChevronRight size={18} aria-hidden="true" />
                    </Flex>
                  </Flex>
                </CardBody>
              </Card>
            ))}
          </Flex>

          {totalPages > 1 ? (
            <Flex justify="center" align="center" gap={3} mt={6}>
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                {t('previous')}
              </Button>
              <Text fontSize="sm">
                {page} / {totalPages}
              </Text>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
              >
                {t('next')}
              </Button>
            </Flex>
          ) : null}
        </>
      )}
    </Box>
  );
}
