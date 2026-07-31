'use client';

import { Card, Heading, SimpleGrid, Tabs, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import AppErrorState from '@/components/ui/AppErrorState';
import type {
  ClubVenueStatsResponse,
  SessionTournamentStatsResponse,
  UserStatsResponse,
} from '@/lib/api/dashboard.service';
import StatusBarChart, { type StatusDatum } from './charts/StatusBarChart';

interface DashboardBreakdownPanelsProps {
  users: UserStatsResponse | null;
  sessionsTournaments: SessionTournamentStatsResponse | null;
  clubsVenues: ClubVenueStatsResponse | null;
  isLoading: boolean;
  hasUsersError: boolean;
  hasSessionsError: boolean;
  hasClubsError: boolean;
  onRetry: () => void;
}

interface BreakdownChartProps {
  title: string;
  data: StatusDatum[];
  isLoading: boolean;
  color?: string;
}

export default function DashboardBreakdownPanels({
  users,
  sessionsTournaments,
  clubsVenues,
  isLoading,
  hasUsersError,
  hasSessionsError,
  hasClubsError,
  onRetry,
}: DashboardBreakdownPanelsProps) {
  const t = useTranslations('admin.dashboard');
  const tAdmin = useTranslations('admin');

  const statusLabel = (status: string) => {
    if (
      status === 'PREPARING' ||
      status === 'IN_PROGRESS' ||
      status === 'FINISHED' ||
      status === 'CANCELLED'
    ) {
      return tAdmin(`sessions.status.${status}`);
    }
    return t(`statusLabels.${status}`);
  };

  const toStatusData = (items: { status: string; count: number }[]) =>
    items.map((item) => ({
      label: statusLabel(item.status),
      count: item.count,
    }));

  const renderError = () => (
    <AppErrorState
      title={t('loadError')}
      description={t('errors.sectionUnavailable')}
      onRetry={onRetry}
      retryLabel={t('retry')}
      minH="240px"
    />
  );

  const renderChart = ({
    title,
    data,
    isLoading: isChartLoading,
    color,
  }: BreakdownChartProps) => (
    <StatusBarChart
      title={title}
      data={data}
      color={color}
      isLoading={isChartLoading}
      emptyLabel={t('emptyRange')}
      ariaLabel={t('chartSummary', { metric: title })}
    />
  );

  return (
    <SimpleGrid columns={{ base: 1, xl: 2 }} gap={4} alignItems="start">
      <Card.Root as="section">
        <Card.Header pb={0}>
          <Heading size="md">{t('breakdown.usersTitle')}</Heading>
          <Text color="fg.muted" fontSize="sm">
            {t('breakdown.usersDescription')}
          </Text>
        </Card.Header>
        <Card.Body>
          {hasUsersError && !users ? (
            renderError()
          ) : (
            <Tabs.Root defaultValue="role" variant="enclosed">
              <Tabs.List>
                <Tabs.Trigger value="role">{t('breakdown.role')}</Tabs.Trigger>
                <Tabs.Trigger value="gender">
                  {t('breakdown.gender')}
                </Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value="role" pt={4}>
                {renderChart({
                  title: t('users.byRole'),
                  data: (users?.byRole ?? []).map((item) => ({
                    label: t(`roleLabels.${item.role}`),
                    count: item.count,
                  })),
                  isLoading: isLoading && !users,
                })}
              </Tabs.Content>
              <Tabs.Content value="gender" pt={4}>
                {renderChart({
                  title: t('users.byGender'),
                  data: (users?.byGender ?? []).map((item) => ({
                    label: t(`genderLabels.${item.gender ?? 'UNSPECIFIED'}`),
                    count: item.count,
                  })),
                  isLoading: isLoading && !users,
                  color: 'var(--chakra-colors-pink-600)',
                })}
              </Tabs.Content>
            </Tabs.Root>
          )}
        </Card.Body>
      </Card.Root>

      <Card.Root as="section">
        <Card.Header pb={0}>
          <Heading size="md">{t('breakdown.operationsTitle')}</Heading>
          <Text color="fg.muted" fontSize="sm">
            {t('breakdown.operationsDescription')}
          </Text>
        </Card.Header>
        <Card.Body>
          <Tabs.Root defaultValue="sessions" variant="enclosed">
            <Tabs.List overflowX="auto" maxW="100%">
              <Tabs.Trigger value="sessions">
                {t('sessions.sectionTitle')}
              </Tabs.Trigger>
              <Tabs.Trigger value="tournaments">
                {t('tournaments.sectionTitle')}
              </Tabs.Trigger>
              <Tabs.Trigger value="clubs">
                {t('clubs.sectionTitle')}
              </Tabs.Trigger>
              <Tabs.Trigger value="venues">
                {t('venues.sectionTitle')}
              </Tabs.Trigger>
              <Tabs.Trigger value="requests">
                {t('breakdown.requests')}
              </Tabs.Trigger>
              <Tabs.Trigger value="courts">
                {t('breakdown.courts')}
              </Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="sessions" pt={4}>
              {hasSessionsError && !sessionsTournaments
                ? renderError()
                : renderChart({
                    title: t('sessionsTournaments.sessionsByStatus'),
                    data: toStatusData(
                      sessionsTournaments?.sessions.byStatus ?? []
                    ),
                    isLoading: isLoading && !sessionsTournaments,
                  })}
            </Tabs.Content>
            <Tabs.Content value="tournaments" pt={4}>
              {hasSessionsError && !sessionsTournaments
                ? renderError()
                : renderChart({
                    title: t('sessionsTournaments.tournamentsByStatus'),
                    data: toStatusData(
                      sessionsTournaments?.tournaments.byStatus ?? []
                    ),
                    isLoading: isLoading && !sessionsTournaments,
                    color: 'var(--chakra-colors-blue-600)',
                  })}
            </Tabs.Content>
            <Tabs.Content value="clubs" pt={4}>
              {hasClubsError && !clubsVenues
                ? renderError()
                : renderChart({
                    title: t('clubsVenues.clubsByStatus'),
                    data: toStatusData(clubsVenues?.clubs.byStatus ?? []),
                    isLoading: isLoading && !clubsVenues,
                  })}
            </Tabs.Content>
            <Tabs.Content value="venues" pt={4}>
              {hasClubsError && !clubsVenues
                ? renderError()
                : renderChart({
                    title: t('clubsVenues.venuesByStatus'),
                    data: toStatusData(clubsVenues?.venues.byStatus ?? []),
                    isLoading: isLoading && !clubsVenues,
                    color: 'var(--chakra-colors-teal-600)',
                  })}
            </Tabs.Content>
            <Tabs.Content value="requests" pt={4}>
              {hasClubsError && !clubsVenues
                ? renderError()
                : renderChart({
                    title: t('clubsVenues.venueRequestsByStatus'),
                    data: toStatusData(
                      clubsVenues?.venues.requestsByStatus ?? []
                    ),
                    isLoading: isLoading && !clubsVenues,
                    color: 'var(--chakra-colors-orange-600)',
                  })}
            </Tabs.Content>
            <Tabs.Content value="courts" pt={4}>
              {hasClubsError && !clubsVenues
                ? renderError()
                : renderChart({
                    title: t('clubsVenues.courtsByStatus'),
                    data: toStatusData(clubsVenues?.courts.byStatus ?? []),
                    isLoading: isLoading && !clubsVenues,
                    color: 'var(--chakra-colors-cyan-600)',
                  })}
            </Tabs.Content>
          </Tabs.Root>
        </Card.Body>
      </Card.Root>
    </SimpleGrid>
  );
}
