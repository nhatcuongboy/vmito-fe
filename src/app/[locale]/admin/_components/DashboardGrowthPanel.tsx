'use client';

import { Card, Heading, Tabs, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import AppErrorState from '@/components/ui/AppErrorState';
import type {
  SessionTournamentStatsResponse,
  UserStatsResponse,
} from '@/lib/api/dashboard.service';
import TrendLineChart from './charts/TrendLineChart';

interface DashboardGrowthPanelProps {
  users: UserStatsResponse | null;
  sessionsTournaments: SessionTournamentStatsResponse | null;
  isLoading: boolean;
  hasUsersError: boolean;
  hasSessionsError: boolean;
  rangeLabel: string;
  onRetry: () => void;
}

export default function DashboardGrowthPanel({
  users,
  sessionsTournaments,
  isLoading,
  hasUsersError,
  hasSessionsError,
  rangeLabel,
  onRetry,
}: DashboardGrowthPanelProps) {
  const t = useTranslations('admin.dashboard');

  const renderError = () => (
    <AppErrorState
      title={t('loadError')}
      description={t('errors.sectionUnavailable')}
      onRetry={onRetry}
      retryLabel={t('retry')}
      minH="220px"
    />
  );

  return (
    <Card.Root as="section">
      <Card.Header pb={0}>
        <Heading size="md">{t('growth.title')}</Heading>
        <Text color="fg.muted" fontSize="sm">
          {t('growth.description', { range: rangeLabel })}
        </Text>
      </Card.Header>
      <Card.Body>
        <Tabs.Root defaultValue="users" variant="enclosed">
          <Tabs.List overflowX="auto" maxW="100%">
            <Tabs.Trigger value="users">{t('users.sectionTitle')}</Tabs.Trigger>
            <Tabs.Trigger value="sessions">
              {t('sessions.sectionTitle')}
            </Tabs.Trigger>
            <Tabs.Trigger value="tournaments">
              {t('tournaments.sectionTitle')}
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="users" pt={4}>
            {hasUsersError && !users ? (
              renderError()
            ) : (
              <TrendLineChart
                title={t('users.trend')}
                data={users?.trend ?? []}
                isLoading={isLoading && !users}
                emptyLabel={t('emptyRange')}
                ariaLabel={t('chartSummary', { metric: t('users.trend') })}
              />
            )}
          </Tabs.Content>
          <Tabs.Content value="sessions" pt={4}>
            {hasSessionsError && !sessionsTournaments ? (
              renderError()
            ) : (
              <TrendLineChart
                title={t('sessionsTournaments.sessionsTrend')}
                data={sessionsTournaments?.sessions.trend ?? []}
                isLoading={isLoading && !sessionsTournaments}
                emptyLabel={t('emptyRange')}
                ariaLabel={t('chartSummary', {
                  metric: t('sessionsTournaments.sessionsTrend'),
                })}
              />
            )}
          </Tabs.Content>
          <Tabs.Content value="tournaments" pt={4}>
            {hasSessionsError && !sessionsTournaments ? (
              renderError()
            ) : (
              <TrendLineChart
                title={t('sessionsTournaments.tournamentsTrend')}
                data={sessionsTournaments?.tournaments.trend ?? []}
                color="var(--chakra-colors-blue-600)"
                isLoading={isLoading && !sessionsTournaments}
                emptyLabel={t('emptyRange')}
                ariaLabel={t('chartSummary', {
                  metric: t('sessionsTournaments.tournamentsTrend'),
                })}
              />
            )}
          </Tabs.Content>
        </Tabs.Root>
      </Card.Body>
    </Card.Root>
  );
}
