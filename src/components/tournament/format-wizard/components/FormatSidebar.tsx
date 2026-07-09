'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import {
  LayoutGrid,
  RefreshCw,
  GitBranch,
  GitFork,
  Layers,
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

const FILTER_ITEMS: { id: TournamentFormatType; icon: React.ElementType }[] = [
  { id: TournamentFormatType.ROUND_ROBIN, icon: RefreshCw },
  { id: TournamentFormatType.SINGLE_ELIMINATION, icon: GitBranch },
  { id: TournamentFormatType.DOUBLE_ELIMINATION, icon: GitFork },
  { id: TournamentFormatType.ROUND_ROBIN_TO_SE, icon: Layers },
];

interface FormatSidebarProps {
  step: 1 | 2 | 3 | 4;
}

export default function FormatSidebar({ step }: FormatSidebarProps) {
  const t = useTranslations('pages.tournaments.detail.formatWizard');
  const { state, setFilter } = useFormatWizard();
  const { filterCategory, selectedFormat } = state;

  if (step === 1) {
    return (
      <Box
        w={{ base: 'full', md: '280px' }}
        flexShrink={0}
        borderRightWidth={{ base: 0, md: '1px' }}
        borderColor="gray.200"
        _dark={{ borderColor: 'gray.700' }}
        p={5}
        overflowY="auto"
      >
        {/* Header */}
        <Flex align="center" gap={3} mb={1}>
          <Flex
            w="40px"
            h="40px"
            bg="gray.100"
            _dark={{ bg: 'gray.700' }}
            borderRadius="lg"
            align="center"
            justify="center"
          >
            <LayoutGrid size={20} color="#4A5568" />
          </Flex>
          <Box>
            <Text fontWeight="bold" fontSize="lg">
              {t('step1.title')}
            </Text>
          </Box>
        </Flex>
        <Text fontSize="sm" color="gray.500" mb={6}>
          {t('step1.description')}
        </Text>

        {/* All Templates */}
        <SidebarItem
          icon={LayoutGrid}
          label={t('step1.allTemplates')}
          isActive={filterCategory === null}
          onClick={() => setFilter(null)}
        />

        {/* Filter By */}
        <Text
          fontSize="xs"
          fontWeight="semibold"
          color="gray.400"
          textTransform="uppercase"
          letterSpacing="wider"
          mt={4}
          mb={2}
          px={3}
        >
          {t('step1.filterBy')}
        </Text>

        {FILTER_ITEMS.map((item) => (
          <SidebarItem
            key={item.id}
            icon={item.icon}
            label={t(`formats.${item.id}.name`)}
            isActive={filterCategory === item.id}
            onClick={() =>
              setFilter(filterCategory === item.id ? null : item.id)
            }
          />
        ))}
      </Box>
    );
  }

  if (step === 2 && selectedFormat) {
    const Icon = FORMAT_ICONS[selectedFormat];
    // For RRSE, step 2 shows "Round Robin" sidebar
    const isRRSE = selectedFormat === TournamentFormatType.ROUND_ROBIN_TO_SE;
    const sidebarFormat = isRRSE
      ? TournamentFormatType.ROUND_ROBIN
      : selectedFormat;
    const SidebarIcon = isRRSE ? RefreshCw : Icon;
    return (
      <Box
        w={{ base: 'full', md: '280px' }}
        flexShrink={0}
        borderRightWidth={{ base: 0, md: '1px' }}
        borderColor="gray.200"
        _dark={{ borderColor: 'gray.700' }}
        p={5}
        overflowY="auto"
      >
        <Flex align="center" gap={3} mb={1}>
          <Flex
            w="40px"
            h="40px"
            bg="gray.100"
            _dark={{ bg: 'gray.700' }}
            borderRadius="lg"
            align="center"
            justify="center"
          >
            <SidebarIcon size={20} color="#4A5568" />
          </Flex>
          <Box>
            <Text fontWeight="bold" fontSize="lg">
              {t(`formats.${sidebarFormat}.name`)}
            </Text>
          </Box>
        </Flex>
        <Text fontSize="sm" color="gray.500">
          {t(`formats.${sidebarFormat}.configDescription`)}
        </Text>
      </Box>
    );
  }

  // Step 3: Playoffs sidebar (only for RRSE format)
  if (step === 3 && selectedFormat === TournamentFormatType.ROUND_ROBIN_TO_SE) {
    return (
      <Box
        w={{ base: 'full', md: '280px' }}
        flexShrink={0}
        borderRightWidth={{ base: 0, md: '1px' }}
        borderColor="gray.200"
        _dark={{ borderColor: 'gray.700' }}
        p={5}
        overflowY="auto"
      >
        <Flex align="center" gap={3} mb={1}>
          <Flex
            w="40px"
            h="40px"
            bg="gray.100"
            _dark={{ bg: 'gray.700' }}
            borderRadius="lg"
            align="center"
            justify="center"
          >
            <GitBranch size={20} color="#4A5568" />
          </Flex>
          <Box>
            <Text fontWeight="bold" fontSize="lg">
              {t('config.playoffs.title')}
            </Text>
          </Box>
        </Flex>
        <Text fontSize="sm" color="gray.500">
          {t('config.playoffs.description')}
        </Text>
      </Box>
    );
  }

  return null;
}

function SidebarItem({
  icon: Icon,
  label,
  isActive,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <Flex
      align="center"
      gap={3}
      px={3}
      py={2}
      borderRadius="md"
      cursor="pointer"
      bg={isActive ? 'gray.100' : 'transparent'}
      fontWeight={isActive ? 'semibold' : 'normal'}
      color={isActive ? 'gray.900' : 'gray.600'}
      _hover={{ bg: 'gray.50' }}
      _dark={{
        bg: isActive ? 'gray.700' : 'transparent',
        color: isActive ? 'white' : 'gray.300',
        _hover: { bg: 'gray.700' },
      }}
      onClick={onClick}
      transition="all 0.15s"
    >
      <Icon size={18} />
      <Text fontSize="sm">{label}</Text>
    </Flex>
  );
}
