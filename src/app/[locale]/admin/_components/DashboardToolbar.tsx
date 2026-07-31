'use client';

import {
  Box,
  Button,
  Field,
  Flex,
  HStack,
  IconButton,
  Input,
  Text,
} from '@chakra-ui/react';
import { RefreshCw } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { VTooltip } from '@/components/ui/VTooltip';
import type {
  DashboardFilters,
  DashboardPeriod,
} from '../_utils/dashboardFilters';

interface DashboardToolbarProps {
  filters: DashboardFilters;
  isRangeValid: boolean;
  isLoading: boolean;
  lastUpdatedAt: Date | null;
  onFiltersChange: (updates: Partial<DashboardFilters>) => void;
  onRefresh: () => void;
}

const PERIODS: Exclude<DashboardPeriod, 'custom'>[] = ['7d', '30d', '90d'];

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function DashboardToolbar({
  filters,
  isRangeValid,
  isLoading,
  lastUpdatedAt,
  onFiltersChange,
  onRefresh,
}: DashboardToolbarProps) {
  const t = useTranslations('admin.dashboard');
  const locale = useLocale();

  const handlePeriodChange = (period: DashboardPeriod) => {
    if (period === 'custom') {
      const to = new Date();
      const from = new Date(to);
      from.setDate(from.getDate() - 29);
      onFiltersChange({
        period,
        from: formatDateInput(from),
        to: formatDateInput(to),
      });
      return;
    }
    onFiltersChange({ period, from: '', to: '' });
  };

  return (
    <Box
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border"
      borderRadius="lg"
      p={{ base: 3, md: 4 }}
    >
      <Flex
        gap={4}
        align={{ base: 'stretch', lg: 'center' }}
        justify="space-between"
        direction={{ base: 'column', lg: 'row' }}
      >
        <Box minW={0}>
          <Text fontSize="sm" fontWeight="semibold">
            {t('filters.title')}
          </Text>
          <Text fontSize="xs" color="fg.muted" mt={0.5}>
            {lastUpdatedAt
              ? t('lastUpdated', {
                  time: new Intl.DateTimeFormat(locale, {
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(lastUpdatedAt),
                })
              : t('notUpdatedYet')}
          </Text>
        </Box>

        <Flex gap={2} wrap="wrap" align={{ base: 'stretch', sm: 'center' }}>
          <HStack gap={1} overflowX="auto" pb={{ base: 1, sm: 0 }}>
            {PERIODS.map((period) => (
              <Button
                key={period}
                size="sm"
                variant={filters.period === period ? 'solid' : 'outline'}
                colorPalette="green"
                onClick={() => handlePeriodChange(period)}
                flexShrink={0}
              >
                {t(`filters.${period}`)}
              </Button>
            ))}
            <Button
              size="sm"
              variant={filters.period === 'custom' ? 'solid' : 'outline'}
              colorPalette="green"
              onClick={() => handlePeriodChange('custom')}
              flexShrink={0}
            >
              {t('filters.custom')}
            </Button>
          </HStack>

          <VTooltip content={t('refresh')}>
            <IconButton
              aria-label={t('refresh')}
              size="sm"
              variant="outline"
              onClick={onRefresh}
              loading={isLoading}
            >
              <RefreshCw size={16} />
            </IconButton>
          </VTooltip>
        </Flex>
      </Flex>

      {filters.period === 'custom' && (
        <Flex gap={3} mt={4} direction={{ base: 'column', sm: 'row' }}>
          <Field.Root invalid={Boolean(filters.from) && !isRangeValid}>
            <Field.Label>{t('filters.from')}</Field.Label>
            <Input
              type="date"
              value={filters.from}
              onChange={(event) =>
                onFiltersChange({ from: event.target.value })
              }
              max={filters.to || undefined}
            />
          </Field.Root>
          <Field.Root invalid={Boolean(filters.to) && !isRangeValid}>
            <Field.Label>{t('filters.to')}</Field.Label>
            <Input
              type="date"
              value={filters.to}
              onChange={(event) => onFiltersChange({ to: event.target.value })}
              min={filters.from || undefined}
            />
          </Field.Root>
        </Flex>
      )}

      {filters.period === 'custom' && !isRangeValid && (
        <Text role="alert" color="red.600" fontSize="sm" mt={2}>
          {t('filters.invalidRange')}
        </Text>
      )}
    </Box>
  );
}
