'use client';

import { useMemo, useState } from 'react';
import { Box, Input, SimpleGrid } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { ArrowUpDown, ListFilter, Search } from 'lucide-react';
import { TransactionSummaryList } from '@/components/payment';
import { VSelect } from '@/components/ui/VSelect';
import { toaster } from '@/components/ui/toaster';
import { PaymentService } from '@/lib/api/payment.service';
import { PaymentReminderService } from '@/lib/api/payment-reminder.service';
import {
  HostTransactionSummary,
  PaymentRecord,
  SessionStatus,
  TransactionSummary,
} from '@/lib/api/types';
import PlayerPaymentDetailModal from './PlayerPaymentDetailModal';

type TStatusFilter = 'all' | 'pending' | 'paid';
type TSortBy = 'totalAmount' | 'pendingAmount' | 'name' | 'sessions';

interface ByPlayerTabProps {
  summaries: HostTransactionSummary[];
  isLoading: boolean;
  onDataChanged: () => void;
}

/** Guest bucket has no user account, so it has no per-user transaction endpoint. */
const canLoadDetails = (summary: HostTransactionSummary) =>
  summary.userId.trim().toLowerCase() !== 'guest';

const isBillablePaymentRecord = (payment: PaymentRecord) => {
  if (payment.session?.status === SessionStatus.CANCELLED) return false;
  if (payment.session?.cancelledAt) return false;
  if (
    payment.player?.registrationStatus &&
    payment.player.registrationStatus !== 'APPROVED'
  ) {
    return false;
  }
  return true;
};

export default function ByPlayerTab({
  summaries,
  isLoading,
  onDataChanged,
}: ByPlayerTabProps) {
  const t = useTranslations('payment');
  const tCommon = useTranslations('common');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TStatusFilter>('all');
  const [sortBy, setSortBy] = useState<TSortBy>('totalAmount');

  const [selectedSummary, setSelectedSummary] =
    useState<HostTransactionSummary | null>(null);
  const [selectedPayments, setSelectedPayments] = useState<PaymentRecord[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'all';

  const filteredSummaries = useMemo(() => {
    const filtered = summaries.filter((s) => {
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
      case 'name':
        sorted.sort((a, b) => a.userName.localeCompare(b.userName, 'vi'));
        break;
      case 'sessions':
        sorted.sort((a, b) => b.totalSessions - a.totalSessions);
        break;
    }
    return sorted;
  }, [summaries, searchQuery, statusFilter, sortBy]);

  const loadPayments = async (summary: HostTransactionSummary) => {
    if (!canLoadDetails(summary)) return [];
    const payments = await PaymentService.getHostTransactionsWithUser(
      summary.userId
    );
    return payments.filter(isBillablePaymentRecord);
  };

  const handleSelectSummary = async (
    summary: TransactionSummary | HostTransactionSummary
  ) => {
    if (!('userId' in summary)) return;

    setSelectedSummary(summary);
    setSelectedPayments([]);
    if (!canLoadDetails(summary)) return;

    setIsDetailLoading(true);
    try {
      setSelectedPayments(await loadPayments(summary));
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

  const handleRefreshSelected = async (summary: HostTransactionSummary) => {
    setSelectedPayments(await loadPayments(summary));
    onDataChanged();
  };

  const handleCloseDetail = () => {
    setSelectedSummary(null);
    setSelectedPayments([]);
  };

  const handleRemindAggregate = async (summary: HostTransactionSummary) => {
    if (!canLoadDetails(summary)) return;
    try {
      await PaymentReminderService.createAggregateReminder({
        recipientUserId: summary.userId,
      });
    } catch (error) {
      console.error('Failed to send aggregate payment reminder:', error);
      toaster.error({
        title: tCommon('error'),
        description: t('remindPaymentFailed'),
      });
    }
  };

  return (
    <>
      <SimpleGrid columns={{ base: 1, sm: 3 }} gap={2} mb={4}>
        <Box position="relative">
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
        <VSelect
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TStatusFilter)}
          size="sm"
          leftElement={<ListFilter size={14} />}
        >
          <option value="all">{t('filterAll')}</option>
          <option value="pending">{t('filterHasPending')}</option>
          <option value="paid">{t('filterAllPaid')}</option>
        </VSelect>
        <VSelect
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as TSortBy)}
          size="sm"
          leftElement={<ArrowUpDown size={14} />}
        >
          <option value="totalAmount">{t('sortTotalAmount')}</option>
          <option value="pendingAmount">{t('sortPendingAmount')}</option>
          <option value="name">{t('sortNameAZ')}</option>
          <option value="sessions">{t('sortMostSessions')}</option>
        </VSelect>
      </SimpleGrid>

      <TransactionSummaryList
        summaries={filteredSummaries}
        viewType="host"
        onSelectSummary={handleSelectSummary}
        onRemindAggregate={handleRemindAggregate}
        isLoading={isLoading}
        hasActiveFilters={hasActiveFilters}
        showOverallSummary={false}
      />

      <PlayerPaymentDetailModal
        summary={selectedSummary}
        payments={selectedPayments}
        isLoading={isDetailLoading}
        onClose={handleCloseDetail}
        onRefresh={handleRefreshSelected}
      />
    </>
  );
}
