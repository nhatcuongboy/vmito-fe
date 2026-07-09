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
import { useTranslations } from 'next-intl';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
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
};

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
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFilters]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const result = await AdminService.getUsersPaginated({
        search: filters.q || undefined,
        role: filters.role || undefined,
        page,
        limit: pageSize,
      });
      setUsers(result.data);
      setTotalCount(result.pagination.total);
      setTotalPages(result.pagination.totalPages);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toaster.error({ title: t('users.loadError') });
      setUsers([]);
      setTotalCount(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [filters.q, filters.role, page, pageSize, t]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      router.replace('/auth/signin');
      return;
    }
    if (!currentUser) return;
    if (currentUser.role !== UserRole.ADMIN) {
      toaster.error({ title: t('accessDeniedAdmin') });
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
  const activeFilterCount = filters.role ? 1 : 0;

  const handleSubmitFilters = () => {
    setFilters({ role: pendingRole });
    setPage(1);
    toggleFilters();
  };

  const handleResetFilters = () => {
    setPendingRole('');
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'red';
      case UserRole.HOST:
        return 'blue';
      default:
        return 'gray';
    }
  };

  const handleCreate = async (data: CreateUserFormValues) => {
    try {
      await AdminService.createUser(data);
      toaster.success({ title: t('users.createSuccess') });
      setIsCreateOpen(false);
      createForm.reset();
      fetchUsers();
    } catch (error) {
      console.error('Failed to create user:', error);
      toaster.error({ title: t('users.createError') });
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
      toaster.success({ title: t('users.updateSuccess') });
      setIsEditOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
      toaster.error({ title: t('users.updateError') });
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      await AdminService.deleteUser(selectedUser.id);
      toaster.success({ title: t('users.deleteSuccess') });
      setIsDeleteOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      toaster.error({ title: t('users.deleteError') });
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
  const totalRecordsLabel = `Total records: ${totalCount.toLocaleString()}`;
  const paginationLabel =
    totalCount > 0
      ? `${totalRecordsLabel} · Showing ${showingFrom.toLocaleString()}-${showingTo.toLocaleString()}`
      : totalRecordsLabel;

  return (
    <MainLayout title="Admin - Users">
      <Container maxW="container.xl" py={6}>
        <VStack gap={6} align="stretch">
          {/* Header */}
          <Flex justify="space-between" align="center">
            <Heading size="lg">User Management</Heading>
            <Button
              colorPalette="green"
              onClick={() => {
                createForm.reset();
                setIsCreateOpen(true);
              }}
            >
              <Plus size={18} />
              <Text ml={2}>Add User</Text>
            </Button>
          </Flex>

          {/* Search Bar - Sticky */}
          <Box position="sticky" top={0} zIndex={100}>
            <SearchFilterBar
              keyword={keyword}
              onKeywordChange={setKeyword}
              placeholder="Search by email or name..."
              activeFilterCount={activeFilterCount}
              onFilterToggle={toggleFilters}
            />
          </Box>

          {/* Active filter chips */}
          {!loading && filters.role && (
            <Flex align="center" flexWrap="wrap" gap={2} mb={-2} minH="28px">
              <FilterChip
                label={filters.role}
                colorPalette={getRoleBadgeColor(filters.role)}
                onRemove={() => setFilters({ role: '' })}
              />
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
              <Box>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color="gray.700"
                  _dark={{ color: 'gray.200' }}
                  mb={3}
                >
                  Role
                </Text>
                <Flex gap={2} flexWrap="wrap">
                  {[
                    { value: '', label: 'All Roles' },
                    { value: UserRole.ADMIN, label: 'Admin' },
                    { value: UserRole.HOST, label: 'Host' },
                    { value: UserRole.PLAYER, label: 'Player' },
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
            </VStack>
          </FilterDrawer>

          {/* Users Table */}
          <TableContainer isLoading={loading}>
            <Table>
              <Thead>
                <Tr>
                  <Th w="180px">Name</Th>
                  <Th>Email</Th>
                  <Th w="100px">Role</Th>
                  <Th w="120px">Created</Th>
                  <Th w="120px" textAlign="right">
                    Actions
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
                        {user.role}
                      </Badge>
                    </Td>
                    <Td w="120px" color="gray.600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </Td>
                    <Td w="120px">
                      <HStack gap={2} justify="flex-end">
                        <IconButton
                          aria-label="Edit user"
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditModal(user)}
                        >
                          <Pencil size={16} />
                        </IconButton>
                        <IconButton
                          aria-label="Delete user"
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
                No users found
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
          title={t('createUser')}
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
                  <Field.Label htmlFor="create-email">{t('email')}</Field.Label>
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
                  <Field.Label htmlFor="create-name">{t('name')}</Field.Label>
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
                    {t('password')}
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
                  <Field.Label htmlFor="create-role">{t('role')}</Field.Label>
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
                    <option value="PLAYER">Player</option>
                    <option value="HOST">Host</option>
                    <option value={UserRole.ADMIN}>Admin</option>
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
          title={t('editUser')}
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
              <Field.Label htmlFor="edit-email">{t('email')}</Field.Label>
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
                  <Field.Label htmlFor="edit-name">{t('name')}</Field.Label>
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
                  <Field.Label htmlFor="edit-role">{t('role')}</Field.Label>
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
                    <option value={UserRole.PLAYER}>Player</option>
                    <option value={UserRole.HOST}>Host</option>
                    <option value={UserRole.ADMIN}>Admin</option>
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
          title={t('deleteUser')}
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
