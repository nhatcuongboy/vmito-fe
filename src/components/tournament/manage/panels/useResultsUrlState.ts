'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { ResultFilters, areResultFiltersEqual } from './resultsFilters';

export type ViewMode = 'list' | 'calendar';

const SHOW_PLAYER_NAMES_STORAGE_KEY = 'vmito.schedule.showPlayerNames';

export const FILTER_PARAM_KEYS = {
  categoryIds: 'categories',
  rounds: 'rounds',
  courtIds: 'courts',
  statuses: 'statuses',
  teamIds: 'teams',
  dateFrom: 'from',
  dateTo: 'to',
  query: 'q',
  viewMode: 'view',
  showPlayerNames: 'players',
  refereeOnly: 'referee',
  focusMatch: 'focusMatch',
} as const;

function parseCsv(raw: string | null) {
  return raw
    ? raw
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

function parseStatuses(raw: string | null): ResultFilters['statuses'] {
  return parseCsv(raw).filter(
    (status): status is ResultFilters['statuses'][number] =>
      status === 'upcoming' ||
      status === 'finished' ||
      status === 'cancelled' ||
      status === 'forfeited'
  );
}

function parseViewMode(raw: string | null): ViewMode {
  return raw === 'calendar' ? 'calendar' : 'list';
}

function parseShowPlayerNamesParam(raw: string | null) {
  if (raw != null) return raw === '1';
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(SHOW_PLAYER_NAMES_STORAGE_KEY) === '1';
}

type ReadonlyURLSearchParamsLike = Pick<URLSearchParams, 'get' | 'toString'>;

function parseFiltersFromSearchParams(
  searchParams: URLSearchParams | ReadonlyURLSearchParamsLike
): ResultFilters {
  return {
    categoryIds: parseCsv(searchParams.get(FILTER_PARAM_KEYS.categoryIds)),
    rounds: parseCsv(searchParams.get(FILTER_PARAM_KEYS.rounds)),
    courtIds: parseCsv(searchParams.get(FILTER_PARAM_KEYS.courtIds)),
    statuses: parseStatuses(searchParams.get(FILTER_PARAM_KEYS.statuses)),
    teamIds: parseCsv(searchParams.get(FILTER_PARAM_KEYS.teamIds)),
    dateFrom: searchParams.get(FILTER_PARAM_KEYS.dateFrom) ?? '',
    dateTo: searchParams.get(FILTER_PARAM_KEYS.dateTo) ?? '',
    query: searchParams.get(FILTER_PARAM_KEYS.query) ?? '',
    refereeOnly: searchParams.get(FILTER_PARAM_KEYS.refereeOnly) === '1',
  };
}

function setCsvParam(
  params: URLSearchParams,
  key: string,
  values: readonly string[]
) {
  if (values.length > 0) {
    params.set(key, values.join(','));
  } else {
    params.delete(key);
  }
}

function setStringParam(params: URLSearchParams, key: string, value: string) {
  if (value) {
    params.set(key, value);
  } else {
    params.delete(key);
  }
}

export function buildResultFilterSearchParams(
  currentQuery: string,
  filters: ResultFilters,
  viewMode: ViewMode,
  showPlayerNames: boolean
) {
  const params = new URLSearchParams(currentQuery);

  setCsvParam(params, FILTER_PARAM_KEYS.categoryIds, filters.categoryIds);
  setCsvParam(params, FILTER_PARAM_KEYS.rounds, filters.rounds);
  setCsvParam(params, FILTER_PARAM_KEYS.courtIds, filters.courtIds);
  setCsvParam(params, FILTER_PARAM_KEYS.statuses, filters.statuses);
  setCsvParam(params, FILTER_PARAM_KEYS.teamIds, filters.teamIds);
  setStringParam(params, FILTER_PARAM_KEYS.dateFrom, filters.dateFrom);
  setStringParam(params, FILTER_PARAM_KEYS.dateTo, filters.dateTo);
  setStringParam(params, FILTER_PARAM_KEYS.query, filters.query.trim());
  setStringParam(
    params,
    FILTER_PARAM_KEYS.refereeOnly,
    filters.refereeOnly ? '1' : ''
  );
  setStringParam(
    params,
    FILTER_PARAM_KEYS.viewMode,
    viewMode === 'calendar' ? viewMode : ''
  );
  setStringParam(
    params,
    FILTER_PARAM_KEYS.showPlayerNames,
    showPlayerNames ? '1' : ''
  );

  return params;
}

/**
 * Syncs Results filters/view-mode/show-player-names to URL search params via
 * `window.history.replaceState` (not `router.replace`) so typing in the search
 * box doesn't trigger a Next.js navigation/re-render on every keystroke.
 */
export function useResultsUrlState() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();

  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    parseViewMode(searchParams.get(FILTER_PARAM_KEYS.viewMode))
  );
  const [showPlayerNames, setShowPlayerNames] = useState<boolean>(() =>
    parseShowPlayerNamesParam(
      searchParams.get(FILTER_PARAM_KEYS.showPlayerNames)
    )
  );
  const [filters, setFilters] = useState<ResultFilters>(() =>
    parseFiltersFromSearchParams(searchParams)
  );

  useEffect(() => {
    const params = new URLSearchParams(currentQuery);
    const nextViewMode = parseViewMode(params.get(FILTER_PARAM_KEYS.viewMode));
    const nextShowPlayerNames = parseShowPlayerNamesParam(
      params.get(FILTER_PARAM_KEYS.showPlayerNames)
    );
    const nextFilters = parseFiltersFromSearchParams(params);
    setViewMode((prev) => (prev === nextViewMode ? prev : nextViewMode));
    setShowPlayerNames((prev) =>
      prev === nextShowPlayerNames ? prev : nextShowPlayerNames
    );
    setFilters((prev) =>
      areResultFiltersEqual(prev, nextFilters) ? prev : nextFilters
    );
  }, [currentQuery]);

  useEffect(() => {
    const nextParams = buildResultFilterSearchParams(
      currentQuery,
      filters,
      viewMode,
      showPlayerNames
    );
    const nextQuery = nextParams.toString();
    const canonicalCurrentQuery = new URLSearchParams(currentQuery).toString();
    if (nextQuery === canonicalCurrentQuery) return;
    if (typeof window === 'undefined') return;

    window.history.replaceState(
      window.history.state,
      '',
      `${pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`
    );
  }, [currentQuery, filters, pathname, showPlayerNames, viewMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      SHOW_PLAYER_NAMES_STORAGE_KEY,
      showPlayerNames ? '1' : '0'
    );
  }, [showPlayerNames]);

  return {
    pathname,
    searchParams,
    currentQuery,
    viewMode,
    setViewMode,
    showPlayerNames,
    setShowPlayerNames,
    filters,
    setFilters,
  };
}
