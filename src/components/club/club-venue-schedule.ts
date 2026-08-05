export interface ClubScheduleDraft {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface ClubVenueGroupDraft {
  id: string;
  venueId: string;
  schedules: ClubScheduleDraft[];
}

export type ClubVenueErrorKey = 'venueRequired' | 'duplicateVenue';

export type ClubScheduleErrorKey = 'invalidTime' | 'endBeforeStart' | 'overlap';

export interface ClubVenueScheduleValidation {
  isValid: boolean;
  venueErrors: Record<string, ClubVenueErrorKey>;
  scheduleErrors: Record<string, ClubScheduleErrorKey>;
}

const createDraftId = () => {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const createClubScheduleDraft = (
  overrides: Partial<Omit<ClubScheduleDraft, 'id'>> = {}
): ClubScheduleDraft => ({
  id: createDraftId(),
  dayOfWeek: 1,
  startTime: '19:00',
  endTime: '21:00',
  isActive: true,
  ...overrides,
});

export const createClubVenueGroupDraft = (
  overrides: Partial<Omit<ClubVenueGroupDraft, 'id' | 'schedules'>> = {},
  schedules: ClubScheduleDraft[] = []
): ClubVenueGroupDraft => ({
  id: createDraftId(),
  venueId: '',
  ...overrides,
  schedules,
});

const timeToMinutes = (value: string) => {
  if (!/^\d{2}:\d{2}$/.test(value)) return null;

  const [hours, minutes] = value.split(':').map(Number);
  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
};

export const validateClubVenueSchedule = (
  groups: ClubVenueGroupDraft[]
): ClubVenueScheduleValidation => {
  const venueErrors: Record<string, ClubVenueErrorKey> = {};
  const scheduleErrors: Record<string, ClubScheduleErrorKey> = {};
  const venueCounts = new Map<string, number>();

  groups.forEach((group) => {
    if (group.venueId) {
      venueCounts.set(group.venueId, (venueCounts.get(group.venueId) ?? 0) + 1);
    }
  });

  groups.forEach((group) => {
    if (!group.venueId) {
      venueErrors[group.id] = 'venueRequired';
    } else if ((venueCounts.get(group.venueId) ?? 0) > 1) {
      venueErrors[group.id] = 'duplicateVenue';
    }
  });

  const validSchedulesByVenueAndDay = new Map<
    string,
    Array<{ schedule: ClubScheduleDraft; start: number; end: number }>
  >();

  groups.forEach((group) => {
    group.schedules.forEach((schedule) => {
      const start = timeToMinutes(schedule.startTime);
      const end = timeToMinutes(schedule.endTime);

      if (start === null || end === null) {
        scheduleErrors[schedule.id] = 'invalidTime';
        return;
      }

      if (end <= start) {
        scheduleErrors[schedule.id] = 'endBeforeStart';
        return;
      }

      if (!group.venueId) return;

      const key = `${group.venueId}:${schedule.dayOfWeek}`;
      const schedules = validSchedulesByVenueAndDay.get(key) ?? [];
      schedules.push({ schedule, start, end });
      validSchedulesByVenueAndDay.set(key, schedules);
    });
  });

  validSchedulesByVenueAndDay.forEach((schedules) => {
    const sortedSchedules = [...schedules].sort(
      (first, second) => first.start - second.start
    );

    sortedSchedules.forEach((current, currentIndex) => {
      sortedSchedules.slice(currentIndex + 1).forEach((candidate) => {
        if (candidate.start >= current.end) return;

        scheduleErrors[current.schedule.id] = 'overlap';
        scheduleErrors[candidate.schedule.id] = 'overlap';
      });
    });
  });

  return {
    isValid:
      Object.keys(venueErrors).length === 0 &&
      Object.keys(scheduleErrors).length === 0,
    venueErrors,
    scheduleErrors,
  };
};
