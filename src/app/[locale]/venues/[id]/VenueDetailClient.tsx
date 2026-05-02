'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AppAddressDisplay } from '@/components/common/AppAddressDisplay';
import {
  Badge,
  Box,
  Container,
  Flex,
  Grid,
  Heading,
  HStack,
  Image,
  SimpleGrid,
  Spinner,
  Tabs,
  Text,
  VStack,
} from '@chakra-ui/react';
import {
  BadgeCheck,
  Banknote,
  Bell,
  Car,
  Clock,
  ExternalLink,
  Globe,
  Image as ImageIcon,
  Info,
  LayoutGrid,
  MapPin,
  Phone,
  Search,
  Settings,
  UtensilsCrossed,
  Wifi,
  XCircle,
} from 'lucide-react';
import { ClosureStatus } from '@/lib/api/types';
import { VenueService } from '@/lib/api/venue.service';
import { Venue } from '@/lib/api/types';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/chakra-compat';
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
import VenueMapPin from '@/components/venue/VenueMapPin';

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
  const [activeTab, setActiveTab] = useState('about');

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

  const handleFindSessions = () => {
    if (!venue) return;
    router.push(`/?venueId=${venue.id}`);
  };

  if (loading) {
    return (
      <PageLayout title="Chi tiết sân">
        <Flex justify="center" align="center" minH="400px">
          <Spinner size="xl" colorPalette="green" />
        </Flex>
      </PageLayout>
    );
  }

  if (!venue) {
    return (
      <PageLayout title="Chi tiết sân">
        <Container maxW="container.md" py={16} textAlign="center">
          <Heading mb={4}>Không tìm thấy sân</Heading>
          <Text color="gray.500" mb={6}>
            Sân bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
          </Text>
          <Button onClick={() => router.push('/venues')} colorPalette="green">
            Quay lại danh sách sân
          </Button>
        </Container>
      </PageLayout>
    );
  }

  const venueName = formatVenueName(
    venue.name,
    t('nameFormat', { name: '{name}' })
  );

  const googleMapsUrl = getGoogleMapsUrl({
    address: venue.address,
    name: venueName,
    placeId: venue.placeId,
    lat: venue.lat,
    lng: venue.lng,
  });

  return (
    <PageLayout
      title={
        <HStack gap={2} align="center">
          <Text truncate fontWeight="bold">
            {venueName}
          </Text>
        </HStack>
      }
    >
      {/* Hero Section */}
      <Container maxW="container.xl" px={0}>
        <Box
          position="relative"
          w="full"
          h={{ base: '180px', md: '300px' }}
          borderRadius="2xl"
          overflow="hidden"
          mb={4}
        >
          <Image
            src={venue.coverPhoto || DEFAULT_COVER_PHOTO}
            alt={venueName}
            w="full"
            h="full"
            objectFit="cover"
            fetchPriority="high"
          />
          {/* Gradient overlay */}
          <Box
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            h="100px"
            bgGradient="to-t"
            gradientFrom="blackAlpha.600"
            gradientTo="transparent"
            pointerEvents="none"
          />
          {/* Badges top-right */}
          <Flex
            position="absolute"
            top={4}
            right={4}
            zIndex={2}
            gap={2}
            direction={{ base: 'column', sm: 'row' }}
            align={{ base: 'flex-end', sm: 'center' }}
          >
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
              >
                <BadgeCheck size={16} />
                <Text fontSize="sm">Verified</Text>
              </Badge>
            )}
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
                >
                  <XCircle size={16} />
                  <Text fontSize="sm">
                    {venue.closureStatus === ClosureStatus.PERMANENTLY_CLOSED
                      ? 'Đóng cửa vĩnh viễn'
                      : 'Tạm đóng cửa'}
                  </Text>
                </Badge>
              )}
          </Flex>
        </Box>

        {/* Info Card */}
        <Box
          w="full"
          bg="white"
          _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
          borderRadius="2xl"
          shadow="sm"
          px={{ base: 3, md: 5 }}
          py={{ base: 2, md: 3.5 }}
          borderWidth="1px"
          borderColor="gray.100"
          mb={4}
        >
          <Flex gap={{ base: 3, md: 4 }} align="center">
            <Box
              w="48px"
              h="48px"
              flexShrink={0}
              shadow="sm"
              borderRadius="lg"
              overflow="hidden"
              bg="green.50"
              display="flex"
              alignItems="center"
              justifyContent="center"
              borderWidth="1px"
              borderColor="green.100"
            >
              <MapPin size={24} color="var(--chakra-colors-green-600)" />
            </Box>
            <Box flex="1" minW="0">
              <Heading
                size={{ base: 'lg', md: 'xl' }}
                mb={0}
                letterSpacing="tight"
                lineClamp={1}
              >
                {venueName}
              </Heading>
              {(venue.district || venue.city) && (
                <Text fontSize="sm" color="gray.500" mt={0.5}>
                  {[venue.district, venue.city].filter(Boolean).join(', ')}
                </Text>
              )}
            </Box>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                colorPalette="gray"
                flexShrink={0}
                onClick={() => router.push(`/admin/venues/${venue.id}/edit`)}
              >
                <Settings size={14} />
                Chỉnh sửa
              </Button>
            )}
          </Flex>
        </Box>
      </Container>

      {/* Navigation Tabs & Content */}
      <Container maxW="container.xl" pb={8} px={0}>
        <Tabs.Root
          value={activeTab}
          onValueChange={(e) => setActiveTab(e.value)}
          variant="plain"
        >
          <Tabs.List
            position="sticky"
            top="0"
            zIndex="10"
            bg="white"
            _dark={{ bg: 'gray.900', borderColor: 'gray.800' }}
            shadow="sm"
            borderRadius="2xl"
            p={1.5}
            mb={6}
            gap={1}
            borderWidth="1px"
            borderColor="gray.100"
            overflowX="auto"
            scrollbarWidth="none"
            css={{ '&::-webkit-scrollbar': { display: 'none' } }}
            display="flex"
            flexWrap="nowrap"
          >
            <Tabs.Trigger
              value="about"
              gap={2}
              borderRadius="xl"
              px={5}
              py={2}
              flexShrink={0}
              whiteSpace="nowrap"
              _selected={{ bg: 'green.100', color: 'green.700', shadow: 'sm' }}
              _dark={{ _selected: { bg: 'green.900/40', color: 'green.300' } }}
            >
              <Info size={16} />
              <Text fontSize="sm" fontWeight="semibold">
                Giới thiệu
              </Text>
            </Tabs.Trigger>

            <Tabs.Trigger
              value="photos"
              gap={2}
              borderRadius="xl"
              px={5}
              py={2}
              flexShrink={0}
              whiteSpace="nowrap"
              _selected={{ bg: 'green.100', color: 'green.700', shadow: 'sm' }}
              _dark={{ _selected: { bg: 'green.900/40', color: 'green.300' } }}
            >
              <ImageIcon size={16} />
              <Text fontSize="sm" fontWeight="semibold">
                Hình ảnh
              </Text>
            </Tabs.Trigger>
            <Tabs.Trigger
              value="announcements"
              gap={2}
              borderRadius="xl"
              px={5}
              py={2}
              flexShrink={0}
              whiteSpace="nowrap"
              _selected={{ bg: 'green.100', color: 'green.700', shadow: 'sm' }}
              _dark={{ _selected: { bg: 'green.900/40', color: 'green.300' } }}
            >
              <Bell size={16} />
              <Text fontSize="sm" fontWeight="semibold">
                Thông báo
              </Text>
            </Tabs.Trigger>
          </Tabs.List>

          {/* Grid: 2.3fr / 1fr */}
          <Grid
            templateColumns={{ base: '1fr', lg: '2.3fr 1fr' }}
            gap={6}
            mt={0}
          >
            {/* ── Left column: tab content ── */}
            <Box>
              {/* Tab: Giới thiệu */}
              <Tabs.Content value="about" pt={0}>
                <VStack gap={4} align="stretch">
                  {/* Description */}
                  <Box
                    p={6}
                    bg="white"
                    _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                    borderRadius="2xl"
                    borderWidth="1px"
                    borderColor="gray.100"
                    shadow="sm"
                  >
                    <Heading size="md" mb={4} fontWeight="bold">
                      Giới thiệu về sân
                    </Heading>
                    {venue.description ? (
                      <Box
                        fontSize="md"
                        color="gray.700"
                        _dark={{ color: 'gray.300' }}
                        lineHeight="tall"
                        wordBreak="break-word"
                        dangerouslySetInnerHTML={{ __html: venue.description }}
                        css={{
                          '& p': { marginBottom: '0.75em' },
                          '& p:last-child': { marginBottom: 0 },
                          '& ul, & ol': {
                            paddingLeft: '1.5em',
                            marginBottom: '0.75em',
                          },
                          '& li': { marginBottom: '0.25em' },
                          '& a': {
                            color: 'var(--chakra-colors-green-600)',
                            textDecoration: 'underline',
                          },
                          '& strong, & b': { fontWeight: 'bold' },
                        }}
                      />
                    ) : (
                      <Text fontSize="sm" color="gray.400" fontStyle="italic">
                        Chưa có mô tả về sân này.
                      </Text>
                    )}
                  </Box>

                  {/* Sơ đồ sân */}
                  {venue.courtLayoutImage && (
                    <Box
                      p={6}
                      bg="white"
                      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                      borderRadius="2xl"
                      borderWidth="1px"
                      borderColor="gray.100"
                      shadow="sm"
                    >
                      <Heading size="md" mb={4} fontWeight="bold">
                        Sơ đồ sân
                      </Heading>
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

                  {/* Bảng giá */}
                  {(venue.hourlyRateFixed || venue.hourlyRateWalkIn) && (
                    <Box
                      p={6}
                      bg="white"
                      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                      borderRadius="2xl"
                      borderWidth="1px"
                      borderColor="gray.100"
                      shadow="sm"
                    >
                      <Flex align="center" gap={3} mb={4}>
                        <Box
                          p={2.5}
                          borderRadius="xl"
                          bg="orange.50"
                          _dark={{ bg: 'orange.900/20' }}
                          flexShrink={0}
                        >
                          <Banknote size={20} color="#DD6B20" />
                        </Box>
                        <Heading size="md" fontWeight="bold">
                          Bảng giá
                        </Heading>
                      </Flex>
                      <Flex gap={3} flexWrap="wrap">
                        {venue.hourlyRateFixed && (
                          <Box
                            flex="1"
                            minW="140px"
                            p={4}
                            borderRadius="xl"
                            bg="green.50"
                            _dark={{ bg: 'green.900/20' }}
                            borderWidth="1px"
                            borderColor="green.100"
                          >
                            <Text fontSize="xs" color="gray.500" mb={1}>
                              Giá cố định
                            </Text>
                            <Text
                              fontSize="xl"
                              fontWeight="bold"
                              color="green.600"
                            >
                              {formatPrice(venue.hourlyRateFixed)}
                              <Text
                                as="span"
                                fontSize="sm"
                                fontWeight="normal"
                                color="gray.500"
                              >
                                /h
                              </Text>
                            </Text>
                          </Box>
                        )}
                        {venue.hourlyRateWalkIn && (
                          <Box
                            flex="1"
                            minW="140px"
                            p={4}
                            borderRadius="xl"
                            bg="orange.50"
                            _dark={{ bg: 'orange.900/20' }}
                            borderWidth="1px"
                            borderColor="orange.100"
                          >
                            <Text fontSize="xs" color="gray.500" mb={1}>
                              Giá vãng lai
                            </Text>
                            <Text
                              fontSize="xl"
                              fontWeight="bold"
                              color="orange.600"
                            >
                              {formatPrice(venue.hourlyRateWalkIn)}
                              <Text
                                as="span"
                                fontSize="sm"
                                fontWeight="normal"
                                color="gray.500"
                              >
                                /h
                              </Text>
                            </Text>
                          </Box>
                        )}
                      </Flex>
                    </Box>
                  )}

                  {/* Tiện ích & Quy định */}
                  {(venue.hasCarParking !== undefined ||
                    venue.hasCanteen !== undefined ||
                    venue.wifiName ||
                    venue.bookingPolicy) && (
                    <Box
                      p={6}
                      bg="white"
                      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                      borderRadius="2xl"
                      borderWidth="1px"
                      borderColor="gray.100"
                      shadow="sm"
                    >
                      <Heading size="md" mb={5} fontWeight="bold">
                        Tiện ích & Quy định
                      </Heading>
                      <VStack gap={5} align="stretch">
                        {/* Amenity tags */}
                        {(venue.hasCarParking !== undefined ||
                          venue.hasCanteen !== undefined) && (
                          <Flex gap={2} flexWrap="wrap">
                            {venue.hasCarParking !== undefined && (
                              <Badge
                                colorPalette={
                                  venue.hasCarParking ? 'green' : 'red'
                                }
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
                                Bãi đậu xe
                              </Badge>
                            )}
                            {venue.hasCanteen !== undefined && (
                              <Badge
                                colorPalette={
                                  venue.hasCanteen ? 'green' : 'red'
                                }
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
                                Căn tin
                              </Badge>
                            )}
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
                              flexShrink={0}
                            >
                              <Wifi size={22} color="#0987A0" />
                            </Box>
                            <Box flex="1" minW={0}>
                              <Text fontSize="xs" color="gray.500" mb={0.5}>
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
                              flexShrink={0}
                            >
                              <Info size={22} color="#D69E2E" />
                            </Box>
                            <Box flex="1" minW={0}>
                              <Text fontSize="xs" color="gray.500" mb={0.5}>
                                Chính sách đặt sân
                              </Text>
                              <Text
                                fontSize="md"
                                whiteSpace="pre-wrap"
                                wordBreak="break-word"
                              >
                                {venue.bookingPolicy}
                              </Text>
                            </Box>
                          </Flex>
                        )}
                      </VStack>
                    </Box>
                  )}
                </VStack>
              </Tabs.Content>

              {/* Tab: Hình ảnh */}
              <Tabs.Content value="photos" pt={0}>
                <Box
                  p={6}
                  bg="white"
                  _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                  borderRadius="2xl"
                  borderWidth="1px"
                  borderColor="gray.100"
                  shadow="sm"
                >
                  <Heading size="md" mb={5} fontWeight="bold">
                    Hình ảnh
                  </Heading>
                  {venue.images && venue.images.length > 0 ? (
                    <SimpleGrid columns={{ base: 2, md: 3 }} gap={4}>
                      {venue.images.map((imgUrl, idx) => (
                        <Box
                          key={idx}
                          aspectRatio={1}
                          borderRadius="2xl"
                          overflow="hidden"
                          borderWidth="1px"
                          borderColor="gray.100"
                          _dark={{ borderColor: 'gray.700' }}
                          transition="all 0.2s"
                          _hover={{ shadow: 'lg', transform: 'scale(1.02)' }}
                          cursor="pointer"
                          onClick={() => window.open(imgUrl, '_blank')}
                        >
                          <Image
                            src={imgUrl}
                            alt={`${venueName} - ảnh ${idx + 1}`}
                            w="full"
                            h="full"
                            objectFit="cover"
                            loading="lazy"
                          />
                        </Box>
                      ))}
                    </SimpleGrid>
                  ) : (
                    <Flex
                      direction="column"
                      align="center"
                      justify="center"
                      py={10}
                      color="gray.400"
                      gap={2}
                    >
                      <ImageIcon size={40} strokeWidth={1.2} />
                      <Text fontSize="sm" fontStyle="italic">
                        Chưa có hình ảnh nào.
                      </Text>
                    </Flex>
                  )}
                </Box>
              </Tabs.Content>

              {/* Tab: Thông báo */}
              <Tabs.Content value="announcements" pt={0}>
                <Box
                  p={6}
                  bg="white"
                  _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                  borderRadius="2xl"
                  borderWidth="1px"
                  borderColor="gray.100"
                  shadow="sm"
                >
                  <Heading size="md" mb={5} fontWeight="bold">
                    Thông báo
                  </Heading>
                  <Flex
                    direction="column"
                    align="center"
                    justify="center"
                    py={10}
                    color="gray.400"
                    gap={2}
                  >
                    <Bell size={40} strokeWidth={1.2} />
                    <Text fontSize="sm" fontStyle="italic">
                      Chưa có thông báo nào.
                    </Text>
                  </Flex>
                </Box>
              </Tabs.Content>
            </Box>

            {/* ── Right column: sticky sidebar ── */}
            <Box>
              <VStack gap={5} align="stretch" position="sticky" top="80px">
                {/* Quick Info */}
                <Box
                  bg="white"
                  _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                  borderRadius="2xl"
                  p={5}
                  shadow="sm"
                  borderWidth="1px"
                  borderColor="gray.100"
                >
                  <Heading size="sm" mb={4}>
                    Thông tin nhanh
                  </Heading>
                  <VStack gap={4} align="stretch">
                    {venue.openingHours && (
                      <HStack gap={3}>
                        <Flex
                          w="36px"
                          h="36px"
                          borderRadius="lg"
                          bg="blue.100"
                          _dark={{ bg: 'blue.900' }}
                          align="center"
                          justify="center"
                          flexShrink={0}
                        >
                          <Clock
                            size={18}
                            color="var(--chakra-colors-blue-600)"
                          />
                        </Flex>
                        <Box flex="1">
                          <Text
                            fontSize="xs"
                            color="gray.500"
                            _dark={{ color: 'gray.400' }}
                          >
                            Giờ mở cửa
                          </Text>
                          <Text fontWeight="semibold" fontSize="sm">
                            {venue.openingHours}
                          </Text>
                        </Box>
                      </HStack>
                    )}
                    {venue.numberOfCourts && (
                      <HStack gap={3}>
                        <Flex
                          w="36px"
                          h="36px"
                          borderRadius="lg"
                          bg="green.100"
                          _dark={{ bg: 'green.900' }}
                          align="center"
                          justify="center"
                          flexShrink={0}
                        >
                          <LayoutGrid
                            size={18}
                            color="var(--chakra-colors-green-600)"
                          />
                        </Flex>
                        <Box flex="1">
                          <Text
                            fontSize="xs"
                            color="gray.500"
                            _dark={{ color: 'gray.400' }}
                          >
                            Số sân
                          </Text>
                          <Text fontWeight="semibold" fontSize="sm">
                            {venue.numberOfCourts} sân
                          </Text>
                        </Box>
                      </HStack>
                    )}
                    {!venue.openingHours && !venue.numberOfCourts && (
                      <Text
                        fontSize="xs"
                        color="gray.400"
                        fontStyle="italic"
                        textAlign="center"
                        py={2}
                      >
                        Chưa cập nhật
                      </Text>
                    )}
                  </VStack>
                </Box>

                {/* Tìm kèo */}
                <Box
                  bg="green.50"
                  _dark={{ bg: 'green.900/20', borderColor: 'green.800' }}
                  borderRadius="2xl"
                  p={5}
                  shadow="sm"
                  borderWidth="1px"
                  borderColor="green.100"
                >
                  <Heading size="sm" mb={1} color="green.700">
                    Tìm kèo tại sân này
                  </Heading>
                  <Text fontSize="xs" color="green.600" mb={3}>
                    Khám phá các buổi sinh hoạt đang diễn ra tại sân.
                  </Text>
                  <Button
                    w="full"
                    colorPalette="green"
                    onClick={handleFindSessions}
                  >
                    <Search size={16} />
                    Tìm kèo
                  </Button>
                </Box>

                {/* Location */}
                <Box
                  bg="white"
                  _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                  borderRadius="2xl"
                  p={5}
                  shadow="sm"
                  borderWidth="1px"
                  borderColor="gray.100"
                >
                  <Heading size="sm" mb={3}>
                    Địa điểm
                  </Heading>
                  <Flex align="flex-start" gap={2} mb={2}>
                    <MapPin
                      size={14}
                      color="var(--chakra-colors-gray-500)"
                      style={{ flexShrink: 0, marginTop: 2 }}
                    />
                    <AppAddressDisplay
                      address={venue.address}
                      district={venue.district}
                      newAddress={venue.newAddress}
                      newDistrict={venue.newDistrict}
                      fontSize="sm"
                      color="gray.600"
                    />
                  </Flex>
                  {venue.locatedWithin && (
                    <Text fontSize="xs" color="gray.500" mb={2}>
                      Nằm trong: <strong>{venue.locatedWithin}</strong>
                    </Text>
                  )}
                  {venue.lat && venue.lng && (
                    <Box borderRadius="xl" overflow="hidden" mb={3}>
                      <VenueMapPin
                        lat={venue.lat}
                        lng={venue.lng}
                        height="180px"
                      />
                    </Box>
                  )}
                  {googleMapsUrl && (
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: 'none', display: 'block' }}
                    >
                      <Button variant="outline" w="full" size="sm" isWithinLink>
                        <ExternalLink size={14} />
                        Tìm trên Google Maps
                      </Button>
                    </a>
                  )}
                </Box>

                {/* Contact */}
                {(venue.phone || venue.website) && (
                  <Box
                    bg="white"
                    _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                    borderRadius="2xl"
                    p={5}
                    shadow="sm"
                    borderWidth="1px"
                    borderColor="gray.100"
                  >
                    <Heading size="sm" mb={4}>
                      Liên hệ
                    </Heading>
                    <VStack gap={3} align="stretch">
                      {venue.phone && (
                        <Box>
                          <a href={`tel:${normalizePhoneForTel(venue.phone)}`}>
                            <Flex
                              align="center"
                              gap={3}
                              px={3}
                              py={2.5}
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
                                <Phone size={16} color="#3182CE" />
                              </Box>
                              <Box>
                                <Text fontSize="xs" color="gray.500" mb={0.5}>
                                  Điện thoại
                                </Text>
                                <Text fontSize="sm" fontWeight="semibold">
                                  {trimPhone(venue.phone)}
                                </Text>
                              </Box>
                            </Flex>
                          </a>
                          <Flex gap={2} mt={2}>
                            <Button
                              flex={1}
                              size="sm"
                              colorPalette="blue"
                              variant="subtle"
                              onClick={() =>
                                window.open(
                                  `https://zalo.me/${normalizePhoneForZalo(venue.phone)}`,
                                  '_blank'
                                )
                              }
                            >
                              <Image
                                src="/icons/zalo.png"
                                alt="Zalo"
                                boxSize="14px"
                              />
                              Zalo
                            </Button>
                            <Button
                              flex={1}
                              size="sm"
                              colorPalette="green"
                              variant="subtle"
                              onClick={() =>
                                (window.location.href = `tel:${normalizePhoneForTel(venue.phone)}`)
                              }
                            >
                              <Phone size={14} />
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
                            px={3}
                            py={2.5}
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
                              <Globe size={16} color="#805AD5" />
                            </Box>
                            <Box flex="1" minW={0}>
                              <Text fontSize="xs" color="gray.500" mb={0.5}>
                                Website
                              </Text>
                              <Text
                                fontSize="sm"
                                fontWeight="semibold"
                                lineClamp={1}
                              >
                                {venue.website}
                              </Text>
                            </Box>
                          </Flex>
                        </a>
                      )}
                    </VStack>
                  </Box>
                )}
              </VStack>
            </Box>
          </Grid>
        </Tabs.Root>
      </Container>
    </PageLayout>
  );
}
