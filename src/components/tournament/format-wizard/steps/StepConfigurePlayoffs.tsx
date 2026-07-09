'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import { LegacySelect } from '@/components/ui/VSelect';
import { useTranslations } from 'next-intl';
import { useFormatWizard } from '../FormatWizardContext';
import FormatSidebar from '../components/FormatSidebar';
import {
  RoundRobinToSEConfig as RRToSEConfigType,
  MatchFormatValue,
  RoundFormats,
} from '../types';
import PerRoundFormatConfig from '../components/PerRoundFormatConfig';
import { Minus, Plus, RefreshCw, GitBranch } from 'lucide-react';

export default function StepConfigurePlayoffs() {
  const t = useTranslations('pages.tournaments.detail.formatWizard');
  const { state, updateConfig } = useFormatWizard();
  const config = state.config as RRToSEConfigType;

  const updateElim = (partial: Partial<RRToSEConfigType>) => {
    updateConfig({ ...config, ...partial });
  };

  return (
    <Flex h="full" direction={{ base: 'column', md: 'row' }}>
      <FormatSidebar step={3} />

      <Box flex={1} overflowY="auto" p={6}>
        <Flex direction={{ base: 'column', lg: 'row' }} gap={6} h="full">
          <Box flex={1} overflowY="auto" pr={{ lg: 4 }}>
            {/* Brackets count */}
            <Box mb={5}>
              <Text fontSize="sm" color="gray.600" mb={3}>
                {t('config.playoffs.bracketsQuestion')}
              </Text>
              <Flex align="center" gap={3}>
                <Flex
                  as="button"
                  w="32px"
                  h="32px"
                  borderRadius="full"
                  borderWidth="1px"
                  borderColor="gray.300"
                  align="center"
                  justify="center"
                  cursor="pointer"
                  _hover={{ bg: 'gray.50' }}
                  onClick={() =>
                    updateElim({
                      qualifiersPerGroup: Math.max(
                        1,
                        config.qualifiersPerGroup - 1
                      ),
                    })
                  }
                >
                  <Minus size={14} />
                </Flex>
                <Text
                  fontWeight="bold"
                  fontSize="lg"
                  minW="24px"
                  textAlign="center"
                >
                  {config.qualifiersPerGroup}
                </Text>
                <Flex
                  as="button"
                  w="32px"
                  h="32px"
                  borderRadius="full"
                  borderWidth="1px"
                  borderColor="gray.300"
                  align="center"
                  justify="center"
                  cursor="pointer"
                  _hover={{ bg: 'gray.50' }}
                  onClick={() =>
                    updateElim({
                      qualifiersPerGroup: Math.min(
                        4,
                        config.qualifiersPerGroup + 1
                      ),
                    })
                  }
                >
                  <Plus size={14} />
                </Flex>
              </Flex>
            </Box>

            {/* Format diagram - N bracket flows based on count */}
            <Box
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="lg"
              p={4}
              mb={5}
            >
              <Flex direction="column" gap={3}>
                {Array.from({ length: config.qualifiersPerGroup }, (_, i) => (
                  <Flex key={i} align="center" gap={3}>
                    {/* Pool Play */}
                    <Flex
                      bg="blue.50"
                      borderWidth="1px"
                      borderColor="blue.100"
                      borderRadius="md"
                      px={3}
                      py={2}
                      align="center"
                      gap={2}
                      flex={1}
                    >
                      <Flex
                        w="28px"
                        h="28px"
                        bg="blue.100"
                        borderRadius="md"
                        align="center"
                        justify="center"
                        flexShrink={0}
                      >
                        <RefreshCw size={13} color="#3182CE" />
                      </Flex>
                      <Box>
                        <Text fontSize="xs" fontWeight="bold">
                          {t('formats.ROUND_ROBIN.cardLabel')}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {t('formats.ROUND_ROBIN.subtitle')}
                        </Text>
                      </Box>
                    </Flex>

                    {/* Arrow */}
                    <Text color="gray.400" fontSize="sm" flexShrink={0}>
                      →
                    </Text>

                    {/* Playoffs */}
                    <Flex
                      bg="orange.50"
                      borderWidth="1px"
                      borderColor="orange.100"
                      borderRadius="md"
                      px={3}
                      py={2}
                      align="center"
                      gap={2}
                      flex={1}
                    >
                      <Flex
                        w="28px"
                        h="28px"
                        bg="orange.100"
                        borderRadius="md"
                        align="center"
                        justify="center"
                        flexShrink={0}
                      >
                        <GitBranch size={13} color="#DD6B20" />
                      </Flex>
                      <Box>
                        <Text fontSize="xs" fontWeight="bold">
                          {t('config.playoffs.title')}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {t('formats.SINGLE_ELIMINATION.subtitle')}
                        </Text>
                      </Box>
                    </Flex>
                  </Flex>
                ))}
              </Flex>
            </Box>

            {/* Match format */}
            <Box mb={5}>
              <Text fontSize="xs" color="gray.500" mb={1}>
                {t('config.se.matchFormat')}
              </Text>
              <LegacySelect
                value={config.eliminationMatchFormat}
                onChange={(e) =>
                  updateElim({
                    eliminationMatchFormat: e.target.value as MatchFormatValue,
                  })
                }
              >
                <option value="BEST_OF_1">{t('config.se.bestOf1')}</option>
                <option value="BEST_OF_3">{t('config.se.bestOf3')}</option>
                <option value="BEST_OF_5">{t('config.se.bestOf5')}</option>
              </LegacySelect>
            </Box>

            {/* Per-round format overrides */}
            <PerRoundFormatConfig
              baseFormat={config.eliminationMatchFormat}
              value={config.roundFormats ?? {}}
              onChange={(roundFormats: RoundFormats) =>
                updateElim({ roundFormats })
              }
            />

            {/* Seeding method */}
            <Box mb={5}>
              <Text fontSize="xs" color="gray.500" mb={1}>
                {t('config.se.seedingMethod')}
              </Text>
              <LegacySelect
                value={config.eliminationSeedingMethod}
                onChange={(e) =>
                  updateElim({
                    eliminationSeedingMethod: e.target.value as
                      | 'manual'
                      | 'random'
                      | 'ranking',
                  })
                }
              >
                <option value="manual">{t('config.se.manual')}</option>
                <option value="random">{t('config.se.random')}</option>
                <option value="ranking">{t('config.se.ranking')}</option>
              </LegacySelect>
            </Box>
          </Box>

          {/* Right: Bracket preview placeholder */}
          <Box w={{ base: 'full', lg: '45%' }} flexShrink={0}>
            <Box
              bg="orange.50"
              borderRadius="xl"
              p={6}
              minH="300px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text color="gray.400" fontSize="sm">
                {t('config.se.bracketPreview')}
              </Text>
            </Box>
          </Box>
        </Flex>
      </Box>
    </Flex>
  );
}
