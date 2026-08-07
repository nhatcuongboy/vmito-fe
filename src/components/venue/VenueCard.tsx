'use client';
import React, { useState } from 'react';

import { Venue } from '@/lib/api/types';
import { AppAddressDisplay } from '@/components/common/AppAddressDisplay';
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
import { useAuthStore } from '@/stores/useAuthStore';
import { normalizeImageUrl } from '@/lib/images/normalizeImageUrl';
import { BROWSE_CARD_COVER_TRANSFORM } from '@/lib/images/coverTransforms';

import { formatVenueName, getGoogleMapsUrl } from '@/utils';
import { UserRole } from '@/lib/api/types';
import {
  normalizePhoneForTel,
  normalizePhoneForZalo,
} from '@/utils/phone-utils';
import { FavoriteButton } from '@/components/favorites/FavoriteButton';

interface VenueCardProps {
  venue: Venue;
  variant?: 'grid' | 'list';
  onFavoriteChange?: (venueId: string, isFavorite: boolean) => void;
  showVerifiedBadge?: boolean;
  imagePriority?: boolean;
}

function formatPrice(amount?: number) {
  if (!amount) return null;
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

export default function VenueCard({
  venue,
  variant = 'grid',
  onFavoriteChange,
  showVerifiedBadge = true,
  imagePriority = false,
}: VenueCardProps) {
  const router = useRouter();
  const t = useTranslations('venue');
  const tAdmin = useTranslations('admin');
  const userRole = useAuthStore((state) => state.user?.role);
  const [isLoading, setIsLoading] = useState(false);
  const showAdminVerifiedBadge =
    showVerifiedBadge && userRole === UserRole.ADMIN && venue.isVerified;

  const displayName = formatVenueName(
    venue.name,
    t('nameFormat', { name: '{name}' })
  );

  // Use the old district/city as a pair, or the new ward/city as a pair —
  // never mix one old field with one new field (e.g. stale old district
  // next to a freshly-set new city), which per-field fallback would allow.
  const usingOldLocation = !!(venue.district || venue.city);
  const badgeDistrict = usingOldLocation ? venue.district : venue.newDistrict;
  const badgeCity = usingOldLocation ? venue.city : venue.newCity;

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
            src={
              normalizeImageUrl(
                venue.coverPhoto,
                BROWSE_CARD_COVER_TRANSFORM
              ) || DEFAULT_COVER_PHOTO
            }
            alt={displayName}
            w="100%"
            h="100%"
            objectFit="cover"
            loading={imagePriority ? 'eager' : 'lazy'}
            fetchPriority={imagePriority ? 'high' : 'auto'}
          />

          {showAdminVerifiedBadge && (
            <Box position="absolute" top={3} left={3}>
              <HStack gap={2}>
                <Box
                  bg="green.400"
                  color="white"
                  px={3}
                  py={1}
                  borderRadius="full"
                  display="flex"
                  alignItems="center"
                  gap={1.5}
                  fontSize="xs"
                  fontWeight="bold"
                  shadow="md"
                >
                  <BadgeCheck size={14} />
                  <Text>{t('verified')}</Text>
                </Box>
              </HStack>
            </Box>
          )}

          {/* Distance badge — bottom-left, clear of the verified badge above */}
          {venue.distance !== undefined && venue.distance !== null && (
            <Box position="absolute" bottom={3} left={3}>
              <Badge
                colorPalette="green"
                variant="solid"
                borderRadius="full"
                px={3}
                py={1}
                fontSize="xs"
                fontWeight="bold"
                display="flex"
                alignItems="center"
                gap={1.5}
                shadow="md"
              >
                <Navigation size={14} />
                <Text>{venue.distance} km</Text>
              </Badge>
            </Box>
          )}

          <Box position="absolute" top={3} right={3} zIndex={3}>
            <FavoriteButton
              type="VENUE"
              targetId={venue.id}
              isFavorite={venue.isFavorite}
              returnUrl={`/venues/${venue.slug || venue.id}`}
              onChange={(isFavorite) =>
                onFavoriteChange?.(venue.id, isFavorite)
              }
            />
          </Box>
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
              src={venue.logo || venue.coverPhoto || DEFAULT_COVER_PHOTO}
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
              _dark={{ color: 'green.400' }}
              letterSpacing="tight"
            >
              {displayName}
            </Text>

            <Box mt={0.5}>
              <AppAddressDisplay
                address={venue.address}
                district={venue.district}
                city={venue.city}
                newAddress={venue.newAddress}
                newDistrict={venue.newDistrict}
                fontSize="sm"
                color="gray.600"
                _dark={{ color: 'gray.300' }}
                lineClamp={2}
              />
            </Box>

            {venue.openingHours && (
              <Flex
                align="center"
                gap={1.5}
                mt={1}
                color="gray.600"
                _dark={{ color: 'gray.300' }}
              >
                <Clock size={14} />
                <Text fontSize="sm" fontWeight="medium">
                  {venue.openingHours}
                </Text>
              </Flex>
            )}
          </Box>

          {/* Right Icon */}
          <Box
            as={ChevronRight}
            color="gray.400"
            _dark={{ color: 'gray.400' }}
            w={5}
            h={5}
            flexShrink={0}
          />
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
          src={
            normalizeImageUrl(venue.coverPhoto, BROWSE_CARD_COVER_TRANSFORM) ||
            DEFAULT_COVER_PHOTO
          }
          alt={displayName}
          w="100%"
          h="100%"
          objectFit="cover"
          loading={imagePriority ? 'eager' : 'lazy'}
          fetchPriority={imagePriority ? 'high' : 'auto'}
        />

        {showAdminVerifiedBadge && (
          <Box position="absolute" top={3} left={3}>
            <HStack gap={2}>
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
            </HStack>
          </Box>
        )}

        {/* Distance badge — bottom-left, clear of the verified badge above */}
        {venue.distance !== undefined && venue.distance !== null && (
          <Box position="absolute" bottom={3} left={3}>
            <Badge
              colorPalette="green"
              variant="solid"
              size="sm"
              borderRadius="full"
              px={3}
              py={1}
              fontSize="xs"
              fontWeight="bold"
              display="flex"
              alignItems="center"
              gap={1.5}
              shadow="md"
            >
              <Navigation size={14} />
              <Text>{venue.distance} km</Text>
            </Badge>
          </Box>
        )}
        <Box position="absolute" top={3} right={3} zIndex={3}>
          <FavoriteButton
            type="VENUE"
            targetId={venue.id}
            isFavorite={venue.isFavorite}
            returnUrl={`/venues/${venue.slug || venue.id}`}
            onChange={(isFavorite) => onFavoriteChange?.(venue.id, isFavorite)}
          />
        </Box>
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

            {/* Location badges — fall back to the new-era ward/city (as a
                pair) when the venue has no legacy district/city on file
                (e.g. created via the public "new venue" request with no
                old address). */}
            {(badgeDistrict || badgeCity) && (
              <HStack gap={2} mb={2} flexWrap="wrap">
                {badgeDistrict && (
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
                    <Text fontSize="xs">
                      {badgeDistrict}
                      {!usingOldLocation && ` (${tAdmin('newAddressBadge')})`}
                    </Text>
                  </Badge>
                )}
                {badgeCity && (
                  <Badge
                    colorPalette="cyan"
                    variant="subtle"
                    size="sm"
                    borderRadius="md"
                    fontSize="xs"
                  >
                    {badgeCity}
                    {!usingOldLocation && ` (${tAdmin('newAddressBadge')})`}
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
              <AppAddressDisplay
                address={venue.address}
                district={venue.district}
                city={venue.city}
                newAddress={venue.newAddress}
                newDistrict={venue.newDistrict}
                fontSize="sm"
                color="gray.600"
                _dark={{ color: 'gray.300' }}
                lineClamp={2}
              />
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

          {/* Right Icon */}
          <Box
            as={ChevronRight}
            color="gray.400"
            _dark={{ color: 'gray.400' }}
            w={5}
            h={5}
            flexShrink={0}
          />
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
                    _dark={{ color: 'gray.400' }}
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
                    _dark={{ color: 'gray.400' }}
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
                    _dark={{ color: 'gray.400' }}
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
                  colorPalette="green"
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
        <Flex justify="flex-end">
          <Button
            variant="solid"
            colorPalette="green"
            size="sm"
            px={4}
            onClick={(e) => {
              e.stopPropagation();
              handleFindSessions(e);
            }}
            leftIcon={<Search size={15} />}
            _hover={{
              transform: 'translateY(-2px)',
              shadow: 'lg',
            }}
            transition="all 0.2s"
          >
            {t('findSessionsAtVenue')}
          </Button>
        </Flex>
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
