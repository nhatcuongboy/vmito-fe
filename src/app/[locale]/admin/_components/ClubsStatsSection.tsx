'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, SimpleGrid, VStack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { Users, Hourglass } from 'lucide-react';
import AppErrorState from '@/components/ui/AppErrorState';
import { ROUTES } from '@/constants';
import {
  DashboardService,
  ClubVenueStatsResponse,
} from '@/lib/api/dashboard.service';
import StatCard from './StatCard';
import StatusBarChart from './charts/StatusBarChart';

export default function ClubsStatsSection() {
  const t = useTranslations('admin');
  const [data, setData] = useState<ClubVenueStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(false);
    try {
      const result = await DashboardService.getClubVenueStats();
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

  const statusLabel = (status: string) => t(`dashboard.statusLabels.${status}`);
  const pendingClubs =
    data?.clubs?.byStatus?.find((s) => s.status === 'PENDING')?.count ?? 0;

  return (
    <VStack gap={4} align="stretch">
      <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
        <StatCard
          icon={Users}
          label={t('dashboard.clubsVenues.totalClubs')}
          value={data?.clubs?.total ?? 0}
          isLoading={isLoading}
        />
        <StatCard
          icon={Hourglass}
          label={t('dashboard.clubsVenues.pendingClubs')}
          value={pendingClubs}
          colorPalette="orange"
          isLoading={isLoading}
          href={ROUTES.ADMIN.CLUBS}
        />
      </SimpleGrid>

      <Card.Root>
        <Card.Body>
          <StatusBarChart
            title={t('dashboard.clubsVenues.clubsByStatus')}
            data={(data?.clubs?.byStatus ?? []).map((s) => ({
              label: statusLabel(s.status),
              count: s.count,
            }))}
          />
        </Card.Body>
      </Card.Root>
    </VStack>
  );
}
