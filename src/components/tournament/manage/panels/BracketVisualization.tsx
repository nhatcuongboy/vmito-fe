'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import {
  SingleEliminationBracket,
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
const BracketEl = SingleEliminationBracket as React.ComponentType<any>;
// ─── Constants ───────────────────────────────────────────────────────────────

const POOL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const GROUP_MATCH_OFFSET = 12;
const MATCH_W = 200; // match card width passed to the bracket engine
const MATCH_H = 60; // match card height (2 rows × 30px)

// ─── Context ─────────────────────────────────────────────────────────────────

interface IBracketCtx {
  compact: boolean;
}
const BracketCtx = createContext<IBracketCtx>({ compact: false });

// ─── Types ───────────────────────────────────────────────────────────────────

export interface IBracketVisualizationProps {
  teamCount: number;
  groupCount: number;
  winnersPerGroup: number;
  thirdPlaceMatch?: boolean;
  fifthPlaceMatch?: boolean;
  seventhPlaceMatch?: boolean;
  /** If true, renders a compact thumbnail version without DnD */
  compact?: boolean;
  /** Custom slot order persisted externally (restored from formatConfig) */
  customSlots?: string[];
  /** Validate custom slots against generated advancing slots (RR -> SE only). */
  validateAdvancingSlots?: boolean;
  /** Fires when the user reorders first-round seeds via drag-and-drop */
  onSlotsChange?: (slots: string[]) => void;
  /** Optional consolation matches to render below the bracket */
  consolationMatches?: IConsolationMatchInfo[];
}

interface IConsolationMatchInfo {
  matchNumber: number;
  participant1Label: string;
  participant2Label: string;
}

interface IThirdPlaceInfo {
  matchNumber: number;
  participant1Label: string;
  participant2Label: string;
}

interface IRTBMatch extends MatchType {
  isFirstRound: boolean;
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
  if (fromFinal === 0) return t('panels.rounds.finals');
  if (fromFinal === 1) return t('panels.rounds.semiFinals');
  if (fromFinal === 2) return t('panels.rounds.quarterFinals');
  return t('panels.rounds.roundNumber', { number: roundIndex + 1 });
};

const getOrdinalLabel = (
  rank: number,
  t: ReturnType<typeof useTranslations>
): string => {
  const oneBased = rank + 1;
  const key = oneBased >= 1 && oneBased <= 8 ? String(oneBased) : 'other';
  return t(`panels.rounds.ordinals.${key}`, { rank: oneBased });
};

const generateAdvancingSlots = (
  groupCount: number,
  winnersPerGroup: number,
  t: ReturnType<typeof useTranslations>
): string[] => {
  const slots: string[] = [];
  for (let rank = 0; rank < winnersPerGroup; rank++) {
    for (let g = 0; g < groupCount; g++) {
      slots.push(
        t('panels.rounds.nthPoolLabel', {
          rank: getOrdinalLabel(rank, t),
          pool: POOL_LABELS[g] ?? String(g + 1),
        })
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
  winnersPerGroup: number,
  t: ReturnType<typeof useTranslations>
): string[] => {
  const advancingSlots = generateAdvancingSlots(groupCount, winnersPerGroup, t);
  const n = advancingSlots.length;
  if (n < 2) return [];
  const bracketSize = nextPowerOf2(n);
  const seedOrder = generateStandardSeeding(bracketSize);
  // seedOrder[pos] is the seed (1-based) that belongs at bracket position
  // `pos`. Placing each seed at its standard position spreads the top seeds
  // across the bracket — e.g. for 2 pools × 2 advancing this yields the
  // cross-pool matchups (1st A vs 2nd B) and (1st B vs 2nd A) rather than
  // pairing 1st and 2nd of the same pool together.
  const result: string[] = new Array(bracketSize).fill('');
  for (let pos = 0; pos < bracketSize; pos++) {
    const seed = seedOrder[pos];
    result[pos] = seed <= n ? advancingSlots[seed - 1] : '';
  }
  return result;
};

const resolveSlots = (
  customSlots: string[] | undefined,
  groupCount: number,
  winnersPerGroup: number,
  t: ReturnType<typeof useTranslations>,
  validateAdvancingSlots: boolean
): string[] => {
  const defaultSlots = computeDefaultSlots(groupCount, winnersPerGroup, t);
  if (!customSlots?.length) return defaultSlots;
  if (!validateAdvancingSlots) return customSlots;

  const validSlots = new Set(
    generateAdvancingSlots(groupCount, winnersPerGroup, t)
  );
  const hasStaleSlot = customSlots.some(
    (slot) => slot && !validSlots.has(slot)
  );

  if (hasStaleSlot || customSlots.length !== defaultSlots.length) {
    return defaultSlots;
  }

  return customSlots;
};

const areSlotsEqual = (a: string[], b: string[]): boolean =>
  a.length === b.length && a.every((slot, index) => slot === b[index]);

// ─── SortableTeamRow ─────────────────────────────────────────────────────────

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

// ─── StaticTeamRow ────────────────────────────────────────────────────────────

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

// ─── CustomMatch ─────────────────────────────────────────────────────────────

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

// ─── ThirdPlaceCard ───────────────────────────────────────────────────────────

function ThirdPlaceCard({
  match,
  compact,
  title,
}: {
  match: IThirdPlaceInfo;
  compact: boolean;
  title: string;
}) {
  const cardWidth = compact ? '130px' : `${MATCH_W}px`;

  return (
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
          _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
        >
          <Text
            fontSize={compact ? '2xs' : 'xs'}
            fontWeight="semibold"
            color="gray.700"
            _dark={{ color: 'gray.200' }}
          >
            {title}
          </Text>
        </Box>

        <Flex align="center" gap={compact ? 1 : 2}>
          {!compact && (
            <Text
              fontSize="xs"
              color="gray.400"
              fontWeight="medium"
              minW="20px"
              textAlign="right"
              _dark={{ color: 'gray.500' }}
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
            _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
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
                  _dark={{ borderColor: 'gray.700' }}
                >
                  <Text
                    fontSize={compact ? '2xs' : 'xs'}
                    flex={1}
                    truncate
                    lineHeight="1.3"
                    color="gray.600"
                    fontStyle="italic"
                    _dark={{ color: 'gray.300' }}
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
  fifthPlaceMatch = false,
  seventhPlaceMatch = false,
  compact = false,
  customSlots: externalCustomSlots,
  validateAdvancingSlots = false,
  onSlotsChange,
  consolationMatches,
}: IBracketVisualizationProps) {
  const t = useTranslations('pages.tournaments.detail.manage');

  // ── Slot state ──────────────────────────────────────────────────────────────
  const [slots, setSlots] = useState<string[]>(() => {
    return resolveSlots(
      externalCustomSlots,
      groupCount,
      winnersPerGroup,
      t,
      validateAdvancingSlots
    );
  });

  useEffect(() => {
    const next = resolveSlots(
      externalCustomSlots,
      groupCount,
      winnersPerGroup,
      t,
      validateAdvancingSlots
    );
    setSlots((prev) => {
      if (areSlotsEqual(prev, next)) return prev;
      return next;
    });

    if (
      externalCustomSlots?.length &&
      !areSlotsEqual(externalCustomSlots, next)
    ) {
      onSlotsChange?.(next);
    }
  }, [
    externalCustomSlots,
    groupCount,
    winnersPerGroup,
    onSlotsChange,
    t,
    validateAdvancingSlots,
  ]);

  // ── Build bracket data ───────────────────────────────────────────────────────
  const {
    flatMatches,
    firstRoundSlotIds,
    thirdPlace,
    fifthSF1,
    fifthSF2,
    fifthPlace,
    seventhPlace,
  } = useMemo(() => {
    const bracketSize = nextPowerOf2(teamCount);
    if (bracketSize < 2)
      return { flatMatches: [], firstRoundSlotIds: [], thirdPlace: null };

    const totalRounds = Math.log2(bracketSize);

    // Pre-compute all match IDs per round
    const roundMatchIds: number[][] = [];
    let counter = GROUP_MATCH_OFFSET + 1;
    for (let r = 0; r < totalRounds; r++) {
      const count = bracketSize / Math.pow(2, r + 1);
      const ids: number[] = [];
      for (let i = 0; i < count; i++) ids.push(counter++);
      roundMatchIds.push(ids);
    }

    const matches: IRTBMatch[] = [];
    const slotIds: string[] = [];

    for (let r = 0; r < totalRounds; r++) {
      const currentIds = roundMatchIds[r];
      const nextIds = roundMatchIds[r + 1];
      const roundName = getRoundName(r, totalRounds, t);
      const isFirstRound = r === 0;

      for (let i = 0; i < currentIds.length; i++) {
        const matchId = currentIds[i];
        const nextMatchId = nextIds
          ? (nextIds[Math.floor(i / 2)] ?? null)
          : null;

        let participants: MatchType['participants'];

        if (isFirstRound) {
          const s1 = slots[i * 2] ?? '';
          const s2 = slots[i * 2 + 1] ?? '';
          const id1 = s1 || `_bye_${i * 2}`;
          const id2 = s2 || `_bye_${i * 2 + 1}`;
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
          const prevIds = roundMatchIds[r - 1];
          const prevId1 = prevIds[i * 2];
          const prevId2 = prevIds[i * 2 + 1];
          participants = [
            {
              id: `win_${prevId1}`,
              name: t('panels.rounds.winnerOf', { match: prevId1 }),
              resultText: null,
              isWinner: false,
              status: null,
            },
            {
              id: `win_${prevId2}`,
              name: t('panels.rounds.winnerOf', { match: prevId2 }),
              resultText: null,
              isWinner: false,
              status: null,
            },
          ];
        }

        matches.push({
          id: matchId,
          name: `Match ${matchId}`,
          nextMatchId,
          tournamentRoundText: roundName,
          startTime: '',
          state: 'NO_PARTY',
          isFirstRound,
          participants,
        });
      }
    }

    // Third place match info (rendered separately below the SVG bracket)
    let tpMatch: IThirdPlaceInfo | null = null;
    const sfIds = roundMatchIds[totalRounds - 2];
    if (thirdPlaceMatch && totalRounds >= 2 && sfIds?.length === 2) {
      tpMatch = {
        matchNumber: counter,
        participant1Label: t('panels.rounds.loserOf', { match: sfIds[0] }),
        participant2Label: t('panels.rounds.loserOf', { match: sfIds[1] }),
      };
    }
    const tpMatchNumber = counter;
    counter++;

    // 5th / 7th place consolation bracket (only for bracket size >= 8)
    // Requires QF round: roundMatchIds[totalRounds - 2] are SFs, roundMatchIds[totalRounds - 3] are QFs
    const qfIds =
      totalRounds >= 3 ? (roundMatchIds[totalRounds - 3] ?? []) : [];
    let fifthSF1: IThirdPlaceInfo | null = null;
    let fifthSF2: IThirdPlaceInfo | null = null;
    let fifthPlace: IThirdPlaceInfo | null = null;
    let seventhPlace: IThirdPlaceInfo | null = null;

    if (fifthPlaceMatch && qfIds.length >= 4) {
      // Two P5 semi finals: losers of each pair of QF matches
      const sf1Id = counter++;
      const sf2Id = counter++;
      fifthSF1 = {
        matchNumber: sf1Id,
        participant1Label: t('panels.rounds.loserOf', { match: qfIds[0] }),
        participant2Label: t('panels.rounds.loserOf', { match: qfIds[1] }),
      };
      fifthSF2 = {
        matchNumber: sf2Id,
        participant1Label: t('panels.rounds.loserOf', { match: qfIds[2] }),
        participant2Label: t('panels.rounds.loserOf', { match: qfIds[3] }),
      };
      fifthPlace = {
        matchNumber: counter++,
        participant1Label: t('panels.rounds.winnerOf', { match: sf1Id }),
        participant2Label: t('panels.rounds.winnerOf', { match: sf2Id }),
      };
      if (seventhPlaceMatch) {
        seventhPlace = {
          matchNumber: counter++,
          participant1Label: t('panels.rounds.loserOf', { match: sf1Id }),
          participant2Label: t('panels.rounds.loserOf', { match: sf2Id }),
        };
      }
    } else if (fifthPlaceMatch && sfIds?.length === 2) {
      // No QF round (bracket size 4): use SF losers directly
      fifthPlace = {
        matchNumber: counter++,
        participant1Label: t('panels.rounds.loserOf', { match: sfIds[0] }),
        participant2Label: t('panels.rounds.loserOf', { match: sfIds[1] }),
      };
    }

    // suppress unused warning
    void tpMatchNumber;

    return {
      flatMatches: matches,
      firstRoundSlotIds: slotIds,
      thirdPlace: tpMatch,
      fifthSF1,
      fifthSF2,
      fifthPlace,
      seventhPlace,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    slots,
    teamCount,
    groupCount,
    winnersPerGroup,
    thirdPlaceMatch,
    fifthPlaceMatch,
    seventhPlaceMatch,
    t,
  ]);

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
          roundTextGenerator: (currentRound: number, totalRounds: number) =>
            getRoundName(currentRound - 1, totalRounds, t),
        },
      },
    }),
    [compact, matchH, matchW, t]
  );

  if (flatMatches.length === 0) {
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
      matches={flatMatches}
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

        {/* 3rd place match — rendered below the SVG bracket */}
        {thirdPlace && !compact && (
          <ThirdPlaceCard
            match={thirdPlace}
            compact={compact}
            title={t('panels.rounds.thirdPlace')}
          />
        )}

        {/* 5th / 7th place consolation bracket */}
        {!compact && fifthPlace && (
          <Box mt={6}>
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color="gray.500"
              mb={3}
              pl={8}
              _dark={{ color: 'gray.400' }}
            >
              {t('panels.rounds.consolationBracket')}
            </Text>
            {/* P5 Semi Finals */}
            {fifthSF1 && fifthSF2 && (
              <Flex gap={4} pl={8} mb={4} flexWrap="wrap">
                <Box>
                  <Text
                    fontSize="2xs"
                    color="gray.400"
                    mb={1}
                    fontWeight="medium"
                    _dark={{ color: 'gray.500' }}
                  >
                    {t('panels.rounds.p5SemiFinals')}
                  </Text>
                  <ThirdPlaceCard match={fifthSF1} compact={false} title="" />
                  <Box mt={2}>
                    <ThirdPlaceCard match={fifthSF2} compact={false} title="" />
                  </Box>
                </Box>
                <Box>
                  <Text
                    fontSize="2xs"
                    color="gray.400"
                    mb={1}
                    fontWeight="medium"
                    _dark={{ color: 'gray.500' }}
                  >
                    &nbsp;
                  </Text>
                  <ThirdPlaceCard
                    match={fifthPlace}
                    compact={false}
                    title={t('panels.rounds.fifthPlace')}
                  />
                  {seventhPlace && (
                    <Box mt={2}>
                      <ThirdPlaceCard
                        match={seventhPlace}
                        compact={false}
                        title={t('panels.rounds.seventhPlace')}
                      />
                    </Box>
                  )}
                </Box>
              </Flex>
            )}
            {/* Simple 5th place (no QF round) */}
            {!fifthSF1 && (
              <ThirdPlaceCard
                match={fifthPlace}
                compact={false}
                title={t('panels.rounds.fifthPlace')}
              />
            )}
          </Box>
        )}

        {/* Consolation matches */}
        {consolationMatches &&
          consolationMatches.length > 0 &&
          !compact &&
          consolationMatches.map((cm, i) => (
            <ThirdPlaceCard
              key={`consolation-${i}`}
              match={cm}
              compact={compact}
              title={t('panels.rounds.consolationMatch')}
            />
          ))}
      </Box>
    </BracketCtx.Provider>
  );
}
