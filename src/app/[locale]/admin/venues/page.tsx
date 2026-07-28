'use client';

import { AppAddressDisplay } from '@/components/common/AppAddressDisplay';
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
  X,
  Eye,
  ListFilter,
  Star,
  ArrowDownAZ,
  ClipboardList,
} from 'lucide-react';
import {
  useUrlFilters,
  stringField,
  stringArrayField,
} from '@/hooks/useUrlFilters';
import { VButton } from '@/components/ui/VButton';
import { VIETNAM_CITIES as CITY_HIERARCHY } from '@/constants/vietnam-locations';
import BulkCreateVenueModal from '@/components/venue/BulkCreateVenueModal';
import { useDisclosure } from '@/components/ui/ChakraHooks';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { FilterDrawer } from '@/components/ui/FilterDrawer';
import { FilterChip } from '@/components/ui/FilterChip';
import VModal from '@/components/ui/VModal';

const ADMIN_VENUE_FILTERS_SCHEMA = {
  q: stringField(''),
  city: stringArrayField(),
  district: stringArrayField(),
  isVerified: stringField(''),
  hasNewAddress: stringField(''),
  status: stringField(''),
  closureStatus: stringField(''),
  sort: stringField('createdAt'),
  order: stringField('desc'),
};

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
  const [pageSize, setPageSize] = useState(20);

  // URL-synced filters
  const [filters, setFilters] = useUrlFilters(ADMIN_VENUE_FILTERS_SCHEMA);
  // Local input state — debounced writes to URL
  const [keyword, setKeyword] = useState(filters.q);

  // Filter drawer
  const { isOpen: showFilters, onToggle: toggleFilters } = useDisclosure(false);
  const [pendingCities, setPendingCities] = useState<string[]>([]);
  const [pendingDistricts, setPendingDistricts] = useState<string[]>([]);
  const [pendingIsVerified, setPendingIsVerified] = useState('');
  const [pendingHasNewAddress, setPendingHasNewAddress] = useState('');
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
      setPendingHasNewAddress(filters.hasNewAddress);
      setPendingStatus(filters.status);
      setPendingClosureStatus(filters.closureStatus);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFilters]);

  // Modal states
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const {
    isOpen: isBulkOpen,
    onOpen: openBulkOpen,
    onClose: closeBulkOpen,
  } = useDisclosure();
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

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
          hasNewAddress:
            filters.hasNewAddress === '1'
              ? true
              : filters.hasNewAddress === '0'
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
          limit: pageSize,
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
      filters.hasNewAddress,
      filters.status,
      filters.closureStatus,
      filters.sort,
      filters.order,
      page,
      pageSize,
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

  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePageChange = (next: number) => {
    setPage(next);
    fetchVenues(next);
  };

  // Filter helpers
  const activeFilterCount =
    filters.city.length +
    filters.district.length +
    (filters.isVerified ? 1 : 0) +
    (filters.hasNewAddress ? 1 : 0) +
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
      hasNewAddress: pendingHasNewAddress,
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
    setPendingHasNewAddress('');
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
                leftIcon={<ClipboardList size={18} />}
                onClick={() => router.push('/admin/venues/requests')}
              >
                {t('venueRequests')}
              </VButton>
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
                onClick={() => router.push('/admin/venues/create')}
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
              filters.hasNewAddress ||
              filters.isVerified) && (
              <Flex align="center" flexWrap="wrap" gap={2} mb={-2} minH="28px">
                {filters.hasNewAddress && (
                  <FilterChip
                    label={
                      filters.hasNewAddress === '1'
                        ? 'Đã có địa chỉ mới'
                        : 'Chưa có địa chỉ mới'
                    }
                    colorPalette={
                      filters.hasNewAddress === '1' ? 'green' : 'orange'
                    }
                    onRemove={() => setFilters({ hasNewAddress: '' })}
                  />
                )}
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

              {/* hasNewAddress Filter */}
              <Box>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color="gray.700"
                  _dark={{ color: 'gray.200' }}
                  mb={3}
                >
                  Trạng thái địa chỉ mới
                </Text>
                <Flex gap={2} flexWrap="wrap">
                  {[
                    { value: '', label: 'Tất cả' },
                    { value: '1', label: 'Đã có' },
                    { value: '0', label: 'Chưa có' },
                  ].map((opt) => (
                    <Badge
                      key={opt.value || 'all'}
                      px={4}
                      py={2}
                      borderRadius="lg"
                      cursor="pointer"
                      variant={
                        pendingHasNewAddress === opt.value ? 'solid' : 'outline'
                      }
                      colorPalette={
                        pendingHasNewAddress === opt.value ? 'green' : 'gray'
                      }
                      onClick={() => setPendingHasNewAddress(opt.value)}
                      fontSize="sm"
                      fontWeight="medium"
                      transition="all 0.2s"
                      _hover={{ transform: 'scale(1.05)' }}
                      borderWidth={
                        pendingHasNewAddress === opt.value ? '0' : '2px'
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
                        district={venue.district}
                        city={venue.city}
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
                          colorPalette="green"
                          onClick={() =>
                            router.push(`/venues/${venue.slug || venue.id}`)
                          }
                        >
                          <Eye size={16} />
                        </IconButton>
                        <IconButton
                          aria-label="Edit venue"
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            router.push(`/admin/venues/${venue.id}/edit`)
                          }
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

          {totalCount > 0 && (
            <VTablePagination
              page={page}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={pageSize}
              isLoading={loading}
              onPageChange={handlePageChange}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setPage(1);
              }}
            />
          )}
        </VStack>

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
