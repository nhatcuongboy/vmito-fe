import { create } from 'zustand';
import { UsersService } from '@/lib/api/users.service';

interface NewsfeedBadgeStore {
  count: number;
  isLoading: boolean;
  error: Error | null;

  /**
   * Fetch unread feed count from API and update store
   */
  fetchCount: () => Promise<void>;

  /**
   * Mark feed as read (optimistic update + API call)
   * Sets count to 0 immediately, then calls API
   */
  markAsRead: () => Promise<void>;

  /**
   * Increment count by 1 (for real-time Socket updates)
   */
  incrementCount: () => void;

  /**
   * Reset store (on logout or unmount)
   */
  reset: () => void;
}

export const useNewsfeedBadgeStore = create<NewsfeedBadgeStore>((set, get) => ({
  count: 0,
  isLoading: false,
  error: null,

  fetchCount: async () => {
    set({ isLoading: true, error: null });

    try {
      const count = await UsersService.getUnreadFeedCount();
      set({ count, isLoading: false });
    } catch (error) {
      console.error('[NewsfeedBadge] Failed to fetch count:', error);
      set({
        error: error as Error,
        isLoading: false,
      });
    }
  },

  markAsRead: async () => {
    const previousCount = get().count;

    // Optimistic update: set count to 0 immediately for smooth UX
    set({ count: 0, error: null });

    try {
      await UsersService.markFeedAsRead();
      // Keep count at 0 on success
    } catch (error) {
      console.error('[NewsfeedBadge] Failed to mark as read:', error);
      // Revert on error (or not - depending on UX preference)
      // For now, we keep it at 0 assuming eventual consistency
      set({ error: error as Error });

      // Optional: revert to previous count on error
      // set({ count: previousCount, error: error as Error });
    }
  },

  incrementCount: () => {
    set((state) => ({ count: state.count + 1 }));
  },

  reset: () => {
    set({ count: 0, isLoading: false, error: null });
  },
}));
