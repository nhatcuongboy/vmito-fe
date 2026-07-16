'use client';

import MainLayout from '@/components/layout/MainLayout';
import { toaster } from '@/components/ui/toaster';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/chakra-compat';
import VModal from '@/components/ui/VModal';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { FilterDrawer } from '@/components/ui/FilterDrawer';
import { FilterChip } from '@/components/ui/FilterChip';
import { useDisclosure } from '@/components/ui/ChakraHooks';
import {
  TableContainer,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  VTablePagination,
} from '@/components/ui/VTable';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRouter } from '@/i18n/config';
import { ROUTES } from '@/constants/routes';
import { SessionService } from '@/lib/api/session.service';
import { AdminService, User } from '@/lib/api/admin.service';
import { ISession, SessionStatus, UserRole } from '@/lib/api/types';
import { useUrlFilters, stringField } from '@/hooks/useUrlFilters';
import {
  Badge,
  Box,
  Container,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  MenuContent,
  MenuItem,
  MenuPositioner,
  MenuRoot,
  MenuTrigger,
  Portal,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState, Suspense } from 'react';
import {
  Ban,
  Eye,
  MoreVertical,
  Pencil,
  Play,
  Square,
  Trash2,
} from 'lucide-react';

const SESSION_FILTERS_SCHEMA = {
  q: stringField(''),
  status: stringField(''),
  sessionType: stringField(''),
  hostId: stringField(''),
  city: stringField(''),
  district: stringField(''),
  startFrom: stringField(''),
  startTo: stringField(''),
};

const STATUS_COLOR: Record<string, string> = {
  [SessionStatus.PREPARING]: 'blue',
  [SessionStatus.IN_PROGRESS]: 'green',
  [SessionStatus.FINISHED]: 'gray',
  [SessionStatus.CANCELLED]: 'red',
};

export default function AdminSessionsPage() {
  return (
    <Suspense>
      <AdminSessionsContent />
    </Suspense>
  );
}

function AdminSessionsContent() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { user: currentUser, isAuthenticated, isHydrated } = useAuthStore();

  const [sessions, setSessions] = useState<ISession[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Row selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Host options for filter picker
  const [hosts, setHosts] = useState<User[]>([]);

  // URL-synced filters
  const [filters, setFilters] = useUrlFilters(SESSION_FILTERS_SCHEMA);
  const [keyword, setKeyword] = useState(filters.q);

  // Filter drawer + pending values
  const { isOpen: showFilters, onToggle: toggleFilters } = useDisclosure(false);
  const [pendingStatus, setPendingStatus] = useState('');
  const [pendingType, setPendingType] = useState('');
  const [pendingHostId, setPendingHostId] = useState('');
  const [pendingCity, setPendingCity] = useState('');
  const [pendingDistrict, setPendingDistrict] = useState('');
  const [pendingFrom, setPendingFrom] = useState('');
  const [pendingTo, setPendingTo] = useState('');

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<ISession | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Keep input in sync when URL changes (back/forward)
  useEffect(() => {
    setKeyword(filters.q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.q]);

  // Sync pending filters when drawer opens
  useEffect(() => {
    if (showFilters) {
      setPendingStatus(filters.status);
      setPendingType(filters.sessionType);
      setPendingHostId(filters.hostId);
      setPendingCity(filters.city);
      setPendingDistrict(filters.district);
      setPendingFrom(filters.startFrom);
      setPendingTo(filters.startTo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFilters]);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const result = await SessionService.getAllSessions({
        searchQuery: filters.q || undefined,
        status: filters.status || undefined,
        sessionType:
          filters.sessionType === 'regular' ||
          filters.sessionType === 'facebook'
            ? filters.sessionType
            : undefined,
        hostId: filters.hostId || undefined,
        city: filters.city || undefined,
        district: filters.district || undefined,
        startTimeFrom: filters.startFrom
          ? new Date(filters.startFrom).toISOString()
          : undefined,
        startTimeTo: filters.startTo
          ? new Date(`${filters.startTo}T23:59:59`).toISOString()
          : undefined,
        page,
        limit: pageSize,
      });
      setSessions(result.data);
      setTotalCount(result.total);
      setTotalPages(result.totalPages);
      setSelectedIds([]);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      toaster.error({ title: t('sessions.loadError') });
      setSessions([]);
      setTotalCount(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [
    filters.q,
    filters.status,
    filters.sessionType,
    filters.hostId,
    filters.city,
    filters.district,
    filters.startFrom,
    filters.startTo,
    page,
    pageSize,
    t,
  ]);

  // Auth guard + initial load
  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      router.replace('/auth/signin');
      return;
    }
    if (!currentUser) return;
    if (currentUser.role !== UserRole.ADMIN) {
      toaster.error({ title: t('accessDenied') });
      router.replace('/');
      return;
    }
    fetchSessions();
  }, [isHydrated, isAuthenticated, currentUser, router, fetchSessions, t]);

  // Load host options once (admin only)
  useEffect(() => {
    if (currentUser?.role !== UserRole.ADMIN) return;
    AdminService.getUsers({ role: UserRole.HOST })
      .then(setHosts)
      .catch(() => setHosts([]));
  }, [currentUser?.role]);

  // Debounce keyword → URL
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ q: keyword });
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  const activeFilterCount = useMemo(
    () =>
      [
        filters.status,
        filters.sessionType,
        filters.hostId,
        filters.city,
        filters.district,
        filters.startFrom,
        filters.startTo,
      ].filter(Boolean).length,
    [filters]
  );

  const hostName = useCallback(
    (id: string) => hosts.find((h) => h.id === id)?.name || id,
    [hosts]
  );

  const handleSubmitFilters = () => {
    setFilters({
      status: pendingStatus,
      sessionType: pendingType,
      hostId: pendingHostId,
      city: pendingCity,
      district: pendingDistrict,
      startFrom: pendingFrom,
      startTo: pendingTo,
    });
    setPage(1);
    toggleFilters();
  };

  const handleResetFilters = () => {
    setPendingStatus('');
    setPendingType('');
    setPendingHostId('');
    setPendingCity('');
    setPendingDistrict('');
    setPendingFrom('');
    setPendingTo('');
  };

  // Selection helpers
  const allSelected =
    sessions.length > 0 && selectedIds.length === sessions.length;
  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : sessions.map((s) => s.id));
  };
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Actions
  const goToDetail = (s: ISession) => {
    router.push(ROUTES.HOST.SESSIONS.DETAIL(s.id, s.slug));
  };

  const handleStatusAction = async (
    s: ISession,
    action: 'start' | 'end' | 'cancel'
  ) => {
    try {
      setActionLoading(true);
      if (action === 'start') await SessionService.startSession(s.id);
      else if (action === 'end') await SessionService.endSession(s.id);
      else await SessionService.cancelSession(s.id);
      toaster.success({ title: t('sessions.statusUpdateSuccess') });
      fetchSessions();
    } catch (error) {
      console.error('Failed to update session status:', error);
      toaster.error({ title: t('sessions.statusUpdateError') });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setActionLoading(true);
      await SessionService.deleteSession(deleteTarget.id);
      toaster.success({ title: t('sessions.deleteSuccess') });
      setDeleteTarget(null);
      fetchSessions();
    } catch (error) {
      console.error('Failed to delete session:', error);
      toaster.error({ title: t('sessions.deleteError') });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      setActionLoading(true);
      await SessionService.deleteBulkSessions(selectedIds);
      toaster.success({ title: t('sessions.deleteSuccess') });
      setIsBulkDeleteOpen(false);
      fetchSessions();
    } catch (error) {
      console.error('Failed to bulk delete sessions:', error);
      toaster.error({ title: t('sessions.deleteError') });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkStatus = async (status: SessionStatus) => {
    if (selectedIds.length === 0) return;
    try {
      setActionLoading(true);
      await SessionService.updateBulkSessionStatus(selectedIds, status);
      toaster.success({ title: t('sessions.statusUpdateSuccess') });
      fetchSessions();
    } catch (error) {
      console.error('Failed to bulk update status:', error);
      toaster.error({ title: t('sessions.statusUpdateError') });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDateTime = (s: ISession) => {
    const value = s.startTime ?? s.scheduledStartTime;
    if (!value) return '—';
    return new Date(value).toLocaleString();
  };

  const statusLabel = (status: string) => t(`sessions.status.${status}`);

  const showingFrom = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const showingTo = Math.min(page * pageSize, totalCount);
  const paginationLabel =
    totalCount > 0
      ? `${t('sessions.totalRecords', {
          count: totalCount,
        })} · ${showingFrom}-${showingTo}`
      : t('sessions.totalRecords', { count: totalCount });

  const statusOptions = [
    { value: '', label: t('sessions.filters.allStatuses') },
    { value: SessionStatus.PREPARING, label: statusLabel('PREPARING') },
    { value: SessionStatus.IN_PROGRESS, label: statusLabel('IN_PROGRESS') },
    { value: SessionStatus.FINISHED, label: statusLabel('FINISHED') },
    { value: SessionStatus.CANCELLED, label: statusLabel('CANCELLED') },
  ];

  const typeOptions = [
    { value: '', label: t('sessions.filters.allTypes') },
    { value: 'regular', label: t('sessions.type.regular') },
    { value: 'facebook', label: t('sessions.type.facebook') },
  ];

  return (
    <MainLayout title={t('sessions.title')}>
      <Container maxW="container.xl" py={6}>
        <VStack gap={6} align="stretch">
          {/* Header */}
          <Flex justify="space-between" align="center">
            <Heading size="lg">{t('sessions.title')}</Heading>
          </Flex>

          {/* Search Bar */}
          <Box position="sticky" top={0} zIndex={100}>
            <SearchFilterBar
              keyword={keyword}
              onKeywordChange={setKeyword}
              placeholder={t('sessions.searchPlaceholder')}
              activeFilterCount={activeFilterCount}
              onFilterToggle={toggleFilters}
            />
          </Box>

          {/* Active filter chips */}
          {!loading && activeFilterCount > 0 && (
            <Flex align="center" flexWrap="wrap" gap={2} mb={-2} minH="28px">
              {filters.status && (
                <FilterChip
                  label={statusLabel(filters.status)}
                  colorPalette={STATUS_COLOR[filters.status] || 'gray'}
                  onRemove={() => {
                    setFilters({ status: '' });
                    setPage(1);
                  }}
                />
              )}
              {filters.sessionType && (
                <FilterChip
                  label={t(`sessions.type.${filters.sessionType}`)}
                  colorPalette="purple"
                  onRemove={() => {
                    setFilters({ sessionType: '' });
                    setPage(1);
                  }}
                />
              )}
              {filters.hostId && (
                <FilterChip
                  label={hostName(filters.hostId)}
                  colorPalette="blue"
                  onRemove={() => {
                    setFilters({ hostId: '' });
                    setPage(1);
                  }}
                />
              )}
              {filters.city && (
                <FilterChip
                  label={filters.city}
                  colorPalette="teal"
                  onRemove={() => {
                    setFilters({ city: '' });
                    setPage(1);
                  }}
                />
              )}
              {filters.district && (
                <FilterChip
                  label={filters.district}
                  colorPalette="teal"
                  onRemove={() => {
                    setFilters({ district: '' });
                    setPage(1);
                  }}
                />
              )}
              {(filters.startFrom || filters.startTo) && (
                <FilterChip
                  label={`${filters.startFrom || '…'} → ${
                    filters.startTo || '…'
                  }`}
                  colorPalette="orange"
                  onRemove={() => {
                    setFilters({ startFrom: '', startTo: '' });
                    setPage(1);
                  }}
                />
              )}
            </Flex>
          )}

          {/* Bulk actions toolbar */}
          {selectedIds.length > 0 && (
            <Flex
              align="center"
              gap={3}
              px={4}
              py={2}
              bg="green.50"
              _dark={{ bg: 'green.900' }}
              borderRadius="md"
              flexWrap="wrap"
            >
              <Text fontWeight="medium">
                {t('sessions.bulk.selected', { count: selectedIds.length })}
              </Text>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkStatus(SessionStatus.CANCELLED)}
                loading={actionLoading}
              >
                {t('sessions.actions.cancel')}
              </Button>
              <Button
                size="sm"
                colorPalette="red"
                onClick={() => setIsBulkDeleteOpen(true)}
                loading={actionLoading}
              >
                <Trash2 size={16} />
                <Text ml={1}>{t('sessions.bulk.delete')}</Text>
              </Button>
            </Flex>
          )}

          {/* Filter Drawer */}
          <FilterDrawer
            isOpen={showFilters}
            onClose={toggleFilters}
            onSubmit={handleSubmitFilters}
            onReset={handleResetFilters}
          >
            <VStack align="stretch" gap={5}>
              {/* Status */}
              <Box>
                <Text fontSize="sm" fontWeight="bold" mb={3}>
                  {t('sessions.filters.status')}
                </Text>
                <Flex gap={2} flexWrap="wrap">
                  {statusOptions.map((opt) => (
                    <Badge
                      key={opt.value || 'all'}
                      px={4}
                      py={2}
                      borderRadius="lg"
                      cursor="pointer"
                      variant={
                        pendingStatus === opt.value ? 'solid' : 'outline'
                      }
                      colorPalette={
                        pendingStatus === opt.value ? 'green' : 'gray'
                      }
                      onClick={() => setPendingStatus(opt.value)}
                      fontSize="sm"
                    >
                      {opt.label}
                    </Badge>
                  ))}
                </Flex>
              </Box>

              {/* Type */}
              <Box>
                <Text fontSize="sm" fontWeight="bold" mb={3}>
                  {t('sessions.filters.type')}
                </Text>
                <Flex gap={2} flexWrap="wrap">
                  {typeOptions.map((opt) => (
                    <Badge
                      key={opt.value || 'all'}
                      px={4}
                      py={2}
                      borderRadius="lg"
                      cursor="pointer"
                      variant={pendingType === opt.value ? 'solid' : 'outline'}
                      colorPalette={
                        pendingType === opt.value ? 'green' : 'gray'
                      }
                      onClick={() => setPendingType(opt.value)}
                      fontSize="sm"
                    >
                      {opt.label}
                    </Badge>
                  ))}
                </Flex>
              </Box>

              {/* Host */}
              <Box>
                <Text fontSize="sm" fontWeight="bold" mb={3}>
                  {t('sessions.filters.host')}
                </Text>
                <select
                  value={pendingHostId}
                  onChange={(e) => setPendingHostId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <option value="">{t('sessions.filters.allHosts')}</option>
                  {hosts.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.email})
                    </option>
                  ))}
                </select>
              </Box>

              {/* City / District */}
              <Flex gap={3}>
                <Box flex={1}>
                  <Text fontSize="sm" fontWeight="bold" mb={3}>
                    {t('sessions.filters.city')}
                  </Text>
                  <Input
                    value={pendingCity}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPendingCity(e.target.value)
                    }
                  />
                </Box>
                <Box flex={1}>
                  <Text fontSize="sm" fontWeight="bold" mb={3}>
                    {t('sessions.filters.district')}
                  </Text>
                  <Input
                    value={pendingDistrict}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPendingDistrict(e.target.value)
                    }
                  />
                </Box>
              </Flex>

              {/* Date range */}
              <Flex gap={3}>
                <Box flex={1}>
                  <Text fontSize="sm" fontWeight="bold" mb={3}>
                    {t('sessions.filters.dateFrom')}
                  </Text>
                  <Input
                    type="date"
                    value={pendingFrom}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPendingFrom(e.target.value)
                    }
                  />
                </Box>
                <Box flex={1}>
                  <Text fontSize="sm" fontWeight="bold" mb={3}>
                    {t('sessions.filters.dateTo')}
                  </Text>
                  <Input
                    type="date"
                    value={pendingTo}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPendingTo(e.target.value)
                    }
                  />
                </Box>
              </Flex>
            </VStack>
          </FilterDrawer>

          {/* Sessions Table */}
          <TableContainer isLoading={loading}>
            <Table>
              <Thead>
                <Tr>
                  <Th w="44px">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </Th>
                  <Th>{t('sessions.columns.name')}</Th>
                  <Th w="160px">{t('sessions.columns.host')}</Th>
                  <Th w="200px">{t('sessions.columns.venue')}</Th>
                  <Th w="170px">{t('sessions.columns.dateTime')}</Th>
                  <Th w="120px">{t('sessions.columns.status')}</Th>
                  <Th w="90px" textAlign="center">
                    {t('sessions.columns.players')}
                  </Th>
                  <Th w="120px" textAlign="right">
                    {t('sessions.columns.actions')}
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {sessions.map((s) => (
                  <Tr key={s.id}>
                    <Td w="44px">
                      <Checkbox
                        checked={selectedIds.includes(s.id)}
                        onCheckedChange={() => toggleSelect(s.id)}
                        aria-label={`Select ${s.name}`}
                      />
                    </Td>
                    <Td fontWeight="medium">
                      <HStack gap={2}>
                        <Text lineClamp={1}>{s.name}</Text>
                        {s.isCrawled && (
                          <Badge colorPalette="purple" size="sm">
                            FB
                          </Badge>
                        )}
                      </HStack>
                    </Td>
                    <Td w="160px" color="fg.muted">
                      <Text lineClamp={1}>{s.host?.name || s.hostName}</Text>
                    </Td>
                    <Td w="200px" color="fg.muted">
                      <Text lineClamp={1}>
                        {s.venue?.name || s.location || '—'}
                      </Text>
                    </Td>
                    <Td w="170px" color="fg.muted">
                      {formatDateTime(s)}
                    </Td>
                    <Td w="120px">
                      <Badge colorPalette={STATUS_COLOR[s.status] || 'gray'}>
                        {statusLabel(s.status)}
                      </Badge>
                    </Td>
                    <Td w="90px" textAlign="center" color="fg.muted">
                      {s._count?.players ?? 0}/
                      {s._count?.courts ?? s.numberOfCourts}
                    </Td>
                    <Td w="120px">
                      <HStack gap={1} justify="flex-end">
                        <IconButton
                          aria-label="View session"
                          size="sm"
                          variant="ghost"
                          onClick={() => goToDetail(s)}
                        >
                          <Eye size={16} />
                        </IconButton>
                        <MenuRoot positioning={{ placement: 'bottom-end' }}>
                          <MenuTrigger asChild>
                            <IconButton
                              aria-label="More actions"
                              size="sm"
                              variant="ghost"
                            >
                              <MoreVertical size={16} />
                            </IconButton>
                          </MenuTrigger>
                          <Portal>
                            <MenuPositioner zIndex={2000}>
                              <MenuContent zIndex={2001}>
                                <MenuItem
                                  value="edit"
                                  onClick={() => goToDetail(s)}
                                >
                                  <Icon as={Pencil} mr={2} />
                                  {t('sessions.actions.edit')}
                                </MenuItem>
                                {s.status === SessionStatus.PREPARING && (
                                  <MenuItem
                                    value="start"
                                    color="green.600"
                                    onClick={() =>
                                      handleStatusAction(s, 'start')
                                    }
                                  >
                                    <Icon as={Play} mr={2} />
                                    {t('sessions.actions.start')}
                                  </MenuItem>
                                )}
                                {s.status === SessionStatus.IN_PROGRESS && (
                                  <MenuItem
                                    value="end"
                                    color="orange.600"
                                    onClick={() => handleStatusAction(s, 'end')}
                                  >
                                    <Icon as={Square} mr={2} />
                                    {t('sessions.actions.end')}
                                  </MenuItem>
                                )}
                                {s.status === SessionStatus.PREPARING && (
                                  <MenuItem
                                    value="cancel"
                                    color="red.600"
                                    onClick={() =>
                                      handleStatusAction(s, 'cancel')
                                    }
                                  >
                                    <Icon as={Ban} mr={2} />
                                    {t('sessions.actions.cancel')}
                                  </MenuItem>
                                )}
                                <MenuItem
                                  value="delete"
                                  color="red.600"
                                  onClick={() => setDeleteTarget(s)}
                                >
                                  <Icon as={Trash2} mr={2} />
                                  {t('sessions.actions.delete')}
                                </MenuItem>
                              </MenuContent>
                            </MenuPositioner>
                          </Portal>
                        </MenuRoot>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            {sessions.length === 0 && !loading && (
              <Box p={8} textAlign="center" color="fg.muted">
                {t('sessions.noSessionsFound')}
              </Box>
            )}
            {totalCount > 0 && (
              <Box px={4} py={3} borderTopWidth="1px" borderColor="border">
                <VTablePagination
                  page={page}
                  totalPages={totalPages}
                  totalCount={totalCount}
                  pageSize={pageSize}
                  isLoading={loading}
                  label={paginationLabel}
                  onPageChange={setPage}
                  onPageSizeChange={(newSize) => {
                    setPageSize(newSize);
                    setPage(1);
                  }}
                />
              </Box>
            )}
          </TableContainer>
        </VStack>

        {/* Single delete confirmation */}
        <VModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title={t('sessions.actions.delete')}
          primaryActionText={tCommon('delete')}
          onPrimaryAction={handleDelete}
          isPrimaryLoading={actionLoading}
          secondaryActionText={tCommon('cancel')}
        >
          <Text>
            {t('sessions.deleteConfirm', { name: deleteTarget?.name ?? '' })}
          </Text>
        </VModal>

        {/* Bulk delete confirmation */}
        <VModal
          isOpen={isBulkDeleteOpen}
          onClose={() => setIsBulkDeleteOpen(false)}
          title={t('sessions.bulk.delete')}
          primaryActionText={tCommon('delete')}
          onPrimaryAction={handleBulkDelete}
          isPrimaryLoading={actionLoading}
          secondaryActionText={tCommon('cancel')}
        >
          <Text>
            {t('sessions.bulk.deleteConfirm', { count: selectedIds.length })}
          </Text>
        </VModal>
      </Container>
    </MainLayout>
  );
}
