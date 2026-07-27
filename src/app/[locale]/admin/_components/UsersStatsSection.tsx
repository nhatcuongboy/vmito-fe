'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, SimpleGrid, VStack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { Users, UserPlus } from 'lucide-react';
import AppErrorState from '@/components/ui/AppErrorState';
import {
  DashboardService,
  UserStatsResponse,
} from '@/lib/api/dashboard.service';
import StatCard from './StatCard';
import TrendLineChart from './charts/TrendLineChart';
import StatusBarChart from './charts/StatusBarChart';

export default function UsersStatsSection() {
  const t = useTranslations('admin');
  const [data, setData] = useState<UserStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(false);
    try {
      const result = await DashboardService.getUserStats();
      setData(result);
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <AppErrorState
        title={t('dashboard.loadError')}
        onRetry={load}
        retryLabel={t('dashboard.retry')}
      />
    );
  }

  return (
    <VStack gap={4} align="stretch">
      <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
        <StatCard
          icon={Users}
          label={t('dashboard.users.total')}
          value={data?.total ?? 0}
          isLoading={isLoading}
        />
        <StatCard
          icon={UserPlus}
          label={t('dashboard.users.newInRange')}
          value={data?.newInRange ?? 0}
          sublabel={t('dashboard.last30Days')}
          colorPalette="blue"
          isLoading={isLoading}
        />
      </SimpleGrid>

      <Card.Root>
        <Card.Body>
          <SimpleGrid columns={{ base: 1, lg: 3 }} gap={6}>
            <TrendLineChart
              title={t('dashboard.users.trend')}
              data={data?.trend ?? []}
            />
            <StatusBarChart
              title={t('dashboard.users.byRole')}
              data={(data?.byRole ?? []).map((r) => ({
                label: t(`dashboard.roleLabels.${r.role}`),
                count: r.count,
              }))}
              color="#2563eb"
            />
            <StatusBarChart
              title={t('dashboard.users.byGender')}
              data={(data?.byGender ?? []).map((g) => ({
                label: t(`dashboard.genderLabels.${g.gender ?? 'UNSPECIFIED'}`),
                count: g.count,
              }))}
              color="#db2777"
            />
          </SimpleGrid>
        </Card.Body>
      </Card.Root>
    </VStack>
  );
}
