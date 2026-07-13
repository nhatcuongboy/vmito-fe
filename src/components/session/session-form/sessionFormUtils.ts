import { CourtDirection } from '@/lib/api/types';

import type { SessionFormData } from './sessionFormSchema';

export const TIME_INPUT_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
export const MIDNIGHT_TIME = '00:00';

export function formatDateTimeLocal(date: Date): string {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function formatDateOnly(date: Date): string {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatTimeOnly(date: Date): string {
  if (!date) return '';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

export function buildSingleDayDateTime(date: string, time: string): string {
  if (!date || !time) return '';

  if (!TIME_INPUT_PATTERN.test(time)) return '';

  return `${date}T${time}`;
}

export function buildSingleDayEndDateTime(date: string, time: string): string {
  if (!date || !time) return '';

  if (time === MIDNIGHT_TIME) {
    return `${formatDateOnly(addDays(new Date(`${date}T00:00`), 1))}T00:00`;
  }

  return buildSingleDayDateTime(date, time);
}

export function isEndOfSelectedDay(startDate: Date, endDate: Date): boolean {
  if (
    endDate.getHours() !== 0 ||
    endDate.getMinutes() !== 0 ||
    endDate.getSeconds() !== 0 ||
    endDate.getMilliseconds() !== 0
  ) {
    return false;
  }

  return formatDateOnly(endDate) === formatDateOnly(addDays(startDate, 1));
}

export function extractCourtNumber(courtName?: string): number | null {
  if (!courtName) return null;
  const match = courtName.match(/\d+/);
  if (!match) return null;

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function normalizeAiCourtNames(courtNames: string[] = []) {
  return courtNames.flatMap((courtName) => {
    const rawCourtName = String(courtName ?? '').trim();
    if (!rawCourtName) return [];

    const numbers = [...rawCourtName.matchAll(/\d+/g)].map((match) => match[0]);

    return numbers.length > 1 ? numbers : [rawCourtName];
  });
}

export function buildCourtsFromAiData(
  numberOfCourts: number,
  courtNames: string[] = []
) {
  const usedCourtNumbers = new Set<number>();
  const normalizedCourtNames = normalizeAiCourtNames(courtNames);

  return Array.from({ length: numberOfCourts }, (_, i) => {
    const rawCourtName = String(normalizedCourtNames[i] ?? '').trim();
    const parsedCourtNumber = extractCourtNumber(rawCourtName);
    const fallbackCourtNumber = i + 1;
    const courtNumber =
      parsedCourtNumber && !usedCourtNumbers.has(parsedCourtNumber)
        ? parsedCourtNumber
        : fallbackCourtNumber;

    usedCourtNumbers.add(courtNumber);

    return {
      courtNumber,
      courtName: parsedCourtNumber ? '' : rawCourtName,
      direction: CourtDirection.HORIZONTAL,
    };
  });
}

// Scrolls to and focuses the first field (in priority order) that has an error.
export function scrollToFirstSessionError(
  formErrors: Partial<Record<keyof SessionFormData, unknown>>
) {
  const fieldOrder: (keyof SessionFormData)[] = [
    'name',
    'selectedVenueId',
    'hostName',
    'hostPhone',
    'startTime',
    'endTime',
    'courts',
  ];
  const fieldToId: Partial<Record<keyof SessionFormData, string>> = {
    name: 'field-name',
    selectedVenueId: 'field-venue',
    hostName: 'field-hostName',
    hostPhone: 'field-hostPhone',
    startTime: 'field-startTime',
    endTime: 'field-endTime',
    courts: 'field-courts',
  };

  for (const fieldName of fieldOrder) {
    if (!formErrors[fieldName]) continue;
    const id = fieldToId[fieldName];
    if (!id) continue;

    const el = document.getElementById(id);

    if (el) {
      // Scroll to element with offset for headers
      const topBarHeight = 80;
      const yOffset = -topBarHeight;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;

      window.scrollTo({ top: Math.max(0, y), behavior: 'auto' });

      // Focus on the input element after a short delay
      setTimeout(() => {
        // For venue field (SearchableSelect), find the button or input inside
        if (fieldName === 'selectedVenueId') {
          const button = el.querySelector('button');
          const input = el.querySelector('input');
          if (button) {
            button.focus();
          } else if (input) {
            input.focus();
          }
        } else {
          // For other fields, try to find and focus the input
          const input = el.querySelector('input, textarea, select');
          if (input instanceof HTMLElement) {
            input.focus();
          }
        }
      }, 50);

      break;
    }
  }
}
