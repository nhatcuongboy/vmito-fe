'use client';

import { useState } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { LegacySelect } from '@/components/ui/VSelect';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { RoundRobinConfig } from '../types';
import DraggableList from './DraggableList';
import SelectTiebreakersModal from './SelectTiebreakersModal';
import SelectStatisticsModal from './SelectStatisticsModal';
import SelectColumnsModal from './SelectColumnsModal';

const POINTS_RANGE = Array.from({ length: 21 }, (_, i) => i);

interface RoundRobinConfigFormProps {
  config: RoundRobinConfig;
  update: (partial: Partial<RoundRobinConfig>) => void;
}

export default function RoundRobinConfigForm({
  config,
  update,
}: RoundRobinConfigFormProps) {
  const t = useTranslations('pages.tournaments.detail.formatWizard');

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isTiebreakersModalOpen, setIsTiebreakersModalOpen] = useState(false);
  const [isStatisticsModalOpen, setIsStatisticsModalOpen] = useState(false);
  const [isColumnsModalOpen, setIsColumnsModalOpen] = useState(false);

  return (
    <>
      {/* Points earning */}
      <Box mb={5}>
        <Text fontSize="xs" color="gray.500" mb={1}>
          {t('config.rr.pointsEarningLabel')}
        </Text>
        <LegacySelect
          value={config.pointsEarning}
          onChange={(e) =>
            update({
              pointsEarning: e.target.value as
                | 'match_results'
                | 'manual'
                | 'tiebreakers_only',
            })
          }
        >
          <option value="match_results">
            {t('config.rr.basedOnMatchResults')}
          </option>
          <option value="manual">{t('config.rr.manual')}</option>
          <option value="tiebreakers_only">
            {t('config.rr.tiebreakersOnly')}
          </option>
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
            {POINTS_RANGE.map((n) => (
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
            {POINTS_RANGE.map((n) => (
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
        <Flex direction="column" gap={4} mb={5}>
          {/* Row 1: Match loss + Cancelled match */}
          <Flex gap={4}>
            <Box flex={1}>
              <Text fontSize="xs" color="gray.500" mb={1}>
                {t('config.rr.matchLoss')}
              </Text>
              <LegacySelect
                value={config.lossPoints}
                onChange={(e) => update({ lossPoints: Number(e.target.value) })}
              >
                {POINTS_RANGE.map((n) => (
                  <option key={n} value={n}>
                    {t('config.rr.nPoints', { n })}
                  </option>
                ))}
              </LegacySelect>
            </Box>
            <Box flex={1}>
              <Text fontSize="xs" color="gray.500" mb={1}>
                {t('config.rr.cancelledMatch')}
              </Text>
              <LegacySelect
                value={config.cancelledMatchPoints}
                onChange={(e) =>
                  update({ cancelledMatchPoints: Number(e.target.value) })
                }
              >
                {POINTS_RANGE.map((n) => (
                  <option key={n} value={n}>
                    {t('config.rr.nPoints', { n })}
                  </option>
                ))}
              </LegacySelect>
            </Box>
          </Flex>

          {/* Row 2: Game win + Game loss */}
          <Flex gap={4}>
            <Box flex={1}>
              <Text fontSize="xs" color="gray.500" mb={1}>
                {t('config.rr.gameWin')}
              </Text>
              <LegacySelect
                value={config.gameWinPoints}
                onChange={(e) =>
                  update({ gameWinPoints: Number(e.target.value) })
                }
              >
                {POINTS_RANGE.map((n) => (
                  <option key={n} value={n}>
                    {t('config.rr.nPoints', { n })}
                  </option>
                ))}
              </LegacySelect>
            </Box>
            <Box flex={1}>
              <Text fontSize="xs" color="gray.500" mb={1}>
                {t('config.rr.gameLoss')}
              </Text>
              <LegacySelect
                value={config.gameLossPoints}
                onChange={(e) =>
                  update({ gameLossPoints: Number(e.target.value) })
                }
              >
                {POINTS_RANGE.map((n) => (
                  <option key={n} value={n}>
                    {t('config.rr.nPoints', { n })}
                  </option>
                ))}
              </LegacySelect>
            </Box>
          </Flex>

          {/* Row 3: Forfeit win + Forfeit loss */}
          <Flex gap={4}>
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
                {POINTS_RANGE.map((n) => (
                  <option key={n} value={n}>
                    {t('config.rr.nPoints', { n })}
                  </option>
                ))}
              </LegacySelect>
            </Box>
            <Box flex={1}>
              <Text fontSize="xs" color="gray.500" mb={1}>
                {t('config.rr.forfeitLoss')}
              </Text>
              <LegacySelect
                value={config.forfeitLossPoints}
                onChange={(e) =>
                  update({ forfeitLossPoints: Number(e.target.value) })
                }
              >
                {POINTS_RANGE.map((n) => (
                  <option key={n} value={n}>
                    {t('config.rr.nPoints', { n })}
                  </option>
                ))}
              </LegacySelect>
            </Box>
          </Flex>
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
          onClick={() => setIsTiebreakersModalOpen(true)}
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
          onClick={() => setIsStatisticsModalOpen(true)}
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
          onClick={() => setIsColumnsModalOpen(true)}
        >
          {t('config.rr.selectColumns')}
        </Button>
      </Box>

      {/* Modals */}
      <SelectTiebreakersModal
        isOpen={isTiebreakersModalOpen}
        onClose={() => setIsTiebreakersModalOpen(false)}
        selectedOverall={config.tiebreakers}
        selectedHeadToHead={config.headToHeadTiebreakers ?? []}
        onConfirm={(overall, headToHead) =>
          update({ tiebreakers: overall, headToHeadTiebreakers: headToHead })
        }
      />
      <SelectStatisticsModal
        isOpen={isStatisticsModalOpen}
        onClose={() => setIsStatisticsModalOpen(false)}
        selectedStatistics={config.statistics}
        onConfirm={(statistics) => update({ statistics })}
      />
      <SelectColumnsModal
        isOpen={isColumnsModalOpen}
        onClose={() => setIsColumnsModalOpen(false)}
        selectedColumns={config.standingsColumns}
        onConfirm={(standingsColumns) => update({ standingsColumns })}
      />
    </>
  );
}
