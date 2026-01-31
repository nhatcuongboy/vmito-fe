import { api } from './base';
import {
  ApiResponse,
  INotification,
  IPaginatedNotifications,
  IBroadcastNotificationRequest,
  NotificationType,
} from './types';

export const NotificationService = {
  /**
   * Get all notifications for the current user
   */
  getNotifications: async (params?: {
    type?: NotificationType;
    page?: number;
    limit?: number;
  }): Promise<IPaginatedNotifications> => {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set('type', params.type);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));

    const queryString = searchParams.toString();
    const url = queryString ? `/notifications?${queryString}` : '/notifications';

    const response = await api.get<ApiResponse<IPaginatedNotifications>>(url);
    return response.data.data!;
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await api.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
    return response.data.data!;
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (id: string): Promise<INotification> => {
    const response = await api.patch<ApiResponse<INotification>>(`/notifications/${id}/read`);
    return response.data.data!;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<{ message: string }> => {
    const response = await api.patch<ApiResponse<{ message: string }>>('/notifications/read-all');
    return response.data.data!;
  },

  /**
   * Delete a notification
   */
  deleteNotification: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/notifications/${id}`);
    return response.data.data!;
  },

  /**
   * Broadcast a notification to all users (Admin only)
   */
  broadcastNotification: async (data: IBroadcastNotificationRequest): Promise<{ message: string; count: number }> => {
    const response = await api.post<ApiResponse<{ message: string; count: number }>>('/notifications/broadcast', data);
    return response.data.data!;
  },
};
