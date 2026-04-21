'use client';
import React, { useState } from 'react';

import { Venue } from '@/lib/api/types';
import {
  Badge,
  Box,
  Flex,
  HStack,
  Image,
  Stack,
  Text,
  Spinner,
} from '@chakra-ui/react';
import {
  BadgeCheck,
  Banknote,
  Clock,
  Globe,
  LayoutGrid,
  MapPin,
  MapPinned,
  Navigation,
  Phone,
  Search,
  Share2,
  ChevronRight,
} from 'lucide-react';
import { Button, IconButton } from '@/components/ui/chakra-compat';
import { useRouter } from '@/i18n/config';
import { DEFAULT_COVER_PHOTO } from '@/constants';
import { useTranslations } from 'next-intl';

import { formatVenueName, getGoogleMapsUrl } from '@/utils';
import {
  normalizePhoneForTel,
  normalizePhoneForZalo,
} from '@/utils/phone-utils';

interface VenueCardProps {
  venue: Venue;
  variant?: 'grid' | 'list';
}

function formatPrice(amount?: number) {
  if (!amount) return null;
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

export default function VenueCard({ venue, variant = 'grid' }: VenueCardProps) {
  const router = useRouter();
  const t = useTranslations('venue');
  const [isLoading, setIsLoading] = useState(false);

  const displayName = formatVenueName(
    venue.name,
    t('nameFormat', { name: '{name}' })
  );

  const handleNavigate = () => {
    const url = getGoogleMapsUrl({
      address: venue.address,
      name: displayName,
      placeId: venue.placeId,
      lat: venue.lat,
      lng: venue.lng,
    });
    if (url) window.open(url, '_blank');
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    router.push(`/venues/${venue.slug || venue.id}`);
    setTimeout(() => setIsLoading(false), 5000);
  };

  const handleFindSessions = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    router.push(`/?venueId=${venue.id}`);
    setTimeout(() => setIsLoading(false), 5000);
  };

  if (variant === 'list') {
    return (
      <Box
        position="relative"
        bg="white"
        _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
        borderRadius="2xl"
        borderWidth="1px"
        borderColor="gray.200"
        overflow="hidden"
        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        _hover={{
          shadow: 'xl',
          transform: 'translateY(-2px)',
          borderColor: 'blue.400',
          _dark: { borderColor: 'blue.500' },
        }}
        cursor="pointer"
        display="flex"
        flexDirection="column"
        w="100%"
        onClick={handleViewDetails}
      >
        {/* Cover Photo (Banner) */}
        <Box position="relative" h="140px" overflow="hidden">
          <Image
            src={venue.coverPhoto || DEFAULT_COVER_PHOTO}
            alt={displayName}
            w="100%"
            h="100%"
            objectFit="cover"
          />

          {/* Badges Overlay */}
          <Box position="absolute" top={3} left={3}>
            <HStack gap={0} borderRadius="full" overflow="hidden">
              <Box
                bg="green.400"
                color="white"
                px={3}
                py={1}
                pl={4}
                display="flex"
                alignItems="center"
                gap={1.5}
                fontSize="xs"
                fontWeight="bold"
              >
                <BadgeCheck size={14} />
                <Text>{t('verified')}</Text>
              </Box>
            </HStack>
          </Box>

          <HStack position="absolute" top={3} right={3} gap={2}>
            <IconButton
              size="sm"
              w="32px"
              h="32px"
              bg="white"
              color="gray.600"
              borderRadius="full"
              shadow="sm"
              aria-label="Navigate"
              onClick={(e) => {
                e.stopPropagation();
                handleNavigate();
              }}
              icon={<MapPinned size={16} />}
              _hover={{ bg: 'gray.50', color: 'green.500' }}
            />
          </HStack>
        </Box>

        {/* Content Row below Banner */}
        <Flex px={4} py={4} gap={4} alignItems="center" position="relative">
          {/* Left Avatar (Logo) */}
          <Box
            w="52px"
            h="52px"
            borderRadius="full"
            overflow="hidden"
            borderWidth="2px"
            borderColor="white"
            _dark={{ borderColor: 'gray.800' }}
            flexShrink={0}
            bg="white"
            shadow="md"
          >
            <Image
              src={venue.coverPhoto || DEFAULT_COVER_PHOTO}
              alt={displayName}
              w="100%"
              h="100%"
              objectFit="cover"
            />
          </Box>

          {/* Center Info */}
          <Box flex="1" minW={0}>
            <Text
              fontWeight="bold"
              fontSize="md"
              lineClamp={1}
              color="green.800"
              _dark={{ color: 'green.300' }}
              letterSpacing="tight"
            >
              {displayName}
            </Text>

            <HStack
              fontSize="sm"
              color="gray.600"
              _dark={{ color: 'gray.400' }}
              mt={0.5}
              gap={1}
            >
              {venue.distance !== undefined && venue.distance !== null && (
                <Text color="orange.500" fontWeight="medium">
                  ({venue.distance}km)
                </Text>
              )}
              <Text lineClamp={1}>{venue.address}</Text>
            </HStack>

            {venue.openingHours && (
              <Flex
                align="center"
                gap={1.5}
                mt={1}
                color="gray.600"
                _dark={{ color: 'gray.400' }}
              >
                <Clock size={14} />
                <Text fontSize="sm" fontWeight="medium">
                  {venue.openingHours}
                </Text>
              </Flex>
            )}
          </Box>

          {/* Right Button */}
          <Button
            size="sm"
            bg="#DEB841"
            color="white"
            fontWeight="bold"
            px={4}
            h="32px"
            fontSize="sm"
            flexShrink={0}
            onClick={handleFindSessions}
            _hover={{ bg: '#C9A332' }}
            shadow="sm"
          >
            {t('findSessions')}
          </Button>
        </Flex>

        {/* Loading Overlay */}
        {isLoading && (
          <Flex
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="whiteAlpha.700"
            _dark={{ bg: 'blackAlpha.700' }}
            justify="center"
            align="center"
            zIndex={10}
          >
            <Spinner color="green.500" size="lg" />
          </Flex>
        )}
      </Box>
    );
  }

  return (
    <Box
      position="relative"
      bg="white"
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="gray.200"
      overflow="hidden"
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      _hover={{
        shadow: '2xl',
        transform: 'translateY(-4px)',
        borderColor: 'blue.400',
        _dark: { borderColor: 'blue.500' },
      }}
      cursor="pointer"
      display="flex"
      flexDirection="column"
      h="100%"
      onClick={handleViewDetails}
    >
      {/* Cover Photo */}
      <Box position="relative" h="140px" overflow="hidden">
        <Image
          src={venue.coverPhoto || DEFAULT_COVER_PHOTO}
          alt={displayName}
          w="100%"
          h="100%"
          objectFit="cover"
        />

        {/* Verified Badge Overlay */}
        {venue.isVerified && (
          <Box position="absolute" top={3} right={3}>
            <Badge
              colorPalette="green"
              variant="solid"
              size="sm"
              borderRadius="full"
              px={2}
              py={0.5}
              display="flex"
              alignItems="center"
              gap={1}
              shadow="md"
            >
              <BadgeCheck size={12} />
              <Text fontSize="xs">{t('verified')}</Text>
            </Badge>
          </Box>
        )}
      </Box>

      {/* Header Section */}
      <Box px={5} pt={5} pb={3}>
        <Flex justify="space-between" align="flex-start" gap={3} mb={3}>
          <Box flex="1" minW={0}>
            <Text
              fontWeight="bold"
              fontSize="xl"
              lineClamp={1}
              color="gray.900"
              _dark={{ color: 'white' }}
              letterSpacing="tight"
              mb={2}
            >
              {displayName}
            </Text>

            {/* Location badges */}
            {(venue.district || venue.city) && (
              <HStack gap={2} mb={2} flexWrap="wrap">
                {venue.district && (
                  <Badge
                    colorPalette="purple"
                    variant="subtle"
                    size="sm"
                    borderRadius="md"
                    display="flex"
                    alignItems="center"
                    gap={1}
                  >
                    <MapPinned size={12} />
                    <Text fontSize="xs">{venue.district}</Text>
                  </Badge>
                )}
                {venue.city && (
                  <Badge
                    colorPalette="cyan"
                    variant="subtle"
                    size="sm"
                    borderRadius="md"
                    fontSize="xs"
                  >
                    {venue.city}
                  </Badge>
                )}
              </HStack>
            )}

            <Flex align="center" gap={1.5}>
              <MapPin
                size={14}
                style={{ flexShrink: 0 }}
                color="var(--chakra-colors-gray-600)"
              />
              <Text
                fontSize="sm"
                lineClamp={2}
                fontWeight="medium"
                flex="1"
                color="gray.600"
                _dark={{ color: 'gray.400' }}
              >
                {venue.address}
              </Text>
              <IconButton
                size="xs"
                colorPalette="green"
                variant="ghost"
                aria-label="Google Maps"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  handleNavigate();
                }}
                icon={<Navigation size={14} />}
              />
            </Flex>
          </Box>

          {/* Distance badge */}
          <HStack gap={2} align="center">
            {venue.distance !== undefined && venue.distance !== null && (
              <Badge
                colorPalette="green"
                variant="surface"
                borderRadius="full"
                px={3}
                py={1.5}
                fontSize="xs"
                fontWeight="bold"
                flexShrink={0}
                display="flex"
                alignItems="center"
                gap={1.5}
                shadow="sm"
              >
                <Navigation size={14} />
                <Text>{venue.distance} km</Text>
              </Badge>
            )}
            <Box
              as={ChevronRight}
              color="gray.400"
              w={5}
              h={5}
              flexShrink={0}
            />
          </HStack>
        </Flex>
      </Box>

      {/* Divider */}
      <Box h="1px" bg="gray.100" _dark={{ bg: 'gray.700' }} mx={5} />

      {/* Info Section */}
      {(venue.openingHours ||
        venue.numberOfCourts ||
        venue.hourlyRateFixed ||
        venue.hourlyRateWalkIn) && (
        <Box px={5} py={4}>
          <Stack gap={3}>
            {/* Opening hours */}
            {venue.openingHours && (
              <Flex align="center" gap={2.5}>
                <Box
                  p={2}
                  borderRadius="lg"
                  bg="blue.50"
                  _dark={{ bg: 'blue.900/20' }}
                >
                  <Clock size={16} color="#3182CE" style={{ flexShrink: 0 }} />
                </Box>
                <Box flex="1">
                  <Text
                    fontSize="xs"
                    color="gray.500"
                    _dark={{ color: 'gray.500' }}
                    mb={0.5}
                  >
                    {t('openingHours')}
                  </Text>
                  <Text
                    fontSize="sm"
                    color="gray.700"
                    _dark={{ color: 'gray.300' }}
                    fontWeight="medium"
                  >
                    {venue.openingHours}
                  </Text>
                </Box>
              </Flex>
            )}

            {/* Number of courts */}
            {venue.numberOfCourts && (
              <Flex align="center" gap={2.5}>
                <Box
                  p={2}
                  borderRadius="lg"
                  bg="green.50"
                  _dark={{ bg: 'green.900/20' }}
                >
                  <LayoutGrid
                    size={16}
                    color="#38A169"
                    style={{ flexShrink: 0 }}
                  />
                </Box>
                <Box flex="1">
                  <Text
                    fontSize="xs"
                    color="gray.500"
                    _dark={{ color: 'gray.500' }}
                    mb={0.5}
                  >
                    {t('availableCourts')}
                  </Text>
                  <Text
                    fontSize="sm"
                    color="gray.700"
                    _dark={{ color: 'gray.300' }}
                    fontWeight="medium"
                  >
                    {venue.numberOfCourts} {t('courts')}
                  </Text>
                </Box>
              </Flex>
            )}

            {/* Pricing */}
            {(venue.hourlyRateFixed || venue.hourlyRateWalkIn) && (
              <Flex align="flex-start" gap={2.5}>
                <Box
                  p={2}
                  borderRadius="lg"
                  bg="orange.50"
                  _dark={{ bg: 'orange.900/20' }}
                >
                  <Banknote
                    size={16}
                    color="#DD6B20"
                    style={{ flexShrink: 0 }}
                  />
                </Box>
                <Box flex="1">
                  <Text
                    fontSize="xs"
                    color="gray.500"
                    _dark={{ color: 'gray.500' }}
                    mb={1}
                  >
                    {t('pricing')}
                  </Text>
                  <Stack gap={1.5}>
                    {venue.hourlyRateFixed && (
                      <Flex align="center" gap={2}>
                        <Badge
                          colorPalette="green"
                          variant="solid"
                          size="sm"
                          borderRadius="md"
                          px={2}
                          py={0.5}
                        >
                          <Text fontSize="xs" fontWeight="bold">
                            {formatPrice(venue.hourlyRateFixed)}/h
                          </Text>
                        </Badge>
                        <Text
                          fontSize="xs"
                          color="gray.600"
                          _dark={{ color: 'gray.400' }}
                        >
                          {t('fixedRate')}
                        </Text>
                      </Flex>
                    )}
                    {venue.hourlyRateWalkIn && (
                      <Flex align="center" gap={2}>
                        <Badge
                          colorPalette="orange"
                          variant="solid"
                          size="sm"
                          borderRadius="md"
                          px={2}
                          py={0.5}
                        >
                          <Text fontSize="xs" fontWeight="bold">
                            {formatPrice(venue.hourlyRateWalkIn)}/h
                          </Text>
                        </Badge>
                        <Text
                          fontSize="xs"
                          color="gray.600"
                          _dark={{ color: 'gray.400' }}
                        >
                          {t('walkInRate')}
                        </Text>
                      </Flex>
                    )}
                  </Stack>
                </Box>
              </Flex>
            )}
          </Stack>
        </Box>
      )}

      {/* Spacer — pushes contact + action buttons to bottom */}
      <Box flex="1" />

      {/* Contact Section */}
      {(venue.phone || venue.website) && (
        <>
          <Box h="1px" bg="gray.100" _dark={{ bg: 'gray.700' }} mx={5} />
          <Box px={5} py={3}>
            <Flex gap={2} justify="flex-end">
              {venue.phone && (
                <IconButton
                  size="sm"
                  colorPalette="green"
                  variant="outline"
                  aria-label={t('call')}
                  shadow="sm"
                  icon={<Phone size={16} />}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    window.location.href = `tel:${normalizePhoneForTel(venue.phone)}`;
                  }}
                />
              )}
              {venue.phone && (
                <IconButton
                  size="sm"
                  colorPalette="blue"
                  variant="outline"
                  aria-label="Zalo"
                  shadow="sm"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    window.open(
                      `https://zalo.me/${normalizePhoneForZalo(venue.phone)}`,
                      '_blank'
                    );
                  }}
                >
                  <Image
                    src="/icons/zalo.png"
                    alt="Zalo"
                    boxSize="16px"
                    flexShrink={0}
                  />
                </IconButton>
              )}
              {venue.website && (
                <IconButton
                  size="sm"
                  colorPalette="purple"
                  variant="outline"
                  aria-label={t('website')}
                  shadow="sm"
                  icon={<Globe size={16} />}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    window.open(venue.website!, '_blank');
                  }}
                />
              )}
              <IconButton
                size="sm"
                colorPalette="gray"
                variant="outline"
                aria-label={t('share')}
                shadow="sm"
                icon={<Share2 size={16} />}
                onClick={async (e: React.MouseEvent) => {
                  e.stopPropagation();
                  const shareData = {
                    title: displayName,
                    url: `${window.location.origin}/venues/${venue.slug || venue.id}`,
                  };
                  try {
                    if (navigator.share) {
                      await navigator.share(shareData);
                    } else {
                      await navigator.clipboard.writeText(shareData.url);
                    }
                  } catch {
                    // user cancelled
                  }
                }}
              />
            </Flex>
          </Box>
        </>
      )}

      {/* Action Buttons */}
      <Box h="1px" bg="gray.100" _dark={{ bg: 'gray.700' }} mx={5} />
      <Box px={5} py={4}>
        <Button
          w="100%"
          variant="solid"
          colorPalette="green"
          size="md"
          onClick={(e) => {
            e.stopPropagation();
            handleFindSessions(e);
          }}
          leftIcon={<Search size={16} />}
          _hover={{
            transform: 'translateY(-2px)',
            shadow: 'lg',
          }}
          transition="all 0.2s"
        >
          {t('findSessionsAtVenue')}
        </Button>
      </Box>

      {/* Loading Overlay */}
      {isLoading && (
        <Flex
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="whiteAlpha.700"
          _dark={{ bg: 'blackAlpha.700' }}
          align="center"
          justify="center"
          zIndex={10}
        >
          <Spinner size="xl" color="green.500" />
        </Flex>
      )}
    </Box>
  );
}
