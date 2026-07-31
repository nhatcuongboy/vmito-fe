'use client';

import { Box, Heading, SimpleGrid, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { Building2, ClipboardList } from 'lucide-react';
import { ROUTES } from '@/constants';
import type { ClubVenueStatsResponse } from '@/lib/api/dashboard.service';
import StatCard from './StatCard';

interface DashboardActionQueueProps {
  data: ClubVenueStatsResponse | null;
  isLoading: boolean;
}

export default function DashboardActionQueue({
  data,
  isLoading,
}: DashboardActionQueueProps) {
  const t = useTranslations('admin.dashboard');
  const pendingClubs =
    data?.clubs.byStatus.find((item) => item.status === 'PENDING')?.count ?? 0;
  const pendingVenueRequests = data?.venues.pendingRequests ?? 0;

  return (
    <Box as="section" aria-labelledby="dashboard-action-queue-title">
      <Heading id="dashboard-action-queue-title" size="md">
        {t('actionQueue.title')}
      </Heading>
      <Text color="fg.muted" fontSize="sm" mt={1} mb={3}>
        {t('actionQueue.description')}
      </Text>
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
        <StatCard
          icon={Building2}
          label={t('clubsVenues.pendingClubs')}
          value={pendingClubs}
          sublabel={
            pendingClubs > 0
              ? t('actionQueue.reviewNow')
              : t('actionQueue.allClear')
          }
          colorPalette={pendingClubs > 0 ? 'orange' : 'green'}
          isHighlighted={pendingClubs > 0}
          isLoading={isLoading && !data}
          href={ROUTES.ADMIN.CLUBS}
        />
        <StatCard
          icon={ClipboardList}
          label={t('clubsVenues.pendingVenueRequests')}
          value={pendingVenueRequests}
          sublabel={
            pendingVenueRequests > 0
              ? t('actionQueue.reviewNow')
              : t('actionQueue.allClear')
          }
          colorPalette={pendingVenueRequests > 0 ? 'orange' : 'green'}
          isHighlighted={pendingVenueRequests > 0}
          isLoading={isLoading && !data}
          href={ROUTES.ADMIN.VENUE_REQUESTS}
        />
      </SimpleGrid>
    </Box>
  );
}
