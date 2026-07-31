import { CategoryMatch, MatchStatus } from '@/lib/api/types';
import { getMatchDisplayCode } from '@/lib/tournament/codes';
import { getTeamLabel } from '@/lib/tournament/teamLabel';

export type ResultStatusFilter =
  | 'upcoming'
  | 'finished'
  | 'cancelled'
  | 'forfeited';

export interface ResultFilters {
  categoryIds: string[];
  rounds: string[];
  courtIds: string[];
  statuses: ResultStatusFilter[];
  teamIds: string[];
  dateFrom: string;
  dateTo: string;
  query: string;
  refereeOnly: boolean;
}

export interface ChipOption {
  id: string;
  label: string;
  description?: string;
  color?: string;
}

export type ListFilterKey =
  | 'categoryIds'
  | 'rounds'
  | 'courtIds'
  | 'statuses'
  | 'teamIds';

export const EMPTY_FILTERS: ResultFilters = {
  categoryIds: [],
  rounds: [],
  courtIds: [],
  statuses: [],
  teamIds: [],
  dateFrom: '',
  dateTo: '',
  query: '',
  refereeOnly: false,
};

export const CATEGORY_COLORS = [
  '#F6D365',
  '#9BDBF5',
  '#8EE3B2',
  '#C4A5FD',
  '#F8B4D9',
  '#FDBA74',
  '#7DD3FC',
  '#FCA5A5',
];

export function matchMatchesFilters(
  match: CategoryMatch,
  filters: ResultFilters,
  currentUserId?: string,
  refereeAccess?: { canRefereeAny: boolean; hasOwnAssignments: boolean }
) {
  const query = normalizeSearchText(filters.query);
  if (query && !getMatchSearchText(match).includes(query)) {
    return false;
  }

  if (filters.refereeOnly) {
    const isMine = !!currentUserId && match.referee?.userId === currentUserId;
    // Prefer explicitly-assigned matches; if I have none but I'm allowed to
    // referee (host / admin / REFEREE), fall back to every match I can referee.
    if (refereeAccess?.hasOwnAssignments) {
      if (!isMine) return false;
    } else if (!refereeAccess?.canRefereeAny && !isMine) {
      return false;
    }
  }

  if (
    filters.categoryIds.length > 0 &&
    !filters.categoryIds.includes(match.categoryId)
  ) {
    return false;
  }
  if (filters.rounds.length > 0 && !filters.rounds.includes(match.round)) {
    return false;
  }
  if (
    filters.courtIds.length > 0 &&
    (!match.courtId || !filters.courtIds.includes(match.courtId))
  ) {
    return false;
  }
  if (
    filters.statuses.length > 0 &&
    !filters.statuses.some((status) => matchesStatusFilter(match, status))
  ) {
    return false;
  }
  if (filters.teamIds.length > 0) {
    const registrationIds =
      match.participants?.map((item) => item.categoryRegistrationId) ?? [];
    if (!registrationIds.some((id) => filters.teamIds.includes(id))) {
      return false;
    }
  }
  if (filters.dateFrom || filters.dateTo) {
    if (!match.startTime) return false;
    const matchDate = toDateInputValue(match.startTime);
    if (filters.dateFrom && matchDate < filters.dateFrom) return false;
    if (filters.dateTo && matchDate > filters.dateTo) return false;
  }
  return true;
}

function matchesStatusFilter(match: CategoryMatch, filter: ResultStatusFilter) {
  if (filter === 'forfeited') return !!match.isForfeit;
  if (filter === 'cancelled') return match.status === MatchStatus.CANCELLED;
  if (filter === 'finished') {
    return match.status === MatchStatus.FINISHED && !match.isForfeit;
  }
  return (
    match.status === MatchStatus.SCHEDULED ||
    match.status === MatchStatus.IN_PROGRESS
  );
}

export function getActiveFilterCount(filters: ResultFilters) {
  return (
    filters.categoryIds.length +
    filters.rounds.length +
    filters.courtIds.length +
    filters.statuses.length +
    filters.teamIds.length +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0) +
    (filters.query.trim() ? 1 : 0)
  );
}

function getMatchSearchText(match: CategoryMatch) {
  const values: string[] = [
    match.matchCode ?? '',
    getMatchDisplayCode(match),
    getTeamLabel(match, 1),
    getTeamLabel(match, 2),
  ];

  match.participants?.forEach((participant) => {
    const registration = participant.categoryRegistration;
    if (!registration) return;

    values.push(registration.player?.name ?? '');
    values.push(registration.pair?.name ?? '');
    registration.pair?.members?.forEach((member) => {
      values.push(member.player?.name ?? '');
    });
  });

  return normalizeSearchText(values.join(' '));
}

function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export function areResultFiltersEqual(a: ResultFilters, b: ResultFilters) {
  return (
    areStringArraysEqual(a.categoryIds, b.categoryIds) &&
    areStringArraysEqual(a.rounds, b.rounds) &&
    areStringArraysEqual(a.courtIds, b.courtIds) &&
    areStringArraysEqual(a.statuses, b.statuses) &&
    areStringArraysEqual(a.teamIds, b.teamIds) &&
    a.dateFrom === b.dateFrom &&
    a.dateTo === b.dateTo &&
    a.query === b.query &&
    a.refereeOnly === b.refereeOnly
  );
}

function areStringArraysEqual(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

export function getCategoryColor(options: ChipOption[], categoryId: string) {
  return options.find((option) => option.id === categoryId)?.color ?? '#8EE3B2';
}

export function toDateInputValue(value: Date | string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
