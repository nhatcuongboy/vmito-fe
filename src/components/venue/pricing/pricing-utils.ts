import { z } from 'zod';
import {
  VenueCustomerType,
  VenueDayType,
  type VenuePriceBook,
  type VenuePriceRule,
} from '../../../lib/api/types.ts';

export interface PriceBookFormValues {
  name: string;
  currency: string;
  effectiveFrom: string;
  effectiveTo: string;
  isActive: boolean;
  priority: number;
  notes: string;
  priceImageUrl: string;
  priceImagePublicId: string;
}

export interface PriceRuleFormValues {
  dayType: VenueDayType;
  daysOfWeek: number[];
  specificDate: string;
  startTime: string;
  endTime: string;
  customerType: VenueCustomerType;
  pricePerHour: number;
  minimumMinutes: string;
  billingStepMinutes: string;
  priority: number;
  notes: string;
}

type Translate = (key: string) => string;

const startTimePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const endTimePattern = /^(([01]\d|2[0-3]):[0-5]\d|24:00)$/;

const dayTypeOrder: Record<VenueDayType, number> = {
  [VenueDayType.EVERYDAY]: 0,
  [VenueDayType.WEEKDAY]: 1,
  [VenueDayType.WEEKEND]: 2,
  [VenueDayType.HOLIDAY]: 3,
  [VenueDayType.SPECIFIC_DATE]: 4,
};

const customerTypeOrder: Record<VenueCustomerType, number> = {
  [VenueCustomerType.FIXED]: 0,
  [VenueCustomerType.WALK_IN]: 1,
  [VenueCustomerType.STUDENT]: 2,
  [VenueCustomerType.MEMBER]: 3,
  [VenueCustomerType.CUSTOM]: 4,
};

export function getTodayDateInput(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createEmptyPriceBook(): PriceBookFormValues {
  return {
    name: '',
    currency: 'VND',
    effectiveFrom: getTodayDateInput(),
    effectiveTo: '',
    isActive: true,
    priority: 0,
    notes: '',
    priceImageUrl: '',
    priceImagePublicId: '',
  };
}

export function createEmptyPriceRule(): PriceRuleFormValues {
  return {
    dayType: VenueDayType.EVERYDAY,
    daysOfWeek: [],
    specificDate: '',
    startTime: '05:00',
    endTime: '23:00',
    customerType: VenueCustomerType.WALK_IN,
    pricePerHour: 0,
    minimumMinutes: '',
    billingStepMinutes: '',
    priority: 0,
    notes: '',
  };
}

export function priceBookToForm(book: VenuePriceBook): PriceBookFormValues {
  return {
    name: book.name,
    currency: book.currency || 'VND',
    effectiveFrom: toDateInput(book.effectiveFrom),
    effectiveTo: toDateInput(book.effectiveTo),
    isActive: book.isActive,
    priority: book.priority || 0,
    notes: book.notes || '',
    priceImageUrl: book.priceImageUrl || '',
    priceImagePublicId: book.priceImagePublicId || '',
  };
}

export function priceRuleToForm(rule: VenuePriceRule): PriceRuleFormValues {
  return {
    dayType: rule.dayType,
    daysOfWeek: rule.daysOfWeek || [],
    specificDate: toDateInput(rule.specificDate),
    startTime: minuteToTime(rule.startMinute),
    endTime: minuteToTime(rule.endMinute),
    customerType: rule.customerType,
    pricePerHour: rule.pricePerHour,
    minimumMinutes: rule.minimumMinutes ? String(rule.minimumMinutes) : '',
    billingStepMinutes: rule.billingStepMinutes
      ? String(rule.billingStepMinutes)
      : '',
    priority: rule.priority || 0,
    notes: rule.notes || '',
  };
}

export function toDateInput(value?: string | null) {
  return value ? value.slice(0, 10) : '';
}

export function dateInputToIso(value?: string | null) {
  return value ? `${value}T00:00:00.000Z` : null;
}

export function minuteToTime(value: number) {
  if (value === 1440) return '24:00';
  const hours = Math.floor(value / 60)
    .toString()
    .padStart(2, '0');
  const minutes = (value % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function timeToMinute(value: string) {
  const [hours = '0', minutes = '0'] = value.split(':');
  return Number.parseInt(hours, 10) * 60 + Number.parseInt(minutes, 10);
}

export function isValidStartTime(value: string) {
  return startTimePattern.test(value);
}

export function isValidEndTime(value: string) {
  return endTimePattern.test(value);
}

export function getEndDateTime(date: string, endTime: string) {
  if (endTime !== '24:00') return `${date}T${endTime}:00+07:00`;
  const [year, month, day] = date.split('-').map(Number);
  const nextDate = new Date(Date.UTC(year, month - 1, day + 1));
  return `${nextDate.toISOString().slice(0, 10)}T00:00:00+07:00`;
}

export function selectPriceBook(
  books: VenuePriceBook[],
  requestedId?: string | null
) {
  if (requestedId) {
    const requested = books.find((book) => book.id === requestedId);
    if (requested) return requested;
  }
  return books.find((book) => book.isActive) || books[0] || null;
}

export function sortPriceRules(rules: VenuePriceRule[]) {
  return [...rules].sort((left, right) => {
    return (
      dayTypeOrder[left.dayType] - dayTypeOrder[right.dayType] ||
      (left.specificDate || '').localeCompare(right.specificDate || '') ||
      left.startMinute - right.startMinute ||
      left.endMinute - right.endMinute ||
      customerTypeOrder[left.customerType] -
        customerTypeOrder[right.customerType] ||
      right.priority - left.priority
    );
  });
}

export function formatCurrency(
  value: number,
  currency: string,
  locale: string
) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return '';
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

function optionalPositiveInteger(value: string) {
  if (!value) return true;
  const number = Number(value);
  return Number.isInteger(number) && number > 0;
}

export function createPriceBookSchema(t: Translate) {
  return z
    .object({
      name: z.string().trim().min(1, t('validation.nameRequired')),
      currency: z.string().trim().min(1, t('validation.currencyRequired')),
      effectiveFrom: z.string().min(1, t('validation.startDateRequired')),
      effectiveTo: z.string(),
      isActive: z.boolean(),
      priority: z.number().int(t('validation.integerRequired')),
      notes: z.string(),
      priceImageUrl: z.string(),
      priceImagePublicId: z.string(),
    })
    .superRefine((value, context) => {
      if (value.effectiveTo && value.effectiveTo < value.effectiveFrom) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['effectiveTo'],
          message: t('validation.endDateAfterStart'),
        });
      }
    });
}

export function createPriceRuleSchema(t: Translate) {
  return z
    .object({
      dayType: z.nativeEnum(VenueDayType),
      daysOfWeek: z.array(z.number()),
      specificDate: z.string(),
      startTime: z
        .string()
        .refine(isValidStartTime, t('validation.invalidTime')),
      endTime: z.string().refine(isValidEndTime, t('validation.invalidTime')),
      customerType: z.nativeEnum(VenueCustomerType),
      pricePerHour: z.number().positive(t('validation.pricePositive')),
      minimumMinutes: z
        .string()
        .refine(optionalPositiveInteger, t('validation.positiveInteger')),
      billingStepMinutes: z
        .string()
        .refine(optionalPositiveInteger, t('validation.positiveInteger')),
      priority: z.number().int(t('validation.integerRequired')),
      notes: z.string(),
    })
    .superRefine((value, context) => {
      if (
        isValidStartTime(value.startTime) &&
        isValidEndTime(value.endTime) &&
        timeToMinute(value.endTime) <= timeToMinute(value.startTime)
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['endTime'],
          message: t('validation.endTimeAfterStart'),
        });
      }
      if (
        value.dayType === VenueDayType.WEEKDAY &&
        value.daysOfWeek.length === 0
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['daysOfWeek'],
          message: t('validation.weekdayRequired'),
        });
      }
      if (
        (value.dayType === VenueDayType.SPECIFIC_DATE ||
          value.dayType === VenueDayType.HOLIDAY) &&
        !value.specificDate
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['specificDate'],
          message: t('validation.specificDateRequired'),
        });
      }
    });
}
