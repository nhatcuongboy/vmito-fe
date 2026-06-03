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
  Maximize,
  Minimize,
  Pause,
  Play,
  Shuffle,
  Share2,
  Swords,
  Trophy,
  Users,
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
  MatchStatus,
  Tournament,
  TournamentPlayer,
} from '@/lib/api/types';
import {
  getMatchDisplayCode,
  getTournamentPlayerDisplayCode,
} from '@/lib/tournament/codes';
import { getRoundDisplayLabel } from '@/lib/tournament/roundLabel';
import { getTeamLabel } from '@/lib/tournament/teamLabel';

type ShowcaseMode = 'random' | 'matches';
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

type MatchSlide = {
  type: 'match';
  id: string;
  match: CategoryMatch;
  matchCode: string;
  categoryName: string;
  roundLabel: string;
  sides: [MatchSide, MatchSide];
};

type ShowcaseSlide = PlayerSlide | MatchSlide;

const DURATION_OPTIONS: SlideDuration[] = [4, 6, 10];
const MotionBox = motion.create(Box);

function parseMode(value: string | null): ShowcaseMode {
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

function getSide(match: CategoryMatch, position: number): MatchSide {
  const participant = match.participants?.find(
    (item) => item.position === position
  );
  return {
    label: getTeamLabel(match, position),
    players: getRegistrationPlayers(participant?.categoryRegistration),
  };
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

        if (!active) return;
        setTournament(tour);
        setPlayers(playerData);
        setMatches(matchData);
        setCategories(categoryData);
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
            categoryName:
              category?.name?.trim() ||
              (category ? tCategory(category.type) : ''),
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

      return ordered.filter((slide): slide is MatchSlide => Boolean(slide));
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

    return order === 'schedule'
      ? playerSlides
      : shuffleWithSeed(
          playerSlides,
          `${tournament?.id ?? tournamentParam}:players`
        );
  }, [
    categoryById,
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
        pt={controlsHidden ? { base: 4, md: 8 } : { base: 28, md: 24 }}
        pb={{ base: 6, md: 10 }}
      >
        <Flex
          align="center"
          justify="space-between"
          gap={4}
          mb={{ base: 4, md: 8 }}
        >
          <Box minW={0}>
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
          <Flex align="center" gap={2} flexShrink={0}>
            <Badge
              colorPalette={mode === 'matches' ? 'orange' : 'cyan'}
              px={3}
              py={1}
            >
              {mode === 'matches' ? t('matches') : t('randomPlayers')}
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
                  <PlayerShowcase slide={activeSlide} />
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
      px={{ base: 3, md: 5 }}
      py={3}
      gap={3}
      align="center"
      wrap="wrap"
      bg="rgba(8, 9, 13, 0.82)"
      backdropFilter="blur(16px)"
      borderBottomWidth="1px"
      borderColor="whiteAlpha.200"
    >
      <Flex gap={2} wrap="wrap">
        <ToolbarChip
          active={mode === 'random'}
          onClick={() => onMode('random')}
          icon={<Users size={16} />}
        >
          {t('randomPlayers')}
        </ToolbarChip>
        <ToolbarChip
          active={mode === 'matches'}
          onClick={() => onMode('matches')}
          icon={<Swords size={16} />}
        >
          {t('matches')}
        </ToolbarChip>
      </Flex>

      <Flex gap={2} wrap="wrap">
        {DURATION_OPTIONS.map((option) => (
          <ToolbarChip
            key={option}
            active={duration === option}
            onClick={() => onDuration(option)}
          >
            {option}s
          </ToolbarChip>
        ))}
      </Flex>

      <Flex gap={2} wrap="wrap">
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
      </Flex>

      <Box flex="1" />

      <Button size="sm" variant="outline" onClick={onPauseToggle}>
        {isPaused ? <Play size={16} /> : <Pause size={16} />}
        {isPaused ? t('play') : t('pause')}
      </Button>
      <Button size="sm" variant="outline" onClick={onShare}>
        <Share2 size={16} />
        {t('share')}
      </Button>
      <Button size="sm" variant="outline" onClick={onFullscreen}>
        {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
        {isFullscreen ? t('exitFullscreen') : t('fullscreen')}
      </Button>
      <Button size="sm" variant="ghost" onClick={onToggleControls}>
        {t('hideControls')}
      </Button>
    </Flex>
  );
}

function ToolbarChip({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Flex
      as="button"
      onClick={onClick}
      align="center"
      gap={2}
      px={3}
      py={2}
      minH="36px"
      borderRadius="md"
      bg={active ? 'cyan.400' : 'whiteAlpha.100'}
      color={active ? 'gray.950' : 'whiteAlpha.900'}
      borderWidth="1px"
      borderColor={active ? 'cyan.200' : 'whiteAlpha.200'}
      fontSize="sm"
      fontWeight="bold"
      cursor="pointer"
      _hover={{ borderColor: 'cyan.200' }}
    >
      {icon}
      {children}
    </Flex>
  );
}

function PlayerShowcase({ slide }: { slide: PlayerSlide }) {
  const t = useTranslations('pages.tournaments.showcase');
  const player = slide.player;

  return (
    <Grid
      h="full"
      alignItems="center"
      templateColumns={{ base: '1fr', lg: 'minmax(320px, 44%) 1fr' }}
      gap={{ base: 6, lg: 12 }}
    >
      <Box>
        <PlayerPortrait player={player} />
      </Box>
      <Flex direction="column" gap={{ base: 4, md: 6 }} minW={0}>
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
          fontSize={{ base: '4xl', md: '7xl', xl: '8xl' }}
          lineHeight={1}
          color="white"
          maxW="12ch"
        >
          {player.name}
        </Heading>
        <Text
          fontSize={{ base: 'lg', md: '2xl' }}
          color="whiteAlpha.800"
          maxW="46rem"
        >
          {slide.categories.length > 0
            ? slide.categories.join(' / ')
            : t('athleteSpotlight')}
        </Text>
      </Flex>
    </Grid>
  );
}

function PlayerPortrait({ player }: { player: TournamentPlayer }) {
  const image = player.image || player.user?.image;
  const initials = getPlayerInitials(player.name);

  return (
    <Flex
      aspectRatio={1}
      w="full"
      maxW={{ base: '72vw', md: '54vw', lg: '100%' }}
      mx="auto"
      align="center"
      justify="center"
      borderRadius="lg"
      overflow="hidden"
      bg="linear-gradient(135deg, rgba(34,211,238,0.88), rgba(245,158,11,0.88))"
      borderWidth="1px"
      borderColor="whiteAlpha.300"
      boxShadow="0 30px 90px rgba(0,0,0,0.46)"
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
          fontSize={{ base: '7xl', md: '9xl' }}
          fontWeight="black"
          color="gray.950"
          lineHeight={1}
        >
          {initials}
        </Text>
      )}
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
        {mode === 'matches' ? t('noMatches') : t('noPlayers')}
      </Heading>
      <Text color="whiteAlpha.700" fontSize={{ base: 'md', md: 'xl' }}>
        {mode === 'matches' ? t('switchToPlayers') : t('addPlayersFirst')}
      </Text>
    </Flex>
  );
}
