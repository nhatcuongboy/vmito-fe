'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
} from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import {
  DoubleEliminationBracket,
  createTheme,
  type MatchType,
  type MatchComponentProps,
} from 'react-tournament-brackets';
import { GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext as SortableContextBase,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Workaround for @dnd-kit type incompatibility with React 19
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SortableContext = SortableContextBase as any;
// Workaround for react-tournament-brackets type incompatibility with React 19
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BracketEl = DoubleEliminationBracket as React.ComponentType<any>;

const MATCH_W = 200;
const MATCH_H = 60;
const UPPER_OFFSET = 1000;
const LOWER_OFFSET = 2000;
const GF_ID = 9000;
const GF2_ID = 9001;

interface IBracketCtx {
  compact: boolean;
}
const BracketCtx = createContext<IBracketCtx>({ compact: false });

interface IRTBMatch extends MatchType {
  isFirstRound: boolean;
}

export interface IDoubleEliminationBracketVizProps {
  teamCount: number;
  /** If true, renders a compact thumbnail version without DnD */
  compact?: boolean;
  /** Whether the grand final supports a bracket reset (true double elim) */
  isTrueDoubleElimination?: boolean;
  /** Custom slot order persisted externally (restored from formatConfig) */
  customSlots?: string[];
  /** Fires when the user reorders first-round seeds via drag-and-drop */
  onSlotsChange?: (slots: string[]) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const nextPowerOf2 = (n: number): number => {
  let p = 1;
  while (p < n) p *= 2;
  return p;
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
  teamCount: number,
  t: ReturnType<typeof useTranslations>
): string[] => {
  const bracketSize = nextPowerOf2(teamCount);
  if (bracketSize < 2) return [];
  const seedOrder = generateStandardSeeding(bracketSize);
  const result: string[] = new Array(bracketSize).fill('');
  for (let pos = 0; pos < bracketSize; pos++) {
    const seed = seedOrder[pos];
    result[pos] =
      seed <= teamCount ? t('panels.rounds.seedLabel', { seed }) : '';
  }
  return result;
};

const areSlotsEqual = (a: string[], b: string[]): boolean =>
  a.length === b.length && a.every((slot, index) => slot === b[index]);

// ─── Sortable / static rows (shared with SE visualization styling) ───────────

function SortableTeamRow({
  slotId,
  name,
  isLast,
}: {
  slotId: string;
  name: string;
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
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 50 : undefined,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        padding: '0 10px',
        height: `${MATCH_H / 2}px`,
        background: 'white',
        borderBottom: isLast ? 'none' : '1px solid #f0f4f8',
      }}
    >
      <span
        style={{
          fontSize: '12px',
          color: name ? '#2d3748' : '#a0aec0',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          lineHeight: 1.3,
        }}
      >
        {name || '—'}
      </span>
      <div
        style={{
          color: '#a0aec0',
          cursor: 'grab',
          marginLeft: '6px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
        }}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={13} />
      </div>
    </div>
  );
}

function StaticTeamRow({
  name,
  showHandle,
  isLast,
}: {
  name: string;
  showHandle: boolean;
  isLast: boolean;
}) {
  const { compact } = useContext(BracketCtx);
  const rowH = compact ? 20 : MATCH_H / 2;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: compact ? '0 6px' : '0 10px',
        height: `${rowH}px`,
        background: 'white',
        borderBottom: isLast ? 'none' : '1px solid #f0f4f8',
      }}
    >
      <span
        style={{
          fontSize: compact ? '10px' : '12px',
          color: '#4a5568',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          lineHeight: 1.3,
        }}
      >
        {name || '—'}
      </span>
      {showHandle && (
        <div
          style={{
            color: '#e2e8f0',
            marginLeft: '6px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <GripVertical size={13} />
        </div>
      )}
    </div>
  );
}

function CustomMatch({ match, topParty, bottomParty }: MatchComponentProps) {
  const { compact } = useContext(BracketCtx);
  const rtbMatch = match as IRTBMatch;
  const canSort = rtbMatch.isFirstRound && !compact;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1.5px solid #e2e8f0',
        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
        background: 'white',
      }}
    >
      {canSort ? (
        <>
          <SortableTeamRow
            slotId={String(topParty?.id ?? '')}
            name={topParty?.name ?? ''}
            isLast={false}
          />
          <SortableTeamRow
            slotId={String(bottomParty?.id ?? '')}
            name={bottomParty?.name ?? ''}
            isLast={true}
          />
        </>
      ) : (
        <>
          <StaticTeamRow
            name={topParty?.name ?? ''}
            showHandle={!compact}
            isLast={false}
          />
          <StaticTeamRow
            name={bottomParty?.name ?? ''}
            showHandle={!compact}
            isLast={true}
          />
        </>
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function DoubleEliminationBracketViz({
  teamCount,
  compact = false,
  isTrueDoubleElimination = false,
  customSlots: externalCustomSlots,
  onSlotsChange,
}: IDoubleEliminationBracketVizProps) {
  const t = useTranslations('pages.tournaments.detail.manage');

  const [slots, setSlots] = useState<string[]>(() =>
    externalCustomSlots?.length
      ? externalCustomSlots
      : computeDefaultSlots(teamCount, t)
  );

  useEffect(() => {
    const next = externalCustomSlots?.length
      ? externalCustomSlots
      : computeDefaultSlots(teamCount, t);
    setSlots((prev) => (areSlotsEqual(prev, next) ? prev : next));
  }, [externalCustomSlots, teamCount, t]);

  const { upper, lower, firstRoundSlotIds } = useMemo(() => {
    const bracketSize = nextPowerOf2(teamCount);
    if (bracketSize < 4) {
      return { upper: [], lower: [], firstRoundSlotIds: [] };
    }

    const upperRounds = Math.log2(bracketSize);
    const slotIds: string[] = [];

    // Pre-compute upper match ids per round.
    const upperIds: number[][] = [];
    let uCounter = UPPER_OFFSET;
    for (let r = 0; r < upperRounds; r++) {
      const count = bracketSize / Math.pow(2, r + 1);
      const ids: number[] = [];
      for (let i = 0; i < count; i++) ids.push(uCounter++);
      upperIds.push(ids);
    }

    // Lower bracket round counts: [c, c, c/2, c/2, ...], length = 2R-2.
    const lowerRoundCount = 2 * upperRounds - 2;
    const lbCounts: number[] = [];
    for (let k = 0; k < lowerRoundCount; k++) {
      if (k === 0) lbCounts.push(bracketSize / 4);
      else if (k % 2 === 1) lbCounts.push(lbCounts[k - 1]);
      else lbCounts.push(lbCounts[k - 1] / 2);
    }
    const lowerIds: number[][] = [];
    let lCounter = LOWER_OFFSET;
    for (let k = 0; k < lowerRoundCount; k++) {
      const ids: number[] = [];
      for (let i = 0; i < lbCounts[k]; i++) ids.push(lCounter++);
      lowerIds.push(ids);
    }

    const upperMatches: IRTBMatch[] = [];
    const lowerMatches: IRTBMatch[] = [];

    // ── Upper bracket matches ────────────────────────────────────────────────
    for (let r = 0; r < upperRounds; r++) {
      const ids = upperIds[r];
      const isFirstRound = r === 0;
      const isUpperFinal = r === upperRounds - 1;
      for (let i = 0; i < ids.length; i++) {
        const matchId = ids[i];
        const winnerNext = isUpperFinal
          ? GF_ID
          : upperIds[r + 1][Math.floor(i / 2)];
        // Loser routing: r=0 -> lower round 0 match floor(i/2);
        // r>=1 -> lower round (2r-1) match i.
        const loserRound = r === 0 ? 0 : 2 * r - 1;
        const loserMatchId =
          lowerIds[loserRound]?.[r === 0 ? Math.floor(i / 2) : i] ?? null;

        let participants: MatchType['participants'];
        if (isFirstRound) {
          const s1 = slots[i * 2] ?? '';
          const s2 = slots[i * 2 + 1] ?? '';
          const id1 = s1 ? `s_${i * 2}` : `_bye_${i * 2}`;
          const id2 = s2 ? `s_${i * 2 + 1}` : `_bye_${i * 2 + 1}`;
          slotIds.push(id1, id2);
          participants = [
            {
              id: id1,
              name: s1,
              resultText: null,
              isWinner: false,
              status: null,
            },
            {
              id: id2,
              name: s2,
              resultText: null,
              isWinner: false,
              status: null,
            },
          ];
        } else {
          participants = [];
        }

        upperMatches.push({
          id: matchId,
          name: `UB ${r + 1}.${i + 1}`,
          nextMatchId: winnerNext,
          nextLooserMatchId: loserMatchId ?? undefined,
          tournamentRoundText: t('panels.rounds.upperBracketRound', {
            number: r + 1,
          }),
          startTime: '',
          state: 'NO_PARTY',
          isFirstRound,
          participants,
        } as IRTBMatch);
      }
    }

    // ── Lower bracket matches ────────────────────────────────────────────────
    for (let k = 0; k < lowerRoundCount; k++) {
      const ids = lowerIds[k];
      const isLastLower = k === lowerRoundCount - 1;
      for (let i = 0; i < ids.length; i++) {
        let winnerNext: number;
        if (isLastLower) {
          winnerNext = GF_ID;
        } else if (lbCounts[k + 1] === lbCounts[k]) {
          winnerNext = lowerIds[k + 1][i];
        } else {
          winnerNext = lowerIds[k + 1][Math.floor(i / 2)];
        }

        lowerMatches.push({
          id: ids[i],
          name: `LB ${k + 1}.${i + 1}`,
          nextMatchId: winnerNext,
          tournamentRoundText: t('panels.rounds.lowerBracketRound', {
            number: k + 1,
          }),
          startTime: '',
          state: 'NO_PARTY',
          isFirstRound: false,
          participants: [],
        } as IRTBMatch);
      }
    }

    // ── Grand final (+ optional reset) ───────────────────────────────────────
    upperMatches.push({
      id: GF_ID,
      name: t('panels.rounds.grandFinal'),
      nextMatchId: isTrueDoubleElimination ? GF2_ID : null,
      tournamentRoundText: t('panels.rounds.grandFinal'),
      startTime: '',
      state: 'NO_PARTY',
      isFirstRound: false,
      participants: [],
    } as IRTBMatch);

    if (isTrueDoubleElimination) {
      upperMatches.push({
        id: GF2_ID,
        name: t('panels.rounds.grandFinalReset'),
        nextMatchId: null,
        tournamentRoundText: t('panels.rounds.grandFinalReset'),
        startTime: '',
        state: 'NO_PARTY',
        isFirstRound: false,
        participants: [],
      } as IRTBMatch);
    }

    return {
      upper: upperMatches,
      lower: lowerMatches,
      firstRoundSlotIds: slotIds,
    };
  }, [slots, teamCount, isTrueDoubleElimination, t]);

  // ── DnD ──────────────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      setSlots((prev) => {
        const from = prev.findIndex(
          (s, i) => (s ? `s_${i}` : `_bye_${i}`) === active.id
        );
        const to = prev.findIndex(
          (s, i) => (s ? `s_${i}` : `_bye_${i}`) === over.id
        );
        if (from === -1 || to === -1) return prev;
        const next = arrayMove(prev, from, to);
        onSlotsChange?.(next);
        return next;
      });
    },
    [onSlotsChange]
  );

  const matchW = compact ? 130 : MATCH_W;
  const matchH = compact ? 40 : MATCH_H;

  const bracketTheme = useMemo(
    () =>
      createTheme({
        fontFamily: '"Inter", "Arial", "Helvetica", sans-serif',
        roundHeaders: {
          background: compact ? '#F8FAFC' : '#F1F5F9',
        },
        textColor: {
          highlighted: '#111827',
        },
        canvasBackground: 'transparent',
      }),
    [compact]
  );

  const bracketOptions = useMemo(
    () => ({
      style: {
        width: matchW,
        boxHeight: matchH,
        canvasPadding: compact ? 8 : 24,
        spaceBetweenColumns: compact ? 20 : 40,
        spaceBetweenRows: compact ? 10 : 18,
        connectorColor: '#CBD5E0',
        connectorColorHighlight: '#2563EB',
        horizontalOffset: 0,
        roundSeparatorWidth: compact ? 20 : 40,
        lineInfo: {
          separation: 0,
          homeVisitorSpread: matchH / 4,
        },
        roundHeader: {
          isShown: true,
          height: compact ? 24 : 40,
          marginBottom: compact ? 10 : 20,
          fontSize: compact ? 11 : 14,
          fontColor: '#111827',
          backgroundColor: compact ? '#F8FAFC' : '#F1F5F9',
          fontFamily: '"Inter", "Arial", "Helvetica", sans-serif',
        },
      },
    }),
    [compact, matchH, matchW]
  );

  if (upper.length === 0) {
    return (
      <Flex align="center" justify="center" py={8}>
        <Text fontSize="sm" color="gray.400" _dark={{ color: 'gray.500' }}>
          {t('panels.rounds.notEnoughTeams')}
        </Text>
      </Flex>
    );
  }

  const bracketEl = (
    <BracketEl
      matches={{ upper, lower }}
      matchComponent={CustomMatch}
      options={bracketOptions}
      theme={bracketTheme}
      svgWrapper={({
        bracketWidth,
        bracketHeight,
        children,
      }: {
        bracketWidth: number;
        bracketHeight: number;
        children: React.ReactElement;
        startAt: number[];
      }) =>
        compact ? (
          <div
            style={{
              overflow: 'hidden',
              pointerEvents: 'none',
              width: `${bracketWidth}px`,
              height: `${bracketHeight}px`,
            }}
          >
            {children}
          </div>
        ) : (
          <div
            style={{
              overflowX: 'auto',
              overflowY: 'visible',
              width: `${bracketWidth}px`,
              minHeight: `${bracketHeight}px`,
              position: 'relative',
            }}
          >
            {children}
          </div>
        )
      }
    />
  );

  return (
    <BracketCtx.Provider value={{ compact }}>
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
      </Box>
    </BracketCtx.Provider>
  );
}
