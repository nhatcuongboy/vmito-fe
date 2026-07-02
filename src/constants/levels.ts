import { PlayerLevel } from '@/lib/api/types';

export const LEVELS = PlayerLevel;

export const LEVEL_DEFINITIONS = [
  {
    id: PlayerLevel.BEGINNER_MINUS,
    code: 'Y_MINUS',
    shortLabel: 'Yếu-',
    shortLabelKey: '9',
    labelKey: '9',
    sortOrder: 5,
  },
  {
    id: PlayerLevel.BEGINNER,
    code: 'Y',
    shortLabel: 'Yếu',
    shortLabelKey: '1',
    labelKey: '1',
    sortOrder: 10,
  },
  {
    id: PlayerLevel.BEGINNER_PLUS,
    code: 'Y_PLUS',
    shortLabel: 'Yếu+',
    shortLabelKey: '10',
    labelKey: '10',
    sortOrder: 15,
  },
  {
    id: PlayerLevel.ADVANCED_BEGINNER,
    code: 'TBY',
    shortLabel: 'TBY',
    shortLabelKey: '2',
    labelKey: '2',
    sortOrder: 20,
  },
  {
    id: PlayerLevel.LOW_INTERMEDIATE,
    code: 'TB_MINUS',
    shortLabel: 'TB-',
    shortLabelKey: '3',
    labelKey: '3',
    sortOrder: 30,
  },
  {
    id: PlayerLevel.INTERMEDIATE,
    code: 'TB',
    shortLabel: 'TB',
    shortLabelKey: '4',
    labelKey: '4',
    sortOrder: 40,
  },
  {
    id: PlayerLevel.HIGH_INTERMEDIATE,
    code: 'TB_PLUS',
    shortLabel: 'TB+',
    shortLabelKey: '5',
    labelKey: '5',
    sortOrder: 50,
  },
  {
    id: PlayerLevel.ADVANCED,
    code: 'KHA',
    shortLabel: 'Khá',
    shortLabelKey: '6',
    labelKey: '6',
    sortOrder: 60,
  },
  {
    id: PlayerLevel.SEMI_PRO,
    code: 'BC',
    shortLabel: 'BC',
    shortLabelKey: '7',
    labelKey: '7',
    sortOrder: 70,
  },
  {
    id: PlayerLevel.PRO,
    code: 'CN',
    shortLabel: 'CN',
    shortLabelKey: '8',
    labelKey: '8',
    sortOrder: 80,
  },
] as const;

export const VALID_LEVELS = LEVEL_DEFINITIONS.map((level) => level.id);

const LEVEL_RANK_BY_ID = new Map(
  LEVEL_DEFINITIONS.map((level, index) => [level.id, index])
);

export const getLevelRank = (level: number): number | undefined =>
  LEVEL_RANK_BY_ID.get(level);

export const sortLevelsByRank = (levels: number[]): number[] =>
  [...levels].sort((a, b) => {
    const rankA = getLevelRank(a) ?? Number.MAX_SAFE_INTEGER;
    const rankB = getLevelRank(b) ?? Number.MAX_SAFE_INTEGER;
    return rankA - rankB;
  });

export type LevelType = PlayerLevel;

// LEVEL_LABELS removed as we use translations
