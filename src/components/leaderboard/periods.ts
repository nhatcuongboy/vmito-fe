import { TLeaderboardPeriod } from '@/lib/api/ranking.service';

/** Tabs shown on the leaderboard. `year` still exists on the API but is not a tab. */
export const LEADERBOARD_TABS: TLeaderboardPeriod[] = [
  'week',
  'month',
  'season',
  'all',
];

export const PERIOD_OPTION_COUNT = 6;

const SEASON_MONTHS = 3;
// Periods are anchored to Vietnam time (UTC+7, no DST) on both ends of the API.
const VN_OFFSET_MS = 7 * 3_600_000;

/** Vietnam wall clock of `utc`, expressed through the UTC getters of a Date. */
const toVn = (utc: Date) => new Date(utc.getTime() + VN_OFFSET_MS);
const toUtc = (vn: Date) => new Date(vn.getTime() - VN_OFFSET_MS);
const vnDate = (year: number, month: number, day: number) =>
  new Date(Date.UTC(year, month, day));
const pad = (value: number) => String(value).padStart(2, '0');

export interface IPeriodOption {
  /** Key understood by the API: `2026-07-27` | `2026-08` | `2026-S3` | `2026`. */
  key: string;
  isCurrent: boolean;
  start: Date;
  year: number;
  /** 1-12, first month of the period. */
  month: number;
  /** ISO week number of the period start. */
  week: number;
  /** 1-4 (Spring, Summer, Autumn, Winter). */
  season: number;
}

const weekStartVn = (vn: Date) =>
  vnDate(
    vn.getUTCFullYear(),
    vn.getUTCMonth(),
    vn.getUTCDate() - ((vn.getUTCDay() + 6) % 7)
  );

/** ISO-8601 week number of the week containing `vn`. */
function isoWeek(vn: Date): number {
  const thursday = new Date(weekStartVn(vn).getTime() + 3 * 86_400_000);
  const firstThursday = vnDate(thursday.getUTCFullYear(), 0, 4);
  const diffDays =
    (thursday.getTime() - weekStartVn(firstThursday).getTime()) / 86_400_000;
  return Math.round(diffDays / 7) + 1;
}

function startOfPeriodVn(period: TLeaderboardPeriod, vn: Date): Date {
  switch (period) {
    case 'week':
      return weekStartVn(vn);
    case 'month':
      return vnDate(vn.getUTCFullYear(), vn.getUTCMonth(), 1);
    case 'season':
      return vnDate(
        vn.getUTCFullYear(),
        Math.floor(vn.getUTCMonth() / SEASON_MONTHS) * SEASON_MONTHS,
        1
      );
    default:
      return vnDate(vn.getUTCFullYear(), 0, 1);
  }
}

function shiftPeriodVn(
  period: TLeaderboardPeriod,
  startVn: Date,
  steps: number
): Date {
  const y = startVn.getUTCFullYear();
  const m = startVn.getUTCMonth();
  switch (period) {
    case 'week':
      return vnDate(y, m, startVn.getUTCDate() - steps * 7);
    case 'month':
      return vnDate(y, m - steps, 1);
    case 'season':
      return vnDate(y, m - steps * SEASON_MONTHS, 1);
    default:
      return vnDate(y - steps, 0, 1);
  }
}

function periodKeyFor(period: TLeaderboardPeriod, startVn: Date): string {
  const y = startVn.getUTCFullYear();
  switch (period) {
    case 'week':
      return `${y}-${pad(startVn.getUTCMonth() + 1)}-${pad(startVn.getUTCDate())}`;
    case 'month':
      return `${y}-${pad(startVn.getUTCMonth() + 1)}`;
    case 'season':
      return `${y}-S${Math.floor(startVn.getUTCMonth() / SEASON_MONTHS) + 1}`;
    default:
      return `${y}`;
  }
}

/** The `count` most recent periods, newest first. Empty for the all-time tab. */
export function getRecentPeriods(
  period: TLeaderboardPeriod,
  count = PERIOD_OPTION_COUNT,
  now = new Date()
): IPeriodOption[] {
  if (period === 'all') return [];
  const currentStartVn = startOfPeriodVn(period, toVn(now));

  return Array.from({ length: count }, (_, index) => {
    const startVn = shiftPeriodVn(period, currentStartVn, index);
    return {
      key: periodKeyFor(period, startVn),
      isCurrent: index === 0,
      start: toUtc(startVn),
      year: startVn.getUTCFullYear(),
      month: startVn.getUTCMonth() + 1,
      week: isoWeek(startVn),
      season: Math.floor(startVn.getUTCMonth() / SEASON_MONTHS) + 1,
    };
  });
}

type Translator = (
  key: string,
  values?: Record<string, string | number>
) => string;

export function formatPeriodLabel(
  t: Translator,
  period: TLeaderboardPeriod,
  option: IPeriodOption,
  withCurrentSuffix = true
): string {
  if (option.isCurrent && withCurrentSuffix) {
    return period === 'week'
      ? t('periodPicker.currentWeek')
      : period === 'month'
        ? t('periodPicker.currentMonth')
        : period === 'season'
          ? t('periodPicker.currentSeason')
          : t('periodPicker.year', { year: option.year });
  }

  return period === 'week'
    ? t('periodPicker.week', { week: option.week })
    : period === 'month'
      ? t('periodPicker.month', { month: option.month, year: option.year })
      : period === 'season'
        ? t(`periodPicker.seasons.${option.season}`, { year: option.year })
        : t('periodPicker.year', { year: option.year });
}
