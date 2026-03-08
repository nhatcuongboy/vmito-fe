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
  Spinner,
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
} from '@/components/ui/VTable';
import { PasswordInput } from '@/components/ui/password-input';
import { useTranslations } from 'next-intl';
import { useEffect, useState, useCallback } from 'react';
import { Pencil, Trash2, Plus, Search, RefreshCcw } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import VModal from '@/components/ui/VModal';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/chakra-compat';

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
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { user: currentUser, isAuthenticated, isHydrated } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [roleFilter, setRoleFilter] = useState('');

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

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await AdminService.getUsers({
        search: debouncedSearchQuery || undefined,
        role: roleFilter || undefined,
      });
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toaster.error({ title: 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchQuery, roleFilter]);

  useEffect(() => {
    // Wait for auth store to be hydrated from localStorage
    if (!isHydrated) {
      return;
    }

    // If not authenticated, redirect to signin
    if (!isAuthenticated) {
      router.replace('/auth/signin');
      return;
    }

    // Wait until we have the user data
    if (!currentUser) {
      return;
    }

    // Check role after user is loaded
    if (currentUser.role !== UserRole.ADMIN) {
      toaster.error({ title: 'Access denied. Admin only.' });
      router.replace('/dashboard');
      return;
    }

    fetchUsers();
  }, [isHydrated, isAuthenticated, currentUser, router, fetchUsers]);

  const handleCreate = async (data: CreateUserFormValues) => {
    try {
      await AdminService.createUser(data);
      toaster.success({ title: 'User created successfully' });
      setIsCreateOpen(false);
      createForm.reset();
      fetchUsers();
    } catch (error) {
      console.error('Failed to create user:', error);
      toaster.error({ title: 'Failed to create user' });
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
      toaster.success({ title: 'User updated successfully' });
      setIsEditOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
      toaster.error({ title: 'Failed to update user' });
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      await AdminService.deleteUser(selectedUser.id);
      toaster.success({ title: 'User deleted successfully' });
      setIsDeleteOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      toaster.error({ title: 'Failed to delete user' });
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

  if (loading) {
    return (
      <MainLayout title="Admin - Users">
        <Box
          minH="100vh"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Spinner size="xl" />
        </Box>
      </MainLayout>
    );
  }

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
            <Flex
              gap={2}
              align="center"
              bg="white"
              _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
              px={3}
              h="48px"
              borderRadius="lg"
              borderWidth="1px"
              borderColor="gray.200"
              boxShadow="sm"
            >
              <Box flex="1" minW="200px">
                <Input
                  h="36px"
                  placeholder="Search by email or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  bg="white"
                  _dark={{ bg: 'gray.700', borderColor: 'gray.600' }}
                  borderRadius="md"
                  leftElement={<Search size={18} />}
                  _focus={{
                    borderColor: 'brand.500',
                    boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
                    bg: 'white',
                    _dark: { bg: 'gray.600' },
                  }}
                  fontSize="sm"
                  transition="all 0.2s"
                />
              </Box>
              <Box minW="120px">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  style={{
                    height: '36px',
                    padding: '0 12px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    fontSize: '14px',
                    background: 'white',
                  }}
                >
                  <option value="">All Roles</option>
                  <option value={UserRole.ADMIN}>Admin</option>
                  <option value={UserRole.HOST}>Host</option>
                  <option value={UserRole.PLAYER}>Player</option>
                </select>
              </Box>
              <IconButton
                h="36px"
                w="36px"
                minW="36px"
                variant="solid"
                colorPalette="green"
                aria-label="Refresh"
                onClick={fetchUsers}
                borderRadius="md"
                transition="all 0.2s"
                _hover={{ transform: 'scale(1.05)' }}
              >
                <RefreshCcw size={18} />
              </IconButton>
            </Flex>
          </Box>

          {/* Users Table */}
          <TableContainer>
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
            {users.length === 0 && (
              <Box p={8} textAlign="center" color="gray.500">
                No users found
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
