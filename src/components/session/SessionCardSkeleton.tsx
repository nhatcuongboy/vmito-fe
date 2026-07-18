'use client';

import { Box, Flex, Stack, Skeleton, SkeletonCircle } from '@chakra-ui/react';
import type { ViewMode } from '@/hooks/useViewMode';
import { Sparkles } from 'lucide-react';

interface SessionCardSkeletonProps {
  showOnlyOne?: boolean;
  variant?: ViewMode;
  isAi?: boolean;
  display?: any; // Chakra responsive display prop
}

const AiSkeletonAccent = ({ size = 16 }: { size?: number }) => (
  <Flex
    position="absolute"
    top={4}
    right={4}
    align="center"
    justify="center"
    boxSize="38px"
    borderRadius="full"
    bg="linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)"
    color="purple.600"
    borderWidth="1px"
    borderColor="purple.200"
    boxShadow="0 8px 18px rgba(168, 85, 247, 0.16)"
    pointerEvents="none"
    zIndex={1}
    css={{
      '@keyframes aiSkeletonFloat': {
        '0%, 100%': {
          transform: 'translateY(0) scale(1)',
          opacity: 0.9,
          boxShadow: '0 8px 18px rgba(168, 85, 247, 0.16)',
        },
        '50%': {
          transform: 'translateY(-1px) scale(1.02)',
          opacity: 1,
          boxShadow: '0 10px 22px rgba(168, 85, 247, 0.24)',
        },
      },
      animation: 'aiSkeletonFloat 2.4s ease-in-out infinite',
      '@media (prefers-reduced-motion: reduce)': {
        animation: 'none',
        transform: 'none',
      },
    }}
  >
    <Sparkles aria-hidden="true" size={size} strokeWidth={2.4} />
  </Flex>
);

// Skeleton matching SessionCardCompact (find-session list view): horizontal
// row with a square photo on mobile, vertical 4:3-cover card on md+.
export const SessionCardCompactSkeleton: React.FC<{
  display?: any; // Chakra responsive display prop
}> = ({ display }) => (
  <Flex
    direction={{ base: 'row', md: 'column' }}
    h="100%"
    borderWidth="1px"
    borderRadius="xl"
    overflow="hidden"
    bg="bg"
    _dark={{ bg: 'gray.800' }}
    borderColor="border"
    display={display}
  >
    <Skeleton
      flexShrink={0}
      w={{ base: '120px', md: '100%' }}
      minH={{ base: '120px', md: 'auto' }}
      aspectRatio={{ base: 'auto', md: 4 / 3 }}
    />
    <Stack p={2.5} gap={1.5} flex={1}>
      {/* Two title lines + the source line below, matching the real card */}
      <Skeleton height="18px" width="90%" borderRadius="sm" />
      <Skeleton height="18px" width="55%" borderRadius="sm" />
      <Skeleton height="14px" width="60%" borderRadius="sm" />
      <Skeleton height="12px" width="70%" borderRadius="sm" />
      <Skeleton height="12px" width="80%" borderRadius="sm" />
      <Flex justify="space-between" align="center" mt="auto" pt={1}>
        <Flex gap={1}>
          <Skeleton height="16px" width="36px" borderRadius="full" />
          <Skeleton height="16px" width="36px" borderRadius="full" />
        </Flex>
        <Skeleton height="18px" width="56px" borderRadius="sm" />
      </Flex>
    </Stack>
  </Flex>
);

export const SessionCardSkeleton: React.FC<SessionCardSkeletonProps> = ({
  showOnlyOne = false,
  variant = 'grid',
  isAi = false,
  display,
}) => {
  if (variant === 'list') {
    return (
      <Flex
        direction="column"
        h="100%"
        gap={2}
        borderWidth="1px"
        borderLeftWidth={isAi ? '3px' : '4px'}
        borderLeftColor={isAi ? 'purple.400' : 'gray.200'}
        borderRadius="lg"
        overflow="hidden"
        bg={isAi ? 'purple.50' : 'bg'}
        _dark={{ bg: isAi ? 'purple.900/20' : 'gray.800' }}
        borderColor="border"
        p={3}
        minW="300px"
        position="relative"
        display={display}
      >
        {isAi && <AiSkeletonAccent size={13} />}
        <Flex justify="space-between" align="flex-start">
          <Skeleton height="22px" width="60%" borderRadius="md" />
          <Skeleton height="20px" width="60px" borderRadius="full" />
        </Flex>
        <Flex align="center" gap={2}>
          <SkeletonCircle size="4" />
          <Skeleton height="16px" width="150px" borderRadius="sm" />
        </Flex>
        <Flex gap={3}>
          <Skeleton height="16px" width="80px" borderRadius="sm" />
          <Skeleton height="16px" width="80px" borderRadius="sm" />
          <Skeleton height="16px" width="40px" borderRadius="sm" />
        </Flex>
        <Flex gap={1}>
          <Skeleton height="20px" width="50px" borderRadius="full" />
          <Skeleton height="20px" width="50px" borderRadius="full" />
        </Flex>
        <Flex justify="space-between" align="center" mt="auto" pt={2}>
          <Skeleton height="18px" width="80px" borderRadius="sm" />
          <Skeleton height="28px" width="80px" borderRadius="md" />
        </Flex>
      </Flex>
    );
  }

  if (showOnlyOne) {
    return (
      <Box
        borderWidth="1px"
        borderRadius="xl"
        overflow="hidden"
        bg={isAi ? 'purple.50' : 'white'}
        _dark={{
          bg: isAi ? 'purple.900/20' : 'gray.800',
          borderColor: isAi ? 'purple.700' : undefined,
        }}
        shadow="sm"
        p={4}
        width="100%"
        maxW="400px"
        minW="300px"
        borderColor={isAi ? 'purple.200' : undefined}
        position="relative"
      >
        {isAi && <AiSkeletonAccent size={14} />}
        <Skeleton height="160px" borderRadius="lg" mb={4} />
        <Skeleton height="24px" width="70%" mb={2} />
        <Skeleton height="16px" width="40%" mb={4} />
        <Flex gap={2}>
          <Skeleton height="32px" width="60px" borderRadius="full" />
          <Skeleton height="32px" width="60px" borderRadius="full" />
        </Flex>
      </Box>
    );
  }

  return (
    <Flex
      direction="column"
      h="100%"
      gap={4}
      borderWidth="1px"
      borderLeftWidth={isAi ? '3px' : '4px'}
      borderLeftColor={isAi ? 'purple.400' : 'gray.200'}
      borderRadius="lg"
      overflow="hidden"
      bg={isAi ? 'purple.50' : 'bg'}
      _dark={{ bg: isAi ? 'purple.900/20' : 'gray.800' }}
      borderColor="border"
      p={6}
      minW="300px"
      position="relative"
      display={display}
    >
      {isAi && <AiSkeletonAccent />}

      {/* Header - Title and Status Badge */}
      <Flex justify="space-between" align="flex-start">
        <Skeleton height="28px" width="60%" borderRadius="md" />
        <Skeleton height="24px" width="80px" borderRadius="md" />
      </Flex>

      {/* Content Stack */}
      <Stack gap={3} flex={1}>
        {/* Host */}
        <Flex align="center" gap={2}>
          <SkeletonCircle size="5" />
          <Skeleton height="20px" width="150px" borderRadius="sm" />
        </Flex>

        {/* Venue/Location */}
        <Flex align="center" gap={2}>
          <SkeletonCircle size="5" />
          <Skeleton height="20px" width="200px" borderRadius="sm" />
        </Flex>

        {/* Date */}
        <Flex align="center" gap={2}>
          <SkeletonCircle size="5" />
          <Skeleton height="20px" width="180px" borderRadius="sm" />
        </Flex>

        {/* Time */}
        <Flex align="center" gap={2}>
          <SkeletonCircle size="5" />
          <Skeleton height="20px" width="120px" borderRadius="sm" />
        </Flex>

        {/* Courts Available */}
        <Flex align="center" gap={2}>
          <SkeletonCircle size="5" />
          <Skeleton height="20px" width="140px" borderRadius="sm" />
        </Flex>

        {/* Players */}
        <Flex align="center" gap={2}>
          <SkeletonCircle size="5" />
          <Skeleton height="20px" width="100px" borderRadius="sm" />
        </Flex>

        {/* Skill Levels */}
        <Flex align="center" gap={2}>
          <SkeletonCircle size="5" />
          <Flex gap={1}>
            <Skeleton height="24px" width="50px" borderRadius="md" />
            <Skeleton height="24px" width="50px" borderRadius="md" />
          </Flex>
        </Flex>

        {/* Fee */}
        <Flex align="center" gap={2}>
          <SkeletonCircle size="5" />
          <Skeleton height="20px" width="130px" borderRadius="sm" />
        </Flex>

        {/* Description */}
        <Box>
          <Skeleton height="16px" width="100%" mb={1} borderRadius="sm" />
          <Skeleton height="16px" width="80%" borderRadius="sm" />
        </Box>
      </Stack>

      {/* Action Buttons */}
      <Flex mt={4} gap={2} justify="flex-end">
        <Skeleton height="32px" width="80px" borderRadius="md" />
        <Skeleton height="32px" width="100px" borderRadius="md" />
      </Flex>
    </Flex>
  );
};
