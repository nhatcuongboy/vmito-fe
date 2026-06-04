'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Flex, Text, Badge } from '@chakra-ui/react';
import { Button, IconButton } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import { Flag, Minus, Undo2, Users, Wifi, WifiOff } from 'lucide-react';

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
  const [editingSetIndex, setEditingSetIndex] = useState<number | null>(null);
  const [showPlayerNames, setShowPlayerNames] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(PLAYER_NAMES_VISIBILITY_KEY) === '1';
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
    setDisplaySets(setsOf(fresh, isDoubles));
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
    if (lastResp && queueRef.current.length === 0) {
      setDisplaySets(setsOf(lastResp, isDoubles));
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

  const handleUndo = useCallback(async () => {
    if (processingRef.current) return;
    try {
      const resp = await CategoryService.undoLastPoint(match.id);
      setDisplaySets(setsOf(resp, isDoubles));
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
      setDisplaySets(e.match.sets.length > 0 ? e.match.sets : displaySets);
    },
    onMatchEnded: (e) => {
      if (e.match.matchId === match.id) void refetch();
    },
    onReconnect: () => void refetch(),
  });

  // Keep local state in sync if the parent swaps in a different match.
  useEffect(() => {
    setDisplaySets(setsOf(match, isDoubles));
    queueRef.current = [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.id]);

  useEffect(() => {
    window.localStorage.setItem(
      PLAYER_NAMES_VISIBILITY_KEY,
      showPlayerNames ? '1' : '0'
    );
  }, [showPlayerNames]);

  return (
    <Flex
      ref={boardRef}
      direction="column"
      minH={{ base: '70dvh', md: '68dvh' }}
      bg="gray.50"
      _dark={{ bg: 'gray.900' }}
    >
      {/* Header: format + connection */}
      <Flex
        align="center"
        justify="space-between"
        gap={2}
        px={4}
        py={2}
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
            <Wifi size={14} color="green" />
          ) : (
            <WifiOff size={14} color="gray" />
          )}
          <Text>
            {t('currentSet')} {current?.setNumber ?? 1}
          </Text>
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
      <Flex flex="1" direction={{ base: 'column', md: 'row' }} gap={2} px={2}>
        <TeamScorePanel
          teamName={team1}
          playerNames={showPlayerNames ? team1PlayerNames : ''}
          score={current?.player1Score ?? 0}
          setWins={wins.side1}
          colorScheme="blue"
          disabled={matchState.complete}
          onIncrement={() => handleScore(1, 1)}
          onDecrement={() => handleScore(1, -1)}
          incLabel={t('addPointFor', { team: team1 })}
          decLabel={t('removePointFor', { team: team1 })}
        />
        <TeamScorePanel
          teamName={team2}
          playerNames={showPlayerNames ? team2PlayerNames : ''}
          score={current?.player2Score ?? 0}
          setWins={wins.side2}
          colorScheme="orange"
          disabled={matchState.complete}
          onIncrement={() => handleScore(2, 1)}
          onDecrement={() => handleScore(2, -1)}
          incLabel={t('addPointFor', { team: team2 })}
          decLabel={t('removePointFor', { team: team2 })}
        />
      </Flex>

      {/* Set history + controls */}
      <Box px={4} py={3} flexShrink={0}>
        <Flex gap={2} mb={3} wrap="wrap" justify="center">
          {displaySets.map((s, i) => (
            <Badge
              key={i}
              variant={i === displaySets.length - 1 ? 'solid' : 'subtle'}
              colorPalette="gray"
              fontSize="sm"
              cursor="pointer"
              _hover={{ opacity: 0.85 }}
              onClick={() => setEditingSetIndex(i)}
              title={t('editSetTooltip', { number: s.setNumber })}
            >
              {s.player1Score}-{s.player2Score}
            </Badge>
          ))}
        </Flex>

        {matchState.complete && (
          <Text
            textAlign="center"
            color="green.500"
            fontWeight="semibold"
            mb={2}
          >
            {t('matchPointReached')}
          </Text>
        )}

        <Flex gap={3} justify="center" align="center" wrap="wrap">
          <Button
            variant="outline"
            onClick={() => void handleUndo()}
            disabled={busy}
          >
            <Undo2 size={16} /> {t('undo')}
          </Button>
          {onForfeit && (
            <Button variant="outline" colorPalette="red" onClick={onForfeit}>
              <Flag size={16} /> {t('forfeit')}
            </Button>
          )}
          <Button colorPalette="green" onClick={() => setEndOpen(true)}>
            {t('endMatch')}
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

interface TeamScorePanelProps {
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
      borderRadius="2xl"
      overflow="hidden"
      position="relative"
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
        py={compact ? 4 : 6}
        minH={
          compact
            ? { base: '56dvh', md: '50vh' }
            : { base: '28dvh', md: '42vh' }
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
      >
        <Minus size={18} />
      </IconButton>
    </Flex>
  );
}
