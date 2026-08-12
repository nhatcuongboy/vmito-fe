'use client';

import { NextLinkButton } from '@/components/ui/NextLinkButton';
import { VDrawer } from '@/components/ui/VDrawer';
import { VModal } from '@/components/ui/VModal';
import { Button, Card, CardBody } from '@/components/ui/chakra-compat';
import { toaster } from '@/components/ui/toaster';
import { PlayerService } from '@/lib/api/player.service';
import { MyJoinRequest } from '@/lib/api/types';
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
  VStack,
} from '@chakra-ui/react';
import { ClipboardList, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

interface MyJoinRequestsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCountChange?: (count: number) => void;
  onMutated?: () => void | Promise<void>;
}

const statusPalette = {
  PENDING: 'yellow',
  APPROVED: 'green',
  REJECTED: 'red',
} as const;

export default function MyJoinRequestsDrawer({
  isOpen,
  onClose,
  onCountChange,
  onMutated,
}: MyJoinRequestsDrawerProps) {
  const t = useTranslations('session');
  const tCommon = useTranslations('common');
  const [requests, setRequests] = useState<MyJoinRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState<MyJoinRequest | null>(
    null
  );
  const [withdrawing, setWithdrawing] = useState(false);
  const limit = 20;

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const result = await PlayerService.getMyJoinRequests({ page, limit });
      setRequests(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      onCountChange?.(result.total);
    } catch (error) {
      console.error(error);
      toaster.error({ title: tCommon('error') });
    } finally {
      setLoading(false);
    }
  }, [page, tCommon, onCountChange]);

  useEffect(() => {
    if (isOpen) void fetchRequests();
  }, [isOpen, fetchRequests]);

  const handleWithdraw = async () => {
    if (!selectedRequest) return;
    try {
      setWithdrawing(true);
      await PlayerService.withdrawMyJoinRequest(selectedRequest.session.id);
      toaster.success({ title: t('requestWithdrawn') });
      setSelectedRequest(null);
      await Promise.all([fetchRequests(), Promise.resolve(onMutated?.())]);
    } catch (error) {
      console.error(error);
      toaster.error({ title: tCommon('error') });
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <>
      <VDrawer
        isOpen={isOpen}
        onClose={onClose}
        placement="bottom"
        title={t('myJoinRequests')}
        description={t('myJoinRequestsDescription', { count: total })}
        hideSecondaryAction
        closeButtonAriaLabel={tCommon('close')}
      >
        {loading ? (
          <Center py={16}>
            <Spinner size="lg" />
          </Center>
        ) : requests.length === 0 ? (
          <Center py={16}>
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <ClipboardList size={32} />
                </EmptyState.Indicator>
                <EmptyState.Title>{t('noJoinRequests')}</EmptyState.Title>
                <EmptyState.Description>
                  {t('noJoinRequestsDescription')}
                </EmptyState.Description>
              </EmptyState.Content>
            </EmptyState.Root>
          </Center>
        ) : (
          <VStack align="stretch" gap={3}>
            {requests.map((request) => {
              const hasPending = request.players.some(
                (player) => player.registrationStatus === 'PENDING'
              );
              return (
                <Card key={request.session.id}>
                  <CardBody>
                    <Flex justify="space-between" gap={3} align="flex-start">
                      <Box flex={1} minW={0}>
                        <Text fontWeight="bold" fontSize="lg" truncate>
                          {request.session.name}
                        </Text>
                        <Text color="fg.muted" fontSize="sm" truncate>
                          {request.session.venue?.name ||
                            request.session.location ||
                            t('locationNotUpdated')}
                        </Text>
                        <Text color="fg.muted" fontSize="sm">
                          {request.session.startTime
                            ? `${dayjs(request.session.startTime).format('MMM D')}, ${formatTimeByDevicePreference(request.session.startTime)}`
                            : tCommon('notSpecified')}
                        </Text>
                      </Box>
                      <Text fontSize="xs" color="fg.muted" whiteSpace="nowrap">
                        {dayjs(request.requestedAt).format('DD/MM/YYYY')}
                      </Text>
                    </Flex>

                    <VStack align="stretch" gap={2} mt={4}>
                      {request.players.map((player) => (
                        <Flex
                          key={player.id}
                          justify="space-between"
                          align="center"
                          gap={2}
                          p={2.5}
                          borderRadius="lg"
                          bg="bg.muted"
                        >
                          <Box minW={0}>
                            <Text fontSize="sm" fontWeight="semibold" truncate>
                              {player.name ||
                                t('playerNumberValue', {
                                  number: player.playerNumber,
                                })}
                            </Text>
                            {player.level ? (
                              <Text fontSize="xs" color="fg.muted">
                                {t('levelValue', { level: player.level })}
                              </Text>
                            ) : null}
                          </Box>
                          <Badge
                            colorPalette={
                              statusPalette[player.registrationStatus]
                            }
                          >
                            {player.registrationStatus === 'APPROVED'
                              ? t('registrationApproved')
                              : player.registrationStatus === 'PENDING'
                                ? t('registrationPending')
                                : t('registrationRejected')}
                          </Badge>
                        </Flex>
                      ))}
                    </VStack>

                    <Flex justify="flex-end" gap={2} mt={4}>
                      <NextLinkButton
                        href={`/sessions/${request.session.slug || request.session.id}`}
                        size="sm"
                        variant="outline"
                      >
                        <ExternalLink size={15} aria-hidden="true" />
                        {t('viewSession')}
                      </NextLinkButton>
                      {hasPending ? (
                        <Button
                          size="sm"
                          colorPalette="red"
                          variant="outline"
                          onClick={() => setSelectedRequest(request)}
                        >
                          {t('withdrawRequest')}
                        </Button>
                      ) : null}
                    </Flex>
                  </CardBody>
                </Card>
              );
            })}

            {totalPages > 1 ? (
              <Flex justify="center" align="center" gap={3} pt={3}>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  {tCommon('previous')}
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
                  {tCommon('next')}
                </Button>
              </Flex>
            ) : null}
          </VStack>
        )}
      </VDrawer>

      <VModal
        isOpen={selectedRequest !== null}
        onClose={() => setSelectedRequest(null)}
        title={t('withdrawRequest')}
        description={t('withdrawConfirmation')}
        primaryActionText={tCommon('yes')}
        secondaryActionText={tCommon('no')}
        onPrimaryAction={handleWithdraw}
        isPrimaryLoading={withdrawing}
        primaryColorScheme="red"
        zIndex={2300}
        size="sm"
      >
        <Text>{t('withdrawConfirmation')}</Text>
      </VModal>
    </>
  );
}
