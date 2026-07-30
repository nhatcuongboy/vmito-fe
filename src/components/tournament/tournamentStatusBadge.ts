import { TournamentStatus } from '@/lib/api/types';

/** Inside this window the badge counts down instead of saying "upcoming". */
const COUNTDOWN_WINDOW_DAYS = 7;

/** Whole calendar days from today to `date` (negative once it has passed). */
const daysUntil = (date: Date) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTarget = new Date(date);
  startOfTarget.setHours(0, 0, 0, 0);
  return Math.round(
    (startOfTarget.getTime() - startOfToday.getTime()) / 86_400_000
  );
};

export interface TournamentStatusBadge {
  label: string;
  bg: string;
  color: string;
  /** Render a pulsing dot ahead of the label. */
  live: boolean;
}

/**
 * Resolves the overlay badge for a tournament card.
 *
 * Every state gets a badge — including PREPARING, which used to render nothing
 * and left "Đã kết thúc" as the only label anyone ever saw on the browse page.
 * Near-term tournaments count down, which is the most useful thing the badge
 * can say about an event that hasn't happened yet.
 */
export const resolveTournamentStatusBadge = (
  status: TournamentStatus,
  startDate: Date | string,
  labels: {
    inProgress: string;
    preparing: string;
    finished: string;
    cancelled: string;
    startsToday: string;
    startsTomorrow: string;
    daysLeft: (days: number) => string;
  }
): TournamentStatusBadge => {
  switch (status) {
    case TournamentStatus.IN_PROGRESS:
      return {
        label: labels.inProgress,
        bg: 'rgba(220, 252, 231, 0.94)',
        color: 'green.800',
        live: true,
      };
    case TournamentStatus.PREPARING: {
      const days = daysUntil(new Date(startDate));
      if (days >= 0 && days <= COUNTDOWN_WINDOW_DAYS) {
        return {
          label:
            days === 0
              ? labels.startsToday
              : days === 1
                ? labels.startsTomorrow
                : labels.daysLeft(days),
          bg: 'rgba(255, 237, 213, 0.94)',
          color: 'orange.800',
          live: false,
        };
      }
      return {
        label: labels.preparing,
        bg: 'rgba(220, 252, 231, 0.94)',
        color: 'green.800',
        live: false,
      };
    }
    case TournamentStatus.CANCELLED:
      return {
        label: labels.cancelled,
        bg: 'rgba(254, 242, 242, 0.94)',
        color: 'red.700',
        live: false,
      };
    case TournamentStatus.FINISHED:
    default:
      // Deliberately the quietest badge — a finished tournament shouldn't
      // stamp a heavy dark block across the poster.
      return {
        label: labels.finished,
        bg: 'blackAlpha.600',
        color: 'white',
        live: false,
      };
  }
};
