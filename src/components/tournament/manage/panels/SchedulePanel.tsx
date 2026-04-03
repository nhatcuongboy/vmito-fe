'use client';

import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import { VStack } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import { Category } from '@/lib/api/types';

interface SchedulePanelProps {
  categories: Category[];
}

export default function SchedulePanel({ categories }: SchedulePanelProps) {
  const t = useTranslations('pages.tournaments.detail.manage');

  const totalMatches = categories.reduce(
    (sum, cat) => sum + (cat._count?.matches || 0),
    0
  );
  // For now, assume all matches are scheduled
  const scheduledMatches = totalMatches;
  const unscheduledMatches = 0;
  const progress =
    totalMatches > 0 ? (scheduledMatches / totalMatches) * 100 : 0;
  const circumference = 2 * Math.PI * 44;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <VStack gap={4} align="stretch">
      <Heading size="md">{t('panels.schedule.title')}</Heading>

      {/* Circular progress */}
      <Flex direction="column" align="center" py={4} gap={3}>
        <Box position="relative" w="100px" h="100px">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="#E2E8F0"
              strokeWidth="6"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="#38A169"
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dashoffset 0.3s' }}
            />
          </svg>
          <Flex
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            align="center"
            justify="center"
          >
            <Text fontSize="lg" fontWeight="bold" color="green.600">
              {scheduledMatches} / {totalMatches}
            </Text>
          </Flex>
        </Box>
      </Flex>

      {/* Stats */}
      <VStack gap={2} align="stretch">
        <Flex align="center" gap={2}>
          <Box w="8px" h="8px" borderRadius="full" bg="green.400" />
          <Text fontSize="sm">
            {scheduledMatches} {t('panels.schedule.scheduled')}
          </Text>
        </Flex>
        <Flex align="center" gap={2}>
          <Box w="8px" h="8px" borderRadius="full" bg="gray.300" />
          <Text fontSize="sm" color="gray.500">
            {unscheduledMatches} {t('panels.schedule.unscheduled')}
          </Text>
        </Flex>
      </VStack>
    </VStack>
  );
}
