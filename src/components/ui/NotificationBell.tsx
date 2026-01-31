'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Spinner,
  Stack,
  Text,
  SystemStyleObject,
  HStack,
  VStack,
} from '@chakra-ui/react';
import {
  LuBell,
  LuCheck,
  LuTrash2,
  LuInfo,
  LuInbox,
  LuShield,
  LuMail,
  LuCreditCard
} from 'react-icons/lu';
import {
  PopoverRoot,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
} from '@/components/ui/popover';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { NotificationType, INotification } from '@/lib/api/types';
import { formatDistanceToNow } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface NotificationBellProps {
  color?: string;
  _hover?: SystemStyleObject;
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case NotificationType.SYSTEM:
      return LuShield;
    case NotificationType.SESSION:
      return LuBell;
    case NotificationType.REGISTRATION:
      return LuMail;
    case NotificationType.PAYMENT:
      return LuCreditCard;
    default:
      return LuBell;
  }
};

const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case NotificationType.SYSTEM:
      return 'purple';
    case NotificationType.SESSION:
      return 'blue';
    case NotificationType.REGISTRATION:
      return 'green';
    case NotificationType.PAYMENT:
      return 'orange';
    default:
      return 'gray';
  }
};

export default function NotificationBell({
  color,
  _hover,
}: NotificationBellProps) {
  const { user } = useAuthStore();
  const params = useParams();
  const t = useTranslations('notification');
  const locale = (params.locale as string) || 'en';
  const [isOpen, setIsOpen] = useState(false);

  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationStore();

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user, fetchUnreadCount]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && user) {
      fetchNotifications(true);
      fetchUnreadCount();
    }
  };

  const handleNotificationClick = (notification: INotification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  const handleDeleteNotification = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteNotification(id);
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: locale === 'vi' ? vi : enUS,
      });
    } catch (e) {
      return '';
    }
  };

  if (!user) return null;

  return (
    <PopoverRoot
      positioning={{ placement: 'bottom-end', offset: { mainAxis: 10 } }}
      open={isOpen}
      onOpenChange={(e) => handleOpenChange(e.open)}
    >
      <PopoverTrigger asChild>
        <Box position="relative" display="inline-block" cursor="pointer">
          <IconButton
            aria-label="Notifications"
            variant="ghost"
            size="md"
            borderRadius="full"
            color={color}
            _hover={_hover || { bg: 'blackAlpha.50', _dark: { bg: 'whiteAlpha.100' } }}
          >
            <LuBell size={22} />
          </IconButton>

          {unreadCount > 0 && (
            <Box
              position="absolute"
              top="5px"
              right="5px"
              minW="18px"
              h="18px"
              bg="red.500"
              color="white"
              borderRadius="full"
              border="2px solid white"
              _dark={{ borderColor: 'gray.900' }}
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="9px"
              fontWeight="bold"
              px={1}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Box>
          )}
        </Box>
      </PopoverTrigger>

      <PopoverContent
        width="400px"
        maxW="95vw"
        boxShadow="0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
        borderRadius="xl"
        bg="white"
        _dark={{ bg: 'gray.900', borderColor: 'gray.800' }}
        p={0}
      >
        <PopoverHeader borderBottomWidth="1px" borderColor="gray.100" _dark={{ borderColor: 'gray.800' }} p={4}>
          <Flex justify="space-between" align="center">
            <Heading size="xs" fontSize="md" fontWeight="bold">
              {t('notifications')}
            </Heading>
            {unreadCount > 0 && (
              <Button
                size="xs"
                variant="ghost"
                colorPalette="blue"
                onClick={markAllAsRead}
                fontSize="xs"
                h="24px"
              >
                <LuCheck size={14} style={{ marginRight: '4px' }} />
                {t('markAllAsRead')}
              </Button>
            )}
          </Flex>
        </PopoverHeader>

        <PopoverBody p={0}>
          <Box maxH="400px" overflowY="auto">
            {isLoading && notifications.length === 0 ? (
              <Flex justify="center" align="center" py={12}>
                <Spinner size="md" color="blue.500" />
              </Flex>
            ) : notifications.length === 0 ? (
              <VStack gap={3} p={10} color="gray.400">
                <LuInbox size={48} strokeWidth={1} />
                <Text fontSize="sm" fontWeight="medium">{t('noNotifications')}</Text>
              </VStack>
            ) : (
              <Stack gap={0}>
                {notifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type);
                  const colorScheme = getNotificationColor(notification.type);

                  return (
                    <Box
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      w="100%"
                      p={4}
                      bg={notification.isRead ? 'transparent' : 'blue.50/30'}
                      _dark={{
                        bg: notification.isRead
                          ? 'transparent'
                          : 'whiteAlpha.50',
                      }}
                      borderBottom="1px solid"
                      borderColor="gray.50"
                      // _dark={{ borderColor: 'gray.800' }}
                      transition="all 0.1s"
                      _hover={{
                        bg: 'gray.50',
                        _dark: { bg: 'whiteAlpha.50' },
                        cursor: 'pointer'
                      }}
                      position="relative"
                      role="group"
                    >
                      {!notification.isRead && (
                        <Box
                          position="absolute"
                          left={0}
                          top={0}
                          bottom={0}
                          width="3px"
                          bg="blue.500"
                        />
                      )}

                      <HStack gap={4} align="start">
                        <Box
                          mt={1}
                          p={2}
                          borderRadius="lg"
                          bg={`${colorScheme}.50`}
                          _dark={{ bg: `${colorScheme}.900/20` }}
                          color={`${colorScheme}.500`}
                          flexShrink={0}
                        >
                          <Icon size={18} />
                        </Box>

                        <VStack align="start" gap={0.5} flex={1}>
                          <HStack justify="space-between" w="100%" align="center">
                            <Text
                              fontSize="sm"
                              fontWeight={notification.isRead ? 'medium' : 'bold'}
                              color={notification.isRead ? 'gray.600' : 'gray.900'}
                              _dark={{ color: notification.isRead ? 'gray.400' : 'white' }}
                              lineHeight="short"
                            >
                              {notification.title}
                            </Text>
                            {!notification.isRead && (
                              <Box
                                w="8px"
                                h="8px"
                                bg="blue.500"
                                borderRadius="full"
                                boxShadow="0 0 0 2px white"
                                _dark={{ boxShadow: '0 0 0 2px var(--chakra-colors-gray-900)' }}
                              />
                            )}
                          </HStack>

                          <Text
                            fontSize="xs"
                            color="gray.600"
                            _dark={{ color: 'gray.400' }}
                            lineHeight="normal"
                            lineClamp={2}
                          >
                            {notification.message}
                          </Text>

                          <HStack justify="space-between" w="100%" mt={1}>
                            <Text fontSize="10px" fontWeight="medium" color="gray.400">
                              {formatTimeAgo(notification.createdAt)}
                            </Text>

                            <IconButton
                              aria-label="Delete"
                              size="xs"
                              variant="ghost"
                              colorPalette="red"
                              opacity={0}
                              _groupHover={{ opacity: 1 }}
                              onClick={(e) => handleDeleteNotification(e, notification.id)}
                              h="24px"
                              w="24px"
                              borderRadius="md"
                            >
                              <LuTrash2 size={13} />
                            </IconButton>
                          </HStack>
                        </VStack>
                      </HStack>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Box>
        </PopoverBody>
      </PopoverContent>
    </PopoverRoot>
  );
}
