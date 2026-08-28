import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createNewsfeedBadgeStore,
  type NewsfeedBadgeService,
} from './createNewsfeedBadgeStore.ts';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

test('deduplicates concurrent unread-count requests', async () => {
  const unread = deferred<number>();
  let fetchCalls = 0;
  const service: NewsfeedBadgeService = {
    getUnreadFeedCount: () => {
      fetchCalls += 1;
      return unread.promise;
    },
    markFeedAsRead: async () => {},
  };
  const store = createNewsfeedBadgeStore(service);

  const first = store.getState().fetchCount();
  const second = store.getState().fetchCount();

  assert.equal(first, second);
  assert.equal(fetchCalls, 1);
  unread.resolve(7);
  await first;
  assert.equal(store.getState().count, 7);
  assert.equal(store.getState().isLoading, false);
});

test('does not let an older GET overwrite mark-as-read', async () => {
  const firstUnread = deferred<number>();
  let fetchCalls = 0;
  const service: NewsfeedBadgeService = {
    getUnreadFeedCount: () => {
      fetchCalls += 1;
      return fetchCalls === 1 ? firstUnread.promise : Promise.resolve(0);
    },
    markFeedAsRead: async () => {},
  };
  const store = createNewsfeedBadgeStore(service);

  const fetching = store.getState().fetchCount();
  await store.getState().markAsRead();
  firstUnread.resolve(9);
  await fetching;

  assert.equal(fetchCalls, 2);
  assert.equal(store.getState().count, 0);
});

test('revalidates optimistic state when mark-as-read fails', async () => {
  const service: NewsfeedBadgeService = {
    getUnreadFeedCount: async () => 4,
    markFeedAsRead: async () => {
      throw new Error('network error');
    },
  };
  const store = createNewsfeedBadgeStore(service);
  store.getState().incrementCount();
  store.getState().incrementCount();

  await store.getState().markAsRead();
  await store.getState().fetchCount();

  assert.equal(store.getState().count, 4);
  assert.equal(store.getState().error, null);
});

test('ignores requests from a previous authenticated identity', async () => {
  const oldUnread = deferred<number>();
  let fetchCalls = 0;
  const service: NewsfeedBadgeService = {
    getUnreadFeedCount: () => {
      fetchCalls += 1;
      return fetchCalls === 1 ? oldUnread.promise : Promise.resolve(2);
    },
    markFeedAsRead: async () => {},
  };
  const store = createNewsfeedBadgeStore(service);

  const oldFetch = store.getState().fetchCount();
  store.getState().reset();
  const newFetch = store.getState().fetchCount();
  oldUnread.resolve(11);
  await Promise.all([oldFetch, newFetch]);

  assert.equal(store.getState().count, 2);
  assert.equal(store.getState().isLoading, false);
});

test('ignores errors from a previous authenticated identity', async () => {
  const oldUnread = deferred<number>();
  let fetchCalls = 0;
  const service: NewsfeedBadgeService = {
    getUnreadFeedCount: () => {
      fetchCalls += 1;
      return fetchCalls === 1 ? oldUnread.promise : Promise.resolve(3);
    },
    markFeedAsRead: async () => {},
  };
  const store = createNewsfeedBadgeStore(service);

  const oldFetch = store.getState().fetchCount();
  store.getState().reset();
  await store.getState().fetchCount();
  oldUnread.reject(new Error('old account request failed'));
  await oldFetch;

  assert.equal(store.getState().count, 3);
  assert.equal(store.getState().error, null);
});
