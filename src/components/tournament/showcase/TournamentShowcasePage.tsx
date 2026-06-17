'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation';
import {
  Badge,
  Box,
  Flex,
  Grid,
  Heading,
  Image,
  Spinner,
  Text,
} from '@chakra-ui/react';
import {
  EyeOff,
  Maximize,
  Minimize,
  Pause,
  Play,
  Shuffle,
  Share2,
  Swords,
  Trophy,
  UserRound,
  Users,
  UsersRound,
  Crown,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/chakra-compat';
import { toaster } from '@/components/ui/toaster';
import { CategoryService } from '@/lib/api/category.service';
import { TournamentPlayerService } from '@/lib/api/tournament-player.service';
import { TournamentService } from '@/lib/api/tournament.service';
import {
  Category,
  CategoryMatch,
  CategoryRegistration,
  CategoryStandingsResponse,
  MatchStatus,
  Tournament,
  TournamentPlayer,
} from '@/lib/api/types';
import {
  getMatchDisplayCode,
  getTournamentPlayerDisplayCode,
} from '@/lib/tournament/codes';
import { computePodium, type PodiumEntry } from '@/lib/tournament/podium';
import { getRoundDisplayLabel } from '@/lib/tournament/roundLabel';
import { getTeamLabel } from '@/lib/tournament/teamLabel';

type ShowcaseMode = 'random' | 'single' | 'pairs' | 'matches';
type ShowcaseOrder = 'random' | 'schedule';
type SlideDuration = 4 | 6 | 10;

type PlayerSlide = {
  type: 'player';
  id: string;
  player: TournamentPlayer;
  code: string;
  categories: string[];
};

type MatchSide = {
  label: string;
  players: TournamentPlayer[];
};

type PairSlide = {
  type: 'pair';
  id: string;
  registration: CategoryRegistration;
  label: string;
  categoryName: string;
  players: TournamentPlayer[];
};

type ChampionSlide = {
  type: 'champion';
  id: string;
  categoryName: string;
  entry: PodiumEntry;
};

type MatchSlide = {
  type: 'match';
  id: string;
  match: CategoryMatch;
  matchCode: string;
  categoryName: string;
  roundLabel: string;
  sides: [MatchSide, MatchSide];
};

type ShowcaseSlide = PlayerSlide | PairSlide | ChampionSlide | MatchSlide;

const DURATION_OPTIONS: SlideDuration[] = [4, 6, 10];
const MotionBox = motion.create(Box);

function parseMode(value: string | null): ShowcaseMode {
  if (value === 'single') return 'single';
  if (value === 'pairs') return 'pairs';
  return value === 'matches' ? 'matches' : 'random';
}

function parseOrder(value: string | null, mode: ShowcaseMode): ShowcaseOrder {
  if (value === 'schedule') return 'schedule';
  if (value === 'random') return 'random';
  return mode === 'matches' ? 'schedule' : 'random';
}

function parseDuration(value: string | null): SlideDuration {
  const duration = Number(value);
  return duration === 4 || duration === 10 ? duration : 6;
}

function shuffleWithSeed<T>(items: T[], seed: string): T[] {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  const nextRandom = () => {
    hash += 0x6d2b79f5;
    let value = hash;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };

  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(nextRandom() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function getPlayerInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'VDV';
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
}

function getRegistrationPlayers(
  registration?: CategoryRegistration
): TournamentPlayer[] {
  if (!registration) return [];
  if (registration.pair?.members?.length) {
    return registration.pair.members
      .map((member) => member.player)
      .filter((player): player is TournamentPlayer => Boolean(player));
  }
  return registration.player ? [registration.player] : [];
}

function getRegistrationLabel(registration: CategoryRegistration) {
  return (
    registration.player?.name ||
    registration.pair?.name ||
    registration.pair?.members
      ?.map((member) => member.player?.name)
      .filter(Boolean)
      .join(' & ') ||
    registration.id
  );
}

function getSide(match: CategoryMatch, position: number): MatchSide {
  const participant = match.participants?.find(
    (item) => item.position === position
  );
  return {
    label: getTeamLabel(match, position),
    players: getRegistrationPlayers(participant?.categoryRegistration),
  };
}

function getCategoryName(
  category: Category | undefined,
  tCategory: ReturnType<typeof useTranslations>
) {
  if (!category) return '';
  return category.name?.trim() || tCategory(category.type);
}

function getMatchTimeValue(match: CategoryMatch): number {
  if (!match.startTime) return Number.POSITIVE_INFINITY;
  const time = new Date(match.startTime).getTime();
  return Number.isFinite(time) ? time : Number.POSITIVE_INFINITY;
}

function sortMatchesBySchedule(matches: CategoryMatch[]): CategoryMatch[] {
  return [...matches].sort((a, b) => {
    if (a.status !== b.status) {
      if (a.status === MatchStatus.IN_PROGRESS) return -1;
      if (b.status === MatchStatus.IN_PROGRESS) return 1;
    }

    const timeDiff = getMatchTimeValue(a) - getMatchTimeValue(b);
    if (timeDiff !== 0) return timeDiff;
    return (a.matchNumber ?? 0) - (b.matchNumber ?? 0);
  });
}

function formatMatchDateTime(value?: Date) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(date);
}

export default function TournamentShowcasePage() {
  const params = useParams();
  const tournamentParam = String(params?.id ?? '');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('pages.tournaments.showcase');
  const tCategory = useTranslations('pages.tournaments.categoryTypeLabels');
  const tRounds = useTranslations('pages.tournaments.scoreboard.rounds');

  const mode = parseMode(searchParams.get('mode'));
  const duration = parseDuration(searchParams.get('duration'));
  const order = parseOrder(searchParams.get('order'), mode);
  const controlsHidden = searchParams.get('controls') === 'hidden';

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [matches, setMatches] = useState<CategoryMatch[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [standingsByCategory, setStandingsByCategory] = useState<
    Map<string, CategoryStandingsResponse>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        setLoading(true);
        setLoadError(false);
        const tour = await TournamentService.getTournament(tournamentParam);
        const [playerData, matchData, categoryData] = await Promise.all([
          TournamentPlayerService.getPlayers(tour.id),
          TournamentService.getAllMatches(tour.id),
          CategoryService.getCategories(tour.id),
        ]);
        const standingsList = await Promise.all(
          categoryData.map(async (category) => ({
            categoryId: category.id,
            standings: await CategoryService.getAllStandings(category.id),
          }))
        );

        if (!active) return;
        setTournament(tour);
        setPlayers(playerData);
        setMatches(matchData);
        setCategories(categoryData);
        setStandingsByCategory(
          new Map(
            standingsList.map((item) => [item.categoryId, item.standings])
          )
        );
      } catch (error) {
        console.error('Error loading tournament showcase:', error);
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [tournamentParam]);

  useEffect(() => {
    const onFullscreenChange = () =>
      setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(searchParams.toString());
      if (!value) next.delete(key);
      else next.set(key, value);
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
      setActiveIndex(0);
    },
    [pathname, router, searchParams]
  );

  const categoryById = useMemo(() => {
    const map = new Map<string, Category>();
    for (const category of categories) map.set(category.id, category);
    return map;
  }, [categories]);

  const playerCategoryMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    const add = (playerId: string, categoryId: string) => {
      const category = categoryById.get(categoryId);
      if (!category) return;
      const label = category.name?.trim() || tCategory(category.type);
      const labels = map.get(playerId) ?? new Set<string>();
      labels.add(label);
      map.set(playerId, labels);
    };

    for (const match of matches) {
      for (const participant of match.participants ?? []) {
        for (const player of getRegistrationPlayers(
          participant.categoryRegistration
        )) {
          add(player.id, match.categoryId);
        }
      }
    }

    return map;
  }, [categoryById, matches, tCategory]);

  const championSlides = useMemo<ChampionSlide[]>(
    () =>
      categories
        .map((category) =>
          computePodium(
            category,
            matches,
            standingsByCategory.get(category.id) ?? []
          )
        )
        .filter((podium) => podium.state === 'decided' && podium.entries[0])
        .map((podium) => ({
          type: 'champion',
          id: `champion-${podium.category.id}`,
          categoryName: getCategoryName(podium.category, tCategory),
          entry: podium.entries[0],
        })),
    [categories, matches, standingsByCategory, tCategory]
  );

  const slides = useMemo<ShowcaseSlide[]>(() => {
    if (mode === 'matches') {
      const matchSlides = matches
        .filter((match) => match.status !== MatchStatus.CANCELLED)
        .map<MatchSlide>((match) => {
          const category = categoryById.get(match.categoryId);
          return {
            type: 'match',
            id: match.id,
            match,
            matchCode: getMatchDisplayCode(match),
            categoryName: getCategoryName(category, tCategory),
            roundLabel: getRoundDisplayLabel(match.round, tRounds),
            sides: [getSide(match, 1), getSide(match, 2)],
          };
        });

      const ordered =
        order === 'random'
          ? shuffleWithSeed(
              matchSlides,
              `${tournament?.id ?? tournamentParam}:matches`
            )
          : sortMatchesBySchedule(matchSlides.map((slide) => slide.match)).map(
              (match) =>
                matchSlides.find((slide) => slide.match.id === match.id)
            );

      return [
        ...championSlides,
        ...ordered.filter((slide): slide is MatchSlide => Boolean(slide)),
      ];
    }

    if (mode === 'pairs') {
      const pairByRegistrationId = new Map<string, PairSlide>();
      const orderedMatches =
        order === 'schedule'
          ? sortMatchesBySchedule(
              matches.filter((match) => match.status !== MatchStatus.CANCELLED)
            )
          : matches.filter((match) => match.status !== MatchStatus.CANCELLED);

      for (const match of orderedMatches) {
        const category = categoryById.get(match.categoryId);
        const categoryName = getCategoryName(category, tCategory);

        for (const participant of match.participants ?? []) {
          const registration = participant.categoryRegistration;
          if (!registration || pairByRegistrationId.has(registration.id)) {
            continue;
          }

          const registrationPlayers = getRegistrationPlayers(registration);
          if (registrationPlayers.length < 2) continue;

          pairByRegistrationId.set(registration.id, {
            type: 'pair',
            id: registration.id,
            registration,
            label: getRegistrationLabel(registration),
            categoryName,
            players: registrationPlayers,
          });
        }
      }

      const pairSlides = Array.from(pairByRegistrationId.values());
      const orderedPairSlides =
        order === 'schedule'
          ? pairSlides
          : shuffleWithSeed(
              pairSlides,
              `${tournament?.id ?? tournamentParam}:pairs`
            );

      return [...championSlides, ...orderedPairSlides];
    }

    const playerSlides = players.map<PlayerSlide>((player) => ({
      type: 'player',
      id: player.id,
      player,
      code: getTournamentPlayerDisplayCode(
        player,
        players.map((item) => item.id)
      ),
      categories: Array.from(playerCategoryMap.get(player.id) ?? []),
    }));

    const orderedPlayerSlides =
      order === 'schedule'
        ? playerSlides
        : shuffleWithSeed(
            playerSlides,
            `${tournament?.id ?? tournamentParam}:players`
          );

    return [...championSlides, ...orderedPlayerSlides];
  }, [
    categoryById,
    championSlides,
    matches,
    mode,
    order,
    playerCategoryMap,
    players,
    tCategory,
    tRounds,
    tournament?.id,
    tournamentParam,
  ]);

  useEffect(() => {
    setActiveIndex(0);
  }, [mode, order, duration, slides.length]);

  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, duration * 1000);
    return () => window.clearInterval(timer);
  }, [duration, isPaused, slides.length]);

  const activeSlide = slides[activeIndex];
  const playerSlides = useMemo(
    () =>
      slides.filter((slide): slide is PlayerSlide => slide.type === 'player'),
    [slides]
  );
  const activePlayerIndex =
    activeSlide?.type === 'player'
      ? playerSlides.findIndex((slide) => slide.id === activeSlide.id)
      : -1;
  const modeLabel =
    mode === 'matches'
      ? t('matches')
      : mode === 'pairs'
        ? t('pairs')
        : mode === 'single'
          ? t('singlePlayer')
          : t('randomPlayers');
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      void containerRef.current?.requestFullscreen?.();
    } else {
      void document.exitFullscreen?.();
    }
  }, []);

  const copyShareUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toaster.success({ title: t('linkCopied') });
    } catch {
      toaster.error({ title: t('copyFailed') });
    }
  }, [shareUrl, t]);

  if (loading) {
    return (
      <Flex
        minH="100dvh"
        align="center"
        justify="center"
        bg="#08090d"
        color="white"
      >
        <Spinner size="xl" color="cyan.300" />
      </Flex>
    );
  }

  if (loadError) {
    return (
      <Flex
        minH="100dvh"
        align="center"
        justify="center"
        bg="#08090d"
        color="white"
        px={4}
        textAlign="center"
      >
        <Box>
          <Heading as="h1" fontSize={{ base: '2xl', md: '4xl' }} mb={3}>
            {t('loadFailed')}
          </Heading>
          <Text color="whiteAlpha.700" fontSize={{ base: 'md', md: 'xl' }}>
            {t('tryAgain')}
          </Text>
        </Box>
      </Flex>
    );
  }

  return (
    <Box
      ref={containerRef}
      minH="100dvh"
      bg="#08090d"
      color="white"
      overflow="hidden"
      position="relative"
    >
      <Box
        position="absolute"
        inset={0}
        bg="radial-gradient(circle at 22% 18%, rgba(20,184,166,0.24), transparent 30%), radial-gradient(circle at 78% 24%, rgba(245,158,11,0.2), transparent 26%), linear-gradient(135deg, #08090d 0%, #121827 48%, #08090d 100%)"
      />
      <Box
        position="absolute"
        inset={0}
        opacity={0.22}
        bgImage="linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)"
        bgSize="64px 64px"
      />

      {!controlsHidden && (
        <ShowcaseToolbar
          mode={mode}
          duration={duration}
          order={order}
          isPaused={isPaused}
          isFullscreen={isFullscreen}
          onMode={(value) =>
            setParam('mode', value === 'random' ? null : value)
          }
          onDuration={(value) =>
            setParam('duration', value === 6 ? null : String(value))
          }
          onOrder={(value) => setParam('order', value)}
          onPauseToggle={() => setIsPaused((value) => !value)}
          onToggleControls={() => setParam('controls', 'hidden')}
          onFullscreen={toggleFullscreen}
          onShare={copyShareUrl}
        />
      )}

      <Flex
        position="relative"
        zIndex={1}
        minH="100dvh"
        direction="column"
        px={{ base: 4, md: 8, xl: 12 }}
        pt={controlsHidden ? { base: 4, md: 8 } : { base: 24, md: 24 }}
        pb={{ base: 6, md: 10 }}
      >
        <Flex
          align="center"
          justify="center"
          gap={4}
          mb={{ base: 4, md: 8 }}
          position="relative"
        >
          <Box
            minW={0}
            maxW={{ base: 'full', md: 'min(920px, 62vw)' }}
            mx="auto"
            textAlign="center"
          >
            <Text
              fontSize={{ base: 'sm', md: 'md' }}
              color="cyan.200"
              fontWeight="bold"
            >
              {t('showcaseTitle')}
            </Text>
            <Heading
              as="h1"
              fontSize={{ base: '2xl', md: '4xl', xl: '5xl' }}
              lineHeight={1.05}
              color="white"
              lineClamp={2}
            >
              {tournament?.name ?? t('tournament')}
            </Heading>
          </Box>
          <Flex
            align="center"
            gap={2}
            flexShrink={0}
            display={{ base: 'none', md: 'flex' }}
            position="absolute"
            right={0}
            top="50%"
            transform="translateY(-50%)"
          >
            <Badge
              colorPalette={mode === 'matches' ? 'orange' : 'cyan'}
              px={3}
              py={1}
            >
              {modeLabel}
            </Badge>
            <Badge colorPalette="gray" px={3} py={1}>
              {duration}s
            </Badge>
          </Flex>
        </Flex>

        <Box flex="1" position="relative" minH={0}>
          {activeSlide ? (
            <AnimatePresence mode="wait">
              <MotionBox
                key={`${activeSlide.type}-${activeSlide.id}`}
                h="full"
                initial={{ opacity: 0, y: 34, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -28, scale: 0.985 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              >
                {activeSlide.type === 'player' ? (
                  <PlayerShowcase
                    slide={activeSlide}
                    slides={playerSlides}
                    activeIndex={activePlayerIndex >= 0 ? activePlayerIndex : 0}
                    variant={mode === 'single' ? 'single' : 'orbit'}
                  />
                ) : activeSlide.type === 'pair' ? (
                  <PairShowcase slide={activeSlide} />
                ) : activeSlide.type === 'champion' ? (
                  <ChampionShowcase slide={activeSlide} />
                ) : (
                  <MatchShowcase slide={activeSlide} />
                )}
              </MotionBox>
            </AnimatePresence>
          ) : (
            <EmptyState mode={mode} />
          )}
        </Box>

        {slides.length > 0 && (
          <Flex align="center" justify="center" gap={2} mt={{ base: 4, md: 8 }}>
            <Text
              color="whiteAlpha.700"
              fontVariantNumeric="tabular-nums"
              fontSize="sm"
            >
              {activeIndex + 1} / {slides.length}
            </Text>
            <Box
              w={{ base: 28, md: 52 }}
              h="3px"
              bg="whiteAlpha.200"
              overflow="hidden"
            >
              <Box
                h="full"
                bg="cyan.300"
                w={`${((activeIndex + 1) / slides.length) * 100}%`}
                transition="width 300ms ease"
              />
            </Box>
          </Flex>
        )}
      </Flex>
    </Box>
  );
}

function ShowcaseToolbar({
  mode,
  duration,
  order,
  isPaused,
  isFullscreen,
  onMode,
  onDuration,
  onOrder,
  onPauseToggle,
  onToggleControls,
  onFullscreen,
  onShare,
}: {
  mode: ShowcaseMode;
  duration: SlideDuration;
  order: ShowcaseOrder;
  isPaused: boolean;
  isFullscreen: boolean;
  onMode: (value: ShowcaseMode) => void;
  onDuration: (value: SlideDuration) => void;
  onOrder: (value: ShowcaseOrder) => void;
  onPauseToggle: () => void;
  onToggleControls: () => void;
  onFullscreen: () => void;
  onShare: () => void;
}) {
  const t = useTranslations('pages.tournaments.showcase');

  return (
    <Flex
      position="fixed"
      top={0}
      left={0}
      right={0}
      zIndex={20}
      direction={{ base: 'column', md: 'row' }}
      px={{ base: 2.5, md: 5 }}
      py={{ base: 2, md: 3 }}
      gap={{ base: 2, md: 3 }}
      align={{ base: 'stretch', md: 'center' }}
      bg="rgba(8, 9, 13, 0.82)"
      backdropFilter="blur(16px)"
      borderBottomWidth="1px"
      borderColor="whiteAlpha.200"
    >
      <Flex
        gap={{ base: 1.5, md: 2 }}
        overflowX={{ base: 'auto', md: 'visible' }}
        pb={{ base: 0.5, md: 0 }}
        css={{
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        <ToolbarChip
          active={mode === 'random'}
          onClick={() => onMode('random')}
          icon={<Users size={16} />}
        >
          {t('randomPlayers')}
        </ToolbarChip>
        <ToolbarChip
          active={mode === 'single'}
          onClick={() => onMode('single')}
          icon={<UserRound size={16} />}
        >
          {t('singlePlayer')}
        </ToolbarChip>
        <ToolbarChip
          active={mode === 'pairs'}
          onClick={() => onMode('pairs')}
          icon={<UsersRound size={16} />}
        >
          {t('pairs')}
        </ToolbarChip>
        <ToolbarChip
          active={mode === 'matches'}
          onClick={() => onMode('matches')}
          icon={<Swords size={16} />}
        >
          {t('matches')}
        </ToolbarChip>
      </Flex>

      <Flex
        align="center"
        gap={{ base: 1.5, md: 2 }}
        overflowX={{ base: 'auto', md: 'visible' }}
        pb={{ base: 0.5, md: 0 }}
        css={{
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        <Flex
          gap={1}
          p={1}
          flexShrink={0}
          bg="whiteAlpha.100"
          borderWidth="1px"
          borderColor="whiteAlpha.200"
          borderRadius="md"
        >
          {DURATION_OPTIONS.map((option) => (
            <ToolbarChip
              key={option}
              active={duration === option}
              onClick={() => onDuration(option)}
              compact
            >
              {option}s
            </ToolbarChip>
          ))}
        </Flex>

        <ToolbarChip
          active={order === 'random'}
          onClick={() => onOrder('random')}
          icon={<Shuffle size={16} />}
        >
          {t('randomOrder')}
        </ToolbarChip>
        <ToolbarChip
          active={order === 'schedule'}
          onClick={() => onOrder('schedule')}
          icon={<Trophy size={16} />}
        >
          {t('scheduleOrder')}
        </ToolbarChip>

        <Box flex={{ base: '0 0 8px', md: 1 }} />

        <HeaderActionButton
          label={isPaused ? t('play') : t('pause')}
          onClick={onPauseToggle}
          icon={isPaused ? <Play size={16} /> : <Pause size={16} />}
          highlight
        />
        <HeaderActionButton
          label={t('share')}
          onClick={onShare}
          icon={<Share2 size={16} />}
        />
        <HeaderActionButton
          label={isFullscreen ? t('exitFullscreen') : t('fullscreen')}
          onClick={onFullscreen}
          icon={isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
        />
        <HeaderActionButton
          label={t('hideControls')}
          onClick={onToggleControls}
          icon={<EyeOff size={16} />}
          subtle
        />
      </Flex>
    </Flex>
  );
}

function ToolbarChip({
  active,
  onClick,
  icon,
  compact = false,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Flex
      as="button"
      onClick={onClick}
      align="center"
      justify="center"
      gap={compact ? 0 : 2}
      px={compact ? 2.5 : { base: 2.5, md: 3 }}
      py={{ base: 1.5, md: 2 }}
      minH={{ base: '32px', md: '36px' }}
      minW={compact ? '42px' : 'max-content'}
      flexShrink={0}
      borderRadius="md"
      bg={active ? 'cyan.400' : 'whiteAlpha.100'}
      color={active ? 'gray.950' : 'whiteAlpha.900'}
      borderWidth="1px"
      borderColor={active ? 'cyan.200' : 'whiteAlpha.200'}
      fontSize={{ base: 'xs', md: 'sm' }}
      fontWeight="bold"
      whiteSpace="nowrap"
      cursor="pointer"
      _hover={{ borderColor: 'cyan.200' }}
    >
      {icon}
      {children}
    </Flex>
  );
}

function HeaderActionButton({
  label,
  onClick,
  icon,
  highlight = false,
  subtle = false,
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  highlight?: boolean;
  subtle?: boolean;
}) {
  return (
    <Button
      size="sm"
      variant={subtle ? 'ghost' : 'outline'}
      onClick={onClick}
      aria-label={label}
      minW={{ base: '34px', md: 'auto' }}
      h={{ base: '34px', md: '36px' }}
      px={{ base: 2, md: 3 }}
      flexShrink={0}
      color={highlight ? 'green.300' : undefined}
      borderColor={highlight ? 'green.700' : undefined}
    >
      {icon}
      <Box as="span" display={{ base: 'none', md: 'inline' }}>
        {label}
      </Box>
    </Button>
  );
}

type PlayerCardLayout = {
  x: string;
  y: string;
  z: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  scale: number;
  opacity: number;
};

const SPHERICAL_VISIBLE_CARD_RADIUS = 8;

function getSphericalPlayerCardLayout(offset: number): PlayerCardLayout | null {
  const distance = Math.abs(offset);
  if (distance > SPHERICAL_VISIBLE_CARD_RADIUS) return null;

  if (offset === 0) {
    return {
      x: '0vw',
      y: '0dvh',
      z: 210,
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
      scale: 1.22,
      opacity: 1,
    };
  }

  const direction = Math.sign(offset);
  const progress = distance / SPHERICAL_VISIBLE_CARD_RADIUS;
  const longitude = direction * progress * Math.PI * 0.86;
  const latitude =
    Math.sin((distance * 137.5 * Math.PI) / 180) * Math.PI * 0.18;
  const xRadius = 48;
  const yRadius = 30;
  const zRadius = 380;
  const x = Math.sin(longitude) * Math.cos(latitude) * xRadius;
  const y =
    Math.sin(latitude) * yRadius + Math.sin(longitude * 1.35) * yRadius * 0.24;
  const z = Math.cos(longitude) * Math.cos(latitude) * zRadius - 300;
  const depth = Math.max(0, Math.min(1, (z + zRadius) / (zRadius * 2)));

  return {
    x: `${x.toFixed(2)}vw`,
    y: `${y.toFixed(2)}dvh`,
    z: Math.round(z),
    rotateX: Number((-Math.sin(latitude) * 9).toFixed(2)),
    rotateY: Number((-Math.sin(longitude) * 30).toFixed(2)),
    rotateZ: Number((direction * Math.sin(progress * Math.PI) * -7).toFixed(2)),
    scale: Number((0.58 + depth * 0.52).toFixed(3)),
    opacity: Number((0.22 + depth * 0.72).toFixed(3)),
  };
}

function getCircularOffset(index: number, activeIndex: number, total: number) {
  const raw = index - activeIndex;
  const half = total / 2;
  if (raw > half) return raw - total;
  if (raw < -half) return raw + total;
  return raw;
}

function ChampionShowcase({ slide }: { slide: ChampionSlide }) {
  const t = useTranslations('pages.tournaments.showcase');

  return (
    <Flex
      h="full"
      minH={{ base: '560px', md: '620px' }}
      direction="column"
      align="center"
      justify="center"
      textAlign="center"
      gap={{ base: 5, md: 7 }}
      px={{ base: 2, md: 8 }}
    >
      <Flex
        position="relative"
        flex="1"
        minH={{ base: '360px', md: '430px', xl: '520px' }}
        maxH={{ base: '48dvh', md: '58dvh' }}
        w="full"
        align="center"
        justify="center"
      >
        <Box
          position="absolute"
          inset="8%"
          bg="radial-gradient(circle, rgba(250,204,21,0.34), rgba(34,211,238,0.18) 42%, transparent 70%)"
          filter="blur(32px)"
          opacity={0.92}
        />
        <Flex
          position="relative"
          align="center"
          justify="center"
          direction="column"
          w={{ base: '230px', md: '340px', xl: '420px' }}
          h={{ base: '230px', md: '340px', xl: '420px' }}
          borderRadius="full"
          bg="linear-gradient(135deg, rgba(250,204,21,0.96), rgba(34,211,238,0.9))"
          borderWidth="1px"
          borderColor="whiteAlpha.600"
          boxShadow="0 44px 130px rgba(0,0,0,0.62)"
          color="gray.950"
        >
          <Crown size={120} strokeWidth={1.35} />
          <Text
            mt={4}
            fontSize={{ base: 'lg', md: '2xl' }}
            fontWeight="black"
            textTransform="uppercase"
          >
            {t('champion')}
          </Text>
        </Flex>
      </Flex>

      <Flex direction="column" align="center" gap={{ base: 3, md: 4 }} minW={0}>
        <Flex gap={3} wrap="wrap" justify="center">
          <Badge
            colorPalette="yellow"
            px={4}
            py={2}
            fontSize={{ base: 'sm', md: 'md' }}
          >
            {t('championTitle')}
          </Badge>
          {slide.categoryName && (
            <Badge
              colorPalette="cyan"
              px={4}
              py={2}
              fontSize={{ base: 'sm', md: 'md' }}
            >
              {slide.categoryName}
            </Badge>
          )}
        </Flex>
        <Heading
          as="h2"
          fontSize={{ base: '3xl', md: '5xl', xl: '6xl' }}
          lineHeight={1}
          color="white"
          maxW="18ch"
        >
          {slide.entry.label}
        </Heading>
        <Text
          fontSize={{ base: 'md', md: 'xl' }}
          color="whiteAlpha.800"
          maxW="48rem"
        >
          {slide.entry.playerNames || t('championSubtitle')}
        </Text>
        {slide.entry.detail && (
          <Text
            color="yellow.200"
            fontSize={{ base: 'sm', md: 'lg' }}
            fontWeight="bold"
          >
            {slide.entry.detail}
          </Text>
        )}
      </Flex>
    </Flex>
  );
}

function PlayerShowcase({
  slide,
  slides,
  activeIndex,
  variant,
}: {
  slide: PlayerSlide;
  slides: PlayerSlide[];
  activeIndex: number;
  variant: 'orbit' | 'single';
}) {
  const t = useTranslations('pages.tournaments.showcase');
  const player = slide.player;

  return (
    <Flex
      h="full"
      minH={{ base: '560px', md: '620px' }}
      direction="column"
      align="center"
      justify="center"
      gap={{ base: 5, md: 7 }}
    >
      {variant === 'single' ? (
        <SinglePlayerPortrait slide={slide} />
      ) : (
        <PlayerPhotoCarousel slides={slides} activeIndex={activeIndex} />
      )}

      <Flex
        direction="column"
        align="center"
        gap={{ base: 3, md: 4 }}
        minW={0}
        textAlign="center"
      >
        <Flex gap={3} wrap="wrap">
          <Badge
            colorPalette="cyan"
            px={4}
            py={2}
            fontSize={{ base: 'sm', md: 'md' }}
          >
            {t('playerCode', { code: slide.code })}
          </Badge>
          {slide.categories.slice(0, 2).map((category) => (
            <Badge
              key={category}
              colorPalette="orange"
              px={4}
              py={2}
              fontSize={{ base: 'sm', md: 'md' }}
            >
              {category}
            </Badge>
          ))}
        </Flex>
        <Heading
          as="h2"
          fontSize={{ base: '3xl', md: '5xl', xl: '6xl' }}
          lineHeight={1}
          color="white"
          maxW="18ch"
        >
          {player.name}
        </Heading>
        {slide.categories.length === 0 && (
          <Text
            fontSize={{ base: 'md', md: 'xl' }}
            color="whiteAlpha.800"
            maxW="46rem"
          >
            {t('athleteSpotlight')}
          </Text>
        )}
      </Flex>
    </Flex>
  );
}

function SinglePlayerPortrait({ slide }: { slide: PlayerSlide }) {
  const player = slide.player;
  const image = player.image || player.user?.image;
  const initials = getPlayerInitials(player.name);

  return (
    <Flex
      position="relative"
      w="full"
      flex="1"
      minH={{ base: '360px', md: '430px', xl: '520px' }}
      maxH={{ base: '48dvh', md: '58dvh' }}
      align="center"
      justify="center"
    >
      <Box
        position="absolute"
        inset="8%"
        bg="radial-gradient(circle, rgba(34,211,238,0.28), rgba(245,158,11,0.18) 38%, transparent 66%)"
        filter="blur(30px)"
        opacity={0.72}
      />
      <Flex
        position="relative"
        w={{ base: '220px', sm: '260px', md: '330px', xl: '390px' }}
        h={{ base: '302px', sm: '356px', md: '452px', xl: '534px' }}
        align="center"
        justify="center"
        borderRadius={{ base: '22px', md: '28px' }}
        overflow="hidden"
        bg="linear-gradient(135deg, rgba(34,211,238,0.9), rgba(245,158,11,0.86))"
        borderWidth="1px"
        borderColor="whiteAlpha.400"
        boxShadow="0 42px 120px rgba(0,0,0,0.62)"
      >
        {image ? (
          <Image
            src={image}
            alt={player.name}
            w="full"
            h="full"
            objectFit="cover"
          />
        ) : (
          <Text
            fontSize={{ base: '6xl', md: '8xl' }}
            fontWeight="black"
            color="gray.950"
            lineHeight={1}
          >
            {initials}
          </Text>
        )}
        <Box
          position="absolute"
          inset={0}
          bg="linear-gradient(180deg, transparent 54%, rgba(0,0,0,0.38))"
          pointerEvents="none"
        />
      </Flex>
    </Flex>
  );
}

function PlayerPhotoCarousel({
  slides,
  activeIndex,
}: {
  slides: PlayerSlide[];
  activeIndex: number;
}) {
  return (
    <Box
      position="relative"
      w="full"
      flex="1"
      minH={{ base: '360px', md: '430px', xl: '520px' }}
      maxH={{ base: '48dvh', md: '58dvh' }}
      style={{ perspective: '1400px', transformStyle: 'preserve-3d' }}
    >
      <Box
        position="absolute"
        inset={0}
        bg="radial-gradient(circle, rgba(255,255,255,0.2), transparent 54%)"
        filter="blur(24px)"
        opacity={0.42}
      />
      {slides.map((item, index) => {
        const offset = getCircularOffset(index, activeIndex, slides.length);
        const layout = getSphericalPlayerCardLayout(offset);
        if (!layout) return null;

        return (
          <PlayerCarouselCard
            key={item.id}
            slide={item}
            layout={layout}
            isActive={offset === 0}
            zIndex={100 - Math.abs(offset)}
          />
        );
      })}
    </Box>
  );
}

function PlayerCarouselCard({
  slide,
  layout,
  isActive,
  zIndex,
}: {
  slide: PlayerSlide;
  layout: PlayerCardLayout;
  isActive: boolean;
  zIndex: number;
}) {
  const player = slide.player;
  const image = player.image || player.user?.image;
  const initials = getPlayerInitials(player.name);

  return (
    <Flex
      position="absolute"
      left="50%"
      top="50%"
      w={{ base: '124px', sm: '148px', md: '178px', lg: '206px', xl: '232px' }}
      h={{ base: '170px', sm: '202px', md: '244px', lg: '282px', xl: '318px' }}
      align="center"
      justify="center"
      borderRadius={{ base: '18px', md: '22px' }}
      overflow="hidden"
      bg="linear-gradient(135deg, rgba(34,211,238,0.78), rgba(245,158,11,0.78))"
      borderWidth="1px"
      borderColor="whiteAlpha.300"
      boxShadow={
        isActive
          ? '0 34px 100px rgba(0,0,0,0.58)'
          : '0 22px 70px rgba(0,0,0,0.42)'
      }
      opacity={layout.opacity}
      zIndex={zIndex}
      transition="transform 850ms cubic-bezier(0.22, 1, 0.36, 1), opacity 850ms ease, filter 850ms ease"
      filter={isActive ? 'saturate(1.05)' : 'saturate(0.72) contrast(0.9)'}
      style={{
        transform: `translate3d(calc(-50% + ${layout.x}), calc(-50% + ${layout.y}), ${layout.z}px) rotateX(${layout.rotateX}deg) rotateY(${layout.rotateY}deg) rotateZ(${layout.rotateZ}deg) scale(${layout.scale})`,
        transformStyle: 'preserve-3d',
      }}
    >
      {image ? (
        <Image
          src={image}
          alt={player.name}
          w="full"
          h="full"
          objectFit="cover"
        />
      ) : (
        <Text
          fontSize={{ base: '4xl', md: '6xl' }}
          fontWeight="black"
          color="gray.950"
          lineHeight={1}
        >
          {initials}
        </Text>
      )}
      <Box
        position="absolute"
        inset={0}
        bg={
          isActive
            ? 'linear-gradient(180deg, transparent 48%, rgba(0,0,0,0.32))'
            : 'rgba(255,255,255,0.16)'
        }
        pointerEvents="none"
      />
    </Flex>
  );
}

function PairShowcase({ slide }: { slide: PairSlide }) {
  const t = useTranslations('pages.tournaments.showcase');
  const playerNames = slide.players.map((player) => player.name).join(' / ');

  return (
    <Flex
      h="full"
      minH={{ base: '560px', md: '620px' }}
      direction="column"
      align="center"
      justify="center"
      gap={{ base: 5, md: 7 }}
    >
      <Flex
        position="relative"
        w="full"
        flex="1"
        minH={{ base: '360px', md: '430px', xl: '520px' }}
        maxH={{ base: '48dvh', md: '58dvh' }}
        align="center"
        justify="center"
      >
        <Box
          position="absolute"
          inset="8%"
          bg="radial-gradient(circle, rgba(34,211,238,0.28), rgba(245,158,11,0.2) 42%, transparent 68%)"
          filter="blur(30px)"
          opacity={0.76}
        />
        <Flex
          position="relative"
          align="center"
          justify="center"
          gap={{ base: 3, md: 6 }}
          w="full"
        >
          {slide.players.slice(0, 2).map((player, index) => (
            <PairPortrait
              key={player.id}
              player={player}
              tilt={index === 0 ? -4 : 4}
              offsetY={index === 0 ? '2dvh' : '-2dvh'}
            />
          ))}
        </Flex>
      </Flex>

      <Flex
        direction="column"
        align="center"
        gap={{ base: 3, md: 4 }}
        minW={0}
        textAlign="center"
      >
        <Flex gap={3} wrap="wrap">
          {slide.categoryName && (
            <Badge
              colorPalette="orange"
              px={4}
              py={2}
              fontSize={{ base: 'sm', md: 'md' }}
            >
              {slide.categoryName}
            </Badge>
          )}
          <Badge
            colorPalette="cyan"
            px={4}
            py={2}
            fontSize={{ base: 'sm', md: 'md' }}
          >
            {t('pairs')}
          </Badge>
        </Flex>
        <Heading
          as="h2"
          fontSize={{ base: '3xl', md: '5xl', xl: '6xl' }}
          lineHeight={1}
          color="white"
          maxW="18ch"
        >
          {slide.label}
        </Heading>
        <Text
          fontSize={{ base: 'md', md: 'xl' }}
          color="whiteAlpha.800"
          maxW="46rem"
        >
          {playerNames}
        </Text>
      </Flex>
    </Flex>
  );
}

function PairPortrait({
  player,
  tilt,
  offsetY,
}: {
  player: TournamentPlayer;
  tilt: number;
  offsetY: string;
}) {
  const image = player.image || player.user?.image;
  const initials = getPlayerInitials(player.name);

  return (
    <Flex
      position="relative"
      w={{ base: '150px', sm: '178px', md: '248px', xl: '304px' }}
      h={{ base: '206px', sm: '244px', md: '340px', xl: '416px' }}
      align="center"
      justify="center"
      borderRadius={{ base: '20px', md: '26px' }}
      overflow="hidden"
      bg="linear-gradient(135deg, rgba(34,211,238,0.9), rgba(245,158,11,0.86))"
      borderWidth="1px"
      borderColor="whiteAlpha.400"
      boxShadow="0 38px 110px rgba(0,0,0,0.58)"
      style={{
        transform: `translateY(${offsetY}) rotateZ(${tilt}deg)`,
      }}
    >
      {image ? (
        <Image
          src={image}
          alt={player.name}
          w="full"
          h="full"
          objectFit="cover"
        />
      ) : (
        <Text
          fontSize={{ base: '5xl', md: '7xl' }}
          fontWeight="black"
          color="gray.950"
          lineHeight={1}
        >
          {initials}
        </Text>
      )}
      <Box
        position="absolute"
        inset={0}
        bg="linear-gradient(180deg, transparent 52%, rgba(0,0,0,0.36))"
        pointerEvents="none"
      />
    </Flex>
  );
}

function MatchShowcase({ slide }: { slide: MatchSlide }) {
  const t = useTranslations('pages.tournaments.showcase');
  const timeLabel = formatMatchDateTime(slide.match.startTime);

  return (
    <Flex h="full" direction="column" justify="center" gap={{ base: 5, md: 8 }}>
      <Flex align="center" justify="center" gap={3} wrap="wrap">
        <Badge
          colorPalette={
            slide.match.status === MatchStatus.IN_PROGRESS ? 'green' : 'orange'
          }
          px={4}
          py={2}
        >
          {slide.match.status === MatchStatus.IN_PROGRESS
            ? t('live')
            : slide.matchCode}
        </Badge>
        {slide.categoryName && (
          <Badge colorPalette="cyan" px={4} py={2}>
            {slide.categoryName}
          </Badge>
        )}
        {slide.roundLabel && (
          <Badge colorPalette="purple" px={4} py={2}>
            {slide.roundLabel}
          </Badge>
        )}
      </Flex>

      <Grid
        templateColumns={{ base: '1fr', lg: '1fr auto 1fr' }}
        gap={{ base: 5, lg: 8 }}
        alignItems="center"
      >
        <MatchSidePanel side={slide.sides[0]} align="right" />
        <Flex
          align="center"
          justify="center"
          w={{ base: '100%', lg: '118px' }}
          h={{ base: '74px', lg: '118px' }}
          borderRadius="full"
          bg="whiteAlpha.100"
          borderWidth="1px"
          borderColor="whiteAlpha.300"
          color="orange.200"
          fontSize={{ base: '3xl', lg: '4xl' }}
          fontWeight="black"
        >
          VS
        </Flex>
        <MatchSidePanel side={slide.sides[1]} align="left" />
      </Grid>

      <Flex
        justify="center"
        gap={3}
        wrap="wrap"
        color="whiteAlpha.800"
        fontSize={{ base: 'md', md: 'xl' }}
      >
        {slide.match.court && (
          <Text>{t('court', { court: slide.match.court.courtNumber })}</Text>
        )}
        {timeLabel && <Text>{timeLabel}</Text>}
      </Flex>
    </Flex>
  );
}

function MatchSidePanel({
  side,
  align,
}: {
  side: MatchSide;
  align: 'left' | 'right';
}) {
  const primaryPlayer = side.players[0];
  const textAlign = { base: 'center', lg: align };

  return (
    <Flex
      direction="column"
      align={{
        base: 'center',
        lg: align === 'right' ? 'flex-end' : 'flex-start',
      }}
      gap={4}
      minW={0}
    >
      <Flex
        gap={3}
        justify={{
          base: 'center',
          lg: align === 'right' ? 'flex-end' : 'flex-start',
        }}
        wrap="wrap"
      >
        {side.players.slice(0, 2).map((player) => (
          <MiniAvatar key={player.id} player={player} />
        ))}
        {side.players.length === 0 && <MiniInitials label={side.label} />}
      </Flex>
      <Heading
        as="h2"
        fontSize={{ base: '3xl', md: '6xl', xl: '7xl' }}
        lineHeight={1}
        color="white"
        textAlign={textAlign}
        maxW="12ch"
      >
        {side.label}
      </Heading>
      {primaryPlayer && (
        <Text
          fontSize={{ base: 'md', md: 'xl' }}
          color="whiteAlpha.700"
          textAlign={textAlign}
        >
          {side.players.map((player) => player.name).join(' / ')}
        </Text>
      )}
    </Flex>
  );
}

function MiniAvatar({ player }: { player: TournamentPlayer }) {
  const image = player.image || player.user?.image;
  if (!image) return <MiniInitials label={player.name} />;

  return (
    <Image
      src={image}
      alt={player.name}
      w={{ base: 20, md: 28 }}
      h={{ base: 20, md: 28 }}
      objectFit="cover"
      borderRadius="full"
      borderWidth="2px"
      borderColor="whiteAlpha.500"
    />
  );
}

function MiniInitials({ label }: { label: string }) {
  return (
    <Flex
      align="center"
      justify="center"
      w={{ base: 20, md: 28 }}
      h={{ base: 20, md: 28 }}
      borderRadius="full"
      bg="linear-gradient(135deg, #22d3ee, #f59e0b)"
      color="gray.950"
      fontSize={{ base: '2xl', md: '4xl' }}
      fontWeight="black"
      borderWidth="2px"
      borderColor="whiteAlpha.500"
    >
      {getPlayerInitials(label)}
    </Flex>
  );
}

function EmptyState({ mode }: { mode: ShowcaseMode }) {
  const t = useTranslations('pages.tournaments.showcase');

  return (
    <Flex
      h="full"
      minH="48dvh"
      align="center"
      justify="center"
      textAlign="center"
      direction="column"
      gap={3}
    >
      <Heading as="h2" fontSize={{ base: '2xl', md: '4xl' }}>
        {mode === 'matches'
          ? t('noMatches')
          : mode === 'pairs'
            ? t('noPairs')
            : t('noPlayers')}
      </Heading>
      <Text color="whiteAlpha.700" fontSize={{ base: 'md', md: 'xl' }}>
        {mode === 'matches' || mode === 'pairs'
          ? t('switchToPlayers')
          : t('addPlayersFirst')}
      </Text>
    </Flex>
  );
}
