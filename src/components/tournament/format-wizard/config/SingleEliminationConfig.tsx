'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import { LegacySelect } from '@/components/ui/VSelect';
import { useTranslations } from 'next-intl';
import { useFormatWizard } from '../FormatWizardContext';
import {
  SingleEliminationConfig as SEConfigType,
  MatchFormatValue,
  RoundFormats,
} from '../types';
import PerRoundFormatConfig from '../components/PerRoundFormatConfig';

export default function SingleEliminationConfig() {
  const t = useTranslations('pages.tournaments.detail.formatWizard');
  const { state, updateConfig } = useFormatWizard();
  const config = state.config as SEConfigType;
  if (!config) return null;

  const update = (partial: Partial<SEConfigType>) => {
    updateConfig({ ...config, ...partial });
  };

  return (
    <Flex direction={{ base: 'column', lg: 'row' }} gap={6} h="full">
      <Box flex={1} overflowY="auto" pr={{ lg: 4 }}>
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
          includeThirdPlace={config.thirdPlaceMatch}
        />

        {/* Third place match */}
        <Box mb={5}>
          <Text fontSize="xs" color="gray.500" mb={1}>
            {t('config.se.thirdPlaceMatch')}
          </Text>
          <LegacySelect
            value={config.thirdPlaceMatch ? 'yes' : 'no'}
            onChange={(e) =>
              update({ thirdPlaceMatch: e.target.value === 'yes' })
            }
          >
            <option value="yes">{t('config.se.yes')}</option>
            <option value="no">{t('config.se.no')}</option>
          </LegacySelect>
        </Box>
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
