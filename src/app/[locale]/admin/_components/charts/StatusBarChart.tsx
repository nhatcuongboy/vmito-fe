'use client';

import { Box, Text } from '@chakra-ui/react';
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
}

export default function StatusBarChart({
  title,
  data,
  color = '#16a34a',
  emptyLabel = 'Chưa có dữ liệu',
}: StatusBarChartProps) {
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
          h="200px"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Text fontSize="sm" color="gray.500">
            {emptyLabel}
          </Text>
        </Box>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={data}
            margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridColor}
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: textColor }}
              axisLine={{ stroke: gridColor }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12, fill: textColor }}
              axisLine={{ stroke: gridColor }}
              tickLine={false}
              width={32}
            />
            <Tooltip
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
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Box>
  );
}
