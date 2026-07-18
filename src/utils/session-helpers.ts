// Session-related utility functions
import dayjs, { getDayjsLocale } from '@/lib/dayjs';
import { Locale } from '@/i18n/locales';
import { formatTimeByDevicePreference } from './time-helpers';

// Compact date label for session cards, e.g. "Hôm nay, 18/07" / "Thứ tư, 22/07".
// today/tomorrow labels are passed in because translations live in the component layer.
// `minimal` (2-column cards, ~160px wide): today/tomorrow keep just the label
// ("Hôm nay"), other days use the short day name + date ("T4 22/07").
export function formatCompactSessionDate(
  dateString: string | Date,
  locale: string,
  labels: { today: string; tomorrow: string },
  opts?: { showYear?: boolean; alwaysShowDayName?: boolean; minimal?: boolean }
): string {
  const date = dayjs(dateString)
    .tz('Asia/Ho_Chi_Minh')
    .locale(getDayjsLocale(locale));
  const today = dayjs.tz().startOf('day');
  const tomorrow = today.add(1, 'day');
  const dateToCompare = date.startOf('day');

  const dateFormat = opts?.showYear
    ? locale === Locale.VI
      ? 'DD/MM/YY'
      : 'MM/DD/YY'
    : locale === Locale.VI
      ? 'DD/MM'
      : 'MM/DD';

  let dateLabel = '';
  if (!opts?.alwaysShowDayName && dateToCompare.isSame(today)) {
    dateLabel = labels.today;
    if (opts?.minimal) return dateLabel;
  } else if (!opts?.alwaysShowDayName && dateToCompare.isSame(tomorrow)) {
    dateLabel = labels.tomorrow;
    if (opts?.minimal) return dateLabel;
  } else {
    // vi 'dd' = "T4"/"CN"; zh weekdaysMin are bare characters, keep 'ddd' ("周三")
    const dayNameFormat = opts?.minimal
      ? locale === Locale.VI
        ? 'dd'
        : 'ddd'
      : locale === Locale.VI
        ? 'dddd'
        : 'ddd';
    dateLabel = date.format(dayNameFormat);
    dateLabel = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);
    if (opts?.minimal) return `${dateLabel} ${date.format(dateFormat)}`;
  }

  return `${dateLabel}, ${date.format(dateFormat)}`;
}

// Function to create court name from order number
export function generateCourtName(courtNumber: number): string {
  const courtNames = [
    'Court A',
    'Court B',
    'Court C',
    'Court D',
    'Court E',
    'Court F',
    'Court G',
    'Court H',
  ];

  if (courtNumber <= courtNames.length) {
    return courtNames[courtNumber - 1];
  }

  return `Court ${courtNumber}`;
}

// Function to create a default court name (server-side)
export function getCourtDisplayName(
  courtName?: string,
  courtNumber?: number
): string {
  if (courtName) {
    return courtName;
  }
  if (courtNumber) {
    return `Court ${courtNumber}`;
  }
  return 'Court';
}

// Function to create a default court name (client-side with Vietnamese)
export function getCourtDisplayNameVi(
  courtName?: string,
  courtNumber?: number
): string {
  if (courtName) {
    return courtName;
  }
  if (courtNumber) {
    return `Court ${courtNumber}`;
  }
  return 'Court';
}

// Function to map SessionStatus from database to UI status
export function mapSessionStatus(
  status: string
): 'upcoming' | 'in-progress' | 'completed' {
  switch (status) {
    case 'PREPARING':
      return 'upcoming';
    case 'IN_PROGRESS':
      return 'in-progress';
    case 'FINISHED':
      return 'completed';
    default:
      return 'upcoming';
  }
}

// Function to format date from ISO string to a more readable format
export function formatDate(dateString: string | Date): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Function to format time from ISO string to a more readable format
// Now uses device's time format preference (24h or AM/PM)
export function formatTime(dateString: string | Date): string {
  return formatTimeByDevicePreference(dateString);
}

// Function to calculate duration between two timestamps
export function formatDuration(start: string, end: string): string {
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  const durationMinutes = Math.floor((endTime - startTime) / (1000 * 60));
  return `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`;
}
