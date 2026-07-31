'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ClubVenueStatsResponse,
  DashboardQueryParams,
  DashboardService,
  SessionTournamentStatsResponse,
  UserStatsResponse,
} from '@/lib/api/dashboard.service';

type DashboardDataKey = 'users' | 'sessionsTournaments' | 'clubsVenues';

interface DashboardData {
  users: UserStatsResponse | null;
  sessionsTournaments: SessionTournamentStatsResponse | null;
  clubsVenues: ClubVenueStatsResponse | null;
}

type DashboardErrors = Record<DashboardDataKey, boolean>;

const INITIAL_DATA: DashboardData = {
  users: null,
  sessionsTournaments: null,
  clubsVenues: null,
};

const INITIAL_ERRORS: DashboardErrors = {
  users: false,
  sessionsTournaments: false,
  clubsVenues: false,
};

export const useAdminDashboardStats = (query: DashboardQueryParams | null) => {
  const [data, setData] = useState<DashboardData>(INITIAL_DATA);
  const [errors, setErrors] = useState<DashboardErrors>(INITIAL_ERRORS);
  const [isLoading, setIsLoading] = useState(query !== null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!query) {
      setIsLoading(false);
      return;
    }

    let isCurrent = true;
    setIsLoading(true);
    setErrors(INITIAL_ERRORS);

    const load = async () => {
      const results = await Promise.allSettled([
        DashboardService.getUserStats(query),
        DashboardService.getSessionTournamentStats(query),
        DashboardService.getClubVenueStats(query),
      ]);

      if (!isCurrent) return;

      const [usersResult, sessionsResult, clubsResult] = results;
      setData((current) => ({
        users:
          usersResult.status === 'fulfilled'
            ? usersResult.value
            : current.users,
        sessionsTournaments:
          sessionsResult.status === 'fulfilled'
            ? sessionsResult.value
            : current.sessionsTournaments,
        clubsVenues:
          clubsResult.status === 'fulfilled'
            ? clubsResult.value
            : current.clubsVenues,
      }));
      setErrors({
        users: usersResult.status === 'rejected',
        sessionsTournaments: sessionsResult.status === 'rejected',
        clubsVenues: clubsResult.status === 'rejected',
      });

      if (results.some((result) => result.status === 'fulfilled')) {
        setLastUpdatedAt(new Date());
      }
      setIsLoading(false);
    };

    void load();

    return () => {
      isCurrent = false;
    };
  }, [query, reloadKey]);

  return {
    ...data,
    errors,
    isLoading,
    lastUpdatedAt,
    reload,
  };
};
