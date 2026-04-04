import { CategoryMatch } from '@/lib/api/types';

export interface ITimeSlotConfig {
  date: string; // ISO date string (YYYY-MM-DD)
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  timeBetweenMinutes: number;
  courtIds: string[];
}

export interface ICategoryForSchedule {
  id: string;
  name: string;
  matches: CategoryMatch[];
}

export interface IGenerateScheduleInput {
  categories: ICategoryForSchedule[];
  matchLengthMinutes: number;
  timeSlots: ITimeSlotConfig[];
}

export interface IScheduledMatch {
  matchId: string;
  courtId: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
}

export interface ICategorySummary {
  categoryId: string;
  categoryName: string;
  total: number;
  scheduled: number;
  groups: Array<{ name: string; total: number; scheduled: number }>;
}

export interface IGenerateScheduleResult {
  scheduled: IScheduledMatch[];
  unscheduled: string[];
  summary: ICategorySummary[];
}

interface ISlot {
  courtId: string;
  startTime: Date;
  endTime: Date;
}

const parseTime = (timeStr: string): { hours: number; minutes: number } => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
};

const buildTimeGrid = (
  timeSlots: ITimeSlotConfig[],
  matchLengthMinutes: number
): ISlot[] => {
  const slots: ISlot[] = [];

  for (const ts of timeSlots) {
    const { hours: startH, minutes: startM } = parseTime(ts.startTime);
    const { hours: endH, minutes: endM } = parseTime(ts.endTime);

    const baseDate = new Date(ts.date);
    const dayStart = new Date(baseDate);
    dayStart.setHours(startH, startM, 0, 0);
    const dayEnd = new Date(baseDate);
    dayEnd.setHours(endH, endM, 0, 0);

    for (const courtId of ts.courtIds) {
      let cursor = new Date(dayStart);
      while (
        cursor.getTime() + matchLengthMinutes * 60000 <=
        dayEnd.getTime()
      ) {
        slots.push({
          courtId,
          startTime: new Date(cursor),
          endTime: new Date(cursor.getTime() + matchLengthMinutes * 60000),
        });
        cursor = new Date(
          cursor.getTime() +
            (matchLengthMinutes + ts.timeBetweenMinutes) * 60000
        );
      }
    }
  }

  // Sort by start time, then court
  slots.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  return slots;
};

const getTeamIds = (match: CategoryMatch): string[] => {
  if (!match.participants) return [];
  return match.participants.map((p) => p.categoryRegistrationId);
};

const hasPlaceholderTeams = (match: CategoryMatch): boolean => {
  if (!match.participants || match.participants.length === 0) return true;
  // Check if any participant has no registration (placeholder like "Winner of X")
  return match.participants.some((p) => !p.categoryRegistration);
};

const isTeamBusy = (
  teamIds: string[],
  slotStart: Date,
  slotEnd: Date,
  assignments: Map<string, { start: Date; end: Date }[]>
): boolean => {
  for (const teamId of teamIds) {
    const teamSchedule = assignments.get(teamId);
    if (!teamSchedule) continue;
    for (const existing of teamSchedule) {
      // Overlap check
      if (slotStart < existing.end && slotEnd > existing.start) {
        return true;
      }
    }
  }
  return false;
};

export const generateSchedule = (
  input: IGenerateScheduleInput
): IGenerateScheduleResult => {
  const { categories, matchLengthMinutes, timeSlots } = input;

  const slots = buildTimeGrid(timeSlots, matchLengthMinutes);
  const usedSlots = new Set<string>(); // "courtId-startTimeMs"
  const teamAssignments = new Map<string, { start: Date; end: Date }[]>();
  const scheduled: IScheduledMatch[] = [];
  const unscheduled: string[] = [];

  const slotKey = (courtId: string, startTime: Date): string =>
    `${courtId}-${startTime.getTime()}`;

  const assignTeam = (teamId: string, start: Date, end: Date) => {
    if (!teamAssignments.has(teamId)) {
      teamAssignments.set(teamId, []);
    }
    teamAssignments.get(teamId)!.push({ start, end });
  };

  // Track per-category, per-group scheduling
  const categorySummaries: ICategorySummary[] = [];

  for (const category of categories) {
    const groupMap = new Map<
      string,
      { name: string; matches: CategoryMatch[] }
    >();
    const playoffMatches: CategoryMatch[] = [];

    for (const match of category.matches) {
      if (match.groupId) {
        if (!groupMap.has(match.groupId)) {
          groupMap.set(match.groupId, {
            name:
              match.round === 'GROUP'
                ? `Pool ${groupMap.size + 1}`
                : match.round,
            matches: [],
          });
        }
        groupMap.get(match.groupId)!.matches.push(match);
      } else {
        playoffMatches.push(match);
      }
    }

    const groupSummaries: Array<{
      name: string;
      total: number;
      scheduled: number;
    }> = [];
    let categoryScheduled = 0;

    // Schedule group matches first
    for (const [, group] of groupMap) {
      let groupScheduledCount = 0;
      for (const match of group.matches) {
        if (match.status === 'FINISHED' || match.status === 'IN_PROGRESS') {
          groupScheduledCount++;
          categoryScheduled++;
          continue;
        }

        const teamIds = getTeamIds(match);
        let assigned = false;

        for (const slot of slots) {
          const key = slotKey(slot.courtId, slot.startTime);
          if (usedSlots.has(key)) continue;

          if (
            isTeamBusy(teamIds, slot.startTime, slot.endTime, teamAssignments)
          ) {
            continue;
          }

          usedSlots.add(key);
          scheduled.push({
            matchId: match.id,
            courtId: slot.courtId,
            startTime: slot.startTime.toISOString(),
            endTime: slot.endTime.toISOString(),
          });
          for (const teamId of teamIds) {
            assignTeam(teamId, slot.startTime, slot.endTime);
          }
          groupScheduledCount++;
          categoryScheduled++;
          assigned = true;
          break;
        }

        if (!assigned) {
          unscheduled.push(match.id);
        }
      }
      groupSummaries.push({
        name: group.name,
        total: group.matches.length,
        scheduled: groupScheduledCount,
      });
    }

    // Schedule playoff matches
    let playoffScheduledCount = 0;
    for (const match of playoffMatches) {
      if (match.status === 'FINISHED' || match.status === 'IN_PROGRESS') {
        playoffScheduledCount++;
        categoryScheduled++;
        continue;
      }

      if (hasPlaceholderTeams(match)) {
        unscheduled.push(match.id);
        continue;
      }

      const teamIds = getTeamIds(match);
      let assigned = false;

      for (const slot of slots) {
        const key = slotKey(slot.courtId, slot.startTime);
        if (usedSlots.has(key)) continue;

        if (
          isTeamBusy(teamIds, slot.startTime, slot.endTime, teamAssignments)
        ) {
          continue;
        }

        usedSlots.add(key);
        scheduled.push({
          matchId: match.id,
          courtId: slot.courtId,
          startTime: slot.startTime.toISOString(),
          endTime: slot.endTime.toISOString(),
        });
        for (const teamId of teamIds) {
          assignTeam(teamId, slot.startTime, slot.endTime);
        }
        playoffScheduledCount++;
        categoryScheduled++;
        assigned = true;
        break;
      }

      if (!assigned) {
        unscheduled.push(match.id);
      }
    }

    if (playoffMatches.length > 0) {
      groupSummaries.push({
        name: 'Playoffs',
        total: playoffMatches.length,
        scheduled: playoffScheduledCount,
      });
    }

    categorySummaries.push({
      categoryId: category.id,
      categoryName: category.name,
      total: category.matches.length,
      scheduled: categoryScheduled,
      groups: groupSummaries,
    });
  }

  return { scheduled, unscheduled, summary: categorySummaries };
};
