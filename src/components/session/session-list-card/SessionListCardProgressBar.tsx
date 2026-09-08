'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';

interface SessionListCardProgressBarProps {
  current: number;
  total: number;
  courtsCount: number;
}

// Below this many open slots, the copy switches to an urgency tone.
const URGENT_SLOTS_THRESHOLD = 2;

export const SessionListCardProgressBar = ({
  current,
  total,
  courtsCount,
}: SessionListCardProgressBarProps) => {
  const t = useTranslations('session');
  const availableSlots = Math.max(total - current, 0);
  const isFull = availableSlots === 0;
  const isUrgent = !isFull && availableSlots <= URGENT_SLOTS_THRESHOLD;
  const percent = total > 0 ? Math.min((current / total) * 100, 100) : 0;

  const slotsLabel = isFull
    ? t('slotsFull')
    : isUrgent
      ? t('slotsAvailableUrgent', { count: availableSlots })
      : t('slotsAvailable', { count: availableSlots });

  const slotsColor = isFull ? 'red.500' : isUrgent ? 'orange.500' : 'brand.600';
  const barColor = isFull ? 'red.400' : isUrgent ? 'orange.400' : 'green.500';

  return (
    <Box mt={1}>
      <Flex align="center" justify="space-between" gap={2} mb={1}>
        <Text
          fontSize="xs"
          fontWeight="semibold"
          color={slotsColor}
          lineClamp={1}
        >
          {slotsLabel}
        </Text>
        <Text fontSize="xs" color="fg.muted" flexShrink={0}>
          {t('courtsLabel', { count: courtsCount })}
        </Text>
      </Flex>
      <Box
        h="8px"
        w="100%"
        borderRadius="full"
        bg="gray.100"
        borderWidth="1px"
        borderColor="gray.200"
        overflow="hidden"
        _dark={{ bg: 'gray.700', borderColor: 'gray.600' }}
      >
        <Box
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={current}
          h="100%"
          minW={percent > 0 ? '8px' : 0}
          borderRadius="full"
          bg={barColor}
          width={`${percent}%`}
          transition="width 0.3s ease, background-color 0.3s ease"
        />
      </Box>
    </Box>
  );
};
