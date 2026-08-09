'use client';

import React from 'react';
import { Box, BoxProps, Flex } from '@chakra-ui/react';
import { Gender } from '@/lib/api/types';

export interface UserAvatarProps extends Omit<BoxProps, 'children' | 'size'> {
  name?: string | null;
  gender?: string | null;
  status?: string | null;
  image?: string | null;
  size?: string;
  fontSize?: string;
  borderWidth?: string;
  borderColor?: string;
  boxShadow?: string;
  showStatusDot?: boolean;
  dotSize?: string;
}

function getInitials(name?: string | null) {
  if (!name || !name.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getStatusColor(status?: string | null) {
  switch (status) {
    case 'PLAYING':
      return 'green.500';
    case 'WAITING':
      return 'orange.500';
    case 'READY':
      return 'brand.500';
    default:
      return 'gray.400';
  }
}

const gradientColors: Record<string, { bg: string }> = {
  [Gender.MALE]: { bg: 'linear-gradient(135deg, #4299e1 0%, #667eea 100%)' },
  [Gender.FEMALE]: { bg: 'linear-gradient(135deg, #ed64a6 0%, #f687b3 100%)' },
  [Gender.OTHER]: { bg: 'linear-gradient(135deg, #9f7aea 0%, #b794f4 100%)' },
  [Gender.PREFER_NOT_TO_SAY]: {
    bg: 'linear-gradient(135deg, #a0aec0 0%, #cbd5e0 100%)',
  },
};

/**
 * Shared account avatar. It preserves the status treatment used by the
 * session player list while remaining neutral enough for profiles and ranks.
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({
  name = '',
  gender,
  status,
  image,
  size = '48px',
  fontSize,
  borderWidth,
  borderColor = 'white',
  boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)',
  showStatusDot,
  dotSize,
  flexShrink = 0,
  ...boxProps
}) => {
  const numericSize = parseInt(size, 10) || 48;
  const computedFontSize =
    fontSize || (numericSize >= 56 ? 'lg' : numericSize >= 44 ? 'md' : 'xs');
  const computedBorderWidth =
    borderWidth ||
    (numericSize <= 36
      ? '1.5px'
      : numericSize <= 56
        ? '2px'
        : numericSize <= 80
          ? '3px'
          : '4px');
  const computedDotSize =
    dotSize ||
    (numericSize >= 56 ? '16px' : numericSize >= 44 ? '14px' : '10px');
  const colors =
    (gender && gradientColors[gender]) ||
    gradientColors[Gender.PREFER_NOT_TO_SAY];
  const renderStatusDot =
    showStatusDot !== undefined ? showStatusDot : Boolean(status);

  return (
    <Box
      position="relative"
      display="inline-block"
      flexShrink={flexShrink}
      {...boxProps}
    >
      <Flex
        width={size}
        height={size}
        borderRadius="full"
        background={image ? 'transparent' : colors.bg}
        color="white"
        align="center"
        justify="center"
        fontWeight="bold"
        fontSize={computedFontSize}
        letterSpacing="0.5px"
        boxShadow={boxShadow}
        border={`${computedBorderWidth} solid`}
        borderColor={borderColor}
        _dark={{ borderColor: 'gray.800' }}
        transition="all 0.3s ease"
        overflow="hidden"
        _hover={{ transform: 'scale(1.05)' }}
      >
        {image ? (
          <Box
            as="img"
            // @ts-expect-error - src and alt are valid for as="img"
            src={image}
            alt={name || 'Avatar'}
            width="100%"
            height="100%"
            objectFit="cover"
          />
        ) : (
          getInitials(name)
        )}
      </Flex>

      {renderStatusDot && status && (
        <Box
          position="absolute"
          bottom="0"
          right="0"
          width={computedDotSize}
          height={computedDotSize}
          bg={getStatusColor(status)}
          borderRadius="full"
          border="2.5px solid white"
          _dark={{ borderColor: 'gray.800' }}
          boxShadow="0 2px 4px rgba(0,0,0,0.2)"
        />
      )}
    </Box>
  );
};

export default UserAvatar;
