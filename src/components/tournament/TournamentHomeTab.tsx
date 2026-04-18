'use client';

import { Box, Flex, HStack, Text, VStack } from '@chakra-ui/react';
import {
  Users,
  CalendarDays,
  BarChart3,
  ChevronRight,
  MapPin,
  Navigation,
  Pencil,
  Trash2,
  MoreHorizontal,
  CheckCircle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Tournament, CategoryType } from '@/lib/api/types';
import { useRouter } from '@/i18n/config';
import { getGoogleMapsUrl } from '@/utils';

interface ICategoryHomeItem {
  id: string;
  name: string;
  type: CategoryType;
}

interface TournamentHomeTabProps {
  tournament: Tournament;
  categories: ICategoryHomeItem[];
  totalTeams: number;
  isHost: boolean;
  slug: string;
}

export default function TournamentHomeTab({
  tournament,
  categories,
  totalTeams,
  isHost,
  slug,
}: TournamentHomeTabProps) {
  const t = useTranslations('pages.tournaments.detail.homeTab');
  const router = useRouter();

  const formattedDate = new Date(tournament.startDate).toLocaleDateString(
    'en-US',
    {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  );

  const venue = tournament.venue;
  const host = tournament.host;

  const handleViewSchedule = () => {
    router.push(`/tournament/${slug}/schedule`);
  };

  const handleViewStandings = () => {
    router.push(`/tournament/${slug}/standings`);
  };

  const handleManageCategories = () => {
    router.push(`/tournament/${slug}/manage?option=categories`);
  };

  const handleManageVenues = () => {
    router.push(`/tournament/${slug}/manage?option=venues`);
  };

  const handleOpenDirections = () => {
    const url = getGoogleMapsUrl({
      address: venue?.address,
      name: venue?.name,
      placeId: venue?.placeId,
      lat: venue?.lat,
      lng: venue?.lng,
    });
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <VStack align="stretch" gap={4}>
      {/* Overview section */}
      <Box
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="xl"
        p={4}
        bg="white"
      >
        <Flex justify="space-between" align="center" mb={3}>
          <Text fontWeight="semibold" fontSize="lg">
            {t('overview.title')}
          </Text>
          <Flex
            w="32px"
            h="32px"
            borderRadius="md"
            align="center"
            justify="center"
            cursor="pointer"
            _hover={{ bg: 'gray.100' }}
          >
            <MoreHorizontal size={16} color="var(--chakra-colors-gray-500)" />
          </Flex>
        </Flex>

        <HStack gap={5} mb={4}>
          <Flex align="center" gap={2}>
            <Users size={16} color="var(--chakra-colors-gray-500)" />
            <Text fontSize="sm" color="gray.600">
              {t('overview.teamsParticipating', { count: totalTeams })}
            </Text>
          </Flex>
          <Flex align="center" gap={2}>
            <CalendarDays size={16} color="var(--chakra-colors-gray-500)" />
            <Text fontSize="sm" color="gray.600">
              {formattedDate}
            </Text>
          </Flex>
        </HStack>

        <Flex gap={3}>
          <Box
            flex="1"
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="lg"
            p={3}
            cursor="pointer"
            _hover={{ bg: 'gray.50' }}
            onClick={handleViewSchedule}
          >
            <Flex align="center" gap={2}>
              <CalendarDays size={16} color="var(--chakra-colors-gray-500)" />
              <Text fontSize="sm" fontWeight="medium">
                {t('overview.viewSchedule')}
              </Text>
            </Flex>
          </Box>
          <Box
            flex="1"
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="lg"
            p={3}
            cursor="pointer"
            _hover={{ bg: 'gray.50' }}
            onClick={handleViewStandings}
          >
            <Flex align="center" gap={2}>
              <BarChart3 size={16} color="var(--chakra-colors-gray-500)" />
              <Text fontSize="sm" fontWeight="medium">
                {t('overview.viewStandings')}
              </Text>
            </Flex>
          </Box>
        </Flex>
      </Box>

      {/* Categories section */}
      <Box
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="xl"
        bg="white"
        overflow="hidden"
      >
        <Flex justify="space-between" align="center" p={4} pb={3}>
          <Text fontWeight="semibold" fontSize="lg">
            {t('categories.title')}
          </Text>
          <HStack gap={1}>
            {isHost && (
              <Text
                fontSize="sm"
                color="blue.500"
                cursor="pointer"
                fontWeight="medium"
                _hover={{ color: 'blue.600' }}
                onClick={handleManageCategories}
              >
                {t('categories.manage')}
              </Text>
            )}
            <Flex
              w="32px"
              h="32px"
              borderRadius="md"
              align="center"
              justify="center"
              cursor="pointer"
              _hover={{ bg: 'gray.100' }}
            >
              <MoreHorizontal size={16} color="var(--chakra-colors-gray-500)" />
            </Flex>
          </HStack>
        </Flex>

        {categories.length === 0 ? (
          <Box px={4} pb={4}>
            <Text fontSize="sm" color="gray.500">
              {t('categories.empty')}
            </Text>
          </Box>
        ) : (
          <VStack align="stretch" gap={0}>
            {categories.map((category, index) => (
              <Box key={category.id}>
                {index > 0 && <Box mx={4} h="1px" bg="gray.100" />}
                <Flex
                  align="center"
                  justify="space-between"
                  py={3}
                  px={4}
                  cursor="pointer"
                  _hover={{ bg: 'gray.50' }}
                  onClick={() =>
                    router.push(`/tournament/${slug}/manage?option=categories`)
                  }
                >
                  <Text fontSize="md">{category.name}</Text>
                  <ChevronRight
                    size={18}
                    color="var(--chakra-colors-gray-400)"
                  />
                </Flex>
              </Box>
            ))}
          </VStack>
        )}
      </Box>

      {/* Venues section */}
      {venue && (
        <Box
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="xl"
          overflow="hidden"
          bg="white"
        >
          <Flex justify="space-between" align="center" p={4} pb={3}>
            <Text fontWeight="semibold" fontSize="lg">
              {t('venues.title')}
            </Text>
            <HStack gap={1}>
              {isHost && (
                <Text
                  fontSize="sm"
                  color="blue.500"
                  cursor="pointer"
                  fontWeight="medium"
                  _hover={{ color: 'blue.600' }}
                  onClick={handleManageVenues}
                >
                  {t('venues.manage')}
                </Text>
              )}
              <Flex
                w="32px"
                h="32px"
                borderRadius="md"
                align="center"
                justify="center"
                cursor="pointer"
                _hover={{ bg: 'gray.100' }}
              >
                <MoreHorizontal
                  size={16}
                  color="var(--chakra-colors-gray-500)"
                />
              </Flex>
            </HStack>
          </Flex>

          {venue.lat && venue.lng ? (
            <Box h="200px">
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?q=${venue.lat},${venue.lng}&z=15&ie=UTF8&output=embed`}
              />
            </Box>
          ) : (
            <Box
              h="160px"
              bg="gray.100"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <MapPin size={32} color="var(--chakra-colors-gray-400)" />
            </Box>
          )}

          <Flex align="center" justify="space-between" p={4}>
            <Box flex="1" minW={0} mr={3}>
              <Flex align="center" gap={1.5}>
                <Text fontWeight="semibold" fontSize="md">
                  {venue.name}
                </Text>
                {venue.isVerified && (
                  <Box color="blue.500" flexShrink={0}>
                    <CheckCircle size={14} />
                  </Box>
                )}
              </Flex>
              <Text fontSize="sm" color="gray.500" mt={0.5} lineClamp={2}>
                {venue.address}
              </Text>
            </Box>

            {venue.lat && venue.lng && (
              <Box
                borderWidth="1px"
                borderColor="gray.300"
                borderRadius="lg"
                px={3}
                py={2}
                cursor="pointer"
                flexShrink={0}
                _hover={{ bg: 'gray.50' }}
                onClick={handleOpenDirections}
              >
                <Flex align="center" gap={1.5}>
                  <Navigation size={14} color="var(--chakra-colors-gray-600)" />
                  <Text fontSize="sm" fontWeight="medium" color="gray.700">
                    {t('venues.directions')}
                  </Text>
                </Flex>
              </Box>
            )}
          </Flex>
        </Box>
      )}

      {/* Contact section */}
      {host && (
        <Box
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="xl"
          p={4}
          bg="white"
        >
          <Flex justify="space-between" align="center" mb={3}>
            <Text fontWeight="semibold" fontSize="lg">
              {t('contact.title')}
            </Text>
            {isHost && (
              <HStack gap={1}>
                <Flex
                  w="32px"
                  h="32px"
                  borderRadius="md"
                  align="center"
                  justify="center"
                  cursor="pointer"
                  _hover={{ bg: 'gray.100' }}
                >
                  <Trash2 size={16} color="var(--chakra-colors-gray-500)" />
                </Flex>
                <Flex
                  w="32px"
                  h="32px"
                  borderRadius="md"
                  align="center"
                  justify="center"
                  cursor="pointer"
                  _hover={{ bg: 'gray.100' }}
                >
                  <Pencil size={16} color="var(--chakra-colors-gray-500)" />
                </Flex>
                <Flex
                  w="32px"
                  h="32px"
                  borderRadius="md"
                  align="center"
                  justify="center"
                  cursor="pointer"
                  _hover={{ bg: 'gray.100' }}
                >
                  <MoreHorizontal
                    size={16}
                    color="var(--chakra-colors-gray-500)"
                  />
                </Flex>
              </HStack>
            )}
          </Flex>

          <VStack align="stretch" gap={1.5}>
            {host.name && (
              <Text fontSize="sm" color="gray.700">
                <Text as="span" fontWeight="medium">
                  {t('contact.name')}:
                </Text>{' '}
                {host.name}
              </Text>
            )}
            {host.email && (
              <Text fontSize="sm" color="gray.700">
                <Text as="span" fontWeight="medium">
                  {t('contact.email')}:
                </Text>{' '}
                {host.email}
              </Text>
            )}
          </VStack>
        </Box>
      )}
    </VStack>
  );
}
