'use client';

import { useMemo, useState } from 'react';
import { Box, Badge, HStack, Skeleton, Text, VStack } from '@chakra-ui/react';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronRight } from 'lucide-react';
import { useRouter } from '@/i18n/config';
import { VSelect } from '@/components/ui/VSelect';
import dayjs, { getDayjsLocale } from '@/lib/dayjs';
import { FeeService } from '@/lib/api/fee.service';
import type { IHostFinanceSessionRow } from '@/lib/api/types';

type TSessionSort = 'date' | 'netActual' | 'income' | 'outstanding';

interface BySessionTabProps {
  rows: IHostFinanceSessionRow[];
  isLoading: boolean;
}

export default function BySessionTab({ rows, isLoading }: BySessionTabProps) {
  const t = useTranslations('payment');
  const locale = useLocale();
  const router = useRouter();
  const [sortBy, setSortBy] = useState<TSessionSort>('date');

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    switch (sortBy) {
      case 'netActual':
        return copy.sort((a, b) => a.netActual - b.netActual);
      case 'income':
        return copy.sort((a, b) => b.income - a.income);
      case 'outstanding':
        return copy.sort((a, b) => b.outstanding - a.outstanding);
      default:
        return copy.sort(
          (a, b) =>
            dayjs(b.startTime ?? 0).valueOf() -
            dayjs(a.startTime ?? 0).valueOf()
        );
    }
  }, [rows, sortBy]);

  if (isLoading) {
    return (
      <VStack align="stretch" gap={2}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height="88px" borderRadius="lg" />
        ))}
      </VStack>
    );
  }

  if (rows.length === 0) {
    return (
      <Box py={10} textAlign="center">
        <Text fontSize="sm" color="fg.muted">
          {t('noDataInRange')}
        </Text>
      </Box>
    );
  }

  return (
    <VStack align="stretch" gap={3}>
      <Box maxW="260px">
        <VSelect
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as TSessionSort)}
        >
          <option value="date">{t('sortByDate')}</option>
          <option value="netActual">{t('sortByNet')}</option>
          <option value="income">{t('sortTotalAmount')}</option>
          <option value="outstanding">{t('sortPendingAmount')}</option>
        </VSelect>
      </Box>

      {sortedRows.map((row) => {
        const isLoss = row.netActual < 0;
        return (
          <Box
            key={row.sessionId}
            as="button"
            textAlign="left"
            onClick={() => router.push(`/host/sessions/${row.sessionId}`)}
            bg="white"
            _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
            _hover={{ borderColor: 'green.400' }}
            border="1px solid"
            borderColor="gray.200"
            borderRadius="lg"
            p={4}
            transition="border-color 0.15s"
          >
            <HStack justify="space-between" align="start" mb={2}>
              <VStack align="start" gap={0}>
                <Text fontWeight="semibold" fontSize="sm" lineClamp={1}>
                  {row.name}
                </Text>
                <Text fontSize="xs" color="fg.muted">
                  {row.startTime
                    ? dayjs(row.startTime)
                        .locale(getDayjsLocale(locale))
                        .format('DD/MM/YYYY HH:mm')
                    : '—'}{' '}
                  · {t('playerCount', { count: row.playerCount })}
                </Text>
              </VStack>
              <HStack gap={1}>
                {row.outstanding > 0 && (
                  <Badge colorPalette="orange" size="sm">
                    {t('pending')}
                  </Badge>
                )}
                <Box color="fg.muted">
                  <ChevronRight size={16} />
                </Box>
              </HStack>
            </HStack>

            <HStack gap={4} wrap="wrap" fontSize="xs">
              <Text color="fg.muted">
                {t('income')}:{' '}
                <Text as="span" fontWeight="medium" color="fg">
                  {FeeService.formatPaymentAmount(row.income)}
                </Text>
              </Text>
              <Text color="fg.muted">
                {t('collected')}:{' '}
                <Text as="span" fontWeight="medium" color="green.600">
                  {FeeService.formatPaymentAmount(row.collected)}
                </Text>
              </Text>
              <Text color="fg.muted">
                {t('totalExpenses')}:{' '}
                <Text as="span" fontWeight="medium" color="purple.500">
                  {FeeService.formatPaymentAmount(row.expenses)}
                </Text>
              </Text>
              <Text color="fg.muted">
                {t('netTotal')}:{' '}
                <Text
                  as="span"
                  fontWeight="bold"
                  color={isLoss ? 'red.500' : 'green.600'}
                >
                  {FeeService.formatPaymentAmount(row.netActual)}
                </Text>
              </Text>
            </HStack>
          </Box>
        );
      })}
    </VStack>
  );
}
