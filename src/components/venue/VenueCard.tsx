'use client';
import React from 'react';

import { Venue } from '@/lib/api/types';
import { Badge, Box, Flex, HStack, Image, Stack, Text } from '@chakra-ui/react';
import {
  BadgeCheck,
  Banknote,
  Clock,
  Eye,
  Globe,
  LayoutGrid,
  MapPin,
  MapPinned,
  Navigation,
  Phone,
  Search,
} from 'lucide-react';
import { Button, IconButton } from '@/components/ui/chakra-compat';
import { useRouter } from '@/i18n/config';
import { DEFAULT_COVER_PHOTO } from '@/constants';

interface VenueCardProps {
  venue: Venue;
}

function formatPrice(amount?: number) {
  if (!amount) return null;
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

export default function VenueCard({ venue }: VenueCardProps) {
  const router = useRouter();

  const handleNavigate = () => {
    const query = encodeURIComponent(venue.address || venue.name);
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${query}`,
      '_blank'
    );
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/browse/venues/${venue.id}`);
  };

  const handleFindSessions = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/?venueId=${venue.id}`);
  };

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
    >
      {/* Cover Photo */}
      <Box position="relative" h="140px" overflow="hidden">
        <Image
          src={venue.coverPhoto || DEFAULT_COVER_PHOTO}
          alt={venue.name}
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
              <Text fontSize="xs">Verified</Text>
            </Badge>
          </Box>
        )}
      </Box>

      {/* Header Section */}
      <Box px={5} pt={5} pb={3}>
        <Flex justify="space-between" align="flex-start" gap={3} mb={3}>
          <Box flex="1" minW={0}>
            <Flex align="center" gap={2} mb={2}>
              <Text
                fontWeight="bold"
                fontSize="xl"
                lineClamp={1}
                color="gray.900"
                _dark={{ color: 'white' }}
                letterSpacing="tight"
              >
                {venue.name}
              </Text>
            </Flex>

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
        </Flex>
      </Box>

      {/* Divider */}
      <Box h="1px" bg="gray.100" _dark={{ bg: 'gray.700' }} mx={5} />

      {/* Info Section */}
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
                  Opening Hours
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
                  Available Courts
                </Text>
                <Text
                  fontSize="sm"
                  color="gray.700"
                  _dark={{ color: 'gray.300' }}
                  fontWeight="medium"
                >
                  {venue.numberOfCourts} courts
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
                <Banknote size={16} color="#DD6B20" style={{ flexShrink: 0 }} />
              </Box>
              <Box flex="1">
                <Text
                  fontSize="xs"
                  color="gray.500"
                  _dark={{ color: 'gray.500' }}
                  mb={1}
                >
                  Pricing
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
                        Fixed Rate
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
                        Walk-in Rate
                      </Text>
                    </Flex>
                  )}
                </Stack>
              </Box>
            </Flex>
          )}
        </Stack>
      </Box>

      {/* Contact Section */}
      {(venue.phone || venue.website) && (
        <>
          <Box h="1px" bg="gray.100" _dark={{ bg: 'gray.700' }} mx={5} />
          <Box px={5} py={3}>
            <Flex gap={3} flexWrap="wrap" justify="space-between">
              {venue.phone && (
                <a
                  href={`tel:${venue.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  style={{ flex: 1, minWidth: '140px' }}
                >
                  <Flex
                    align="center"
                    justify="center"
                    gap={2}
                    px={3}
                    py={2}
                    borderRadius="lg"
                    bg="gray.50"
                    _dark={{ bg: 'gray.700', color: 'gray.300' }}
                    color="gray.700"
                    _hover={{
                      bg: 'blue.50',
                      color: 'blue.600',
                      _dark: { bg: 'blue.900/30', color: 'blue.400' },
                    }}
                    transition="all 0.2s"
                    fontSize="sm"
                    fontWeight="medium"
                  >
                    <Phone size={14} />
                    <Text fontSize="xs">{venue.phone}</Text>
                  </Flex>
                </a>
              )}
              {venue.website && (
                <a
                  href={venue.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{ flex: 1, minWidth: '100px' }}
                >
                  <Flex
                    align="center"
                    justify="center"
                    gap={2}
                    px={3}
                    py={2}
                    borderRadius="lg"
                    bg="gray.50"
                    _dark={{ bg: 'gray.700', color: 'gray.300' }}
                    color="gray.700"
                    _hover={{
                      bg: 'purple.50',
                      color: 'purple.600',
                      _dark: { bg: 'purple.900/30', color: 'purple.400' },
                    }}
                    transition="all 0.2s"
                    fontSize="sm"
                    fontWeight="medium"
                  >
                    <Globe size={14} style={{ flexShrink: 0 }} />
                    <Text fontSize="xs">Website</Text>
                  </Flex>
                </a>
              )}
            </Flex>
          </Box>
        </>
      )}

      {/* Action Buttons */}
      <Box h="1px" bg="gray.100" _dark={{ bg: 'gray.700' }} mx={5} />
      <Box px={5} py={4}>
        <Flex gap={3}>
          <Button
            flex="1"
            variant="outline"
            colorPalette="blue"
            size="md"
            onClick={handleViewDetails}
            leftIcon={<Eye size={16} />}
            _hover={{
              transform: 'translateY(-2px)',
              shadow: 'md',
            }}
            transition="all 0.2s"
          >
            Xem
          </Button>
          <Button
            flex="1"
            variant="solid"
            colorPalette="green"
            size="md"
            onClick={handleFindSessions}
            leftIcon={<Search size={16} />}
            _hover={{
              transform: 'translateY(-2px)',
              shadow: 'lg',
            }}
            transition="all 0.2s"
          >
            Tìm kèo
          </Button>
        </Flex>
      </Box>
    </Box>
  );
}
