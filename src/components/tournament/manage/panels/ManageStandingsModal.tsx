'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Box, Flex, Heading, Text, Grid } from '@chakra-ui/react';
import { Button, VStack } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  SortableContext as _SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

// Workaround: @dnd-kit types are not yet compatible with React 19
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SortableContext = _SortableContext as any;
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { VModal } from '@/components/ui/VModal';
import { VSelect } from '@/components/ui/VSelect';
import { Category } from '@/lib/api/types';
import {
  type TiebreakerItem,
  type StatisticItem,
  type StandingsColumn,
  type RoundRobinConfig,
} from '@/components/tournament/format-wizard/types';
import {
  DEFAULT_RR_CONFIG,
  AVAILABLE_TIEBREAKERS,
  AVAILABLE_STATISTICS,
  AVAILABLE_STANDINGS_COLUMNS,
} from '@/components/tournament/format-wizard/constants';

// ─── Helper: extract RR config from category ────────────────────
function getRRConfig(category: Category | null): RoundRobinConfig {
  if (!category) return { ...DEFAULT_RR_CONFIG };
  const fc = category.formatConfig as Record<string, unknown> | null;
  if (!fc) return { ...DEFAULT_RR_CONFIG };
  // For ROUND_ROBIN_TO_SE the RR config is nested
  const rr = (fc.roundRobin as Record<string, unknown>) ?? fc;
  return {
    pointsEarning:
      (rr.pointsEarning as RoundRobinConfig['pointsEarning']) ??
      DEFAULT_RR_CONFIG.pointsEarning,
    winPoints: (rr.winPoints as number) ?? DEFAULT_RR_CONFIG.winPoints,
    tiePoints: (rr.tiePoints as number) ?? DEFAULT_RR_CONFIG.tiePoints,
    lossPoints: (rr.lossPoints as number) ?? DEFAULT_RR_CONFIG.lossPoints,
    cancelledMatchPoints:
      (rr.cancelledMatchPoints as number) ??
      DEFAULT_RR_CONFIG.cancelledMatchPoints,
    gameWinPoints:
      (rr.gameWinPoints as number) ?? DEFAULT_RR_CONFIG.gameWinPoints,
    gameLossPoints:
      (rr.gameLossPoints as number) ?? DEFAULT_RR_CONFIG.gameLossPoints,
    forfeitWinPoints:
      (rr.forfeitWinPoints as number) ?? DEFAULT_RR_CONFIG.forfeitWinPoints,
    forfeitLossPoints:
      (rr.forfeitLossPoints as number) ?? DEFAULT_RR_CONFIG.forfeitLossPoints,
    tiebreakers: (rr.tiebreakers as TiebreakerItem[]) ?? [
      ...DEFAULT_RR_CONFIG.tiebreakers,
    ],
    headToHeadTiebreakers: (rr.headToHeadTiebreakers as TiebreakerItem[]) ?? [],
    statistics: (rr.statistics as StatisticItem[]) ?? [
      ...DEFAULT_RR_CONFIG.statistics,
    ],
    standingsColumns: (rr.standingsColumns as StandingsColumn[]) ?? [
      ...DEFAULT_RR_CONFIG.standingsColumns,
    ],
  };
}

// ─── Sortable Item ──────────────────────────────────────────────
function SortableItem({
  id,
  rank,
  label,
  description,
}: {
  id: string;
  rank: number;
  label: string;
  description?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Flex ref={setNodeRef} style={style} align="center" gap={3} py={2} px={1}>
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
          {rank}
        </Text>
      </Flex>
      <Box flex={1}>
        <Text fontSize="sm" fontWeight="medium">
          {label}
        </Text>
        {description && (
          <Text fontSize="xs" color="gray.500">
            {description}
          </Text>
        )}
      </Box>
      <Box
        {...attributes}
        {...listeners}
        cursor="grab"
        color="gray.400"
        _hover={{ color: 'gray.600' }}
        p={1}
      >
        <GripVertical size={16} />
      </Box>
    </Flex>
  );
}

// ─── Selection Popover (inline toggle list) ─────────────────────
function SelectionSection<T extends { id: string; label: string }>({
  available,
  selected,
  onToggle,
  renderLabel,
  buttonText,
}: {
  available: T[];
  selected: T[];
  onToggle: (item: T) => void;
  renderLabel: (item: T) => string;
  buttonText: string;
}) {
  const [showSelection, setShowSelection] = useState(false);

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        w="full"
        onClick={() => setShowSelection(!showSelection)}
      >
        {buttonText}
      </Button>
      {showSelection && (
        <VStack gap={1} align="stretch" mt={2}>
          {available.map((item) => {
            const isSelected = selected.some((s) => s.id === item.id);
            const isRequired = 'required' in item && (item as any).required;
            return (
              <Flex
                key={item.id}
                align="center"
                gap={2}
                py={1}
                px={2}
                borderRadius="md"
                bg={isSelected ? 'blue.50' : 'transparent'}
                cursor={isRequired ? 'not-allowed' : 'pointer'}
                opacity={isRequired ? 0.6 : 1}
                onClick={() => !isRequired && onToggle(item)}
                _hover={!isRequired ? { bg: 'gray.50' } : undefined}
              >
                <Box
                  w="16px"
                  h="16px"
                  borderRadius="sm"
                  borderWidth="2px"
                  borderColor={isSelected ? 'blue.500' : 'gray.300'}
                  bg={isSelected ? 'blue.500' : 'transparent'}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  {isSelected && (
                    <Text fontSize="2xs" color="white" fontWeight="bold">
                      ✓
                    </Text>
                  )}
                </Box>
                <Text fontSize="sm">{renderLabel(item)}</Text>
              </Flex>
            );
          })}
        </VStack>
      )}
    </>
  );
}

// ─── Preview Table ──────────────────────────────────────────────
function StandingsPreviewTable({ columns }: { columns: StandingsColumn[] }) {
  const allCols = [
    { abbreviation: 'PTS', label: 'Points' },
    ...columns.map((c) => ({ abbreviation: c.abbreviation, label: c.label })),
  ];

  return (
    <Box
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="lg"
      overflow="hidden"
      bg="gray.50"
    >
      {/* Header */}
      <Flex
        bg="white"
        borderBottomWidth="1px"
        borderColor="gray.200"
        py={2}
        px={3}
      >
        <Box flex={1}>
          <Text fontSize="xs" fontWeight="bold" color="gray.500">
            Team
          </Text>
        </Box>
        {allCols.map((col, i) => (
          <Box key={i} w="40px" textAlign="center">
            <Text
              fontSize="xs"
              fontWeight="bold"
              color={i === 0 ? 'blue.600' : 'gray.500'}
            >
              {col.abbreviation}
            </Text>
          </Box>
        ))}
      </Flex>
      {/* Skeleton rows */}
      {[0, 1, 2, 3].map((row) => (
        <Flex
          key={row}
          py={2}
          px={3}
          borderBottomWidth={row < 3 ? '1px' : '0'}
          borderColor="gray.100"
          bg="white"
        >
          <Box flex={1} pr={2}>
            <Box
              h="10px"
              bg="gray.200"
              borderRadius="full"
              w={`${60 + row * 8}%`}
            />
          </Box>
          {allCols.map((_, i) => (
            <Box key={i} w="40px" display="flex" justifyContent="center">
              <Box h="10px" w="16px" bg="gray.200" borderRadius="full" />
            </Box>
          ))}
        </Flex>
      ))}
    </Box>
  );
}

// ─── Point Value Select ─────────────────────────────────────────
function PointSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <Box>
      <Text fontSize="xs" color="gray.500" mb={1}>
        {label}
      </Text>
      <VSelect
        size="sm"
        value={String(value)}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {[0, 1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={String(n)}>
            {n} {n === 1 ? 'point' : 'points'}
          </option>
        ))}
      </VSelect>
    </Box>
  );
}

// ─── Main Modal ─────────────────────────────────────────────────
interface ManageStandingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  onSave: (config: RoundRobinConfig) => Promise<void>;
}

export default function ManageStandingsModal({
  isOpen,
  onClose,
  category,
  onSave,
}: ManageStandingsModalProps) {
  const t = useTranslations('pages.tournaments.detail.manage.panels.standings');
  const tConfig = useTranslations(
    'pages.tournaments.detail.formatWizard.config.rr'
  );

  // Initialize state from category config
  const initialConfig = useMemo(() => getRRConfig(category), [category]);

  const [pointsEarning, setPointsEarning] = useState(
    initialConfig.pointsEarning
  );
  const [winPoints, setWinPoints] = useState(initialConfig.winPoints);
  const [tiePoints, setTiePoints] = useState(initialConfig.tiePoints);
  const [lossPoints, setLossPoints] = useState(initialConfig.lossPoints);
  const [cancelledMatchPoints, setCancelledMatchPoints] = useState(
    initialConfig.cancelledMatchPoints
  );
  const [gameWinPoints, setGameWinPoints] = useState(
    initialConfig.gameWinPoints
  );
  const [gameLossPoints, setGameLossPoints] = useState(
    initialConfig.gameLossPoints
  );
  const [forfeitWinPoints, setForfeitWinPoints] = useState(
    initialConfig.forfeitWinPoints
  );
  const [forfeitLossPoints, setForfeitLossPoints] = useState(
    initialConfig.forfeitLossPoints
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tiebreakers, setTiebreakers] = useState<TiebreakerItem[]>(
    initialConfig.tiebreakers
  );
  const [statistics, setStatistics] = useState<StatisticItem[]>(
    initialConfig.statistics
  );
  const [standingsColumns, setStandingsColumns] = useState<StandingsColumn[]>(
    initialConfig.standingsColumns
  );
  const [isSaving, setIsSaving] = useState(false);

  // Reset state when category changes
  React.useEffect(() => {
    const cfg = getRRConfig(category);
    setPointsEarning(cfg.pointsEarning);
    setWinPoints(cfg.winPoints);
    setTiePoints(cfg.tiePoints);
    setLossPoints(cfg.lossPoints);
    setCancelledMatchPoints(cfg.cancelledMatchPoints);
    setGameWinPoints(cfg.gameWinPoints);
    setGameLossPoints(cfg.gameLossPoints);
    setForfeitWinPoints(cfg.forfeitWinPoints);
    setForfeitLossPoints(cfg.forfeitLossPoints);
    setTiebreakers(cfg.tiebreakers);
    setStatistics(cfg.statistics);
    setStandingsColumns(cfg.standingsColumns);
  }, [category]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Drag handlers
  const handleTiebreakerDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setTiebreakers((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, []);

  const handleColumnsDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setStandingsColumns((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, []);

  // Toggle selection handlers
  const toggleTiebreaker = useCallback((item: TiebreakerItem) => {
    setTiebreakers((prev) => {
      const exists = prev.find((t) => t.id === item.id);
      if (exists) return prev.filter((t) => t.id !== item.id);
      return [...prev, item];
    });
  }, []);

  const toggleStatistic = useCallback((item: StatisticItem) => {
    if (item.required) return;
    setStatistics((prev) => {
      const exists = prev.find((s) => s.id === item.id);
      if (exists) return prev.filter((s) => s.id !== item.id);
      return [...prev, item];
    });
  }, []);

  const toggleColumn = useCallback((item: StandingsColumn) => {
    setStandingsColumns((prev) => {
      const exists = prev.find((c) => c.id === item.id);
      if (exists) return prev.filter((c) => c.id !== item.id);
      return [...prev, item];
    });
  }, []);

  // Save
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        pointsEarning,
        winPoints,
        tiePoints,
        lossPoints,
        cancelledMatchPoints,
        gameWinPoints,
        gameLossPoints,
        forfeitWinPoints,
        forfeitLossPoints,
        tiebreakers,
        statistics,
        standingsColumns,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const showPointValues = pointsEarning !== 'tiebreakers_only';

  return (
    <VModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('title')}
      description={tConfig('standingsDesc')}
      size="full"
      primaryActionText={t('save') || 'Save'}
      onPrimaryAction={handleSave}
      isPrimaryLoading={isSaving}
      secondaryActionText={t('cancel') || 'Cancel'}
      maxBodyHeight="75vh"
    >
      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={8}>
        {/* Left Column - Configuration */}
        <VStack gap={6} align="stretch">
          {/* Points Earning Method */}
          <Box>
            <Text fontSize="xs" color="gray.500" mb={1}>
              {tConfig('pointsEarning') || 'How will teams earn points?'}
            </Text>
            <VSelect
              value={pointsEarning}
              onChange={(e) =>
                setPointsEarning(
                  e.target.value as RoundRobinConfig['pointsEarning']
                )
              }
            >
              <option value="match_results">
                {tConfig('matchResults') || 'Based on match results'}
              </option>
              <option value="manual">
                {tConfig('manual') || 'Manually awarded points'}
              </option>
              <option value="tiebreakers_only">
                {tConfig('tiebreakersOnly') || 'Use tiebreakers only'}
              </option>
            </VSelect>
          </Box>

          {/* Point Values */}
          {showPointValues && (
            <Box>
              <Grid templateColumns="1fr 1fr" gap={3}>
                <PointSelect
                  label={tConfig('matchWin')}
                  value={winPoints}
                  onChange={setWinPoints}
                />
                <PointSelect
                  label={tConfig('matchTie')}
                  value={tiePoints}
                  onChange={setTiePoints}
                />
              </Grid>

              {/* Advanced */}
              <Box
                mt={3}
                cursor="pointer"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <Flex align="center" gap={2}>
                  <Text fontSize="sm" color="gray.500">
                    {tConfig('advanced')}
                  </Text>
                  <Text fontSize="xs" color="gray.400">
                    {showAdvanced ? '▲' : '▼'}
                  </Text>
                </Flex>
              </Box>

              {showAdvanced && (
                <Grid templateColumns="1fr 1fr" gap={3} mt={3}>
                  <PointSelect
                    label={tConfig('matchLoss')}
                    value={lossPoints}
                    onChange={setLossPoints}
                  />
                  <PointSelect
                    label={tConfig('cancelledMatch') || 'Cancelled match'}
                    value={cancelledMatchPoints}
                    onChange={setCancelledMatchPoints}
                  />
                  <PointSelect
                    label={tConfig('gameWin') || 'Game win'}
                    value={gameWinPoints}
                    onChange={setGameWinPoints}
                  />
                  <PointSelect
                    label={tConfig('gameLoss') || 'Game loss'}
                    value={gameLossPoints}
                    onChange={setGameLossPoints}
                  />
                  <PointSelect
                    label={tConfig('forfeitWin')}
                    value={forfeitWinPoints}
                    onChange={setForfeitWinPoints}
                  />
                  <PointSelect
                    label={tConfig('forfeitLoss') || 'Forfeit loss'}
                    value={forfeitLossPoints}
                    onChange={setForfeitLossPoints}
                  />
                </Grid>
              )}
            </Box>
          )}

          {/* Tiebreakers */}
          <Box>
            <Heading size="sm" mb={1}>
              {tConfig('tiebreakers')}
            </Heading>
            <Text fontSize="xs" color="gray.500" mb={2}>
              {tConfig('tiebreakersDesc')}
            </Text>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleTiebreakerDragEnd}
            >
              <SortableContext
                items={tiebreakers.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                {tiebreakers.map((tb, idx) => (
                  <SortableItem
                    key={tb.id}
                    id={tb.id}
                    rank={idx + 1}
                    label={tConfig(`tiebreakerItems.${tb.label}`)}
                    description={tConfig(`tiebreakerItems.${tb.description}`)}
                  />
                ))}
              </SortableContext>
            </DndContext>
            <SelectionSection
              available={AVAILABLE_TIEBREAKERS}
              selected={tiebreakers}
              onToggle={toggleTiebreaker}
              renderLabel={(item) => tConfig(`tiebreakerItems.${item.label}`)}
              buttonText={tConfig('selectTiebreakers')}
            />
          </Box>

          {/* Team Statistics */}
          <Box>
            <Heading size="sm" mb={1}>
              {tConfig('teamStatistics')}
            </Heading>
            <Text fontSize="xs" color="gray.500" mb={2}>
              {tConfig('teamStatisticsDesc')}
            </Text>
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
                      {tConfig('required')}
                    </Box>
                  )}
                </Flex>
              ))}
            </VStack>
            <Box mt={2}>
              <SelectionSection
                available={AVAILABLE_STATISTICS}
                selected={statistics}
                onToggle={toggleStatistic}
                renderLabel={(item) => tConfig(`statisticItems.${item.label}`)}
                buttonText={tConfig('selectStatistics')}
              />
            </Box>
          </Box>

          {/* Standings Columns */}
          <Box>
            <Heading size="sm" mb={1}>
              {tConfig('standings')}
            </Heading>
            <Text fontSize="xs" color="gray.500" mb={2}>
              {tConfig('standingsDesc')}
            </Text>

            {/* Points is always first */}
            <Flex align="center" gap={3} py={2} px={1}>
              <Flex
                w="24px"
                h="24px"
                bg="blue.50"
                borderRadius="md"
                align="center"
                justify="center"
                flexShrink={0}
              >
                <Text fontSize="2xs" fontWeight="bold" color="blue.600">
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
                {tConfig('required')}
              </Box>
            </Flex>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleColumnsDragEnd}
            >
              <SortableContext
                items={standingsColumns.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {standingsColumns.map((col, idx) => (
                  <SortableItem
                    key={col.id}
                    id={col.id}
                    rank={idx + 1}
                    label={tConfig(`standingsItems.${col.label}`)}
                  />
                ))}
              </SortableContext>
            </DndContext>
            <SelectionSection
              available={AVAILABLE_STANDINGS_COLUMNS}
              selected={standingsColumns}
              onToggle={toggleColumn}
              renderLabel={(item) => tConfig(`standingsItems.${item.label}`)}
              buttonText={tConfig('selectColumns')}
            />
          </Box>
        </VStack>

        {/* Right Column - Preview */}
        <Box position="sticky" top={0} alignSelf="start">
          <StandingsPreviewTable columns={standingsColumns} />
        </Box>
      </Grid>
    </VModal>
  );
}
