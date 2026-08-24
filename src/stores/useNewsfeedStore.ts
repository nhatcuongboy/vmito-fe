import { create } from 'zustand';
import { postsService } from '@/lib/api/posts.service';
import type { Post } from '@/types/post';

const POSTS_PER_PAGE = 10;
const CACHE_TTL_MS = 30_000;

interface NewsfeedState {
  ownerUserId: string | null;
  posts: Post[];
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  hasError: boolean;
  lastFetchedAt: number | null;

  ensureFeed: (userId: string) => Promise<void>;
  refreshFeed: (userId: string) => Promise<void>;
  loadMore: (userId: string) => Promise<void>;
  removePost: (userId: string, postId: string) => void;
  prependPost: (userId: string, post: Post) => void;
  reset: () => void;
}

const emptyState = {
  ownerUserId: null,
  posts: [],
  page: 1,
  hasMore: false,
  isLoading: false,
  isRefreshing: false,
  isLoadingMore: false,
  hasError: false,
  lastFetchedAt: null,
};

type RequestOptions = { append?: boolean; force?: boolean };

/**
 * Shared, in-memory state for the authenticated user's newsfeed. Keeping it
 * outside the route component lets Back navigation restore the visible feed
 * immediately, while all fetching and mutation invalidation stay centralized.
 */
export const useNewsfeedStore = create<NewsfeedState>((set, get) => {
  const requestFeed = async (
    userId: string,
    { append = false, force = false }: RequestOptions = {}
  ): Promise<void> => {
    const state = get();
    const isCurrentUser = state.ownerUserId === userId;
    const hasSnapshot = isCurrentUser && state.lastFetchedAt !== null;
    const isFresh =
      hasSnapshot && Date.now() - (state.lastFetchedAt ?? 0) < CACHE_TTL_MS;

    if (!force && !append && isFresh) return;
    if (
      isCurrentUser &&
      (state.isLoading || state.isRefreshing || state.isLoadingMore)
    ) {
      return;
    }
    if (append && (!isCurrentUser || !state.hasMore)) return;

    const page = append ? state.page + 1 : 1;
    set({
      ownerUserId: userId,
      posts: isCurrentUser ? state.posts : [],
      page: isCurrentUser ? state.page : 1,
      hasMore: isCurrentUser ? state.hasMore : false,
      isLoading: !append && !hasSnapshot,
      isRefreshing: !append && hasSnapshot,
      isLoadingMore: append,
      hasError: false,
      lastFetchedAt: isCurrentUser ? state.lastFetchedAt : null,
    });

    try {
      const response = await postsService.getPosts(page, POSTS_PER_PAGE);

      // Another account may have become active while this request was running.
      if (get().ownerUserId !== userId) return;

      const responsePosts = Array.isArray(response.posts) ? response.posts : [];
      const responsePage = response.page ?? page;
      const responseHasMore = Boolean(response.hasMore);

      set((current) => {
        const posts = append
          ? (() => {
              const existingIds = new Set(current.posts.map((post) => post.id));
              return [
                ...current.posts,
                ...responsePosts.filter((post) => !existingIds.has(post.id)),
              ];
            })()
          : responsePosts;

        return {
          posts,
          page: responsePage,
          hasMore: responseHasMore,
          isLoading: false,
          isRefreshing: false,
          isLoadingMore: false,
          lastFetchedAt: Date.now(),
        };
      });
    } catch {
      if (get().ownerUserId !== userId) return;
      set({
        hasError: true,
        isLoading: false,
        isRefreshing: false,
        isLoadingMore: false,
      });
    }
  };

  return {
    ...emptyState,

    ensureFeed: (userId) => requestFeed(userId),
    refreshFeed: (userId) => requestFeed(userId, { force: true }),
    loadMore: (userId) => requestFeed(userId, { append: true }),

    removePost: (userId, postId) => {
      if (get().ownerUserId !== userId) return;
      set((state) => ({
        posts: state.posts.filter(
          (post) => post.id !== postId && post.originalPostId !== postId
        ),
      }));
    },

    prependPost: (userId, post) => {
      if (get().ownerUserId !== userId) return;
      set((state) => ({ posts: [post, ...state.posts] }));
    },

    reset: () => set(emptyState),
  };
});
