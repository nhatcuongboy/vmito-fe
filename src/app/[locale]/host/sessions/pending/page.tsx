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
import { ClipboardCheck, ChevronRight } from 'lucide-react';
import { useRouter } from '@/i18n/config';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import { PlayerService } from '@/lib/api/player.service';
import { PendingRequest } from '@/lib/api/types';
import { toaster } from '@/components/ui/toaster';
import dayjs from '@/lib/dayjs';
import PageLayout from '@/components/layout/PageLayout';
import HostSessionsNavPanel from '@/components/session/HostSessionsNavPanel';
import { StatusTabSwitch } from '@/components/session/StatusTabSwitch';
import {
  ROUTES,
  TOP_BAR_HEIGHT_MOBILE,
  TOP_BAR_HEIGHT_DESKTOP,
} from '@/constants';

function PendingJoinRequestsContent({
  total,
  requests,
  loading,
  actionLoading,
  batchActionLoading,
  handleAction,
  handleBatchAction,
  page,
  totalPages,
  setPage,
}: {
  total: number;
  requests: PendingRequest[];
  loading: boolean;
  actionLoading: string | null;
  batchActionLoading: string | null;
  handleAction: (
    id: string,
    sessionId: string,
    status: 'APPROVED' | 'REJECTED'
  ) => Promise<void>;
  handleBatchAction: (status: 'APPROVED' | 'REJECTED') => Promise<void>;
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
}) {
  const router = useRouter();
  const t = useTranslations('common');
  const tSession = useTranslations('session');

  return (
    <Box flex={1} minW={0}>
      <Box
        position="sticky"
        top={{
          base: `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top))`,
          md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top))`,
        }}
        left={0}
        right={0}
        width="100vw"
        marginLeft="calc(50% - 50vw)"
        zIndex={100}
        bg="transparent"
        pb={2}
        transition="all 0.2s"
      >
        <Box maxW="1280px" mx="auto">
          <StatusTabSwitch
            activeTab="pending"
            pendingCount={total}
            onChange={(tab: 'active' | 'ended' | 'pending' | 'expired') => {
              if (tab === 'active' || tab === 'ended' || tab === 'expired') {
                router.push(`${ROUTES.HOST.SESSIONS.LIST}?tab=${tab}`);
              }
            }}
          />
        </Box>
      </Box>

      {loading ? (
        <Center py={20}>
          <Spinner size="lg" />
        </Center>
      ) : requests.length === 0 && total === 0 ? (
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
      ) : (
        <>
          <Flex
            justify="space-between"
            align="center"
            mb={4}
            wrap="wrap"
            gap={2}
          >
            <Text color="fg.muted">
              {t('pendingRequests', { count: total })}
            </Text>
            {requests.length > 0 && (
              <Flex gap={2}>
                <Button
                  size="sm"
                  colorPalette="red"
                  variant="outline"
                  loading={batchActionLoading === 'REJECTED'}
                  disabled={!!batchActionLoading}
                  onClick={() => handleBatchAction('REJECTED')}
                >
                  {t.has('rejectAll') ? t('rejectAll') : 'Từ chối tất cả'}
                </Button>
                <Button
                  size="sm"
                  colorPalette="green"
                  loading={batchActionLoading === 'APPROVED'}
                  disabled={!!batchActionLoading}
                  onClick={() => handleBatchAction('APPROVED')}
                >
                  {t.has('approveAll') ? t('approveAll') : 'Duyệt tất cả'}
                </Button>
              </Flex>
            )}
          </Flex>

          <Flex direction="column" gap={4}>
            {requests.map((request: PendingRequest) => (
              <Card
                key={request.id}
                cursor="pointer"
                onClick={() =>
                  router.push(
                    `/host/approval/${request.sessionId}/${request.id}`
                  )
                }
                _hover={{ bg: 'blackAlpha.50' }}
                transition="background 0.2s"
              >
                <CardBody>
                  <Flex
                    justify="space-between"
                    align="center"
                    wrap="wrap"
                    gap={4}
                  >
                    <Box>
                      <Text fontWeight="bold" fontSize="lg">
                        {request.name || t('unknown')}
                      </Text>
                      <Text fontSize="sm" color="fg.muted">
                        {tSession('session')}:{' '}
                        {request.session?.venue?.name || request.session?.name}{' '}
                        -{' '}
                        {dayjs(request.session?.startTime).format(
                          'MMM D, HH:mm'
                        )}
                      </Text>
                      <Flex gap={2} mt={1}>
                        {request.level && (
                          <Badge colorPalette="purple">
                            Level {request.level}
                          </Badge>
                        )}
                        <Badge>Player #{request.playerNumber}</Badge>
                      </Flex>
                    </Box>
                    <Flex
                      gap={2}
                      onClick={(e) => e.stopPropagation()}
                      align="center"
                    >
                      <Button
                        size="sm"
                        colorPalette="red"
                        variant="outline"
                        onClick={() =>
                          handleAction(
                            request.id,
                            request.sessionId,
                            'REJECTED'
                          )
                        }
                        disabled={
                          actionLoading === request.id || !!batchActionLoading
                        }
                      >
                        {t('reject')}
                      </Button>
                      <Button
                        size="sm"
                        colorPalette="green"
                        onClick={() =>
                          handleAction(
                            request.id,
                            request.sessionId,
                            'APPROVED'
                          )
                        }
                        loading={actionLoading === request.id}
                        disabled={!!batchActionLoading}
                      >
                        {t('approve')}
                      </Button>
                    </Flex>
                    <ChevronRight size={20} color="gray" />
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
                onClick={() => setPage(Math.max(1, page - 1))}
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
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
              >
                {t('next') || 'Next'}
              </Button>
            </Flex>
          )}
        </>
      )}
    </Box>
  );
}

export default function PendingJoinRequestsPage() {
  const nav = useTranslations('navigation');
  const t = useTranslations('common');
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [batchActionLoading, setBatchActionLoading] = useState<string | null>(
    null
  );
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

  const handleBatchAction = async (status: 'APPROVED' | 'REJECTED') => {
    if (requests.length === 0) return;
    try {
      setBatchActionLoading(status);
      const playerIds = requests.map((r) => r.id);
      await PlayerService.batchUpdateStatus(playerIds, status);
      setRequests([]);
      setTotal((prev) => Math.max(0, prev - playerIds.length));
      toaster.success({ title: t('success') });
      fetchRequests();
    } catch (error) {
      console.error(error);
      toaster.error({ title: t('error') });
    } finally {
      setBatchActionLoading(null);
    }
  };

  return (
    <ProtectedRouteGuard>
      <Suspense>
        <PageLayout
          title={nav('myHostedSessions')}
          showBackButton={false}
          topBarVariant="secondary"
          bg="green.50"
          _dark={{ bg: 'gray.900' }}
          pt={{
            base: `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top))`,
            md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top))`,
          }}
          maxW="full"
          px={{ base: '24px', md: 0 }}
        >
          <Flex
            gap={6}
            alignItems="flex-start"
            pt={{ md: 6 }}
            pl={{ md: 4 }}
            pr={{ md: 6 }}
          >
            <HostSessionsNavPanel />
            <Box flex={1} minW={0}>
              <PendingJoinRequestsContent
                requests={requests}
                total={total}
                loading={loading}
                actionLoading={actionLoading}
                batchActionLoading={batchActionLoading}
                handleAction={handleAction}
                handleBatchAction={handleBatchAction}
                page={page}
                totalPages={totalPages}
                setPage={setPage}
              />
            </Box>
          </Flex>
        </PageLayout>
      </Suspense>
    </ProtectedRouteGuard>
  );
}
