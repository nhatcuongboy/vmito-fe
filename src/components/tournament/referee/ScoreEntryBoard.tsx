'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Flex, Text, HStack, VStack } from '@chakra-ui/react';
import { Button, IconButton } from '@/components/ui/chakra-compat';
import { VModal } from '@/components/ui/VModal';
import { useTranslations } from 'next-intl';
import {
  ArrowLeftRight,
  Check,
  Dices,
  Flag,
  History,
  Minus,
  RefreshCw,
  Undo2,
  Wifi,
  WifiOff,
} from 'lucide-react';

import { CategoryService } from '@/lib/api/category.service';
import {
  CategoryMatch,
  CategoryRegistration,
  MatchSet,
  SportType,
} from '@/lib/api/types';
import { getTeamLabel } from '@/lib/tournament/teamLabel';
import {
  applyDelta,
  defaultRules,
  isMatchComplete,
  setWins,
} from '@/lib/scoring/badminton';
import { useTournamentSocket } from '@/hooks/useTournamentSocket';
import EndMatchConfirmModal from './EndMatchConfirmModal';
import EditSetScoreModal from './EditSetScoreModal';

interface Props {
  match: CategoryMatch;
  tournamentId: string;
  sportType?: SportType | null;
  onMatchUpdate: (m: CategoryMatch) => void;
  // When provided, shows a "Forfeit / walkover" control alongside End Match.
  onForfeit?: () => void;
}

function genClientId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `c_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

/** True when two set arrays carry the same scores — lets us skip redundant
 * reconcile re-renders (a new array identity would otherwise re-render the
 * whole board after every tap, causing a one-frame flicker). */
function sameSets(a: MatchSet[], b: MatchSet[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (
      a[i].setNumber !== b[i].setNumber ||
      a[i].player1Score !== b[i].player1Score ||
      a[i].player2Score !== b[i].player2Score
    ) {
      return false;
    }
  }
  return true;
}

function setsOf(match: CategoryMatch, isDoubles: boolean): MatchSet[] {
  const sets = match.sets ?? [];
  if (sets.length === 0) {
    const base: MatchSet = { setNumber: 1, player1Score: 0, player2Score: 0 };
    if (isDoubles) {
      base.player3Score = 0;
      base.player4Score = 0;
    }
    return [base];
  }
  return sets.map((s) => ({ ...s }));
}

const SCOREBOARD_SWAP_KEY_PREFIX = 'vmito.referee.scoreboard.swap.';

function getScoreboardSwapKey(matchId: string): string {
  return `${SCOREBOARD_SWAP_KEY_PREFIX}${matchId}`;
}

// The backend stores a point order (`pointLog`) but no per-point timestamps, so
// the referee-facing match log is captured client-side at tap time and kept in
// localStorage (per match) so it survives reloads on the same device.
const MATCH_LOG_KEY_PREFIX = 'vmito.referee.matchlog.';
const MATCH_LOG_MAX_ENTRIES = 500;

function getMatchLogKey(matchId: string): string {
  return `${MATCH_LOG_KEY_PREFIX}${matchId}`;
}

type MatchLogEntry = {
  id: string;
  ts: number;
  kind: 'point' | 'undo' | 'serve';
  side?: 1 | 2;
  team?: string;
  delta?: 1 | -1;
  setNumber?: number;
};

function loadMatchLog(matchId: string): MatchLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(getMatchLogKey(matchId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MatchLogEntry[]) : [];
  } catch {
    return [];
  }
}

function saveMatchLog(matchId: string, entries: MatchLogEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      getMatchLogKey(matchId),
      JSON.stringify(entries.slice(-MATCH_LOG_MAX_ENTRIES))
    );
  } catch {
    // Ignore quota / serialization errors — the log is a best-effort aid.
  }
}

// Short haptic pulse (no-op where unsupported, e.g. iOS Safari / desktop).
function vibrate(durationMs: number): void {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
  try {
    navigator.vibrate(durationMs);
  } catch {
    // Ignore — vibration is a non-critical enhancement.
  }
}

// Lazily-created shared AudioContext for the synthesized "tick" (no asset).
let tickAudioContext: AudioContext | null = null;

function playTick(): void {
  if (typeof window === 'undefined') return;
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    tickAudioContext = tickAudioContext ?? new Ctx();
    const ctx = tickAudioContext;
    if (ctx.state === 'suspended') void ctx.resume();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  } catch {
    // Ignore — audio is a non-critical enhancement.
  }
}

function isPickleballDoublesMatch(
  match: CategoryMatch,
  sportType?: SportType | null
): boolean {
  if (sportType !== SportType.PICKLEBALL) return false;
  if ((match.category?.teamSize ?? 0) >= 2) return true;
  return match.participants?.some((p) => p.categoryRegistration?.pair) ?? false;
}

function getSidePlayerNames(match: CategoryMatch, side: 1 | 2): string {
  const participant = match.participants?.find((p) => p.position === side);
  const registration = participant?.categoryRegistration;
  if (!registration) return '';

  return getRegistrationPlayerNames(registration);
}

function getRegistrationPlayerNames(
  registration: CategoryRegistration
): string {
  if (registration.player?.name) {
    return registration.player.name;
  }

  const memberNames =
    registration.pair?.members
      ?.slice()
      .sort((a, b) => a.position - b.position)
      .map((member) => member.player?.name)
      .filter(Boolean) ?? [];

  if (memberNames.length > 0) {
    return memberNames.join(' / ');
  }

  return registration.pair?.name ?? '';
}

export default function ScoreEntryBoard({
  match,
  tournamentId,
  sportType,
  onMatchUpdate,
  onForfeit,
}: Props) {
  const t = useTranslations('pages.tournaments.scoreEntry');

  const isDoubles =
    (match.category?.teamSize ?? 0) >= 2 ||
    (match.participants?.some((p) => p.categoryRegistration?.pair) ?? false);
  const showPickleballServe = isPickleballDoublesMatch(match, sportType);
  const rules = defaultRules(match, sportType);

  const clientIdRef = useRef<string>(genClientId());
  const boardRef = useRef<HTMLDivElement>(null);
  const seqRef = useRef(0);
  const logSeqRef = useRef(0);
  const prevServeRef = useRef<string | null>(null);
  const prevCompleteRef = useRef(false);
  const queueRef = useRef<{ side: 1 | 2; delta: 1 | -1; seq: number }[]>([]);
  const processingRef = useRef(false);

  const [displaySets, setDisplaySets] = useState<MatchSet[]>(() =>
    setsOf(match, isDoubles)
  );
  const [busy, setBusy] = useState(false);
  const [serveBusy, setServeBusy] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [tossOpen, setTossOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [logEntries, setLogEntries] = useState<MatchLogEntry[]>(() =>
    loadMatchLog(match.id)
  );
  const [editingSetIndex, setEditingSetIndex] = useState<number | null>(null);
  const [isSwapped, setIsSwapped] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(getScoreboardSwapKey(match.id)) === '1';
  });

  const team1 = getTeamLabel(match, 1);
  const team2 = getTeamLabel(match, 2);
  const team1PlayerNames = getSidePlayerNames(match, 1);
  const team2PlayerNames = getSidePlayerNames(match, 2);

  const wins = setWins(displaySets, rules);
  const current = displaySets[displaySets.length - 1];
  const matchState = isMatchComplete(displaySets, rules);

  const refetch = useCallback(async () => {
    const fresh = await CategoryService.getMatch(match.id);
    const next = setsOf(fresh, isDoubles);
    setDisplaySets((prev) => (sameSets(prev, next) ? prev : next));
    onMatchUpdate(fresh);
  }, [match.id, isDoubles, onMatchUpdate]);

  const appendLog = useCallback(
    (entry: Omit<MatchLogEntry, 'id' | 'ts'>) => {
      logSeqRef.current += 1;
      const next: MatchLogEntry = {
        ...entry,
        id: `${Date.now()}_${logSeqRef.current}`,
        ts: Date.now(),
      };
      setLogEntries((prev) => {
        const updated = [...prev, next].slice(-MATCH_LOG_MAX_ENTRIES);
        saveMatchLog(match.id, updated);
        return updated;
      });
    },
    [match.id]
  );

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setBusy(true);
    let lastResp: CategoryMatch | null = null;
    try {
      while (queueRef.current.length > 0) {
        const item = queueRef.current.shift()!;
        try {
          lastResp = await CategoryService.liveUpdateScore(match.id, {
            side: item.side,
            delta: item.delta,
            clientId: clientIdRef.current,
            seq: item.seq,
          });
        } catch {
          // Conflict or network error: drop the queue and resync from server.
          queueRef.current = [];
          await refetch();
          lastResp = null;
          break;
        }
      }
    } finally {
      processingRef.current = false;
      setBusy(false);
    }
    // Reconcile to authoritative state only once the burst has fully settled.
    // Skip the state update when the server confirms exactly what we already
    // show, so an unchanged result doesn't re-render (and flicker) the board.
    if (lastResp && queueRef.current.length === 0) {
      const next = setsOf(lastResp, isDoubles);
      setDisplaySets((prev) => (sameSets(prev, next) ? prev : next));
      onMatchUpdate(lastResp);
    }
  }, [match.id, isDoubles, onMatchUpdate, refetch]);

  const handleScore = useCallback(
    (side: 1 | 2, delta: 1 | -1) => {
      seqRef.current += 1;
      setDisplaySets((prev) => applyDelta(prev, side, delta, rules, isDoubles));
      queueRef.current.push({ side, delta, seq: seqRef.current });
      appendLog({
        kind: 'point',
        side,
        delta,
        team: side === 1 ? team1 : team2,
        setNumber: current?.setNumber ?? 1,
      });
      void processQueue();
    },
    [
      rules,
      isDoubles,
      processQueue,
      appendLog,
      team1,
      team2,
      current?.setNumber,
    ]
  );

  // Pickleball doubles serving indicator: show the dots on whichever side the
  // "Lượt giao pickleball" control currently points to, using the same default
  // (side 1 / server 2) so the dots and the control always agree.
  const servingSide = match.servingSide ?? 1;
  const serverNumber = match.serverNumber ?? 2;
  const serverDotsForSide = (side: 1 | 2): 1 | 2 | null =>
    showPickleballServe && servingSide === side ? serverNumber : null;

  const sidePanels: TeamScorePanelProps[] = [
    {
      side: 1,
      teamName: team1,
      playerNames: team1PlayerNames,
      score: current?.player1Score ?? 0,
      setWins: wins.side1,
      colorScheme: 'blue',
      disabled: matchState.complete,
      onIncrement: () => handleScore(1, 1),
      onDecrement: () => handleScore(1, -1),
      incLabel: t('addPointFor', { team: team1 }),
      decLabel: t('removePointFor', { team: team1 }),
      serverDots: serverDotsForSide(1),
    },
    {
      side: 2,
      teamName: team2,
      playerNames: team2PlayerNames,
      score: current?.player2Score ?? 0,
      setWins: wins.side2,
      colorScheme: 'orange',
      disabled: matchState.complete,
      onIncrement: () => handleScore(2, 1),
      onDecrement: () => handleScore(2, -1),
      incLabel: t('addPointFor', { team: team2 }),
      decLabel: t('removePointFor', { team: team2 }),
      serverDots: serverDotsForSide(2),
    },
  ];
  const visibleSidePanels = isSwapped
    ? sidePanels.slice().reverse()
    : sidePanels;

  const handleUndo = useCallback(async () => {
    if (processingRef.current) return;
    try {
      const resp = await CategoryService.undoLastPoint(match.id);
      const next = setsOf(resp, isDoubles);
      setDisplaySets((prev) => (sameSets(prev, next) ? prev : next));
      onMatchUpdate(resp);
      appendLog({ kind: 'undo' });
    } catch {
      await refetch();
    }
  }, [match.id, isDoubles, onMatchUpdate, refetch, appendLog]);

  const handlePickleballServe = useCallback(
    async (servingSide: 1 | 2, serverNumber: 1 | 2) => {
      if (!showPickleballServe) return;
      seqRef.current += 1;
      setServeBusy(true);
      try {
        const resp = await CategoryService.updatePickleballServe(match.id, {
          servingSide,
          serverNumber,
          clientId: clientIdRef.current,
          seq: seqRef.current,
        });
        onMatchUpdate(resp);
      } catch {
        await refetch();
      } finally {
        setServeBusy(false);
      }
    },
    [match.id, onMatchUpdate, refetch, showPickleballServe]
  );

  // External updates (e.g. host correction). Ignore our own broadcast echoes.
  const { isConnected } = useTournamentSocket(tournamentId, {
    onScoreUpdated: (e) => {
      if (e.match.matchId !== match.id) return;
      if (e.clientId === clientIdRef.current) return;
      // Serve state now travels with every score broadcast, so apply it
      // straight from the event payload instead of refetching the whole match
      // — the dots stay in lockstep with the score with no extra round-trip.
      if (
        showPickleballServe &&
        (e.match.servingSide !== match.servingSide ||
          e.match.serverNumber !== match.serverNumber)
      ) {
        onMatchUpdate({
          ...match,
          servingSide: e.match.servingSide ?? null,
          serverNumber: e.match.serverNumber ?? null,
        });
      }
      if (processingRef.current) return; // don't fight an in-flight burst
      if (e.match.sets.length === 0) return;
      const next = e.match.sets;
      setDisplaySets((prev) => (sameSets(prev, next) ? prev : next));
    },
    onMatchEnded: (e) => {
      if (e.match.matchId === match.id) void refetch();
    },
    onReconnect: () => void refetch(),
  });

  // Keep local state in sync if the parent swaps in a different match.
  useEffect(() => {
    setDisplaySets(setsOf(match, isDoubles));
    setIsSwapped(
      window.localStorage.getItem(getScoreboardSwapKey(match.id)) === '1'
    );
    setLogEntries(loadMatchLog(match.id));
    queueRef.current = [];
    // Reset the serve tracker so the new match's first serve state isn't
    // mistaken for a rotation. Runs before the serve-logging effect below.
    prevServeRef.current = null;
    // Reset the completion tracker so an already-complete match swapped in
    // doesn't auto-pop the end modal on mount.
    prevCompleteRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.id]);

  useEffect(() => {
    window.localStorage.setItem(
      getScoreboardSwapKey(match.id),
      isSwapped ? '1' : '0'
    );
  }, [isSwapped, match.id]);

  // Log serve rotations (manual or auto). Both the referee's serve control and
  // the server's automatic rotation surface here as servingSide/serverNumber
  // changes, so we record them off a single source of truth. A ref tracks the
  // previous value so the initial render (and match swaps) don't log a phantom.
  useEffect(() => {
    if (!showPickleballServe) {
      prevServeRef.current = null;
      return;
    }
    const signature = `${match.servingSide ?? 1}:${match.serverNumber ?? 2}`;
    if (prevServeRef.current === null) {
      prevServeRef.current = signature;
      return;
    }
    if (prevServeRef.current !== signature) {
      prevServeRef.current = signature;
      appendLog({ kind: 'serve' });
    }
  }, [match.servingSide, match.serverNumber, showPickleballServe, appendLog]);

  // Pop the end-match confirmation as soon as the score first satisfies the win
  // condition (badminton or pickleball). A ref tracks the previous completion
  // so the modal only auto-opens on the transition into "complete" — if the
  // referee cancels it stays closed, and only reopens after the score drops
  // below the threshold (undo) and reaches it again.
  useEffect(() => {
    if (matchState.complete && !prevCompleteRef.current) {
      setEndOpen(true);
    }
    prevCompleteRef.current = matchState.complete;
  }, [matchState.complete]);

  const formatSetScore = (set: MatchSet) =>
    isSwapped
      ? `${set.player2Score}-${set.player1Score}`
      : `${set.player1Score}-${set.player2Score}`;

  return (
    <Flex
      ref={boardRef}
      direction="column"
      minH={{ base: 'calc(100dvh - 96px)', md: 'calc(100dvh - 112px)' }}
      bg="transparent"
    >
      {/* Two big tappable score panels */}
      <Flex
        flex="1"
        direction={{ base: 'column', md: 'row' }}
        gap={{ base: 2, md: 3 }}
        px={{ base: 1, md: 2 }}
        minH={0}
      >
        {visibleSidePanels.map((panel) => (
          <TeamScorePanel key={panel.side} {...panel} />
        ))}
      </Flex>

      {/* Set history + controls */}
      <Box px={{ base: 2, md: 3 }} py={{ base: 2, md: 2.5 }} flexShrink={0}>
        {/* Serve control (left) · set score pills (center) · tools (right) */}
        <Flex gap={2} mb={2.5} justify="space-between" align="center">
          <Flex flex="1" minW={0} justify="flex-start">
            {showPickleballServe && (
              <PickleballServeControl
                team1={team1}
                team2={team2}
                servingSide={match.servingSide ?? 1}
                serverNumber={match.serverNumber ?? 2}
                disabled={serveBusy || matchState.complete}
                onChange={handlePickleballServe}
              />
            )}
          </Flex>

          <Flex gap={1.5} wrap="wrap" justify="center" flexShrink={0}>
            {displaySets.map((s, i) => (
              <Button
                key={i}
                variant="solid"
                colorPalette="gray"
                bg={i === displaySets.length - 1 ? 'gray.700' : 'gray.500'}
                color="white"
                _hover={{
                  bg: i === displaySets.length - 1 ? 'gray.800' : 'gray.600',
                }}
                _dark={{
                  bg: i === displaySets.length - 1 ? 'gray.600' : 'gray.700',
                }}
                size="sm"
                minW="56px"
                borderRadius="full"
                onClick={() => setEditingSetIndex(i)}
                title={t('editSetTooltip', { number: s.setNumber })}
                aria-label={t('editSetTooltip', { number: s.setNumber })}
              >
                {formatSetScore(s)}
              </Button>
            ))}
          </Flex>

          <Flex flex="1" minW={0} align="center" justify="flex-end" gap={1}>
            {isConnected ? (
              <Wifi size={14} color="green" aria-hidden="true" />
            ) : (
              <WifiOff size={14} color="gray" aria-hidden="true" />
            )}
            <IconButton
              aria-label={t('matchHistory')}
              title={t('matchHistory')}
              size="xs"
              variant="ghost"
              colorPalette="gray"
              onClick={() => setHistoryOpen(true)}
            >
              <History size={16} />
            </IconButton>
            <IconButton
              aria-label={t('randomDraw')}
              title={t('randomDraw')}
              size="xs"
              variant="ghost"
              colorPalette="gray"
              onClick={() => setTossOpen(true)}
            >
              <Dices size={16} />
            </IconButton>
            <IconButton
              aria-label={t('swapScoreboardSides')}
              title={t('swapScoreboardSides')}
              size="xs"
              variant={isSwapped ? 'solid' : 'ghost'}
              colorPalette={isSwapped ? 'green' : 'gray'}
              onClick={() => setIsSwapped((value) => !value)}
            >
              <ArrowLeftRight size={16} />
            </IconButton>
          </Flex>
        </Flex>

        {matchState.complete && (
          <Text
            textAlign="center"
            color="green.500"
            fontWeight="semibold"
            mb={2}
          >
            {t('matchPointReached', { action: t('endMatch') })}
          </Text>
        )}

        <Flex
          gap={{ base: 2, md: 3 }}
          justify="center"
          align="center"
          wrap="wrap"
        >
          <Button
            variant="outline"
            size={{ base: 'sm', md: 'md' }}
            onClick={() => void handleUndo()}
            disabled={busy}
          >
            <Undo2 size={16} /> {t('undo')}
          </Button>
          {onForfeit && (
            <Button
              variant="outline"
              colorPalette="red"
              size={{ base: 'sm', md: 'md' }}
              onClick={onForfeit}
            >
              <Flag size={16} /> {t('forfeit')}
            </Button>
          )}
          <Button
            colorPalette="red"
            variant="solid"
            size={{ base: 'sm', md: 'md' }}
            onClick={() => setEndOpen(true)}
            boxShadow={
              matchState.complete
                ? '0 10px 24px rgba(220, 38, 38, 0.35)'
                : undefined
            }
          >
            {matchState.complete && <Check size={16} />} {t('endMatch')}
          </Button>
        </Flex>
      </Box>

      <EndMatchConfirmModal
        isOpen={endOpen}
        onClose={() => setEndOpen(false)}
        match={match}
        sets={displaySets}
        rules={rules}
        isDoubles={isDoubles}
        onEnded={(m) => {
          setEndOpen(false);
          onMatchUpdate(m);
        }}
      />

      <RandomDrawModal
        isOpen={tossOpen}
        onClose={() => setTossOpen(false)}
        team1={team1}
        team2={team2}
        team1PlayerNames={team1PlayerNames}
        team2PlayerNames={team2PlayerNames}
      />

      <MatchHistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        entries={logEntries}
      />

      <EditSetScoreModal
        isOpen={editingSetIndex !== null}
        onClose={() => setEditingSetIndex(null)}
        match={match}
        set={
          editingSetIndex !== null
            ? (displaySets[editingSetIndex] ?? null)
            : null
        }
        rules={rules}
        isLatestSet={editingSetIndex === displaySets.length - 1}
        onUpdated={(m) => {
          setDisplaySets(setsOf(m, isDoubles));
          onMatchUpdate(m);
          setEditingSetIndex(null);
        }}
      />
    </Flex>
  );
}

function randomInt(max: number): number {
  if (max <= 0) return 0;
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    return values[0] % max;
  }
  return Math.floor(Math.random() * max);
}

function PickleballServeControl({
  team1,
  team2,
  servingSide,
  serverNumber,
  disabled,
  onChange,
}: {
  team1: string;
  team2: string;
  servingSide: 1 | 2;
  serverNumber: 1 | 2;
  disabled: boolean;
  onChange: (servingSide: 1 | 2, serverNumber: 1 | 2) => void;
}) {
  const t = useTranslations('pages.tournaments.scoreEntry');

  return (
    <HStack gap={1.5} flexWrap="wrap" minW={0}>
      <Text
        fontSize="xs"
        fontWeight="semibold"
        color="green.700"
        _dark={{ color: 'green.200' }}
        whiteSpace="nowrap"
      >
        {t('pickleballServer')}
      </Text>

      <HStack gap={1}>
        {([1, 2] as const).map((side) => {
          const label = side === 1 ? team1 : team2;
          return (
            <Button
              key={side}
              size="xs"
              variant={servingSide === side ? 'solid' : 'outline'}
              colorPalette="green"
              disabled={disabled}
              onClick={() => onChange(side, serverNumber)}
              title={t('servingSideTooltip', { team: label })}
              aria-label={t('servingSideTooltip', { team: label })}
            >
              {t('sideLabel', { side })}
            </Button>
          );
        })}
      </HStack>

      <HStack gap={1}>
        {([1, 2] as const).map((number) => (
          <Button
            key={number}
            size="xs"
            variant={serverNumber === number ? 'solid' : 'outline'}
            colorPalette="blue"
            disabled={disabled}
            onClick={() => onChange(servingSide, number)}
            title={t('serverNumberTooltip', { number })}
            aria-label={t('serverNumberTooltip', { number })}
          >
            {number}
          </Button>
        ))}
      </HStack>
    </HStack>
  );
}

function RandomDrawModal({
  isOpen,
  onClose,
  team1,
  team2,
  team1PlayerNames,
  team2PlayerNames,
}: {
  isOpen: boolean;
  onClose: () => void;
  team1: string;
  team2: string;
  team1PlayerNames?: string;
  team2PlayerNames?: string;
}) {
  const t = useTranslations('pages.tournaments.scoreEntry');
  const [result, setResult] = useState<{ team: string } | null>(null);
  const [preview, setPreview] = useState<{ team: string } | null>(null);

  const playerNamesFor = (team: string): string =>
    team === team1 ? (team1PlayerNames ?? '') : (team2PlayerNames ?? '');
  const [isDrawing, setIsDrawing] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const clearDrawTimers = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const pickResult = useCallback(() => {
    const teams = [team1, team2];
    return {
      team: teams[randomInt(teams.length)] ?? team1,
    };
  }, [team1, team2]);

  const runDraw = useCallback(() => {
    clearDrawTimers();
    setIsDrawing(true);
    setResult(null);
    setPreview(pickResult());

    intervalRef.current = window.setInterval(() => {
      setPreview(pickResult());
    }, 90);

    timeoutRef.current = window.setTimeout(() => {
      const finalResult = pickResult();
      clearDrawTimers();
      setPreview(finalResult);
      setResult(finalResult);
      setIsDrawing(false);
    }, 1400);
  }, [clearDrawTimers, pickResult]);

  useEffect(() => {
    if (isOpen) {
      clearDrawTimers();
      setResult(null);
      setPreview(null);
      setIsDrawing(false);
    }
    return clearDrawTimers;
  }, [clearDrawTimers, isOpen]);

  const shownResult = preview ?? result;
  const resultTeam = shownResult?.team ?? '—';
  const resultPlayerNames = shownResult ? playerNamesFor(shownResult.team) : '';

  return (
    <VModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('randomDrawTitle')}
      size="md"
      titleAlign="center"
      hideSecondaryAction
      closeButtonAriaLabel={t('cancel')}
      footer={
        <HStack w="full" justify="space-between" gap={3}>
          <Button variant="outline" colorPalette="gray" onClick={onClose}>
            {t('close')}
          </Button>
          <Button colorPalette="green" onClick={runDraw} disabled={isDrawing}>
            <RefreshCw size={16} />{' '}
            {isDrawing
              ? t('drawing')
              : result
                ? t('drawAgain')
                : t('startDraw')}
          </Button>
        </HStack>
      }
    >
      <VStack align="stretch" gap={4}>
        <Text textAlign="center" color="gray.500" _dark={{ color: 'gray.400' }}>
          {t('randomDrawHint')}
        </Text>

        <Box
          borderWidth="1px"
          borderColor="green.200"
          borderRadius="2xl"
          bg="green.50"
          px={{ base: 4, md: 5 }}
          py={{ base: 5, md: 6 }}
          textAlign="center"
          _dark={{
            bg: 'rgba(22, 163, 74, 0.12)',
            borderColor: 'green.700',
          }}
        >
          <Box
            mx="auto"
            mb={3}
            w="56px"
            h="56px"
            borderRadius="full"
            bg="green.500"
            color="white"
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            animation={isDrawing ? 'drawSpin 0.55s linear infinite' : undefined}
            css={{
              '@keyframes drawSpin': {
                from: { transform: 'rotate(0deg) scale(1)' },
                '50%': { transform: 'rotate(180deg) scale(1.08)' },
                to: { transform: 'rotate(360deg) scale(1)' },
              },
            }}
          >
            <Dices size={28} />
          </Box>
          <Text
            fontSize="sm"
            fontWeight="semibold"
            color="green.700"
            _dark={{ color: 'green.200' }}
          >
            {isDrawing
              ? t('drawing')
              : shownResult
                ? t('randomDrawWinner')
                : t('randomDraw')}
          </Text>
          <Text
            key={resultTeam}
            mt={1}
            fontSize={{ base: '2xl', md: '3xl' }}
            fontWeight="black"
            lineHeight={1.15}
            color={isDrawing ? 'gray.600' : undefined}
            _dark={{ color: isDrawing ? 'gray.200' : undefined }}
            animation={isDrawing ? 'drawPulse 0.18s ease-out' : undefined}
            css={{
              '@keyframes drawPulse': {
                from: { opacity: 0.35, transform: 'translateY(4px)' },
                to: { opacity: 1, transform: 'translateY(0)' },
              },
            }}
          >
            {shownResult ? resultTeam : '—'}
          </Text>
          {resultPlayerNames && (
            <Text
              mt={1}
              fontSize="sm"
              fontWeight="medium"
              color="green.700"
              _dark={{ color: 'green.200' }}
            >
              {resultPlayerNames}
            </Text>
          )}
        </Box>

        <Flex gap={2} align="stretch" justify="center" flexWrap="wrap">
          {[team1, team2].map((team) => {
            const selected = shownResult?.team === team;
            const names = playerNamesFor(team);
            return (
              <VStack
                key={team}
                gap={0.5}
                px={3}
                py={2}
                borderWidth="1px"
                borderRadius="xl"
                flex="1"
                minW="40%"
                borderColor={selected ? 'green.400' : 'gray.200'}
                bg={selected ? 'green.50' : 'transparent'}
                _dark={{
                  borderColor: selected ? 'green.600' : 'gray.700',
                  bg: selected ? 'rgba(22, 163, 74, 0.12)' : 'transparent',
                }}
              >
                <Text
                  fontWeight="semibold"
                  fontSize="sm"
                  color={selected ? 'green.700' : undefined}
                  _dark={{ color: selected ? 'green.200' : undefined }}
                  textAlign="center"
                >
                  {team}
                </Text>
                {names && (
                  <Text
                    fontSize="xs"
                    color="gray.500"
                    _dark={{ color: 'gray.400' }}
                    textAlign="center"
                  >
                    {names}
                  </Text>
                )}
              </VStack>
            );
          })}
        </Flex>
      </VStack>
    </VModal>
  );
}

function MatchHistoryModal({
  isOpen,
  onClose,
  entries,
}: {
  isOpen: boolean;
  onClose: () => void;
  entries: MatchLogEntry[];
}) {
  const t = useTranslations('pages.tournaments.scoreEntry');

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    const hours = `${date.getHours()}`.padStart(2, '0');
    const minutes = `${date.getMinutes()}`.padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Newest first — the referee usually wants to confirm the most recent action.
  const ordered = entries.slice().reverse();

  const describe = (entry: MatchLogEntry): string => {
    if (entry.kind === 'serve') return t('logServeChanged');
    if (entry.kind === 'undo') return t('logUndo');
    const sign = entry.delta === -1 ? '−1' : '+1';
    return `${entry.team ?? ''} ${sign}`.trim();
  };

  return (
    <VModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('matchHistory')}
      size="md"
      titleAlign="center"
      hideSecondaryAction
      maxBodyHeight={{ base: '70vh', md: '72vh' }}
      closeButtonAriaLabel={t('close')}
    >
      {ordered.length === 0 ? (
        <Text
          textAlign="center"
          color="gray.500"
          _dark={{ color: 'gray.400' }}
          py={6}
        >
          {t('matchHistoryEmpty')}
        </Text>
      ) : (
        <VStack align="stretch" gap={0}>
          {ordered.map((entry) => {
            const isServe = entry.kind === 'serve';
            const isUndo = entry.kind === 'undo';
            const isMinus = entry.kind === 'point' && entry.delta === -1;
            return (
              <Flex
                key={entry.id}
                align="center"
                justify="space-between"
                gap={3}
                py={2.5}
                borderBottomWidth="1px"
                borderColor="gray.100"
                _dark={{ borderColor: 'gray.700' }}
              >
                <Text
                  fontSize="sm"
                  fontWeight="medium"
                  color="gray.500"
                  _dark={{ color: 'gray.400' }}
                  minW="44px"
                >
                  {formatTime(entry.ts)}
                </Text>
                <Text
                  flex="1"
                  fontSize="sm"
                  fontWeight={isServe || isUndo ? 'medium' : 'semibold'}
                  textAlign="right"
                  color={
                    isServe
                      ? 'blue.500'
                      : isUndo || isMinus
                        ? 'gray.500'
                        : undefined
                  }
                  _dark={{
                    color: isServe
                      ? 'blue.300'
                      : isUndo || isMinus
                        ? 'gray.400'
                        : undefined,
                  }}
                >
                  {describe(entry)}
                </Text>
              </Flex>
            );
          })}
        </VStack>
      )}
    </VModal>
  );
}

interface TeamScorePanelProps {
  side: 1 | 2;
  teamName: string;
  playerNames: string;
  score: number;
  setWins: number;
  colorScheme: 'blue' | 'orange';
  disabled: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
  incLabel: string;
  decLabel: string;
  compact?: boolean;
  // Pickleball doubles: number of server dots to show on this side (the side
  // currently serving), or null when this side is not serving.
  serverDots?: 1 | 2 | null;
}

function TeamScorePanel({
  teamName,
  playerNames,
  score,
  setWins,
  colorScheme,
  disabled,
  onIncrement,
  onDecrement,
  incLabel,
  decLabel,
  compact = false,
  serverDots,
}: TeamScorePanelProps) {
  const bg = colorScheme === 'blue' ? 'blue.500' : 'orange.500';
  const bgHover = colorScheme === 'blue' ? 'blue.600' : 'orange.600';
  // Tap feedback: a brief white flash (keyed remount restarts the animation),
  // a short haptic pulse, and a synthesized "tick" on each point.
  const [flashKey, setFlashKey] = useState(0);

  const handleIncrement = useCallback(() => {
    setFlashKey((value) => value + 1);
    vibrate(18);
    playTick();
    onIncrement();
  }, [onIncrement]);

  const handleDecrement = useCallback(() => {
    vibrate(10);
    onDecrement();
  }, [onDecrement]);

  return (
    <Flex
      direction="column"
      flex="1"
      borderRadius={{ base: 'xl', md: '2xl' }}
      overflow="hidden"
      position="relative"
      minH={0}
    >
      <Box
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        flex="1"
        position="relative"
        bg={bg}
        color="white"
        cursor={disabled ? 'not-allowed' : 'pointer'}
        opacity={disabled ? 0.6 : 1}
        _hover={disabled ? undefined : { bg: bgHover }}
        _active={disabled ? undefined : { bg: bgHover }}
        _focusVisible={{
          outline: '3px solid',
          outlineColor: 'whiteAlpha.900',
          outlineOffset: '-6px',
          boxShadow: '0 0 0 4px rgba(22, 163, 74, 0.55)',
        }}
        touchAction="manipulation"
        userSelect="none"
        onClick={disabled ? undefined : handleIncrement}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleIncrement();
          }
        }}
        aria-label={incLabel}
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        py={compact ? 4 : { base: 4, md: 5 }}
        minH={
          compact
            ? { base: '56dvh', md: '50vh' }
            : { base: '30dvh', md: '52dvh' }
        }
      >
        {flashKey > 0 && (
          <Box
            key={flashKey}
            position="absolute"
            inset={0}
            bg="white"
            opacity={0}
            pointerEvents="none"
            aria-hidden="true"
            animation="scoreFlash 0.28s ease-out forwards"
            css={{
              '@keyframes scoreFlash': {
                from: { opacity: 0.45 },
                to: { opacity: 0 },
              },
            }}
          />
        )}
        <Text
          fontSize="md"
          fontWeight="semibold"
          maxW="90%"
          truncate
          opacity={0.9}
        >
          {teamName}
        </Text>
        {playerNames && (
          <Text
            fontSize={compact ? 'xs' : 'sm'}
            fontWeight="medium"
            maxW="86%"
            textAlign="center"
            lineHeight={1.25}
            opacity={0.88}
            mt={1}
            whiteSpace="normal"
            overflow="hidden"
            css={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {playerNames}
          </Text>
        )}
        <Flex
          direction="column"
          align="center"
          justify="center"
          gap={{ base: 1, md: 2 }}
        >
          <Text
            fontSize={
              compact ? { base: '6xl', md: '9xl' } : { base: '7xl', md: '9xl' }
            }
            fontWeight="black"
            lineHeight={1}
          >
            {score}
          </Text>
          {serverDots != null && <ServerDots count={serverDots} />}
        </Flex>
        <Text fontSize="sm" opacity={0.85}>
          {setWins} ✪
        </Text>
      </Box>
      <IconButton
        aria-label={decLabel}
        onClick={handleDecrement}
        disabled={disabled}
        variant="ghost"
        position="absolute"
        bottom={2}
        right={2}
        color="white"
        minW="44px"
        minH="44px"
        touchAction="manipulation"
        _focusVisible={{
          outline: '3px solid',
          outlineColor: 'whiteAlpha.900',
          outlineOffset: '2px',
        }}
      >
        <Minus size={18} />
      </IconButton>
    </Flex>
  );
}

// Pickleball doubles serving indicator: 1 or 2 white dots, matching the public
// scoreboard (LiveMatchCard) so the referee board reads the same way.
function ServerDots({ count }: { count: 1 | 2 }) {
  return (
    <Flex gap={2} align="center" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <Box
          key={index}
          w={{ base: 3, md: 4 }}
          h={{ base: 3, md: 4 }}
          borderRadius="full"
          bg="white"
          boxShadow="0 0 10px rgba(255, 255, 255, 0.55)"
        />
      ))}
    </Flex>
  );
}
