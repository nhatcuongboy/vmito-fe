'use client';
import { Input } from '@/components/ui/Input';

import { AppAddressDisplay } from '@/components/common/AppAddressDisplay';
import MainLayout from '@/components/layout/MainLayout';
import { toaster } from '@/components/ui/toaster';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRouter } from '@/i18n/config';
import { VenueService } from '@/lib/api/venue.service';
import {
  UserRole,
  Venue,
  VenueStatus,
  ClosureStatus,
  EImageCategory,
} from '@/lib/api/types';
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
  MenuRoot,
  MenuTrigger,
  MenuContent,
  MenuRadioItemGroup,
  MenuRadioItem,
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
import {
  Pencil,
  Trash2,
  Plus,
  MapPin,
  X,
  Eye,
  ListFilter,
  Star,
  ArrowDownAZ,
} from 'lucide-react';
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
import AppMultiImageUpload, {
  ISessionImage,
} from '@/components/session/AppMultiImageUpload';

const PAGE_SIZE = 20;

const ADMIN_VENUE_FILTERS_SCHEMA = {
  q: stringField(''),
  city: stringArrayField(),
  district: stringArrayField(),
  isVerified: stringField(''),
  status: stringField(''),
  closureStatus: stringField(''),
  sort: stringField('createdAt'), // Default new venues first
  order: stringField('desc'),
};

// Schema definitions
const venueSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  placeId: z.string().min(1, 'Place ID is required'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  district: z.string().min(1, 'District is required'),
  city: z.string().min(1, 'City is required'),
  newAddress: z.string().optional(),
  newDistrict: z.string().optional(),
  newCity: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  phone: z.string().optional(),
  isVerified: z.boolean(),
  coverPhoto: z.string().optional(),
  images: z.array(z.string()).optional(),
  description: z.string().optional(),
  openingHours: z.string().optional(),
  numberOfCourts: z.number().optional(),
  status: z.string().optional(),
  closureStatus: z.string().optional(),
  website: z.string().optional(),
  hourlyRateFixed: z.number().optional(),
  hourlyRateWalkIn: z.number().optional(),
  hasCarParking: z.boolean().optional(),
  hasCanteen: z.boolean().optional(),
  wifiName: z.string().optional(),
  wifiPassword: z.string().optional(),
  bookingPolicy: z.string().optional(),
  locatedWithin: z.string().optional(),
  courtLayoutImage: z.string().optional(),
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
  const [pendingStatus, setPendingStatus] = useState('');
  const [pendingClosureStatus, setPendingClosureStatus] = useState('');

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
      setPendingStatus(filters.status);
      setPendingClosureStatus(filters.closureStatus);
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

  // Venue images state
  const [venueImages, setVenueImages] = useState<ISessionImage[]>([]);
  const [venueBannerIndex, setVenueBannerIndex] = useState(0);

  // Forms
  const form = useForm<VenueFormValues>({
    resolver: zodResolver(venueSchema),
    defaultValues: {
      name: '',
      placeId: '',
      address: '',
      district: '',
      city: '',
      newAddress: '',
      newDistrict: '',
      newCity: '',
      lat: undefined,
      lng: undefined,
      phone: '',
      isVerified: false,
      coverPhoto: '',
      images: [],
      description: '',
      openingHours: '',
      numberOfCourts: undefined,
      status: 'ACTIVE',
      closureStatus: 'OPERATING',
      website: '',
      hourlyRateFixed: undefined,
      hourlyRateWalkIn: undefined,
      hasCarParking: false,
      hasCanteen: false,
      wifiName: '',
      wifiPassword: '',
      bookingPolicy: '',
      locatedWithin: '',
      courtLayoutImage: '',
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
          status: filters.status || undefined,
          closureStatus: filters.closureStatus || undefined,
          sortBy:
            filters.q && filters.sort === 'createdAt'
              ? 'relevance'
              : filters.sort,
          sortOrder: filters.order,
          page: targetPage,
          limit: PAGE_SIZE,
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
    [
      filters.q,
      citiesKey,
      districtsKey,
      filters.isVerified,
      filters.status,
      filters.closureStatus,
      filters.sort,
      filters.order,
      page,
      t,
    ]
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
    (filters.isVerified ? 1 : 0) +
    (filters.status ? 1 : 0) +
    (filters.closureStatus ? 1 : 0);

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
      status: pendingStatus,
      closureStatus: pendingClosureStatus,
    });
    setPage(1);
    toggleFilters();
  };

  const handleResetFilters = () => {
    setPendingCities([]);
    setPendingDistricts([]);
    setPendingIsVerified('');
    setPendingStatus('');
    setPendingClosureStatus('');
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
      // Map venueImages to coverPhoto and images
      const images = venueImages.map((img) => img.url);
      const imagePublicIds = venueImages.map((img) => img.publicId);
      const coverPhoto = venueImages[venueBannerIndex]?.url;
      const coverPhotoPublicId = venueImages[venueBannerIndex]?.publicId;

      const payload = {
        ...data,
        coverPhoto,
        coverPhotoPublicId,
        images,
        imagePublicIds,
        status: data.status as VenueStatus,
        closureStatus: data.closureStatus as ClosureStatus,
        phone: trimPhone(data.phone),
      };
      await VenueService.createVenue(payload as any);
      toaster.success({ title: t('venueCreatedSuccess') });
      setIsCreateOpen(false);
      form.reset();
      setVenueImages([]);
      setVenueBannerIndex(0);
      fetchVenues();
    } catch (error) {
      console.error('Failed to create venue:', error);
      toaster.error({ title: t('failedToCreateVenue') });
    }
  };

  const handleUpdate = async (data: VenueFormValues) => {
    if (!selectedVenue) return;
    try {
      // Map venueImages to coverPhoto and images
      const images = venueImages.map((img) => img.url);
      const imagePublicIds = venueImages.map((img) => img.publicId);
      const coverPhoto = venueImages[venueBannerIndex]?.url;
      const coverPhotoPublicId = venueImages[venueBannerIndex]?.publicId;

      const payload = {
        ...data,
        coverPhoto,
        coverPhotoPublicId,
        images,
        imagePublicIds,
        status: data.status as VenueStatus,
        closureStatus: data.closureStatus as ClosureStatus,
        phone: trimPhone(data.phone),
      };
      await VenueService.updateVenue(selectedVenue.id, payload as any);
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
      newAddress: venue.newAddress || '',
      newDistrict: venue.newDistrict || '',
      newCity: venue.newCity || '',
      lat: venue.lat ?? undefined,
      lng: venue.lng ?? undefined,
      phone: venue.phone || '',
      isVerified: venue.isVerified ?? false,
      coverPhoto: venue.coverPhoto || '',
      images: venue.images || [],
      description: venue.description || '',
      openingHours: venue.openingHours || '',
      numberOfCourts: venue.numberOfCourts ?? undefined,
      status: venue.status || 'ACTIVE',
      closureStatus: venue.closureStatus || 'OPERATING',
      website: venue.website || '',
      hourlyRateFixed: venue.hourlyRateFixed ?? undefined,
      hourlyRateWalkIn: venue.hourlyRateWalkIn ?? undefined,
      hasCarParking: venue.hasCarParking ?? false,
      hasCanteen: venue.hasCanteen ?? false,
      wifiName: venue.wifiName || '',
      wifiPassword: venue.wifiPassword || '',
      bookingPolicy: venue.bookingPolicy || '',
      locatedWithin: venue.locatedWithin || '',
      courtLayoutImage: venue.courtLayoutImage || '',
    });

    // Initialize venueImages from venue data
    const loadedImages: ISessionImage[] = [];

    // Add coverPhoto first if it exists
    if (venue.coverPhoto && venue.coverPhotoPublicId) {
      loadedImages.push({
        url: venue.coverPhoto,
        publicId: venue.coverPhotoPublicId,
      });
    }

    // Add other images
    if (venue.images && venue.imagePublicIds) {
      venue.images.forEach((url, idx) => {
        const publicId = venue.imagePublicIds?.[idx];
        if (
          publicId &&
          !loadedImages.some((img) => img.publicId === publicId)
        ) {
          loadedImages.push({ url, publicId });
        }
      });
    }

    setVenueImages(loadedImages);
    setVenueBannerIndex(0); // coverPhoto is always first
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
                    newAddress: '',
                    newDistrict: '',
                    newCity: '',
                    lat: undefined,
                    lng: undefined,
                    phone: '',
                    isVerified: false,
                    coverPhoto: '',
                    images: [],
                    description: '',
                    openingHours: '',
                    numberOfCourts: undefined,
                    status: 'ACTIVE',
                    closureStatus: 'OPERATING',
                    website: '',
                    hourlyRateFixed: undefined,
                    hourlyRateWalkIn: undefined,
                    hasCarParking: false,
                    hasCanteen: false,
                    wifiName: '',
                    wifiPassword: '',
                    bookingPolicy: '',
                    locatedWithin: '',
                    courtLayoutImage: '',
                  });
                  setVenueImages([]);
                  setVenueBannerIndex(0);
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
              trailing={
                <MenuRoot positioning={{ placement: 'bottom-end' }}>
                  <MenuTrigger asChild>
                    <VButton
                      variant="outline"
                      h="36px"
                      px={3}
                      justifyContent="space-between"
                    >
                      <Flex align="center" gap={2}>
                        {filters.sort === 'createdAt' ? (
                          <ListFilter size={16} />
                        ) : filters.sort === 'relevance' ? (
                          <Star size={16} />
                        ) : (
                          <ArrowDownAZ size={16} />
                        )}
                        <Text fontSize="sm" fontWeight="medium">
                          {filters.sort === 'createdAt'
                            ? 'Mới nhất'
                            : filters.sort === 'relevance'
                              ? 'Phù hợp'
                              : filters.sort === 'numberOfCourts'
                                ? 'Số sân'
                                : 'Tên'}
                        </Text>
                      </Flex>
                    </VButton>
                  </MenuTrigger>
                  <MenuContent minW="180px" zIndex={1100}>
                    <MenuRadioItemGroup
                      value={`${filters.sort}|${filters.order}`}
                      onValueChange={(e) => {
                        const [s, o] = e.value.split('|');
                        setFilters({ sort: s, order: o });
                        setPage(1);
                      }}
                    >
                      <MenuRadioItem value="createdAt|desc">
                        Mới nhất
                      </MenuRadioItem>
                      <MenuRadioItem value="name|asc">Tên (A-Z)</MenuRadioItem>
                      <MenuRadioItem value="name|desc">Tên (Z-A)</MenuRadioItem>
                      <MenuRadioItem value="numberOfCourts|desc">
                        Nhiều sân nhất
                      </MenuRadioItem>
                      {filters.q && (
                        <MenuRadioItem value="relevance|desc">
                          Phù hợp nhất
                        </MenuRadioItem>
                      )}
                    </MenuRadioItemGroup>
                  </MenuContent>
                </MenuRoot>
              }
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
              {/* status Filter */}
              <Box>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color="gray.700"
                  _dark={{ color: 'gray.200' }}
                  mb={3}
                >
                  Trạng thái kinh doanh
                </Text>
                <Flex gap={2} flexWrap="wrap">
                  {[
                    { value: '', label: 'Tất cả' },
                    { value: 'OPERATING', label: 'Đang mở cửa' },
                    { value: 'TEMPORARILY_CLOSED', label: 'Đóng cửa tạm thời' },
                    {
                      value: 'PERMANENTLY_CLOSED',
                      label: 'Đóng cửa vĩnh viễn',
                    },
                  ].map((opt) => (
                    <Badge
                      key={opt.value || 'all'}
                      px={4}
                      py={2}
                      borderRadius="lg"
                      cursor="pointer"
                      variant={
                        pendingClosureStatus === opt.value ? 'solid' : 'outline'
                      }
                      colorPalette={
                        pendingClosureStatus === opt.value ? 'cyan' : 'gray'
                      }
                      onClick={() => setPendingClosureStatus(opt.value)}
                      fontSize="sm"
                      fontWeight="medium"
                      borderWidth={
                        pendingClosureStatus === opt.value ? '0' : '2px'
                      }
                    >
                      {opt.label}
                    </Badge>
                  ))}
                </Flex>
              </Box>

              <Box h="1px" bg="gray.200" _dark={{ bg: 'gray.700' }} />

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
                  <Flex gap={2} flexWrap="wrap">
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
                  <Th>Thông tin</Th>
                  <Th>Địa chỉ</Th>
                  <Th>Quy mô</Th>
                  <Th>Trạng thái</Th>
                  <Th>Ngày tạo</Th>
                  <Th>Hành động</Th>
                </Tr>
              </Thead>
              <Tbody>
                {venues.map((venue) => (
                  <Tr key={venue.id}>
                    <Td fontWeight="medium">
                      <VStack align="flex-start" gap={1}>
                        <HStack gap={2}>
                          <Text fontWeight="bold">{venue.name}</Text>
                          {venue.isVerified && (
                            <Badge
                              colorPalette="green"
                              size="sm"
                              variant="solid"
                              px={1.5}
                              py={0.5}
                            >
                              ✓
                            </Badge>
                          )}
                        </HStack>
                        {venue.phone && (
                          <Text fontSize="xs" color="gray.500">
                            📞 {venue.phone}
                          </Text>
                        )}
                      </VStack>
                    </Td>
                    <Td color="gray.600">
                      <AppAddressDisplay
                        address={venue.address}
                        newAddress={venue.newAddress}
                        fontSize="sm"
                        color="gray.600"
                      />
                    </Td>
                    <Td>
                      <Text fontSize="sm">
                        {venue.numberOfCourts
                          ? `${venue.numberOfCourts} sân`
                          : '-'}
                      </Text>
                    </Td>
                    <Td>
                      <VStack align="flex-start" gap={1}>
                        <Badge
                          colorPalette={
                            venue.status === 'ACTIVE' ? 'green' : 'gray'
                          }
                          size="sm"
                        >
                          {venue.status === 'ACTIVE'
                            ? 'Đang hoạt động'
                            : 'Tạm ngừng'}
                        </Badge>
                        <Badge
                          colorPalette={
                            venue.closureStatus === 'OPERATING'
                              ? 'green'
                              : venue.closureStatus === 'TEMPORARILY_CLOSED'
                                ? 'orange'
                                : 'red'
                          }
                          size="sm"
                          variant="outline"
                        >
                          {venue.closureStatus === 'OPERATING'
                            ? 'Đang mở cửa'
                            : venue.closureStatus === 'TEMPORARILY_CLOSED'
                              ? 'Đóng cửa tạm'
                              : 'Đóng vĩnh viễn'}
                        </Badge>
                      </VStack>
                    </Td>
                    <Td color="gray.500" fontSize="sm">
                      {venue.createdAt
                        ? new Date(venue.createdAt).toLocaleDateString('vi-VN')
                        : '-'}
                    </Td>
                    <Td>
                      <HStack gap={2}>
                        <IconButton
                          aria-label="View venue"
                          size="sm"
                          variant="ghost"
                          colorPalette="blue"
                          onClick={() => {
                            window.open(
                              `/san-cau-long/${venue.slug || venue.id}`,
                              '_blank'
                            );
                          }}
                        >
                          <Eye size={16} />
                        </IconButton>
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

            <HStack width="full" gap={4}>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Field.Root flex={1}>
                    <Field.Label>Trạng thái</Field.Label>
                    <SearchableSelect
                      options={[
                        { value: 'ACTIVE', label: 'Hoạt động' },
                        { value: 'INACTIVE', label: 'Tạm ngừng' },
                      ]}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </Field.Root>
                )}
              />
              <Controller
                control={form.control}
                name="closureStatus"
                render={({ field }) => (
                  <Field.Root flex={1}>
                    <Field.Label>Tình trạng đóng cửa</Field.Label>
                    <SearchableSelect
                      options={[
                        { value: 'OPERATING', label: 'Đang mở cửa' },
                        {
                          value: 'TEMPORARILY_CLOSED',
                          label: 'Đóng cửa tạm thời',
                        },
                        {
                          value: 'PERMANENTLY_CLOSED',
                          label: 'Đóng cửa vĩnh viễn',
                        },
                      ]}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </Field.Root>
                )}
              />
            </HStack>

            <Controller
              control={form.control}
              name="description"
              render={({ field }) => (
                <Field.Root>
                  <Field.Label>Mô tả</Field.Label>
                  <Input {...field} />
                </Field.Root>
              )}
            />

            {/* === Địa chỉ mới (Nghị quyết 60) === */}
            <Text fontWeight="semibold" w="full" color="blue.500" fontSize="sm">
              Địa chỉ mới (Nghị quyết 60) — để trống để hệ thống tự điền
            </Text>

            <Controller
              control={form.control}
              name="newAddress"
              render={({ field }) => (
                <Field.Root>
                  <Field.Label>Địa chỉ mới</Field.Label>
                  <Input
                    {...field}
                    placeholder="VD: Phường Cầu Kiệu, TP Hồ Chí Minh"
                  />
                </Field.Root>
              )}
            />

            <HStack width="full" gap={4}>
              <Controller
                control={form.control}
                name="newDistrict"
                render={({ field }) => (
                  <Field.Root flex={1}>
                    <Field.Label>Phường/Xã mới</Field.Label>
                    <Input {...field} placeholder="VD: Cầu Kiệu" />
                  </Field.Root>
                )}
              />
              <Controller
                control={form.control}
                name="newCity"
                render={({ field }) => (
                  <Field.Root flex={1}>
                    <Field.Label>Tỉnh/Thành phố mới</Field.Label>
                    <Input {...field} placeholder="VD: TP Hồ Chí Minh" />
                  </Field.Root>
                )}
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

            <HStack width="full" gap={4}>
              <Controller
                control={form.control}
                name="openingHours"
                render={({ field }) => (
                  <Field.Root flex={1}>
                    <Field.Label>Giờ hoạt động</Field.Label>
                    <Input {...field} placeholder="VD: 6:00 - 22:00" />
                  </Field.Root>
                )}
              />
              <Controller
                control={form.control}
                name="numberOfCourts"
                render={({ field }) => (
                  <Field.Root flex={1}>
                    <Field.Label>Số lượng sân</Field.Label>
                    <Input
                      {...field}
                      type="number"
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            ? parseInt(e.target.value, 10)
                            : undefined
                        )
                      }
                      value={field.value ?? ''}
                    />
                  </Field.Root>
                )}
              />
            </HStack>

            <HStack width="full" gap={4}>
              <Controller
                control={form.control}
                name="hourlyRateFixed"
                render={({ field }) => (
                  <Field.Root flex={1}>
                    <Field.Label>Giá thuê cố định (VND)</Field.Label>
                    <Input
                      {...field}
                      type="number"
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            ? parseInt(e.target.value, 10)
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
                name="hourlyRateWalkIn"
                render={({ field }) => (
                  <Field.Root flex={1}>
                    <Field.Label>Giá thuê vãng lai (VND)</Field.Label>
                    <Input
                      {...field}
                      type="number"
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            ? parseInt(e.target.value, 10)
                            : undefined
                        )
                      }
                      value={field.value ?? ''}
                    />
                  </Field.Root>
                )}
              />
            </HStack>

            <HStack width="full" gap={4}>
              <Controller
                control={form.control}
                name="website"
                render={({ field }) => (
                  <Field.Root flex={1}>
                    <Field.Label>Website</Field.Label>
                    <Input {...field} />
                  </Field.Root>
                )}
              />
              <Controller
                control={form.control}
                name="locatedWithin"
                render={({ field }) => (
                  <Field.Root flex={1}>
                    <Field.Label>Vị trí trực thuộc</Field.Label>
                    <Input {...field} placeholder="VD: Nhà thi đấu A" />
                  </Field.Root>
                )}
              />
            </HStack>

            <HStack width="full" gap={4}>
              <Controller
                control={form.control}
                name="wifiName"
                render={({ field }) => (
                  <Field.Root flex={1}>
                    <Field.Label>Tên WiFi</Field.Label>
                    <Input {...field} />
                  </Field.Root>
                )}
              />
              <Controller
                control={form.control}
                name="wifiPassword"
                render={({ field }) => (
                  <Field.Root flex={1}>
                    <Field.Label>Mật khẩu WiFi</Field.Label>
                    <Input {...field} />
                  </Field.Root>
                )}
              />
            </HStack>

            <Controller
              control={form.control}
              name="bookingPolicy"
              render={({ field }) => (
                <Field.Root>
                  <Field.Label>Chính sách đặt sân</Field.Label>
                  <Input {...field} />
                </Field.Root>
              )}
            />

            <HStack width="full" gap={4} py={2}>
              <Controller
                control={form.control}
                name="hasCarParking"
                render={({ field }) => (
                  <VSwitch
                    checked={!!field.value}
                    onCheckedChange={(details) =>
                      field.onChange(details.checked)
                    }
                    label="Có bãi đậu ô tô"
                    colorPalette="blue"
                  />
                )}
              />
              <Controller
                control={form.control}
                name="hasCanteen"
                render={({ field }) => (
                  <VSwitch
                    checked={!!field.value}
                    onCheckedChange={(details) =>
                      field.onChange(details.checked)
                    }
                    label="Có căn tin/bán nước"
                    colorPalette="blue"
                  />
                )}
              />
            </HStack>

            <Controller
              control={form.control}
              name="coverPhoto"
              render={({ field }) => (
                <Field.Root width="full">
                  <Field.Label fontWeight="bold">Ảnh sân</Field.Label>
                  <AppMultiImageUpload
                    images={venueImages}
                    bannerIndex={venueBannerIndex}
                    onImagesChange={setVenueImages}
                    onBannerChange={setVenueBannerIndex}
                    maxImages={10}
                    category={EImageCategory.VENUE_COVER}
                    label={null}
                  />
                </Field.Root>
              )}
            />

            <Controller
              control={form.control}
              name="courtLayoutImage"
              render={({ field }) => (
                <Field.Root width="full">
                  <Field.Label fontWeight="bold">
                    Sơ đồ sân (URL hình ảnh)
                  </Field.Label>
                  <VStack align="stretch" gap={3} width="full">
                    <Input
                      {...field}
                      placeholder="Enter court layout image URL..."
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
                          alt="Layout preview"
                          style={{
                            width: '100%',
                            maxHeight: '200px',
                            objectFit: 'contain',
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
