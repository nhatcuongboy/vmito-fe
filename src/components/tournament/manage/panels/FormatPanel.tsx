'use client';

import { useState } from 'react';
import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { ChevronDown, RefreshCw, GitBranch } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Category, CategoryFormat } from '@/lib/api/types';

interface FormatPanelProps {
  categories: Category[];
  selectedCategory: Category | null;
  onSelectCategory: (category: Category) => void;
  onSwitchFormat: () => void;
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

const FORMAT_INFO: Record<
  string,
  {
    icons: React.ElementType[];
    labelKeys: string[];
    subtitleKeys: string[];
    formatKey: string;
  }
> = {
  [CategoryFormat.ROUND_ROBIN]: {
    icons: [RefreshCw],
    labelKeys: ['poolPlay'],
    subtitleKeys: ['roundRobin'],
    formatKey: 'roundRobin',
  },
  [CategoryFormat.SINGLE_ELIMINATION]: {
    icons: [GitBranch],
    labelKeys: ['playoffs'],
    subtitleKeys: ['singleElimination'],
    formatKey: 'singleElimination',
  },
  [CategoryFormat.ROUND_ROBIN_TO_SE]: {
    icons: [RefreshCw, GitBranch],
    labelKeys: ['poolPlay', 'playoffs'],
    subtitleKeys: ['roundRobin', 'singleElimination'],
    formatKey: 'roundRobinToSingleElimination',
  },
};

export default function FormatPanel({
  categories,
  selectedCategory,
  onSelectCategory,
  onSwitchFormat,
}: FormatPanelProps) {
  const t = useTranslations('pages.tournaments.detail.manage');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const activeCategory = selectedCategory || categories[0];
  const activeCategoryIndex = categories.findIndex(
    (category) => category.id === activeCategory?.id
  );
  const activeCategoryColor =
    CATEGORY_COLORS[activeCategoryIndex % CATEGORY_COLORS.length] ?? '#63B3ED';
  const formatInfo = activeCategory ? FORMAT_INFO[activeCategory.format] : null;

  return (
    <Box>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md">{t('panels.format.title')}</Heading>
        <Button size="sm" variant="outline" onClick={onSwitchFormat}>
          {t('panels.format.switchFormat')}
        </Button>
      </Flex>

      {/* Category selector */}
      {categories.length > 1 && (
        <Box position="relative" mb={4} maxW="220px">
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

      {formatInfo && (
        <>
          {/* Format visualization */}
          <Box bg="gray.50" borderRadius="xl" p={6} mb={4}>
            <Flex gap={3} align="center" justify="center">
              {formatInfo.icons.map((Icon, idx) => (
                <Flex key={idx} align="center" gap={3}>
                  {idx > 0 && <Box w="24px" h="1px" bg="gray.300" />}
                  <Flex
                    bg="white"
                    borderWidth="1px"
                    borderColor="gray.200"
                    borderRadius="xl"
                    px={4}
                    py={3}
                    align="center"
                    gap={3}
                    boxShadow="sm"
                  >
                    <Flex
                      w="32px"
                      h="32px"
                      bg={idx === 0 ? 'blue.50' : 'orange.50'}
                      borderRadius="md"
                      align="center"
                      justify="center"
                    >
                      <Icon
                        size={16}
                        color={idx === 0 ? '#3182CE' : '#DD6B20'}
                      />
                    </Flex>
                    <Box>
                      <Text fontSize="sm" fontWeight="semibold">
                        {t(`panels.format.labels.${formatInfo.labelKeys[idx]}`)}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {t(
                          `panels.format.labels.${formatInfo.subtitleKeys[idx]}`
                        )}
                      </Text>
                    </Box>
                  </Flex>
                </Flex>
              ))}
            </Flex>
          </Box>

          {/* Format description */}
          <Heading size="sm" mb={2}>
            {t(`panels.format.formats.${formatInfo.formatKey}.title`)}
          </Heading>
          <Text fontSize="sm" color="gray.600" lineHeight="1.6">
            {t(`panels.format.formats.${formatInfo.formatKey}.description`)}
          </Text>
        </>
      )}
    </Box>
  );
}
