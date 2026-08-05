import type { THostReportGranularity } from '@/lib/api/types';

export type TFinancePeriod =
  | 'thisMonth'
  | 'lastMonth'
  | 'quarter'
  | 'year'
  | 'custom';

export type IFinanceFilters = {
  period: TFinancePeriod;
  from: string;
  to: string;
};

export interface IFinanceDateRange {
  from: Date;
  to: Date;
  days: number;
}

export interface IFinanceQueryParams {
  from: string;
  to: string;
  granularity: THostReportGranularity;
}

export const DEFAULT_FINANCE_PERIOD: TFinancePeriod = 'thisMonth';
export const MAX_FINANCE_RANGE_DAYS = 730;

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

const startOfUtcMonth = (date: Date, monthOffset = 0) =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + monthOffset, 1)
  );

const endOfUtcMonth = (date: Date, monthOffset = 0) =>
  new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth() + monthOffset + 1,
      0,
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

const countDays = (from: Date, to: Date) =>
  Math.floor((to.getTime() - from.getTime()) / DAY_IN_MS) + 1;

export const isFinancePeriod = (
  value: string | null
): value is TFinancePeriod =>
  value === 'thisMonth' ||
  value === 'lastMonth' ||
  value === 'quarter' ||
  value === 'year' ||
  value === 'custom';

/** Presets resolve to whole calendar periods so "last month" is comparable to "this month". */
export const resolveFinanceDateRange = (
  filters: IFinanceFilters,
  now = new Date()
): IFinanceDateRange | null => {
  const toRange = (from: Date, to: Date) => ({
    from,
    to,
    days: countDays(from, to),
  });

  switch (filters.period) {
    case 'thisMonth':
      return toRange(startOfUtcMonth(now), endOfUtcDay(now));
    case 'lastMonth':
      return toRange(startOfUtcMonth(now, -1), endOfUtcMonth(now, -1));
    case 'quarter': {
      const quarterStartMonth = Math.floor(now.getUTCMonth() / 3) * 3;
      return toRange(
        new Date(Date.UTC(now.getUTCFullYear(), quarterStartMonth, 1)),
        endOfUtcDay(now)
      );
    }
    case 'year':
      return toRange(
        new Date(Date.UTC(now.getUTCFullYear(), 0, 1)),
        endOfUtcDay(now)
      );
    case 'custom': {
      const parsedFrom = parseDateInput(filters.from);
      const parsedTo = parseDateInput(filters.to);
      if (!parsedFrom || !parsedTo) return null;

      const from = startOfUtcDay(parsedFrom);
      const to = endOfUtcDay(parsedTo);
      if (from.getTime() > to.getTime()) return null;

      const days = countDays(from, to);
      if (days > MAX_FINANCE_RANGE_DAYS) return null;

      return { from, to, days };
    }
    default:
      return null;
  }
};

export const getFinanceGranularity = (days: number): THostReportGranularity => {
  if (days <= 31) return 'day';
  if (days <= 120) return 'week';
  return 'month';
};

export const toFinanceQueryParams = (
  range: IFinanceDateRange | null
): IFinanceQueryParams | null => {
  if (!range) return null;
  return {
    from: range.from.toISOString(),
    to: range.to.toISOString(),
    granularity: getFinanceGranularity(range.days),
  };
};
