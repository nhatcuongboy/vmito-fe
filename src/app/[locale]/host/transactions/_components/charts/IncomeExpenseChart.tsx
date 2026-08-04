'use client';

import { Box, Skeleton, Text } from '@chakra-ui/react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useColorModeValue } from '@/components/ui/ChakraHooks';
import dayjs, { getDayjsLocale } from '@/lib/dayjs';
import { FeeService } from '@/lib/api/fee.service';
import type {
  IHostFinanceSeriesPoint,
  THostReportGranularity,
} from '@/lib/api/types';

interface IncomeExpenseChartProps {
  series: IHostFinanceSeriesPoint[];
  granularity: THostReportGranularity;
  isLoading: boolean;
}

const BUCKET_FORMAT: Record<THostReportGranularity, string> = {
  day: 'DD/MM',
  week: 'DD/MM',
  month: 'MM/YYYY',
};

const compactAmount = (value: number) => {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${Math.round(value / 100_000) / 10}tr`;
  if (abs >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(value);
};

export default function IncomeExpenseChart({
  series,
  granularity,
  isLoading,
}: IncomeExpenseChartProps) {
  const t = useTranslations('payment');
  const locale = useLocale();
  const dayjsLocale = getDayjsLocale(locale);

  const gridColor = useColorModeValue('#e2e8f0', '#2d3748');
  const textColor = useColorModeValue('#718096', '#a0aec0');
  const tooltipBg = useColorModeValue('#ffffff', '#1a202c');

  const data = series.map((point) => ({
    label: dayjs(point.bucket)
      .locale(dayjsLocale)
      .format(BUCKET_FORMAT[granularity]),
    [t('income')]: point.income,
    [t('totalExpenses')]: point.expenses,
    [t('netTotal')]: point.netActual,
  }));

  if (isLoading) return <Skeleton height="260px" borderRadius="md" />;

  if (data.length === 0) {
    return (
      <Box h="260px" display="flex" alignItems="center" justifyContent="center">
        <Text fontSize="sm" color="fg.muted">
          {t('noDataInRange')}
        </Text>
      </Box>
    );
  }

  return (
    <Box role="img" aria-label={t('incomeExpenseChart')}>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          accessibilityLayer
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={gridColor}
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: textColor }}
            axisLine={{ stroke: gridColor }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: textColor }}
            axisLine={{ stroke: gridColor }}
            tickLine={false}
            tickFormatter={compactAmount}
            width={48}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              border: `1px solid ${gridColor}`,
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value) => FeeService.formatPaymentAmount(Number(value))}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey={t('income')} fill="#3182ce" radius={[4, 4, 0, 0]} />
          <Bar
            dataKey={t('totalExpenses')}
            fill="#9f7aea"
            radius={[4, 4, 0, 0]}
          />
          <Line
            type="monotone"
            dataKey={t('netTotal')}
            stroke="#16a34a"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Box>
  );
}
