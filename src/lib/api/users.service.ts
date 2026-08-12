import { api, type ApiResponse } from './base';

/**
 * Users API Service
 * Handles user-related API calls
 */
export const UsersService = {
  /**
   * Get count of unread posts in newsfeed.
   * Returns the number of posts created by other users since lastSeenFeedAt.
   * @returns Promise<number> - Count of unread posts
   */
  async getUnreadFeedCount(): Promise<number> {
    try {
      const response = await api.get<ApiResponse<{ count: number }>>(
        '/users/unread-feed-count'
      );
      return response.data.data?.count ?? 0;
    } catch (error) {
      console.error('Failed to fetch unread feed count:', error);
      throw error;
    }
  },

  /**
   * Mark newsfeed as read.
   * Updates lastSeenFeedAt to now, resetting the unread badge to 0.
   * @returns Promise<void>
   */
  async markFeedAsRead(): Promise<void> {
    try {
      await api.post<ApiResponse<{ success: boolean }>>(
        '/users/mark-feed-as-read'
      );
    } catch (error) {
      console.error('Failed to mark feed as read:', error);
      throw error;
    }
  },
};
