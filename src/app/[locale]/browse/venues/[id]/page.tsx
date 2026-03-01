'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Badge,
  Box,
  Flex,
  Grid,
  Heading,
  Image,
  Skeleton,
  Stack,
  Text,
} from '@chakra-ui/react';
import {
  BadgeCheck,
  Banknote,
  Clock,
  Globe,
  LayoutGrid,
  MapPin,
  Navigation,
  Phone,
  Search,
} from 'lucide-react';
import { VenueService } from '@/lib/api/venue.service';
import { Venue } from '@/lib/api/types';
import PageLayout from '@/components/layout/PageLayout';
import { Button, IconButton } from '@/components/ui/chakra-compat';
import { DEFAULT_COVER_PHOTO } from '@/constants';
import { useRouter } from '@/i18n/config';
import { toaster } from '@/components/ui/toaster';

function formatPrice(amount?: number) {
  if (!amount) return null;
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

export default function VenueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, [params.id]);

  const handleNavigate = () => {
    if (!venue) return;
    const query = encodeURIComponent(venue.address || venue.name);
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${query}`,
      '_blank'
    );
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
          <Button
            onClick={() => router.push('/browse/venues')}
            colorPalette="green"
          >
            Quay lại danh sách sân
          </Button>
        </Box>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={venue.name} bg="gray.50" _dark={{ bg: 'gray.900' }}>
      <Box maxW="1200px" mx="auto">
        {/* Cover Photo */}
        <Box
          position="relative"
          h={{ base: '250px', md: '400px' }}
          borderRadius="2xl"
          overflow="hidden"
          mb={6}
          boxShadow="lg"
        >
          <Image
            src={venue.coverPhoto || DEFAULT_COVER_PHOTO}
            alt={venue.name}
            w="100%"
            h="100%"
            objectFit="cover"
          />

          {/* Verified Badge */}
          {venue.isVerified && (
            <Box position="absolute" top={4} right={4}>
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
            </Box>
          )}
        </Box>

        {/* Main Content */}
        <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6} mb={6}>
          {/* Left Column - Details */}
          <Box>
            {/* Header */}
            <Box
              bg="white"
              _dark={{ bg: 'gray.800' }}
              borderRadius="2xl"
              p={6}
              mb={6}
              boxShadow="md"
            >
              <Heading size="2xl" mb={4}>
                {venue.name}
              </Heading>

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
              <Flex align="center" gap={2} mb={6}>
                <MapPin size={20} color="var(--chakra-colors-gray-600)" />
                <Text
                  fontSize="md"
                  color="gray.600"
                  _dark={{ color: 'gray.400' }}
                  flex="1"
                >
                  {venue.address}
                </Text>
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

            {/* Information */}
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
                    <Box flex="1">
                      <Text fontSize="sm" color="gray.500" mb={1}>
                        Giờ mở cửa
                      </Text>
                      <Text fontSize="lg" fontWeight="semibold">
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
              </Stack>
            </Box>
          </Box>

          {/* Right Column - Contact */}
          <Box>
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
                  <a href={`tel:${venue.phone}`}>
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
                          {venue.phone}
                        </Text>
                      </Box>
                    </Flex>
                  </a>
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
          </Box>
        </Grid>
      </Box>
    </PageLayout>
  );
}
