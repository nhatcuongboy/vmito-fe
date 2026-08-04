'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Badge,
  Container,
  IconButton,
  Input,
  Text,
  Skeleton,
  HStack,
  SimpleGrid,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { useLocale, useTranslations } from 'next-intl';
import {
  ArrowUpDown,
  Banknote,
  Calendar,
  CalendarDays,
  Check,
  CheckCheck,
  Landmark,
  ListFilter,
  Receipt,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
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
import dayjs, { getDayjsLocale } from '@/lib/dayjs';
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

type DatePreset = 'today' | 'week' | 'month' | 'year';
type DateFilter = 'all' | DatePreset | 'custom';
type SortBy = 'totalAmount' | 'pendingAmount' | 'latest' | 'name' | 'sessions';

interface CustomDateRange {
  from: string; // ISO date string YYYY-MM-DD
  to: string; // ISO date string YYYY-MM-DD
}

function paymentDate(payment: PaymentRecord): Date {
  return new Date(payment.session?.startTime ?? payment.createdAt);
}

function isWithinDateFilter(
  payment: PaymentRecord,
  filter: DateFilter,
  customRange?: CustomDateRange,
  selectedPresets?: DatePreset[]
) {
  if (filter === 'all' && (!selectedPresets || selectedPresets.length === 0))
    return true;
  const date = dayjs(paymentDate(payment));

  if (filter === 'custom' && customRange) {
    const from = dayjs(customRange.from).startOf('day');
    const to = dayjs(customRange.to).endOf('day');
    return !date.isBefore(from) && !date.isAfter(to);
  }

  if (selectedPresets && selectedPresets.length > 0) {
    return selectedPresets.some((preset) => {
      const start = dayjs().startOf(preset === 'today' ? 'day' : preset);
      return !date.isBefore(start);
    });
  }

  if (filter !== 'all' && filter !== 'custom') {
    const start = dayjs().startOf(filter === 'today' ? 'day' : filter);
    return !date.isBefore(start);
  }

  return true;
}

function latestPaymentAt(payments: PaymentRecord[] | undefined): number {
  if (!payments || payments.length === 0) return 0;
  return Math.max(...payments.map((p) => paymentDate(p).getTime()));
}

const capitalizeFirst = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

const paymentAccentColor = (status: PaymentStatus): string => {
  switch (status) {
    case PaymentStatus.SUBMITTED:
      return 'orange.400';
    case PaymentStatus.PENDING:
      return 'yellow.300';
    case PaymentStatus.APPROVED:
      return 'green.300';
    case PaymentStatus.REJECTED:
      return 'red.300';
    default:
      return 'gray.200';
  }
};

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
  const locale = useLocale();
  const dayjsLocale = getDayjsLocale(locale);

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
  const [isBulkApproving, setIsBulkApproving] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid'>(
    'all'
  );
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [selectedPreset, setSelectedPreset] = useState<DatePreset | null>(null);
  const [customRange, setCustomRange] = useState<CustomDateRange>({
    from: '',
    to: '',
  });
  const [sortBy, setSortBy] = useState<SortBy>('totalAmount');
  const [showFilters, setShowFilters] = useState(false);

  const hasDateFilter = dateFilter !== 'all' || selectedPreset !== null;

  const hasActiveFilters =
    searchQuery.trim() !== '' || statusFilter !== 'all' || hasDateFilter;
  const activeFilterCount =
    (statusFilter !== 'all' ? 1 : 0) +
    (hasDateFilter ? 1 : 0) +
    (sortBy !== 'totalAmount' ? 1 : 0);

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDateFilter('all');
    setSelectedPreset(null);
    setCustomRange({ from: '', to: '' });
    setSortBy('totalAmount');
  };

  const handleSelectPreset = (preset: DatePreset) => {
    // Toggle off if already selected
    setSelectedPreset((prev) => (prev === preset ? null : preset));
    setDateFilter('all');
    setCustomRange({ from: '', to: '' });
  };

  // Recompute each summary's totals from the already-loaded per-user payments,
  // scoped to the selected date range. Users without a cached detail list
  // (only the synthetic "guest" bucket, see canLoadHostTransactionDetails)
  // are dropped once a specific range is selected — we have no breakdown to
  // filter them correctly, so hiding is safer than showing stale totals.
  const dateFilteredSummaries = useMemo(() => {
    const noDateFilter =
      (dateFilter === 'all' && selectedPreset === null) ||
      (dateFilter === 'custom' && (!customRange.from || !customRange.to));
    if (noDateFilter) return summaries;

    const activePresets = selectedPreset ? [selectedPreset] : [];

    return summaries
      .map((summary) => {
        const payments = paymentDetailsByUser[summary.userId];
        if (!payments) return null;
        const inRange = payments.filter((p) =>
          isWithinDateFilter(p, dateFilter, customRange, activePresets)
        );
        return summarizeUserPayments(summary, inRange);
      })
      .filter((summary): summary is HostTransactionSummary => Boolean(summary));
  }, [
    summaries,
    paymentDetailsByUser,
    dateFilter,
    selectedPreset,
    customRange,
  ]);

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

  const submittedPayments = useMemo(
    () =>
      selectedPayments.filter(
        (payment) => payment.status === PaymentStatus.SUBMITTED
      ),
    [selectedPayments]
  );

  // Group payments by month (newest first) for the detail modal
  const groupedPayments = useMemo(() => {
    const sorted = [...selectedPayments].sort(
      (a, b) => paymentDate(b).getTime() - paymentDate(a).getTime()
    );
    const groups: {
      key: string;
      label: string;
      payments: PaymentRecord[];
    }[] = [];
    for (const payment of sorted) {
      const date = dayjs(paymentDate(payment)).locale(dayjsLocale);
      const key = date.format('YYYY-MM');
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.key === key) {
        lastGroup.payments.push(payment);
      } else {
        groups.push({
          key,
          label: capitalizeFirst(date.format('MMMM YYYY')),
          payments: [payment],
        });
      }
    }
    return groups;
  }, [selectedPayments, dayjsLocale]);

  const handleBulkApprove = async () => {
    if (!selectedSummary || submittedPayments.length === 0) return;

    setIsBulkApproving(true);
    try {
      for (const payment of submittedPayments) {
        await PaymentService.approvePayment(payment.id, {});
      }
      await refreshSelectedUser(selectedSummary);
      toaster.success({
        title: t('approveAllSubmittedSuccess', {
          count: submittedPayments.length,
          name: selectedSummary.userName,
        }),
      });
    } catch (error) {
      console.error('Failed to bulk approve payments:', error);
      toaster.error({
        title: tCommon('error'),
        description: t('bulkApprovePaymentsFailed'),
      });
    } finally {
      setIsBulkApproving(false);
    }
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
      toaster.success({
        title: t('paymentApprovedToast', {
          amount: FeeService.formatPaymentAmount(
            amount ?? selectedPayment.amount
          ),
          name: selectedSummary.userName,
        }),
      });
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
      toaster.success({
        title: t('paymentRejectedToast', {
          name: selectedSummary.userName,
        }),
      });
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
      <Text color="fg.muted" mb={4}>
        {t('hostTransactionsDescription')}
      </Text>

      {/* Filter bar */}
      <VStack mb={6} gap={2} align="stretch">
        <HStack gap={2}>
          <Box position="relative" flex={1}>
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
          <Box position="relative">
            <IconButton
              size="sm"
              variant={
                showFilters || activeFilterCount > 0 ? 'solid' : 'subtle'
              }
              colorPalette="green"
              aria-label={t('toggleFilters')}
              onClick={() => setShowFilters((prev) => !prev)}
            >
              <SlidersHorizontal size={16} />
            </IconButton>
            {activeFilterCount > 0 && (
              <Badge
                position="absolute"
                top="-6px"
                right="-6px"
                borderRadius="full"
                colorPalette="green"
                fontSize="10px"
                minW="16px"
                h="16px"
                px={0}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Box>
        </HStack>

        {showFilters && (
          <VStack gap={2} align="stretch">
            <SimpleGrid columns={{ base: 1, sm: 2 }} gap={2}>
              <VSelect
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as 'all' | 'pending' | 'paid')
                }
                size="sm"
                leftElement={<ListFilter size={14} />}
              >
                <option value="all">{t('filterAll')}</option>
                <option value="pending">{t('filterHasPending')}</option>
                <option value="paid">{t('filterAllPaid')}</option>
              </VSelect>
              <VSelect
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                size="sm"
                leftElement={<ArrowUpDown size={14} />}
              >
                <option value="totalAmount">{t('sortTotalAmount')}</option>
                <option value="pendingAmount">{t('sortPendingAmount')}</option>
                <option value="latest">{t('sortLatest')}</option>
                <option value="name">{t('sortNameAZ')}</option>
                <option value="sessions">{t('sortMostSessions')}</option>
              </VSelect>
            </SimpleGrid>

            {/* Advanced date filter */}
            <Box
              border="1px solid"
              borderColor="gray.200"
              _dark={{ borderColor: 'gray.700', bg: 'gray.800' }}
              borderRadius="lg"
              p={3}
              bg="white"
            >
              <HStack mb={2} gap={1}>
                <CalendarDays size={14} />
                <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
                  Khoảng thời gian
                </Text>
              </HStack>

              {/* Preset chips - multi-select */}
              <Wrap gap={2} mb={3}>
                {(['today', 'week', 'month', 'year'] as DatePreset[]).map(
                  (preset) => {
                    const labels: Record<DatePreset, string> = {
                      today: t('dateFilterToday'),
                      week: t('dateFilterWeek'),
                      month: t('dateFilterMonth'),
                      year: t('dateFilterYear'),
                    };
                    const isSelected = selectedPreset === preset;
                    return (
                      <WrapItem key={preset}>
                        <Box
                          as="button"
                          px={3}
                          py={1}
                          borderRadius="full"
                          fontSize="xs"
                          fontWeight="medium"
                          cursor="pointer"
                          border="1.5px solid"
                          transition="all 0.15s"
                          bg={isSelected ? 'green.500' : 'transparent'}
                          color={isSelected ? 'white' : 'fg.muted'}
                          borderColor={isSelected ? 'green.500' : 'gray.300'}
                          _dark={{
                            borderColor: isSelected ? 'green.400' : 'gray.600',
                            bg: isSelected ? 'green.600' : 'transparent',
                            color: isSelected ? 'white' : 'gray.400',
                          }}
                          _hover={{
                            borderColor: 'green.400',
                            color: isSelected ? 'white' : 'green.600',
                          }}
                          onClick={() => handleSelectPreset(preset)}
                        >
                          {labels[preset]}
                        </Box>
                      </WrapItem>
                    );
                  }
                )}
              </Wrap>

              {/* Custom date range */}
              <Box>
                <Text fontSize="xs" color="fg.muted" mb={1.5}>
                  Hoặc chọn khoảng ngày cụ thể:
                </Text>
                <HStack gap={2}>
                  <Box flex={1}>
                    <Text fontSize="xs" color="fg.muted" mb={0.5}>
                      Từ ngày
                    </Text>
                    <Input
                      type="date"
                      size="sm"
                      value={customRange.from}
                      max={customRange.to || undefined}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomRange((prev) => ({ ...prev, from: val }));
                        if (val) {
                          setDateFilter('custom');
                          setSelectedPreset(null);
                        }
                      }}
                      bg="white"
                      _dark={{ bg: 'gray.800' }}
                    />
                  </Box>
                  <Box flex={1}>
                    <Text fontSize="xs" color="fg.muted" mb={0.5}>
                      Đến ngày
                    </Text>
                    <Input
                      type="date"
                      size="sm"
                      value={customRange.to}
                      min={customRange.from || undefined}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomRange((prev) => ({ ...prev, to: val }));
                        if (val) {
                          setDateFilter('custom');
                          setSelectedPreset(null);
                        }
                      }}
                      bg="white"
                      _dark={{ bg: 'gray.800' }}
                    />
                  </Box>
                </HStack>
              </Box>
            </Box>
          </VStack>
        )}

        {hasActiveFilters && (
          <Box>
            <Button size="xs" variant="ghost" onClick={handleClearFilters}>
              <X size={14} />
              <Text ml={1}>{t('clearFilters')}</Text>
            </Button>
          </Box>
        )}
      </VStack>

      <TransactionSummaryList
        summaries={filteredSummaries}
        viewType="host"
        onSelectSummary={handleSelectSummary}
        isLoading={isLoading}
        hasActiveFilters={hasActiveFilters}
      />

      <VModal
        isOpen={Boolean(selectedSummary)}
        onClose={handleCloseDetail}
        title={selectedSummary?.userName || t('paymentDetails')}
        description={
          selectedSummary
            ? `${t('total')}: ${FeeService.formatPaymentAmount(
                selectedSummary.totalAmount
              )} · ${t('pending')}: ${FeeService.formatPaymentAmount(
                selectedSummary.pendingAmount
              )}`
            : t('paymentDetails')
        }
        headerRightContent={
          selectedSummary ? (
            <Badge
              colorPalette={
                selectedSummary.pendingAmount > 0 ? 'orange' : 'green'
              }
              fontSize="xs"
            >
              {selectedSummary.pendingAmount > 0
                ? t('filterHasPending')
                : t('fullyPaid')}
            </Badge>
          ) : undefined
        }
        size="lg"
        hideSecondaryAction
        maxBodyHeight={{ base: '70vh', md: '75vh' }}
      >
        {isDetailLoading ? (
          <VStack align="stretch" gap={3}>
            <SimpleGrid columns={{ base: 3 }} gap={2}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} height="64px" borderRadius="md" />
              ))}
            </SimpleGrid>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height="72px" borderRadius="lg" />
            ))}
          </VStack>
        ) : (
          <VStack align="stretch" gap={3}>
            {selectedSummary && (
              <SimpleGrid columns={{ base: 3 }} gap={2}>
                <Box
                  p={3}
                  bg="gray.50"
                  _dark={{ bg: 'gray.800' }}
                  borderRadius="md"
                >
                  <Text fontSize="xs" color="fg.muted">
                    {t('total')}
                  </Text>
                  <Text fontWeight="bold">
                    {FeeService.formatPaymentAmount(
                      selectedSummary.totalAmount
                    )}
                  </Text>
                </Box>
                <Box
                  p={3}
                  bg="green.50"
                  _dark={{ bg: 'green.950' }}
                  borderRadius="md"
                >
                  <Text
                    fontSize="xs"
                    color="green.700"
                    _dark={{ color: 'green.300' }}
                  >
                    {t('paid')}
                  </Text>
                  <Text
                    fontWeight="bold"
                    color="green.700"
                    _dark={{ color: 'green.300' }}
                  >
                    {FeeService.formatPaymentAmount(selectedSummary.paidAmount)}
                  </Text>
                </Box>
                <Box
                  p={3}
                  bg="yellow.50"
                  _dark={{ bg: 'yellow.950' }}
                  borderRadius="md"
                >
                  <Text
                    fontSize="xs"
                    color="yellow.700"
                    _dark={{ color: 'yellow.300' }}
                  >
                    {t('pending')}
                  </Text>
                  <Text
                    fontWeight="bold"
                    color="yellow.700"
                    _dark={{ color: 'yellow.300' }}
                  >
                    {FeeService.formatPaymentAmount(
                      selectedSummary.pendingAmount
                    )}
                  </Text>
                </Box>
              </SimpleGrid>
            )}

            {selectedPayments.length > 0 && (
              <HStack justify="space-between" wrap="wrap" gap={2}>
                <Text fontSize="sm" color="fg.muted">
                  {t('paymentCount', { count: selectedPayments.length })}
                </Text>
                {submittedPayments.length > 0 && (
                  <Button
                    size="xs"
                    colorPalette="green"
                    onClick={handleBulkApprove}
                    loading={isBulkApproving}
                  >
                    <CheckCheck size={14} />
                    <Text ml={1}>
                      {t('approveAllSubmitted', {
                        count: submittedPayments.length,
                      })}
                    </Text>
                  </Button>
                )}
              </HStack>
            )}

            {selectedPayments.length === 0 ? (
              <Box textAlign="center" py={8}>
                <Box color="fg.muted" display="inline-block" mb={2}>
                  <Receipt size={28} />
                </Box>
                <Text color="fg.muted">{t('noPayments')}</Text>
              </Box>
            ) : (
              groupedPayments.map((group) => (
                <Box key={group.key}>
                  <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    color="fg.muted"
                    textTransform="uppercase"
                    mb={2}
                  >
                    {group.label}
                  </Text>
                  <VStack align="stretch" gap={2}>
                    {group.payments.map((payment) => (
                      <Box
                        key={payment.id}
                        p={3}
                        border="1px solid"
                        borderColor="gray.200"
                        borderLeft="3px solid"
                        borderLeftColor={paymentAccentColor(payment.status)}
                        borderRadius="lg"
                        bg="white"
                        _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                      >
                        <HStack
                          justify="space-between"
                          align="flex-start"
                          gap={3}
                        >
                          <Box flex={1} minW={0}>
                            <HStack gap={2} mb={1} wrap="wrap">
                              <Text fontWeight="semibold" lineClamp={1}>
                                {payment.session?.name || t('transactions')}
                              </Text>
                              <PaymentStatusBadge
                                status={payment.status}
                                size="sm"
                              />
                              {payment.amount === 0 && (
                                <Badge colorPalette="blue" fontSize="xs">
                                  {t('freeLabel')}
                                </Badge>
                              )}
                            </HStack>
                            <HStack
                              gap={2}
                              color="fg.muted"
                              fontSize="sm"
                              wrap="wrap"
                            >
                              <HStack gap={1}>
                                <Calendar size={14} />
                                <Text>
                                  {payment.session?.startTime
                                    ? dayjs(payment.session.startTime)
                                        .locale(dayjsLocale)
                                        .format('DD/MM/YYYY')
                                    : t('sessions')}
                                </Text>
                              </HStack>
                              {payment.paymentMethod && (
                                <HStack
                                  gap={1}
                                  px={2}
                                  py={0.5}
                                  borderRadius="full"
                                  bg="gray.100"
                                  _dark={{ bg: 'gray.700' }}
                                  fontSize="xs"
                                >
                                  {payment.paymentMethod ===
                                  PaymentMethod.CASH ? (
                                    <Banknote size={12} />
                                  ) : (
                                    <Landmark size={12} />
                                  )}
                                  <Text>
                                    {payment.paymentMethod ===
                                    PaymentMethod.CASH
                                      ? t('method.cash')
                                      : t('method.bankTransfer')}
                                  </Text>
                                </HStack>
                              )}
                            </HStack>
                          </Box>
                          <VStack align="flex-end" gap={2}>
                            <Text fontWeight="bold">
                              {FeeService.formatPaymentAmount(payment.amount)}
                            </Text>
                            {payment.status === PaymentStatus.SUBMITTED ? (
                              <Button
                                size="xs"
                                colorPalette="green"
                                onClick={() => setSelectedPayment(payment)}
                              >
                                <Check size={14} />
                                <Text ml={1}>{t('approveNow')}</Text>
                              </Button>
                            ) : payment.status === PaymentStatus.APPROVED ? (
                              <IconButton
                                size="xs"
                                variant="ghost"
                                colorPalette="green"
                                aria-label={t('viewDetails')}
                                onClick={() => setSelectedPayment(payment)}
                              >
                                <Check size={14} />
                              </IconButton>
                            ) : (
                              <Button
                                size="xs"
                                variant="outline"
                                colorPalette={
                                  payment.status === PaymentStatus.REJECTED
                                    ? 'red'
                                    : 'gray'
                                }
                                onClick={() => setSelectedPayment(payment)}
                              >
                                {t('viewDetails')}
                              </Button>
                            )}
                          </VStack>
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
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
