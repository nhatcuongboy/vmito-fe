'use client';

import { Box, Text } from '@chakra-ui/react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useColorModeValue } from '@/components/ui/ChakraHooks';

export interface TrendPoint {
  bucket: string;
  count: number;
}

interface TrendLineChartProps {
  title: string;
  data: TrendPoint[];
  color?: string;
  emptyLabel?: string;
}

const formatBucketLabel = (bucket: string) =>
  new Date(bucket).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  });

export default function TrendLineChart({
  title,
  data,
  color = '#16a34a',
  emptyLabel = 'Chưa có dữ liệu',
}: TrendLineChartProps) {
  const gridColor = useColorModeValue('#e2e8f0', '#2d3748');
  const textColor = useColorModeValue('#718096', '#a0aec0');
  const tooltipBg = useColorModeValue('#ffffff', '#1a202c');

  return (
    <Box>
      <Text fontSize="sm" fontWeight="semibold" mb={2}>
        {title}
      </Text>
      {data.length === 0 ? (
        <Box
          h="220px"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Text fontSize="sm" color="gray.500">
            {emptyLabel}
          </Text>
        </Box>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart
            data={data}
            margin={{ top: 4, right: 8, left: 4, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="bucket"
              tickFormatter={formatBucketLabel}
              tick={{ fontSize: 12, fill: textColor }}
              axisLine={{ stroke: gridColor }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12, fill: textColor }}
              axisLine={{ stroke: gridColor }}
              tickLine={false}
            />
            <Tooltip
              labelFormatter={(label) => formatBucketLabel(String(label))}
              contentStyle={{
                background: tooltipBg,
                border: `1px solid ${gridColor}`,
                borderRadius: 8,
                fontSize: 13,
              }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Box>
  );
}
