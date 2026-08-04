'use client';

import { Box, HStack, Text, VStack, Wrap, WrapItem } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { CalendarDays } from 'lucide-react';
import { VDateTimeInput } from '@/components/ui/VDateTimeInput';
import { IFinanceFilters, TFinancePeriod } from '../_utils/financeFilters';

const PRESETS: TFinancePeriod[] = ['thisMonth', 'lastMonth', 'quarter', 'year'];

interface FinanceFilterBarProps {
  filters: IFinanceFilters;
  onChange: (updates: Partial<IFinanceFilters>) => void;
}

export default function FinanceFilterBar({
  filters,
  onChange,
}: FinanceFilterBarProps) {
  const t = useTranslations('payment');

  const presetLabels: Record<TFinancePeriod, string> = {
    thisMonth: t('periodThisMonth'),
    lastMonth: t('periodLastMonth'),
    quarter: t('periodQuarter'),
    year: t('periodYear'),
    custom: t('periodCustom'),
  };

  return (
    <Box
      border="1px solid"
      borderColor="gray.200"
      _dark={{ borderColor: 'gray.700', bg: 'gray.800' }}
      borderRadius="lg"
      p={3}
      bg="white"
      mb={4}
      className="print-hidden"
    >
      <HStack mb={2} gap={1.5}>
        <CalendarDays size={16} />
        <Text fontSize="sm" fontWeight="semibold" color="fg.muted">
          {t('dateRangeLabel')}
        </Text>
      </HStack>

      <Wrap gap={2} mb={3}>
        {PRESETS.map((preset) => {
          const isSelected = filters.period === preset;
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
                onClick={() => onChange({ period: preset, from: '', to: '' })}
              >
                {presetLabels[preset]}
              </Box>
            </WrapItem>
          );
        })}
      </Wrap>

      <VStack align="stretch" gap={1.5}>
        <Text fontSize="xs" color="fg.muted">
          {t('customRangeLabel')}
        </Text>
        <HStack gap={2}>
          <Box flex={1}>
            <Text fontSize="xs" color="fg.muted" mb={0.5}>
              {t('fromDate')}
            </Text>
            <VDateTimeInput
              type="date"
              size="sm"
              value={filters.from}
              max={filters.to || undefined}
              onChange={(e) =>
                onChange({ period: 'custom', from: e.target.value })
              }
              placeholder={t('selectDate')}
              bg="white"
              _dark={{ bg: 'gray.800' }}
            />
          </Box>
          <Box flex={1}>
            <Text fontSize="xs" color="fg.muted" mb={0.5}>
              {t('toDate')}
            </Text>
            <VDateTimeInput
              type="date"
              size="sm"
              value={filters.to}
              min={filters.from || undefined}
              onChange={(e) =>
                onChange({ period: 'custom', to: e.target.value })
              }
              placeholder={t('selectDate')}
              bg="white"
              _dark={{ bg: 'gray.800' }}
            />
          </Box>
        </HStack>
      </VStack>
    </Box>
  );
}
