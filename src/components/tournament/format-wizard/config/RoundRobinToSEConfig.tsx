'use client';

import { useState } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { LegacySelect } from '@/components/ui/VSelect';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useFormatWizard } from '../FormatWizardContext';
import {
  RoundRobinToSEConfig as RRToSEConfigType,
  RoundRobinConfig as RRConfigType,
} from '../types';
import DraggableList from '../components/DraggableList';
import PreviewTable from '../components/PreviewTable';

export default function RoundRobinToSEConfig() {
  const t = useTranslations('pages.tournaments.detail.formatWizard');
  const { state, updateConfig } = useFormatWizard();
  const config = state.config as RRToSEConfigType;
  const rr = config?.roundRobin;

  const [showAdvanced, setShowAdvanced] = useState(false);
  if (!config || !rr) return null;

  const updateRR = (partial: Partial<RRConfigType>) => {
    updateConfig({
      ...config,
      roundRobin: { ...rr, ...partial },
    });
  };

  return (
    <Flex direction={{ base: 'column', lg: 'row' }} gap={6} h="full">
      <Box flex={1} overflowY="auto" pr={{ lg: 4 }}>
        {/* --- Group Stage Section --- */}
        <Text fontWeight="bold" fontSize="lg" mb={3}>
          {t('config.rrse.groupStage')}
        </Text>

        {/* Points earning */}
        <Box mb={5}>
          <Text fontSize="xs" color="gray.500" mb={1}>
            {t('config.rr.pointsEarningLabel')}
          </Text>
          <LegacySelect
            value={rr.pointsEarning}
            onChange={(e) =>
              updateRR({
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

        {/* Match win / tie */}
        <Flex gap={4} mb={5}>
          <Box flex={1}>
            <Text fontSize="xs" color="gray.500" mb={1}>
              {t('config.rr.matchWin')}
            </Text>
            <LegacySelect
              value={rr.winPoints}
              onChange={(e) => updateRR({ winPoints: Number(e.target.value) })}
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
              value={rr.tiePoints}
              onChange={(e) => updateRR({ tiePoints: Number(e.target.value) })}
            >
              {[0, 1, 2, 3].map((n) => (
                <option key={n} value={n}>
                  {t('config.rr.nPoints', { n })}
                </option>
              ))}
            </LegacySelect>
          </Box>
        </Flex>

        {/* Advanced */}
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
                value={rr.lossPoints}
                onChange={(e) =>
                  updateRR({ lossPoints: Number(e.target.value) })
                }
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
                value={rr.forfeitWinPoints}
                onChange={(e) =>
                  updateRR({ forfeitWinPoints: Number(e.target.value) })
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
            items={rr.tiebreakers.map((tb) => ({
              id: tb.id,
              label: t(`config.rr.tiebreakerItems.${tb.label}`),
              description: t(`config.rr.tiebreakerItems.${tb.description}`),
            }))}
            onReorder={(newItems) => {
              const reordered = newItems.map(
                (item) => rr.tiebreakers.find((tb) => tb.id === item.id)!
              );
              updateRR({ tiebreakers: reordered });
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

        {/* Standings */}
        <Box mb={5}>
          <Text fontWeight="bold" fontSize="md" mb={0.5}>
            {t('config.rr.standings')}
          </Text>
          <Text fontSize="sm" color="gray.500" mb={3}>
            {t('config.rr.standingsDesc')}
          </Text>
          <DraggableList
            items={rr.standingsColumns.map((col) => ({
              id: col.id,
              label: t(`config.rr.standingsItems.${col.label}`),
            }))}
            onReorder={(newItems) => {
              const reordered = newItems.map(
                (item) => rr.standingsColumns.find((col) => col.id === item.id)!
              );
              updateRR({ standingsColumns: reordered });
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

      {/* Right: Preview */}
      <Box w={{ base: 'full', lg: '45%' }} flexShrink={0}>
        <PreviewTable columns={rr.standingsColumns} />
      </Box>
    </Flex>
  );
}
