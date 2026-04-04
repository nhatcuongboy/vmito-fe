'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import { VStack } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import { VModal } from '@/components/ui/VModal';
import { IGenerateScheduleResult } from '@/utils/schedule-generator';

const CATEGORY_COLORS = [
  'yellow.400',
  'blue.300',
  'green.400',
  'purple.400',
  'pink.400',
  'orange.400',
  'cyan.400',
  'red.400',
];

interface GenerationResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: IGenerateScheduleResult;
  onViewSchedule: () => void;
}

export default function GenerationResultModal({
  isOpen,
  onClose,
  result,
  onViewSchedule,
}: GenerationResultModalProps) {
  const t = useTranslations(
    'pages.tournaments.detail.manage.organize.schedule.result'
  );

  const totalScheduled = result.scheduled.length;
  const totalMatches = totalScheduled + result.unscheduled.length;
  const isComplete = result.unscheduled.length === 0;

  return (
    <VModal
      isOpen={isOpen}
      onClose={onClose}
      title={isComplete ? t('complete') : t('incomplete')}
      primaryActionText={t('viewSchedule')}
      onPrimaryAction={onViewSchedule}
      secondaryActionText="Cancel"
      size="lg"
      showCloseButton
    >
      <VStack gap={4} align="stretch">
        <Text fontSize="sm" color="gray.600">
          {t('scheduledCount', {
            scheduled: totalScheduled,
            total: totalMatches,
          })}
        </Text>

        {!isComplete && (
          <Box>
            <Text fontSize="sm" color="gray.600" mb={2}>
              To generate a complete schedule:
            </Text>
            <VStack gap={1} align="stretch" pl={4}>
              <Text fontSize="sm" color="gray.500">
                • {t('tips.moreSlots')}
              </Text>
              <Text fontSize="sm" color="gray.500">
                • {t('tips.reduceTime')}
              </Text>
              <Text fontSize="sm" color="gray.500">
                • {t('tips.minimizeConstraints')}
              </Text>
            </VStack>
          </Box>
        )}

        {/* Category breakdown */}
        <Flex gap={3} flexWrap="wrap">
          {result.summary.map((cat, idx) => (
            <Box
              key={cat.categoryId}
              borderWidth="1px"
              borderColor={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}
              borderRadius="xl"
              p={3}
              flex="1 1 200px"
              minW="180px"
            >
              <Flex align="center" gap={2} mb={2}>
                <Box
                  w="8px"
                  h="8px"
                  borderRadius="full"
                  bg={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}
                />
                <Text fontWeight="semibold" fontSize="sm">
                  {cat.categoryName}
                </Text>
                <Text
                  fontSize="sm"
                  ml="auto"
                  color={cat.scheduled === cat.total ? 'green.600' : 'red.500'}
                  fontWeight="medium"
                >
                  {cat.scheduled} / {cat.total}
                </Text>
              </Flex>

              <VStack gap={1} align="stretch" pl={4}>
                {cat.groups.map((group, gi) => (
                  <Flex
                    key={gi}
                    align="center"
                    justify="space-between"
                    fontSize="xs"
                    color="gray.600"
                  >
                    <Flex align="center" gap={1.5}>
                      <Text>{group.name}</Text>
                    </Flex>
                    <Text
                      color={
                        group.scheduled === group.total
                          ? 'green.600'
                          : 'red.500'
                      }
                      fontWeight="medium"
                    >
                      {group.scheduled} / {group.total}
                    </Text>
                  </Flex>
                ))}
              </VStack>
            </Box>
          ))}
        </Flex>
      </VStack>
    </VModal>
  );
}
