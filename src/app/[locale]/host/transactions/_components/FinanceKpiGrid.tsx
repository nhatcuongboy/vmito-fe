'use client';

import { Box, Card, HStack, Skeleton, Text, VStack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  Clock,
  Receipt,
  Scale,
  type LucideIcon,
} from 'lucide-react';
import { FeeService } from '@/lib/api/fee.service';
import type {
  IHostFinancePreviousTotals,
  IHostFinanceTotals,
} from '@/lib/api/types';

interface FinanceKpiGridProps {
  totals: IHostFinanceTotals | null;
  previous: IHostFinancePreviousTotals | null;
  isLoading: boolean;
}

interface KpiItem {
  key: string;
  icon: LucideIcon;
  label: string;
  value: number;
  previousValue: number;
  colorPalette: string;
  isHighlighted?: boolean;
}

const percentDelta = (current: number, previous: number): number | null => {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
};

function DeltaBadge({ delta, label }: { delta: number | null; label: string }) {
  if (delta === null) return null;

  const isUp = delta > 0;
  const isFlat = delta === 0;
  const palette = isFlat ? 'gray' : isUp ? 'green' : 'red';
  const Icon = isUp ? ArrowUpRight : ArrowDownRight;

  return (
    <HStack gap={0.5} fontSize="xs" color={`${palette}.600`}>
      {!isFlat && <Icon size={12} />}
      <Text fontWeight="medium">
        {isUp ? '+' : ''}
        {delta}%
      </Text>
      <Text color="fg.muted">{label}</Text>
    </HStack>
  );
}

export default function FinanceKpiGrid({
  totals,
  previous,
  isLoading,
}: FinanceKpiGridProps) {
  const t = useTranslations('payment');

  const items: KpiItem[] = [
    {
      key: 'income',
      icon: Banknote,
      label: t('income'),
      value: totals?.income ?? 0,
      previousValue: previous?.income ?? 0,
      colorPalette: 'blue',
    },
    {
      key: 'collected',
      icon: CheckCircle2,
      label: t('collected'),
      value: totals?.collected ?? 0,
      previousValue: previous?.collected ?? 0,
      colorPalette: 'green',
    },
    {
      key: 'outstanding',
      icon: Clock,
      label: t('outstanding'),
      value: totals?.outstanding ?? 0,
      previousValue: previous?.outstanding ?? 0,
      colorPalette: 'orange',
    },
    {
      key: 'expenses',
      icon: Receipt,
      label: t('totalExpenses'),
      value: totals?.expenses ?? 0,
      previousValue: previous?.expenses ?? 0,
      colorPalette: 'purple',
    },
    {
      key: 'netActual',
      icon: Scale,
      label: t('netTotal'),
      value: totals?.netActual ?? 0,
      previousValue: previous?.netActual ?? 0,
      colorPalette: (totals?.netActual ?? 0) < 0 ? 'red' : 'green',
      isHighlighted: true,
    },
  ];

  return (
    <Box
      display="grid"
      gridTemplateColumns={{
        base: 'repeat(2, minmax(0, 1fr))',
        md: 'repeat(5, minmax(0, 1fr))',
      }}
      gap={3}
    >
      {items.map((item) => (
        <Card.Root
          key={item.key}
          height="100%"
          borderColor={
            item.isHighlighted ? `${item.colorPalette}.300` : 'border'
          }
          bg={item.isHighlighted ? `${item.colorPalette}.50` : 'bg.panel'}
          _dark={{
            bg: item.isHighlighted ? `${item.colorPalette}.950` : 'bg.panel',
            borderColor: item.isHighlighted
              ? `${item.colorPalette}.700`
              : 'border',
          }}
        >
          <Card.Body p={3}>
            <VStack align="stretch" gap={1}>
              <HStack gap={2}>
                <Box
                  p={1.5}
                  borderRadius="md"
                  bg={`${item.colorPalette}.100`}
                  _dark={{ bg: `${item.colorPalette}.900/30` }}
                  color={`${item.colorPalette}.600`}
                  aria-hidden="true"
                >
                  <item.icon size={15} />
                </Box>
                <Text fontSize="xs" color="fg.muted" lineClamp={1}>
                  {item.label}
                </Text>
              </HStack>
              {isLoading ? (
                <Skeleton height="26px" width="80%" />
              ) : (
                <Text
                  fontSize={{ base: 'md', md: 'lg' }}
                  fontWeight="bold"
                  fontVariantNumeric="tabular-nums"
                  color={
                    item.isHighlighted ? `${item.colorPalette}.700` : undefined
                  }
                  _dark={
                    item.isHighlighted
                      ? { color: `${item.colorPalette}.300` }
                      : undefined
                  }
                >
                  {FeeService.formatPaymentAmount(item.value)}
                </Text>
              )}
              {!isLoading && previous && (
                <DeltaBadge
                  delta={percentDelta(item.value, item.previousValue)}
                  label={t('vsPreviousPeriod')}
                />
              )}
            </VStack>
          </Card.Body>
        </Card.Root>
      ))}
    </Box>
  );
}
