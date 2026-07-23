'use client';

import { useState } from 'react';
import { IClubListItem, IClubSchedule } from '@/types/club';
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
  Crown,
  MapPin,
  Clock,
  ChevronRight,
  Users,
  TrendingUp,
} from 'lucide-react';
import { useRouter } from '@/i18n/config';
import { useTranslations } from 'next-intl';
import { DEFAULT_COVER_PHOTO } from '@/constants';
import { stripHtml } from '@/utils';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { getSkillLevelColor } from '@/lib/utils/skillLevel.utils';
import { getLevelRank, sortLevelsByRank } from '@/constants/levels';
import { FavoriteButton } from '@/components/favorites/FavoriteButton';

interface ClubCardProps {
  club: IClubListItem;
  variant?: 'grid' | 'list';
  onFavoriteChange?: (clubId: string, isFavorite: boolean) => void;
}

// Helper function to format schedule display
const formatScheduleDisplay = (
  schedules: IClubSchedule[],
  t: (key: string) => string
): string => {
  if (!schedules || schedules.length === 0) return '';

  const timeMap = new Map<string, string[]>();

  schedules.forEach((schedule) => {
    const timeSlot = `${schedule.startTime}-${schedule.endTime}`;
    const dayName = t(`clubs.dayNames.${schedule.dayOfWeek}`);

    if (!timeMap.has(timeSlot)) {
      timeMap.set(timeSlot, []);
    }
    timeMap.get(timeSlot)!.push(dayName);
  });

  const scheduleLines = Array.from(timeMap.entries()).map(
    ([timeSlot, days]) => `${days.join(', ')} • ${timeSlot}`
  );

  return scheduleLines.join('\n');
};

export default function ClubCard({
  club,
  variant = 'grid',
  onFavoriteChange,
}: ClubCardProps) {
  const router = useRouter();
  const t = useTranslations();
  const { getLevelLabel } = useLevelLabel();
  const [isLoading, setIsLoading] = useState(false);

  const handleViewDetails = () => {
    setIsLoading(true);
    router.push(`/clubs/${club.slug ?? club.id}`);
    setTimeout(() => setIsLoading(false), 5000);
  };

  const venueName = club.defaultVenue?.name || club.location;
  const scheduleText = formatScheduleDisplay(club.schedules || [], t);

  // Determine status badge
  const isActive = club.status === 'APPROVED';

  const getLevelDisplay = () => {
    if (!club.requiredLevels || club.requiredLevels.length === 0) return null;

    const sorted = sortLevelsByRank(club.requiredLevels);
    if (sorted.length === 1) return getLevelLabel(sorted[0]);

    // Check if it's a continuous range
    const isContinuous = sorted.every(
      (level, i) =>
        i === 0 ||
        (getLevelRank(level) ?? Number.MAX_SAFE_INTEGER) ===
          (getLevelRank(sorted[i - 1]) ?? Number.MAX_SAFE_INTEGER) + 1
    );
    if (isContinuous && sorted.length > 2) {
      return `${getLevelLabel(sorted[0])} - ${getLevelLabel(sorted[sorted.length - 1])}`;
    }

    // Otherwise show first 2 and count
    if (sorted.length > 2) {
      return `${getLevelLabel(sorted[0])}, ${getLevelLabel(sorted[1])} +${sorted.length - 2}`;
    }

    return sorted.map((l) => getLevelLabel(l)).join(', ');
  };

  const levelText = getLevelDisplay();
  const skillColor = club.requiredLevels?.length
    ? getSkillLevelColor([sortLevelsByRank(club.requiredLevels).at(-1)!]).color
    : undefined;

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
          {/* Note: Clubs don't have separate banner, using avatar as banner with objectFit="cover" and blur, or just using typical image */}
          <Image
            src={club.image || DEFAULT_COVER_PHOTO}
            alt={club.name}
            w="100%"
            h="100%"
            objectFit="cover"
          />

          {/* Status Badge Overlay */}
          {isActive && (
            <Box position="absolute" top={3} left={3}>
              <HStack gap={0} borderRadius="full" overflow="hidden">
                <Box
                  bg="green.400"
                  color="white"
                  px={3}
                  py={1}
                  display="flex"
                  alignItems="center"
                  gap={1.5}
                  fontSize="xs"
                  fontWeight="bold"
                >
                  <Text>{t('clubs.active')}</Text>
                </Box>
              </HStack>
            </Box>
          )}
          <Box position="absolute" top={3} right={3} zIndex={3}>
            <FavoriteButton
              type="CLUB"
              targetId={club.id}
              isFavorite={club.isFavorite}
              returnUrl={`/clubs/${club.slug ?? club.id}`}
              onChange={(isFavorite) => onFavoriteChange?.(club.id, isFavorite)}
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
              src={club.logo || club.image || DEFAULT_COVER_PHOTO}
              alt={club.name}
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
              color="blue.600"
              _dark={{ color: 'blue.400' }}
              letterSpacing="tight"
            >
              {club.name}
            </Text>

            {venueName && (
              <HStack
                fontSize="sm"
                color="gray.600"
                _dark={{ color: 'gray.400' }}
                mt={0.5}
                gap={1.5}
              >
                <MapPin size={14} style={{ flexShrink: 0 }} />
                <Text lineClamp={1}>{venueName}</Text>
              </HStack>
            )}

            {levelText && (
              <HStack
                fontSize="xs"
                color="gray.600"
                _dark={{ color: 'gray.400' }}
                mt={0.5}
                gap={1.5}
              >
                <TrendingUp
                  size={14}
                  color={skillColor}
                  style={{ flexShrink: 0 }}
                />
                <Text lineClamp={1} fontWeight="semibold">
                  {levelText}
                </Text>
              </HStack>
            )}

            {scheduleText && (
              <Flex
                align="center"
                gap={1.5}
                mt={1}
                color="gray.600"
                _dark={{ color: 'gray.400' }}
              >
                <Clock size={14} style={{ flexShrink: 0 }} />
                <Text fontSize="sm" fontWeight="medium" lineClamp={1}>
                  {scheduleText.split('\n')[0]}
                  {scheduleText.includes('\n') ? '...' : ''}
                </Text>
              </Flex>
            )}
          </Box>
        </Flex>

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
            <Spinner color="blue.500" size="lg" />
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
      onClick={handleViewDetails}
      display="flex"
      flexDirection="column"
      height="100%"
    >
      {/* Cover Photo */}
      <Box position="relative" h="140px" overflow="hidden" flexShrink={0}>
        <Image
          src={club.image || DEFAULT_COVER_PHOTO}
          alt={club.name}
          w="100%"
          h="100%"
          objectFit="cover"
        />

        {/* Status Badge Overlay */}
        {isActive && (
          <Box position="absolute" top={3} left={3} zIndex={2}>
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
              <Text fontSize="xs">{t('clubs.active')}</Text>
            </Badge>
          </Box>
        )}
        <Box position="absolute" top={3} right={3} zIndex={3}>
          <FavoriteButton
            type="CLUB"
            targetId={club.id}
            isFavorite={club.isFavorite}
            returnUrl={`/clubs/${club.slug ?? club.id}`}
            onChange={(isFavorite) => onFavoriteChange?.(club.id, isFavorite)}
          />
        </Box>
      </Box>

      {/* Content Section - Flex grow to push button to bottom */}
      <Box flex="1">
        {/* Header Section */}
        <Box px={5} pt={5} pb={3}>
          <Flex justify="space-between" align="flex-start" gap={3} mb={3}>
            <Box flex="1" minW={0}>
              <Text
                fontWeight="bold"
                fontSize="xl"
                lineClamp={1}
                color="blue.600"
                _dark={{ color: 'blue.400' }}
                letterSpacing="tight"
                mb={3}
              >
                {club.name}
              </Text>
            </Box>
            <Box
              as={ChevronRight}
              color="gray.400"
              w={5}
              h={5}
              flexShrink={0}
              mt={1}
            />
          </Flex>
          {/* Description */}
          {club.description && (
            <Text
              fontSize="sm"
              color="gray.600"
              _dark={{ color: 'gray.400' }}
              lineClamp={2}
              mb={3}
            >
              {stripHtml(club.description)}
            </Text>
          )}
        </Box>

        {/* Divider */}
        <Box h="1px" bg="gray.100" _dark={{ bg: 'gray.700' }} mx={5} />

        {/* Info Section */}
        <Box px={5} py={4}>
          <Stack gap={3}>
            {/* Venue/Location */}
            {venueName && (
              <Flex align="center" gap={2.5}>
                <Box
                  p={2}
                  borderRadius="lg"
                  bg="green.50"
                  _dark={{ bg: 'green.900/20' }}
                >
                  <MapPin size={16} color="#38A169" style={{ flexShrink: 0 }} />
                </Box>
                <Box flex="1">
                  <Text
                    fontSize="sm"
                    color="gray.700"
                    _dark={{ color: 'gray.300' }}
                    fontWeight="medium"
                    lineClamp={1}
                  >
                    {venueName}
                  </Text>
                </Box>
              </Flex>
            )}

            {/* Schedule */}
            {scheduleText && (
              <Flex align="flex-start" gap={2.5}>
                <Box
                  p={2}
                  borderRadius="lg"
                  bg="purple.50"
                  _dark={{ bg: 'purple.900/20' }}
                >
                  <Clock size={16} color="#805AD5" style={{ flexShrink: 0 }} />
                </Box>
                <Box flex="1">
                  <Text
                    fontSize="sm"
                    color="gray.700"
                    _dark={{ color: 'gray.300' }}
                    fontWeight="medium"
                    whiteSpace="pre-line"
                  >
                    {scheduleText}
                  </Text>
                </Box>
              </Flex>
            )}

            {/* Host info */}
            <Flex align="center" gap={2.5}>
              <Box
                p={2}
                borderRadius="lg"
                bg="orange.50"
                _dark={{ bg: 'orange.900/20' }}
              >
                <Crown size={16} color="#DD6B20" style={{ flexShrink: 0 }} />
              </Box>
              <Box flex="1">
                <Text
                  fontSize="sm"
                  color="gray.700"
                  _dark={{ color: 'gray.300' }}
                  fontWeight="medium"
                >
                  {t('clubs.hostedBy')} {club.host.name}
                </Text>
              </Box>
            </Flex>

            {/* Member count */}
            <Flex align="center" gap={2.5}>
              <Box
                p={2}
                borderRadius="lg"
                bg="blue.50"
                _dark={{ bg: 'blue.900/20' }}
              >
                <Users size={16} color="#3182CE" style={{ flexShrink: 0 }} />
              </Box>
              <Box flex="1">
                <Text
                  fontSize="sm"
                  color="gray.700"
                  _dark={{ color: 'gray.300' }}
                  fontWeight="medium"
                >
                  {club.memberCount} {t('clubs.members')}
                </Text>
              </Box>
            </Flex>

            {/* Level requirements */}
            {levelText && (
              <Flex align="center" gap={2.5}>
                <Box
                  p={2}
                  borderRadius="lg"
                  bg="green.50"
                  _dark={{ bg: 'green.900/20' }}
                >
                  <TrendingUp
                    size={16}
                    color={skillColor || '#38A169'}
                    style={{ flexShrink: 0 }}
                  />
                </Box>
                <Box flex="1">
                  <Text
                    fontSize="sm"
                    color="gray.700"
                    _dark={{ color: 'gray.300' }}
                    fontWeight="semibold"
                    lineClamp={1}
                  >
                    {levelText}
                  </Text>
                </Box>
              </Flex>
            )}
          </Stack>
        </Box>
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
