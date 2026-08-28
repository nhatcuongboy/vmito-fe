import { create, type StoreApi, type UseBoundStore } from 'zustand';

export interface NewsfeedBadgeService {
  getUnreadFeedCount: () => Promise<number>;
  markFeedAsRead: () => Promise<void>;
}

export interface NewsfeedBadgeState {
  count: number;
  isLoading: boolean;
  error: Error | null;
  fetchCount: () => Promise<void>;
  markAsRead: () => Promise<void>;
  incrementCount: () => void;
  reset: () => void;
}

const MAX_FETCH_ATTEMPTS = 3;

/**
 * Creates the badge store with request coordination kept inside the store.
 * A version change means a local update happened while a request was in flight,
 * so an older response must not overwrite the newer client state.
 */
export function createNewsfeedBadgeStore(
  service: NewsfeedBadgeService
): UseBoundStore<StoreApi<NewsfeedBadgeState>> {
  return create<NewsfeedBadgeState>((set) => {
    let generation = 0;
    let version = 0;
    let fetchPromise: Promise<void> | null = null;
    let markPromise: Promise<void> | null = null;
    let activeFetchId: symbol | null = null;
    let activeMarkId: symbol | null = null;

    const fetchCount = (): Promise<void> => {
      if (fetchPromise) return fetchPromise;

      const fetchGeneration = generation;
      const requestId = Symbol('newsfeed-badge-fetch');
      let requestVersion = version;
      activeFetchId = requestId;
      const promise = (async () => {
        set({ isLoading: true, error: null });

        try {
          for (let attempt = 0; attempt < MAX_FETCH_ATTEMPTS; attempt += 1) {
            requestVersion = version;
            const count = await service.getUnreadFeedCount();

            if (fetchGeneration !== generation) return;

            if (requestVersion === version) {
              set({ count, error: null });
              return;
            }

            // A mark-as-read may have invalidated this GET. Wait for it before
            // retrying so the next response reflects the updated server state.
            if (markPromise) await markPromise;
          }
        } catch (error) {
          if (
            fetchGeneration === generation &&
            requestVersion === version &&
            activeFetchId === requestId
          ) {
            set({ error: error as Error });
          }
        } finally {
          if (activeFetchId === requestId) {
            activeFetchId = null;
            fetchPromise = null;
            set({ isLoading: false });
          }
        }
      })();

      fetchPromise = promise;
      return promise;
    };

    const markAsRead = (): Promise<void> => {
      if (markPromise) return markPromise;

      version += 1;
      const markGeneration = generation;
      const markVersion = version;
      set({ count: 0, error: null });

      const requestId = Symbol('newsfeed-badge-mark');
      activeMarkId = requestId;
      const promise = (async () => {
        let shouldRevalidate = false;

        try {
          await service.markFeedAsRead();
        } catch (error) {
          shouldRevalidate = true;
          if (generation === markGeneration && version === markVersion) {
            set({ error: error as Error });
          }
        } finally {
          if (activeMarkId === requestId) {
            activeMarkId = null;
            markPromise = null;
          }

          // Reconcile optimistic state after a failed mutation. Do this after
          // releasing markPromise so it cannot deadlock an in-flight fetch.
          if (
            shouldRevalidate &&
            generation === markGeneration &&
            version === markVersion
          ) {
            void fetchCount();
          }
        }
      })();

      markPromise = promise;
      return promise;
    };

    return {
      count: 0,
      isLoading: false,
      error: null,
      fetchCount,
      markAsRead,
      incrementCount: () => {
        version += 1;
        set((state) => ({
          count: Number.isFinite(state.count) ? state.count + 1 : 1,
        }));
      },
      reset: () => {
        generation += 1;
        version += 1;
        fetchPromise = null;
        markPromise = null;
        activeFetchId = null;
        activeMarkId = null;
        set({ count: 0, isLoading: false, error: null });
      },
    };
  });
}
