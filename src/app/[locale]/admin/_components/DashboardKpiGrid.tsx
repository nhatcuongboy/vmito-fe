'use client';

import { SimpleGrid } from '@chakra-ui/react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Building2,
  CalendarDays,
  MapPin,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react';
import type {
  ClubVenueStatsResponse,
  SessionTournamentStatsResponse,
  UserStatsResponse,
} from '@/lib/api/dashboard.service';
import StatCard from './StatCard';

interface DashboardKpiGridProps {
  users: UserStatsResponse | null;
  sessionsTournaments: SessionTournamentStatsResponse | null;
  clubsVenues: ClubVenueStatsResponse | null;
  isLoading: boolean;
  rangeLabel: string;
}

export default function DashboardKpiGrid({
  users,
  sessionsTournaments,
  clubsVenues,
  isLoading,
  rangeLabel,
}: DashboardKpiGridProps) {
  const t = useTranslations('admin.dashboard');
  const locale = useLocale();
  const formatNumber = (value: number) =>
    new Intl.NumberFormat(locale).format(value);

  return (
    <SimpleGrid columns={{ base: 1, sm: 2, lg: 3, xl: 6 }} gap={3}>
      <StatCard
        icon={Users}
        label={t('users.total')}
        value={formatNumber(users?.total ?? 0)}
        isLoading={isLoading && !users}
      />
      <StatCard
        icon={UserPlus}
        label={t('users.newInRange')}
        value={formatNumber(users?.newInRange ?? 0)}
        sublabel={rangeLabel}
        colorPalette="blue"
        isLoading={isLoading && !users}
      />
      <StatCard
        icon={CalendarDays}
        label={t('sessionsTournaments.totalSessions')}
        value={formatNumber(sessionsTournaments?.sessions.total ?? 0)}
        isLoading={isLoading && !sessionsTournaments}
      />
      <StatCard
        icon={Trophy}
        label={t('sessionsTournaments.totalTournaments')}
        value={formatNumber(sessionsTournaments?.tournaments.total ?? 0)}
        colorPalette="blue"
        isLoading={isLoading && !sessionsTournaments}
      />
      <StatCard
        icon={Building2}
        label={t('clubsVenues.totalClubs')}
        value={formatNumber(clubsVenues?.clubs.total ?? 0)}
        isLoading={isLoading && !clubsVenues}
      />
      <StatCard
        icon={MapPin}
        label={t('clubsVenues.totalVenues')}
        value={formatNumber(clubsVenues?.venues.total ?? 0)}
        colorPalette="teal"
        isLoading={isLoading && !clubsVenues}
      />
    </SimpleGrid>
  );
}
