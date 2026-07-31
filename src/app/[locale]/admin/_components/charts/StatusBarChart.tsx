'use client';

import { Box, Skeleton, Text } from '@chakra-ui/react';
import { useLocale } from 'next-intl';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useColorModeValue } from '@/components/ui/ChakraHooks';

export interface StatusDatum {
  label: string;
  count: number;
}

interface StatusBarChartProps {
  title: string;
  data: StatusDatum[];
  color?: string;
  emptyLabel?: string;
  isLoading?: boolean;
  ariaLabel?: string;
}

export default function StatusBarChart({
  title,
  data,
  color = '#16a34a',
  emptyLabel = 'Chưa có dữ liệu',
  isLoading = false,
  ariaLabel,
}: StatusBarChartProps) {
  const locale = useLocale();
  const gridColor = useColorModeValue('#e2e8f0', '#2d3748');
  const textColor = useColorModeValue('#718096', '#a0aec0');
  const tooltipBg = useColorModeValue('#ffffff', '#1a202c');

  return (
    <Box role="img" aria-label={ariaLabel ?? title} aria-busy={isLoading}>
      <Text fontSize="sm" fontWeight="semibold" mb={2}>
        {title}
      </Text>
      {isLoading ? (
        <Skeleton height="240px" borderRadius="md" />
      ) : data.length === 0 ? (
        <Box
          h="240px"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Text fontSize="sm" color="gray.500">
            {emptyLabel}
          </Text>
        </Box>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 20, left: 4, bottom: 0 }}
            accessibilityLayer
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridColor}
              vertical={false}
            />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fontSize: 12, fill: textColor }}
              axisLine={{ stroke: gridColor }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={112}
              tick={{ fontSize: 12, fill: textColor }}
              axisLine={{ stroke: gridColor }}
              tickLine={false}
              tickFormatter={(label: string) =>
                label.length > 18 ? `${label.slice(0, 17)}…` : label
              }
            />
            <Tooltip
              formatter={(value) => Number(value).toLocaleString(locale)}
              contentStyle={{
                background: tooltipBg,
                border: `1px solid ${gridColor}`,
                borderRadius: 8,
                fontSize: 13,
              }}
            />
            <Bar
              dataKey="count"
              fill={color}
              radius={[0, 4, 4, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Box>
  );
}
