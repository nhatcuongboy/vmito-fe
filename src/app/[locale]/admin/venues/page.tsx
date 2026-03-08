'use client';
import { Input } from '@/components/ui/Input';

import MainLayout from '@/components/layout/MainLayout';
import { toaster } from '@/components/ui/toaster';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRouter } from '@/i18n/config';
import { VenueService } from '@/lib/api/venue.service';
import { UserRole, Venue } from '@/lib/api/types';
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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from '@/components/ui/VTable';
import { useTranslations } from 'next-intl';
import { useEffect, useState, useCallback, Suspense } from 'react';
import {
  Pencil,
  Trash2,
  Plus,
  Search,
  RefreshCcw,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import VModal from '@/components/ui/VModal';
import { useUrlFilters, stringField } from '@/hooks/useUrlFilters';
import { Button } from '@/components/ui/chakra-compat';
import { VButton } from '@/components/ui/VButton';
import { VSwitch } from '@/components/ui/VSwitch';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { VIETNAM_CITIES, getDistrictsByCity } from '@/lib/vietnam-locations';

const PAGE_SIZE = 20;

// Schema definitions
const venueSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  placeId: z.string().min(1, 'Place ID is required'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  district: z.string().min(1, 'District is required'),
  city: z.string().min(1, 'City is required'),
  lat: z.number().optional(),
  lng: z.number().optional(),
  phone: z.string().optional(),
  isVerified: z.boolean(),
  coverPhoto: z.string().optional(),
  images: z.array(z.string()).optional(),
});

type VenueFormValues = z.infer<typeof venueSchema>;

export default function AdminVenuesPage() {
  return (
    <Suspense>
      <AdminVenuesContent />
    </Suspense>
  );
}

function AdminVenuesContent() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { user: currentUser, isAuthenticated, isHydrated } = useAuthStore();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);

  // URL-synced search query
  const [urlFilters, setUrlFilters] = useUrlFilters({ q: stringField('') });
  // Local input state — debounced writes to URL
  const [searchQuery, setSearchQuery] = useState(urlFilters.q);

  // Keep input in sync when URL changes (back/forward)
  useEffect(() => {
    setSearchQuery(urlFilters.q);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlFilters.q]);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

  // Forms
  const form = useForm<VenueFormValues>({
    resolver: zodResolver(venueSchema),
    defaultValues: {
      name: '',
      placeId: '',
      address: '',
      district: '',
      city: '',
      lat: undefined,
      lng: undefined,
      phone: '',
      isVerified: false,
      coverPhoto: '',
      images: [],
    },
  });

  const fetchVenues = useCallback(
    async (targetPage = page) => {
      try {
        setLoading(true);
        const result = await VenueService.searchVenues({
          keyword: urlFilters.q || undefined,
          page: targetPage,
          limit: PAGE_SIZE,
          status: undefined, // admin sees all statuses
        });
        setVenues(result.data);
        setTotalCount(result.pagination.total);
      } catch (error) {
        console.error('Failed to fetch venues:', error);
        toaster.error({ title: t('failedToLoadVenues') });
        setVenues([]);
      } finally {
        setLoading(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [urlFilters.q, page, t]
  );

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
    fetchVenues();
  }, [isHydrated, isAuthenticated, currentUser, router, fetchVenues, t]);

  // Debounce: write keyword to URL 500ms after the user stops typing.
  useEffect(() => {
    const timer = setTimeout(() => {
      setUrlFilters({ q: searchQuery });
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handlePageChange = (next: number) => {
    setPage(next);
    fetchVenues(next);
  };

  const handleCreate = async (data: VenueFormValues) => {
    try {
      await VenueService.createVenue(data);
      toaster.success({ title: t('venueCreatedSuccess') });
      setIsCreateOpen(false);
      form.reset();
      fetchVenues();
    } catch (error) {
      console.error('Failed to create venue:', error);
      toaster.error({ title: t('failedToCreateVenue') });
    }
  };

  const handleUpdate = async (data: VenueFormValues) => {
    if (!selectedVenue) return;
    try {
      await VenueService.updateVenue(selectedVenue.id, data);
      toaster.success({ title: t('venueUpdatedSuccess') });
      setIsEditOpen(false);
      fetchVenues();
    } catch (error) {
      console.error('Failed to update venue:', error);
      toaster.error({ title: t('failedToUpdateVenue') });
    }
  };

  const handleDelete = async () => {
    if (!selectedVenue) return;
    try {
      await VenueService.deleteVenue(selectedVenue.id);
      toaster.success({ title: t('venueDeletedSuccess') });
      setIsDeleteOpen(false);
      fetchVenues();
    } catch (error) {
      console.error('Failed to delete venue:', error);
      toaster.error({ title: t('failedToDeleteVenue') });
    }
  };

  const openEditModal = (venue: Venue) => {
    setSelectedVenue(venue);
    form.reset({
      name: venue.name,
      placeId: venue.placeId,
      address: venue.address,
      district: venue.district || '',
      city: venue.city || '',
      lat: venue.lat,
      lng: venue.lng,
      phone: venue.phone || '',
      isVerified: venue.isVerified ?? false,
      coverPhoto: venue.coverPhoto || '',
      images: venue.images || [],
    });
    setIsEditOpen(true);
  };

  const openDeleteModal = (venue: Venue) => {
    setSelectedVenue(venue);
    setIsDeleteOpen(true);
  };

  if (loading && venues.length === 0) {
    return (
      <MainLayout title={t('venues')}>
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
    <MainLayout title={t('venues')}>
      <Container maxW="container.xl" py={6}>
        <VStack gap={6} align="stretch">
          {/* Header */}
          <Flex justify="space-between" align="center">
            <Heading size="lg">{t('venueManagement')}</Heading>
            <VButton
              colorPalette="green"
              leftIcon={<Plus size={18} />}
              onClick={() => {
                form.reset({
                  name: '',
                  placeId: '',
                  address: '',
                  district: '',
                  city: '',
                  lat: undefined,
                  lng: undefined,
                  phone: '',
                  isVerified: false,
                  coverPhoto: '',
                  images: [],
                });
                setIsCreateOpen(true);
              }}
            >
              {t('addVenue')}
            </VButton>
          </Flex>

          {/* Search Bar */}
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
                placeholder={t('searchPlaceholder')}
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
            <IconButton
              h="36px"
              w="36px"
              minW="36px"
              variant="solid"
              colorPalette="green"
              aria-label="Refresh"
              onClick={() => fetchVenues()}
              borderRadius="md"
              transition="all 0.2s"
              _hover={{ transform: 'scale(1.05)' }}
            >
              <RefreshCcw size={18} />
            </IconButton>
          </Flex>

          {/* Venues Table */}
          <TableContainer>
            <Table>
              <Thead>
                <Tr>
                  <Th>{t('name')}</Th>
                  <Th>{t('address')}</Th>
                  <Th>{t('isVerified')}</Th>
                  <Th textAlign="right">{t('actions')}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {venues.map((venue) => (
                  <Tr key={venue.id}>
                    <Td fontWeight="medium">
                      <HStack gap={2}>
                        <MapPin size={16} color="#179a3b" />
                        <Text>{venue.name}</Text>
                      </HStack>
                    </Td>
                    <Td color="gray.600">
                      <Text fontSize="sm">{venue.address}</Text>
                      {venue.district && venue.city && (
                        <Text fontSize="xs" color="gray.400">
                          {venue.district}, {venue.city}
                        </Text>
                      )}
                    </Td>
                    <Td>
                      <Badge colorPalette={venue.isVerified ? 'green' : 'gray'}>
                        {venue.isVerified ? t('yes') : t('no')}
                      </Badge>
                    </Td>
                    <Td textAlign="right">
                      <HStack gap={2} justify="flex-end">
                        <IconButton
                          aria-label="Edit venue"
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditModal(venue)}
                        >
                          <Pencil size={16} />
                        </IconButton>
                        <IconButton
                          aria-label="Delete venue"
                          size="sm"
                          variant="ghost"
                          colorPalette="red"
                          onClick={() => openDeleteModal(venue)}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>

          {venues.length === 0 && !loading && (
            <Box p={8} textAlign="center" color="gray.500">
              {t('noVenuesFound') || 'No venues found'}
            </Box>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Flex justify="space-between" align="center" pt={2}>
              <Text fontSize="sm" color="gray.500">
                {totalCount} venues &middot; trang {page}/{totalPages}
              </Text>
              <HStack gap={2}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1 || loading}
                >
                  <ChevronLeft size={16} />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages || loading}
                >
                  <ChevronRight size={16} />
                </Button>
              </HStack>
            </Flex>
          )}
        </VStack>

        {/* Create/Edit Venue Modal */}
        <VModal
          isOpen={isCreateOpen || isEditOpen}
          onClose={() => {
            setIsCreateOpen(false);
            setIsEditOpen(false);
          }}
          title={isCreateOpen ? t('createVenue') : t('editVenue')}
          primaryActionText={isCreateOpen ? tCommon('create') : tCommon('save')}
          onPrimaryAction={() =>
            form.handleSubmit((data) =>
              isCreateOpen ? handleCreate(data) : handleUpdate(data)
            )()
          }
          isPrimaryLoading={form.formState.isSubmitting}
          secondaryActionText={tCommon('cancel')}
        >
          <VStack gap={4} as="form">
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field.Root invalid={!!fieldState.error} required>
                  <Field.Label>
                    {t('name')} <Field.RequiredIndicator />
                  </Field.Label>
                  <Input {...field} />
                  <Field.ErrorText>{fieldState.error?.message}</Field.ErrorText>
                </Field.Root>
              )}
            />

            <Controller
              control={form.control}
              name="placeId"
              render={({ field, fieldState }) => (
                <Field.Root invalid={!!fieldState.error} required>
                  <Field.Label>
                    {t('placeId')} <Field.RequiredIndicator />
                  </Field.Label>
                  <Input {...field} placeholder="Google Place ID" />
                  <Field.ErrorText>{fieldState.error?.message}</Field.ErrorText>
                </Field.Root>
              )}
            />

            <Controller
              control={form.control}
              name="address"
              render={({ field, fieldState }) => (
                <Field.Root invalid={!!fieldState.error} required>
                  <Field.Label>
                    {t('address')} <Field.RequiredIndicator />
                  </Field.Label>
                  <Input {...field} />
                  <Field.ErrorText>{fieldState.error?.message}</Field.ErrorText>
                </Field.Root>
              )}
            />

            <Controller
              control={form.control}
              name="phone"
              render={({ field }) => (
                <Field.Root>
                  <Field.Label>{t('phone')}</Field.Label>
                  <Input {...field} placeholder="e.g. +84 123 456 789" />
                </Field.Root>
              )}
            />

            <HStack width="full" gap={4} align="flex-start">
              <Controller
                control={form.control}
                name="city"
                render={({ field, fieldState }) => (
                  <Field.Root flex={1} invalid={!!fieldState.error} required>
                    <Field.Label>
                      {t('city')} <Field.RequiredIndicator />
                    </Field.Label>
                    <SearchableSelect
                      options={VIETNAM_CITIES}
                      value={field.value}
                      onChange={(val) => {
                        field.onChange(val);
                        form.setValue('district', '');
                      }}
                      placeholder={t('city')}
                      isInvalid={!!fieldState.error}
                    />
                    <Field.ErrorText>
                      {fieldState.error?.message}
                    </Field.ErrorText>
                  </Field.Root>
                )}
              />
              <Controller
                control={form.control}
                name="district"
                render={({ field, fieldState }) => {
                  const selectedCity = form.watch('city');
                  const districtOptions = getDistrictsByCity(selectedCity);
                  return (
                    <Field.Root flex={1} invalid={!!fieldState.error} required>
                      <Field.Label>
                        {t('district')} <Field.RequiredIndicator />
                      </Field.Label>
                      <SearchableSelect
                        options={districtOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={
                          selectedCity ? t('district') : 'Chọn thành phố trước'
                        }
                        isDisabled={!selectedCity}
                        isInvalid={!!fieldState.error}
                        noOptionsMessage="Không tìm thấy quận/huyện"
                      />
                      <Field.ErrorText>
                        {fieldState.error?.message}
                      </Field.ErrorText>
                    </Field.Root>
                  );
                }}
              />
            </HStack>

            <HStack width="full" gap={4}>
              <Controller
                control={form.control}
                name="lat"
                render={({ field }) => (
                  <Field.Root flex={1}>
                    <Field.Label>Latitude</Field.Label>
                    <Input
                      {...field}
                      type="number"
                      step="any"
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            ? parseFloat(e.target.value)
                            : undefined
                        )
                      }
                      value={field.value ?? ''}
                    />
                  </Field.Root>
                )}
              />
              <Controller
                control={form.control}
                name="lng"
                render={({ field }) => (
                  <Field.Root flex={1}>
                    <Field.Label>Longitude</Field.Label>
                    <Input
                      {...field}
                      type="number"
                      step="any"
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            ? parseFloat(e.target.value)
                            : undefined
                        )
                      }
                      value={field.value ?? ''}
                    />
                  </Field.Root>
                )}
              />
            </HStack>

            <Controller
              control={form.control}
              name="coverPhoto"
              render={({ field }) => (
                <Field.Root width="full">
                  <Field.Label fontWeight="bold">{t('coverPhoto')}</Field.Label>
                  <VStack align="stretch" gap={3} width="full">
                    <Input
                      {...field}
                      placeholder="Enter cover photo URL..."
                      width="full"
                    />
                    {field.value && (
                      <Box
                        borderRadius="lg"
                        overflow="hidden"
                        borderWidth="1px"
                        borderColor="gray.200"
                        bg="gray.50"
                        _dark={{ borderColor: 'gray.700', bg: 'gray.900' }}
                      >
                        <img
                          src={field.value}
                          alt="Cover preview"
                          style={{
                            width: '100%',
                            maxHeight: '200px',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                          onError={(e) => {
                            (
                              e.target as HTMLImageElement
                            ).parentElement!.style.display = 'none';
                          }}
                        />
                      </Box>
                    )}
                  </VStack>
                </Field.Root>
              )}
            />

            <Controller
              control={form.control}
              name="images"
              render={({ field }) => (
                <Field.Root>
                  <Field.Label fontWeight="bold">{t('images')}</Field.Label>
                  <VStack align="stretch" gap={4}>
                    <VStack align="stretch" gap={3}>
                      {(field.value || []).map((url, index) => (
                        <Box
                          key={index}
                          p={3}
                          borderRadius="lg"
                          borderWidth="1px"
                          borderColor="gray.200"
                          bg="white"
                          _dark={{ borderColor: 'gray.700', bg: 'gray.800' }}
                        >
                          <Flex gap={3} align="start">
                            <Box flex="1">
                              <Input
                                value={url}
                                size="sm"
                                variant="flushed"
                                onChange={(e) => {
                                  const newImages = [...(field.value || [])];
                                  newImages[index] = e.target.value;
                                  field.onChange(newImages);
                                }}
                                placeholder="Paste image URL here..."
                                mb={url ? 2 : 0}
                              />
                            </Box>
                            <IconButton
                              aria-label="Remove image"
                              size="xs"
                              colorPalette="red"
                              variant="ghost"
                              onClick={() => {
                                const newImages = (field.value || []).filter(
                                  (_, i) => i !== index
                                );
                                field.onChange(newImages);
                              }}
                            >
                              <Trash2 size={16} />
                            </IconButton>
                          </Flex>
                          {url && (
                            <Box
                              mt={2}
                              borderRadius="md"
                              overflow="hidden"
                              maxH="120px"
                              bg="gray.50"
                              _dark={{ bg: 'gray.900' }}
                            >
                              <img
                                src={url}
                                alt={`Gallery ${index + 1}`}
                                style={{
                                  width: '100%',
                                  height: '120px',
                                  objectFit: 'cover',
                                }}
                                onError={(e) => {
                                  (
                                    e.target as HTMLImageElement
                                  ).parentElement!.style.display = 'none';
                                }}
                              />
                            </Box>
                          )}
                        </Box>
                      ))}
                    </VStack>
                    <VButton
                      size="sm"
                      variant="outline"
                      colorPalette="brand"
                      leftIcon={<Plus size={16} />}
                      onClick={() =>
                        field.onChange([...(field.value || []), ''])
                      }
                      width="fit-content"
                    >
                      Thêm ảnh
                    </VButton>
                  </VStack>
                </Field.Root>
              )}
            />

            <Controller
              control={form.control}
              name="isVerified"
              render={({ field }) => (
                <VSwitch
                  checked={field.value}
                  onCheckedChange={(details) => field.onChange(details.checked)}
                  label={t('isVerified')}
                  colorPalette="green"
                />
              )}
            />
          </VStack>
        </VModal>

        {/* Delete Confirmation Modal */}
        <VModal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          title={t('deleteVenue')}
          primaryActionText={tCommon('delete')}
          onPrimaryAction={handleDelete}
          primaryColorScheme="red"
          secondaryActionText={tCommon('cancel')}
        >
          <Text>
            {t('deleteConfirmation', { name: selectedVenue?.name || '' })}
          </Text>
        </VModal>
      </Container>
    </MainLayout>
  );
}
