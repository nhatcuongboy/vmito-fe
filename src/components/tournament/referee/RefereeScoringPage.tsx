'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter as useNextRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  Badge,
  Box,
  Flex,
  HStack,
  Heading,
  SimpleGrid,
  Text,
  VStack,
  Avatar,
} from '@chakra-ui/react';
import { Button, IconButton } from '@/components/ui/chakra-compat';
import { VModal } from '@/components/ui/VModal';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter as useI18nRouter } from '@/i18n/config';
import {
  ArrowLeft,
  Flag,
  Info,
  Mail,
  NotebookText,
  Play,
  ShieldAlert,
  Signal,
  Trophy,
  UserRound,
  VenusAndMars,
  Phone,
} from 'lucide-react';

import { TournamentService } from '@/lib/api/tournament.service';
import { CategoryService } from '@/lib/api/category.service';
import {
  CategoryMatch,
  CategoryRegistration,
  Tournament,
  TournamentPlayer,
  UserRole,
} from '@/lib/api/types';
import {
  getTeamLabel,
  areMatchParticipantsResolved,
} from '@/lib/tournament/teamLabel';
import { getRoundDisplayLabel } from '@/lib/tournament/roundLabel';
import { formatCourtLabel } from '@/components/tournament/manage/panels/ResultsPanel';
import ScoreEntryBoard from './ScoreEntryBoard';
import ForfeitMatchModal from './ForfeitMatchModal';
import { useAuthStore } from '@/stores/useAuthStore';
import { TournamentMatchListSkeleton } from '@/components/tournament/skeletons';
import TournamentRefereeDesktopLayout from '@/components/tournament/TournamentRefereeDesktopLayout';
import { useTournamentSocket } from '@/hooks/useTournamentSocket';

const REFEREE_RETURN_URL_STORAGE_PREFIX = 'vmito.referee.returnUrl.';

function getGenderTranslationKey(gender?: string) {
  if (gender === 'PREFER_NOT_TO_SAY') return 'preferNotToSay';
  return gender?.toLowerCase();
}

export default function RefereeScoringPage() {
  const params = useParams();
  const tournamentParam = String(params?.id ?? '');
  const matchId = String(params?.matchId ?? '');
  const t = useTranslations('pages.tournaments.scoreEntry');
  const tRounds = useTranslations('pages.tournaments.scoreEntry.rounds');
  const tGuard = useTranslations('auth.guard');
  const locale = useLocale();
  const router = useI18nRouter();
  const nextRouter = useNextRouter();
  const { user } = useAuthStore();

  const [match, setMatch] = useState<CategoryMatch | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [playerInfoOpen, setPlayerInfoOpen] = useState(false);
  const [forfeitOpen, setForfeitOpen] = useState(false);
  const loadRequestIdRef = useRef(0);

  const loadMatch = useCallback(
    async (options?: { silent?: boolean }) => {
      const requestId = ++loadRequestIdRef.current;
      if (!options?.silent) setLoading(true);
      try {
        const [m, tour] = await Promise.all([
          CategoryService.getMatch(matchId),
          TournamentService.getTournament(tournamentParam),
        ]);
        if (loadRequestIdRef.current !== requestId) return;
        setMatch(m);
        setTournament(tour);
      } finally {
        if (loadRequestIdRef.current === requestId) setLoading(false);
      }
    },
    [matchId, tournamentParam]
  );

  useEffect(() => {
    void loadMatch();
  }, [loadMatch]);

  const canAccess =
    !!tournament &&
    (user?.id === tournament.hostId ||
      user?.role === UserRole.ADMIN ||
      user?.role === UserRole.REFEREE);

  const handleStart = useCallback(async () => {
    setStarting(true);
    try {
      const resp = await CategoryService.startMatch(matchId);
      setMatch(resp);
    } finally {
      setStarting(false);
    }
  }, [matchId]);

  const refreshMatchIfCurrent = useCallback(
    (eventMatchId: string) => {
      if (eventMatchId === matchId) {
        void loadMatch({ silent: true });
      }
    },
    [loadMatch, matchId]
  );

  useTournamentSocket(tournament?.id, {
    onScoreUpdated: (event) => {
      if (match?.status !== 'IN_PROGRESS') {
        refreshMatchIfCurrent(event.match.matchId);
      }
    },
    onMatchStarted: (event) => refreshMatchIfCurrent(event.match.matchId),
    onMatchEnded: (event) => refreshMatchIfCurrent(event.match.matchId),
    onRefereeAssigned: (event) => refreshMatchIfCurrent(event.match.matchId),
    onReconnect: () => void loadMatch({ silent: true }),
  });

  const goBack = useCallback(() => {
    if (typeof window !== 'undefined') {
      const returnUrl = window.sessionStorage.getItem(
        `${REFEREE_RETURN_URL_STORAGE_PREFIX}${tournamentParam}`
      );
      if (returnUrl?.includes(`/tournament/${tournamentParam}/referee`)) {
        nextRouter.push(returnUrl);
        return;
      }
    }
    router.push(`/tournament/${tournamentParam}/referee`);
  }, [nextRouter, router, tournamentParam]);

  const formatDateTime = (value?: Date | string) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <TournamentRefereeDesktopLayout
        tournament={tournament}
        activeTab={2}
        showSidebar={false}
      >
        <Box
          minH="100dvh"
          bg="gray.50"
          p={4}
          _dark={{ bg: 'var(--tournament-bg)' }}
        >
          <TournamentMatchListSkeleton count={4} />
        </Box>
      </TournamentRefereeDesktopLayout>
    );
  }

  if (!match || !tournament) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        minH="100dvh"
        gap={3}
      >
        <Text color="gray.500">{t('matchNotFound')}</Text>
        <Button onClick={goBack}>{t('back')}</Button>
      </Flex>
    );
  }

  if (!canAccess) {
    return (
      <TournamentRefereeDesktopLayout
        tournament={tournament}
        activeTab={2}
        showSidebar={false}
      >
        <Flex
          direction="column"
          align="center"
          justify="center"
          minH="100dvh"
          gap={3}
          px={4}
          textAlign="center"
        >
          <Text fontWeight="semibold">{tGuard('accessDenied')}</Text>
          <Text color="gray.500">{tGuard('permissionDenied')}</Text>
          <Button onClick={goBack}>{t('back')}</Button>
        </Flex>
      </TournamentRefereeDesktopLayout>
    );
  }

  const team1 = getTeamLabel(match, 1);
  const team2 = getTeamLabel(match, 2);
  const categoryName = match.category?.name;
  const roundLabel = getRoundDisplayLabel(match.round ?? 'group', tRounds);
  const matchTitle = `${team1} ${t('vs')} ${team2}`;
  const courtLabel = match.court
    ? formatCourtLabel(match.court, t('court'))
    : '—';
  const scheduledTime = formatDateTime(
    match.startTime ?? match.estimatedEndTime
  );
  const matchSides = getMatchSides(match);
  const participantsResolved = areMatchParticipantsResolved(match);
  const isTerminalMatch =
    match.status === 'FINISHED' || match.status === 'CANCELLED';
  // Only the live scoreboard needs the full-height, vertically-centered stage.
  // SCHEDULED / terminal states are short, so they sit compactly at the top.
  const isScoringBoard = match.status === 'IN_PROGRESS';

  return (
    <TournamentRefereeDesktopLayout
      tournament={tournament}
      activeTab={2}
      showSidebar={false}
    >
      <Box
        minH="100dvh"
        display="flex"
        flexDirection="column"
        bg="linear-gradient(180deg, #f8fafc 0%, #ecfdf5 100%)"
        _dark={{ bg: 'var(--tournament-bg)' }}
      >
        <Box
          position="sticky"
          top={0}
          zIndex={20}
          px={{
            base: 'max(0.5rem, env(safe-area-inset-left))',
            md: 'max(1rem, env(safe-area-inset-left))',
          }}
          py={{ base: 1.5, md: 2 }}
          paddingTop={{
            base: 'max(0.375rem, env(safe-area-inset-top))',
            md: 'max(0.5rem, env(safe-area-inset-top))',
          }}
          paddingRight={{
            base: 'max(0.5rem, env(safe-area-inset-right))',
            md: 'max(1rem, env(safe-area-inset-right))',
          }}
          bg="rgba(248, 250, 252, 0.92)"
          borderBottomWidth="1px"
          borderBottomColor="whiteAlpha.700"
          boxShadow="0 10px 30px rgba(15, 23, 42, 0.08)"
          backdropFilter="blur(14px)"
          _dark={{
            bg: 'rgba(8, 19, 32, 0.94)',
            borderBottomColor:
              'var(--tournament-border, rgba(148, 163, 184, 0.18))',
            boxShadow: '0 14px 34px rgba(0, 0, 0, 0.26)',
          }}
        >
          <Flex
            align="center"
            gap={{ base: 2, md: 3 }}
            maxW="1800px"
            mx="auto"
            minH={{ base: '46px', md: '50px' }}
          >
            <Button
              aria-label={t('back')}
              title={t('back')}
              variant="ghost"
              size="sm"
              onClick={goBack}
              borderRadius="full"
              bg="white"
              boxShadow="sm"
              _dark={{
                bg: 'var(--tournament-surface-raised, var(--chakra-colors-gray-800))',
                borderColor:
                  'var(--tournament-border, var(--chakra-colors-gray-700))',
              }}
            >
              <ArrowLeft size={18} />
            </Button>

            <Box flex="1" minW={0}>
              <Flex align="center" gap={1.5} mb={0.5} flexWrap="wrap">
                <Text
                  fontSize="xs"
                  color="gray.500"
                  fontWeight="medium"
                  _dark={{ color: 'gray.400' }}
                >
                  {t('refereeArea')}
                </Text>
                <Badge colorPalette="green" borderRadius="full" px={2}>
                  {t(`status.${match.status}`)}
                </Badge>
                {categoryName && (
                  <Badge colorPalette="purple" borderRadius="full" px={2}>
                    {categoryName}
                  </Badge>
                )}
                <Badge
                  variant="subtle"
                  colorPalette="gray"
                  borderRadius="full"
                  px={2}
                >
                  {roundLabel}
                </Badge>
              </Flex>
              <Flex align="center" gap={3} minW={0}>
                <Text
                  fontWeight="bold"
                  fontSize={{ base: 'md', md: 'lg' }}
                  whiteSpace="nowrap"
                  overflow="hidden"
                  textOverflow="ellipsis"
                >
                  {matchTitle}
                </Text>
                <Text
                  display={{ base: 'none', lg: 'block' }}
                  color="gray.400"
                  fontSize="sm"
                  whiteSpace="nowrap"
                  _dark={{ color: 'gray.500' }}
                >
                  {scheduledTime}
                </Text>
              </Flex>
            </Box>

            <HStack gap={2} flexShrink={0}>
              <Badge
                display={{ base: 'none', sm: 'inline-flex' }}
                colorPalette="blue"
                borderRadius="full"
                px={3}
                py={0.5}
                fontSize="xs"
              >
                {courtLabel}
              </Badge>
              <IconButton
                aria-label={t('playerInfo')}
                title={t('playerInfo')}
                variant="outline"
                size="sm"
                borderRadius="full"
                colorPalette="gray"
                onClick={() => setPlayerInfoOpen(true)}
              >
                <Info size={17} />
              </IconButton>
            </HStack>
          </Flex>
        </Box>

        <Flex
          flex="1"
          align={isScoringBoard ? 'center' : 'flex-start'}
          justify="center"
          px={{ base: 2, md: 3 }}
          py={isScoringBoard ? { base: 2, md: 3 } : { base: 3, md: 5 }}
          minH={
            isScoringBoard
              ? { base: 'calc(100dvh - 62px)', md: 'calc(100dvh - 72px)' }
              : 'auto'
          }
        >
          <Box
            w="full"
            maxW={isScoringBoard ? '1840px' : '760px'}
            mx="auto"
            borderRadius={isTerminalMatch ? 'none' : { base: '2xl', md: '3xl' }}
            bg={
              isTerminalMatch
                ? 'transparent'
                : isScoringBoard
                  ? 'rgba(255,255,255,0.82)'
                  : 'white'
            }
            boxShadow={
              isTerminalMatch ? 'none' : '0 18px 54px rgba(15, 23, 42, 0.08)'
            }
            overflow="hidden"
            _dark={{
              bg: isTerminalMatch
                ? 'transparent'
                : 'var(--tournament-surface-raised, var(--chakra-colors-gray-800))',
              borderWidth: isTerminalMatch ? 0 : '1px',
              borderColor:
                'var(--tournament-border, var(--chakra-colors-gray-700))',
              boxShadow: isTerminalMatch ? 'none' : 'var(--tournament-shadow)',
            }}
          >
            <Box
              px={
                isTerminalMatch
                  ? 0
                  : isScoringBoard
                    ? { base: 1, md: 2 }
                    : { base: 4, md: 5 }
              }
              py={
                isTerminalMatch
                  ? 0
                  : isScoringBoard
                    ? { base: 1, md: 2 }
                    : { base: 4, md: 5 }
              }
            >
              <VModal
                isOpen={playerInfoOpen}
                onClose={() => setPlayerInfoOpen(false)}
                title={t('playerInfo')}
                size="xl"
                maxBodyHeight={{ base: '72vh', md: '76vh' }}
                hideSecondaryAction
                closeButtonAriaLabel={t('cancel')}
              >
                <HStack justify="flex-end" mb={3}>
                  <Badge
                    variant="subtle"
                    colorPalette="gray"
                    borderRadius="full"
                  >
                    {matchSides.reduce(
                      (total, side) => total + side.players.length,
                      0
                    )}{' '}
                    {t('players')}
                  </Badge>
                </HStack>
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
                  {matchSides.map((side) => (
                    <MatchSideCard
                      key={side.position}
                      teamName={side.teamName}
                      players={side.players}
                      levelLabel={t('level')}
                      noDetailsLabel={t('noPlayerDetails')}
                      getGenderLabel={(gender) =>
                        t(`genderValues.${getGenderTranslationKey(gender)}`)
                      }
                    />
                  ))}
                </SimpleGrid>
              </VModal>

              {match.status === 'SCHEDULED' && (
                <VStack align="stretch" gap={{ base: 4, md: 5 }}>
                  <ScheduledMatchupPreview
                    sides={matchSides}
                    vsLabel={t('vs')}
                  />

                  <Box
                    borderWidth="1px"
                    borderColor="gray.200"
                    borderRadius="2xl"
                    bg="gray.50"
                    px={4}
                    py={4}
                    _dark={{
                      bg: 'var(--tournament-surface-muted, rgba(255, 255, 255, 0.05))',
                      borderColor:
                        'var(--tournament-border, rgba(255, 255, 255, 0.18))',
                    }}
                  >
                    <HStack gap={3} align="start">
                      <Box
                        bg="red.100"
                        color="red.700"
                        borderRadius="full"
                        p={2}
                        _dark={{ bg: 'red.900', color: 'red.200' }}
                      >
                        <ShieldAlert size={18} />
                      </Box>
                      <Box flex="1">
                        <Text fontWeight="semibold" mb={1}>
                          {participantsResolved
                            ? t('matchPrepTitle')
                            : t('awaitingFeedersTitle')}
                        </Text>
                        <Text color="gray.600" _dark={{ color: 'gray.300' }}>
                          {participantsResolved
                            ? t('matchPrepDescription')
                            : t('awaitingFeedersDescription')}
                        </Text>
                      </Box>
                    </HStack>
                  </Box>

                  <Flex
                    direction={{ base: 'column', sm: 'row' }}
                    gap={3}
                    align={{ base: 'stretch', sm: 'center' }}
                    justify="space-between"
                  >
                    <Box>
                      <Text
                        fontSize="sm"
                        color="gray.500"
                        mb={1}
                        _dark={{ color: 'gray.400' }}
                      >
                        {t('scheduledAt')}
                      </Text>
                      <Text fontWeight="semibold">{scheduledTime}</Text>
                    </Box>

                    <HStack gap={2} flexWrap="wrap">
                      <Button
                        variant="ghost"
                        colorPalette="gray"
                        size="lg"
                        onClick={() => setForfeitOpen(true)}
                        borderRadius="xl"
                        disabled={!participantsResolved}
                      >
                        <Flag size={18} /> {t('forfeit')}
                      </Button>
                      <Button
                        colorPalette="green"
                        size="lg"
                        onClick={() => void handleStart()}
                        loading={starting}
                        disabled={!participantsResolved}
                        title={
                          participantsResolved
                            ? undefined
                            : t('awaitingFeedersDescription')
                        }
                        borderRadius="xl"
                        boxShadow="0 10px 24px rgba(22, 163, 74, 0.24)"
                        flex={{ base: '1', sm: 'unset' }}
                      >
                        <Play size={18} /> {t('startMatch')}
                      </Button>
                    </HStack>
                  </Flex>
                </VStack>
              )}

              {match.status === 'IN_PROGRESS' && (
                <Box borderRadius={{ base: 'xl', md: '2xl' }} overflow="hidden">
                  <ScoreEntryBoard
                    match={match}
                    tournamentId={tournament.id}
                    onMatchUpdate={setMatch}
                    onForfeit={() => setForfeitOpen(true)}
                  />
                </Box>
              )}

              {isTerminalMatch && (
                <FinalResultSummary
                  sides={matchSides}
                  score={match.score}
                  sets={match.sets ?? []}
                  statusLabel={t(`status.${match.status}`)}
                  status={match.status}
                  title={t('finalResult')}
                  winnerLabel={t('winner')}
                  setWinsLabel={t('setWins')}
                  backLabel={t('back')}
                  courtLabel={courtLabel}
                  scheduledTime={scheduledTime}
                  onBack={goBack}
                />
              )}

              <ForfeitMatchModal
                isOpen={forfeitOpen}
                onClose={() => setForfeitOpen(false)}
                match={match}
                onForfeited={(updated) => {
                  setForfeitOpen(false);
                  setMatch(updated);
                }}
              />
            </Box>
          </Box>
        </Flex>
      </Box>
    </TournamentRefereeDesktopLayout>
  );
}

function FinalResultSummary({
  sides,
  score,
  sets,
  statusLabel,
  status,
  title,
  winnerLabel,
  setWinsLabel,
  backLabel,
  courtLabel,
  scheduledTime,
  onBack,
}: {
  sides: MatchSideInfo[];
  score?: string;
  sets: NonNullable<CategoryMatch['sets']>;
  statusLabel: string;
  status: CategoryMatch['status'];
  title: string;
  winnerLabel: string;
  setWinsLabel: string;
  backLabel: string;
  courtLabel: string;
  scheduledTime: string;
  onBack: () => void;
}) {
  const [side1, side2] = sides;
  const isCancelled = status === 'CANCELLED';
  const side1SetWins = sets.filter(
    (set) => set.player1Score > set.player2Score
  ).length;
  const side2SetWins = sets.filter(
    (set) => set.player2Score > set.player1Score
  ).length;
  const hasSetScore = sets.length > 0;
  const winnerPosition =
    !isCancelled && hasSetScore && side1SetWins !== side2SetWins
      ? side1SetWins > side2SetWins
        ? 1
        : 2
      : undefined;

  return (
    <Box
      borderWidth="1px"
      borderColor="white"
      borderRadius={{ base: '2xl', md: '3xl' }}
      bg="white"
      boxShadow="0 18px 48px rgba(15, 23, 42, 0.10)"
      overflow="hidden"
      _dark={{
        bg: 'var(--tournament-surface-raised, var(--chakra-colors-gray-800))',
        borderColor: 'var(--tournament-border, rgba(255, 255, 255, 0.18))',
        boxShadow: 'var(--tournament-shadow)',
      }}
    >
      <Box
        px={{ base: 4, md: 6 }}
        py={{ base: 4, md: 5 }}
        bg={isCancelled ? 'gray.50' : 'green.50'}
        borderBottomWidth="1px"
        borderBottomColor={isCancelled ? 'gray.100' : 'green.100'}
        _dark={{
          bg: isCancelled
            ? 'var(--tournament-surface-muted, rgba(255, 255, 255, 0.05))'
            : 'rgba(34, 197, 94, 0.13)',
          borderBottomColor:
            'var(--tournament-border, rgba(255, 255, 255, 0.18))',
        }}
      >
        <HStack justify="space-between" gap={3} align="start">
          <HStack gap={3} minW={0}>
            <Box
              bg={isCancelled ? 'gray.100' : 'green.100'}
              color={isCancelled ? 'gray.700' : 'green.700'}
              borderRadius="full"
              p={{ base: 2.5, md: 3 }}
              flexShrink={0}
              _dark={{
                bg: isCancelled
                  ? 'rgba(148, 163, 184, 0.14)'
                  : 'rgba(34, 197, 94, 0.2)',
                color: isCancelled ? 'gray.200' : 'green.200',
              }}
            >
              <Trophy size={24} />
            </Box>
            <Box minW={0}>
              <Heading size={{ base: 'sm', md: 'md' }}>{title}</Heading>
              <Text
                mt={1}
                color="gray.600"
                fontSize={{ base: 'sm', md: 'md' }}
                _dark={{ color: 'gray.300' }}
              >
                {courtLabel} · {scheduledTime}
              </Text>
            </Box>
          </HStack>
          <Badge
            colorPalette={isCancelled ? 'gray' : 'green'}
            borderRadius="full"
            px={2.5}
            flexShrink={0}
          >
            {statusLabel}
          </Badge>
        </HStack>
      </Box>

      <VStack
        align="stretch"
        gap={{ base: 4, md: 5 }}
        px={{ base: 4, md: 6 }}
        py={{ base: 5, md: 6 }}
      >
        <Box
          borderWidth="1px"
          borderColor={isCancelled ? 'gray.200' : 'green.100'}
          borderRadius="2xl"
          bg={isCancelled ? 'gray.50' : 'green.50'}
          px={{ base: 4, md: 5 }}
          py={{ base: 4, md: 5 }}
          textAlign="center"
          _dark={{
            bg: isCancelled
              ? 'var(--tournament-surface-muted, rgba(255, 255, 255, 0.05))'
              : 'rgba(34, 197, 94, 0.13)',
            borderColor: 'var(--tournament-border, rgba(255, 255, 255, 0.18))',
          }}
        >
          <VStack gap={3}>
            <Text
              fontSize="xs"
              color="gray.500"
              fontWeight="bold"
              textTransform="uppercase"
              _dark={{ color: 'gray.400' }}
            >
              {isCancelled ? statusLabel : title}
            </Text>
            <Text
              fontSize={{ base: '5xl', md: '6xl' }}
              lineHeight={1}
              fontWeight="black"
              textAlign="center"
              wordBreak="break-word"
            >
              {hasSetScore ? `${side1SetWins} - ${side2SetWins}` : score || '—'}
            </Text>
            {sets.length > 0 && (
              <Flex gap={2} wrap="wrap" justify="center">
                {sets.map((set) => (
                  <Badge
                    key={set.setNumber}
                    colorPalette={
                      set.player1Score === set.player2Score
                        ? 'gray'
                        : set.player1Score > set.player2Score
                          ? 'green'
                          : 'purple'
                    }
                    variant="subtle"
                    fontSize={{ base: 'xs', md: 'sm' }}
                    borderRadius="full"
                    px={3}
                    py={1}
                  >
                    {set.player1Score}-{set.player2Score}
                  </Badge>
                ))}
              </Flex>
            )}
          </VStack>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
          <FinalResultSide
            side={side1}
            setWins={side1SetWins}
            isWinner={winnerPosition === 1}
            isCancelled={isCancelled}
            winnerLabel={winnerLabel}
            setWinsLabel={setWinsLabel}
          />
          <FinalResultSide
            side={side2}
            setWins={side2SetWins}
            isWinner={winnerPosition === 2}
            isCancelled={isCancelled}
            winnerLabel={winnerLabel}
            setWinsLabel={setWinsLabel}
          />
        </SimpleGrid>

        <Button
          alignSelf={{ base: 'stretch', sm: 'center' }}
          variant="outline"
          colorPalette="green"
          onClick={onBack}
          borderRadius="lg"
          minW={{ base: 'auto', sm: '160px' }}
          h={11}
        >
          {backLabel}
        </Button>
      </VStack>
    </Box>
  );
}

function FinalResultSide({
  side,
  setWins,
  isWinner,
  isCancelled,
  winnerLabel,
  setWinsLabel,
}: {
  side?: MatchSideInfo;
  setWins: number;
  isWinner?: boolean;
  isCancelled: boolean;
  winnerLabel: string;
  setWinsLabel: string;
}) {
  const players = side?.players ?? [];
  const playerNames =
    players.length > 0 ? players.map((player) => player.name) : [];

  return (
    <Box
      minW={0}
      borderWidth="1px"
      borderColor={isWinner ? 'green.300' : 'gray.200'}
      borderRadius="2xl"
      bg={isWinner ? 'green.50' : 'white'}
      px={{ base: 4, md: 5 }}
      py={4}
      boxShadow={isWinner ? '0 14px 30px rgba(22, 163, 74, 0.12)' : 'sm'}
      _dark={{
        bg: isWinner
          ? 'rgba(34, 197, 94, 0.13)'
          : 'var(--tournament-surface-muted, rgba(255, 255, 255, 0.05))',
        borderColor: isWinner
          ? 'rgba(74, 222, 128, 0.34)'
          : 'var(--tournament-border, rgba(255, 255, 255, 0.18))',
        boxShadow: isWinner ? '0 14px 34px rgba(34, 197, 94, 0.1)' : 'none',
      }}
    >
      <Flex align="start" justify="space-between" gap={3}>
        <Box minW={0}>
          <HStack gap={2} mb={2} flexWrap="wrap">
            <Badge
              colorPalette={isWinner ? 'green' : 'gray'}
              variant={isWinner ? 'solid' : 'subtle'}
              borderRadius="full"
              px={2.5}
            >
              {side?.teamName ?? '—'}
            </Badge>
            {isWinner && !isCancelled && (
              <Badge colorPalette="yellow" borderRadius="full" px={2.5}>
                <Trophy size={12} /> {winnerLabel}
              </Badge>
            )}
          </HStack>

          <VStack align="stretch" gap={1.5}>
            {playerNames.length > 0 ? (
              playerNames.map((name, index) => (
                <Text
                  key={`${side?.position ?? 'side'}-${index}-${name}`}
                  fontSize={{ base: 'lg', md: 'xl' }}
                  lineHeight={1.2}
                  fontWeight="black"
                  wordBreak="break-word"
                >
                  {name}
                </Text>
              ))
            ) : (
              <Text
                fontSize={{ base: 'lg', md: 'xl' }}
                lineHeight={1.2}
                fontWeight="black"
                color="gray.400"
                _dark={{ color: 'gray.500' }}
              >
                —
              </Text>
            )}
          </VStack>
        </Box>

        <Box
          minW="76px"
          borderRadius="xl"
          bg={isWinner ? 'green.600' : 'gray.100'}
          color={isWinner ? 'white' : 'gray.700'}
          px={3}
          py={2}
          textAlign="center"
          _dark={{
            bg: isWinner ? 'green.500' : 'whiteAlpha.100',
            color: isWinner ? 'white' : 'gray.200',
          }}
        >
          <Text fontSize="xs" fontWeight="bold" lineHeight={1.1}>
            {setWinsLabel}
          </Text>
          <Text mt={1} fontSize="2xl" lineHeight={1} fontWeight="black">
            {setWins}
          </Text>
        </Box>
      </Flex>
    </Box>
  );
}

function ScheduledMatchupPreview({
  sides,
  vsLabel,
}: {
  sides: MatchSideInfo[];
  vsLabel: string;
}) {
  const [side1, side2] = sides;

  return (
    <Flex
      align="stretch"
      justify="center"
      gap={{ base: 2, md: 3 }}
      w="full"
      py={{ base: 1, md: 2 }}
    >
      <ScheduledSideCard side={side1} align="right" />

      <Flex align="center" justify="center" flexShrink={0}>
        <Text
          as="span"
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
          minW={{ base: '36px', md: '44px' }}
          h={{ base: '36px', md: '44px' }}
          px={2}
          borderRadius="full"
          bg="green.600"
          color="white"
          fontSize={{ base: 'xs', md: 'sm' }}
          fontWeight="black"
          boxShadow="0 10px 24px rgba(22, 163, 74, 0.22)"
          textTransform="uppercase"
        >
          {vsLabel}
        </Text>
      </Flex>

      <ScheduledSideCard side={side2} align="left" />
    </Flex>
  );
}

function ScheduledSideCard({
  side,
  align,
}: {
  side?: MatchSideInfo;
  align: 'left' | 'right';
}) {
  const players = side?.players ?? [];
  const textAlign = align === 'right' ? 'right' : 'left';

  return (
    <Box
      flex="1"
      minW={0}
      borderWidth="1px"
      borderColor="green.100"
      borderRadius={{ base: 'xl', md: '2xl' }}
      bg="whiteAlpha.900"
      px={{ base: 3, md: 5 }}
      py={{ base: 3, md: 4 }}
      boxShadow="0 10px 28px rgba(15, 23, 42, 0.06)"
      _dark={{ bg: 'whiteAlpha.50', borderColor: 'whiteAlpha.200' }}
    >
      <Text
        color="green.700"
        fontSize="xs"
        fontWeight="bold"
        textAlign={textAlign}
        whiteSpace="nowrap"
        overflow="hidden"
        textOverflow="ellipsis"
        _dark={{ color: 'green.200' }}
      >
        {side?.teamName ?? '—'}
      </Text>

      <VStack
        align={align === 'right' ? 'end' : 'start'}
        gap={{ base: 0.5, md: 1 }}
        mt={{ base: 2, md: 2.5 }}
      >
        {players.length > 0 ? (
          players.map((player, index) => (
            <Text
              key={`${player.id}-${index}`}
              fontSize={{ base: 'md', md: 'xl' }}
              lineHeight={1.2}
              fontWeight="bold"
              textAlign={textAlign}
              wordBreak="break-word"
            >
              {player.name}
            </Text>
          ))
        ) : (
          <Text
            fontSize={{ base: 'md', md: 'xl' }}
            lineHeight={1.2}
            fontWeight="bold"
            color="gray.400"
            textAlign={textAlign}
            _dark={{ color: 'gray.500' }}
          >
            —
          </Text>
        )}
      </VStack>
    </Box>
  );
}

interface MatchPlayerInfo {
  id: string;
  name: string;
  code?: string;
  image?: string;
  email?: string;
  phone?: string;
  gender?: string;
  level?: number;
  levelDescription?: string;
  notes?: string;
}

interface MatchSideInfo {
  position: number;
  teamName: string;
  players: MatchPlayerInfo[];
}

function getMatchSides(match: CategoryMatch): MatchSideInfo[] {
  const participants = [...(match.participants ?? [])].sort(
    (a, b) => a.position - b.position
  );

  return [1, 2].map((position) => {
    const participant = participants.find((p) => p.position === position);
    return {
      position,
      teamName: getTeamLabel(match, position as 1 | 2),
      players: participant?.categoryRegistration
        ? getPlayersFromRegistration(participant.categoryRegistration)
        : [],
    };
  });
}

function getPlayersFromRegistration(
  registration: CategoryRegistration
): MatchPlayerInfo[] {
  if (registration.player) {
    return [toMatchPlayerInfo(registration.player)];
  }

  const pairMembers = registration.pair?.members ?? [];
  if (pairMembers.length > 0) {
    return pairMembers
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((member) =>
        member.player
          ? toMatchPlayerInfo(member.player)
          : {
              id: member.playerId,
              name: `#${member.playerId.slice(0, 6)}`,
            }
      );
  }

  if (registration.pair?.name) {
    return [
      {
        id: registration.pair.id,
        name: registration.pair.name,
      },
    ];
  }

  return [];
}

function toMatchPlayerInfo(player: TournamentPlayer): MatchPlayerInfo {
  return {
    id: player.id,
    name: player.name,
    code: player.code,
    image: player.image ?? player.user?.image,
    email: player.email,
    phone: player.phone,
    gender: player.gender,
    level: player.level,
    levelDescription: player.levelDescription,
    notes: player.notes,
  };
}

function MatchSideCard({
  teamName,
  players,
  levelLabel,
  noDetailsLabel,
  getGenderLabel,
}: {
  teamName: string;
  players: MatchPlayerInfo[];
  levelLabel: string;
  noDetailsLabel: string;
  getGenderLabel: (gender: string) => string;
}) {
  return (
    <Box
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="xl"
      bg="white"
      overflow="hidden"
      _dark={{ bg: 'whiteAlpha.50', borderColor: 'whiteAlpha.200' }}
    >
      <HStack
        px={4}
        py={2.5}
        gap={2}
        justify="space-between"
        bg="gray.50"
        borderBottomWidth="1px"
        borderBottomColor="gray.100"
        _dark={{ bg: 'whiteAlpha.100', borderBottomColor: 'whiteAlpha.200' }}
      >
        <Text
          fontWeight="bold"
          whiteSpace="nowrap"
          overflow="hidden"
          textOverflow="ellipsis"
        >
          {teamName}
        </Text>
        {players.length > 0 && (
          <Badge variant="subtle" colorPalette="gray" borderRadius="full">
            {players.length}
          </Badge>
        )}
      </HStack>

      <VStack align="stretch" gap={0}>
        {players.length > 0 ? (
          players.map((player, index) => (
            <PlayerInfoRow
              key={`${player.id}-${index}`}
              player={player}
              levelLabel={levelLabel}
              getGenderLabel={getGenderLabel}
            />
          ))
        ) : (
          <Text px={4} py={4} color="gray.500" _dark={{ color: 'gray.400' }}>
            {noDetailsLabel}
          </Text>
        )}
      </VStack>
    </Box>
  );
}

function PlayerInfoRow({
  player,
  levelLabel,
  getGenderLabel,
}: {
  player: MatchPlayerInfo;
  levelLabel: string;
  getGenderLabel: (gender: string) => string;
}) {
  const metas: Array<{ icon: ReactNode; value: string }> = [];
  if (player.gender)
    metas.push({
      icon: <VenusAndMars size={13} />,
      value: getGenderLabel(player.gender),
    });
  if (player.level != null)
    metas.push({
      icon: <Signal size={13} />,
      value: `${levelLabel} ${player.level}`,
    });
  if (player.email)
    metas.push({ icon: <Mail size={13} />, value: player.email });
  if (player.phone)
    metas.push({ icon: <Phone size={13} />, value: player.phone });
  if (player.notes)
    metas.push({ icon: <NotebookText size={13} />, value: player.notes });

  return (
    <HStack
      px={4}
      py={3}
      gap={3}
      align="start"
      borderBottomWidth="1px"
      borderBottomColor="gray.100"
      _last={{ borderBottomWidth: 0 }}
      _dark={{ borderBottomColor: 'whiteAlpha.200' }}
    >
      <Avatar.Root size="sm" borderRadius="full" flexShrink={0}>
        <Avatar.Fallback name={player.name}>
          <UserRound size={16} />
        </Avatar.Fallback>
        {player.image && <Avatar.Image src={player.image} />}
      </Avatar.Root>

      <Box minW={0} flex="1">
        <HStack gap={2} align="center" flexWrap="wrap">
          <Text fontWeight="semibold" lineHeight={1.2}>
            {player.name}
          </Text>
          {player.code && (
            <Badge colorPalette="green" variant="subtle" borderRadius="full">
              {player.code}
            </Badge>
          )}
        </HStack>

        {player.levelDescription && (
          <Text
            fontSize="xs"
            color="gray.500"
            mt={0.5}
            _dark={{ color: 'gray.400' }}
          >
            {player.levelDescription}
          </Text>
        )}

        {metas.length > 0 && (
          <Flex gap={3} rowGap={1} mt={1.5} flexWrap="wrap">
            {metas.map((meta, index) => (
              <HStack
                key={index}
                gap={1}
                minW={0}
                color="gray.600"
                _dark={{ color: 'gray.300' }}
              >
                <Box flexShrink={0}>{meta.icon}</Box>
                <Text fontSize="xs" fontWeight="medium" wordBreak="break-word">
                  {meta.value}
                </Text>
              </HStack>
            ))}
          </Flex>
        )}
      </Box>
    </HStack>
  );
}
