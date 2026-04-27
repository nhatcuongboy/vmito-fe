'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AppAddressDisplay } from '@/components/common/AppAddressDisplay';
import {
  Badge,
  Box,
  Flex,
  Grid,
  GridItem,
  Heading,
  Image,
  Skeleton,
  Stack,
  Text,
} from '@chakra-ui/react';
import {
  BadgeCheck,
  Banknote,
  Car,
  Clock,
  Globe,
  Info,
  LayoutGrid,
  MapPin,
  Navigation,
  Phone,
  Search,
  UtensilsCrossed,
  Wifi,
  XCircle,
} from 'lucide-react';
import { ClosureStatus } from '@/lib/api/types';
import { VenueService } from '@/lib/api/venue.service';
import { Venue } from '@/lib/api/types';
import PageLayout from '@/components/layout/PageLayout';
import { Button, IconButton } from '@/components/ui/chakra-compat';
import { DEFAULT_COVER_PHOTO } from '@/constants';
import { useRouter } from '@/i18n/config';
import { toaster } from '@/components/ui/toaster';
import {
  trimPhone,
  normalizePhoneForTel,
  normalizePhoneForZalo,
} from '@/utils/phone-utils';
import { useAuthStore } from '@/stores/useAuthStore';
import { formatVenueName, getGoogleMapsUrl } from '@/utils';
import { useTranslations } from 'next-intl';
import { Pencil } from 'lucide-react';
import { QuickVenueEditModal } from '@/components/venue/QuickVenueEditModal';

function formatPrice(amount?: number) {
  if (!amount) return null;
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

interface VenueDetailClientProps {
  initialVenue: Venue | null;
}

export default function VenueDetailClient({
  initialVenue,
}: VenueDetailClientProps) {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('venue');
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const [venue, setVenue] = useState<Venue | null>(initialVenue);
  const [loading, setLoading] = useState(!initialVenue);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const DESC_LINE_LIMIT = 4;

  useEffect(() => {
    if (initialVenue) return;

    const fetchVenue = async () => {
      try {
        setLoading(true);
        const id = params.id as string;
        const data = await VenueService.getVenue(id);
        setVenue(data);
      } catch (error) {
        console.error('Failed to fetch venue:', error);
        toaster.error({
          title: 'Không thể tải thông tin sân',
          description: 'Vui lòng thử lại sau.',
        });
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchVenue();
    }
  }, [params.id, initialVenue]);

  const handleNavigate = () => {
    if (!venue) return;
    const url = getGoogleMapsUrl({
      address: venue.address,
      name: formatVenueName(venue.name, t('nameFormat', { name: '{name}' })),
      placeId: venue.placeId,
      lat: venue.lat,
      lng: venue.lng,
    });
    if (url) window.open(url, '_blank');
  };

  const handleFindSessions = () => {
    if (!venue) return;
    router.push(`/?venueId=${venue.id}`);
  };

  if (loading) {
    return (
      <PageLayout title="Chi tiết sân" icon={<MapPin size={24} />}>
        <Box maxW="1200px" mx="auto">
          <Skeleton height="400px" borderRadius="2xl" mb={6} />
          <Stack gap={4}>
            <Skeleton height="40px" />
            <Skeleton height="100px" />
            <Skeleton height="200px" />
          </Stack>
        </Box>
      </PageLayout>
    );
  }

  if (!venue) {
    return (
      <PageLayout title="Chi tiết sân" icon={<MapPin size={24} />}>
        <Box
          maxW="600px"
          mx="auto"
          textAlign="center"
          py={10}
          px={6}
          borderWidth="1px"
          borderRadius="lg"
          bg="white"
          _dark={{ bg: 'gray.800' }}
        >
          <Heading size="md" mb={2}>
            Không tìm thấy sân
          </Heading>
          <Text color="gray.500" mb={4}>
            Sân bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
          </Text>
          <Button onClick={() => router.push('/venues')} colorPalette="green">
            Quay lại danh sách sân
          </Button>
        </Box>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={formatVenueName(venue.name, t('nameFormat', { name: '{name}' }))}
      bg="gray.50"
      _dark={{ bg: 'gray.900' }}
    >
      <Box maxW="1200px" mx="auto">
        {/* Cover Photo */}
        <Box
          position="relative"
          h={{ base: '200px', md: '240px' }}
          borderRadius="2xl"
          overflow="hidden"
          mb={6}
          boxShadow="lg"
        >
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="blackAlpha.300"
            zIndex={1}
            pointerEvents="none"
          />
          <Image
            src={venue.coverPhoto || DEFAULT_COVER_PHOTO}
            alt={formatVenueName(
              venue.name,
              t('nameFormat', { name: '{name}' })
            )}
            w="100%"
            h="100%"
            objectFit="cover"
            fetchPriority="high"
          />

          <Flex
            position="absolute"
            top={4}
            right={4}
            zIndex={2}
            gap={2}
            direction={{ base: 'column', sm: 'row' }}
            align={{ base: 'flex-end', sm: 'center' }}
          >
            {/* Verified Badge */}
            {venue.isVerified && (
              <Badge
                colorPalette="green"
                variant="solid"
                size="lg"
                borderRadius="full"
                px={4}
                py={2}
                display="flex"
                alignItems="center"
                gap={2}
                shadow="lg"
                fontSize="md"
              >
                <BadgeCheck size={20} />
                <Text>Verified</Text>
              </Badge>
            )}

            {/* Closure Status Badge */}
            {venue.closureStatus &&
              venue.closureStatus !== ClosureStatus.OPERATING && (
                <Badge
                  colorPalette={
                    venue.closureStatus === ClosureStatus.PERMANENTLY_CLOSED
                      ? 'red'
                      : 'orange'
                  }
                  variant="solid"
                  size="lg"
                  borderRadius="full"
                  px={4}
                  py={2}
                  display="flex"
                  alignItems="center"
                  gap={2}
                  shadow="lg"
                  fontSize="md"
                >
                  <XCircle size={20} />
                  <Text>
                    {venue.closureStatus === ClosureStatus.PERMANENTLY_CLOSED
                      ? 'Đóng cửa vĩnh viễn'
                      : 'Tạm đóng cửa'}
                  </Text>
                </Badge>
              )}

            {/* Edit Button inside Banner */}
            {isAdmin && (
              <Button
                colorPalette="white"
                variant="solid"
                bg="white"
                color="gray.800"
                size="sm"
                shadow="lg"
                _hover={{ bg: 'gray.100' }}
                onClick={() => setIsEditModalOpen(true)}
                leftIcon={<Pencil size={16} />}
                borderRadius="full"
              >
                Chỉnh sửa sân
              </Button>
            )}
          </Flex>
        </Box>

        {/* Main Content */}
        <Grid
          templateColumns={{ base: '1fr', lg: '2fr 1fr' }}
          templateAreas={{
            base: `
              "header"
              "contact"
              "info"
            `,
            lg: `
              "header contact"
              "info contact"
            `,
          }}
          gap={6}
          mb={6}
        >
          {/* Header */}
          <GridItem gridArea="header">
            <Box
              bg="white"
              _dark={{ bg: 'gray.800' }}
              borderRadius="2xl"
              p={6}
              boxShadow="md"
            >
              <Box mb={4}>
                <Heading size="2xl">
                  {formatVenueName(
                    venue.name,
                    t('nameFormat', { name: '{name}' })
                  )}
                </Heading>
                {venue.description && (
                  <Box mt={2}>
                    <Text
                      fontSize="md"
                      color="gray.600"
                      _dark={{ color: 'gray.400' }}
                      whiteSpace="pre-wrap"
                      wordBreak="break-word"
                      lineClamp={isDescExpanded ? undefined : DESC_LINE_LIMIT}
                    >
                      {venue.description}
                    </Text>
                    {venue.description.split('\n').length > DESC_LINE_LIMIT ||
                    venue.description.length > 200 ? (
                      <Text
                        as="button"
                        mt={1}
                        fontSize="sm"
                        color="green.500"
                        fontWeight="medium"
                        cursor="pointer"
                        _hover={{ color: 'green.600' }}
                        onClick={() => setIsDescExpanded((v) => !v)}
                      >
                        {isDescExpanded ? 'Thu gọn' : 'Xem thêm'}
                      </Text>
                    ) : null}
                  </Box>
                )}
              </Box>

              {/* Location */}
              {(venue.district || venue.city) && (
                <Flex gap={2} mb={4} flexWrap="wrap">
                  {venue.district && (
                    <Badge
                      colorPalette="purple"
                      variant="subtle"
                      size="lg"
                      borderRadius="lg"
                      px={3}
                      py={1.5}
                    >
                      {venue.district}
                    </Badge>
                  )}
                  {venue.city && (
                    <Badge
                      colorPalette="cyan"
                      variant="subtle"
                      size="lg"
                      borderRadius="lg"
                      px={3}
                      py={1.5}
                    >
                      {venue.city}
                    </Badge>
                  )}
                </Flex>
              )}

              {/* Address */}
              <Flex align="flex-start" gap={2} mb={6}>
                <MapPin size={20} color="var(--chakra-colors-gray-600)" />
                <Box flex="1">
                  <AppAddressDisplay
                    address={venue.address}
                    district={venue.district}
                    newAddress={venue.newAddress}
                    newDistrict={venue.newDistrict}
                    fontSize="md"
                    color="gray.600"
                  />
                </Box>
                <IconButton
                  size="md"
                  colorPalette="green"
                  variant="outline"
                  aria-label="Google Maps"
                  onClick={handleNavigate}
                  icon={<Navigation size={18} />}
                />
              </Flex>

              {/* Find Sessions Button */}
              <Button
                w="full"
                size="lg"
                colorPalette="green"
                onClick={handleFindSessions}
                leftIcon={<Search size={20} />}
              >
                Tìm kèo tại sân này
              </Button>
            </Box>
          </GridItem>

          {/* Information */}
          <GridItem gridArea="info">
            <Box
              bg="white"
              _dark={{ bg: 'gray.800' }}
              borderRadius="2xl"
              p={6}
              boxShadow="md"
            >
              <Heading size="lg" mb={4}>
                Thông tin
              </Heading>

              <Stack gap={4}>
                {/* Opening Hours */}
                {venue.openingHours && (
                  <Flex align="center" gap={4}>
                    <Box
                      p={3}
                      borderRadius="xl"
                      bg="blue.50"
                      _dark={{ bg: 'blue.900/20' }}
                    >
                      <Clock size={24} color="#3182CE" />
                    </Box>
                    <Box flex="1" minW={0}>
                      <Text fontSize="sm" color="gray.500" mb={1}>
                        Giờ mở cửa
                      </Text>
                      <Text
                        fontSize="lg"
                        fontWeight="semibold"
                        wordBreak="break-word"
                      >
                        {venue.openingHours}
                      </Text>
                    </Box>
                  </Flex>
                )}

                {/* Number of Courts */}
                {venue.numberOfCourts && (
                  <Flex align="center" gap={4}>
                    <Box
                      p={3}
                      borderRadius="xl"
                      bg="green.50"
                      _dark={{ bg: 'green.900/20' }}
                    >
                      <LayoutGrid size={24} color="#38A169" />
                    </Box>
                    <Box flex="1">
                      <Text fontSize="sm" color="gray.500" mb={1}>
                        Số sân
                      </Text>
                      <Text fontSize="lg" fontWeight="semibold">
                        {venue.numberOfCourts} sân
                      </Text>
                    </Box>
                  </Flex>
                )}

                {/* Pricing */}
                {(venue.hourlyRateFixed || venue.hourlyRateWalkIn) && (
                  <Flex align="flex-start" gap={4}>
                    <Box
                      p={3}
                      borderRadius="xl"
                      bg="orange.50"
                      _dark={{ bg: 'orange.900/20' }}
                    >
                      <Banknote size={24} color="#DD6B20" />
                    </Box>
                    <Box flex="1">
                      <Text fontSize="sm" color="gray.500" mb={2}>
                        Giá thuê sân
                      </Text>
                      <Stack gap={2}>
                        {venue.hourlyRateFixed && (
                          <Flex align="center" gap={3}>
                            <Badge
                              colorPalette="green"
                              variant="solid"
                              size="lg"
                              borderRadius="lg"
                              px={3}
                              py={1.5}
                            >
                              <Text fontSize="md" fontWeight="bold">
                                {formatPrice(venue.hourlyRateFixed)}/h
                              </Text>
                            </Badge>
                            <Text fontSize="sm" color="gray.600">
                              Giá cố định
                            </Text>
                          </Flex>
                        )}
                        {venue.hourlyRateWalkIn && (
                          <Flex align="center" gap={3}>
                            <Badge
                              colorPalette="orange"
                              variant="solid"
                              size="lg"
                              borderRadius="lg"
                              px={3}
                              py={1.5}
                            >
                              <Text fontSize="md" fontWeight="bold">
                                {formatPrice(venue.hourlyRateWalkIn)}/h
                              </Text>
                            </Badge>
                            <Text fontSize="sm" color="gray.600">
                              Giá vãng lai
                            </Text>
                          </Flex>
                        )}
                      </Stack>
                    </Box>
                  </Flex>
                )}

                {/* Located Within */}
                {venue.locatedWithin && (
                  <Flex align="center" gap={4}>
                    <Box
                      p={3}
                      borderRadius="xl"
                      bg="teal.50"
                      _dark={{ bg: 'teal.900/20' }}
                    >
                      <Info size={24} color="#319795" />
                    </Box>
                    <Box flex="1" minW={0}>
                      <Text fontSize="sm" color="gray.500" mb={1}>
                        Nằm trong
                      </Text>
                      <Text
                        fontSize="lg"
                        fontWeight="semibold"
                        wordBreak="break-word"
                      >
                        {venue.locatedWithin}
                      </Text>
                    </Box>
                  </Flex>
                )}

                {/* Amenities */}
                {(venue.hasCarParking !== undefined ||
                  venue.hasCanteen !== undefined) && (
                  <Flex align="flex-start" gap={4}>
                    <Box
                      p={3}
                      borderRadius="xl"
                      bg="purple.50"
                      _dark={{ bg: 'purple.900/20' }}
                    >
                      <Car size={24} color="#805AD5" />
                    </Box>
                    <Box flex="1">
                      <Text fontSize="sm" color="gray.500" mb={2}>
                        Tiện ích
                      </Text>
                      <Flex gap={2} flexWrap="wrap">
                        {venue.hasCarParking !== undefined && (
                          <Badge
                            colorPalette={venue.hasCarParking ? 'green' : 'red'}
                            variant="subtle"
                            size="lg"
                            borderRadius="lg"
                            px={3}
                            py={1.5}
                            display="flex"
                            alignItems="center"
                            gap={1.5}
                          >
                            <Car size={14} />
                            <Text>Bãi đậu xe</Text>
                          </Badge>
                        )}
                        {venue.hasCanteen !== undefined && (
                          <Badge
                            colorPalette={venue.hasCanteen ? 'green' : 'red'}
                            variant="subtle"
                            size="lg"
                            borderRadius="lg"
                            px={3}
                            py={1.5}
                            display="flex"
                            alignItems="center"
                            gap={1.5}
                          >
                            <UtensilsCrossed size={14} />
                            <Text>Căn tin</Text>
                          </Badge>
                        )}
                      </Flex>
                    </Box>
                  </Flex>
                )}

                {/* WiFi */}
                {venue.wifiName && (
                  <Flex align="center" gap={4}>
                    <Box
                      p={3}
                      borderRadius="xl"
                      bg="cyan.50"
                      _dark={{ bg: 'cyan.900/20' }}
                    >
                      <Wifi size={24} color="#0987A0" />
                    </Box>
                    <Box flex="1" minW={0}>
                      <Text fontSize="sm" color="gray.500" mb={1}>
                        WiFi
                      </Text>
                      <Text
                        fontSize="md"
                        fontWeight="semibold"
                        wordBreak="break-all"
                      >
                        {venue.wifiName}
                      </Text>
                      {venue.wifiPassword && (
                        <Text
                          fontSize="sm"
                          color="gray.500"
                          wordBreak="break-all"
                        >
                          Mật khẩu: {venue.wifiPassword}
                        </Text>
                      )}
                    </Box>
                  </Flex>
                )}

                {/* Booking Policy */}
                {venue.bookingPolicy && (
                  <Flex align="flex-start" gap={4}>
                    <Box
                      p={3}
                      borderRadius="xl"
                      bg="yellow.50"
                      _dark={{ bg: 'yellow.900/20' }}
                    >
                      <Info size={24} color="#D69E2E" />
                    </Box>
                    <Box flex="1" minW={0}>
                      <Text fontSize="sm" color="gray.500" mb={1}>
                        Chính sách đặt sân
                      </Text>
                      <Text
                        fontSize="md"
                        whiteSpace="pre-wrap"
                        wordBreak="break-word"
                        maxH="160px"
                        overflowY="auto"
                      >
                        {venue.bookingPolicy}
                      </Text>
                    </Box>
                  </Flex>
                )}

                {/* Court Layout */}
                {venue.courtLayoutImage && (
                  <Box>
                    <Text fontSize="sm" color="gray.500" mb={2}>
                      Sơ đồ sân
                    </Text>
                    <Box
                      borderRadius="xl"
                      overflow="hidden"
                      borderWidth="1px"
                      borderColor="gray.200"
                      _dark={{ borderColor: 'gray.600' }}
                      cursor="pointer"
                      onClick={() =>
                        window.open(venue.courtLayoutImage, '_blank')
                      }
                    >
                      <Image
                        src={venue.courtLayoutImage}
                        alt="Sơ đồ sân"
                        w="100%"
                        objectFit="contain"
                        maxH="320px"
                        loading="lazy"
                      />
                    </Box>
                  </Box>
                )}
              </Stack>
            </Box>
          </GridItem>

          {/* Right Column - Contact */}
          <GridItem gridArea="contact">
            <Box
              bg="white"
              _dark={{ bg: 'gray.800' }}
              borderRadius="2xl"
              p={6}
              boxShadow="md"
              position="sticky"
              top={6}
            >
              <Heading size="lg" mb={4}>
                Liên hệ
              </Heading>

              <Stack gap={3}>
                {venue.phone && (
                  <Box>
                    <a href={`tel:${normalizePhoneForTel(venue.phone)}`}>
                      <Flex
                        align="center"
                        gap={3}
                        px={4}
                        py={3}
                        borderRadius="xl"
                        bg="gray.50"
                        _dark={{ bg: 'gray.700' }}
                        _hover={{
                          bg: 'blue.50',
                          _dark: { bg: 'blue.900/30' },
                        }}
                        transition="all 0.2s"
                        cursor="pointer"
                      >
                        <Box
                          p={2}
                          borderRadius="lg"
                          bg="blue.100"
                          _dark={{ bg: 'blue.900/40' }}
                        >
                          <Phone size={20} color="#3182CE" />
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="gray.500" mb={0.5}>
                            Điện thoại
                          </Text>
                          <Text fontSize="md" fontWeight="semibold">
                            {trimPhone(venue.phone)}
                          </Text>
                        </Box>
                      </Flex>
                    </a>

                    <Flex gap={2} mt={3}>
                      <Button
                        flex={1}
                        size="md"
                        colorPalette="blue"
                        variant="subtle"
                        onClick={() =>
                          window.open(
                            `https://zalo.me/${normalizePhoneForZalo(venue.phone)}`,
                            '_blank'
                          )
                        }
                        leftIcon={
                          <Image
                            src="/icons/zalo.png"
                            alt="Zalo"
                            boxSize="16px"
                          />
                        }
                      >
                        Zalo
                      </Button>
                      <Button
                        flex={1}
                        size="md"
                        colorPalette="green"
                        variant="subtle"
                        onClick={() =>
                          (window.location.href = `tel:${normalizePhoneForTel(venue.phone)}`)
                        }
                        leftIcon={<Phone size={16} />}
                      >
                        Gọi ngay
                      </Button>
                    </Flex>
                  </Box>
                )}

                {venue.website && (
                  <a
                    href={venue.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Flex
                      align="center"
                      gap={3}
                      px={4}
                      py={3}
                      borderRadius="xl"
                      bg="gray.50"
                      _dark={{ bg: 'gray.700' }}
                      _hover={{
                        bg: 'purple.50',
                        _dark: { bg: 'purple.900/30' },
                      }}
                      transition="all 0.2s"
                      cursor="pointer"
                    >
                      <Box
                        p={2}
                        borderRadius="lg"
                        bg="purple.100"
                        _dark={{ bg: 'purple.900/40' }}
                      >
                        <Globe size={20} color="#805AD5" />
                      </Box>
                      <Box flex="1" minW={0}>
                        <Text fontSize="xs" color="gray.500" mb={0.5}>
                          Website
                        </Text>
                        <Text fontSize="md" fontWeight="semibold" lineClamp={1}>
                          {venue.website}
                        </Text>
                      </Box>
                    </Flex>
                  </a>
                )}

                {!venue.phone && !venue.website && (
                  <Text color="gray.500" textAlign="center" py={4}>
                    Không có thông tin liên hệ
                  </Text>
                )}
              </Stack>
            </Box>
          </GridItem>
        </Grid>
      </Box>

      {isAdmin && isEditModalOpen && (
        <QuickVenueEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          venue={venue}
          onUpdated={(updatedVenue) => setVenue(updatedVenue)}
        />
      )}
    </PageLayout>
  );
}
