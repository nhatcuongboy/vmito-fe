'use client';

import { Suspense, useEffect, useMemo } from 'react';
import { Box, Container, Flex, Heading, Text, VStack } from '@chakra-ui/react';
import { useLocale, useTranslations } from 'next-intl';
import { LayoutDashboard } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { toaster } from '@/components/ui/toaster';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRouter } from '@/i18n/config';
import { UserRole } from '@/lib/api/types';
import {
  stringField,
  type UrlFilterField,
  useUrlFilters,
} from '@/hooks/useUrlFilters';
import DashboardActionQueue from './_components/DashboardActionQueue';
import DashboardBreakdownPanels from './_components/DashboardBreakdownPanels';
import DashboardGrowthPanel from './_components/DashboardGrowthPanel';
import DashboardKpiGrid from './_components/DashboardKpiGrid';
import DashboardToolbar from './_components/DashboardToolbar';
import { useAdminDashboardStats } from './_hooks/useAdminDashboardStats';
import {
  DEFAULT_DASHBOARD_PERIOD,
  type DashboardPeriod,
  isDashboardPeriod,
  resolveDashboardDateRange,
  toDashboardQueryParams,
} from './_utils/dashboardFilters';

const periodField: UrlFilterField<DashboardPeriod> = {
  fromQuery: (value) =>
    value && isDashboardPeriod(value) ? value : DEFAULT_DASHBOARD_PERIOD,
  toQuery: (value) => (value === DEFAULT_DASHBOARD_PERIOD ? null : value),
};

const DASHBOARD_FILTERS_SCHEMA = {
  period: periodField,
  from: stringField(''),
  to: stringField(''),
};

export default function AdminDashboardPage() {
  return (
    <Suspense>
      <AdminDashboardContent />
    </Suspense>
  );
}

function AdminDashboardContent() {
  const t = useTranslations('admin');
  const locale = useLocale();
  const router = useRouter();
  const { isAuthenticated, isHydrated, user: currentUser } = useAuthStore();
  const [filters, setFilters] = useUrlFilters(DASHBOARD_FILTERS_SCHEMA);
  const dateRange = useMemo(
    () => resolveDashboardDateRange(filters),
    [filters]
  );
  const query = useMemo(
    () => (dateRange ? toDashboardQueryParams(dateRange) : null),
    [dateRange]
  );
  const isAdmin =
    isHydrated && isAuthenticated && currentUser?.role === UserRole.ADMIN;
  const {
    users,
    sessionsTournaments,
    clubsVenues,
    errors,
    isLoading,
    lastUpdatedAt,
    reload,
  } = useAdminDashboardStats(isAdmin ? query : null);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      router.replace('/auth/signin');
      return;
    }
    if (!currentUser) return;
    if (currentUser.role !== UserRole.ADMIN) {
      toaster.error({ title: t('accessDenied') });
      router.replace('/dashboard');
    }
  }, [isHydrated, isAuthenticated, currentUser, router, t]);

  if (!isHydrated || !currentUser || currentUser.role !== UserRole.ADMIN) {
    return null;
  }

  const rangeLabel =
    filters.period === 'custom' && dateRange
      ? new Intl.DateTimeFormat(locale, {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).formatRange(
          new Date(`${filters.from}T00:00:00`),
          new Date(`${filters.to}T00:00:00`)
        )
      : t(`dashboard.filters.${filters.period}`);

  return (
    <MainLayout title={t('dashboard.title')}>
      <Box bg="bg.subtle" minH="100%">
        <Container maxW="container.xl" py={{ base: 5, md: 8 }}>
          <VStack gap={{ base: 5, md: 6 }} align="stretch">
            <Flex align="center" gap={3}>
              <Box
                p={2.5}
                borderRadius="lg"
                bg="green.100"
                _dark={{ bg: 'green.900/30' }}
                color="green.600"
                aria-hidden="true"
              >
                <LayoutDashboard size={24} />
              </Box>
              <Box minW={0}>
                <Heading size="lg" textWrap="balance">
                  {t('dashboard.title')}
                </Heading>
                <Text color="fg.muted" fontSize={{ base: 'sm', md: 'md' }}>
                  {t('dashboard.subtitle')}
                </Text>
              </Box>
            </Flex>

            <DashboardToolbar
              filters={filters}
              isRangeValid={dateRange !== null}
              isLoading={isLoading}
              lastUpdatedAt={lastUpdatedAt}
              onFiltersChange={setFilters}
              onRefresh={reload}
            />

            <DashboardKpiGrid
              users={users}
              sessionsTournaments={sessionsTournaments}
              clubsVenues={clubsVenues}
              isLoading={isLoading}
              rangeLabel={rangeLabel}
            />

            <DashboardActionQueue data={clubsVenues} isLoading={isLoading} />

            <DashboardGrowthPanel
              users={users}
              sessionsTournaments={sessionsTournaments}
              isLoading={isLoading}
              hasUsersError={errors.users}
              hasSessionsError={errors.sessionsTournaments}
              rangeLabel={rangeLabel}
              onRetry={reload}
            />

            <DashboardBreakdownPanels
              users={users}
              sessionsTournaments={sessionsTournaments}
              clubsVenues={clubsVenues}
              isLoading={isLoading}
              hasUsersError={errors.users}
              hasSessionsError={errors.sessionsTournaments}
              hasClubsError={errors.clubsVenues}
              onRetry={reload}
            />
          </VStack>
        </Container>
      </Box>
    </MainLayout>
  );
}
