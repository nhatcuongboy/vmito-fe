'use client';

import { Box, Text, HStack, IconButton, Badge } from '@chakra-ui/react';
import {
  LuCheck,
  LuTrash2,
  LuBell,
  LuMail,
  LuShield,
  LuCreditCard,
} from 'react-icons/lu';
import { INotification, NotificationType } from '@/lib/api/types';
import { useTranslations } from 'next-intl';
import { formatDistanceToNow } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { useParams } from 'next/navigation';

interface INotificationItemProps {
  notification: INotification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick?: (notification: INotification) => void;
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

export const NotificationItem = ({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
}: INotificationItemProps) => {
  const t = useTranslations('notification');
  const params = useParams();
  const locale = (params.locale as string) || 'en';

  const Icon = getNotificationIcon(notification.type);
  const colorScheme = getNotificationColor(notification.type);

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: locale === 'vi' ? vi : enUS,
  });

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    onClick?.(notification);
  };

  return (
    <Box
      p={3}
      borderRadius="md"
      bg={notification.isRead ? 'transparent' : 'blue.50'}
      _dark={{
        bg: notification.isRead ? 'transparent' : 'blue.900/20',
      }}
      _hover={{ bg: 'gray.100', _dark: { bg: 'gray.700' } }}
      cursor="pointer"
      onClick={handleClick}
      transition="background 0.2s"
    >
      <HStack align="flex-start" gap={3}>
        <Box
          p={2}
          borderRadius="full"
          bg={`${colorScheme}.100`}
          _dark={{ bg: `${colorScheme}.900/30` }}
          color={`${colorScheme}.600`}
          // _darkColor={`${colorScheme}.300`}
        >
          <Icon size={18} />
        </Box>

        <Box flex={1} minW={0}>
          <HStack justify="space-between" mb={1}>
            <Text
              fontWeight={notification.isRead ? 'normal' : 'semibold'}
              fontSize="sm"
              lineClamp={1}
            >
              {notification.title}
            </Text>
            {!notification.isRead && (
              <Badge colorPalette="green" size="xs">
                {t('new')}
              </Badge>
            )}
          </HStack>

          <Text
            fontSize="sm"
            color="gray.600"
            _dark={{ color: 'gray.400' }}
            lineClamp={2}
          >
            {notification.message}
          </Text>

          <Text fontSize="xs" color="gray.500" mt={1}>
            {timeAgo}
          </Text>
        </Box>

        <HStack gap={1} onClick={(e) => e.stopPropagation()}>
          {!notification.isRead && (
            <IconButton
              aria-label={t('markAsRead')}
              size="xs"
              variant="ghost"
              onClick={() => onMarkAsRead(notification.id)}
            >
              <LuCheck size={14} />
            </IconButton>
          )}
          <IconButton
            aria-label={t('delete')}
            size="xs"
            variant="ghost"
            colorPalette="red"
            onClick={() => onDelete(notification.id)}
          >
            <LuTrash2 size={14} />
          </IconButton>
        </HStack>
      </HStack>
    </Box>
  );
};
