'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import { RefreshCw, GitBranch } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { TournamentFormatType } from '../types';

interface FormatCardProps {
  formatId: TournamentFormatType;
  isSelected: boolean;
  onSelect: () => void;
}

const FORMAT_ICONS: Record<
  TournamentFormatType,
  { icons: React.ElementType[]; labels: string[] }
> = {
  [TournamentFormatType.ROUND_ROBIN]: {
    icons: [RefreshCw],
    labels: ['Pool Play'],
  },
  [TournamentFormatType.SINGLE_ELIMINATION]: {
    icons: [GitBranch],
    labels: ['Bracket'],
  },
  [TournamentFormatType.ROUND_ROBIN_TO_SE]: {
    icons: [RefreshCw, GitBranch],
    labels: ['Pool Play', 'Playoffs'],
  },
};

export default function FormatCard({
  formatId,
  isSelected,
  onSelect,
}: FormatCardProps) {
  const t = useTranslations('pages.tournaments.detail.formatWizard');
  const { icons, labels } = FORMAT_ICONS[formatId];

  return (
    <Box
      borderWidth="2px"
      borderColor={isSelected ? 'gray.800' : 'gray.200'}
      borderRadius="xl"
      overflow="hidden"
      cursor="pointer"
      onClick={onSelect}
      transition="all 0.15s"
      _hover={{ borderColor: isSelected ? 'gray.800' : 'gray.400' }}
      bg={isSelected ? 'gray.50' : 'white'}
    >
      {/* Icon area */}
      <Flex
        bg="gray.50"
        py={6}
        px={4}
        justify="center"
        align="center"
        gap={3}
        minH="100px"
      >
        {icons.map((Icon, idx) => (
          <Flex key={idx} align="center" gap={2}>
            {idx > 0 && <Box w="20px" h="1px" bg="gray.300" />}
            <Flex
              bg="white"
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="lg"
              px={3}
              py={2}
              align="center"
              gap={2}
              boxShadow="sm"
            >
              <Flex
                w="28px"
                h="28px"
                bg="gray.100"
                borderRadius="md"
                align="center"
                justify="center"
              >
                <Icon size={16} color="#4A5568" />
              </Flex>
              <Box>
                <Text fontSize="xs" fontWeight="semibold" lineHeight="1.2">
                  {labels[idx]}
                </Text>
                <Text fontSize="xs" color="gray.500" lineHeight="1.2">
                  {t(`formats.${formatId}.subtitle`)}
                </Text>
              </Box>
            </Flex>
          </Flex>
        ))}
      </Flex>

      {/* Text content */}
      <Box px={4} py={3}>
        <Text fontWeight="bold" fontSize="sm" mb={1}>
          {t(`formats.${formatId}.name`)}
        </Text>
        <Text fontSize="sm" color="gray.500" lineHeight="1.4">
          {t(`formats.${formatId}.description`)}
        </Text>
      </Box>
    </Box>
  );
}
