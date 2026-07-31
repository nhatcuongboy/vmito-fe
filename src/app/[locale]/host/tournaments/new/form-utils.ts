import { z } from 'zod';

export const TOURNAMENT_SPORT_TYPES = ['BADMINTON', 'PICKLEBALL'] as const;

export interface TournamentLocationFormValue {
  placeId?: string;
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
  district?: string;
  city?: string;
}

interface TournamentFormMessages {
  nameRequired: string;
  startDateRequired: string;
  endDateRequired: string;
  startDatePast: string;
  endBeforeStart: string;
}

const locationSchema = z.object({
  placeId: z.string().optional(),
  name: z.string(),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
});

export function getLocalDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function formatDateForLocale(value: string, locale: string) {
  if (!value) return '';

  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
}

export function createTournamentFormSchema(
  messages: TournamentFormMessages,
  today: string
) {
  return z
    .object({
      name: z.string().trim().min(1, messages.nameRequired),
      sportType: z.enum(TOURNAMENT_SPORT_TYPES),
      startDate: z.string().min(1, messages.startDateRequired),
      endDate: z.string().min(1, messages.endDateRequired),
      locationQuery: z.string(),
      location: locationSchema.nullable(),
    })
    .superRefine((values, context) => {
      if (today && values.startDate && values.startDate < today) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['startDate'],
          message: messages.startDatePast,
        });
      }

      if (
        values.startDate &&
        values.endDate &&
        values.endDate < values.startDate
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['endDate'],
          message: messages.endBeforeStart,
        });
      }
    });
}

export type TournamentFormValues = z.infer<
  ReturnType<typeof createTournamentFormSchema>
>;

export function toCreateTournamentPayload(values: TournamentFormValues) {
  const manualLocation = values.locationQuery.trim();
  const location =
    values.location ??
    (manualLocation
      ? {
          name: manualLocation,
          address: manualLocation,
        }
      : undefined);

  return {
    name: values.name.trim(),
    sportType: values.sportType,
    startDate: new Date(`${values.startDate}T00:00:00.000Z`),
    endDate: new Date(`${values.endDate}T00:00:00.000Z`),
    location,
  };
}
