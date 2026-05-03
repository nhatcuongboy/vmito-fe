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
  LuUsers,
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
import { vi, enUS, zhCN } from 'date-fns/locale';
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
  | {
    kind: 'approval';
    data: PendingRequest;
    allSlots: PendingRequest[];
    timestamp: number;
  };

const ACTION_TO_KEYS: Record<string, { titleKey: string; messageKey: string }> =
{
  start_reminder: {
    titleKey: 'messages.startReminderTitle',
    messageKey: 'messages.startReminderMessage',
  },
  player_start_reminder: {
    titleKey: 'messages.playerStartReminderTitle',
    messageKey: 'messages.playerStartReminderMessage',
  },
  auto_started: {
    titleKey: 'messages.autoStartedTitle',
    messageKey: 'messages.autoStartedMessage',
  },
  session_auto_started: {
    titleKey: 'messages.sessionAutoStartedTitle',
    messageKey: 'messages.sessionAutoStartedMessage',
  },
  auto_cancelled: {
    titleKey: 'messages.autoCancelledTitle',
    messageKey: 'messages.autoCancelledMessage',
  },
  session_cancelled: {
    titleKey: 'messages.sessionCancelledTitle',
    messageKey: 'messages.sessionCancelledMessage',
  },
  end_warning: {
    titleKey: 'messages.endWarningTitle',
    messageKey: 'messages.endWarningMessage',
  },
  auto_finalized: {
    titleKey: 'messages.autoFinalizedTitle',
    messageKey: 'messages.autoFinalizedMessage',
  },
  player_added: {
    titleKey: 'messages.playerAddedTitle',
    messageKey: 'messages.playerAddedMessage',
  },
  player_removed: {
    titleKey: 'messages.playerRemovedTitle',
    messageKey: 'messages.playerRemovedMessage',
  },
  club_creation_pending: {
    titleKey: 'messages.clubCreationPendingTitle',
    messageKey: 'messages.clubCreationPendingMessage',
  },
  admin_new_pending_club: {
    titleKey: 'messages.adminNewPendingClubTitle',
    messageKey: 'messages.adminNewPendingClubMessage',
  },
  club_creation_approved: {
    titleKey: 'messages.clubCreationApprovedTitle',
    messageKey: 'messages.clubCreationApprovedMessage',
  },
  club_approved: {
    titleKey: 'messages.clubApprovedTitle',
    messageKey: 'messages.clubApprovedMessage',
  },
  club_rejected: {
    titleKey: 'messages.clubRejectedTitle',
    messageKey: 'messages.clubRejectedMessage',
  },
};

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
    case NotificationType.CLUB:
      return LuUsers;
    default:
      return LuBell;
  }
};

const getNotificationColor = (_type: NotificationType) => 'green';

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
        .catch(() => { });
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
        .catch(() => { })
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

    // Group pending requests by userId+sessionId to show as one item per user per session
    const groups = new Map<string, PendingRequest[]>();
    for (const r of pendingRequests) {
      // Group by createdByUserId (who registered), fallback to userId, then individual id
      const groupKey = r.createdByUserId
        ? `${r.createdByUserId}-${r.sessionId}`
        : r.userId
          ? `${r.userId}-${r.sessionId}`
          : r.id;
      if (!groups.has(groupKey)) groups.set(groupKey, []);
      groups.get(groupKey)!.push(r);
    }
    for (const group of groups.values()) {
      items.push({
        kind: 'approval',
        data: group[0],
        allSlots: group,
        timestamp: new Date(group[0].session.startTime).getTime(),
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

  const handleApprovalClick = (
    request: PendingRequest,
    allSlots: PendingRequest[]
  ) => {
    const ids = allSlots.map((r) => r.id);
    setPendingRequests((prev) => prev.filter((r) => !ids.includes(r.id)));
    setPendingCount((prev) => Math.max(0, prev - ids.length));
    setIsOpen(false);
    router.push(`/host/approval/${request.sessionId}/${request.id}`);
  };

  const handleApprovalAction = async (
    e: React.MouseEvent,
    allSlots: PendingRequest[],
    status: 'APPROVED' | 'REJECTED'
  ) => {
    e.stopPropagation();
    const playerIds = allSlots.map((r) => r.id);
    const representative = allSlots[0];
    try {
      setPendingActionLoading(representative.id);
      await PlayerService.batchUpdateStatus(playerIds, status);
      setPendingRequests((prev) =>
        prev.filter((p) => !playerIds.includes(p.id))
      );
      setPendingCount((prev) => Math.max(0, prev - playerIds.length));
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
        locale: locale === 'vi' ? vi : locale === 'cn' ? zhCN : enUS,
      });
    } catch {
      return '';
    }
  };

  const getNotificationDisplay = (notification: INotification) => {
    const action = notification.data?.action as string | undefined;
    const sessionName = notification.data?.sessionName as string | undefined;
    const clubName = notification.data?.clubName as string | undefined;
    const rejectionReason = notification.data?.rejectionReason as
      | string
      | undefined;
    const keys = action ? ACTION_TO_KEYS[action] : undefined;
    const resourceName = sessionName ?? clubName;
    const translationParams = {
      ...(sessionName ? { sessionName } : {}),
      ...(clubName ? { clubName } : {}),
      ...(rejectionReason ? { rejectionReason } : {}),
    };
    const displayTitle =
      keys && resourceName
        ? (() => {
          try {
            return t(keys.titleKey as Parameters<typeof t>[0]);
          } catch {
            return notification.title;
          }
        })()
        : notification.title;
    const displayMessage =
      keys && resourceName
        ? (() => {
          try {
            return t(
              keys.messageKey as Parameters<typeof t>[0],
              translationParams
            );
          } catch {
            return notification.message;
          }
        })()
        : notification.message;
    return { displayTitle, displayMessage };
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
                    const allSlots = item.allSlots;
                    const slotCount = allSlots.length;
                    return (
                      <Box
                        key={`approval-${request.id}`}
                        onClick={() => handleApprovalClick(request, allSlots)}
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

                            {/* Row 2: session info + slot count */}
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
                              {slotCount > 1 && ` · ${slotCount} slot`}
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
                                  handleApprovalAction(e, allSlots, 'REJECTED')
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
                                  handleApprovalAction(e, allSlots, 'APPROVED')
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
                  const isUnread = !notification.isRead;
                  const { displayTitle, displayMessage } =
                    getNotificationDisplay(notification);

                  return (
                    <Box
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      w="100%"
                      px={4}
                      py={3}
                      bg={isUnread ? 'green.50' : 'transparent'}
                      borderBottom="1px solid"
                      borderColor={isUnread ? 'green.100' : 'gray.50'}
                      _dark={{
                        bg: isUnread ? 'green.900/30' : 'transparent',
                        borderColor: isUnread ? 'green.800/60' : 'gray.800',
                      }}
                      transition="all 0.15s"
                      _hover={{
                        bg: isUnread ? 'green.100' : 'gray.50',
                        _dark: {
                          bg: isUnread
                            ? 'green.900/50'
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
                          width="4px"
                          bg="green.500"
                          borderRadius="0 2px 2px 0"
                        />
                      )}

                      <HStack gap={3} align="start">
                        {/* Type icon */}
                        <Box
                          w="36px"
                          h="36px"
                          borderRadius="xl"
                          bg={isUnread ? 'white' : 'green.50'}
                          _dark={{
                            bg: isUnread ? 'green.800' : 'green.900/30',
                          }}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          color={isUnread ? 'green.600' : 'green.500'}
                          boxShadow={isUnread ? 'sm' : 'none'}
                          flexShrink={0}
                          mt="1px"
                        >
                          <Icon size={17} strokeWidth={isUnread ? 2.5 : 2} />
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
                              fontWeight={isUnread ? 'bold' : 'medium'}
                              color={isUnread ? 'green.900' : 'gray.700'}
                              _dark={{ color: isUnread ? 'white' : 'gray.300' }}
                              lineHeight="short"
                              flex={1}
                              truncate
                            >
                              {displayTitle}
                            </Text>
                            {isUnread && (
                              <Box
                                w="8px"
                                h="8px"
                                bg="green.500"
                                borderRadius="full"
                                flexShrink={0}
                                ml={1.5}
                                boxShadow="0 0 0 2px white"
                                _dark={{
                                  boxShadow:
                                    '0 0 0 2px var(--chakra-colors-gray-900)',
                                }}
                              />
                            )}
                          </HStack>

                          {/* Message */}
                          <Text
                            fontSize="xs"
                            color={isUnread ? 'gray.700' : 'gray.500'}
                            _dark={{
                              color: isUnread ? 'gray.300' : 'gray.500',
                            }}
                            lineHeight="normal"
                            lineClamp={2}
                          >
                            {displayMessage}
                          </Text>

                          {/* Footer: time + delete */}
                          <HStack justify="space-between" w="100%" mt={0.5}>
                            <Text
                              fontSize="10px"
                              fontWeight={isUnread ? 'semibold' : 'medium'}
                              color={isUnread ? 'green.600' : 'gray.500'}
                              _dark={{
                                color: isUnread ? 'green.400' : 'gray.500',
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
