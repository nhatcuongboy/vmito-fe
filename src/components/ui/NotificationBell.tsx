'use client';

import { useEffect, useState } from 'react';
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
  LuCheck,
  LuTrash2,
  LuInbox,
  LuShield,
  LuMail,
  LuCreditCard,
  LuClipboardCheck,
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
import dayjs from '@/lib/dayjs';

type TActiveTab = 'notifications' | 'approval';

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

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TActiveTab>('notifications');
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [isPendingLoading, setIsPendingLoading] = useState(false);
  const [pendingActionLoading, setPendingActionLoading] = useState<
    string | null
  >(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingLoaded, setPendingLoaded] = useState(false);

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
      PlayerService.getPendingRequestsCount()
        .then((count) => setPendingCount(count))
        .catch(() => {});
    }
    if (!open) {
      setActiveTab('notifications');
      setPendingLoaded(false);
    }
  };

  const handleTabChange = (tab: TActiveTab) => {
    setActiveTab(tab);
    if (tab === 'approval' && !pendingLoaded) {
      setIsPendingLoading(true);
      PlayerService.getPendingRequests({ limit: 20 })
        .then((result) => {
          setPendingRequests(result.data);
          setPendingCount(result.data.length);
          setPendingLoaded(true);
        })
        .catch(() => {})
        .finally(() => setIsPendingLoading(false));
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

  const handleApprovalAction = async (
    playerId: string,
    sessionId: string,
    status: 'APPROVED' | 'REJECTED'
  ) => {
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
  const badgeColor = unreadCount > 0 ? 'red.500' : 'orange.500';

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
              bg={badgeColor}
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
          p={4}
          pb={0}
        >
          <Flex justify="space-between" align="center" mb={3}>
            <Heading size="xs" fontSize="md" fontWeight="bold">
              {activeTab === 'notifications'
                ? t('notificationsTab')
                : t('approvalRequestsTab')}
            </Heading>
            {activeTab === 'notifications' && (
              <Button
                size="xs"
                variant="ghost"
                colorPalette="brand"
                onClick={markAllAsRead}
                fontSize="xs"
                h="24px"
                opacity={unreadCount > 0 ? 1 : 0.35}
                disabled={unreadCount === 0}
              >
                <LuCheck size={14} style={{ marginRight: '4px' }} />
                {t('markAllAsRead')}
              </Button>
            )}
          </Flex>

          {/* Tab underline bar */}
          <HStack gap={0}>
            <Box
              as="button"
              onClick={() => handleTabChange('notifications')}
              display="flex"
              alignItems="center"
              gap="6px"
              px={4}
              py={2}
              fontSize="sm"
              fontWeight="medium"
              borderBottom="2px solid"
              borderColor={
                activeTab === 'notifications' ? 'brand.500' : 'transparent'
              }
              color={activeTab === 'notifications' ? 'brand.600' : 'gray.500'}
              _dark={{
                color: activeTab === 'notifications' ? 'brand.300' : 'gray.400',
                borderColor:
                  activeTab === 'notifications' ? 'brand.400' : 'transparent',
              }}
              transition="all 0.15s"
              _hover={{ color: 'brand.600', _dark: { color: 'brand.300' } }}
              cursor="pointer"
              bg="transparent"
              borderWidth="0 0 2px 0"
              outline="none"
            >
              {t('notificationsTab')}
              {unreadCount > 0 && (
                <Badge
                  bg="red.500"
                  color="white"
                  borderRadius="full"
                  fontSize="9px"
                  px="6px"
                  py="1px"
                  lineHeight="normal"
                  minW="18px"
                  textAlign="center"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Box>

            <Box
              as="button"
              onClick={() => handleTabChange('approval')}
              display="flex"
              alignItems="center"
              gap="6px"
              px={4}
              py={2}
              fontSize="sm"
              fontWeight="medium"
              borderBottom="2px solid"
              borderColor={
                activeTab === 'approval' ? 'orange.500' : 'transparent'
              }
              color={activeTab === 'approval' ? 'orange.600' : 'gray.500'}
              _dark={{
                color: activeTab === 'approval' ? 'orange.300' : 'gray.400',
                borderColor:
                  activeTab === 'approval' ? 'orange.400' : 'transparent',
              }}
              transition="all 0.15s"
              _hover={{ color: 'orange.600', _dark: { color: 'orange.300' } }}
              cursor="pointer"
              bg="transparent"
              borderWidth="0 0 2px 0"
              outline="none"
            >
              {t('approvalRequestsTab')}
              {pendingCount > 0 && (
                <Badge
                  bg="orange.500"
                  color="white"
                  borderRadius="full"
                  fontSize="9px"
                  px="6px"
                  py="1px"
                  lineHeight="normal"
                  minW="18px"
                  textAlign="center"
                >
                  {pendingCount > 9 ? '9+' : pendingCount}
                </Badge>
              )}
            </Box>
          </HStack>
        </PopoverHeader>

        <PopoverBody p={0}>
          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Box maxH="440px" overflowY="auto">
              {isLoading && notifications.length === 0 ? (
                <Flex justify="center" align="center" py={12}>
                  <Spinner size="md" color="brand.500" />
                </Flex>
              ) : notifications.length === 0 ? (
                <VStack gap={3} p={10} color="gray.400">
                  <LuInbox size={48} strokeWidth={1} />
                  <Text fontSize="sm" fontWeight="medium">
                    {t('noNotifications')}
                  </Text>
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
                        bg={notification.isRead ? 'transparent' : 'brand.50/30'}
                        _dark={{
                          bg: notification.isRead
                            ? 'transparent'
                            : 'whiteAlpha.50',
                          borderColor: 'gray.800',
                        }}
                        borderBottom="1px solid"
                        borderColor="gray.50"
                        transition="all 0.15s"
                        _hover={{
                          bg: 'gray.50',
                          _dark: { bg: 'whiteAlpha.50' },
                          cursor: 'pointer',
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
                            bg="brand.500"
                            borderRadius="0 2px 2px 0"
                          />
                        )}

                        <HStack gap={3} align="start">
                          <Box
                            mt={0.5}
                            p={2}
                            borderRadius="xl"
                            bg={`${colorScheme}.50`}
                            _dark={{ bg: `${colorScheme}.900/30` }}
                            color={`${colorScheme}.600`}
                            flexShrink={0}
                          >
                            <Icon size={17} />
                          </Box>

                          <VStack align="start" gap={0.5} flex={1} minW={0}>
                            <HStack
                              justify="space-between"
                              w="100%"
                              align="center"
                            >
                              <Text
                                fontSize="sm"
                                fontWeight={
                                  notification.isRead ? 'medium' : 'semibold'
                                }
                                color={
                                  notification.isRead ? 'gray.600' : 'gray.900'
                                }
                                _dark={{
                                  color: notification.isRead
                                    ? 'gray.400'
                                    : 'white',
                                }}
                                lineHeight="short"
                                truncate
                              >
                                {notification.title}
                              </Text>
                              {!notification.isRead && (
                                <Box
                                  w="7px"
                                  h="7px"
                                  bg="brand.500"
                                  borderRadius="full"
                                  flexShrink={0}
                                />
                              )}
                            </HStack>

                            <Text
                              fontSize="xs"
                              color="gray.500"
                              _dark={{ color: 'gray.400' }}
                              lineHeight="normal"
                              lineClamp={2}
                            >
                              {notification.message}
                            </Text>

                            <HStack justify="space-between" w="100%" mt={0.5}>
                              <Text
                                fontSize="10px"
                                fontWeight="medium"
                                color="gray.400"
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
                </Stack>
              )}
            </Box>
          )}

          {/* Approval Requests Tab */}
          {activeTab === 'approval' && (
            <Box maxH="440px" overflowY="auto">
              {isPendingLoading ? (
                <Flex justify="center" align="center" py={12}>
                  <Spinner size="md" color="orange.500" />
                </Flex>
              ) : pendingRequests.length === 0 ? (
                <VStack gap={3} p={10} color="gray.400">
                  <LuClipboardCheck size={48} strokeWidth={1} />
                  <Text fontSize="sm" fontWeight="medium">
                    {t('approvalRequestsEmpty')}
                  </Text>
                </VStack>
              ) : (
                <Stack gap={0}>
                  {pendingRequests.map((request) => (
                    <Box
                      key={request.id}
                      w="100%"
                      p={4}
                      borderBottom="1px solid"
                      borderColor="gray.50"
                      _dark={{ borderColor: 'gray.800' }}
                      transition="background 0.15s"
                      _hover={{ bg: 'gray.50', _dark: { bg: 'whiteAlpha.50' } }}
                    >
                      <HStack gap={3} align="start">
                        <Box
                          mt={0.5}
                          p={2}
                          borderRadius="xl"
                          bg="green.50"
                          _dark={{ bg: 'green.900/30' }}
                          color="green.600"
                          flexShrink={0}
                        >
                          <LuUserCheck size={17} />
                        </Box>

                        <VStack align="start" gap={1} flex={1} minW={0}>
                          <Text
                            fontSize="sm"
                            fontWeight="semibold"
                            color="gray.900"
                            _dark={{ color: 'white' }}
                            truncate
                          >
                            {request.name}
                          </Text>

                          <Text
                            fontSize="xs"
                            color="gray.500"
                            _dark={{ color: 'gray.400' }}
                            truncate
                          >
                            {t('approvalSession')}: {request.session.name} ·{' '}
                            {dayjs(request.session.startTime).format(
                              'MMM D, HH:mm'
                            )}
                          </Text>

                          <HStack gap={1.5} flexWrap="wrap">
                            <Badge
                              colorPalette="purple"
                              size="sm"
                              borderRadius="md"
                              px={2}
                              fontSize="10px"
                            >
                              {t('approvalLevel')} {request.level}
                            </Badge>
                            <Badge
                              size="sm"
                              borderRadius="md"
                              px={2}
                              fontSize="10px"
                            >
                              {t('approvalPlayer')}
                              {request.playerNumber}
                            </Badge>
                          </HStack>

                          <HStack gap={2} mt={1}>
                            <Button
                              size="xs"
                              colorPalette="red"
                              variant="outline"
                              onClick={() =>
                                handleApprovalAction(
                                  request.id,
                                  request.sessionId,
                                  'REJECTED'
                                )
                              }
                              disabled={pendingActionLoading === request.id}
                              h="26px"
                              fontSize="xs"
                            >
                              {t('reject')}
                            </Button>
                            <Button
                              size="xs"
                              colorPalette="green"
                              onClick={() =>
                                handleApprovalAction(
                                  request.id,
                                  request.sessionId,
                                  'APPROVED'
                                )
                              }
                              loading={pendingActionLoading === request.id}
                              h="26px"
                              fontSize="xs"
                            >
                              {t('approve')}
                            </Button>
                          </HStack>
                        </VStack>
                      </HStack>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          )}
        </PopoverBody>
      </PopoverContent>
    </PopoverRoot>
  );
}
