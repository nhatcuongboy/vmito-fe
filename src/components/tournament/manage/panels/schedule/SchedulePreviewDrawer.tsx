'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import { VStack } from '@/components/ui/chakra-compat';
import { VModal } from '@/components/ui/VModal';
import {
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Trophy,
  Layers,
  Users,
} from 'lucide-react';
import { IGenerateScheduleResponse } from '@/lib/api/types';

interface SchedulePreviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  generationResponse: IGenerateScheduleResponse;
  onViewSchedule: () => void;
  onCancel: () => void;
  isLoadingView?: boolean;
}

const CATEGORY_COLORS = [
  '#ECC94B',
  '#90CDF4',
  '#68D391',
  '#B794F4',
  '#FC8181',
  '#F6AD55',
  '#76E4F7',
  '#FEB2B2',
];

function getRoundLabel(round: string): string {
  const labels: Record<string, string> = {
    GROUP: 'Pool Play',
    POOL_PLAY: 'Pool Play',
    FINAL: 'Final',
    FINALS: 'Finals',
    SEMIFINALS: 'Semi Finals',
    SEMI_FINALS: 'Semi Finals',
    QUARTERFINALS: 'Quarter Finals',
    QUARTER_FINALS: 'Quarter Finals',
    '3RD': '3rd Place',
    ROUND_OF_16: 'Round of 16',
  };
  return labels[round] ?? round.replace(/_/g, ' ');
}

function isGroupRound(round: string): boolean {
  const r = round.toUpperCase();
  return r === 'GROUP' || r === 'POOL_PLAY';
}

export default function SchedulePreviewDrawer({
  isOpen,
  onClose,
  generationResponse,
  onViewSchedule,
  onCancel,
  isLoadingView = false,
}: SchedulePreviewDrawerProps) {
  const { summary, conflicts } = generationResponse;
  const isComplete = summary.unscheduledMatches === 0;

  const handleCancel = () => {
    onCancel();
    onClose();
  };

  return (
    <VModal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Generated schedule"
      primaryActionText="View schedule"
      onPrimaryAction={onViewSchedule}
      isPrimaryLoading={isLoadingView}
      secondaryActionText="Cancel"
      onSecondaryAction={handleCancel}
      size="lg"
    >
      <VStack gap={4} align="stretch">
        {/* Success / Warning banner */}
        <Box
          p={4}
          bg={isComplete ? 'green.50' : 'orange.50'}
          borderRadius="xl"
          borderWidth="1px"
          borderColor={isComplete ? 'green.200' : 'orange.200'}
        >
          <Flex align="center" gap={3}>
            {isComplete ? (
              <CheckCircle size={20} color="#38A169" />
            ) : (
              <AlertTriangle size={20} color="#DD6B20" />
            )}
            <Text
              fontSize="sm"
              color={isComplete ? 'green.700' : 'orange.700'}
              fontWeight="medium"
            >
              {isComplete
                ? 'Successfully generated a schedule for all matches.'
                : `${summary.unscheduledMatches} match(es) could not be scheduled. Consider adding more time slots.`}
            </Text>
          </Flex>
        </Box>

        {/* Category cards */}
        <Flex gap={3} flexWrap="wrap">
          {summary.byCategory.map((cat, idx) => {
            const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
            return (
              <Box
                key={cat.categoryId}
                borderWidth="2px"
                borderColor={color}
                borderRadius="xl"
                p={4}
                flex="1 1 200px"
                minW="180px"
              >
                {/* Category header */}
                <Flex align="center" gap={2} mb={3}>
                  <Layers size={16} color={color} />
                  <Text fontWeight="bold" fontSize="sm" flex={1}>
                    {cat.categoryName}
                  </Text>
                  <Text
                    fontSize="sm"
                    color={
                      cat.scheduled === cat.total ? 'green.600' : 'red.500'
                    }
                    fontWeight="bold"
                  >
                    {cat.scheduled} / {cat.total}
                  </Text>
                </Flex>

                {/* Round breakdown with nested groups */}
                <VStack gap={2} align="stretch">
                  {cat.byRound.map((r, ri) => (
                    <Box key={ri}>
                      {/* Round header */}
                      <Flex
                        align="center"
                        justify="space-between"
                        fontSize="sm"
                        color="gray.700"
                      >
                        <Flex align="center" gap={2}>
                          {isGroupRound(r.round) ? (
                            <RefreshCw size={13} />
                          ) : (
                            <Trophy size={13} />
                          )}
                          <Text fontWeight="medium">
                            {getRoundLabel(r.round)}
                          </Text>
                        </Flex>
                        <Text
                          color={
                            r.scheduled === r.total ? 'green.600' : 'red.500'
                          }
                          fontWeight="medium"
                        >
                          {r.scheduled} / {r.total}
                        </Text>
                      </Flex>

                      {/* Group sub-items (Pool A, Pool B, etc.) */}
                      {r.byGroup && r.byGroup.length > 0 && (
                        <VStack gap={0.5} align="stretch" mt={1} pl={5}>
                          {r.byGroup.map((g) => (
                            <Flex
                              key={g.groupId}
                              align="center"
                              justify="space-between"
                              fontSize="xs"
                              color="gray.500"
                            >
                              <Flex align="center" gap={1.5}>
                                <Users size={11} />
                                <Text>{g.groupName}</Text>
                              </Flex>
                              <Text
                                color={
                                  g.scheduled === g.total
                                    ? 'green.600'
                                    : 'red.500'
                                }
                                fontWeight="medium"
                              >
                                {g.scheduled} / {g.total}
                              </Text>
                            </Flex>
                          ))}
                        </VStack>
                      )}
                    </Box>
                  ))}
                </VStack>
              </Box>
            );
          })}
        </Flex>

        {/* Conflicts (if any) */}
        {conflicts.length > 0 && (
          <Box
            p={3}
            bg="orange.50"
            borderRadius="lg"
            borderWidth="1px"
            borderColor="orange.200"
          >
            <Flex align="center" gap={2} mb={1}>
              <AlertTriangle size={14} color="#DD6B20" />
              <Text fontSize="xs" fontWeight="medium" color="orange.700">
                {conflicts.length} scheduling conflict(s)
              </Text>
            </Flex>
            {conflicts.slice(0, 3).map((c, i) => (
              <Text key={i} fontSize="xs" color="orange.600" pl={5}>
                • {c.reason}
              </Text>
            ))}
            {conflicts.length > 3 && (
              <Text fontSize="xs" color="orange.500" pl={5}>
                +{conflicts.length - 3} more
              </Text>
            )}
          </Box>
        )}
      </VStack>
    </VModal>
  );
}
