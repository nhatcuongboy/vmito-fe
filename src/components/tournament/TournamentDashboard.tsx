'use client';

import { useMemo, useState } from 'react';
import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import { Button, VStack } from '@/components/ui/chakra-compat';
import { ChevronUp, ChevronDown, CheckCircle2, LayoutGrid } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Tournament } from '@/lib/api/types';
import { useRouter } from '@/i18n/config';
import { useParams } from 'next/navigation';
import { getPrimaryVenueDisplay } from '@/utils';

interface Props {
  tournament: Tournament;
}

type StepId =
  | 'categories'
  | 'format'
  | 'teams'
  | 'rounds'
  | 'venue'
  | 'schedule'
  | 'publish';

const STEP_IDS: StepId[] = [
  'categories',
  'format',
  'teams',
  'rounds',
  'venue',
  'schedule',
  'publish',
];

const STEP_MANAGE_OPTION: Partial<Record<StepId, string>> = {
  categories: 'categories',
  format: 'format',
  teams: 'teams',
  rounds: 'rounds',
  venue: 'venues',
  schedule: 'schedule',
};

export default function TournamentDashboard({ tournament }: Props) {
  const t = useTranslations('pages.tournaments.detail.dashboard');
  const router = useRouter();
  const params = useParams();
  const slug = params.id as string;

  // Derive step completion from tournament data
  const completionMap = useMemo((): Record<StepId, boolean> => {
    const categories = tournament.categories ?? [];
    const hasCategories =
      (tournament._count?.categories ?? categories.length) > 0;
    const teamCount =
      (tournament._count?.players ?? 0) + (tournament._count?.pairs ?? 0);
    // Format is configured once the wizard has written a non-empty
    // formatConfig (same signal FormatPanel uses for its default-format hint)
    const hasFormat =
      categories.length > 0 &&
      categories.every(
        (c) => c.formatConfig && Object.keys(c.formatConfig).length > 0
      );
    const hasRounds =
      categories.length > 0 &&
      categories.every((c) => (c._count?.matches ?? 0) > 0);
    const hasVenue = !!getPrimaryVenueDisplay(tournament);

    return {
      categories: hasCategories,
      format: hasFormat,
      teams: teamCount >= 2,
      rounds: hasRounds,
      venue: hasVenue,
      schedule: (tournament.scheduledMatchesCount ?? 0) > 0,
      publish: tournament.isPublished,
    };
  }, [tournament]);

  const completedCount = useMemo(
    () => STEP_IDS.filter((id) => completionMap[id]).length,
    [completionMap]
  );
  const totalCount = STEP_IDS.length;
  const progressPercent = (completedCount / totalCount) * 100;

  // Completed steps are collapsed by default; incomplete steps are expanded
  const [expandedSteps, setExpandedSteps] = useState<Set<StepId>>(
    () => new Set(STEP_IDS.filter((id) => !completionMap[id]))
  );

  const toggleStep = (stepId: StepId) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  };

  const handleStepAction = (stepId: StepId) => {
    const option = STEP_MANAGE_OPTION[stepId];
    if (stepId === 'publish') {
      router.push(`/tournament/${slug}/manage`);
    } else if (option) {
      router.push(`/tournament/${slug}/manage?option=${option}`);
    }
  };

  return (
    <VStack gap={4} align="stretch" pt={{ base: 4, md: 0 }}>
      {/* Page heading */}
      <Flex
        justify="space-between"
        align="center"
        display={{ base: 'none', md: 'flex' }}
      >
        <Heading size="xl">{t('title')}</Heading>
      </Flex>

      {/* Continue setup banner */}
      <Box borderRadius="xl" overflow="hidden">
        <Flex
          bg="green.600"
          px={4}
          pt={4}
          pb={3}
          align="flex-start"
          justify="space-between"
          _dark={{ bg: 'green.700' }}
        >
          <Box>
            <Text color="white" fontWeight="bold" fontSize="md">
              {t('continueSetup.title')}
            </Text>
            <Text color="green.100" fontSize="sm" mt={0.5}>
              {t('continueSetup.description')}
            </Text>
          </Box>
          <Box color="white" flexShrink={0} ml={2} mt={0.5}>
            <LayoutGrid size={20} />
          </Box>
        </Flex>
        <Box
          bg="green.50"
          px={4}
          pt={2}
          pb={3}
          _dark={{ bg: 'rgba(34, 197, 94, 0.14)' }}
        >
          <Text
            fontSize="sm"
            color="gray.700"
            mb={2}
            _dark={{ color: 'green.100' }}
          >
            {t('continueSetup.progress', {
              completed: completedCount,
              total: totalCount,
            })}
          </Text>
          <Box bg="green.200" h="4px" borderRadius="full">
            <Box
              bg="green.500"
              h="4px"
              w={`${progressPercent}%`}
              borderRadius="full"
              transition="width 0.3s"
            />
          </Box>
        </Box>
      </Box>

      {/* Setup steps */}
      {STEP_IDS.map((stepId, index) => {
        const isDone = completionMap[stepId];
        const isExpanded = expandedSteps.has(stepId);
        const stepNumber = index + 1;

        return (
          <Box
            key={stepId}
            borderWidth="1px"
            borderColor={isDone ? 'green.200' : 'gray.200'}
            borderRadius="xl"
            overflow="hidden"
            bg={isDone ? 'green.50' : 'white'}
            _dark={{
              bg: isDone
                ? 'rgba(34, 197, 94, 0.13)'
                : 'var(--tournament-surface-raised, var(--chakra-colors-gray-800))',
              borderColor: isDone
                ? 'rgba(74, 222, 128, 0.34)'
                : 'var(--tournament-border, var(--chakra-colors-gray-700))',
              boxShadow: isDone
                ? '0 14px 34px rgba(34, 197, 94, 0.08)'
                : 'var(--tournament-shadow-soft)',
            }}
          >
            <Flex
              px={4}
              py={3}
              align="center"
              gap={3}
              cursor="pointer"
              onClick={() => toggleStep(stepId)}
              _hover={{ bg: isDone ? 'green.100' : 'gray.50' }}
              _dark={{
                _hover: {
                  bg: isDone
                    ? 'rgba(34, 197, 94, 0.18)'
                    : 'var(--tournament-surface-muted, var(--chakra-colors-gray-700))',
                },
              }}
            >
              {/* Step number or checkmark */}
              {isDone ? (
                <Box color="green.500" flexShrink={0}>
                  <CheckCircle2 size={24} />
                </Box>
              ) : (
                <Flex
                  w="24px"
                  h="24px"
                  borderRadius="full"
                  bg="gray.100"
                  color="gray.600"
                  align="center"
                  justify="center"
                  fontSize="xs"
                  fontWeight="semibold"
                  flexShrink={0}
                  _dark={{
                    bg: 'gray.700',
                    color: 'gray.300',
                  }}
                >
                  {stepNumber}
                </Flex>
              )}
              <Box flex="1">
                <Text
                  fontWeight="semibold"
                  fontSize="sm"
                  color={isDone ? 'green.700' : 'gray.800'}
                  textDecoration={isDone ? 'line-through' : 'none'}
                  _dark={{ color: isDone ? 'green.100' : 'gray.100' }}
                >
                  {t(`steps.${stepId}.title`)}
                </Text>
              </Box>
              {isExpanded ? (
                <ChevronUp size={18} color="var(--chakra-colors-gray-400)" />
              ) : (
                <ChevronDown size={18} color="var(--chakra-colors-gray-400)" />
              )}
            </Flex>

            {isExpanded && (
              <Box px={4} pb={4} pt={1}>
                <Text
                  color="gray.500"
                  fontSize="sm"
                  mb={3}
                  _dark={{ color: 'gray.400' }}
                >
                  {t(`steps.${stepId}.description`)}
                </Text>
                <Button
                  size="sm"
                  variant="solid"
                  colorPalette="green"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    handleStepAction(stepId);
                  }}
                >
                  {t(`steps.${stepId}.action`)}
                </Button>
              </Box>
            )}
          </Box>
        );
      })}
    </VStack>
  );
}
