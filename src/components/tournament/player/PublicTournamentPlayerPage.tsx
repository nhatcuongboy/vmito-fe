'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import QRCode from 'qrcode';
import { Badge, Box, Flex, Heading, Text } from '@chakra-ui/react';
import { Button, HStack, VStack } from '@/components/ui/chakra-compat';
import PageLayout from '@/components/layout/PageLayout';
import { useRouter } from '@/i18n/config';
import { useParams } from 'next/navigation';
import { toaster } from '@/components/ui/toaster';
import { CategoryService } from '@/lib/api/category.service';
import { TournamentPlayerService } from '@/lib/api/tournament-player.service';
import { TournamentService } from '@/lib/api/tournament.service';
import {
  Category,
  CategoryMatch,
  CategoryRegistration,
  CategoryType,
  MatchStatus,
  Tournament,
  TournamentPlayer,
} from '@/lib/api/types';
import {
  CalendarDays,
  Check,
  ChevronLeft,
  Copy,
  MapPin,
  Medal,
  QrCode,
  Trophy,
  UserRound,
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { AuthService } from '@/lib/api/auth.service';
import { ROUTES } from '@/constants';
import AiAssistantTopBarButton from '@/components/ui/AiAssistantTopBarButton';
import NotificationBell from '@/components/ui/NotificationBell';
import UserMenu from '@/components/ui/UserMenu';
import { PublicTournamentProfileSkeleton } from '@/components/tournament/skeletons';
import {
  getLegacyTournamentPlayerCode,
  getUniqueLegacyTournamentPlayerCode,
  matchesTournamentPlayerCode,
} from '@/lib/tournament/codes';
import { getRoundDisplayLabel } from '@/lib/tournament/roundLabel';

function TournamentTopBarMenu() {
  const router = useRouter();
  const { isAuthenticated, isHydrated, isLoading } = useAuthStore();

  const handleLogout = () => {
    AuthService.logout();
    router.push(ROUTES.HOME);
  };

  if (!isHydrated || isLoading) return null;
  if (!isAuthenticated) return null;

  return (
    <Flex align="center" gap={2}>
      <AiAssistantTopBarButton />
      <NotificationBell color="fg" _hover={{ bg: 'bg.muted' }} />
      <UserMenu onLogout={handleLogout} />
    </Flex>
  );
}

interface PlayerCategorySummary {
  id: string;
  name: string;
  type: CategoryType;
  teamName: string;
}

type ResolvedPlayerState =
  | { status: 'found'; player: TournamentPlayer }
  | { status: 'missing' }
  | { status: 'ambiguous' };

const MATCH_STATUS_COLORS: Record<MatchStatus, string> = {
  [MatchStatus.SCHEDULED]: 'blue',
  [MatchStatus.IN_PROGRESS]: 'orange',
  [MatchStatus.FINISHED]: 'green',
  [MatchStatus.CANCELLED]: 'gray',
};

export const getTournamentPlayerCode = (playerId: string) =>
  getLegacyTournamentPlayerCode(playerId);

export const getUniqueTournamentPlayerCode = (
  playerId: string,
  tournamentPlayerIds: string[]
) => getUniqueLegacyTournamentPlayerCode(playerId, tournamentPlayerIds);

const formatDate = (value: Date | string | undefined, locale: string) => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const formatDateTime = (
  value: Date | string | undefined,
  locale: string,
  fallback: string
) => {
  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const getCategoryName = (
  category: Category,
  categoryTypeLabels: Record<CategoryType, string>
) => category.name?.trim() || categoryTypeLabels[category.type];

const getRegistrationName = (
  registration: CategoryRegistration,
  fallback: string
) =>
  registration.player?.name ||
  registration.pair?.name ||
  registration.pair?.members
    ?.map((member) => member.player?.name)
    .filter(Boolean)
    .join(' & ') ||
  fallback;

const registrationIncludesPlayer = (
  registration: CategoryRegistration,
  playerId: string
) => {
  if (registration.tournamentPlayerId === playerId) return true;
  if (registration.player?.id === playerId) return true;

  return (
    registration.pair?.members?.some(
      (member) => member.playerId === playerId || member.player?.id === playerId
    ) ?? false
  );
};

const resolvePlayerByCode = (
  players: TournamentPlayer[],
  playerCode: string
): ResolvedPlayerState => {
  const matches = players.filter((player) =>
    matchesTournamentPlayerCode(player, playerCode)
  );

  if (matches.length === 0) return { status: 'missing' };
  if (matches.length > 1) return { status: 'ambiguous' };

  return { status: 'found', player: matches[0] };
};

const buildPlayerCategories = async (
  categories: Category[],
  playerId: string,
  categoryTypeLabels: Record<CategoryType, string>,
  defaultTeamName: string
) => {
  const categorySummaries = await Promise.all(
    categories.map(async (category) => {
      const registrations = await CategoryService.getRegistrations(category.id);
      const playerRegistration = registrations.find((registration) =>
        registrationIncludesPlayer(registration, playerId)
      );

      if (!playerRegistration) return null;

      return {
        id: category.id,
        name: getCategoryName(category, categoryTypeLabels),
        type: category.type,
        teamName: getRegistrationName(playerRegistration, defaultTeamName),
      } satisfies PlayerCategorySummary;
    })
  );

  return categorySummaries.filter(
    (category): category is PlayerCategorySummary => category !== null
  );
};

const getMatchTitle = (
  match: CategoryMatch,
  categories: Category[],
  categoryTypeLabels: Record<CategoryType, string>,
  defaultCategory: string,
  roundLabel: string
) => {
  const category = categories.find((item) => item.id === match.categoryId);
  const categoryName = category
    ? getCategoryName(category, categoryTypeLabels)
    : defaultCategory;
  return `${categoryName} · ${roundLabel}`;
};

const getMatchOpponentNames = (
  match: CategoryMatch,
  playerId: string,
  defaultTeamName: string,
  noOpponent: string
) => {
  const opponents =
    match.participants
      ?.filter((participant) => {
        if (!participant.categoryRegistration) return false;
        return !registrationIncludesPlayer(
          participant.categoryRegistration,
          playerId
        );
      })
      .map((participant) =>
        participant.categoryRegistration
          ? getRegistrationName(
              participant.categoryRegistration,
              defaultTeamName
            )
          : ''
      )
      .filter(Boolean) ?? [];

  return opponents.length > 0 ? opponents.join(' / ') : noOpponent;
};

export default function PublicTournamentPlayerPage() {
  const t = useTranslations('pages.tournaments.playerPage');
  const tRounds = useTranslations('pages.tournaments.playerPage.rounds');
  const tCategoryTypes = useTranslations(
    'pages.tournaments.playerPage.categoryTypes'
  );
  const tMatchStatuses = useTranslations(
    'pages.tournaments.playerPage.matchStatuses'
  );
  const locale = useLocale();
  const dateLocale =
    locale === 'vi' ? 'vi-VN' : locale === 'cn' ? 'zh-CN' : 'en-US';

  const categoryTypeLabels = useMemo<Record<CategoryType, string>>(
    () => ({
      [CategoryType.MENS_SINGLE]: tCategoryTypes('MENS_SINGLE'),
      [CategoryType.WOMENS_SINGLE]: tCategoryTypes('WOMENS_SINGLE'),
      [CategoryType.MENS_DOUBLE]: tCategoryTypes('MENS_DOUBLE'),
      [CategoryType.WOMENS_DOUBLE]: tCategoryTypes('WOMENS_DOUBLE'),
      [CategoryType.MIXED_DOUBLE]: tCategoryTypes('MIXED_DOUBLE'),
      [CategoryType.CUSTOM]: tCategoryTypes('CUSTOM'),
    }),
    [tCategoryTypes]
  );
  const matchStatusLabels = useMemo<Record<MatchStatus, string>>(
    () => ({
      [MatchStatus.SCHEDULED]: tMatchStatuses('SCHEDULED'),
      [MatchStatus.IN_PROGRESS]: tMatchStatuses('IN_PROGRESS'),
      [MatchStatus.FINISHED]: tMatchStatuses('FINISHED'),
      [MatchStatus.CANCELLED]: tMatchStatuses('CANCELLED'),
    }),
    [tMatchStatuses]
  );

  const params = useParams();
  const router = useRouter();
  const tournamentId = params.tournamentId as string;
  const playerCode = params.playerCode as string;

  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [playerState, setPlayerState] = useState<ResolvedPlayerState>({
    status: 'missing',
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [playerCategories, setPlayerCategories] = useState<
    PlayerCategorySummary[]
  >([]);
  const [matches, setMatches] = useState<CategoryMatch[]>([]);

  const sharePath = useMemo(
    () => `/t/${tournamentId}/p/${playerCode}`,
    [playerCode, tournamentId]
  );

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return sharePath;
    return `${window.location.origin}${window.location.pathname}`;
  }, [sharePath]);

  const loadPlayerPage = useCallback(async () => {
    try {
      setLoading(true);
      const tournamentData =
        await TournamentService.getTournament(tournamentId);
      const [players, categoryData] = await Promise.all([
        TournamentPlayerService.getPlayers(tournamentData.id),
        CategoryService.getCategories(tournamentData.id),
      ]);
      const resolvedPlayer = resolvePlayerByCode(players, playerCode);

      setTournament(tournamentData);
      setCategories(categoryData);
      setPlayerState(resolvedPlayer);

      if (resolvedPlayer.status !== 'found') {
        setPlayerCategories([]);
        setMatches([]);
        return;
      }

      const [categorySummaries, playerMatches] = await Promise.all([
        buildPlayerCategories(
          categoryData,
          resolvedPlayer.player.id,
          categoryTypeLabels,
          t('defaultTeamName')
        ),
        TournamentPlayerService.getPlayerMatches(resolvedPlayer.player.id),
      ]);

      setPlayerCategories(categorySummaries);
      setMatches(playerMatches);
    } catch (error) {
      console.error('Error loading tournament player page:', error);
      setTournament(null);
      setPlayerState({ status: 'missing' });
      setPlayerCategories([]);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [playerCode, tournamentId, categoryTypeLabels, t]);

  useEffect(() => {
    loadPlayerPage();
  }, [loadPlayerPage]);

  useEffect(() => {
    if (playerState.status !== 'found') return;

    QRCode.toDataURL(shareUrl, {
      width: 184,
      margin: 2,
      color: {
        dark: '#111827',
        light: '#FFFFFF',
      },
    })
      .then((dataUrl) => setQrDataUrl(dataUrl))
      .catch((error) => {
        console.error('QR code generation error:', error);
      });
  }, [playerState.status, shareUrl]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toaster.success({ title: t('copySuccess') });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toaster.error({ title: t('copyError') });
    }
  };

  if (loading) {
    return (
      <PageLayout
        title={t('title')}
        showBackButton={false}
        topBarVariant="main"
        showTopBarMenuButton={false}
        showTopBarLogo={false}
        showTopBarAuthActions={false}
        disableSidebarOffset
        rightContent={<TournamentTopBarMenu />}
      >
        <PublicTournamentProfileSkeleton />
      </PageLayout>
    );
  }

  if (!tournament || playerState.status !== 'found') {
    const message =
      playerState.status === 'ambiguous'
        ? t('ambiguousCode')
        : t('playerNotFound');

    return (
      <PageLayout
        title={t('title')}
        showBackButton={false}
        topBarVariant="main"
        showTopBarMenuButton={false}
        showTopBarLogo={false}
        showTopBarAuthActions={false}
        disableSidebarOffset
        rightContent={<TournamentTopBarMenu />}
      >
        <VStack align="stretch" gap={4}>
          <Button
            alignSelf="flex-start"
            variant="ghost"
            colorPalette="gray"
            leftIcon={<ChevronLeft size={16} />}
            onClick={() => router.push(`/tournament/${tournamentId}/teams`)}
          >
            {t('backToList')}
          </Button>
          <Box
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="xl"
            bg="white"
            p={6}
          >
            <Heading size="md" mb={2}>
              {t('errorTitle')}
            </Heading>
            <Text color="gray.600">{message}</Text>
          </Box>
        </VStack>
      </PageLayout>
    );
  }

  const { player } = playerState;
  const tournamentDates =
    formatDate(tournament.startDate, dateLocale) ===
    formatDate(tournament.endDate, dateLocale)
      ? formatDate(tournament.startDate, dateLocale)
      : `${formatDate(tournament.startDate, dateLocale)} - ${formatDate(
          tournament.endDate,
          dateLocale
        )}`;

  return (
    <PageLayout
      title={t('title')}
      showBackButton={false}
      topBarVariant="main"
      showTopBarMenuButton={false}
      showTopBarLogo={false}
      showTopBarAuthActions={false}
      disableSidebarOffset
      rightContent={<TournamentTopBarMenu />}
      maxW="container.lg"
      bg="gray.50"
    >
      <VStack align="stretch" gap={5}>
        <Button
          alignSelf="flex-start"
          variant="ghost"
          colorPalette="gray"
          leftIcon={<ChevronLeft size={16} />}
          onClick={() => router.push(`/tournament/${tournamentId}/teams`)}
        >
          {t('backToListShort')}
        </Button>

        <Box
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="xl"
          bg="white"
          overflow="hidden"
        >
          <Box bg="green.600" color="white" px={{ base: 5, md: 6 }} py={6}>
            <VStack align="stretch" gap={4}>
              <Flex align="center" gap={3}>
                <Flex
                  w="48px"
                  h="48px"
                  borderRadius="full"
                  bg="whiteAlpha.300"
                  align="center"
                  justify="center"
                  flexShrink={0}
                >
                  <UserRound size={26} />
                </Flex>
                <Box minW={0}>
                  <Text fontSize="sm" opacity={0.9}>
                    {t('athleteLabel')}
                  </Text>
                  <Heading size={{ base: 'lg', md: 'xl' }} lineHeight="short">
                    {player.name}
                  </Heading>
                </Box>
              </Flex>

              <VStack align="stretch" gap={2}>
                <HStack gap={2}>
                  <Trophy size={16} />
                  <Text fontWeight="medium">{tournament.name}</Text>
                </HStack>
                {tournamentDates && (
                  <HStack gap={2}>
                    <CalendarDays size={16} />
                    <Text>{tournamentDates}</Text>
                  </HStack>
                )}
                {tournament.venue?.name && (
                  <HStack gap={2}>
                    <MapPin size={16} />
                    <Text>{tournament.venue.name}</Text>
                  </HStack>
                )}
              </VStack>
            </VStack>
          </Box>

          <Flex
            direction={{ base: 'column', md: 'row' }}
            align={{ base: 'stretch', md: 'flex-start' }}
            gap={6}
            p={{ base: 5, md: 6 }}
          >
            <VStack align="stretch" gap={5} flex="1" minW={0}>
              <Box>
                <HStack gap={2} mb={3}>
                  <Medal size={18} color="var(--chakra-colors-green-600)" />
                  <Heading size="md">{t('categoriesTitle')}</Heading>
                </HStack>

                {playerCategories.length === 0 ? (
                  <Text color="gray.500">{t('noCategories')}</Text>
                ) : (
                  <VStack align="stretch" gap={3}>
                    {playerCategories.map((category) => (
                      <Box
                        key={category.id}
                        borderWidth="1px"
                        borderColor="gray.200"
                        borderRadius="lg"
                        p={4}
                      >
                        <Flex
                          justify="space-between"
                          align="flex-start"
                          gap={3}
                          wrap="wrap"
                        >
                          <Box minW={0}>
                            <Text fontWeight="semibold">{category.name}</Text>
                            <Text color="gray.600" fontSize="sm" mt={1}>
                              {category.teamName}
                            </Text>
                          </Box>
                          <Badge colorPalette="green">
                            {categoryTypeLabels[category.type]}
                          </Badge>
                        </Flex>
                      </Box>
                    ))}
                  </VStack>
                )}
              </Box>

              <Box>
                <HStack gap={2} mb={3}>
                  <CalendarDays
                    size={18}
                    color="var(--chakra-colors-green-600)"
                  />
                  <Heading size="md">{t('scheduleTitle')}</Heading>
                </HStack>

                {matches.length === 0 ? (
                  <Text color="gray.500">{t('noMatches')}</Text>
                ) : (
                  <VStack align="stretch" gap={3}>
                    {matches.map((match) => (
                      <Box
                        key={match.id}
                        borderWidth="1px"
                        borderColor="gray.200"
                        borderRadius="lg"
                        p={4}
                      >
                        <Flex
                          justify="space-between"
                          align="flex-start"
                          gap={3}
                          wrap="wrap"
                        >
                          <Box minW={0}>
                            <Text fontWeight="semibold">
                              {getMatchTitle(
                                match,
                                categories,
                                categoryTypeLabels,
                                t('defaultCategory'),
                                getRoundDisplayLabel(match.round, tRounds)
                              )}
                            </Text>
                            <Text color="gray.600" fontSize="sm" mt={1}>
                              {t('opponentLabel')}:{' '}
                              {getMatchOpponentNames(
                                match,
                                player.id,
                                t('defaultTeamName'),
                                t('noOpponent')
                              )}
                            </Text>
                            <Text color="gray.600" fontSize="sm" mt={1}>
                              {formatDateTime(
                                match.startTime,
                                dateLocale,
                                t('noSchedule')
                              )}
                              {match.court?.courtName
                                ? ` · ${match.court.courtName}`
                                : match.court?.courtNumber
                                  ? ` · ${t('courtPrefix', { number: match.court.courtNumber })}`
                                  : ''}
                            </Text>
                            {match.score && (
                              <Text fontWeight="medium" mt={2}>
                                {t('scoreLabel')}: {match.score}
                              </Text>
                            )}
                          </Box>
                          <Badge
                            colorPalette={MATCH_STATUS_COLORS[match.status]}
                          >
                            {matchStatusLabels[match.status]}
                          </Badge>
                        </Flex>
                      </Box>
                    ))}
                  </VStack>
                )}
              </Box>
            </VStack>

            <Box
              w={{ base: 'full', md: '180px' }}
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="xl"
              p={2.5}
              bg="gray.50"
              flexShrink={0}
            >
              <VStack gap={2} align="stretch">
                <HStack gap={2}>
                  <QrCode size={16} />
                  <Text fontSize="sm" fontWeight="semibold">
                    {t('qrTitle')}
                  </Text>
                </HStack>
                <Box bg="white" borderRadius="lg" p={2}>
                  {qrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={qrDataUrl}
                      alt="QR code"
                      width={136}
                      height={136}
                      style={{ display: 'block' }}
                    />
                  ) : (
                    <Box w="136px" h="136px" />
                  )}
                </Box>
                <Button
                  w="full"
                  size="sm"
                  variant="outline"
                  colorPalette={copied ? 'green' : 'gray'}
                  leftIcon={copied ? <Check size={14} /> : <Copy size={14} />}
                  onClick={copyLink}
                >
                  {copied ? t('copied') : t('copyLink')}
                </Button>
              </VStack>
            </Box>
          </Flex>
        </Box>
      </VStack>
    </PageLayout>
  );
}
