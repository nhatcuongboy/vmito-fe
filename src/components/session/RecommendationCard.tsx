'use client';

import { memo } from 'react';
import { Box, Flex, Text, Image, Badge, Icon, Heading } from '@chakra-ui/react';
import { Clock, MapPin, Users, Sparkles } from 'lucide-react';
import { useRouter } from '@/i18n/config';
import { useLocale, useTranslations } from 'next-intl';
import { formatTime, formatTimeRange } from './BaseSessionCard';
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
  const t = useTranslations('session');
  const tFee = useTranslations('fee');
  const tSuggestions = useTranslations('suggestions');

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
    if (!session.feeConfig) return tFee('free');

    const { feeType, maleFee, femaleFee } = session.feeConfig;

    if (feeType === FeeType.FIXED) {
      if (maleFee === femaleFee) {
        return FeeService.formatFee(maleFee || 0);
      }

      const minFee = Math.min(maleFee || 0, femaleFee || 0);
      const maxFee = Math.max(maleFee || 0, femaleFee || 0);

      return `${FeeService.formatFee(minFee)}-${FeeService.formatFee(maxFee)}`;
    }

    return tFee('splitEvenly');
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
        aria-label={t('viewSessionAt', {
          name: session.name,
          venue: session.venue.name,
        })}
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
            aria-label={tSuggestions('aiRecommendationAria')}
          >
            <Icon as={Sparkles} boxSize={3} />
            {tSuggestions('suggestionBadge')}
          </Badge>
        )}

        {/* Cover Image */}
        <Box position="relative" h="120px" overflow="hidden">
          <Image
            src={session.coverPhoto || DEFAULT_COVER_PHOTO}
            alt={t('coverAlt', { name: session.name })}
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
              <Text>{formatTimeRange(session.startTime, session.endTime)}</Text>
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
      boxShadow="0 1px 3px rgba(0, 0, 0, 0.05)"
      transition="border-color 0.2s ease, box-shadow 0.2s ease"
      _hover={{
        boxShadow: '0 4px 10px rgba(16, 185, 129, 0.1)',
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
      aria-label={t('viewSessionAt', {
        name: session.name,
        venue: session.venue.name,
      })}
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
          aria-label={tSuggestions('aiRecommendationAria')}
        >
          <Icon as={Sparkles} boxSize={2.5} />
          Gợi ý
        </Badge>
      )}

      {/* Cover Image */}
      <Box position="relative" h="78px" overflow="hidden">
        <Image
          src={session.coverPhoto || DEFAULT_COVER_PHOTO}
          alt={t('coverAlt', { name: session.name })}
          w="100%"
          h="100%"
          objectFit="cover"
        />
      </Box>

      {/* Content */}
      <Box p={2.5}>
        <Heading size="xs" fontWeight="bold" lineClamp={1} mb={2}>
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
                {session.availableSlots}/{session.maxSlots}
              </Text>
            </Flex>
          </Flex>
        </Flex>
      </Box>
    </Box>
  );
};

export default memo(RecommendationCard);
