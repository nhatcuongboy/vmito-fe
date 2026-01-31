'use client';

import { useEffect, useRef } from 'react';
import {
    Box,
    Text,
    VStack,
    HStack,
    IconButton,
    Button,
    Spinner,
    Flex,
} from '@chakra-ui/react';
import {
    PopoverRoot,
    PopoverTrigger,
    PopoverContent,
    PopoverHeader,
    PopoverBody,
} from '@/components/ui/popover';
import { LuBell, LuCheckCheck, LuInbox } from 'react-icons/lu';
import { useTranslations } from 'next-intl';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { NotificationItem } from './NotificationItem';
import { INotification } from '@/lib/api/types';
import { useRouter } from '@/i18n/config';
import { useAuthStore } from '@/stores/useAuthStore';

export const NotificationPanel = () => {
    const t = useTranslations('notification');
    const router = useRouter();
    const { user } = useAuthStore();
    const containerRef = useRef<HTMLDivElement>(null);

    const {
        notifications,
        unreadCount,
        isLoading,
        hasMore,
        fetchNotifications,
        fetchUnreadCount,
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
        // Navigate based on notification type and data
        if (notification.data?.sessionId) {
            router.push(`/sessions/${notification.data.sessionId}`);
        }
    };

    if (!user) return null;

    return (
        <PopoverRoot positioning={{ placement: 'bottom-end' }} onOpenChange={(e) => handleOpenChange(e.open)}>
            <PopoverTrigger asChild>
                <Box position="relative">
                    <IconButton
                        aria-label={t('notifications')}
                        variant="ghost"
                        size="sm"
                    >
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
                            <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => markAllAsRead()}
                            >
                                <LuCheckCheck size={14} />
                                {t('markAllAsRead')}
                            </Button>
                        )}
                    </HStack>
                </PopoverHeader>

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
                            </VStack>
                        )}

                        {isLoading && (
                            <Flex justify="center" py={4}>
                                <Spinner size="sm" />
                            </Flex>
                        )}
                    </Box>
                </PopoverBody>
            </PopoverContent>
        </PopoverRoot>
    );
};
