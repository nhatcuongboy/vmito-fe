import { z } from 'zod';
import { CourtDirection, SessionLocationType } from '@/lib/api/types';

// Zod schema for court validation
export type SessionFormData = z.infer<
  ReturnType<typeof createSessionFormSchema>
>;

export function createCourtSchema(
  t: (key: string, values?: Record<string, unknown>) => string
) {
  return z.object({
    courtId: z.string().optional(),
    courtNumber: z.number().min(1, t('validation.courtNumberMin')),
    courtName: z.string().optional(),
    direction: z.nativeEnum(CourtDirection),
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createSessionFormSchema(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: string, values?: any) => string,
  isEditMode: boolean = false
) {
  const courtSchema = createCourtSchema(t);
  return z
    .object({
      // Required fields
      name: z.string().min(1, t('validation.sessionNameRequired')),
      locationType: z.nativeEnum(SessionLocationType),
      selectedVenueId: z.string(),
      customLocation: z.string().trim().max(200).optional(),
      clubId: z.string().optional(),
      hostName: z.string().min(1, t('validation.hostNameRequired')),
      hostPhone: z.string().optional(),
      startTime: z.string().min(1, t('validation.startTimeRequired')),
      endTime: z.string().min(1, t('validation.endTimeRequired')),
      courts: z
        .array(courtSchema)
        .min(1, t('validation.atLeastOneCourt'))
        .refine(
          (courts) =>
            new Set(courts.map((c) => c.courtNumber)).size === courts.length,
          { message: t('validation.courtNumberUnique') }
        ),
      courtColor: z.string(),
      maxPlayersPerCourt: z.preprocess(
        (val) => {
          // Convert empty string to undefined for validation
          if (val === '' || val === null || val === undefined) return undefined;
          return val;
        },
        z
          .number()
          .min(2, t('validation.maxPlayersPerCourtMin', { min: 2 }))
          .max(12, t('validation.maxPlayersPerCourtMax', { max: 12 }))
      ),

      // Optional fields
      description: z.string().optional(),
      referenceVideoUrl: z
        .string()
        .trim()
        .refine(
          (value) => {
            if (!value) return true;
            try {
              const url = new URL(value);
              return url.protocol === 'http:' || url.protocol === 'https:';
            } catch {
              return false;
            }
          },
          { message: t('validation.referenceVideoUrlInvalid') }
        )
        .optional(),
      requirePlayerInfo: z.boolean(),
      allowGuestJoin: z.boolean(),
      allowNewPlayers: z.boolean(),
      allowZaloContact: z.boolean(),
      allLevelsSelected: z.boolean(),
      requiredLevels: z.array(z.coerce.number()).optional(),
      shuttlecock: z.string().optional(),
      defaultMatchType: z.enum(['SINGLES', 'DOUBLES']),
    })
    .superRefine((data, ctx) => {
      if (
        data.locationType === SessionLocationType.VENUE &&
        !data.selectedVenueId
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('validation.locationRequired'),
          path: ['selectedVenueId'],
        });
      }
      if (
        data.locationType === SessionLocationType.CUSTOM &&
        (!data.customLocation || data.customLocation.length < 2)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('validation.customLocationRequired'),
          path: ['customLocation'],
        });
      }
    })
    .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
      message: t('validation.endTimeMustBeAfterStartTime'),
      path: ['endTime'],
    })
    .refine(
      (data) => {
        if (isEditMode) return true;
        const now = new Date();
        // Allow up to a 1-minute buffer in the past to account for user input time
        return new Date(data.startTime) >= new Date(now.getTime() - 60000);
      },
      {
        message:
          t('validation.startTimeMustBeInFuture') ||
          'Thời gian bắt đầu không được trong quá khứ',
        path: ['startTime'],
      }
    );
}
