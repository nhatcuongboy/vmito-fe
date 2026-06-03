'use client';

import { useState } from 'react';
import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import { Button, VStack } from '@/components/ui/chakra-compat';
import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useModal } from '@/components/ui/VModal';
import { Category } from '@/lib/api/types';
import { CategoryService } from '@/lib/api/category.service';
import {
  DEFAULT_TIEBREAKERS,
  DEFAULT_STATISTICS,
  DEFAULT_STANDINGS_COLUMNS,
  DEFAULT_RR_CONFIG,
} from '@/components/tournament/format-wizard/constants';
import type {
  TiebreakerItem,
  StatisticItem,
  StandingsColumn,
  RoundRobinConfig,
} from '@/components/tournament/format-wizard/types';
import ManageStandingsModal from './ManageStandingsModal';

interface StandingsPanelProps {
  categories: Category[];
  selectedCategory: Category | null;
  onSelectCategory: (category: Category) => void;
  onCategoryUpdated?: () => void;
}

const CATEGORY_COLORS = [
  '#ECC94B',
  '#63B3ED',
  '#68D391',
  '#FC8181',
  '#B794F4',
  '#F6AD55',
  '#76E4F7',
  '#FEB2B2',
];

export default function StandingsPanel({
  categories,
  selectedCategory,
  onSelectCategory,
  onCategoryUpdated,
}: StandingsPanelProps) {
  const t = useTranslations('pages.tournaments.detail.manage');
  const tConfig = useTranslations(
    'pages.tournaments.detail.formatWizard.config.rr'
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const modal = useModal();
  const activeCategory = selectedCategory || categories[0];
  const activeCategoryIndex = categories.findIndex(
    (category) => category.id === activeCategory?.id
  );
  const activeCategoryColor =
    CATEGORY_COLORS[activeCategoryIndex % CATEGORY_COLORS.length] ?? '#63B3ED';

  // Get config from category or use defaults
  const config =
    (activeCategory?.formatConfig as Record<string, unknown>) || {};
  const rrConfig = (config.roundRobin as Record<string, unknown>) ?? config;
  const winPoints =
    (rrConfig.winPoints as number) ?? DEFAULT_RR_CONFIG.winPoints;
  const tiePoints =
    (rrConfig.tiePoints as number) ?? DEFAULT_RR_CONFIG.tiePoints;
  const lossPoints =
    (rrConfig.lossPoints as number) ?? DEFAULT_RR_CONFIG.lossPoints;
  const forfeitWinPoints =
    (rrConfig.forfeitWinPoints as number) ?? DEFAULT_RR_CONFIG.forfeitWinPoints;
  const forfeitLossPoints =
    (rrConfig.forfeitLossPoints as number) ??
    DEFAULT_RR_CONFIG.forfeitLossPoints;
  const gameWinPoints =
    (rrConfig.gameWinPoints as number) ?? DEFAULT_RR_CONFIG.gameWinPoints;
  const gameLossPoints =
    (rrConfig.gameLossPoints as number) ?? DEFAULT_RR_CONFIG.gameLossPoints;
  const tiebreakers =
    (rrConfig.tiebreakers as TiebreakerItem[]) ?? DEFAULT_TIEBREAKERS;
  const statistics =
    (rrConfig.statistics as StatisticItem[]) ?? DEFAULT_STATISTICS;
  const standingsColumns =
    (rrConfig.standingsColumns as StandingsColumn[]) ??
    DEFAULT_STANDINGS_COLUMNS;

  const handleSave = async (newConfig: RoundRobinConfig) => {
    if (!activeCategory) return;

    // Preserve existing formatConfig and update RR config
    const existingConfig =
      (activeCategory.formatConfig as Record<string, unknown>) || {};
    let updatedConfig: Record<string, unknown>;

    if ('roundRobin' in existingConfig) {
      // ROUND_ROBIN_TO_SE: nest under roundRobin
      updatedConfig = { ...existingConfig, roundRobin: newConfig };
    } else {
      // ROUND_ROBIN: top-level
      updatedConfig = { ...existingConfig, ...newConfig };
    }

    await CategoryService.updateCategory(activeCategory.id, {
      formatConfig: updatedConfig,
    });
    onCategoryUpdated?.();
  };

  return (
    <VStack gap={6} align="stretch">
      {/* Header */}
      <Flex justify="space-between" align="center">
        <Heading size="md">{t('panels.standings.title')}</Heading>
        <Button size="sm" variant="outline" onClick={modal.onOpen}>
          {t('panels.standings.manageStandings')}
        </Button>
      </Flex>

      {/* Category selector */}
      {categories.length > 1 && (
        <Box position="relative" maxW="220px">
          <Flex
            as="button"
            align="center"
            gap={2}
            px={3}
            py={1.5}
            borderRadius="full"
            bg="gray.100"
            _hover={{ bg: 'gray.200' }}
            cursor="pointer"
            fontSize="sm"
            fontWeight="medium"
            w="full"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
          >
            <Box
              w="8px"
              h="8px"
              borderRadius="full"
              bg={activeCategoryColor}
              flexShrink={0}
            />
            <Text
              flex="1"
              textAlign="left"
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
            >
              {activeCategory?.name}
            </Text>
            <ChevronDown size={14} />
          </Flex>

          {isDropdownOpen && (
            <>
              <Box
                position="fixed"
                inset={0}
                zIndex={10}
                onClick={() => setIsDropdownOpen(false)}
              />
              <Box
                position="absolute"
                top="calc(100% + 4px)"
                left={0}
                zIndex={11}
                bg="white"
                borderRadius="xl"
                boxShadow="md"
                minW="160px"
                py={1}
                border="1px solid"
                borderColor="gray.100"
              >
                {categories.map((cat, idx) => (
                  <Flex
                    key={cat.id}
                    as="button"
                    align="center"
                    gap={2}
                    px={4}
                    py={2.5}
                    w="full"
                    fontSize="sm"
                    _hover={{ bg: 'gray.50' }}
                    onClick={() => {
                      onSelectCategory(cat);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <Box
                      w="8px"
                      h="8px"
                      borderRadius="full"
                      bg={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}
                      flexShrink={0}
                    />
                    <Text>{cat.name}</Text>
                  </Flex>
                ))}
              </Box>
            </>
          )}
        </Box>
      )}

      {/* Points */}
      <Box>
        <Heading size="sm" mb={2}>
          {t('panels.standings.points')}
        </Heading>
        <VStack gap={1} align="stretch" pl={2}>
          <Text fontSize="sm" color="gray.600">
            • {winPoints} {t('panels.standings.pointsPerWin')}
          </Text>
          <Text fontSize="sm" color="gray.600">
            • {tiePoints} {t('panels.standings.pointsPerTie')}
          </Text>
          {lossPoints > 0 && (
            <Text fontSize="sm" color="gray.600">
              • {lossPoints} {t('panels.standings.pointsPerLoss')}
            </Text>
          )}
          {gameWinPoints > 0 && (
            <Text fontSize="sm" color="gray.600">
              • {gameWinPoints} {t('panels.standings.pointsPerGameWin')}
            </Text>
          )}
          {gameLossPoints > 0 && (
            <Text fontSize="sm" color="gray.600">
              • {gameLossPoints} {t('panels.standings.pointsPerGameLoss')}
            </Text>
          )}
          {forfeitWinPoints > 0 && (
            <Text fontSize="sm" color="gray.600">
              • {forfeitWinPoints} {t('panels.standings.pointsPerForfeitWin')}
            </Text>
          )}
          {forfeitLossPoints > 0 && (
            <Text fontSize="sm" color="gray.600">
              • {forfeitLossPoints} {t('panels.standings.pointsPerForfeitLoss')}
            </Text>
          )}
        </VStack>
      </Box>

      {/* Tiebreakers */}
      <Box>
        <Heading size="sm" mb={2}>
          {tConfig('tiebreakers')}
        </Heading>
        <VStack gap={2} align="stretch">
          {tiebreakers.map((tb, idx) => (
            <Flex key={tb.id} align="center" gap={3}>
              <Flex
                w="24px"
                h="24px"
                bg="blue.50"
                borderRadius="md"
                align="center"
                justify="center"
                flexShrink={0}
              >
                <Text fontSize="xs" fontWeight="bold" color="blue.600">
                  {idx + 1}
                </Text>
              </Flex>
              <Box>
                <Text fontSize="sm" fontWeight="medium">
                  {tConfig(`tiebreakerItems.${tb.label}`)}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {tConfig(`tiebreakerItems.${tb.description}`)}
                </Text>
              </Box>
            </Flex>
          ))}
        </VStack>
      </Box>

      {/* Statistics */}
      <Box>
        <Heading size="sm" mb={2}>
          {tConfig('teamStatistics')}
        </Heading>
        <VStack gap={2} align="stretch">
          {statistics.map((stat) => (
            <Flex key={stat.id} align="center" gap={3}>
              <Flex
                w="24px"
                h="24px"
                bg="gray.100"
                borderRadius="md"
                align="center"
                justify="center"
                flexShrink={0}
              >
                <Text fontSize="xs" fontWeight="bold" color="gray.600">
                  {stat.abbreviation}
                </Text>
              </Flex>
              <Text fontSize="sm" fontWeight="medium" flex="1">
                {tConfig(`statisticItems.${stat.label}`)}
              </Text>
              {stat.required && (
                <Box
                  bg="gray.100"
                  px={2}
                  py={0.5}
                  borderRadius="md"
                  fontSize="2xs"
                  fontWeight="bold"
                  color="gray.500"
                >
                  {t('panels.standings.required')}
                </Box>
              )}
            </Flex>
          ))}
        </VStack>
      </Box>

      {/* Standings columns */}
      <Box>
        <Heading size="sm" mb={2}>
          {tConfig('standings')}
        </Heading>
        <VStack gap={2} align="stretch">
          {/* Points is always first and required */}
          <Flex align="center" gap={3}>
            <Flex
              w="24px"
              h="24px"
              bg="blue.50"
              borderRadius="md"
              align="center"
              justify="center"
              flexShrink={0}
            >
              <Text fontSize="xs" fontWeight="bold" color="blue.600">
                PTS
              </Text>
            </Flex>
            <Text fontSize="sm" fontWeight="medium" flex="1">
              Points
            </Text>
            <Box
              bg="gray.100"
              px={2}
              py={0.5}
              borderRadius="md"
              fontSize="2xs"
              fontWeight="bold"
              color="gray.500"
            >
              {t('panels.standings.required')}
            </Box>
          </Flex>
          {standingsColumns.map((col) => (
            <Flex key={col.id} align="center" gap={3}>
              <Flex
                w="24px"
                h="24px"
                bg="gray.100"
                borderRadius="md"
                align="center"
                justify="center"
                flexShrink={0}
              >
                <Text fontSize="2xs" fontWeight="bold" color="gray.600">
                  {col.abbreviation}
                </Text>
              </Flex>
              <Text fontSize="sm" fontWeight="medium">
                {tConfig(`standingsItems.${col.label}`)}
              </Text>
            </Flex>
          ))}
        </VStack>
      </Box>

      {/* Manage Standings Modal */}
      <ManageStandingsModal
        isOpen={modal.isOpen}
        onClose={modal.onClose}
        category={activeCategory}
        onSave={handleSave}
      />
    </VStack>
  );
}
