'use client';

import { useState } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { LegacySelect } from '@/components/ui/VSelect';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useFormatWizard } from '../FormatWizardContext';
import { RoundRobinConfig as RoundRobinConfigType } from '../types';
import DraggableList from '../components/DraggableList';
import PreviewTable from '../components/PreviewTable';

export default function RoundRobinConfig() {
  const t = useTranslations('pages.tournaments.detail.formatWizard');
  const { state, updateConfig } = useFormatWizard();
  const config = state.config as RoundRobinConfigType;

  const [showAdvanced, setShowAdvanced] = useState(false);
  if (!config) return null;

  const update = (partial: Partial<RoundRobinConfigType>) => {
    updateConfig({ ...config, ...partial });
  };

  return (
    <Flex direction={{ base: 'column', lg: 'row' }} gap={6} h="full">
      {/* Left: Configuration form */}
      <Box flex={1} overflowY="auto" pr={{ lg: 4 }}>
        {/* Points earning */}
        <Box mb={5}>
          <Text fontSize="xs" color="gray.500" mb={1}>
            {t('config.rr.pointsEarningLabel')}
          </Text>
          <LegacySelect
            value={config.pointsEarning}
            onChange={(e) =>
              update({
                pointsEarning: e.target.value as 'match_results' | 'manual',
              })
            }
          >
            <option value="match_results">
              {t('config.rr.basedOnMatchResults')}
            </option>
            <option value="manual">{t('config.rr.manual')}</option>
          </LegacySelect>
        </Box>

        {/* Match win / Match tie */}
        <Flex gap={4} mb={5}>
          <Box flex={1}>
            <Text fontSize="xs" color="gray.500" mb={1}>
              {t('config.rr.matchWin')}
            </Text>
            <LegacySelect
              value={config.winPoints}
              onChange={(e) => update({ winPoints: Number(e.target.value) })}
            >
              {[0, 1, 2, 3].map((n) => (
                <option key={n} value={n}>
                  {t('config.rr.nPoints', { n })}
                </option>
              ))}
            </LegacySelect>
          </Box>
          <Box flex={1}>
            <Text fontSize="xs" color="gray.500" mb={1}>
              {t('config.rr.matchTie')}
            </Text>
            <LegacySelect
              value={config.tiePoints}
              onChange={(e) => update({ tiePoints: Number(e.target.value) })}
            >
              {[0, 1, 2, 3].map((n) => (
                <option key={n} value={n}>
                  {t('config.rr.nPoints', { n })}
                </option>
              ))}
            </LegacySelect>
          </Box>
        </Flex>

        {/* Advanced section */}
        <Flex
          align="center"
          justify="space-between"
          cursor="pointer"
          onClick={() => setShowAdvanced(!showAdvanced)}
          py={2}
          mb={showAdvanced ? 3 : 5}
        >
          <Text fontSize="sm" color="gray.600">
            {t('config.rr.advanced')}
          </Text>
          {showAdvanced ? (
            <ChevronUp size={16} color="gray" />
          ) : (
            <ChevronDown size={16} color="gray" />
          )}
        </Flex>

        {showAdvanced && (
          <Flex gap={4} mb={5}>
            <Box flex={1}>
              <Text fontSize="xs" color="gray.500" mb={1}>
                {t('config.rr.matchLoss')}
              </Text>
              <LegacySelect
                value={config.lossPoints}
                onChange={(e) => update({ lossPoints: Number(e.target.value) })}
              >
                {[0, 1, 2, 3].map((n) => (
                  <option key={n} value={n}>
                    {t('config.rr.nPoints', { n })}
                  </option>
                ))}
              </LegacySelect>
            </Box>
            <Box flex={1}>
              <Text fontSize="xs" color="gray.500" mb={1}>
                {t('config.rr.forfeitWin')}
              </Text>
              <LegacySelect
                value={config.forfeitWinPoints}
                onChange={(e) =>
                  update({ forfeitWinPoints: Number(e.target.value) })
                }
              >
                {[0, 1, 2, 3].map((n) => (
                  <option key={n} value={n}>
                    {t('config.rr.nPoints', { n })}
                  </option>
                ))}
              </LegacySelect>
            </Box>
          </Flex>
        )}

        {/* Tiebreakers */}
        <Box mb={5}>
          <Text fontWeight="bold" fontSize="md" mb={0.5}>
            {t('config.rr.tiebreakers')}
          </Text>
          <Text fontSize="sm" color="gray.500" mb={3}>
            {t('config.rr.tiebreakersDesc')}
          </Text>
          <DraggableList
            items={config.tiebreakers.map((tb) => ({
              id: tb.id,
              label: t(`config.rr.tiebreakerItems.${tb.label}`),
              description: t(`config.rr.tiebreakerItems.${tb.description}`),
            }))}
            onReorder={(newItems) => {
              const reordered = newItems.map(
                (item) => config.tiebreakers.find((tb) => tb.id === item.id)!
              );
              update({ tiebreakers: reordered });
            }}
          />
          <Button
            variant="outline"
            colorPalette="gray"
            size="sm"
            w="full"
            mt={3}
          >
            {t('config.rr.selectTiebreakers')}
          </Button>
        </Box>

        {/* Team statistics */}
        <Box mb={5}>
          <Text fontWeight="bold" fontSize="md" mb={0.5}>
            {t('config.rr.teamStatistics')}
          </Text>
          <Text fontSize="sm" color="gray.500" mb={3}>
            {t('config.rr.teamStatisticsDesc')}
          </Text>
          {config.statistics.map((stat) => (
            <Flex
              key={stat.id}
              align="center"
              gap={3}
              py={2}
              borderBottomWidth="1px"
              borderColor="gray.100"
            >
              <Flex
                w="28px"
                h="28px"
                bg="gray.100"
                borderRadius="md"
                align="center"
                justify="center"
              >
                <Text fontSize="xs" fontWeight="bold" color="gray.600">
                  {stat.abbreviation}
                </Text>
              </Flex>
              <Text fontSize="sm" fontWeight="semibold" flex={1}>
                {t(`config.rr.statisticItems.${stat.label}`)}
              </Text>
              {stat.required && (
                <Text fontSize="xs" color="gray.400">
                  {t('config.rr.required')}
                </Text>
              )}
            </Flex>
          ))}
          <Button
            variant="outline"
            colorPalette="gray"
            size="sm"
            w="full"
            mt={3}
          >
            {t('config.rr.selectStatistics')}
          </Button>
        </Box>

        {/* Standings */}
        <Box mb={5}>
          <Text fontWeight="bold" fontSize="md" mb={0.5}>
            {t('config.rr.standings')}
          </Text>
          <Text fontSize="sm" color="gray.500" mb={3}>
            {t('config.rr.standingsDesc')}
          </Text>
          <DraggableList
            items={config.standingsColumns.map((col) => ({
              id: col.id,
              label: t(`config.rr.standingsItems.${col.label}`),
            }))}
            onReorder={(newItems) => {
              const reordered = newItems.map(
                (item) =>
                  config.standingsColumns.find((col) => col.id === item.id)!
              );
              update({ standingsColumns: reordered });
            }}
          />
          <Button
            variant="outline"
            colorPalette="gray"
            size="sm"
            w="full"
            mt={3}
          >
            {t('config.rr.selectColumns')}
          </Button>
        </Box>
      </Box>

      {/* Right: Preview table */}
      <Box w={{ base: 'full', lg: '45%' }} flexShrink={0} pt={{ lg: 0 }}>
        <PreviewTable columns={config.standingsColumns} />
      </Box>
    </Flex>
  );
}
