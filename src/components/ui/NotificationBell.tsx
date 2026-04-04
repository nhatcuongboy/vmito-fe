'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Flex,
  Heading,
  IconButton,
  Spinner,
  Stack,
  Text,
  SystemStyleObject,
  HStack,
  VStack,
  Badge,
} from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import {
  LuBell,
  LuCheckCheck,
  LuTrash2,
  LuInbox,
  LuShield,
  LuMail,
  LuCreditCard,
  LuUserCheck,
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
import {
  NotificationType,
  INotification,
  PendingRequest,
} from '@/lib/api/types';
import { PlayerService } from '@/lib/api/player.service';
import { formatDistanceToNow } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toaster } from '@/components/ui/toaster';
import { useRouter } from '@/i18n/config';
import dayjs from '@/lib/dayjs';

interface NotificationBellProps {
  color?: string;
  _hover?: SystemStyleObject;
}

type TUnifiedItem =
  | { kind: 'notification'; data: INotification; timestamp: number }
  | { kind: 'approval'; data: PendingRequest; timestamp: number };

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
      return 'brand';
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
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [isPendingLoading, setIsPendingLoading] = useState(false);
  const [pendingActionLoading, setPendingActionLoading] = useState<
    string | null
  >(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

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
      PlayerService.getPendingRequestsCount()
        .then((count) => setPendingCount(count))
        .catch(() => {});
    }
  }, [user, fetchUnreadCount]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && user) {
      fetchNotifications(true);
      fetchUnreadCount();
      setIsPendingLoading(true);
      PlayerService.getPendingRequests({ limit: 20 })
        .then((result) => {
          setPendingRequests(result.data);
          setPendingCount(result.data.length);
        })
        .catch(() => {})
        .finally(() => setIsPendingLoading(false));
    }
  };

  // Merge notifications + pending requests into a single chronological list
  const unifiedItems = useMemo<TUnifiedItem[]>(() => {
    const items: TUnifiedItem[] = [];

    for (const n of notifications) {
      items.push({
        kind: 'notification',
        data: n,
        timestamp: new Date(n.createdAt).getTime(),
      });
    }

    for (const r of pendingRequests) {
      // Use session startTime as timestamp for pending requests
      items.push({
        kind: 'approval',
        data: r,
        timestamp: new Date(r.session.startTime).getTime(),
      });
    }

    // Sort by timestamp descending (newest first)
    items.sort((a, b) => b.timestamp - a.timestamp);
    return items;
  }, [notifications, pendingRequests]);

  const handleNotificationClick = (notification: INotification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  const handleDeleteNotification = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteNotification(id);
  };

  const handleMarkAllAsRead = async () => {
    try {
      setIsMarkingAll(true);
      await markAllAsRead();
    } catch {
      toaster.error({ title: t('approvalActionFailed') });
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleApprovalClick = (request: PendingRequest) => {
    // Remove from local list immediately so badge count drops
    setPendingRequests((prev) => prev.filter((r) => r.id !== request.id));
    setPendingCount((prev) => Math.max(0, prev - 1));
    setIsOpen(false);
    router.push(`/host/approval/${request.sessionId}/${request.id}`);
  };

  const handleApprovalAction = async (
    e: React.MouseEvent,
    playerId: string,
    sessionId: string,
    status: 'APPROVED' | 'REJECTED'
  ) => {
    e.stopPropagation();
    try {
      setPendingActionLoading(playerId);
      await PlayerService.updatePlayerStatus(sessionId, playerId, status);
      setPendingRequests((prev) => prev.filter((p) => p.id !== playerId));
      setPendingCount((prev) => Math.max(0, prev - 1));
      toaster.success({
        title: status === 'APPROVED' ? t('approveSuccess') : t('rejectSuccess'),
      });
    } catch {
      toaster.error({ title: t('approvalActionFailed') });
    } finally {
      setPendingActionLoading(null);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: locale === 'vi' ? vi : enUS,
      });
    } catch {
      return '';
    }
  };

  if (!user) return null;

  const totalBadgeCount = unreadCount + pendingCount;
  const isEmpty =
    notifications.length === 0 &&
    pendingRequests.length === 0 &&
    !isPendingLoading &&
    !isLoading;

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
            _hover={
              _hover || { bg: 'blackAlpha.50', _dark: { bg: 'whiteAlpha.100' } }
            }
          >
            <LuBell size={22} />
          </IconButton>

          {totalBadgeCount > 0 && (
            <Box
              position="absolute"
              top="-4px"
              right="-4px"
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
              pointerEvents="none"
            >
              {totalBadgeCount > 9 ? '9+' : totalBadgeCount}
            </Box>
          )}
        </Box>
      </PopoverTrigger>

      <PopoverContent
        width="420px"
        maxW="95vw"
        boxShadow="0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)"
        borderRadius="2xl"
        bg="white"
        _dark={{ bg: 'gray.900', borderColor: 'gray.800' }}
        p={0}
        overflow="hidden"
      >
        {/* Header */}
        <PopoverHeader
          borderBottomWidth="1px"
          borderColor="gray.100"
          _dark={{ borderColor: 'gray.800' }}
          px={4}
          py={3}
        >
          <Flex justify="space-between" align="center">
            <HStack gap={2}>
              <Heading size="xs" fontSize="md" fontWeight="bold">
                {t('notifications')}
              </Heading>
              {unreadCount > 0 && (
                <Badge
                  bg="red.500"
                  color="white"
                  borderRadius="full"
                  fontSize="10px"
                  px="7px"
                  py="1px"
                  lineHeight="normal"
                  title={t('unreadNotifications')}
                >
                  {unreadCount}
                </Badge>
              )}
              {pendingCount > 0 && (
                <Badge
                  bg="orange.400"
                  color="white"
                  borderRadius="full"
                  fontSize="10px"
                  px="7px"
                  py="1px"
                  lineHeight="normal"
                  title={t('approvalRequestsTab')}
                >
                  {pendingCount}
                </Badge>
              )}
            </HStack>
            <Button
              size="xs"
              variant="ghost"
              colorPalette="brand"
              onClick={handleMarkAllAsRead}
              loading={isMarkingAll}
              fontSize="xs"
              h="24px"
              opacity={unreadCount > 0 ? 1 : 0.35}
              disabled={unreadCount === 0 || isMarkingAll}
            >
              <LuCheckCheck size={14} style={{ marginRight: '4px' }} />
              {t('markAllAsRead')}
            </Button>
          </Flex>
        </PopoverHeader>

        <PopoverBody p={0}>
          <Box maxH="500px" overflowY="auto">
            {(isLoading || isPendingLoading) && unifiedItems.length === 0 ? (
              <Flex justify="center" align="center" py={12}>
                <Spinner size="md" color="brand.500" />
              </Flex>
            ) : isEmpty ? (
              <VStack gap={3} p={10} color="gray.400">
                <LuInbox size={48} strokeWidth={1} />
                <Text fontSize="sm" fontWeight="medium">
                  {t('noNotifications')}
                </Text>
              </VStack>
            ) : (
              <Stack gap={0}>
                {unifiedItems.map((item) => {
                  if (item.kind === 'approval') {
                    const request = item.data;
                    return (
                      <Box
                        key={`approval-${request.id}`}
                        onClick={() => handleApprovalClick(request)}
                        w="100%"
                        px={4}
                        py={3}
                        bg="orange.50/40"
                        borderBottom="1px solid"
                        borderColor="orange.100"
                        _dark={{
                          bg: 'rgba(251,146,60,0.07)',
                          borderColor: 'rgba(251,146,60,0.15)',
                        }}
                        transition="all 0.15s"
                        _hover={{
                          bg: 'orange.50',
                          _dark: { bg: 'rgba(251,146,60,0.12)' },
                          cursor: 'pointer',
                        }}
                        position="relative"
                      >
                        {/* Orange left accent */}
                        <Box
                          position="absolute"
                          left={0}
                          top={0}
                          bottom={0}
                          width="3px"
                          bg="orange.400"
                          borderRadius="0 2px 2px 0"
                        />

                        <HStack gap={3} align="start">
                          {/* Icon */}
                          <Box
                            w="36px"
                            h="36px"
                            borderRadius="xl"
                            bg="orange.100"
                            _dark={{ bg: 'rgba(251,146,60,0.25)' }}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            color="orange.500"
                            flexShrink={0}
                            mt="1px"
                          >
                            <LuUserCheck size={17} />
                          </Box>

                          {/* Content — same 3-row structure as regular notifications */}
                          <VStack align="start" gap={0.5} flex={1} minW={0}>
                            {/* Row 1: name + badge */}
                            <HStack gap={1.5} w="100%" align="center">
                              <Text
                                fontSize="sm"
                                fontWeight="semibold"
                                color="gray.900"
                                _dark={{ color: 'white' }}
                                lineHeight="short"
                                flex={1}
                                truncate
                              >
                                {request.name}
                              </Text>
                              <Badge
                                bg="orange.400"
                                color="white"
                                size="xs"
                                borderRadius="md"
                                px={1.5}
                                fontSize="9px"
                                flexShrink={0}
                                lineHeight="normal"
                                py="1px"
                              >
                                {t('approvalPending')}
                              </Badge>
                            </HStack>

                            {/* Row 2: session info */}
                            <Text
                              fontSize="xs"
                              color="gray.500"
                              _dark={{ color: 'gray.400' }}
                              lineHeight="normal"
                              truncate
                              w="100%"
                            >
                              {request.session.name} · Lv.{request.level} ·{' '}
                              {dayjs(request.session.startTime).format(
                                'DD/MM, HH:mm'
                              )}
                            </Text>

                            {/* Row 3: action buttons */}
                            <HStack
                              gap={1.5}
                              mt={0.5}
                              w="100%"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                size="xs"
                                colorPalette="red"
                                variant="outline"
                                onClick={(e) =>
                                  handleApprovalAction(
                                    e,
                                    request.id,
                                    request.sessionId,
                                    'REJECTED'
                                  )
                                }
                                disabled={pendingActionLoading === request.id}
                                h="24px"
                                fontSize="xs"
                                px={3}
                              >
                                {t('reject')}
                              </Button>
                              <Button
                                size="xs"
                                colorPalette="green"
                                onClick={(e) =>
                                  handleApprovalAction(
                                    e,
                                    request.id,
                                    request.sessionId,
                                    'APPROVED'
                                  )
                                }
                                loading={pendingActionLoading === request.id}
                                h="24px"
                                fontSize="xs"
                                px={3}
                              >
                                {t('approve')}
                              </Button>
                            </HStack>
                          </VStack>
                        </HStack>
                      </Box>
                    );
                  }

                  // Regular notification
                  const notification = item.data;
                  const Icon = getNotificationIcon(notification.type);
                  const colorScheme = getNotificationColor(notification.type);
                  const isUnread = !notification.isRead;

                  return (
                    <Box
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      w="100%"
                      px={4}
                      py={3}
                      bg={isUnread ? `${colorScheme}.50/60` : 'transparent'}
                      borderBottom="1px solid"
                      borderColor={
                        isUnread ? `${colorScheme}.100/60` : 'gray.50'
                      }
                      _dark={{
                        bg: isUnread ? `${colorScheme}.900/15` : 'transparent',
                        borderColor: isUnread
                          ? `${colorScheme}.800/40`
                          : 'gray.800',
                      }}
                      transition="all 0.15s"
                      _hover={{
                        bg: isUnread ? `${colorScheme}.50` : 'gray.50',
                        _dark: {
                          bg: isUnread
                            ? `${colorScheme}.900/20`
                            : 'rgba(255,255,255,0.05)',
                        },
                        cursor: 'pointer',
                      }}
                      position="relative"
                      role="group"
                    >
                      {/* Unread left accent */}
                      {isUnread && (
                        <Box
                          position="absolute"
                          left={0}
                          top={0}
                          bottom={0}
                          width="3px"
                          bg={`${colorScheme}.500`}
                          borderRadius="0 2px 2px 0"
                        />
                      )}

                      <HStack gap={3} align="start">
                        {/* Type icon */}
                        <Box
                          w="36px"
                          h="36px"
                          borderRadius="xl"
                          bg={
                            isUnread
                              ? `${colorScheme}.100`
                              : `${colorScheme}.50`
                          }
                          _dark={{
                            bg: isUnread
                              ? `${colorScheme}.800/50`
                              : `${colorScheme}.900/20`,
                          }}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          color={
                            isUnread
                              ? `${colorScheme}.600`
                              : `${colorScheme}.400`
                          }
                          flexShrink={0}
                          mt="1px"
                        >
                          <Icon size={17} />
                        </Box>

                        <VStack align="start" gap={0.5} flex={1} minW={0}>
                          {/* Title row */}
                          <HStack
                            justify="space-between"
                            w="100%"
                            align="center"
                          >
                            <Text
                              fontSize="sm"
                              fontWeight={isUnread ? 'semibold' : 'medium'}
                              color={isUnread ? 'gray.900' : 'gray.700'}
                              _dark={{
                                color: isUnread ? 'white' : 'gray.200',
                              }}
                              lineHeight="short"
                              flex={1}
                              truncate
                            >
                              {notification.title}
                            </Text>
                            {isUnread && (
                              <Box
                                w="7px"
                                h="7px"
                                bg={`${colorScheme}.500`}
                                borderRadius="full"
                                flexShrink={0}
                                ml={1.5}
                              />
                            )}
                          </HStack>

                          {/* Message */}
                          <Text
                            fontSize="xs"
                            color={isUnread ? 'gray.600' : 'gray.500'}
                            _dark={{
                              color: isUnread ? 'gray.300' : 'gray.400',
                            }}
                            lineHeight="normal"
                            lineClamp={2}
                          >
                            {notification.message}
                          </Text>

                          {/* Footer: time + delete */}
                          <HStack justify="space-between" w="100%" mt={0.5}>
                            <Text
                              fontSize="10px"
                              fontWeight="medium"
                              color={
                                isUnread ? `${colorScheme}.500` : 'gray.500'
                              }
                              _dark={{
                                color: isUnread
                                  ? `${colorScheme}.400`
                                  : 'gray.400',
                              }}
                            >
                              {formatTimeAgo(notification.createdAt)}
                            </Text>

                            <IconButton
                              aria-label="Delete"
                              size="xs"
                              variant="ghost"
                              colorPalette="red"
                              opacity={0}
                              _groupHover={{ opacity: 1 }}
                              onClick={(e) =>
                                handleDeleteNotification(e, notification.id)
                              }
                              h="22px"
                              w="22px"
                              borderRadius="md"
                            >
                              <LuTrash2 size={12} />
                            </IconButton>
                          </HStack>
                        </VStack>
                      </HStack>
                    </Box>
                  );
                })}

                {isLoading && (
                  <Flex justify="center" py={4}>
                    <Spinner size="sm" color="brand.500" />
                  </Flex>
                )}
              </Stack>
            )}
          </Box>
        </PopoverBody>
      </PopoverContent>
    </PopoverRoot>
  );
}
