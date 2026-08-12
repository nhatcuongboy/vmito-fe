'use client';

import { Box } from '@chakra-ui/react';

interface NotificationBadgeProps {
  count: number;
  max?: number;
  size?: 'sm' | 'md';
  'aria-label'?: string;
}

/**
 * Notification badge component for displaying unread counts.
 * Shows actual count if <= max, otherwise shows "max+".
 * Automatically hides when count is 0.
 */
export function NotificationBadge({
  count,
  max = 99,
  size = 'md',
  'aria-label': ariaLabel,
}: NotificationBadgeProps) {
  // Don't render if count is 0
  if (count <= 0) {
    return null;
  }

  const displayText = count > max ? `${max}+` : count.toString();

  // Size variants
  const sizeStyles = {
    sm: {
      minW: '16px',
      h: '16px',
      fontSize: '10px',
      px: count > 9 ? '3px' : '0',
    },
    md: {
      minW: '20px',
      h: '20px',
      fontSize: '11px',
      px: count > 9 ? '4px' : '0',
    },
  };

  const styles = sizeStyles[size];

  return (
    <Box
      as="span"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      minW={styles.minW}
      h={styles.h}
      px={styles.px}
      bg="red.500"
      color="white"
      fontSize={styles.fontSize}
      fontWeight="bold"
      lineHeight="1"
      borderRadius="full"
      position="absolute"
      top="-4px"
      right="-4px"
      boxShadow="0 2px 4px rgba(0, 0, 0, 0.2)"
      aria-label={ariaLabel || `${count} unread`}
      role="status"
      zIndex={1}
    >
      {displayText}
    </Box>
  );
}
