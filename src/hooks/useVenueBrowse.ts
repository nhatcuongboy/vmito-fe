'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type SetStateAction,
} from 'react';
import { VenueService } from '@/lib/api/venue.service';
import type { SearchVenueResponse, Venue } from '@/lib/api/types';
import {
  appendVenuePage,
  venueQueryKey,
  VenueRequestCoordinator,
  type VenueBrowseQuery,
  type VenueBrowseSeed,
} from '@/lib/venue-browse';

interface BrowseState {
  key: string;
  result: SearchVenueResponse | null;
  loading: boolean;
  loadingMore: boolean;
  fetching: boolean;
  error: 'initial' | 'more' | null;
}

// Client navigation cache only: no writes during SSR, scoped to account + query.
// Keep at most three lists for five minutes, without persisting personal data.
const navigationCache = new Map<
  string,
  { result: SearchVenueResponse; updatedAt: number }
>();
const CACHE_TTL = 5 * 60_000;

export function useVenueBrowse({
  query,
  enabled,
  accountKey,
  seed,
}: {
  query: VenueBrowseQuery;
  enabled: boolean;
  accountKey: string;
  seed?: VenueBrowseSeed | null;
}) {
  const queryKey = venueQueryKey(query);
  const key = `${accountKey}:${queryKey}`;
  const [state, setState] = useState<BrowseState>(() => ({
    key,
    result: seed?.result ?? null,
    loading: !seed,
    loadingMore: false,
    fetching: false,
    error: null,
  }));
  const stateRef = useRef(state);
  const queryRef = useRef(query);
  queryRef.current = query;
  const currentKey = useRef(key);
  currentKey.current = key;
  const coordinator = useRef(new VenueRequestCoordinator());
  const seedRef = useRef(seed);
  const publish = useCallback((next: BrowseState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const fetchPage = useCallback(
    async (page: number) => {
      if (!enabled) return;
      const request = coordinator.current.begin(key, page);
      if (!request) return;
      const previous = stateRef.current;
      publish({
        ...previous,
        key,
        error: null,
        loading: page === 1 && !previous.result,
        loadingMore: page > 1,
        fetching: true,
      });
      try {
        const result = await VenueService.searchVenues(
          { ...queryRef.current, page },
          { signal: request.controller.signal, skipGlobalError: true }
        );
        if (
          currentKey.current !== key ||
          !coordinator.current.isCurrent(request)
        )
          return;
        const current = stateRef.current;
        publish({
          key,
          result:
            page > 1 && current.result
              ? appendVenuePage(current.result, result)
              : result,
          loading: false,
          loadingMore: false,
          fetching: false,
          error: null,
        });
      } catch {
        if (
          currentKey.current !== key ||
          !coordinator.current.isCurrent(request)
        )
          return;
        publish({
          ...stateRef.current,
          loading: false,
          loadingMore: false,
          fetching: false,
          error: page > 1 ? 'more' : 'initial',
        });
      } finally {
        coordinator.current.finish(request);
      }
    },
    [enabled, key, publish]
  );

  useEffect(() => {
    const lane = coordinator.current;
    lane.reset(key);
    if (!enabled) return () => lane.reset('');

    const cached = navigationCache.get(key);
    const usableCache = cached && Date.now() - cached.updatedAt < CACHE_TTL;
    const matchingSeed =
      seedRef.current?.queryKey === queryKey ? seedRef.current.result : null;
    const result = usableCache ? cached.result : matchingSeed;
    publish({
      key,
      result,
      loading: !result,
      loadingMore: false,
      fetching: false,
      error: null,
    });
    // Public SSR has no account-specific favorites. Reconcile it once for the
    // signed-in account before the same request lane allows page two.
    if (!usableCache && !(matchingSeed && accountKey === 'public'))
      void fetchPage(1);

    return () => lane.reset('');
  }, [accountKey, enabled, fetchPage, key, publish, queryKey]);

  useEffect(() => {
    if (
      !enabled ||
      stateRef.current !== state ||
      state.key !== key ||
      !state.result ||
      state.error ||
      state.loading ||
      state.loadingMore ||
      state.fetching
    )
      return;
    navigationCache.delete(key);
    navigationCache.set(key, { result: state.result, updatedAt: Date.now() });
    while (navigationCache.size > 3)
      navigationCache.delete(navigationCache.keys().next().value!);
  }, [enabled, key, state]);

  const loadMore = useCallback(() => {
    const current = stateRef.current;
    if (
      current.key !== key ||
      current.loading ||
      current.loadingMore ||
      current.fetching ||
      current.error ||
      !current.result
    )
      return;
    if (current.result.pagination.page >= current.result.pagination.totalPages)
      return;
    void fetchPage(current.result.pagination.page + 1);
  }, [fetchPage, key]);

  const retry = useCallback(() => {
    const current = stateRef.current;
    void fetchPage(
      current.error === 'more' && current.result
        ? current.result.pagination.page + 1
        : 1
    );
  }, [fetchPage]);

  const setVenues = useCallback(
    (update: SetStateAction<Venue[]>) => {
      const current = stateRef.current;
      if (!current.result) return;
      const data =
        typeof update === 'function' ? update(current.result.data) : update;
      publish({ ...current, result: { ...current.result, data } });
    },
    [publish]
  );

  return {
    venues: state.result?.data ?? [],
    totalCount: state.result?.pagination.total ?? null,
    hasMore:
      !!state.result &&
      state.result.pagination.page < state.result.pagination.totalPages &&
      query.limit === 12,
    loading: state.loading,
    loadingMore: state.loadingMore,
    isFetching: state.fetching,
    error: state.error,
    loadMore,
    retry,
    setVenues,
    listKey: key,
  };
}
