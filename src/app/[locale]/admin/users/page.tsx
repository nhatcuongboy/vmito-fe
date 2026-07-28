'use client';
import { Input } from '@/components/ui/Input';

import MainLayout from '@/components/layout/MainLayout';
import { toaster } from '@/components/ui/toaster';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRouter } from '@/i18n/config';
import { AdminService, User, UpdateUserData } from '@/lib/api/admin.service';
import { UserRole } from '@/lib/api/types';
import {
  Badge,
  Box,
  Container,
  Field,
  Flex,
  Heading,
  HStack,
  IconButton,
  Text,
  VStack,
} from '@chakra-ui/react';
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
import { PasswordInput } from '@/components/ui/password-input';
import { useTranslations, useLocale } from 'next-intl';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { Pencil, Trash2, Plus, Eye } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import VModal from '@/components/ui/VModal';
import { useUrlFilters, stringField } from '@/hooks/useUrlFilters';
import { useDisclosure } from '@/components/ui/ChakraHooks';
import { Button } from '@/components/ui/chakra-compat';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { FilterDrawer } from '@/components/ui/FilterDrawer';
import { FilterChip } from '@/components/ui/FilterChip';

const USER_FILTERS_SCHEMA = {
  q: stringField(''),
  role: stringField(''),
  gender: stringField(''),
  provider: stringField(''),
};

const GENDER_VALUES = ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'] as const;

const PROVIDER_VALUES = [
  'email',
  'google',
  'facebook',
  'zalo',
  'apple',
] as const;

// Schema definitions
const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.nativeEnum(UserRole),
});

const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.nativeEnum(UserRole),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;
type UpdateUserFormValues = z.infer<typeof updateUserSchema>;

export default function AdminUsersPage() {
  return (
    <Suspense>
      <AdminUsersContent />
    </Suspense>
  );
}

function AdminUsersContent() {
  const t = useTranslations('admin.usersPage');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const { user: currentUser, isAuthenticated, isHydrated } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // URL-synced filters
  const [filters, setFilters] = useUrlFilters(USER_FILTERS_SCHEMA);
  const [keyword, setKeyword] = useState(filters.q);

  // Filter drawer
  const { isOpen: showFilters, onToggle: toggleFilters } = useDisclosure(false);
  const [pendingRole, setPendingRole] = useState('');
  const [pendingGender, setPendingGender] = useState('');
  const [pendingProvider, setPendingProvider] = useState('');

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Forms
  const createForm = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      name: '',
      password: '',
      role: UserRole.PLAYER,
    },
  });

  const updateForm = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: '',
      role: UserRole.PLAYER,
    },
  });

  // Keep input in sync when URL changes (back/forward)
  useEffect(() => {
    setKeyword(filters.q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.q]);

  // Sync pending filters when drawer opens
  useEffect(() => {
    if (showFilters) {
      setPendingRole(filters.role);
      setPendingGender(filters.gender);
      setPendingProvider(filters.provider);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFilters]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const result = await AdminService.getUsersPaginated({
        search: filters.q || undefined,
        role: filters.role || undefined,
        gender: filters.gender || undefined,
        provider: filters.provider || undefined,
        page,
        limit: pageSize,
      });
      setUsers(result.data);
      setTotalCount(result.pagination.total);
      setTotalPages(result.pagination.totalPages);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toaster.error({ title: t('toast.loadError') });
      setUsers([]);
      setTotalCount(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [
    filters.q,
    filters.role,
    filters.gender,
    filters.provider,
    page,
    pageSize,
    t,
  ]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      router.replace('/auth/signin');
      return;
    }
    if (!currentUser) return;
    if (currentUser.role !== UserRole.ADMIN) {
      toaster.error({ title: t('toast.accessDenied') });
      router.replace('/dashboard');
      return;
    }
    fetchUsers();
  }, [isHydrated, isAuthenticated, currentUser, router, fetchUsers, t]);

  // Debounce: write keyword to URL 500ms after the user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ q: keyword });
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  // Filter helpers
  const activeFilterCount =
    (filters.role ? 1 : 0) +
    (filters.gender ? 1 : 0) +
    (filters.provider ? 1 : 0);

  const handleSubmitFilters = () => {
    setFilters({
      role: pendingRole,
      gender: pendingGender,
      provider: pendingProvider,
    });
    setPage(1);
    toggleFilters();
  };

  const handleResetFilters = () => {
    setPendingRole('');
    setPendingGender('');
    setPendingProvider('');
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'red';
      case UserRole.HOST:
        return 'blue';
      case UserRole.REFEREE:
        return 'purple';
      default:
        return 'gray';
    }
  };

  const getRoleLabel = (role: string) =>
    role ? t(`role.${role}`) : t('filters.allRoles');

  const getGenderLabel = (gender?: string) =>
    gender ? t(`gender.${gender}`) : t('gender.unknown');

  const getProviderLabel = (provider?: string) => {
    if (!provider) return t('provider.unknown');
    const known = ['email', 'google', 'facebook', 'zalo', 'apple'];
    return known.includes(provider)
      ? t(`provider.${provider}`)
      : t('provider.unknown');
  };

  const getProviderBadgeColor = (provider?: string) => {
    switch (provider) {
      case 'google':
        return 'red';
      case 'facebook':
        return 'blue';
      case 'zalo':
        return 'cyan';
      case 'apple':
        return 'gray';
      case 'email':
        return 'green';
      default:
        return 'gray';
    }
  };

  const handleViewProfile = (userId: string) => {
    window.open(`/${locale}/user/${userId}`, '_blank');
  };

  const handleCreate = async (data: CreateUserFormValues) => {
    try {
      await AdminService.createUser(data);
      toaster.success({ title: t('toast.createSuccess') });
      setIsCreateOpen(false);
      createForm.reset();
      fetchUsers();
    } catch (error) {
      console.error('Failed to create user:', error);
      toaster.error({ title: t('toast.createError') });
    }
  };

  const handleUpdate = async (data: UpdateUserFormValues) => {
    if (!selectedUser) return;
    try {
      const updateData: UpdateUserData = {
        name: data.name,
        role: data.role,
      };
      await AdminService.updateUser(selectedUser.id, updateData);
      toaster.success({ title: t('toast.updateSuccess') });
      setIsEditOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
      toaster.error({ title: t('toast.updateError') });
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      await AdminService.deleteUser(selectedUser.id);
      toaster.success({ title: t('toast.deleteSuccess') });
      setIsDeleteOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      toaster.error({ title: t('toast.deleteError') });
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    updateForm.reset({
      name: user.name,
      role: user.role,
    });
    setIsEditOpen(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  const showingFrom = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const showingTo = Math.min(page * pageSize, totalCount);
  const totalRecordsLabel = t('totalRecords', {
    count: totalCount.toLocaleString(),
  });
  const paginationLabel =
    totalCount > 0
      ? `${totalRecordsLabel} · ${t('showingRange', {
          from: showingFrom.toLocaleString(),
          to: showingTo.toLocaleString(),
        })}`
      : totalRecordsLabel;

  return (
    <MainLayout title="Admin - Users">
      <Container maxW="container.xl" py={6}>
        <VStack gap={6} align="stretch">
          {/* Header */}
          <Flex justify="space-between" align="center">
            <Heading size="lg">{t('title')}</Heading>
            <Button
              colorPalette="green"
              onClick={() => {
                createForm.reset();
                setIsCreateOpen(true);
              }}
            >
              <Plus size={18} />
              <Text ml={2}>{t('addUser')}</Text>
            </Button>
          </Flex>

          {/* Search Bar - Sticky */}
          <Box position="sticky" top={0} zIndex={100}>
            <SearchFilterBar
              keyword={keyword}
              onKeywordChange={setKeyword}
              placeholder={t('searchPlaceholder')}
              activeFilterCount={activeFilterCount}
              onFilterToggle={toggleFilters}
            />
          </Box>

          {/* Active filter chips */}
          {!loading && activeFilterCount > 0 && (
            <Flex align="center" flexWrap="wrap" gap={2} mb={-2} minH="28px">
              {filters.role && (
                <FilterChip
                  label={getRoleLabel(filters.role)}
                  colorPalette={getRoleBadgeColor(filters.role)}
                  onRemove={() => setFilters({ role: '' })}
                />
              )}
              {filters.gender && (
                <FilterChip
                  label={getGenderLabel(filters.gender)}
                  colorPalette="pink"
                  onRemove={() => setFilters({ gender: '' })}
                />
              )}
              {filters.provider && (
                <FilterChip
                  label={getProviderLabel(filters.provider)}
                  colorPalette={getProviderBadgeColor(filters.provider)}
                  onRemove={() => setFilters({ provider: '' })}
                />
              )}
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
              {/* Role filter */}
              <Box>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color="gray.700"
                  _dark={{ color: 'gray.200' }}
                  mb={3}
                >
                  {t('filters.role')}
                </Text>
                <Flex gap={2} flexWrap="wrap">
                  {[
                    { value: '', label: t('filters.allRoles') },
                    { value: UserRole.ADMIN, label: t('role.ADMIN') },
                    { value: UserRole.HOST, label: t('role.HOST') },
                    { value: UserRole.PLAYER, label: t('role.PLAYER') },
                    { value: UserRole.REFEREE, label: t('role.REFEREE') },
                  ].map((opt) => (
                    <Badge
                      key={opt.value || 'all'}
                      px={4}
                      py={2}
                      borderRadius="lg"
                      cursor="pointer"
                      variant={pendingRole === opt.value ? 'solid' : 'outline'}
                      colorPalette={
                        pendingRole === opt.value ? 'green' : 'gray'
                      }
                      onClick={() => setPendingRole(opt.value)}
                      fontSize="sm"
                      fontWeight="medium"
                      transition="all 0.2s"
                      _hover={{ transform: 'scale(1.05)' }}
                      borderWidth={pendingRole === opt.value ? '0' : '2px'}
                    >
                      {opt.label}
                    </Badge>
                  ))}
                </Flex>
              </Box>

              {/* Gender filter */}
              <Box>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color="gray.700"
                  _dark={{ color: 'gray.200' }}
                  mb={3}
                >
                  {t('filters.gender')}
                </Text>
                <Flex gap={2} flexWrap="wrap">
                  {[
                    { value: '', label: t('filters.allGenders') },
                    ...GENDER_VALUES.map((g) => ({
                      value: g,
                      label: t(`gender.${g}`),
                    })),
                  ].map((opt) => (
                    <Badge
                      key={opt.value || 'all'}
                      px={4}
                      py={2}
                      borderRadius="lg"
                      cursor="pointer"
                      variant={
                        pendingGender === opt.value ? 'solid' : 'outline'
                      }
                      colorPalette={
                        pendingGender === opt.value ? 'green' : 'gray'
                      }
                      onClick={() => setPendingGender(opt.value)}
                      fontSize="sm"
                      fontWeight="medium"
                      transition="all 0.2s"
                      _hover={{ transform: 'scale(1.05)' }}
                      borderWidth={pendingGender === opt.value ? '0' : '2px'}
                    >
                      {opt.label}
                    </Badge>
                  ))}
                </Flex>
              </Box>

              {/* Registration method filter */}
              <Box>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color="gray.700"
                  _dark={{ color: 'gray.200' }}
                  mb={3}
                >
                  {t('filters.registeredVia')}
                </Text>
                <Flex gap={2} flexWrap="wrap">
                  {[
                    { value: '', label: t('filters.allProviders') },
                    ...PROVIDER_VALUES.map((p) => ({
                      value: p,
                      label: t(`provider.${p}`),
                    })),
                  ].map((opt) => (
                    <Badge
                      key={opt.value || 'all'}
                      px={4}
                      py={2}
                      borderRadius="lg"
                      cursor="pointer"
                      variant={
                        pendingProvider === opt.value ? 'solid' : 'outline'
                      }
                      colorPalette={
                        pendingProvider === opt.value ? 'green' : 'gray'
                      }
                      onClick={() => setPendingProvider(opt.value)}
                      fontSize="sm"
                      fontWeight="medium"
                      transition="all 0.2s"
                      _hover={{ transform: 'scale(1.05)' }}
                      borderWidth={pendingProvider === opt.value ? '0' : '2px'}
                    >
                      {opt.label}
                    </Badge>
                  ))}
                </Flex>
              </Box>
            </VStack>
          </FilterDrawer>

          {/* Users Table */}
          <TableContainer isLoading={loading}>
            <Table>
              <Thead>
                <Tr>
                  <Th w="180px">{t('columns.name')}</Th>
                  <Th>{t('columns.email')}</Th>
                  <Th w="100px">{t('columns.role')}</Th>
                  <Th w="90px">{t('columns.gender')}</Th>
                  <Th w="130px">{t('columns.registeredVia')}</Th>
                  <Th w="120px">{t('columns.created')}</Th>
                  <Th w="140px" textAlign="right">
                    {t('columns.actions')}
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {users.map((user) => (
                  <Tr key={user.id}>
                    <Td w="180px" fontWeight="medium">
                      {user.name}
                    </Td>
                    <Td color="gray.600">{user.email}</Td>
                    <Td w="100px">
                      <Badge colorPalette={getRoleBadgeColor(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </Td>
                    <Td w="90px" color="gray.600">
                      {user.gender ? (
                        getGenderLabel(user.gender)
                      ) : (
                        <Text as="span" color="gray.400">
                          —
                        </Text>
                      )}
                    </Td>
                    <Td w="130px">
                      <Badge
                        variant="subtle"
                        colorPalette={getProviderBadgeColor(
                          user.registrationProvider
                        )}
                      >
                        {getProviderLabel(user.registrationProvider)}
                      </Badge>
                    </Td>
                    <Td w="120px" color="gray.600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </Td>
                    <Td w="140px">
                      <HStack gap={2} justify="flex-end">
                        <IconButton
                          aria-label={t('actions.viewProfile')}
                          title={t('actions.viewProfile')}
                          size="sm"
                          variant="ghost"
                          colorPalette="green"
                          onClick={() => handleViewProfile(user.id)}
                        >
                          <Eye size={16} />
                        </IconButton>
                        <IconButton
                          aria-label={t('actions.edit')}
                          title={t('actions.edit')}
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditModal(user)}
                        >
                          <Pencil size={16} />
                        </IconButton>
                        <IconButton
                          aria-label={t('actions.delete')}
                          title={t('actions.delete')}
                          size="sm"
                          variant="ghost"
                          colorPalette="red"
                          onClick={() => openDeleteModal(user)}
                          disabled={user.id === currentUser?.id}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            {users.length === 0 && !loading && (
              <Box p={8} textAlign="center" color="gray.500">
                {t('noUsersFound')}
              </Box>
            )}
            {totalCount > 0 && (
              <Box px={4} py={3} borderTopWidth="1px" borderColor="gray.100">
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

        {/* Create User Dialog */}
        <VModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title={t('createTitle')}
          primaryActionText={tCommon('create') || 'Create'}
          onPrimaryAction={createForm.handleSubmit(handleCreate)}
          isPrimaryLoading={createForm.formState.isSubmitting}
          secondaryActionText={tCommon('cancel')}
        >
          <VStack
            gap={4}
            as="form"
            onSubmit={createForm.handleSubmit(handleCreate)}
          >
            <Controller
              control={createForm.control}
              name="email"
              render={({ field, fieldState }) => (
                <Field.Root invalid={!!fieldState.error}>
                  <Field.Label htmlFor="create-email">
                    {t('fields.email')}
                  </Field.Label>
                  <Input id="create-email" type="email" {...field} />
                  <Field.ErrorText>{fieldState.error?.message}</Field.ErrorText>
                </Field.Root>
              )}
            />

            <Controller
              control={createForm.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field.Root invalid={!!fieldState.error}>
                  <Field.Label htmlFor="create-name">
                    {t('fields.name')}
                  </Field.Label>
                  <Input id="create-name" {...field} />
                  <Field.ErrorText>{fieldState.error?.message}</Field.ErrorText>
                </Field.Root>
              )}
            />

            <Controller
              control={createForm.control}
              name="password"
              render={({ field, fieldState }) => (
                <Field.Root invalid={!!fieldState.error}>
                  <Field.Label htmlFor="create-password">
                    {t('fields.password')}
                  </Field.Label>
                  <PasswordInput id="create-password" {...field} />
                  <Field.ErrorText>{fieldState.error?.message}</Field.ErrorText>
                </Field.Root>
              )}
            />

            <Controller
              control={createForm.control}
              name="role"
              render={({ field, fieldState }) => (
                <Field.Root invalid={!!fieldState.error}>
                  <Field.Label htmlFor="create-role">
                    {t('fields.role')}
                  </Field.Label>
                  <select
                    id="create-role"
                    {...field}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <option value={UserRole.PLAYER}>{t('role.PLAYER')}</option>
                    <option value={UserRole.HOST}>{t('role.HOST')}</option>
                    <option value={UserRole.ADMIN}>{t('role.ADMIN')}</option>
                  </select>
                  <Field.ErrorText>{fieldState.error?.message}</Field.ErrorText>
                </Field.Root>
              )}
            />
          </VStack>
        </VModal>

        {/* Edit User Dialog */}
        <VModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          title={t('editTitle')}
          primaryActionText={tCommon('save')}
          onPrimaryAction={updateForm.handleSubmit(handleUpdate)}
          isPrimaryLoading={updateForm.formState.isSubmitting}
          secondaryActionText={tCommon('cancel')}
        >
          <VStack
            gap={4}
            as="form"
            onSubmit={updateForm.handleSubmit(handleUpdate)}
          >
            <Field.Root>
              <Field.Label htmlFor="edit-email">
                {t('fields.email')}
              </Field.Label>
              <Input
                id="edit-email"
                value={selectedUser?.email || ''}
                disabled
              />
            </Field.Root>

            <Controller
              control={updateForm.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field.Root invalid={!!fieldState.error}>
                  <Field.Label htmlFor="edit-name">
                    {t('fields.name')}
                  </Field.Label>
                  <Input id="edit-name" {...field} />
                  <Field.ErrorText>{fieldState.error?.message}</Field.ErrorText>
                </Field.Root>
              )}
            />

            <Controller
              control={updateForm.control}
              name="role"
              render={({ field, fieldState }) => (
                <Field.Root invalid={!!fieldState.error}>
                  <Field.Label htmlFor="edit-role">
                    {t('fields.role')}
                  </Field.Label>
                  <select
                    id="edit-role"
                    {...field}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <option value={UserRole.PLAYER}>{t('role.PLAYER')}</option>
                    <option value={UserRole.HOST}>{t('role.HOST')}</option>
                    <option value={UserRole.ADMIN}>{t('role.ADMIN')}</option>
                  </select>
                  <Field.ErrorText>{fieldState.error?.message}</Field.ErrorText>
                </Field.Root>
              )}
            />
          </VStack>
        </VModal>

        {/* Delete Confirmation Dialog */}
        <VModal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          title={t('deleteTitle')}
          primaryActionText={tCommon('delete')}
          onPrimaryAction={handleDelete}
          isPrimaryLoading={false}
          primaryColorScheme="red"
          secondaryActionText={tCommon('cancel')}
        >
          <Text>
            {t('deleteConfirmation', { name: selectedUser?.name || '' })}
          </Text>
        </VModal>
      </Container>
    </MainLayout>
  );
}
