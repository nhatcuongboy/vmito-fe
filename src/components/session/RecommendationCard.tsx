'use client';

import { memo } from 'react';
import { Box, Flex, Text, Image, Badge, Icon, Heading } from '@chakra-ui/react';
import { Calendar, Clock, MapPin, Users, Sparkles } from 'lucide-react';
import { useRouter } from '@/i18n/config';
import { useLocale } from 'next-intl';
import { formatDate, formatTime } from './BaseSessionCard';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { DEFAULT_COVER_PHOTO } from '@/constants';
import { FeeService } from '@/lib/api/fee.service';
import { FeeType } from '@/lib/api/types';

interface RecommendedSession {
  id: string;
  slug: string;
  name: string;
  startTime: string;
  endTime: string;
  coverPhoto: string | null;

  venue: {
    id: string;
    name: string;
    address: string;
    city: string;
    district: string;
    lat: number;
    lng: number;
  };

  host: {
    id: string;
    name: string;
    image: string | null;
  };

  feeConfig: {
    feeType: 'FIXED' | 'SPLIT_EVENLY';
    maleFee: number | null;
    femaleFee: number | null;
  } | null;

  availableSlots: number;
  maxSlots: number;
  requiredLevels: number[];

  // Recommendation metadata
  relevanceScore: number;
  matchReasons: string[];
  distance: number | null;
}

interface RecommendationCardProps {
  session: RecommendedSession;
  variant: 'mobile' | 'desktop';
  showAIBadge: boolean;
  onClick?: (sessionId: string) => void;
}

const RecommendationCard = ({
  session,
  variant,
  showAIBadge,
  onClick,
}: RecommendationCardProps) => {
  const router = useRouter();
  const locale = useLocale();
  const { getLevelShortLabel } = useLevelLabel();

  const isMobile = variant === 'mobile';

  const handleClick = () => {
    if (onClick) {
      onClick(session.id);
    } else {
      router.push(`/sessions/${session.slug || session.id}`);
    }
  };

  // Format fee display
  const getFeeDisplay = () => {
    if (!session.feeConfig) return 'Miễn phí';

    const { feeType, maleFee, femaleFee } = session.feeConfig;

    if (feeType === FeeType.FIXED) {
      if (maleFee === femaleFee) {
        return FeeService.formatFee(maleFee || 0);
      }
      return `${FeeService.formatFee(maleFee || 0)} / ${FeeService.formatFee(femaleFee || 0)}`;
    }

    return 'Chia đều';
  };

  // Format level display
  const getLevelDisplay = () => {
    if (!session.requiredLevels || session.requiredLevels.length === 0) {
      return 'Tất cả';
    }
    if (session.requiredLevels.length === 7) {
      return 'Tất cả';
    }
    return session.requiredLevels
      .map((level) => getLevelShortLabel(level))
      .join(', ');
  };

  // Mobile variant: 75% screen width, horizontal card
  if (isMobile) {
    return (
      <Box
        as="article"
        position="relative"
        w="75vw"
        minW="280px"
        maxW="320px"
        borderWidth="1px"
        borderRadius="xl"
        overflow="hidden"
        bg="white"
        _dark={{ bg: 'gray.800' }}
        boxShadow="0 2px 8px rgba(0, 0, 0, 0.06)"
        transition="all 0.2s"
        _hover={{
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 16px rgba(16, 185, 129, 0.12)',
          borderColor: 'green.200',
        }}
        _focusWithin={{
          outline: '2px solid',
          outlineColor: 'green.500',
          outlineOffset: '2px',
        }}
        cursor="pointer"
        onClick={handleClick}
        tabIndex={0}
        role="button"
        aria-label={`Xem chi tiết kèo ${session.name} tại ${session.venue.name}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {/* AI Badge */}
        {showAIBadge && (
          <Badge
            position="absolute"
            top={2}
            left={2}
            zIndex={2}
            colorPalette="purple"
            variant="solid"
            fontSize="xs"
            fontWeight="bold"
            px={2}
            py={0.5}
            borderRadius="full"
            display="flex"
            alignItems="center"
            gap={1}
            aria-label="AI-powered recommendation"
          >
            <Icon as={Sparkles} boxSize={3} />
            Gợi ý
          </Badge>
        )}

        {/* Cover Image */}
        <Box position="relative" h="120px" overflow="hidden">
          <Image
            src={session.coverPhoto || DEFAULT_COVER_PHOTO}
            alt={`Ảnh bìa kèo ${session.name}`}
            w="100%"
            h="100%"
            objectFit="cover"
          />
        </Box>

        {/* Content */}
        <Box p={3}>
          <Heading size="sm" fontWeight="bold" lineClamp={1} mb={2}>
            {session.name}
          </Heading>

          <Flex direction="column" gap={1.5} fontSize="xs" color="gray.600">
            {/* Venue */}
            <Flex align="center" gap={1.5}>
              <Icon
                as={MapPin}
                boxSize={3.5}
                color="green.500"
                flexShrink={0}
              />
              <Text lineClamp={1}>{session.venue.name}</Text>
            </Flex>

            {/* Time */}
            <Flex align="center" gap={1.5}>
              <Icon as={Clock} boxSize={3.5} color="green.500" flexShrink={0} />
              <Text>
                {formatTime(session.startTime, locale)} -{' '}
                {formatTime(session.endTime, locale)}
              </Text>
            </Flex>

            {/* Fee and Slots */}
            <Flex justify="space-between" align="center" mt={1}>
              <Text fontWeight="semibold" color="green.600" fontSize="sm">
                {getFeeDisplay()}
              </Text>
              <Flex align="center" gap={1}>
                <Icon as={Users} boxSize={3.5} color="gray.500" />
                <Text color="gray.700">
                  {session.availableSlots}/{session.maxSlots}
                </Text>
              </Flex>
            </Flex>
          </Flex>
        </Box>
      </Box>
    );
  }

  // Desktop variant: compact vertical card for sidebar
  return (
    <Box
      as="article"
      position="relative"
      w="100%"
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      bg="white"
      _dark={{ bg: 'gray.800' }}
      boxShadow="0 1px 4px rgba(0, 0, 0, 0.06)"
      transition="all 0.2s"
      _hover={{
        transform: 'translateX(4px)',
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.12)',
        borderColor: 'green.200',
      }}
      _focusWithin={{
        outline: '2px solid',
        outlineColor: 'green.500',
        outlineOffset: '2px',
      }}
      cursor="pointer"
      onClick={handleClick}
      tabIndex={0}
      role="button"
      aria-label={`Xem chi tiết kèo ${session.name} tại ${session.venue.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* AI Badge */}
      {showAIBadge && (
        <Badge
          position="absolute"
          top={2}
          left={2}
          zIndex={2}
          colorPalette="purple"
          variant="solid"
          fontSize="2xs"
          fontWeight="bold"
          px={1.5}
          py={0.5}
          borderRadius="full"
          display="flex"
          alignItems="center"
          gap={0.5}
          aria-label="AI-powered recommendation"
        >
          <Icon as={Sparkles} boxSize={2.5} />
          Gợi ý
        </Badge>
      )}

      {/* Cover Image */}
      <Box position="relative" h="100px" overflow="hidden">
        <Image
          src={session.coverPhoto || DEFAULT_COVER_PHOTO}
          alt={`Ảnh bìa kèo ${session.name}`}
          w="100%"
          h="100%"
          objectFit="cover"
        />
      </Box>

      {/* Content */}
      <Box p={2.5}>
        <Heading size="xs" fontWeight="bold" lineClamp={2} mb={2} minH="32px">
          {session.name}
        </Heading>

        <Flex direction="column" gap={1} fontSize="2xs" color="gray.600">
          {/* Venue */}
          <Flex align="center" gap={1}>
            <Icon as={MapPin} boxSize={3} color="green.500" flexShrink={0} />
            <Text lineClamp={1}>{session.venue.name}</Text>
          </Flex>

          {/* Time */}
          <Flex align="center" gap={1}>
            <Icon as={Clock} boxSize={3} color="green.500" flexShrink={0} />
            <Text lineClamp={1}>{formatTime(session.startTime, locale)}</Text>
          </Flex>

          {/* Fee and Slots */}
          <Flex justify="space-between" align="center" mt={1}>
            <Text fontWeight="semibold" color="green.600" fontSize="xs">
              {getFeeDisplay()}
            </Text>
            <Flex align="center" gap={0.5}>
              <Icon as={Users} boxSize={3} color="gray.500" />
              <Text color="gray.700" fontSize="2xs">
                {session.availableSlots}
              </Text>
            </Flex>
          </Flex>
        </Flex>
      </Box>
    </Box>
  );
};

export default memo(RecommendationCard);
