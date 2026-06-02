'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import { LegacySelect } from '@/components/ui/VSelect';
import { useTranslations } from 'next-intl';
import { KnockoutRound, MatchFormatValue, RoundFormats } from '../types';

interface PerRoundFormatConfigProps {
  /** Base/default format shown as the "use default" hint. */
  baseFormat: MatchFormatValue;
  value: RoundFormats;
  onChange: (next: RoundFormats) => void;
  /** Whether to include the 3rd-place match row. */
  includeThirdPlace?: boolean;
}

const ROUNDS: { key: KnockoutRound; labelKey: string }[] = [
  { key: 'F', labelKey: 'rounds.final' },
  { key: 'SF', labelKey: 'rounds.semifinal' },
  { key: 'QF', labelKey: 'rounds.quarterfinal' },
  { key: 'R16', labelKey: 'rounds.roundOf16' },
];

const FORMAT_OPTIONS: MatchFormatValue[] = [
  'BEST_OF_1',
  'BEST_OF_3',
  'BEST_OF_5',
];

export default function PerRoundFormatConfig({
  baseFormat,
  value,
  onChange,
  includeThirdPlace = false,
}: PerRoundFormatConfigProps) {
  const t = useTranslations('pages.tournaments.detail.formatWizard');

  const formatLabel = (format: MatchFormatValue): string =>
    format === 'BEST_OF_1'
      ? t('config.se.bestOf1')
      : format === 'BEST_OF_3'
        ? t('config.se.bestOf3')
        : t('config.se.bestOf5');

  const handleChange = (round: KnockoutRound, raw: string) => {
    const next: RoundFormats = { ...value };
    if (!raw) {
      delete next[round];
    } else {
      next[round] = raw as MatchFormatValue;
    }
    onChange(next);
  };

  const rows = includeThirdPlace
    ? [
        ...ROUNDS,
        { key: '3RD' as KnockoutRound, labelKey: 'rounds.thirdPlace' },
      ]
    : ROUNDS;

  return (
    <Box
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="lg"
      p={4}
      mb={5}
    >
      <Text fontSize="sm" fontWeight="semibold" mb={1}>
        {t('config.se.perRoundTitle')}
      </Text>
      <Text fontSize="xs" color="gray.500" mb={3}>
        {t('config.se.perRoundHint', { format: formatLabel(baseFormat) })}
      </Text>
      <Flex direction="column" gap={2.5}>
        {rows.map(({ key, labelKey }) => (
          <Flex key={key} align="center" justify="space-between" gap={3}>
            <Text fontSize="sm" color="gray.700" flexShrink={0}>
              {t(labelKey)}
            </Text>
            <Box maxW="180px" w="full">
              <LegacySelect
                size="sm"
                value={value[key] ?? ''}
                onChange={(e) => handleChange(key, e.target.value)}
              >
                <option value="">{t('config.se.useDefault')}</option>
                {FORMAT_OPTIONS.map((format) => (
                  <option key={format} value={format}>
                    {formatLabel(format)}
                  </option>
                ))}
              </LegacySelect>
            </Box>
          </Flex>
        ))}
      </Flex>
    </Box>
  );
}
