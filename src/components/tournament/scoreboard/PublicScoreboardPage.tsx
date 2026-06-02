'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  useParams,
  useRouter,
  usePathname,
  useSearchParams,
} from 'next/navigation';
import { Box, Flex, Spinner, Text } from '@chakra-ui/react';

import { TournamentService } from '@/lib/api/tournament.service';
import { ScoreboardMatch, Tournament, TournamentCourt } from '@/lib/api/types';
import {
  useTournamentSocket,
  TournamentMatchEvent,
} from '@/hooks/useTournamentSocket';
import ScoreboardControls from './ScoreboardControls';
import ScoreboardGrid from './ScoreboardGrid';
import ScoreboardEmptyState from './ScoreboardEmptyState';
import ShareScoreboardModal from './ShareScoreboardModal';

type GridSize = 1 | 2 | 4 | 6;

function parseGrid(value: string | null): GridSize {
  const n = Number(value);
  return n === 1 || n === 2 || n === 4 || n === 6 ? n : 4;
}

export default function PublicScoreboardPage() {
  const params = useParams();
  const tournamentParam = String(params?.id ?? '');

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const gridSize = parseGrid(searchParams.get('grid'));
  const selectedCourtIds = useMemo(
    () =>
      (searchParams.get('courts') ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    [searchParams]
  );

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [courts, setCourts] = useState<TournamentCourt[]>([]);
  const [matchesMap, setMatchesMap] = useState<Record<string, ScoreboardMatch>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const seedFromServer = useCallback((matches: ScoreboardMatch[]) => {
    const map: Record<string, ScoreboardMatch> = {};
    for (const m of matches) map[m.matchId] = m;
    setMatchesMap(map);
  }, []);

  const loadScoreboard = useCallback(async (tournamentId: string) => {
    const data = await TournamentService.getScoreboard(tournamentId, {
      includeFinished: true,
    });
    return data.matches;
  }, []);

  // Initial load: resolve tournament (id/slug) + courts + scoreboard snapshot.
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const tour = await TournamentService.getTournament(tournamentParam);
        if (!active) return;
        setTournament(tour);
        setCourts(tour.courts ?? []);
        const matches = await loadScoreboard(tour.id);
        if (!active) return;
        seedFromServer(matches);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [tournamentParam, loadScoreboard, seedFromServer]);

  // Merge a single match from a socket event.
  const mergeMatch = useCallback((e: TournamentMatchEvent) => {
    setMatchesMap((prev) => ({ ...prev, [e.match.matchId]: e.match }));
  }, []);

  const { isConnected } = useTournamentSocket(tournament?.id, {
    onScoreUpdated: mergeMatch,
    onMatchStarted: mergeMatch,
    onMatchEnded: mergeMatch,
    onReconnect: () => {
      if (tournament?.id) {
        void loadScoreboard(tournament.id).then(seedFromServer);
      }
    },
  });

  // Fullscreen handling.
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      void containerRef.current?.requestFullscreen?.();
    } else {
      void document.exitFullscreen?.();
    }
  }, []);

  // URL param helpers (bookmarkable display config).
  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const toggleCourt = useCallback(
    (id: string) => {
      const set = new Set(selectedCourtIds);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      setParam('courts', Array.from(set).join(','));
    },
    [selectedCourtIds, setParam]
  );

  // Derived display list.
  const display = useMemo(() => {
    let list = Object.values(matchesMap).filter(
      (m) => m.status === 'IN_PROGRESS' || m.status === 'FINISHED'
    );
    if (selectedCourtIds.length > 0) {
      list = list.filter(
        (m) => m.court && selectedCourtIds.includes(m.court.id)
      );
    }
    list.sort((a, b) => {
      if (a.status !== b.status) return a.status === 'IN_PROGRESS' ? -1 : 1;
      return (a.court?.courtNumber ?? 99) - (b.court?.courtNumber ?? 99);
    });
    return list;
  }, [matchesMap, selectedCourtIds]);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <Box ref={containerRef} minH="100dvh" bg="gray.950" color="white">
      <ScoreboardControls
        courts={courts}
        selectedCourtIds={selectedCourtIds}
        gridSize={gridSize}
        isFullscreen={isFullscreen}
        isConnected={isConnected}
        onToggleCourt={toggleCourt}
        onClearCourts={() => setParam('courts', null)}
        onGridSize={(n) => setParam('grid', String(n))}
        onToggleFullscreen={toggleFullscreen}
        onShare={() => setShareOpen(true)}
      />

      {tournament && (
        <Flex px={4} py={2} align="center" justify="center">
          <Text fontWeight="bold" color="gray.300">
            {tournament.name}
          </Text>
        </Flex>
      )}

      {loading ? (
        <Flex justify="center" align="center" minH="60dvh">
          <Spinner />
        </Flex>
      ) : display.length === 0 ? (
        <ScoreboardEmptyState />
      ) : (
        <ScoreboardGrid matches={display} gridSize={gridSize} />
      )}

      <ShareScoreboardModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        url={shareUrl}
      />
    </Box>
  );
}
