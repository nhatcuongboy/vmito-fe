'use client';

import { Box, Flex, Text, Heading } from '@chakra-ui/react';
import {
  RefreshCw,
  GitBranch,
  GitFork,
  Layers,
  Users,
  CalendarDays,
  Shuffle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useFormatWizard } from '../FormatWizardContext';
import { TournamentFormatType } from '../types';

const FORMAT_ICONS: Record<TournamentFormatType, React.ElementType> = {
  [TournamentFormatType.ROUND_ROBIN]: RefreshCw,
  [TournamentFormatType.SINGLE_ELIMINATION]: GitBranch,
  [TournamentFormatType.DOUBLE_ELIMINATION]: GitFork,
  [TournamentFormatType.ROUND_ROBIN_TO_SE]: Layers,
};

const NEXT_STEPS = [
  { icon: Users, key: 'manageTeams' },
  { icon: Shuffle, key: 'generateMatches' },
  { icon: CalendarDays, key: 'scheduleMatches' },
];

export default function StepConfirmation() {
  const t = useTranslations('pages.tournaments.detail.formatWizard');
  const { state } = useFormatWizard();
  const { selectedFormat } = state;

  if (!selectedFormat) return null;

  const Icon = FORMAT_ICONS[selectedFormat];

  return (
    <Flex h="full" justify="center" overflowY="auto">
      <Box maxW="600px" w="full" px={6} py={10}>
        {/* Success heading */}
        <Heading size="xl" mb={2}>
          {t('step3.title')}
        </Heading>
        <Text color="gray.500" mb={8}>
          {t('step3.description')}
        </Text>

        {/* Selected format card */}
        <Box
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="xl"
          p={6}
          mb={8}
          bg="gray.50"
        >
          <Flex justify="center">
            <Flex
              bg="white"
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="lg"
              px={4}
              py={3}
              align="center"
              gap={3}
              boxShadow="sm"
            >
              <Flex
                w="32px"
                h="32px"
                bg="gray.100"
                borderRadius="md"
                align="center"
                justify="center"
              >
                <Icon size={18} color="#4A5568" />
              </Flex>
              <Box>
                <Text fontSize="sm" fontWeight="bold">
                  {t(`formats.${selectedFormat}.cardLabel`)}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {t(`formats.${selectedFormat}.name`)}
                </Text>
              </Box>
            </Flex>
          </Flex>
        </Box>

        {/* What's next */}
        <Text fontWeight="bold" fontSize="lg" mb={4}>
          {t('step3.whatsNext')}
        </Text>

        <Flex direction="column" gap={4}>
          {NEXT_STEPS.map(({ icon: StepIcon, key }) => (
            <Flex key={key} align="center" gap={4}>
              <Flex
                w="40px"
                h="40px"
                bg="gray.100"
                borderRadius="lg"
                align="center"
                justify="center"
                flexShrink={0}
              >
                <StepIcon size={20} color="#4A5568" />
              </Flex>
              <Box>
                <Text fontWeight="semibold" fontSize="sm">
                  {t(`step3.nextSteps.${key}.title`)}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {t(`step3.nextSteps.${key}.description`)}
                </Text>
              </Box>
            </Flex>
          ))}
        </Flex>
      </Box>
    </Flex>
  );
}
