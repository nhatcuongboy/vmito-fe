'use client';

import {
  Box,
  HStack,
  SimpleGrid,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { TrendingUp } from 'lucide-react';
import type { IHostFinanceReport } from '@/lib/api/types';
import FinanceKpiGrid from './FinanceKpiGrid';
import IncomeExpenseChart from './charts/IncomeExpenseChart';

interface OverviewTabProps {
  report: IHostFinanceReport | null;
  isLoading: boolean;
}

export default function OverviewTab({ report, isLoading }: OverviewTabProps) {
  const t = useTranslations('payment');

  const totals = report?.totals ?? null;
  const collectedPercent =
    totals && totals.income > 0
      ? Math.round((totals.collected / totals.income) * 100)
      : 0;

  return (
    <VStack align="stretch" gap={4}>
      <Box
        bg="white"
        _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
        border="1px solid"
        borderColor="gray.200"
        borderRadius="lg"
        p={4}
      >
        <HStack mb={2} justify="space-between" wrap="wrap">
          <HStack>
            <Box color="green.600" _dark={{ color: 'green.400' }}>
              <TrendingUp size={18} />
            </Box>
            <Text fontWeight="semibold">{t('overallSummary')}</Text>
          </HStack>
          {isLoading ? (
            <Skeleton height="14px" width="140px" />
          ) : (
            <Text fontSize="xs" color="fg.muted">
              {t('playerCount', { count: totals?.playerCount ?? 0 })} ·{' '}
              {totals?.sessionCount ?? 0} {t('sessions')}
            </Text>
          )}
        </HStack>

        <Box mb={3}>
          <Box
            h="8px"
            bg="gray.100"
            _dark={{ bg: 'gray.700' }}
            borderRadius="full"
            overflow="hidden"
          >
            <Box
              h="full"
              w={`${collectedPercent}%`}
              bgGradient="to-r"
              gradientFrom="green.400"
              gradientTo="green.600"
              borderRadius="full"
              transition="width 0.4s ease"
            />
          </Box>
          <Text
            fontSize="xs"
            color="green.600"
            _dark={{ color: 'green.400' }}
            fontWeight="medium"
            mt={1}
          >
            {t('percentCollected', { percent: collectedPercent })}
          </Text>
        </Box>

        <FinanceKpiGrid
          totals={totals}
          previous={report?.previous ?? null}
          isLoading={isLoading}
        />

        {!isLoading && totals && (
          <SimpleGrid columns={{ base: 1, sm: 2 }} gap={2} mt={3}>
            <Text fontSize="xs" color="fg.muted">
              {t('netExpectedHint', {
                amount: new Intl.NumberFormat('vi-VN').format(
                  totals.netExpected
                ),
              })}
            </Text>
          </SimpleGrid>
        )}
      </Box>

      <Box
        bg="white"
        _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
        border="1px solid"
        borderColor="gray.200"
        borderRadius="lg"
        p={4}
      >
        <Text fontWeight="semibold" mb={3}>
          {t('incomeExpenseChart')}
        </Text>
        <IncomeExpenseChart
          series={report?.series ?? []}
          granularity={report?.range.granularity ?? 'month'}
          isLoading={isLoading}
        />
      </Box>
    </VStack>
  );
}
