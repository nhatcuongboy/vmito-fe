import { sortLevelsByRank } from '@/constants/levels';
import { IClub } from '@/types/club';

const LEVEL_NAME_TO_NUMBER: Record<string, number> = {
  BEGINNER: 1,
  ADVANCED_BEGINNER: 2,
  LOW_INTERMEDIATE: 3,
  INTERMEDIATE: 4,
  HIGH_INTERMEDIATE: 5,
  ADVANCED: 6,
  SEMI_PRO: 7,
  PRO: 8,
};

const extractLevelNumber = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
    return LEVEL_NAME_TO_NUMBER[value.trim().toUpperCase()] ?? null;
  }

  if (!value || typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;
  return (
    extractLevelNumber(record.level) ??
    extractLevelNumber(record.value) ??
    extractLevelNumber(record.name) ??
    extractLevelNumber(record.code) ??
    extractLevelNumber(record.levelNumber) ??
    extractLevelNumber(record.levelValue)
  );
};

export const getClubRequiredLevels = (club: IClub | null): number[] => {
  if (!club) return [];

  const clubRecord = club as IClub & {
    levels?: unknown[];
    clubLevels?: unknown[];
    requiredLevelIds?: unknown[];
    requiredSkillLevels?: unknown[];
    skillLevels?: unknown[];
    playerLevels?: unknown[];
  };
  const rawLevels =
    clubRecord.requiredLevels ??
    clubRecord.requiredLevelIds ??
    clubRecord.requiredSkillLevels ??
    clubRecord.skillLevels ??
    clubRecord.playerLevels ??
    clubRecord.levels ??
    clubRecord.clubLevels ??
    [];
  const rawLevelValues = Array.isArray(rawLevels) ? rawLevels : [rawLevels];

  const uniqueLevels = Array.from(
    new Set(
      rawLevelValues
        .map(extractLevelNumber)
        .filter((level): level is number => level !== null)
    )
  );
  return sortLevelsByRank(uniqueLevels);
};

export const getVenueNameFromScheduleNote = (note?: string): string | null => {
  if (!note) return null;
  return note.split('|')[0]?.trim() || null;
};

export const getVenueAddressLineFromScheduleNote = (
  note?: string
): string | null => {
  if (!note) return null;
  const [name, ...addressParts] = note.split('|').map((part) => part.trim());
  const address = addressParts.join(' | ');
  return address ? `${name} | ${address}` : name || null;
};

export const getVenueAddressLine = (
  venue: IClub['defaultVenue']
): string | null => {
  if (!venue) return null;
  return [venue.name, venue.address].filter(Boolean).join(' | ') || null;
};
