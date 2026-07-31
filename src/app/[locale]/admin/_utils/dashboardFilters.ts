import type { DashboardQueryParams } from '@/lib/api/dashboard.service';

export type DashboardPeriod = '7d' | '30d' | '90d' | 'custom';

export interface DashboardFilters {
  period: DashboardPeriod;
  from: string;
  to: string;
}

export interface DashboardDateRange {
  from: Date;
  to: Date;
  days: number;
}

export const DEFAULT_DASHBOARD_PERIOD: DashboardPeriod = '30d';
export const MAX_DASHBOARD_RANGE_DAYS = 365;

const PRESET_DAYS: Record<Exclude<DashboardPeriod, 'custom'>, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const startOfUtcDay = (date: Date) =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );

const endOfUtcDay = (date: Date) =>
  new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      23,
      59,
      59,
      999
    )
  );

const parseDateInput = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const isDashboardPeriod = (value: string): value is DashboardPeriod =>
  value === '7d' || value === '30d' || value === '90d' || value === 'custom';

export const resolveDashboardDateRange = (
  filters: DashboardFilters,
  now = new Date()
): DashboardDateRange | null => {
  if (filters.period !== 'custom') {
    const days = PRESET_DAYS[filters.period];
    const to = endOfUtcDay(now);
    const from = startOfUtcDay(new Date(to.getTime() - (days - 1) * DAY_IN_MS));
    return { from, to, days };
  }

  const parsedFrom = parseDateInput(filters.from);
  const parsedTo = parseDateInput(filters.to);
  if (!parsedFrom || !parsedTo) return null;

  const from = startOfUtcDay(parsedFrom);
  const to = endOfUtcDay(parsedTo);
  if (from.getTime() > to.getTime()) return null;

  const days = Math.floor((to.getTime() - from.getTime()) / DAY_IN_MS) + 1;
  if (days > MAX_DASHBOARD_RANGE_DAYS) return null;

  return { from, to, days };
};

export const getDashboardGranularity = (
  days: number
): NonNullable<DashboardQueryParams['granularity']> => {
  if (days <= 31) return 'day';
  if (days <= 180) return 'week';
  return 'month';
};

export const toDashboardQueryParams = (
  range: DashboardDateRange
): DashboardQueryParams => ({
  from: range.from.toISOString(),
  to: range.to.toISOString(),
  granularity: getDashboardGranularity(range.days),
});
