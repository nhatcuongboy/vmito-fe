'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Badge,
  Box,
  Card,
  Container,
  Field,
  Flex,
  Heading,
  HStack,
  IconButton,
  Separator,
  Spinner,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { Bell, Eye, Inbox, Send, Trash2, UserRound, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/chakra-compat';
import { FilterChip } from '@/components/ui/FilterChip';
import { FilterDrawer } from '@/components/ui/FilterDrawer';
import { Input } from '@/components/ui/Input';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import {
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  VTablePagination,
} from '@/components/ui/VTable';
import VModal from '@/components/ui/VModal';
import { toaster } from '@/components/ui/toaster';
import { useRouter } from '@/i18n/config';
import {
  IAdminNotification,
  NotificationType,
  UserRole,
} from '@/lib/api/types';
import { NotificationService } from '@/lib/api/notification.service';
import { useAuthStore } from '@/stores/useAuthStore';
import { stringField, useUrlFilters } from '@/hooks/useUrlFilters';
import { useDisclosure } from '@/components/ui/ChakraHooks';

const PAGE_SIZE = 20;

const NOTIFICATION_FILTERS_SCHEMA = {
  q: stringField(''),
  type: stringField(''),
  isRead: stringField(''),
  userId: stringField(''),
  dateFrom: stringField(''),
  dateTo: stringField(''),
};

const broadcastSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(1000, 'Message must be less than 1000 characters'),
});

type TBroadcastFormData = z.infer<typeof broadcastSchema>;

export default function AdminNotificationsPage() {
  return (
    <Suspense>
      <AdminNotificationsContent />
    </Suspense>
  );
}

function AdminNotificationsContent() {
  const t = useTranslations('admin');
  const tc = useTranslations('common');
  const tn = useTranslations('notification');
  const router = useRouter();
  const { isAuthenticated, isHydrated, user: currentUser } = useAuthStore();

  const [filters, setFilters] = useUrlFilters(NOTIFICATION_FILTERS_SCHEMA);
  const [keyword, setKeyword] = useState(filters.q);
  const [page, setPage] = useState(1);
  const [notifications, setNotifications] = useState<IAdminNotification[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<IAdminNotification | null>(null);
  const [notificationToDelete, setNotificationToDelete] =
    useState<IAdminNotification | null>(null);

  const { isOpen: showFilters, onToggle: toggleFilters } = useDisclosure(false);
  const [pendingType, setPendingType] = useState('');
  const [pendingIsRead, setPendingIsRead] = useState('');
  const [pendingUserId, setPendingUserId] = useState('');
  const [pendingDateFrom, setPendingDateFrom] = useState('');
  const [pendingDateTo, setPendingDateTo] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<TBroadcastFormData>({
    resolver: zodResolver(broadcastSchema),
    defaultValues: { title: '', message: '' },
  });

  const watchedTitle = watch('title');
  const watchedMessage = watch('message');

  useEffect(() => {
    setKeyword(filters.q);
  }, [filters.q]);

  useEffect(() => {
    if (showFilters) {
      setPendingType(filters.type);
      setPendingIsRead(filters.isRead);
      setPendingUserId(filters.userId);
      setPendingDateFrom(filters.dateFrom);
      setPendingDateTo(filters.dateTo);
    }
  }, [filters, showFilters]);

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await NotificationService.getAdminNotifications({
        q: filters.q || undefined,
        type: filters.type ? (filters.type as NotificationType) : undefined,
        isRead: filters.isRead || undefined,
        userId: filters.userId || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        page,
        limit: PAGE_SIZE,
      });

      setNotifications(result.data);
      setTotalCount(result.pagination.total);
      setTotalPages(Math.max(1, result.pagination.totalPages));
    } catch (error) {
      console.error('Failed to fetch admin notifications:', error);
      toaster.error({ title: 'Failed to load notifications' });
    } finally {
      setIsLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      router.replace('/auth/signin');
      return;
    }
    if (!currentUser) return;
    if (currentUser.role !== UserRole.ADMIN) {
      toaster.error({ title: t('accessDenied') });
      router.replace('/dashboard');
      return;
    }
    fetchNotifications();
  }, [isHydrated, isAuthenticated, currentUser, router, t, fetchNotifications]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setFilters({ q: keyword });
    }, 500);
    return () => clearTimeout(timer);
  }, [keyword, setFilters]);

  const activeFilterCount = [
    filters.type,
    filters.isRead,
    filters.userId,
    filters.dateFrom,
    filters.dateTo,
  ].filter(Boolean).length;

  const handleSubmitFilters = () => {
    setPage(1);
    setFilters({
      type: pendingType,
      isRead: pendingIsRead,
      userId: pendingUserId.trim(),
      dateFrom: pendingDateFrom,
      dateTo: pendingDateTo,
    });
    toggleFilters();
  };

  const handleResetFilters = () => {
    setPendingType('');
    setPendingIsRead('');
    setPendingUserId('');
    setPendingDateFrom('');
    setPendingDateTo('');
  };

  const onBroadcastSubmit = async (data: TBroadcastFormData) => {
    try {
      setIsSubmitting(true);
      const result = await NotificationService.broadcastNotification(data);
      toaster.success({
        title: tn('broadcastSuccess'),
        description: `${result.count} ${tn('usersNotified')}`,
      });
      reset();
      setPage(1);
      await fetchNotifications();
    } catch (error) {
      console.error('Failed to broadcast notification:', error);
      toaster.error({ title: tc('error'), description: tn('broadcastError') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNotification = async () => {
    if (!notificationToDelete) return;

    try {
      setIsDeleting(true);
      await NotificationService.deleteAdminNotification(
        notificationToDelete.id
      );
      toaster.success({ title: 'Notification deleted' });
      setNotificationToDelete(null);
      await fetchNotifications();
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toaster.error({ title: 'Failed to delete notification' });
    } finally {
      setIsDeleting(false);
    }
  };

  const getTypeColor = (type: NotificationType) => {
    switch (type) {
      case NotificationType.SYSTEM:
        return 'purple';
      case NotificationType.SESSION:
        return 'green';
      case NotificationType.REGISTRATION:
        return 'blue';
      case NotificationType.PAYMENT:
        return 'orange';
      case NotificationType.CLUB:
        return 'teal';
      default:
        return 'gray';
    }
  };

  const formatDateTime = (value: string) =>
    new Date(value).toLocaleString('vi-VN', {
      dateStyle: 'short',
      timeStyle: 'short',
    });

  if (!isHydrated || !currentUser || currentUser.role !== UserRole.ADMIN) {
    return null;
  }

  return (
    <MainLayout title="Admin - Notifications">
      <Container maxW="container.xl" py={6}>
        <VStack gap={6} align="stretch">
          <Flex
            justify="space-between"
            align={{ base: 'start', md: 'center' }}
            direction={{ base: 'column', md: 'row' }}
            gap={4}
          >
            <HStack gap={3}>
              <Box
                p={3}
                borderRadius="lg"
                bg="green.100"
                _dark={{ bg: 'green.900/30' }}
                color="green.600"
              >
                <Bell size={24} />
              </Box>
              <Box>
                <Heading size="lg">Notification Management</Heading>
                <Text color="gray.600" _dark={{ color: 'gray.400' }}>
                  Audit, inspect, and clean system notifications
                </Text>
              </Box>
            </HStack>
            <Badge colorPalette="green" px={3} py={1} borderRadius="full">
              {totalCount} total
            </Badge>
          </Flex>

          <Card.Root>
            <Card.Header>
              <HStack gap={3}>
                <Box
                  p={2}
                  borderRadius="md"
                  bg="purple.100"
                  _dark={{ bg: 'purple.900/30' }}
                  color="purple.600"
                >
                  <Bell size={18} />
                </Box>
                <Box>
                  <Heading size="md">{tn('broadcastNotifications')}</Heading>
                  <Text fontSize="sm" color="gray.500">
                    {tn('broadcastDescription')}
                  </Text>
                </Box>
              </HStack>
            </Card.Header>
            <Card.Body>
              <form onSubmit={handleSubmit(onBroadcastSubmit)}>
                <VStack gap={4} align="stretch">
                  <Field.Root invalid={!!errors.title}>
                    <Field.Label>{tn('notificationTitle')} *</Field.Label>
                    <Input
                      {...register('title')}
                      placeholder={tn('titlePlaceholder')}
                      maxLength={200}
                    />
                    {errors.title && (
                      <Field.ErrorText>{errors.title.message}</Field.ErrorText>
                    )}
                    <Field.HelperText>
                      {watchedTitle.length}/200
                    </Field.HelperText>
                  </Field.Root>

                  <Field.Root invalid={!!errors.message}>
                    <Field.Label>{tn('notificationMessage')} *</Field.Label>
                    <Textarea
                      {...register('message')}
                      placeholder={tn('messagePlaceholder')}
                      rows={4}
                      maxLength={1000}
                    />
                    {errors.message && (
                      <Field.ErrorText>
                        {errors.message.message}
                      </Field.ErrorText>
                    )}
                    <Field.HelperText>
                      {watchedMessage.length}/1000
                    </Field.HelperText>
                  </Field.Root>

                  {(watchedTitle || watchedMessage) && (
                    <Box
                      p={4}
                      borderRadius="md"
                      bg="gray.50"
                      _dark={{ bg: 'gray.800' }}
                      borderWidth="1px"
                    >
                      <Text
                        fontSize="sm"
                        fontWeight="semibold"
                        color="gray.500"
                        mb={2}
                      >
                        {tn('preview')}
                      </Text>
                      <VStack align="start" gap={1}>
                        <Text fontWeight="semibold">
                          {watchedTitle || tn('notificationTitle')}
                        </Text>
                        <Text color="gray.600" _dark={{ color: 'gray.400' }}>
                          {watchedMessage || tn('notificationMessage')}
                        </Text>
                      </VStack>
                    </Box>
                  )}

                  <Button
                    type="submit"
                    colorPalette="purple"
                    size="lg"
                    disabled={isSubmitting}
                    alignSelf="flex-start"
                  >
                    {isSubmitting ? (
                      <Spinner size="sm" />
                    ) : (
                      <>
                        <Send size={18} />
                        <Users size={18} />
                        {tn('sendToAllUsers')}
                      </>
                    )}
                  </Button>
                </VStack>
              </form>
            </Card.Body>
          </Card.Root>

          <Separator />

          <Box position="sticky" top={0} zIndex={100}>
            <SearchFilterBar
              keyword={keyword}
              onKeywordChange={setKeyword}
              placeholder="Search title, message, user name, email..."
              activeFilterCount={activeFilterCount}
              onFilterToggle={toggleFilters}
            />
          </Box>

          {!isLoading && activeFilterCount > 0 && (
            <Flex align="center" flexWrap="wrap" gap={2} minH="28px">
              {filters.type && (
                <FilterChip
                  label={`Type: ${filters.type}`}
                  colorPalette={getTypeColor(filters.type as NotificationType)}
                  onRemove={() => {
                    setPage(1);
                    setFilters({ type: '' });
                  }}
                />
              )}
              {filters.isRead && (
                <FilterChip
                  label={
                    filters.isRead === 'true' ? 'Status: Read' : 'Status: New'
                  }
                  colorPalette={filters.isRead === 'true' ? 'gray' : 'green'}
                  onRemove={() => {
                    setPage(1);
                    setFilters({ isRead: '' });
                  }}
                />
              )}
              {filters.userId && (
                <FilterChip
                  label={`User: ${filters.userId}`}
                  colorPalette="blue"
                  onRemove={() => {
                    setPage(1);
                    setFilters({ userId: '' });
                  }}
                />
              )}
              {filters.dateFrom && (
                <FilterChip
                  label={`From: ${filters.dateFrom}`}
                  colorPalette="orange"
                  onRemove={() => {
                    setPage(1);
                    setFilters({ dateFrom: '' });
                  }}
                />
              )}
              {filters.dateTo && (
                <FilterChip
                  label={`To: ${filters.dateTo}`}
                  colorPalette="orange"
                  onRemove={() => {
                    setPage(1);
                    setFilters({ dateTo: '' });
                  }}
                />
              )}
            </Flex>
          )}

          <FilterDrawer
            isOpen={showFilters}
            onClose={toggleFilters}
            onSubmit={handleSubmitFilters}
            onReset={handleResetFilters}
          >
            <VStack align="stretch" gap={5}>
              <Field.Root>
                <Field.Label>Type</Field.Label>
                <select
                  value={pendingType}
                  onChange={(e) => setPendingType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <option value="">All types</option>
                  {Object.values(NotificationType).map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </Field.Root>

              <Field.Root>
                <Field.Label>Status</Field.Label>
                <select
                  value={pendingIsRead}
                  onChange={(e) => setPendingIsRead(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <option value="">All statuses</option>
                  <option value="false">Unread</option>
                  <option value="true">Read</option>
                </select>
              </Field.Root>

              <Field.Root>
                <Field.Label>User ID</Field.Label>
                <Input
                  value={pendingUserId}
                  onChange={(e) => setPendingUserId(e.target.value)}
                  placeholder="Filter by exact userId..."
                />
              </Field.Root>

              <HStack gap={3} align="start">
                <Field.Root>
                  <Field.Label>From</Field.Label>
                  <Input
                    type="date"
                    value={pendingDateFrom}
                    onChange={(e) => setPendingDateFrom(e.target.value)}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>To</Field.Label>
                  <Input
                    type="date"
                    value={pendingDateTo}
                    onChange={(e) => setPendingDateTo(e.target.value)}
                  />
                </Field.Root>
              </HStack>
            </VStack>
          </FilterDrawer>

          <TableContainer isLoading={isLoading}>
            <Table>
              <Thead>
                <Tr>
                  <Th minW="320px">Notification</Th>
                  <Th minW="240px">Recipient</Th>
                  <Th w="120px">Type</Th>
                  <Th w="110px">Status</Th>
                  <Th w="150px">Created</Th>
                  <Th w="110px" textAlign="right">
                    Actions
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {notifications.map((notification) => (
                  <Tr key={notification.id}>
                    <Td minW="320px">
                      <VStack gap={1} align="start">
                        <Text fontWeight="semibold" lineClamp={1}>
                          {notification.title}
                        </Text>
                        <Text fontSize="sm" color="gray.500" lineClamp={2}>
                          {notification.message}
                        </Text>
                      </VStack>
                    </Td>
                    <Td minW="240px">
                      <HStack gap={2} align="start">
                        <Box color="gray.500" mt={1}>
                          <UserRound size={16} />
                        </Box>
                        <VStack gap={0} align="start" minW={0}>
                          <Text fontWeight="medium" lineClamp={1}>
                            {notification.user.name}
                          </Text>
                          <Text fontSize="xs" color="gray.500" lineClamp={1}>
                            {notification.user.email}
                          </Text>
                          <Text fontSize="10px" color="gray.400" lineClamp={1}>
                            {notification.userId}
                          </Text>
                        </VStack>
                      </HStack>
                    </Td>
                    <Td w="120px">
                      <Badge colorPalette={getTypeColor(notification.type)}>
                        {notification.type}
                      </Badge>
                    </Td>
                    <Td w="110px">
                      <Badge
                        colorPalette={notification.isRead ? 'gray' : 'green'}
                      >
                        {notification.isRead ? 'Read' : 'Unread'}
                      </Badge>
                    </Td>
                    <Td w="150px" color="gray.600" fontSize="sm">
                      {formatDateTime(notification.createdAt)}
                    </Td>
                    <Td w="110px">
                      <HStack gap={2} justify="flex-end">
                        <IconButton
                          aria-label="View notification"
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedNotification(notification)}
                        >
                          <Eye size={16} />
                        </IconButton>
                        <IconButton
                          aria-label="Delete notification"
                          size="sm"
                          variant="ghost"
                          colorPalette="red"
                          onClick={() => setNotificationToDelete(notification)}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            {notifications.length === 0 && !isLoading && (
              <VStack p={10} gap={3} color="gray.500">
                <Inbox size={40} />
                <Text fontWeight="medium">No notifications found</Text>
              </VStack>
            )}
          </TableContainer>

          <VTablePagination
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={PAGE_SIZE}
            isLoading={isLoading}
            onPageChange={setPage}
          />
        </VStack>

        <VModal
          isOpen={!!selectedNotification}
          onClose={() => setSelectedNotification(null)}
          title="Notification details"
          size="xl"
          hideSecondaryAction
          primaryActionText="Close"
          onPrimaryAction={() => setSelectedNotification(null)}
        >
          {selectedNotification && (
            <VStack align="stretch" gap={4}>
              <Box>
                <Text fontSize="xs" color="gray.500" mb={1}>
                  ID
                </Text>
                <Text fontFamily="mono" fontSize="sm">
                  {selectedNotification.id}
                </Text>
              </Box>
              <HStack gap={3} align="start">
                <Box flex={1}>
                  <Text fontSize="xs" color="gray.500" mb={1}>
                    Recipient
                  </Text>
                  <Text fontWeight="semibold">
                    {selectedNotification.user.name}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    {selectedNotification.user.email}
                  </Text>
                  <Text fontFamily="mono" fontSize="xs" color="gray.500">
                    {selectedNotification.userId}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500" mb={1}>
                    Status
                  </Text>
                  <Badge
                    colorPalette={
                      selectedNotification.isRead ? 'gray' : 'green'
                    }
                  >
                    {selectedNotification.isRead ? 'Read' : 'Unread'}
                  </Badge>
                </Box>
              </HStack>
              <Box>
                <Text fontSize="xs" color="gray.500" mb={1}>
                  Type / Created
                </Text>
                <HStack gap={2}>
                  <Badge colorPalette={getTypeColor(selectedNotification.type)}>
                    {selectedNotification.type}
                  </Badge>
                  <Text fontSize="sm">
                    {formatDateTime(selectedNotification.createdAt)}
                  </Text>
                </HStack>
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.500" mb={1}>
                  Title
                </Text>
                <Text fontWeight="semibold">{selectedNotification.title}</Text>
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.500" mb={1}>
                  Message
                </Text>
                <Text whiteSpace="pre-wrap">
                  {selectedNotification.message}
                </Text>
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.500" mb={1}>
                  Data
                </Text>
                <Box
                  as="pre"
                  p={4}
                  borderRadius="md"
                  bg="gray.50"
                  _dark={{ bg: 'gray.900' }}
                  borderWidth="1px"
                  overflowX="auto"
                  fontSize="xs"
                >
                  {JSON.stringify(selectedNotification.data ?? null, null, 2)}
                </Box>
              </Box>
            </VStack>
          )}
        </VModal>

        <VModal
          isOpen={!!notificationToDelete}
          onClose={() => setNotificationToDelete(null)}
          title="Delete notification"
          primaryActionText="Delete"
          primaryColorScheme="red"
          onPrimaryAction={handleDeleteNotification}
          isPrimaryLoading={isDeleting}
          secondaryActionText="Cancel"
        >
          {notificationToDelete && (
            <VStack align="stretch" gap={3}>
              <Text>
                Delete notification{' '}
                <Text as="span" fontWeight="semibold">
                  {notificationToDelete.title}
                </Text>
                ?
              </Text>
              <Box
                p={3}
                borderRadius="md"
                bg="red.50"
                _dark={{ bg: 'red.900/20' }}
                borderWidth="1px"
                borderColor="red.200"
              >
                <Text fontSize="sm" color="red.700">
                  Target user: {notificationToDelete.user.name} (
                  {notificationToDelete.user.email})
                </Text>
                <Text fontFamily="mono" fontSize="xs" color="red.600" mt={1}>
                  {notificationToDelete.userId}
                </Text>
              </Box>
            </VStack>
          )}
        </VModal>
      </Container>
    </MainLayout>
  );
}
