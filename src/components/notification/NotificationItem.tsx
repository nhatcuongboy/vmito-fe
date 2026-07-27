'use client';

import { Box, Text, HStack, Badge } from '@chakra-ui/react';
import { Button, IconButton } from '@/components/ui/chakra-compat';
import {
  LuCheck,
  LuTrash2,
  LuBell,
  LuMail,
  LuShield,
  LuCreditCard,
  LuExternalLink,
  LuUsers,
  LuHeart,
  LuMessageCircle,
  LuMapPin,
} from 'react-icons/lu';
import { INotification, NotificationType } from '@/lib/api/types';
import { useTranslations } from 'next-intl';
import { formatDistanceToNow } from 'date-fns';
import { vi, enUS, zhCN } from 'date-fns/locale';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/config';
import { getNotificationDisplayText } from '@/lib/notifications/content';

interface INotificationItemProps {
  notification: INotification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick?: (notification: INotification) => void;
}

const VIEW_SESSION_ACTIONS = new Set([
  'start_reminder',
  'player_start_reminder',
  'auto_started',
  'session_auto_started',
]);

const VIEW_CLUB_ACTIONS = new Set([
  'club_creation_pending',
  'admin_new_pending_club',
  'club_creation_approved',
  'club_approved',
  'club_rejected',
]);

const getNotificationIcon = (type: NotificationType, action?: string) => {
  if (action?.endsWith('_favorited')) return LuHeart;

  switch (type) {
    case NotificationType.SYSTEM:
      return LuShield;
    case NotificationType.SESSION:
      return LuBell;
    case NotificationType.REGISTRATION:
      return LuMail;
    case NotificationType.PAYMENT:
      return LuCreditCard;
    case NotificationType.CLUB:
      return LuUsers;
    case NotificationType.TOURNAMENT:
      return LuHeart;
    case NotificationType.POST:
      return action === 'post_commented' ? LuMessageCircle : LuHeart;
    case NotificationType.VENUE_REQUEST:
    case NotificationType.VENUE_RENTAL:
      return LuMapPin;
    default:
      return LuBell;
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
  const router = useRouter();
  const locale = (params.locale as string) || 'en';

  const Icon = getNotificationIcon(
    notification.type,
    typeof notification.data?.action === 'string'
      ? notification.data.action
      : undefined
  );

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: locale === 'vi' ? vi : locale === 'cn' ? zhCN : enUS,
  });

  const action = notification.data?.action as string | undefined;
  const sessionId = notification.data?.sessionId as string | undefined;
  const clubSlug = notification.data?.clubSlug as string | undefined;
  const { displayTitle, displayMessage } = getNotificationDisplayText(
    notification,
    (key, values) => t(key as Parameters<typeof t>[0], values)
  );

  const showViewSession =
    action && VIEW_SESSION_ACTIONS.has(action) && !!sessionId;

  const showViewClub = action && VIEW_CLUB_ACTIONS.has(action) && !!clubSlug;

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    onClick?.(notification);
  };

  const handleViewSession = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    router.push(`/sessions/${sessionId}`);
  };

  const handleViewClub = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    router.push(`/browse/clubs/${clubSlug}`);
  };

  return (
    <Box
      p={3}
      borderRadius="md"
      bg={notification.isRead ? 'transparent' : 'green.50'}
      _dark={{
        bg: notification.isRead ? 'transparent' : 'green.900/30',
      }}
      transition="all 0.15s"
      _hover={{
        bg: notification.isRead ? 'gray.50' : 'green.100',
        _dark: {
          bg: notification.isRead ? 'gray.800' : 'green.900/50',
        },
      }}
      cursor="pointer"
      onClick={handleClick}
    >
      <HStack gap={3} align="start" position="relative">
        {/* Unread left accent */}
        {!notification.isRead && (
          <Box
            position="absolute"
            left={-3}
            top={-3}
            bottom={-3}
            width="4px"
            bg="green.500"
            borderRadius="0 2px 2px 0"
          />
        )}

        <Box
          w="36px"
          h="36px"
          borderRadius="xl"
          bg={!notification.isRead ? 'white' : 'green.50'}
          _dark={{
            bg: !notification.isRead ? 'green.800' : 'green.900/30',
            borderColor: !notification.isRead ? 'green.600' : 'green.800',
          }}
          display="flex"
          alignItems="center"
          justifyContent="center"
          color={!notification.isRead ? 'green.600' : 'green.500'}
          boxShadow={!notification.isRead ? 'sm' : 'none'}
          flexShrink={0}
          mt="1px"
          borderWidth="1px"
          borderColor={!notification.isRead ? 'green.100' : 'green.100'}
        >
          <Icon size={17} strokeWidth={!notification.isRead ? 2.5 : 2} />
        </Box>

        <Box flex={1} minW={0}>
          <HStack justify="space-between" mb={1}>
            <Text
              fontWeight={notification.isRead ? 'medium' : 'bold'}
              color={notification.isRead ? 'gray.700' : 'green.900'}
              _dark={{ color: notification.isRead ? 'gray.300' : 'white' }}
              fontSize="sm"
              lineClamp={1}
            >
              {displayTitle}
            </Text>
            {!notification.isRead && (
              <Badge colorPalette="green" size="xs">
                {t('new')}
              </Badge>
            )}
          </HStack>

          <Text
            fontSize="sm"
            color={notification.isRead ? 'gray.500' : 'gray.700'}
            _dark={{ color: notification.isRead ? 'gray.500' : 'gray.300' }}
            lineClamp={2}
          >
            {displayMessage}
          </Text>

          {showViewSession && (
            <Button
              size="xs"
              variant="ghost"
              colorPalette="green"
              mt={1}
              onClick={handleViewSession}
            >
              <LuExternalLink size={12} />
              {t('messages.viewSession')}
            </Button>
          )}

          {showViewClub && (
            <Button
              size="xs"
              variant="ghost"
              colorPalette="green"
              mt={1}
              onClick={handleViewClub}
            >
              <LuExternalLink size={12} />
              {t('messages.viewClub')}
            </Button>
          )}

          <Text
            fontSize="xs"
            fontWeight={notification.isRead ? 'medium' : 'semibold'}
            color={notification.isRead ? 'gray.500' : 'green.600'}
            _dark={{ color: notification.isRead ? 'gray.500' : 'green.400' }}
            mt={1}
          >
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
