'use client';

import { useMemo, useState } from 'react';
import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import { Button, VStack } from '@/components/ui/chakra-compat';
import {
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Circle,
  LayoutGrid,
  House,
  UserCog,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Tournament } from '@/lib/api/types';
import { useRouter } from '@/i18n/config';
import { useParams } from 'next/navigation';

interface Props {
  tournament: Tournament;
}

type StepId = 'format' | 'teams' | 'rounds' | 'venue' | 'schedule' | 'publish';

const STEP_IDS: StepId[] = [
  'format',
  'teams',
  'rounds',
  'venue',
  'schedule',
  'publish',
];

const STEP_MANAGE_OPTION: Partial<Record<StepId, string>> = {
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
    const hasCategories =
      (tournament._count?.categories ?? tournament.categories?.length ?? 0) > 0;
    const hasTeams =
      (tournament._count?.players ?? 0) + (tournament._count?.pairs ?? 0) > 0;
    const hasVenue = !!tournament.venue;

    return {
      format: hasCategories,
      teams: hasTeams,
      rounds: false, // cannot determine without fetching matches
      venue: hasVenue,
      schedule: false, // cannot determine without fetching schedule
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
    <VStack gap={4} align="stretch">
      {/* Page heading */}
      <Flex justify="space-between" align="center">
        <Heading size="xl">{t('title')}</Heading>
      </Flex>

      {/* Continue setup banner */}
      <Box borderRadius="xl" overflow="hidden">
        <Flex
          bg="green.700"
          px={4}
          pt={4}
          pb={3}
          align="flex-start"
          justify="space-between"
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
        <Box bg="green.50" px={4} pt={2} pb={3}>
          <Text fontSize="sm" color="gray.700" mb={2}>
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
      {STEP_IDS.map((stepId) => {
        const isDone = completionMap[stepId];
        const isExpanded = expandedSteps.has(stepId);

        return (
          <Box
            key={stepId}
            borderWidth="1px"
            borderColor={isDone ? 'green.200' : 'gray.200'}
            borderRadius="xl"
            overflow="hidden"
            bg={isDone ? 'green.50' : 'white'}
          >
            <Flex
              px={4}
              py={3}
              align="center"
              gap={3}
              cursor="pointer"
              onClick={() => toggleStep(stepId)}
              _hover={{ bg: isDone ? 'green.100' : 'gray.50' }}
            >
              {isDone ? (
                <Box color="green.500" flexShrink={0}>
                  <CheckCircle2 size={22} />
                </Box>
              ) : (
                <Box color="gray.300" flexShrink={0}>
                  <Circle size={22} />
                </Box>
              )}
              <Text
                fontWeight="semibold"
                flex="1"
                fontSize="sm"
                color={isDone ? 'green.700' : 'gray.800'}
                textDecoration={isDone ? 'line-through' : 'none'}
              >
                {t(`steps.${stepId}.title`)}
              </Text>
              {isExpanded ? (
                <ChevronUp size={18} color="var(--chakra-colors-gray-400)" />
              ) : (
                <ChevronDown size={18} color="var(--chakra-colors-gray-400)" />
              )}
            </Flex>

            {isExpanded && (
              <Box px={4} pb={4} pt={1}>
                <Text color="gray.500" fontSize="sm" mb={3}>
                  {t(`steps.${stepId}.description`)}
                </Text>
                <Button
                  size="sm"
                  variant="solid"
                  bg="gray.900"
                  color="white"
                  colorPalette="gray"
                  _hover={{ bg: 'gray.700' }}
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

      {/* Quick action: Customize home page */}
      <Flex
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="xl"
        p={4}
        gap={4}
        align="center"
      >
        <Flex
          w="56px"
          h="56px"
          bg="orange.50"
          borderRadius="lg"
          align="center"
          justify="center"
          flexShrink={0}
        >
          <House size={26} color="#c05621" />
        </Flex>
        <Box flex="1">
          <Text fontWeight="semibold" fontSize="sm" mb={0.5}>
            {t('quickActions.customizePage.title')}
          </Text>
          <Text color="gray.500" fontSize="sm" mb={3}>
            {t('quickActions.customizePage.description')}
          </Text>
          <Button size="sm" variant="outline" colorPalette="gray">
            {t('quickActions.customizePage.action')}
          </Button>
        </Box>
      </Flex>

      {/* Quick action: Invite admins */}
      <Flex
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="xl"
        p={4}
        gap={4}
        align="center"
      >
        <Flex
          w="56px"
          h="56px"
          bg="purple.50"
          borderRadius="lg"
          align="center"
          justify="center"
          flexShrink={0}
        >
          <UserCog size={26} color="#6b46c1" />
        </Flex>
        <Box flex="1">
          <Text fontWeight="semibold" fontSize="sm" mb={0.5}>
            {t('quickActions.inviteAdmins.title')}
          </Text>
          <Text color="gray.500" fontSize="sm" mb={3}>
            {t('quickActions.inviteAdmins.description')}
          </Text>
          <Button size="sm" variant="outline" colorPalette="gray">
            {t('quickActions.inviteAdmins.action')}
          </Button>
        </Box>
      </Flex>
    </VStack>
  );
}
