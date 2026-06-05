'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Flex, Text, Badge, HStack, VStack } from '@chakra-ui/react';
import { Button, IconButton } from '@/components/ui/chakra-compat';
import { VModal } from '@/components/ui/VModal';
import { useTranslations } from 'next-intl';
import {
  ArrowLeftRight,
  Check,
  Dices,
  Flag,
  Minus,
  RefreshCw,
  Undo2,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';

import { CategoryService } from '@/lib/api/category.service';
import { CategoryMatch, CategoryRegistration, MatchSet } from '@/lib/api/types';
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

const PLAYER_NAMES_VISIBILITY_KEY = 'vmito.referee.showPlayerNames';
const SCOREBOARD_SWAP_KEY_PREFIX = 'vmito.referee.scoreboard.swap.';

function getScoreboardSwapKey(matchId: string): string {
  return `${SCOREBOARD_SWAP_KEY_PREFIX}${matchId}`;
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
  onMatchUpdate,
  onForfeit,
}: Props) {
  const t = useTranslations('pages.tournaments.scoreEntry');

  const isDoubles =
    match.participants?.some((p) => p.categoryRegistration?.pair) ?? false;
  const rules = defaultRules(match);

  const clientIdRef = useRef<string>(genClientId());
  const boardRef = useRef<HTMLDivElement>(null);
  const seqRef = useRef(0);
  const queueRef = useRef<{ side: 1 | 2; delta: 1 | -1; seq: number }[]>([]);
  const processingRef = useRef(false);

  const [displaySets, setDisplaySets] = useState<MatchSet[]>(() =>
    setsOf(match, isDoubles)
  );
  const [busy, setBusy] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [tossOpen, setTossOpen] = useState(false);
  const [editingSetIndex, setEditingSetIndex] = useState<number | null>(null);
  const [showPlayerNames, setShowPlayerNames] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(PLAYER_NAMES_VISIBILITY_KEY) === '1';
  });
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
      void processQueue();
    },
    [rules, isDoubles, processQueue]
  );

  const sidePanels: TeamScorePanelProps[] = [
    {
      side: 1,
      teamName: team1,
      playerNames: showPlayerNames ? team1PlayerNames : '',
      score: current?.player1Score ?? 0,
      setWins: wins.side1,
      colorScheme: 'blue',
      disabled: matchState.complete,
      onIncrement: () => handleScore(1, 1),
      onDecrement: () => handleScore(1, -1),
      incLabel: t('addPointFor', { team: team1 }),
      decLabel: t('removePointFor', { team: team1 }),
    },
    {
      side: 2,
      teamName: team2,
      playerNames: showPlayerNames ? team2PlayerNames : '',
      score: current?.player2Score ?? 0,
      setWins: wins.side2,
      colorScheme: 'orange',
      disabled: matchState.complete,
      onIncrement: () => handleScore(2, 1),
      onDecrement: () => handleScore(2, -1),
      incLabel: t('addPointFor', { team: team2 }),
      decLabel: t('removePointFor', { team: team2 }),
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
    } catch {
      await refetch();
    }
  }, [match.id, isDoubles, onMatchUpdate, refetch]);

  // External updates (e.g. host correction). Ignore our own broadcast echoes.
  const { isConnected } = useTournamentSocket(tournamentId, {
    onScoreUpdated: (e) => {
      if (e.match.matchId !== match.id) return;
      if (e.clientId === clientIdRef.current) return;
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
    queueRef.current = [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.id]);

  useEffect(() => {
    window.localStorage.setItem(
      PLAYER_NAMES_VISIBILITY_KEY,
      showPlayerNames ? '1' : '0'
    );
  }, [showPlayerNames]);

  useEffect(() => {
    window.localStorage.setItem(
      getScoreboardSwapKey(match.id),
      isSwapped ? '1' : '0'
    );
  }, [isSwapped, match.id]);

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
      {/* Header: format + connection */}
      <Flex
        align="center"
        justify="space-between"
        gap={2}
        px={{ base: 2, md: 3 }}
        py={{ base: 1.5, md: 2 }}
        flexShrink={0}
        flexWrap="wrap"
      >
        <Flex align="center" gap={2} flexWrap="wrap">
          <Badge colorPalette="purple">
            {rules.bestOf === 5
              ? t('bestOf5')
              : rules.bestOf === 3
                ? t('bestOf3')
                : t('bestOf1')}
          </Badge>
          <Badge colorPalette="blue" variant="subtle">
            {t('ruleSummary', {
              points: rules.pointsToWin,
              cap: rules.cap > rules.pointsToWin ? ` / ${rules.cap}` : '',
            })}
          </Badge>
        </Flex>
        <Flex
          align="center"
          gap={2}
          fontSize="sm"
          color="gray.500"
          _dark={{ color: 'gray.400' }}
        >
          {isConnected ? (
            <Wifi size={14} color="green" aria-hidden="true" />
          ) : (
            <WifiOff size={14} color="gray" aria-hidden="true" />
          )}
          <Text>
            {t('currentSet')} {current?.setNumber ?? 1}
          </Text>
          <IconButton
            aria-label={t('randomDraw')}
            title={t('randomDraw')}
            size="sm"
            variant="ghost"
            colorPalette="gray"
            onClick={() => setTossOpen(true)}
          >
            <Dices size={16} />
          </IconButton>
          <IconButton
            aria-label={t('swapScoreboardSides')}
            title={t('swapScoreboardSides')}
            size="sm"
            variant={isSwapped ? 'solid' : 'ghost'}
            colorPalette={isSwapped ? 'green' : 'gray'}
            onClick={() => setIsSwapped((value) => !value)}
          >
            <ArrowLeftRight size={16} />
          </IconButton>
          <IconButton
            aria-label={
              showPlayerNames ? t('hidePlayerNames') : t('showPlayerNames')
            }
            title={
              showPlayerNames ? t('hidePlayerNames') : t('showPlayerNames')
            }
            size="sm"
            variant={showPlayerNames ? 'solid' : 'ghost'}
            colorPalette={showPlayerNames ? 'green' : 'gray'}
            onClick={() => setShowPlayerNames((value) => !value)}
          >
            <Users size={16} />
          </IconButton>
        </Flex>
      </Flex>

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
        <Flex gap={2} mb={2.5} wrap="wrap" justify="center">
          {displaySets.map((s, i) => (
            <Button
              key={i}
              variant={i === displaySets.length - 1 ? 'solid' : 'subtle'}
              colorPalette="gray"
              size="xs"
              minW="52px"
              borderRadius="full"
              onClick={() => setEditingSetIndex(i)}
              title={t('editSetTooltip', { number: s.setNumber })}
              aria-label={t('editSetTooltip', { number: s.setNumber })}
            >
              {formatSetScore(s)}
            </Button>
          ))}
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
            colorPalette="green"
            variant="solid"
            size={{ base: 'sm', md: 'md' }}
            onClick={() => setEndOpen(true)}
            boxShadow={
              matchState.complete
                ? '0 10px 24px rgba(22, 163, 74, 0.35)'
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

function RandomDrawModal({
  isOpen,
  onClose,
  team1,
  team2,
}: {
  isOpen: boolean;
  onClose: () => void;
  team1: string;
  team2: string;
}) {
  const t = useTranslations('pages.tournaments.scoreEntry');
  const [result, setResult] = useState<{
    team: string;
    choice: 'serve' | 'side';
  } | null>(null);

  const runDraw = useCallback(() => {
    const teams = [team1, team2];
    setResult({
      team: teams[randomInt(teams.length)] ?? team1,
      choice: randomInt(2) === 0 ? 'serve' : 'side',
    });
  }, [team1, team2]);

  useEffect(() => {
    if (isOpen) runDraw();
  }, [isOpen, runDraw]);

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
          <Button colorPalette="green" onClick={runDraw}>
            <RefreshCw size={16} /> {t('drawAgain')}
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
          >
            <Dices size={28} />
          </Box>
          <Text
            fontSize="sm"
            fontWeight="semibold"
            color="green.700"
            _dark={{ color: 'green.200' }}
          >
            {t('randomDrawWinner')}
          </Text>
          <Text
            mt={1}
            fontSize={{ base: '2xl', md: '3xl' }}
            fontWeight="black"
            lineHeight={1.15}
          >
            {result?.team ?? '—'}
          </Text>
          <Badge mt={3} colorPalette="green" borderRadius="full" px={3} py={1}>
            {result?.choice === 'serve'
              ? t('randomDrawServe')
              : t('randomDrawSide')}
          </Badge>
        </Box>

        <Flex gap={2} align="center" justify="center" flexWrap="wrap">
          {[team1, team2].map((team) => (
            <Badge
              key={team}
              variant={result?.team === team ? 'solid' : 'subtle'}
              colorPalette={result?.team === team ? 'green' : 'gray'}
              borderRadius="full"
              px={3}
              py={1}
              maxW="full"
            >
              <Text as="span" truncate>
                {team}
              </Text>
            </Badge>
          ))}
        </Flex>
      </VStack>
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
}: TeamScorePanelProps) {
  const bg = colorScheme === 'blue' ? 'blue.500' : 'orange.500';
  const bgHover = colorScheme === 'blue' ? 'blue.600' : 'orange.600';
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
        onClick={disabled ? undefined : onIncrement}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onIncrement();
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
        <Text
          fontSize={
            compact ? { base: '6xl', md: '9xl' } : { base: '7xl', md: '9xl' }
          }
          fontWeight="black"
          lineHeight={1}
        >
          {score}
        </Text>
        <Text fontSize="sm" opacity={0.85}>
          {setWins} ✪
        </Text>
      </Box>
      <IconButton
        aria-label={decLabel}
        onClick={onDecrement}
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
