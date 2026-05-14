'use client';

import { create } from 'zustand';
import { INotification } from '@/lib/api/types';
import { NotificationService } from '@/lib/api/notification.service';
import { useAuthStore } from '@/stores/useAuthStore';

const isNotificationForUser = (notification: INotification, userId: string) =>
  String(notification.userId) === String(userId);

const getCurrentUserId = () => useAuthStore.getState().user?.id ?? null;

interface INotificationStore {
  ownerUserId: string | null;
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
  ownerUserId: null,
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  hasMore: true,
  page: 1,

  fetchNotifications: async (reset = false) => {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      get().reset();
      return;
    }

    const isUserScopeChanged = get().ownerUserId !== currentUserId;
    const currentPage = reset || isUserScopeChanged ? 1 : get().page;

    try {
      set((state) => ({
        ownerUserId: currentUserId,
        notifications: isUserScopeChanged ? [] : state.notifications,
        unreadCount: isUserScopeChanged ? 0 : state.unreadCount,
        page: isUserScopeChanged ? 1 : state.page,
        hasMore: isUserScopeChanged ? true : state.hasMore,
        isLoading: true,
        error: null,
      }));

      const response = await NotificationService.getNotifications({
        page: currentPage,
        limit: 20,
      });

      if (getCurrentUserId() !== currentUserId) {
        return;
      }

      const scopedResponseData = response.data.filter((notification) =>
        isNotificationForUser(notification, currentUserId)
      );

      if (scopedResponseData.length < response.data.length) {
        console.warn(
          `[NotificationStore] Filtered ${response.data.length - scopedResponseData.length} notification(s) for other users from API`
        );
      }

      set((state) => {
        let notifications: INotification[];

        if (reset) {
          notifications = scopedResponseData;
        } else {
          // Merge with deduplication when loading more
          const existingIds = new Set(state.notifications.map((n) => n.id));
          const newNotifications = scopedResponseData.filter(
            (n) => !existingIds.has(n.id)
          );
          notifications = [...state.notifications, ...newNotifications];

          if (newNotifications.length < scopedResponseData.length) {
            console.warn(
              `[NotificationStore] Filtered ${scopedResponseData.length - newNotifications.length} duplicate notifications from API`
            );
          }
        }

        return {
          notifications,
          page: currentPage + 1,
          hasMore: currentPage < response.pagination.totalPages,
          isLoading: false,
        };
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch notifications',
        isLoading: false,
      });
    }
  },

  fetchUnreadCount: async () => {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      set({ unreadCount: 0 });
      return;
    }

    try {
      const response = await NotificationService.getUnreadCount();

      if (getCurrentUserId() === currentUserId) {
        set({ ownerUserId: currentUserId, unreadCount: response.count });
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  addNotification: (notification: INotification) => {
    const currentUserId = getCurrentUserId();

    if (!currentUserId || !isNotificationForUser(notification, currentUserId)) {
      console.warn(
        `[NotificationStore] Ignored notification ${notification.id} for user ${notification.userId}; current user is ${currentUserId ?? 'anonymous'}`
      );
      return;
    }

    set((state) => {
      const currentNotifications =
        state.ownerUserId === currentUserId ? state.notifications : [];
      const currentUnreadCount =
        state.ownerUserId === currentUserId ? state.unreadCount : 0;

      // Check if notification already exists (deduplication)
      const exists = currentNotifications.some((n) => n.id === notification.id);

      if (exists) {
        console.warn(
          `[NotificationStore] Duplicate notification detected and prevented: ${notification.id}`
        );
        return state; // Don't add duplicate
      }

      return {
        ownerUserId: currentUserId,
        notifications: [notification, ...currentNotifications],
        unreadCount: currentUnreadCount + 1,
      };
    });
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
      throw error;
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
      ownerUserId: null,
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,
      hasMore: true,
      page: 1,
    });
  },
}));
