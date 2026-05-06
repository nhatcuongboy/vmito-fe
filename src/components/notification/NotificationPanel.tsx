'use client';

import { useEffect, useRef } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  IconButton,
  Spinner,
  Flex,
} from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import {
  PopoverRoot,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverCloseTrigger,
} from '@/components/ui/popover';
import { LuBell, LuCheckCheck, LuInbox } from 'react-icons/lu';
import { useTranslations } from 'next-intl';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { NotificationItem } from './NotificationItem';
import { NotificationSkeleton } from './NotificationSkeleton';
import { INotification } from '@/lib/api/types';
import { useRouter } from '@/i18n/config';
import { useAuthStore } from '@/stores/useAuthStore';
import { ROUTES } from '@/constants/routes';

export const NotificationPanel = () => {
  const t = useTranslations('notification');
  const router = useRouter();
  const { user } = useAuthStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const closeTriggerRef = useRef<HTMLButtonElement>(null);

  const {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationStore();

  // Fetch notifications and unread count on mount
  useEffect(() => {
    console.log('[NotificationPanel] User state:', user);
    if (user) {
      console.log('[NotificationPanel] Fetching notifications...');
      // Call store methods directly without depending on them
      useNotificationStore.getState().fetchNotifications(true);
      useNotificationStore.getState().fetchUnreadCount();
    }
  }, [user]);

  // Also fetch when popover opens
  const handleOpenChange = (open: boolean) => {
    if (open && user) {
      console.log('[NotificationPanel] Popover opened, fetching...');
      useNotificationStore.getState().fetchNotifications(true);
      useNotificationStore.getState().fetchUnreadCount();
    }
  };

  // Handle scroll for infinite loading
  const handleScroll = () => {
    const container = containerRef.current;
    if (!container || isLoading || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    if (scrollHeight - scrollTop - clientHeight < 100) {
      fetchNotifications();
    }
  };

  const handleNotificationClick = (notification: INotification) => {
    const { type, data } = notification;

    // Helper to determine the target route based on notification type
    const getTargetRoute = (): string | null => {
      const typeStr = String(type).toUpperCase();
      console.log('[NotificationPanel] Clicked notification:', typeStr, data);

      switch (typeStr) {
        case 'SESSION':
        case 'REGISTRATION': {
          if (data?.sessionId) {
            const sessionId = String(data.sessionId);
            const slug = data.slug ? String(data.slug) : undefined;
            return user?.role === 'HOST'
              ? ROUTES.HOST.SESSIONS.DETAIL(sessionId, slug)
              : ROUTES.PLAYER.SESSIONS.DETAIL(sessionId, slug);
          }
          break;
        }
        case 'CLUB': {
          if (data?.clubId) {
            const clubId = data.clubSlug
              ? String(data.clubSlug)
              : String(data.clubId);
            return user?.role === 'HOST'
              ? ROUTES.HOST.CLUBS.EDIT(clubId)
              : ROUTES.CLUBS.DETAIL(clubId);
          }
          break;
        }
        // TODO: Add more branches here when extending (PAYMENT, TOURNAMENT, SYSTEM, etc.)
        default: {
          // Fallback routing relying on data payload if type isn't fully matched
          if (data?.sessionId) {
            const sessionId = String(data.sessionId);
            const slug = data.slug ? String(data.slug) : undefined;
            return user?.role === 'HOST'
              ? ROUTES.HOST.SESSIONS.DETAIL(sessionId, slug)
              : ROUTES.PLAYER.SESSIONS.DETAIL(sessionId, slug);
          }
          if (data?.clubId) {
            const clubId = data.clubSlug
              ? String(data.clubSlug)
              : String(data.clubId);
            return ROUTES.CLUBS.DETAIL(clubId);
          }
          break;
        }
      }
      return null;
    };

    const targetPath = getTargetRoute();
    if (targetPath) {
      closeTriggerRef.current?.click(); // Close popover before navigating
      router.push(targetPath);
    }
  };

  if (!user) return null;

  return (
    <PopoverRoot
      positioning={{ placement: 'bottom-end' }}
      onOpenChange={(e) => handleOpenChange(e.open)}
    >
      <PopoverTrigger asChild>
        <Box position="relative">
          <IconButton aria-label={t('notifications')} variant="ghost" size="sm">
            <LuBell size={20} />
          </IconButton>
          {unreadCount > 0 && (
            <Box
              position="absolute"
              top="-1"
              right="-1"
              bg="red.500"
              color="white"
              borderRadius="full"
              minW="18px"
              h="18px"
              fontSize="xs"
              fontWeight="bold"
              display="flex"
              alignItems="center"
              justifyContent="center"
              px={1}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Box>
          )}
        </Box>
      </PopoverTrigger>

      <PopoverContent w="400px" maxW="95vw">
        <PopoverHeader borderBottomWidth="1px">
          <HStack justify="space-between">
            <Text fontWeight="semibold">{t('notifications')}</Text>
            {unreadCount > 0 && (
              <Button size="xs" variant="ghost" onClick={() => markAllAsRead()}>
                <LuCheckCheck size={14} />
                {t('markAllAsRead')}
              </Button>
            )}
          </HStack>
        </PopoverHeader>

        {/* Hidden close trigger for programmatic close on notification click */}
        <PopoverCloseTrigger asChild>
          <button
            ref={closeTriggerRef}
            style={{ display: 'none' }}
            aria-hidden
          />
        </PopoverCloseTrigger>

        <PopoverBody p={0}>
          <Box
            ref={containerRef}
            maxH="400px"
            overflowY="auto"
            onScroll={handleScroll}
          >
            {notifications.length === 0 && !isLoading ? (
              <VStack py={8} gap={2} color="gray.500">
                <LuInbox size={32} />
                <Text fontSize="sm">{t('noNotifications')}</Text>
              </VStack>
            ) : (
              <VStack gap={0} align="stretch">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                    onClick={handleNotificationClick}
                  />
                ))}

                {/* Show skeletons while loading more */}
                {isLoading && (
                  <>
                    <NotificationSkeleton />
                    <NotificationSkeleton />
                    <NotificationSkeleton />
                  </>
                )}
              </VStack>
            )}

            {/* Initial loading state when no notifications are present */}
            {isLoading && notifications.length === 0 && (
              <VStack gap={0} align="stretch">
                {[...Array(5)].map((_, i) => (
                  <NotificationSkeleton key={i} />
                ))}
              </VStack>
            )}
          </Box>
        </PopoverBody>
      </PopoverContent>
    </PopoverRoot>
  );
};
