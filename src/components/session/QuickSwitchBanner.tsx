'use client';

import { Box, Flex, Heading, Icon } from '@chakra-ui/react';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { ISession } from '@/lib/api/types';
import RecommendationCard from './RecommendationCard';
import { Button } from '@/components/ui/chakra-compat';

interface RecommendedSession
  extends Omit<
    ISession,
    | 'distance'
    | 'slug'
    | 'startTime'
    | 'endTime'
    | 'coverPhoto'
    | 'venue'
    | 'host'
    | 'feeConfig'
    | 'requiredLevels'
  > {
  relevanceScore: number;
  matchReasons: string[];
  distance: number | null;
  availableSlots: number;
  maxSlots: number;
  slug: string;
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
  requiredLevels: number[];
}

interface QuickSwitchBannerProps {
  currentSession: {
    id: string;
    status: string;
    availableSlots: number;
    endTime: string;
  };
  topRecommendations: RecommendedSession[];
  onViewAll: () => void;
}

const QuickSwitchBanner = ({
  currentSession,
  topRecommendations,
  onViewAll,
}: QuickSwitchBannerProps) => {
  // Check if session is unavailable
  const isFinished = currentSession.status === 'FINISHED';
  const isCancelled = currentSession.status === 'CANCELLED';
  const isFull = currentSession.availableSlots === 0;
  const isExpired = new Date(currentSession.endTime) < new Date();

  const isUnavailable = isFinished || isCancelled || isFull || isExpired;

  // Don't render if session is available or no recommendations
  if (!isUnavailable || topRecommendations.length === 0) {
    return null;
  }

  // Generate message based on unavailability reason
  const getMessage = () => {
    if (isCancelled) {
      return `Kèo này đã bị hủy, AI tìm thấy ${topRecommendations.length} kèo tương tự cho bạn`;
    }
    if (isFinished) {
      return `Kèo này đã kết thúc, AI tìm thấy ${topRecommendations.length} kèo tương tự cho bạn`;
    }
    if (isFull) {
      return `Kèo này đã hết chỗ, AI tìm thấy ${topRecommendations.length} kèo tương tự cho bạn`;
    }
    if (isExpired) {
      return `Kèo này đã quá hạn, AI tìm thấy ${topRecommendations.length} kèo tương tự cho bạn`;
    }
    return `AI tìm thấy ${topRecommendations.length} kèo tương tự cho bạn`;
  };

  // Show top 3 recommendations
  const displayedRecommendations = topRecommendations.slice(0, 3);

  return (
    <Box
      role="alert"
      w="100%"
      bg="orange.50"
      borderWidth="2px"
      borderColor="orange.300"
      borderRadius="xl"
      p={4}
      mb={4}
      boxShadow="0 4px 12px rgba(251, 146, 60, 0.15)"
    >
      {/* Header */}
      <Flex align="center" gap={2} mb={3}>
        <Icon as={AlertCircle} boxSize={5} color="orange.600" />
        <Heading size="sm" color="orange.900" fontWeight="bold">
          {getMessage()}
        </Heading>
      </Flex>

      {/* Recommendations Grid */}
      <Flex
        gap={3}
        overflowX="auto"
        mb={3}
        pb={2}
        css={{
          '&::-webkit-scrollbar': {
            height: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(0, 0, 0, 0.05)',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(251, 146, 60, 0.3)',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'rgba(251, 146, 60, 0.5)',
          },
        }}
      >
        {displayedRecommendations.map((session) => (
          <Box key={session.id} flexShrink={0}>
            <RecommendationCard
              session={session}
              variant="mobile"
              showAIBadge={true}
            />
          </Box>
        ))}
      </Flex>

      {/* View All Button */}
      <Button
        w="100%"
        colorPalette="orange"
        variant="solid"
        size="md"
        fontWeight="bold"
        onClick={onViewAll}
        rightIcon={<Icon as={ArrowRight} />}
      >
        Xem tất cả gợi ý
      </Button>
    </Box>
  );
};

export default QuickSwitchBanner;
