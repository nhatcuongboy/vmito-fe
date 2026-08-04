'use client';

import { Suspense, useCallback, useEffect, useMemo } from 'react';
import { Container, HStack, Tabs, Text, VStack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { Download, Printer } from 'lucide-react';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/chakra-compat';
import { toaster } from '@/components/ui/toaster';
import { useUrlFilters, stringField } from '@/hooks/useUrlFilters';
import type { UrlFiltersSchema } from '@/hooks/useUrlFilters';
import { UserRole } from '@/lib/api/types';
import { downloadCsv } from '@/lib/utils/exportCsv';
import FinanceFilterBar from './_components/FinanceFilterBar';
import OverviewTab from './_components/OverviewTab';
import BySessionTab from './_components/BySessionTab';
import ByPlayerTab from './_components/ByPlayerTab';
import { useHostFinanceReport } from './_hooks/useHostFinanceReport';
import {
  DEFAULT_FINANCE_PERIOD,
  isFinancePeriod,
  resolveFinanceDateRange,
  toFinanceQueryParams,
} from './_utils/financeFilters';
import type { IFinanceFilters } from './_utils/financeFilters';
import { buildFinanceCsvRows } from './_utils/exportFinanceCsv';

const FINANCE_FILTERS_SCHEMA: UrlFiltersSchema<IFinanceFilters> = {
  period: {
    fromQuery: (raw) => (isFinancePeriod(raw) ? raw : DEFAULT_FINANCE_PERIOD),
    toQuery: (value) => (value === DEFAULT_FINANCE_PERIOD ? null : value),
  },
  from: stringField(''),
  to: stringField(''),
};

const HostTransactionsContent = () => {
  const t = useTranslations('payment');
  const [filters, setFilters] = useUrlFilters(FINANCE_FILTERS_SCHEMA);

  const range = useMemo(() => resolveFinanceDateRange(filters), [filters]);
  const query = useMemo(() => toFinanceQueryParams(range), [range]);

  const { report, isLoading, hasError, reload } = useHostFinanceReport(query);

  useEffect(() => {
    if (hasError) toaster.error({ title: t('loadReportFailed') });
  }, [hasError, t]);

  const handleExport = useCallback(() => {
    if (!report) return;
    const rows = buildFinanceCsvRows(report, {
      period: t('dateRangeLabel'),
      income: t('income'),
      collected: t('collected'),
      outstanding: t('outstanding'),
      expenses: t('totalExpenses'),
      netActual: t('netTotal'),
      netExpected: t('netExpected'),
      bySession: t('tabBySession'),
      byPlayer: t('tabByPlayer'),
      sessionName: t('sessionName'),
      startTime: t('startTime'),
      playerCount: t('playerCountLabel'),
      playerName: t('playerName'),
      sessionCount: t('sessions'),
    });
    downloadCsv(
      `vmito-thu-chi_${report.range.from}_${report.range.to}.csv`,
      rows
    );
  }, [report, t]);

  const handlePrint = useCallback(() => {
    if (typeof window !== 'undefined') window.print();
  }, []);

  const handleFiltersChange = useCallback(
    (updates: Partial<IFinanceFilters>) => setFilters(updates),
    [setFilters]
  );

  return (
    <Container maxW="7xl" px={{ base: 3, md: 6 }} py={{ base: 3, md: 5 }}>
      <VStack align="stretch" gap={4}>
        <Text className="print-hidden" fontSize="sm" color="fg.muted">
          {t('hostTransactionsDescription')}
        </Text>

        <FinanceFilterBar filters={filters} onChange={handleFiltersChange} />

        <Tabs.Root defaultValue="overview" variant="enclosed" lazyMount>
          <Tabs.List className="print-hidden">
            <Tabs.Trigger value="overview">{t('tabOverview')}</Tabs.Trigger>
            <Tabs.Trigger value="bySession">{t('tabBySession')}</Tabs.Trigger>
            <Tabs.Trigger value="byPlayer">{t('tabByPlayer')}</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="overview" pt={4}>
            <OverviewTab report={report} isLoading={isLoading} />
          </Tabs.Content>

          <Tabs.Content value="bySession" pt={4}>
            <BySessionTab
              rows={report?.bySession ?? []}
              isLoading={isLoading}
            />
          </Tabs.Content>

          <Tabs.Content value="byPlayer" pt={4}>
            <ByPlayerTab
              summaries={report?.byPlayer ?? []}
              isLoading={isLoading}
              onDataChanged={reload}
            />
          </Tabs.Content>
        </Tabs.Root>

        <HStack className="print-hidden" justify="center" gap={2} pt={2}>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            disabled={!report || isLoading}
            aria-label={t('exportCsv')}
            title={t('exportCsv')}
            px={{ base: 2, md: 3 }}
          >
            <Download size={16} />
            <Text ml={1} display={{ base: 'none', md: 'inline' }}>
              {t('exportCsv')}
            </Text>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handlePrint}
            disabled={!report || isLoading}
            aria-label={t('printReport')}
            title={t('printReport')}
            px={{ base: 2, md: 3 }}
          >
            <Printer size={16} />
            <Text ml={1} display={{ base: 'none', md: 'inline' }}>
              {t('printReport')}
            </Text>
          </Button>
        </HStack>
      </VStack>
    </Container>
  );
};

export default function HostTransactionsPage() {
  const t = useTranslations('payment');

  return (
    <ProtectedRouteGuard requiredRole={[UserRole.HOST, UserRole.ADMIN]}>
      <Suspense>
        <PageLayout title={t('manageTransactions')}>
          <HostTransactionsContent />
        </PageLayout>
      </Suspense>
    </ProtectedRouteGuard>
  );
}
