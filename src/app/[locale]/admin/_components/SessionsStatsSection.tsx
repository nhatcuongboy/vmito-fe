'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, SimpleGrid, VStack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { CalendarDays } from 'lucide-react';
import AppErrorState from '@/components/ui/AppErrorState';
import {
  DashboardService,
  SessionTournamentStatsResponse,
} from '@/lib/api/dashboard.service';
import StatCard from './StatCard';
import TrendLineChart from './charts/TrendLineChart';
import StatusBarChart from './charts/StatusBarChart';

export default function SessionsStatsSection() {
  const t = useTranslations('admin');
  const [data, setData] = useState<SessionTournamentStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(false);
    try {
      const result = await DashboardService.getSessionTournamentStats();
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

  const statusLabel = (status: string) => t(`sessions.status.${status}`);

  return (
    <VStack gap={4} align="stretch">
      <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
        <StatCard
          icon={CalendarDays}
          label={t('dashboard.sessionsTournaments.totalSessions')}
          value={data?.sessions?.total ?? 0}
          isLoading={isLoading}
        />
      </SimpleGrid>

      <Card.Root>
        <Card.Body>
          <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
            <TrendLineChart
              title={t('dashboard.sessionsTournaments.sessionsTrend')}
              data={data?.sessions?.trend ?? []}
            />
            <StatusBarChart
              title={t('dashboard.sessionsTournaments.sessionsByStatus')}
              data={(data?.sessions?.byStatus ?? []).map((s) => ({
                label: statusLabel(s.status),
                count: s.count,
              }))}
            />
          </SimpleGrid>
        </Card.Body>
      </Card.Root>
    </VStack>
  );
}
