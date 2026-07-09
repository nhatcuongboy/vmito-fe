'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Badge,
  Container,
  Heading,
  Input,
  Text,
  Spinner,
  HStack,
  SimpleGrid,
  VStack,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { Calendar, Receipt, Search } from 'lucide-react';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import PageLayout from '@/components/layout/PageLayout';
import {
  PaymentApprovalModal,
  PaymentStatusBadge,
  TransactionSummaryList,
} from '@/components/payment';
import { Button } from '@/components/ui/chakra-compat';
import { VModal } from '@/components/ui/VModal';
import { VSelect } from '@/components/ui/VSelect';
import dayjs from '@/lib/dayjs';
import { FeeService } from '@/lib/api/fee.service';
import { PaymentService } from '@/lib/api/payment.service';
import {
  HostTransactionSummary,
  PaymentMethod,
  PaymentRecord,
  PaymentStatus,
  SessionStatus,
  TransactionSummary,
  UserRole,
} from '@/lib/api/types';
import { toaster } from '@/components/ui/toaster';

type DateFilter = 'all' | 'today' | 'week' | 'month' | 'year';
type SortBy = 'totalAmount' | 'pendingAmount' | 'latest' | 'name' | 'sessions';

function paymentDate(payment: PaymentRecord): Date {
  return new Date(payment.session?.startTime ?? payment.createdAt);
}

function isWithinDateFilter(payment: PaymentRecord, filter: DateFilter) {
  if (filter === 'all') return true;
  const date = dayjs(paymentDate(payment));
  const start = dayjs().startOf(filter === 'today' ? 'day' : filter);
  return !date.isBefore(start);
}

function latestPaymentAt(payments: PaymentRecord[] | undefined): number {
  if (!payments || payments.length === 0) return 0;
  return Math.max(...payments.map((p) => paymentDate(p).getTime()));
}

function isBillablePaymentRecord(payment: PaymentRecord) {
  if (payment.session?.status === SessionStatus.CANCELLED) return false;
  if (payment.session?.cancelledAt) return false;
  if (
    payment.player?.registrationStatus &&
    payment.player.registrationStatus !== 'APPROVED'
  ) {
    return false;
  }

  return true;
}

function canLoadHostTransactionDetails(summary: HostTransactionSummary) {
  return summary.userId.trim().toLowerCase() !== 'guest';
}

function summarizeUserPayments(
  baseSummary: HostTransactionSummary,
  payments: PaymentRecord[]
): HostTransactionSummary | null {
  if (payments.length === 0) return null;

  const totalAmount = payments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );
  const paidAmount = payments
    .filter((payment) => payment.status === PaymentStatus.APPROVED)
    .reduce((sum, payment) => sum + payment.amount, 0);
  const totalSessions = new Set(payments.map((payment) => payment.sessionId))
    .size;

  return {
    ...baseSummary,
    totalSessions,
    totalAmount,
    paidAmount,
    pendingAmount: totalAmount - paidAmount,
  };
}

function HostTransactionsContent() {
  const t = useTranslations('payment');
  const tCommon = useTranslations('common');

  const [summaries, setSummaries] = useState<HostTransactionSummary[]>([]);
  const [paymentDetailsByUser, setPaymentDetailsByUser] = useState<
    Record<string, PaymentRecord[]>
  >({});
  const [selectedSummary, setSelectedSummary] =
    useState<HostTransactionSummary | null>(null);
  const [selectedPayments, setSelectedPayments] = useState<PaymentRecord[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid'>(
    'all'
  );
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('totalAmount');

  // Recompute each summary's totals from the already-loaded per-user payments,
  // scoped to the selected date range. Users without a cached detail list
  // (only the synthetic "guest" bucket, see canLoadHostTransactionDetails)
  // are dropped once a specific range is selected — we have no breakdown to
  // filter them correctly, so hiding is safer than showing stale totals.
  const dateFilteredSummaries = useMemo(() => {
    if (dateFilter === 'all') return summaries;

    return summaries
      .map((summary) => {
        const payments = paymentDetailsByUser[summary.userId];
        if (!payments) return null;
        const inRange = payments.filter((p) =>
          isWithinDateFilter(p, dateFilter)
        );
        return summarizeUserPayments(summary, inRange);
      })
      .filter((summary): summary is HostTransactionSummary => Boolean(summary));
  }, [summaries, paymentDetailsByUser, dateFilter]);

  const filteredSummaries = useMemo(() => {
    const filtered = dateFilteredSummaries.filter((s) => {
      const matchesSearch = s.userName
        .toLowerCase()
        .includes(searchQuery.toLowerCase().trim());
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'pending' && s.pendingAmount > 0) ||
        (statusFilter === 'paid' && s.pendingAmount === 0);
      return matchesSearch && matchesStatus;
    });

    const sorted = [...filtered];
    switch (sortBy) {
      case 'totalAmount':
        sorted.sort((a, b) => b.totalAmount - a.totalAmount);
        break;
      case 'pendingAmount':
        sorted.sort((a, b) => b.pendingAmount - a.pendingAmount);
        break;
      case 'latest':
        sorted.sort(
          (a, b) =>
            latestPaymentAt(paymentDetailsByUser[b.userId]) -
            latestPaymentAt(paymentDetailsByUser[a.userId])
        );
        break;
      case 'name':
        sorted.sort((a, b) => a.userName.localeCompare(b.userName, 'vi'));
        break;
      case 'sessions':
        sorted.sort((a, b) => b.totalSessions - a.totalSessions);
        break;
    }
    return sorted;
  }, [
    dateFilteredSummaries,
    searchQuery,
    statusFilter,
    sortBy,
    paymentDetailsByUser,
  ]);

  const loadTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await PaymentService.getHostTransactionSummary();
      const detailEntries = await Promise.all(
        data.map(async (summary) => {
          if (!canLoadHostTransactionDetails(summary)) {
            return [summary.userId, null] as const;
          }

          try {
            const payments = (
              await PaymentService.getHostTransactionsWithUser(summary.userId)
            ).filter(isBillablePaymentRecord);
            return [summary.userId, payments] as const;
          } catch (error) {
            console.error('Failed to load transaction details:', error);
            return [summary.userId, null] as const;
          }
        })
      );

      const detailsByUser = Object.fromEntries(
        detailEntries
          .filter(([, payments]) => payments !== null)
          .map(([userId, payments]) => [userId, payments])
      ) as Record<string, PaymentRecord[]>;

      const visibleSummaries = data
        .map((summary) => {
          const payments = detailsByUser[summary.userId];
          if (!payments) return summary;
          return summarizeUserPayments(summary, payments);
        })
        .filter((summary): summary is HostTransactionSummary =>
          Boolean(summary)
        );

      setPaymentDetailsByUser(detailsByUser);
      setSummaries(visibleSummaries);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      toaster.error({
        title: tCommon('error'),
        description: t('loadTransactionsFailed'),
      });
    } finally {
      setIsLoading(false);
    }
  }, [t, tCommon]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const refreshSelectedUser = useCallback(
    async (summary: HostTransactionSummary) => {
      if (!canLoadHostTransactionDetails(summary)) {
        setSelectedPayments([]);
        return;
      }

      const payments = (
        await PaymentService.getHostTransactionsWithUser(summary.userId)
      ).filter(isBillablePaymentRecord);
      const nextSummary = summarizeUserPayments(summary, payments);

      setPaymentDetailsByUser((previous) => ({
        ...previous,
        [summary.userId]: payments,
      }));
      setSelectedPayments(payments);
      setSummaries((previous) => {
        const withoutUser = previous.filter(
          (item) => item.userId !== summary.userId
        );
        return nextSummary ? [...withoutUser, nextSummary] : withoutUser;
      });
      if (nextSummary) {
        setSelectedSummary(nextSummary);
      }
    },
    []
  );

  const handleSelectSummary = async (
    summary: HostTransactionSummary | TransactionSummary
  ) => {
    if (!('userId' in summary)) return;

    setSelectedSummary(summary);
    if (!canLoadHostTransactionDetails(summary)) {
      setSelectedPayments([]);
      return;
    }

    const cachedPayments = paymentDetailsByUser[summary.userId];
    if (cachedPayments) {
      setSelectedPayments(cachedPayments);
      return;
    }

    setIsDetailLoading(true);
    try {
      const payments = (
        await PaymentService.getHostTransactionsWithUser(summary.userId)
      ).filter(isBillablePaymentRecord);
      setPaymentDetailsByUser((previous) => ({
        ...previous,
        [summary.userId]: payments,
      }));
      setSelectedPayments(payments);
    } catch (error) {
      console.error('Failed to load transaction details:', error);
      toaster.error({
        title: tCommon('error'),
        description: t('loadTransactionsFailed'),
      });
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedSummary(null);
    setSelectedPayments([]);
    setSelectedPayment(null);
  };

  const handleApprovePayment = async (
    notes?: string,
    amount?: number,
    paymentMethod?: PaymentMethod
  ) => {
    if (!selectedPayment || !selectedSummary) return;

    try {
      await PaymentService.approvePayment(selectedPayment.id, {
        hostNotes: notes,
        amount,
        paymentMethod,
      });
      await refreshSelectedUser(selectedSummary);
      setSelectedPayment(null);
    } catch (error) {
      console.error('Failed to approve payment:', error);
      toaster.error({
        title: tCommon('error'),
        description: t('approvePaymentFailed'),
      });
      throw error;
    }
  };

  const handleRejectPayment = async (notes?: string) => {
    if (!selectedPayment || !selectedSummary) return;

    try {
      await PaymentService.rejectPayment(selectedPayment.id, {
        hostNotes: notes || t('rejectReason'),
      });
      await refreshSelectedUser(selectedSummary);
      setSelectedPayment(null);
    } catch (error) {
      console.error('Failed to reject payment:', error);
      toaster.error({
        title: tCommon('error'),
        description: t('rejectPaymentFailed'),
      });
      throw error;
    }
  };

  return (
    <Container maxW="container.md">
      <HStack mb={6}>
        <Receipt size={24} color="#179a3b" />
        <Heading size="lg">{t('transactionHistory')}</Heading>
      </HStack>

      <Text color="fg.muted" mb={4}>
        {t('hostTransactionsDescription')}
      </Text>

      {/* Filter bar */}
      <HStack mb={6} gap={3} wrap="wrap">
        <Box flex={1} minW="180px" position="relative">
          <Box
            position="absolute"
            left={3}
            top="50%"
            transform="translateY(-50%)"
            color="fg.muted"
            pointerEvents="none"
            zIndex={1}
          >
            <Search size={15} />
          </Box>
          <Input
            pl={9}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchByPlayer')}
            size="sm"
            bg="white"
            _dark={{ bg: 'gray.800' }}
          />
        </Box>
        <Box minW="150px">
          <VSelect
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as 'all' | 'pending' | 'paid')
            }
            size="sm"
          >
            <option value="all">{t('filterAll')}</option>
            <option value="pending">{t('filterHasPending')}</option>
            <option value="paid">{t('filterAllPaid')}</option>
          </VSelect>
        </Box>
        <Box minW="150px">
          <VSelect
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as DateFilter)}
            size="sm"
          >
            <option value="all">{t('dateFilterAll')}</option>
            <option value="today">{t('dateFilterToday')}</option>
            <option value="week">{t('dateFilterWeek')}</option>
            <option value="month">{t('dateFilterMonth')}</option>
            <option value="year">{t('dateFilterYear')}</option>
          </VSelect>
        </Box>
        <Box minW="160px">
          <VSelect
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            size="sm"
          >
            <option value="totalAmount">{t('sortTotalAmount')}</option>
            <option value="pendingAmount">{t('sortPendingAmount')}</option>
            <option value="latest">{t('sortLatest')}</option>
            <option value="name">{t('sortNameAZ')}</option>
            <option value="sessions">{t('sortMostSessions')}</option>
          </VSelect>
        </Box>
      </HStack>

      <TransactionSummaryList
        summaries={filteredSummaries}
        viewType="host"
        onSelectSummary={handleSelectSummary}
        isLoading={isLoading}
      />

      <VModal
        isOpen={Boolean(selectedSummary)}
        onClose={handleCloseDetail}
        title={selectedSummary?.userName || t('paymentDetails')}
        description={t('paymentDetails')}
        size="lg"
        hideSecondaryAction
        maxBodyHeight={{ base: '70vh', md: '75vh' }}
      >
        {isDetailLoading ? (
          <Box textAlign="center" py={8}>
            <Spinner />
            <Text mt={3} color="fg.muted">
              {tCommon('loading')}
            </Text>
          </Box>
        ) : (
          <VStack align="stretch" gap={3}>
            {selectedSummary && (
              <SimpleGrid columns={{ base: 3 }} gap={2}>
                <Box p={3} bg="gray.50" borderRadius="md">
                  <Text fontSize="xs" color="fg.muted">
                    {t('total')}
                  </Text>
                  <Text fontWeight="bold">
                    {FeeService.formatPaymentAmount(
                      selectedSummary.totalAmount
                    )}
                  </Text>
                </Box>
                <Box p={3} bg="green.50" borderRadius="md">
                  <Text fontSize="xs" color="green.700">
                    {t('paid')}
                  </Text>
                  <Text fontWeight="bold" color="green.700">
                    {FeeService.formatPaymentAmount(selectedSummary.paidAmount)}
                  </Text>
                </Box>
                <Box p={3} bg="yellow.50" borderRadius="md">
                  <Text fontSize="xs" color="yellow.700">
                    {t('pending')}
                  </Text>
                  <Text fontWeight="bold" color="yellow.700">
                    {FeeService.formatPaymentAmount(
                      selectedSummary.pendingAmount
                    )}
                  </Text>
                </Box>
              </SimpleGrid>
            )}

            {selectedPayments.length === 0 ? (
              <Box textAlign="center" py={8}>
                <Text color="fg.muted">{t('noPayments')}</Text>
              </Box>
            ) : (
              selectedPayments.map((payment) => (
                <Box
                  key={payment.id}
                  p={3}
                  border="1px solid"
                  borderColor="gray.200"
                  borderRadius="lg"
                  bg="white"
                >
                  <HStack justify="space-between" align="flex-start" gap={3}>
                    <Box flex={1} minW={0}>
                      <HStack gap={2} mb={1} wrap="wrap">
                        <Text fontWeight="semibold" lineClamp={1}>
                          {payment.session?.name || t('transactions')}
                        </Text>
                        <PaymentStatusBadge status={payment.status} size="sm" />
                      </HStack>
                      <HStack gap={2} color="fg.muted" fontSize="sm">
                        <Calendar size={14} />
                        <Text>
                          {payment.session?.startTime
                            ? new Date(
                                payment.session.startTime
                              ).toLocaleDateString('vi-VN')
                            : t('sessions')}
                        </Text>
                        {payment.paymentMethod && (
                          <Badge colorPalette="gray" fontSize="xs">
                            {payment.paymentMethod === PaymentMethod.CASH
                              ? t('method.cash')
                              : t('method.bankTransfer')}
                          </Badge>
                        )}
                      </HStack>
                    </Box>
                    <VStack align="flex-end" gap={2}>
                      <Text fontWeight="bold">
                        {FeeService.formatPaymentAmount(payment.amount)}
                      </Text>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => setSelectedPayment(payment)}
                      >
                        {t('viewDetails')}
                      </Button>
                    </VStack>
                  </HStack>
                </Box>
              ))
            )}
          </VStack>
        )}
      </VModal>

      {selectedPayment && (
        <PaymentApprovalModal
          isOpen={Boolean(selectedPayment)}
          onClose={() => setSelectedPayment(null)}
          paymentRecord={selectedPayment}
          onApprove={handleApprovePayment}
          onReject={handleRejectPayment}
        />
      )}
    </Container>
  );
}

export default function HostTransactionsPage() {
  const t = useTranslations('payment');

  return (
    <ProtectedRouteGuard requiredRole={[UserRole.HOST, UserRole.ADMIN]}>
      <Suspense>
        <PageLayout title={t('transactionHistory')}>
          <HostTransactionsContent />
        </PageLayout>
      </Suspense>
    </ProtectedRouteGuard>
  );
}
