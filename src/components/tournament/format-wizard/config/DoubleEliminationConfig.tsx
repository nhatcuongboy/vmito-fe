'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import { LegacySelect } from '@/components/ui/VSelect';
import { VSwitch } from '@/components/ui/VSwitch';
import { useTranslations } from 'next-intl';
import { useFormatWizard } from '../FormatWizardContext';
import {
  DoubleEliminationConfig as DEConfigType,
  MatchFormatValue,
  RoundFormats,
} from '../types';
import PerRoundFormatConfig from '../components/PerRoundFormatConfig';

export default function DoubleEliminationConfig() {
  const t = useTranslations('pages.tournaments.detail.formatWizard');
  const { state, updateConfig } = useFormatWizard();
  const config = state.config as DEConfigType;
  if (!config) return null;

  const update = (partial: Partial<DEConfigType>) => {
    updateConfig({ ...config, ...partial });
  };

  return (
    <Flex direction={{ base: 'column', lg: 'row' }} gap={6} align="flex-start">
      <Box flex={1} minW={0} pr={{ lg: 4 }}>
        {/* Seeding method */}
        <Box mb={5}>
          <Text fontSize="xs" color="gray.500" mb={1}>
            {t('config.se.seedingMethod')}
          </Text>
          <LegacySelect
            value={config.seedingMethod}
            onChange={(e) =>
              update({
                seedingMethod: e.target.value as
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

        {/* Match format */}
        <Box mb={5}>
          <Text fontSize="xs" color="gray.500" mb={1}>
            {t('config.se.matchFormat')}
          </Text>
          <LegacySelect
            value={config.matchFormat}
            onChange={(e) =>
              update({
                matchFormat: e.target.value as MatchFormatValue,
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
          baseFormat={config.matchFormat}
          value={config.roundFormats ?? {}}
          onChange={(roundFormats: RoundFormats) => update({ roundFormats })}
        />

        {/* True double elimination (grand final reset) */}
        <Flex align="center" justify="space-between" mb={2} mt={2}>
          <Box pr={3}>
            <Text fontSize="sm" fontWeight="medium">
              {t('config.de.isTrueDoubleElimination')}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {t('config.de.isTrueDoubleEliminationDesc')}
            </Text>
          </Box>
          <VSwitch
            checked={config.isTrueDoubleElimination}
            onCheckedChange={(details: { checked: boolean }) =>
              update({ isTrueDoubleElimination: details.checked })
            }
          />
        </Flex>
      </Box>

      {/* Right: Bracket preview placeholder */}
      <Box w={{ base: 'full', lg: '45%' }} flexShrink={0}>
        <Box
          bg="gray.50"
          borderRadius="xl"
          p={6}
          minH="200px"
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
  );
}
