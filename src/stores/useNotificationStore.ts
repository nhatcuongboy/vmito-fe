'use client';

import { create } from 'zustand';
import { INotification } from '@/lib/api/types';
import { NotificationService } from '@/lib/api/notification.service';

interface INotificationStore {
  notifications: INotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;

  // Actions
  fetchNotifications: (reset?: boolean) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  addNotification: (notification: INotification) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  reset: () => void;
}

export const useNotificationStore = create<INotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  hasMore: true,
  page: 1,

  fetchNotifications: async (reset = false) => {
    const currentPage = reset ? 1 : get().page;

    try {
      set({ isLoading: true, error: null });

      const response = await NotificationService.getNotifications({
        page: currentPage,
        limit: 20,
      });

      set((state) => ({
        notifications: reset
          ? response.data
          : [...state.notifications, ...response.data],
        page: currentPage + 1,
        hasMore: currentPage < response.pagination.totalPages,
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch notifications',
        isLoading: false,
      });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await NotificationService.getUnreadCount();
      set({ unreadCount: response.count });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  addNotification: (notification: INotification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAsRead: async (id: string) => {
    try {
      await NotificationService.markAsRead(id);

      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await NotificationService.markAllAsRead();

      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  },

  deleteNotification: async (id: string) => {
    try {
      await NotificationService.deleteNotification(id);

      set((state) => {
        const notification = state.notifications.find((n) => n.id === id);
        const wasUnread = notification && !notification.isRead;

        return {
          notifications: state.notifications.filter((n) => n.id !== id),
          unreadCount: wasUnread
            ? Math.max(0, state.unreadCount - 1)
            : state.unreadCount,
        };
      });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  },

  reset: () => {
    set({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,
      hasMore: true,
      page: 1,
    });
  },
}));
