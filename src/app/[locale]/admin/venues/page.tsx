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
  VTablePagination,
} from '@/components/ui/VTable';
import { useTranslations } from 'next-intl';
import { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { Pencil, Trash2, Plus, MapPin, X } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import VModal from '@/components/ui/VModal';
import {
  useUrlFilters,
  stringField,
  stringArrayField,
} from '@/hooks/useUrlFilters';
import { VButton } from '@/components/ui/VButton';
import { VSwitch } from '@/components/ui/VSwitch';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { VIETNAM_CITIES, getDistrictsByCity } from '@/lib/vietnam-locations';
import { VIETNAM_CITIES as CITY_HIERARCHY } from '@/constants/vietnam-locations';
import BulkCreateVenueModal from '@/components/venue/BulkCreateVenueModal';
import { useDisclosure } from '@/components/ui/ChakraHooks';
import { trimPhone } from '@/utils/phone-utils';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { FilterDrawer } from '@/components/ui/FilterDrawer';
import { FilterChip } from '@/components/ui/FilterChip';

const PAGE_SIZE = 20;

const ADMIN_VENUE_FILTERS_SCHEMA = {
  q: stringField(''),
  city: stringArrayField(),
  district: stringArrayField(),
  isVerified: stringField(''),
};

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

  // URL-synced filters
  const [filters, setFilters] = useUrlFilters(ADMIN_VENUE_FILTERS_SCHEMA);
  // Local input state — debounced writes to URL
  const [keyword, setKeyword] = useState(filters.q);

  // Filter drawer
  const { isOpen: showFilters, onToggle: toggleFilters } = useDisclosure(false);
  const [pendingCities, setPendingCities] = useState<string[]>([]);
  const [pendingDistricts, setPendingDistricts] = useState<string[]>([]);
  const [pendingIsVerified, setPendingIsVerified] = useState('');

  // Stable keys for dependency arrays
  const citiesKey = filters.city.join(',');
  const districtsKey = filters.district.join(',');

  // Keep input in sync when URL changes (back/forward)
  useEffect(() => {
    setKeyword(filters.q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.q]);

  // Sync pending filters when drawer opens
  useEffect(() => {
    if (showFilters) {
      setPendingCities(filters.city);
      setPendingDistricts(filters.district);
      setPendingIsVerified(filters.isVerified);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFilters]);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const {
    isOpen: isBulkOpen,
    onOpen: openBulkOpen,
    onClose: closeBulkOpen,
  } = useDisclosure();
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

        const apiFilters: Record<
          string,
          string | number | boolean | undefined
        > = {
          keyword: filters.q || undefined,
          city:
            filters.city.length === 1
              ? CITY_HIERARCHY.find((c) => c.code === filters.city[0])?.name
              : undefined,
          district:
            filters.district.length === 1 ? filters.district[0] : undefined,
          isVerified:
            filters.isVerified === '1'
              ? true
              : filters.isVerified === '0'
                ? false
                : undefined,
          page: targetPage,
          limit: PAGE_SIZE,
          status: undefined,
        };

        const result = await VenueService.searchVenues(apiFilters);
        let venueData = result.data;

        // Client-side multi-city filter
        if (filters.city.length > 1) {
          venueData = venueData.filter((venue) => {
            const venueCity = venue.city || '';
            return filters.city.some((cityCode) => {
              const cityName = CITY_HIERARCHY.find(
                (c) => c.code === cityCode
              )?.name;
              return (
                venueCity.includes(cityCode) ||
                (cityName && venueCity.includes(cityName))
              );
            });
          });
        }

        // Client-side multi-district filter
        if (filters.district.length > 1) {
          venueData = venueData.filter((venue) => {
            const venueDistrict = venue.district || '';
            return filters.district.some(
              (d) => venueDistrict.toLowerCase() === d.toLowerCase()
            );
          });
        }

        setVenues(venueData);
        setTotalCount(result.pagination.total);
      } catch (error) {
        console.error('Failed to fetch venues:', error);
        toaster.error({ title: t('failedToLoadVenues') });
        setVenues([]);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters.q, citiesKey, districtsKey, filters.isVerified, page, t]
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
      setFilters({ q: keyword });
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handlePageChange = (next: number) => {
    setPage(next);
    fetchVenues(next);
  };

  // Filter helpers
  const activeFilterCount =
    filters.city.length +
    filters.district.length +
    (filters.isVerified ? 1 : 0);

  const availableDistricts = useMemo(() => {
    if (pendingCities.length === 0) return [];
    return CITY_HIERARCHY.filter((city) =>
      pendingCities.includes(city.code)
    ).flatMap((city) => city.districts);
  }, [pendingCities]);

  const togglePendingCity = (cityCode: string) => {
    setPendingCities((prev) =>
      prev.includes(cityCode)
        ? prev.filter((c) => c !== cityCode)
        : [...prev, cityCode]
    );
    setPendingDistricts([]);
  };

  const togglePendingDistrict = (districtName: string) => {
    setPendingDistricts((prev) =>
      prev.includes(districtName)
        ? prev.filter((d) => d !== districtName)
        : [...prev, districtName]
    );
  };

  const handleSubmitFilters = () => {
    setFilters({
      city: pendingCities,
      district: pendingDistricts,
      isVerified: pendingIsVerified,
    });
    setPage(1);
    toggleFilters();
  };

  const handleResetFilters = () => {
    setPendingCities([]);
    setPendingDistricts([]);
    setPendingIsVerified('');
  };

  const removeCity = (cityCode: string) => {
    const nextCities = filters.city.filter((c) => c !== cityCode);
    setFilters({
      city: nextCities,
      ...(nextCities.length === 0 ? { district: [] } : {}),
    });
  };

  const removeDistrict = (districtName: string) => {
    setFilters({
      district: filters.district.filter((d) => d !== districtName),
    });
  };

  const handleCreate = async (data: VenueFormValues) => {
    try {
      const payload = {
        ...data,
        phone: trimPhone(data.phone),
      };
      await VenueService.createVenue(payload);
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
      const payload = {
        ...data,
        phone: trimPhone(data.phone),
      };
      await VenueService.updateVenue(selectedVenue.id, payload);
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

  return (
    <MainLayout title={t('venues')}>
      <Container maxW="container.xl" py={6}>
        <VStack gap={6} align="stretch">
          {/* Header */}
          <Flex justify="space-between" align="center">
            <Heading size="lg">{t('venueManagement')}</Heading>
            <HStack gap={3}>
              <VButton
                variant="outline"
                colorPalette="green"
                leftIcon={<Plus size={18} />}
                onClick={openBulkOpen}
              >
                Tạo Nhanh Bằng Text/Excel
              </VButton>
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
            </HStack>
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
          {!loading &&
            (filters.city.length > 0 ||
              filters.district.length > 0 ||
              filters.isVerified) && (
              <Flex align="center" flexWrap="wrap" gap={2} mb={-2} minH="28px">
                {filters.isVerified && (
                  <FilterChip
                    label={
                      filters.isVerified === '1' ? 'Verified' : 'Unverified'
                    }
                    colorPalette={
                      filters.isVerified === '1' ? 'green' : 'orange'
                    }
                    onRemove={() => setFilters({ isVerified: '' })}
                  />
                )}

                {filters.city.map((cityCode) => {
                  const cityName =
                    CITY_HIERARCHY.find((c) => c.code === cityCode)?.name ??
                    cityCode;
                  return (
                    <FilterChip
                      key={cityCode}
                      label={cityName}
                      colorPalette="green"
                      onRemove={() => removeCity(cityCode)}
                    />
                  );
                })}

                {filters.district.map((districtName) => (
                  <FilterChip
                    key={districtName}
                    label={districtName}
                    colorPalette="purple"
                    onRemove={() => removeDistrict(districtName)}
                  />
                ))}
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
              {/* isVerified Filter */}
              <Box>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color="gray.700"
                  _dark={{ color: 'gray.200' }}
                  mb={3}
                >
                  Trạng thái xác minh
                </Text>
                <Flex gap={2} flexWrap="wrap">
                  {[
                    { value: '', label: 'Tất cả' },
                    { value: '1', label: 'Đã xác minh' },
                    { value: '0', label: 'Chưa xác minh' },
                  ].map((opt) => (
                    <Badge
                      key={opt.value || 'all'}
                      px={4}
                      py={2}
                      borderRadius="lg"
                      cursor="pointer"
                      variant={
                        pendingIsVerified === opt.value ? 'solid' : 'outline'
                      }
                      colorPalette={
                        pendingIsVerified === opt.value ? 'green' : 'gray'
                      }
                      onClick={() => setPendingIsVerified(opt.value)}
                      fontSize="sm"
                      fontWeight="medium"
                      transition="all 0.2s"
                      _hover={{ transform: 'scale(1.05)' }}
                      borderWidth={
                        pendingIsVerified === opt.value ? '0' : '2px'
                      }
                    >
                      {opt.label}
                    </Badge>
                  ))}
                </Flex>
              </Box>

              <Box h="1px" bg="gray.200" _dark={{ bg: 'gray.700' }} />

              {/* City Selection */}
              <Box>
                <Flex justify="space-between" align="center" mb={3}>
                  <HStack gap={2}>
                    <Text
                      fontSize="sm"
                      fontWeight="bold"
                      color="gray.700"
                      _dark={{ color: 'gray.200' }}
                    >
                      Khu vực
                    </Text>
                    {pendingCities.length > 0 && (
                      <Badge
                        size="sm"
                        colorPalette="green"
                        variant="solid"
                        borderRadius="full"
                        px={2}
                      >
                        {pendingCities.length}
                      </Badge>
                    )}
                  </HStack>
                  {pendingCities.length > 0 && (
                    <Box
                      as="button"
                      fontSize="xs"
                      color="red.500"
                      fontWeight="semibold"
                      display="flex"
                      alignItems="center"
                      gap={1}
                      onClick={() => {
                        setPendingCities([]);
                        setPendingDistricts([]);
                      }}
                    >
                      <X size={14} /> Xóa
                    </Box>
                  )}
                </Flex>
                <Flex gap={2} flexWrap="wrap">
                  {CITY_HIERARCHY.map((city) => (
                    <Badge
                      key={city.code}
                      px={4}
                      py={2}
                      borderRadius="lg"
                      cursor="pointer"
                      variant={
                        pendingCities.includes(city.code) ? 'solid' : 'outline'
                      }
                      colorPalette={
                        pendingCities.includes(city.code) ? 'green' : 'gray'
                      }
                      onClick={() => togglePendingCity(city.code)}
                      fontSize="sm"
                      fontWeight="medium"
                      transition="all 0.2s"
                      _hover={{ transform: 'scale(1.05)' }}
                      borderWidth={
                        pendingCities.includes(city.code) ? '0' : '2px'
                      }
                    >
                      {city.name}
                    </Badge>
                  ))}
                </Flex>
              </Box>

              {/* District Selection */}
              {pendingCities.length > 0 && availableDistricts.length > 0 && (
                <Box>
                  <Flex justify="space-between" align="center" mb={3}>
                    <HStack gap={2}>
                      <Text
                        fontSize="sm"
                        fontWeight="bold"
                        color="gray.700"
                        _dark={{ color: 'gray.200' }}
                      >
                        Quận / Huyện
                      </Text>
                      {pendingDistricts.length > 0 && (
                        <Badge
                          size="sm"
                          colorPalette="green"
                          variant="solid"
                          borderRadius="full"
                          px={2}
                        >
                          {pendingDistricts.length}
                        </Badge>
                      )}
                    </HStack>
                    {pendingDistricts.length > 0 && (
                      <Box
                        as="button"
                        fontSize="xs"
                        color="red.500"
                        fontWeight="semibold"
                        display="flex"
                        alignItems="center"
                        gap={1}
                        onClick={() => setPendingDistricts([])}
                      >
                        <X size={14} /> Xóa
                      </Box>
                    )}
                  </Flex>
                  <Flex
                    gap={2}
                    flexWrap="wrap"
                    maxH="120px"
                    overflowY="auto"
                    css={{
                      '&::-webkit-scrollbar': { width: '6px' },
                      '&::-webkit-scrollbar-track': {
                        background: '#f1f1f1',
                        borderRadius: '10px',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: '#888',
                        borderRadius: '10px',
                      },
                    }}
                  >
                    {availableDistricts.map((district) => (
                      <Badge
                        key={district.code}
                        px={3}
                        py={1.5}
                        borderRadius="lg"
                        cursor="pointer"
                        variant={
                          pendingDistricts.includes(district.name)
                            ? 'solid'
                            : 'outline'
                        }
                        colorPalette={
                          pendingDistricts.includes(district.name)
                            ? 'green'
                            : 'gray'
                        }
                        onClick={() => togglePendingDistrict(district.name)}
                        fontSize="sm"
                        fontWeight="medium"
                        transition="all 0.2s"
                        _hover={{ transform: 'scale(1.05)' }}
                        borderWidth={
                          pendingDistricts.includes(district.name) ? '0' : '2px'
                        }
                      >
                        {district.name}
                      </Badge>
                    ))}
                  </Flex>
                </Box>
              )}
            </VStack>
          </FilterDrawer>

          {/* Venues Table */}
          <TableContainer isLoading={loading}>
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
            {venues.length === 0 && !loading && (
              <Box p={8} textAlign="center" color="gray.500">
                {t('noVenuesFound') || 'No venues found'}
              </Box>
            )}
          </TableContainer>

          <VTablePagination
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={PAGE_SIZE}
            isLoading={loading}
            onPageChange={handlePageChange}
          />
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

        {/* Bulk Create Venues Modal */}
        {isBulkOpen && (
          <BulkCreateVenueModal
            isOpen={isBulkOpen}
            onClose={closeBulkOpen}
            onSuccess={fetchVenues}
          />
        )}
      </Container>
    </MainLayout>
  );
}
