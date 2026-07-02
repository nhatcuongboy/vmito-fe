'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Container,
  Field,
  Flex,
  Heading,
  HStack,
  IconButton,
  Image,
  Separator,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import {
  Eye,
  Image as ImageIcon,
  Inbox,
  MessageCircle,
  UserRound,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import MainLayout from '@/components/layout/MainLayout';
import { FilterChip } from '@/components/ui/FilterChip';
import { FilterDrawer } from '@/components/ui/FilterDrawer';
import { LegacySelect } from '@/components/ui/VSelect';
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
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { toaster } from '@/components/ui/toaster';
import { useDisclosure } from '@/components/ui/ChakraHooks';
import { stringField, useUrlFilters } from '@/hooks/useUrlFilters';
import { useRouter } from '@/i18n/config';
import { FeedbackService } from '@/lib/api/feedback.service';
import { UserRole } from '@/lib/api/types';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  EFeedbackStatus,
  EFeedbackType,
  type IFeedback,
} from '@/types/feedback';

const FEEDBACK_FILTERS_SCHEMA = {
  q: stringField(''),
  type: stringField(''),
  status: stringField(''),
};

const STATUS_COLOR_MAP: Record<EFeedbackStatus, string> = {
  [EFeedbackStatus.PENDING]: 'yellow',
  [EFeedbackStatus.IN_PROGRESS]: 'blue',
  [EFeedbackStatus.RESOLVED]: 'green',
  [EFeedbackStatus.CLOSED]: 'gray',
};

const TYPE_COLOR_MAP: Record<EFeedbackType, string> = {
  [EFeedbackType.CONTACT]: 'blue',
  [EFeedbackType.BUG_REPORT]: 'red',
};

export default function AdminFeedbackPage() {
  return (
    <Suspense>
      <AdminFeedbackContent />
    </Suspense>
  );
}

function AdminFeedbackContent() {
  const t = useTranslations('feedback');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { user: currentUser, isAuthenticated, isHydrated } = useAuthStore();

  const [filters, setFilters] = useUrlFilters(FEEDBACK_FILTERS_SCHEMA);
  const [keyword, setKeyword] = useState(filters.q);
  const [pendingType, setPendingType] = useState('');
  const [pendingStatus, setPendingStatus] = useState('');
  const { isOpen: showFilters, onToggle: toggleFilters } = useDisclosure(false);

  const [feedbackItems, setFeedbackItems] = useState<IFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedFeedback, setSelectedFeedback] = useState<IFeedback | null>(
    null
  );
  const [draftStatus, setDraftStatus] = useState<EFeedbackStatus>(
    EFeedbackStatus.PENDING
  );
  const [draftAdminNote, setDraftAdminNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setKeyword(filters.q);
  }, [filters.q]);

  useEffect(() => {
    if (showFilters) {
      setPendingType(filters.type);
      setPendingStatus(filters.status);
    }
  }, [filters.type, filters.status, showFilters]);

  const fetchFeedback = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await FeedbackService.getAdminFeedback({
        type: filters.type ? (filters.type as EFeedbackType) : undefined,
        status: filters.status
          ? (filters.status as EFeedbackStatus)
          : undefined,
      });
      setFeedbackItems(data);
      setPage(1);
    } catch (error) {
      console.error('Failed to fetch admin feedback:', error);
      toaster.error({ title: t('admin.loadError') });
    } finally {
      setIsLoading(false);
    }
  }, [filters.type, filters.status, t]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      router.replace('/auth/signin');
      return;
    }
    if (!currentUser) return;
    if (currentUser.role !== UserRole.ADMIN) {
      toaster.error({ title: t('admin.accessDenied') });
      router.replace('/dashboard');
      return;
    }
    fetchFeedback();
  }, [isHydrated, isAuthenticated, currentUser, router, t, fetchFeedback]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setFilters({ q: keyword });
    }, 500);
    return () => clearTimeout(timer);
  }, [keyword, setFilters]);

  const filteredFeedback = useMemo(() => {
    const query = filters.q.trim().toLowerCase();
    if (!query) return feedbackItems;

    return feedbackItems.filter((item) => {
      const searchable = [
        item.title,
        item.description,
        item.user?.name,
        item.user?.email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [feedbackItems, filters.q]);

  const totalPages = Math.max(1, Math.ceil(filteredFeedback.length / pageSize));
  const paginatedFeedback = filteredFeedback.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const activeFilterCount = [filters.type, filters.status].filter(
    Boolean
  ).length;

  const formatDateTime = (value: string) =>
    new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));

  const openDetails = (feedback: IFeedback) => {
    setSelectedFeedback(feedback);
    setDraftStatus(feedback.status);
    setDraftAdminNote(feedback.adminNote || '');
  };

  const handleSubmitFilters = () => {
    setPage(1);
    setFilters({ type: pendingType, status: pendingStatus });
    toggleFilters();
  };

  const handleResetFilters = () => {
    setPendingType('');
    setPendingStatus('');
  };

  const handleUpdateFeedback = async () => {
    if (!selectedFeedback) return;

    try {
      setIsUpdating(true);
      const updated = await FeedbackService.updateStatus(selectedFeedback.id, {
        status: draftStatus,
        adminNote: draftAdminNote.trim() || undefined,
      });
      setSelectedFeedback(updated);
      setFeedbackItems((items) =>
        items.map((item) => (item.id === updated.id ? updated : item))
      );
      await fetchFeedback();
      toaster.success({ title: t('admin.updateSuccess') });
    } catch (error) {
      console.error('Failed to update feedback:', error);
      toaster.error({ title: t('admin.updateError') });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isHydrated || !currentUser || currentUser.role !== UserRole.ADMIN) {
    return null;
  }

  return (
    <MainLayout title={t('admin.pageTitle')}>
      <Container maxW="container.xl" py={6}>
        <VStack gap={6} align="stretch">
          <Flex justify="space-between" align="center" gap={4}>
            <HStack gap={3}>
              <Box
                p={3}
                borderRadius="lg"
                bg="green.100"
                _dark={{ bg: 'green.900/30' }}
                color="green.600"
              >
                <MessageCircle size={24} />
              </Box>
              <Box>
                <Heading size="lg">{t('admin.pageTitle')}</Heading>
                <Text color="gray.600" _dark={{ color: 'gray.400' }}>
                  {t('admin.subtitle')}
                </Text>
              </Box>
            </HStack>
          </Flex>

          <Separator />

          <Box position="sticky" top={0} zIndex={100}>
            <SearchFilterBar
              keyword={keyword}
              onKeywordChange={setKeyword}
              placeholder={t('admin.searchPlaceholder')}
              activeFilterCount={activeFilterCount}
              onFilterToggle={toggleFilters}
            />
          </Box>

          {!isLoading && activeFilterCount > 0 && (
            <Flex align="center" flexWrap="wrap" gap={2} minH="28px">
              {filters.type && (
                <FilterChip
                  label={`${t('admin.typeFilter')}: ${t(
                    `type.${filters.type}`
                  )}`}
                  colorPalette={TYPE_COLOR_MAP[filters.type as EFeedbackType]}
                  onRemove={() => {
                    setPage(1);
                    setFilters({ type: '' });
                  }}
                />
              )}
              {filters.status && (
                <FilterChip
                  label={`${t('admin.statusFilter')}: ${t(
                    `status.${filters.status}`
                  )}`}
                  colorPalette={
                    STATUS_COLOR_MAP[filters.status as EFeedbackStatus]
                  }
                  onRemove={() => {
                    setPage(1);
                    setFilters({ status: '' });
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
                <Field.Label>{t('admin.typeFilter')}</Field.Label>
                <LegacySelect
                  value={pendingType}
                  onChange={(event) => setPendingType(event.target.value)}
                >
                  <option value="">{t('admin.allTypes')}</option>
                  {Object.values(EFeedbackType).map((type) => (
                    <option key={type} value={type}>
                      {t(`type.${type}`)}
                    </option>
                  ))}
                </LegacySelect>
              </Field.Root>

              <Field.Root>
                <Field.Label>{t('admin.statusFilter')}</Field.Label>
                <LegacySelect
                  value={pendingStatus}
                  onChange={(event) => setPendingStatus(event.target.value)}
                >
                  <option value="">{t('admin.allStatuses')}</option>
                  {Object.values(EFeedbackStatus).map((status) => (
                    <option key={status} value={status}>
                      {t(`status.${status}`)}
                    </option>
                  ))}
                </LegacySelect>
              </Field.Root>
            </VStack>
          </FilterDrawer>

          <TableContainer isLoading={isLoading}>
            <Table>
              <Thead>
                <Tr>
                  <Th minW="320px">{t('admin.feedbackColumn')}</Th>
                  <Th minW="230px">{t('admin.userColumn')}</Th>
                  <Th w="130px">{t('admin.typeColumn')}</Th>
                  <Th w="130px">{t('admin.statusColumn')}</Th>
                  <Th w="160px">{t('admin.createdColumn')}</Th>
                  <Th w="110px" textAlign="right">
                    {t('admin.actionsColumn')}
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {paginatedFeedback.map((feedback) => (
                  <Tr key={feedback.id}>
                    <Td minW="320px">
                      <VStack gap={1} align="start">
                        <HStack gap={2} maxW="full">
                          <Text fontWeight="semibold" lineClamp={1}>
                            {feedback.title}
                          </Text>
                          {feedback.imageUrl && (
                            <Box color="gray.500" flexShrink={0}>
                              <ImageIcon size={14} />
                            </Box>
                          )}
                        </HStack>
                        <Text fontSize="sm" color="gray.500" lineClamp={2}>
                          {feedback.description}
                        </Text>
                      </VStack>
                    </Td>
                    <Td minW="230px">
                      <HStack gap={2} align="start">
                        <Box color="gray.500" mt={1}>
                          <UserRound size={16} />
                        </Box>
                        <VStack gap={0} align="start" minW={0}>
                          <Text fontWeight="medium" lineClamp={1}>
                            {feedback.user?.name || tCommon('unknown')}
                          </Text>
                          <Text fontSize="xs" color="gray.500" lineClamp={1}>
                            {feedback.user?.email || tCommon('notAvailable')}
                          </Text>
                        </VStack>
                      </HStack>
                    </Td>
                    <Td w="130px">
                      <Badge colorPalette={TYPE_COLOR_MAP[feedback.type]}>
                        {t(`type.${feedback.type}`)}
                      </Badge>
                    </Td>
                    <Td w="130px">
                      <Badge colorPalette={STATUS_COLOR_MAP[feedback.status]}>
                        {t(`status.${feedback.status}`)}
                      </Badge>
                    </Td>
                    <Td w="160px" color="gray.600" fontSize="sm">
                      {formatDateTime(feedback.createdAt)}
                    </Td>
                    <Td w="110px">
                      <HStack gap={2} justify="flex-end">
                        <IconButton
                          aria-label={t('admin.viewDetails')}
                          size="sm"
                          variant="ghost"
                          onClick={() => openDetails(feedback)}
                        >
                          <Eye size={16} />
                        </IconButton>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            {filteredFeedback.length === 0 && !isLoading && (
              <VStack p={10} gap={3} color="gray.500">
                <Inbox size={40} />
                <Text fontWeight="medium">{t('admin.noFeedback')}</Text>
              </VStack>
            )}
          </TableContainer>

          {filteredFeedback.length > 0 && (
            <VTablePagination
              page={page}
              totalPages={totalPages}
              totalCount={filteredFeedback.length}
              pageSize={pageSize}
              isLoading={isLoading}
              onPageChange={setPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setPage(1);
              }}
            />
          )}
        </VStack>

        <VModal
          isOpen={!!selectedFeedback}
          onClose={() => setSelectedFeedback(null)}
          title={t('admin.detailsTitle')}
          size="xl"
          primaryActionText={t('admin.update')}
          onPrimaryAction={handleUpdateFeedback}
          isPrimaryLoading={isUpdating}
          secondaryActionText={tCommon('close')}
          maxBodyHeight={{ base: '65vh', md: '70vh' }}
        >
          {selectedFeedback && (
            <VStack align="stretch" gap={5}>
              <HStack gap={3} align="start">
                <Box flex={1}>
                  <Text fontSize="xs" color="gray.500" mb={1}>
                    {t('admin.sender')}
                  </Text>
                  <Text fontWeight="semibold">
                    {selectedFeedback.user?.name || tCommon('unknown')}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    {selectedFeedback.user?.email || tCommon('notAvailable')}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500" mb={1}>
                    {t('admin.createdAt')}
                  </Text>
                  <Text fontSize="sm">
                    {formatDateTime(selectedFeedback.createdAt)}
                  </Text>
                </Box>
              </HStack>

              <HStack gap={2}>
                <Badge colorPalette={TYPE_COLOR_MAP[selectedFeedback.type]}>
                  {t(`type.${selectedFeedback.type}`)}
                </Badge>
                <Badge colorPalette={STATUS_COLOR_MAP[selectedFeedback.status]}>
                  {t(`status.${selectedFeedback.status}`)}
                </Badge>
              </HStack>

              <Box>
                <Text fontSize="xs" color="gray.500" mb={1}>
                  {t('title')}
                </Text>
                <Text fontWeight="semibold">{selectedFeedback.title}</Text>
              </Box>

              <Box>
                <Text fontSize="xs" color="gray.500" mb={1}>
                  {t('description')}
                </Text>
                <Text whiteSpace="pre-wrap">
                  {selectedFeedback.description}
                </Text>
              </Box>

              {selectedFeedback.imageUrl && (
                <Box>
                  <Text fontSize="xs" color="gray.500" mb={2}>
                    {t('admin.screenshot')}
                  </Text>
                  <Image
                    src={selectedFeedback.imageUrl}
                    alt={t('admin.screenshot')}
                    maxH="320px"
                    borderRadius="md"
                    borderWidth="1px"
                    objectFit="contain"
                  />
                </Box>
              )}

              <Field.Root>
                <Field.Label>{t('admin.statusFilter')}</Field.Label>
                <LegacySelect
                  value={draftStatus}
                  onChange={(event) =>
                    setDraftStatus(event.target.value as EFeedbackStatus)
                  }
                >
                  {Object.values(EFeedbackStatus).map((status) => (
                    <option key={status} value={status}>
                      {t(`status.${status}`)}
                    </option>
                  ))}
                </LegacySelect>
              </Field.Root>

              <Field.Root>
                <Field.Label>{t('admin.adminNote')}</Field.Label>
                <Textarea
                  value={draftAdminNote}
                  onChange={(event) => setDraftAdminNote(event.target.value)}
                  placeholder={t('admin.adminNotePlaceholder')}
                  rows={4}
                />
              </Field.Root>
            </VStack>
          )}
        </VModal>
      </Container>
    </MainLayout>
  );
}
