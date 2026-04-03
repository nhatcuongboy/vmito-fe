'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { Bracket, Seed, SeedItem } from 'react-brackets';
import type { IRoundProps, ISeedProps, IRenderSeedProps } from 'react-brackets';

// Workaround for react-brackets type incompatibility with React 19
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BracketComponent = Bracket as React.ComponentType<any>;
import { GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext as SortableContextBase,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Workaround for @dnd-kit type incompatibility with React 19
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SortableContext = SortableContextBase as any;

// ─── Constants ───────────────────────────────────────────────────────────────

const POOL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const ORDINAL_LABELS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
const GROUP_MATCH_OFFSET = 12;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface IBracketVisualizationProps {
  teamCount: number;
  groupCount: number;
  winnersPerGroup: number;
  thirdPlaceMatch?: boolean;
  /** If true, renders a compact thumbnail version without DnD */
  compact?: boolean;
  /** Custom slot order persisted externally (restored from formatConfig) */
  customSlots?: string[];
  /** Fires when the user reorders first-round seeds via drag-and-drop */
  onSlotsChange?: (slots: string[]) => void;
  /** Consolation matches to display below the main bracket */
  consolationMatches?: IConsolationMatchDisplay[];
}

export interface IConsolationMatchDisplay {
  matchNumber: number;
  participant1Label: string;
  participant2Label: string;
}

interface IThirdPlaceMatch {
  matchNumber: number;
  participant1Label: string;
  participant2Label: string;
}

interface ISlotTeam {
  name: string;
  slotId: string;
}

interface IBracketSeed {
  id: number;
  matchNumber: number;
  teams: ISlotTeam[];
  [key: string]: unknown;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const nextPowerOf2 = (n: number): number => {
  let p = 1;
  while (p < n) p *= 2;
  return p;
};

const getRoundName = (
  roundIndex: number,
  totalRounds: number,
  t: ReturnType<typeof useTranslations>
): string => {
  const fromFinal = totalRounds - 1 - roundIndex;
  if (fromFinal === 0) return t('panels.rounds.firstPlace');
  if (fromFinal === 1) return t('panels.rounds.semiFinals');
  if (fromFinal === 2) return t('panels.rounds.quarterFinals');
  return `Round ${roundIndex + 1}`;
};

const generateAdvancingSlots = (
  groupCount: number,
  winnersPerGroup: number
): string[] => {
  const slots: string[] = [];
  for (let rank = 0; rank < winnersPerGroup; rank++) {
    for (let g = 0; g < groupCount; g++) {
      slots.push(
        `${ORDINAL_LABELS[rank] ?? `${rank + 1}th`} Pool ${POOL_LABELS[g] ?? String(g + 1)}`
      );
    }
  }
  return slots;
};

const generateStandardSeeding = (bracketSize: number): number[] => {
  if (bracketSize === 1) return [1];
  const half = generateStandardSeeding(bracketSize / 2);
  const result: number[] = [];
  for (const seed of half) {
    result.push(seed);
    result.push(bracketSize + 1 - seed);
  }
  return result;
};

const computeDefaultSlots = (
  groupCount: number,
  winnersPerGroup: number
): string[] => {
  const advancingSlots = generateAdvancingSlots(groupCount, winnersPerGroup);
  const n = advancingSlots.length;
  if (n < 2) return [];
  const bracketSize = nextPowerOf2(n);
  const seedOrder = generateStandardSeeding(bracketSize);
  const result: string[] = new Array(bracketSize).fill('');
  for (let i = 0; i < n; i++) {
    result[seedOrder[i] - 1] = advancingSlots[i];
  }
  return result;
};

// ─── SortableTeamRow ─────────────────────────────────────────────────────────

function SortableTeamRow({
  slotId,
  name,
  compact,
  isLast,
}: {
  slotId: string;
  name: string;
  compact: boolean;
  isLast: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slotId });

  return (
    <Flex
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        position: 'relative',
        zIndex: isDragging ? 50 : undefined,
      }}
      align="center"
      justify="space-between"
      px={compact ? 1.5 : 2.5}
      py={compact ? 1 : 1.5}
      bg="white"
      borderBottomWidth={isLast ? '0' : '1px'}
      borderColor="gray.100"
    >
      <Text
        fontSize={compact ? '2xs' : 'xs'}
        flex={1}
        truncate
        lineHeight="1.3"
        color={name ? 'gray.800' : 'gray.400'}
      >
        {name || '—'}
      </Text>
      {!compact && (
        <Box
          color="gray.400"
          cursor="grab"
          _active={{ cursor: 'grabbing' }}
          ml={1.5}
          flexShrink={0}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={14} />
        </Box>
      )}
    </Flex>
  );
}

// ─── StaticTeamRow ────────────────────────────────────────────────────────────

function StaticTeamRow({
  name,
  compact,
  isLast,
}: {
  name: string;
  compact: boolean;
  isLast: boolean;
}) {
  return (
    <Flex
      align="center"
      justify="space-between"
      px={compact ? 1.5 : 2.5}
      py={compact ? 1 : 1.5}
      bg="white"
      borderBottomWidth={isLast ? '0' : '1px'}
      borderColor="gray.100"
    >
      <Text
        fontSize={compact ? '2xs' : 'xs'}
        flex={1}
        truncate
        lineHeight="1.3"
        color="gray.600"
      >
        {name || '—'}
      </Text>
      {!compact && (
        <Box color="gray.200" ml={1.5} flexShrink={0}>
          <GripVertical size={14} />
        </Box>
      )}
    </Flex>
  );
}

// ─── SeedCard ─────────────────────────────────────────────────────────────────

function SeedCard({
  seed,
  breakpoint,
  isSortable,
  compact,
}: {
  seed: IBracketSeed;
  breakpoint: number;
  isSortable: boolean;
  compact: boolean;
}) {
  const t1 = seed.teams[0];
  const t2 = seed.teams[1];
  const cardWidth = compact ? '130px' : '180px';

  return (
    <Seed
      mobileBreakpoint={breakpoint}
      style={{
        padding: compact ? '3px 1.5em' : '6px 1.5em',
        position: 'relative',
      }}
    >
      <SeedItem
        style={{
          padding: 0,
          background: 'white',
          color: '#1a202c',
          borderRadius: '8px',
          overflow: 'hidden',
          width: cardWidth,
          border: '1.5px solid #e2e8f0',
          boxShadow: '0 1px 2px 0 rgba(0,0,0,0.06)',
          position: 'relative',
        }}
      >
        {/* Match number — positioned in the left padding of Seed */}
        {!compact && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '-26px',
              transform: 'translateY(-50%)',
              fontSize: '11px',
              color: '#a0aec0',
              fontWeight: 500,
              minWidth: '20px',
              textAlign: 'right',
            }}
          >
            {seed.matchNumber}
          </div>
        )}
        {isSortable ? (
          <>
            <SortableTeamRow
              slotId={t1?.slotId ?? ''}
              name={t1?.name ?? ''}
              compact={compact}
              isLast={false}
            />
            <SortableTeamRow
              slotId={t2?.slotId ?? ''}
              name={t2?.name ?? ''}
              compact={compact}
              isLast={true}
            />
          </>
        ) : (
          <>
            <StaticTeamRow
              name={t1?.name ?? ''}
              compact={compact}
              isLast={false}
            />
            <StaticTeamRow
              name={t2?.name ?? ''}
              compact={compact}
              isLast={true}
            />
          </>
        )}
      </SeedItem>
    </Seed>
  );
}

// ─── ThirdPlaceCard ───────────────────────────────────────────────────────────

function ThirdPlaceCard({
  match,
  compact,
  title,
}: {
  match: IThirdPlaceMatch;
  compact: boolean;
  title: string;
}) {
  const cardWidth = compact ? '130px' : '180px';

  return (
    <Box mt={compact ? 4 : 6}>
      <Flex direction="column" align="flex-start" pl={compact ? 4 : 8}>
        {/* Title pill */}
        <Box
          display="inline-block"
          px={3}
          py={1}
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="full"
          bg="white"
          mb={compact ? 1.5 : 2}
        >
          <Text
            fontSize={compact ? '2xs' : 'xs'}
            fontWeight="semibold"
            color="gray.700"
          >
            {title}
          </Text>
        </Box>

        {/* Match card */}
        <Flex align="center" gap={compact ? 1 : 2}>
          {!compact && (
            <Text
              fontSize="xs"
              color="gray.400"
              fontWeight="medium"
              minW="20px"
              textAlign="right"
            >
              {match.matchNumber}
            </Text>
          )}
          <Box
            borderWidth="1.5px"
            borderColor="gray.200"
            borderRadius="lg"
            overflow="hidden"
            w={cardWidth}
            bg="white"
            boxShadow="sm"
          >
            {[match.participant1Label, match.participant2Label].map(
              (name, i) => (
                <Flex
                  key={i}
                  align="center"
                  px={compact ? 1.5 : 2.5}
                  py={compact ? 1 : 1.5}
                  borderBottomWidth={i === 0 ? '1px' : '0'}
                  borderColor="gray.100"
                >
                  <Text
                    fontSize={compact ? '2xs' : 'xs'}
                    flex={1}
                    truncate
                    lineHeight="1.3"
                    color="gray.600"
                    fontStyle="italic"
                  >
                    {name}
                  </Text>
                </Flex>
              )
            )}
          </Box>
        </Flex>
      </Flex>
    </Box>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BracketVisualization({
  teamCount,
  groupCount,
  winnersPerGroup,
  thirdPlaceMatch = false,
  compact = false,
  customSlots: externalCustomSlots,
  onSlotsChange,
  consolationMatches,
}: IBracketVisualizationProps) {
  const t = useTranslations('pages.tournaments.detail.manage');

  // ── Slot state ──────────────────────────────────────────────────────────────
  const [slots, setSlots] = useState<string[]>(() => {
    if (externalCustomSlots?.length) return externalCustomSlots;
    return computeDefaultSlots(groupCount, winnersPerGroup);
  });

  // Sync when external customSlots change (e.g., modal reset on open)
  useEffect(() => {
    if (externalCustomSlots === undefined) return;
    const next =
      externalCustomSlots.length > 0
        ? externalCustomSlots
        : computeDefaultSlots(groupCount, winnersPerGroup);
    setSlots((prev) => {
      if (prev.length === next.length && prev.every((s, i) => s === next[i]))
        return prev;
      return next;
    });
  }, [externalCustomSlots, groupCount, winnersPerGroup]);

  // ── Build bracket rounds ────────────────────────────────────────────────────
  const { rounds, thirdPlace, firstRoundSlotIds } = useMemo(() => {
    const bracketSize = nextPowerOf2(teamCount);
    if (bracketSize < 2)
      return { rounds: [], thirdPlace: null, firstRoundSlotIds: [] };

    const totalRounds = Math.log2(bracketSize);
    const firstRoundCount = bracketSize / 2;
    let matchCounter = GROUP_MATCH_OFFSET + 1;
    const slotIds: string[] = [];
    const bracketRounds: IRoundProps[] = [];

    // First round
    const firstSeeds: IBracketSeed[] = [];
    const advanceLabels: string[] = [];

    for (let i = 0; i < firstRoundCount; i++) {
      const s1 = slots[i * 2] ?? '';
      const s2 = slots[i * 2 + 1] ?? '';
      const matchNum = matchCounter++;
      const id1 = s1 || `_bye_${i * 2}`;
      const id2 = s2 || `_bye_${i * 2 + 1}`;
      firstSeeds.push({
        id: matchNum,
        matchNumber: matchNum,
        teams: [
          { name: s1, slotId: id1 },
          { name: s2, slotId: id2 },
        ],
      });
      slotIds.push(id1, id2);
      advanceLabels.push(t('panels.rounds.winnerOf', { match: matchNum }));
    }

    if (firstSeeds.length > 0) {
      bracketRounds.push({
        title: getRoundName(0, totalRounds, t),
        seeds: firstSeeds as unknown as ISeedProps[],
      });
    }

    // Subsequent rounds
    let prevAdvance = advanceLabels;
    for (let round = 1; round < totalRounds; round++) {
      const seeds: IBracketSeed[] = [];
      const nextAdvance: string[] = [];
      const matchesInRound = prevAdvance.length / 2;

      for (let i = 0; i < matchesInRound; i++) {
        const p1 = prevAdvance[i * 2] ?? '?';
        const p2 = prevAdvance[i * 2 + 1] ?? '?';
        const matchNum = matchCounter++;
        seeds.push({
          id: matchNum,
          matchNumber: matchNum,
          teams: [
            { name: p1, slotId: '' },
            { name: p2, slotId: '' },
          ],
        });
        nextAdvance.push(t('panels.rounds.winnerOf', { match: matchNum }));
      }

      bracketRounds.push({
        title: getRoundName(round, totalRounds, t),
        seeds: seeds as unknown as ISeedProps[],
      });
      prevAdvance = nextAdvance;
    }

    // Third place match
    let tpMatch: IThirdPlaceMatch | null = null;
    if (thirdPlaceMatch && bracketRounds.length >= 2) {
      const sfRound = bracketRounds[bracketRounds.length - 2];
      if (sfRound && sfRound.seeds.length === 2) {
        const sf0 = sfRound.seeds[0] as unknown as IBracketSeed;
        const sf1 = sfRound.seeds[1] as unknown as IBracketSeed;
        tpMatch = {
          matchNumber: matchCounter,
          participant1Label: t('panels.rounds.loserOf', {
            match: sf0.matchNumber,
          }),
          participant2Label: t('panels.rounds.loserOf', {
            match: sf1.matchNumber,
          }),
        };
      }
    }

    return {
      rounds: bracketRounds,
      thirdPlace: tpMatch,
      firstRoundSlotIds: slotIds,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots, teamCount, groupCount, winnersPerGroup, thirdPlaceMatch, t]);

  // ── DnD ─────────────────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      setSlots((prev) => {
        const from = prev.findIndex((s, i) => (s || `_bye_${i}`) === active.id);
        const to = prev.findIndex((s, i) => (s || `_bye_${i}`) === over.id);
        if (from === -1 || to === -1) return prev;
        const next = arrayMove(prev, from, to);
        onSlotsChange?.(next);
        return next;
      });
    },
    [onSlotsChange]
  );

  // ── Custom renders ───────────────────────────────────────────────────────────
  const renderSeedComponent = useCallback(
    ({ seed, breakpoint, roundIndex }: IRenderSeedProps) => {
      const s = seed as unknown as IBracketSeed;
      return (
        <SeedCard
          seed={s}
          breakpoint={breakpoint}
          isSortable={roundIndex === 0 && !compact}
          compact={compact}
        />
      );
    },
    [compact]
  );

  const roundTitleComponent = useCallback(
    (title: string | React.ReactNode) => (
      <Box display="flex" justifyContent="center" mb={compact ? 1.5 : 2}>
        <Box
          px={3}
          py={1}
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="full"
          bg="white"
        >
          <Text
            fontSize={compact ? '2xs' : 'xs'}
            fontWeight="semibold"
            whiteSpace="nowrap"
            color="gray.700"
          >
            {title}
          </Text>
        </Box>
      </Box>
    ),
    [compact]
  );

  if (rounds.length === 0) {
    return (
      <Flex align="center" justify="center" py={8}>
        <Text fontSize="sm" color="gray.400">
          Not enough teams for bracket
        </Text>
      </Flex>
    );
  }

  const bracketEl = (
    <BracketComponent
      rounds={rounds}
      mobileBreakpoint={0}
      renderSeedComponent={renderSeedComponent}
      roundTitleComponent={roundTitleComponent}
    />
  );

  return (
    <Box overflowX="auto" overflowY="auto" pb={4}>
      {compact ? (
        bracketEl
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={firstRoundSlotIds}
            strategy={rectSortingStrategy}
          >
            {bracketEl}
          </SortableContext>
        </DndContext>
      )}

      {/* 3rd place match */}
      {thirdPlace && (
        <ThirdPlaceCard
          match={thirdPlace}
          compact={compact}
          title={t('panels.rounds.thirdPlace')}
        />
      )}

      {/* Consolation matches */}
      {consolationMatches && consolationMatches.length > 0 && (
        <Box mt={compact ? 4 : 6}>
          <Flex direction="column" align="flex-start" pl={compact ? 4 : 8}>
            <Box
              display="inline-block"
              px={3}
              py={1}
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="full"
              bg="white"
              mb={compact ? 1.5 : 2}
            >
              <Text
                fontSize={compact ? '2xs' : 'xs'}
                fontWeight="semibold"
                color="gray.700"
              >
                {t('panels.rounds.consolations')}
              </Text>
            </Box>
            {consolationMatches.map((cm, idx) => (
              <Flex key={idx} align="center" gap={compact ? 1 : 2} mb={2}>
                {!compact && (
                  <Text
                    fontSize="xs"
                    color="gray.400"
                    fontWeight="medium"
                    minW="20px"
                    textAlign="right"
                  >
                    {cm.matchNumber}
                  </Text>
                )}
                <Box
                  borderWidth="1.5px"
                  borderColor="gray.200"
                  borderRadius="lg"
                  overflow="hidden"
                  w={compact ? '130px' : '180px'}
                  bg="white"
                  boxShadow="sm"
                >
                  {[cm.participant1Label, cm.participant2Label].map(
                    (name, i) => (
                      <Flex
                        key={i}
                        align="center"
                        px={compact ? 1.5 : 2.5}
                        py={compact ? 1 : 1.5}
                        borderBottomWidth={i === 0 ? '1px' : '0'}
                        borderColor="gray.100"
                      >
                        <Text
                          fontSize={compact ? '2xs' : 'xs'}
                          flex={1}
                          truncate
                          lineHeight="1.3"
                          color="gray.600"
                        >
                          {name}
                        </Text>
                      </Flex>
                    )
                  )}
                </Box>
              </Flex>
            ))}
          </Flex>
        </Box>
      )}
    </Box>
  );
}
