'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Badge, Box, Flex, Heading, Image, Text } from '@chakra-ui/react';
import { HStack, VStack } from '@/components/ui/chakra-compat';
import PageLayout from '@/components/layout/PageLayout';
import { useRouter } from '@/i18n/config';
import { useParams } from 'next/navigation';
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
import { CalendarDays, MapPin, Medal, Trophy, UserRound } from 'lucide-react';
import TournamentTopBarMenu from '@/components/tournament/TournamentTopBarMenu';
import { PublicTournamentPlayerSkeleton } from '@/components/tournament/skeletons';
import {
  getLegacyTournamentPlayerCode,
  getUniqueLegacyTournamentPlayerCode,
  matchesTournamentPlayerCode,
} from '@/lib/tournament/codes';
import { getRoundDisplayLabel } from '@/lib/tournament/roundLabel';
import TournamentQrBar from '@/components/tournament/TournamentQrBar';
import { useCanGoBack } from '@/hooks/useCanGoBack';
import TournamentProfileHero, {
  getTournamentCoverImage,
} from './TournamentProfileHero';

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
  const canGoBack = useCanGoBack();
  const backHref = `/tournament/${tournamentId}/teams`;
  const handleBack = useCallback(() => router.back(), [router]);
  const contextualBack = canGoBack ? handleBack : undefined;

  const [loading, setLoading] = useState(true);
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

  if (loading) {
    return (
      <PageLayout
        title={t('title')}
        showBackButton
        backHref={backHref}
        onBack={contextualBack}
        topBarVariant="main"
        showTopBarMenuButton={false}
        showTopBarLogo={false}
        showTopBarAuthActions={false}
        disableSidebarOffset
        rightContent={<TournamentTopBarMenu />}
        maxW="container.lg"
        bg="gray.50"
        _dark={{ bg: 'gray.900' }}
      >
        <PublicTournamentPlayerSkeleton />
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
        showBackButton
        backHref={backHref}
        onBack={contextualBack}
        topBarVariant="main"
        showTopBarMenuButton={false}
        showTopBarLogo={false}
        showTopBarAuthActions={false}
        disableSidebarOffset
        rightContent={<TournamentTopBarMenu />}
      >
        <VStack align="stretch" gap={4}>
          <Box
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="xl"
            bg="white"
            p={6}
            _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
          >
            <Heading size="md" mb={2}>
              {t('errorTitle')}
            </Heading>
            <Text color="gray.600" _dark={{ color: 'gray.300' }}>
              {message}
            </Text>
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
  const coverImage = getTournamentCoverImage(tournament);
  const avatarSrc = player.image || player.user?.image;

  return (
    <PageLayout
      title={t('title')}
      showBackButton
      backHref={backHref}
      onBack={contextualBack}
      topBarVariant="main"
      showTopBarMenuButton={false}
      showTopBarLogo={false}
      showTopBarAuthActions={false}
      disableSidebarOffset
      rightContent={<TournamentTopBarMenu />}
      maxW="container.lg"
      bg="gray.50"
      _dark={{ bg: 'gray.900' }}
    >
      <VStack align="stretch" gap={5}>
        <Box
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="2xl"
          bg="white"
          overflow="hidden"
          boxShadow="0 20px 60px rgba(15, 23, 42, 0.08)"
          _dark={{
            bg: 'gray.800',
            borderColor: 'gray.700',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.28)',
          }}
        >
          <TournamentProfileHero
            coverImage={coverImage}
            label={t('athleteLabel')}
            title={player.name}
            visual={
              avatarSrc ? (
                <Box
                  w={{ base: '70px', md: '86px' }}
                  h={{ base: '70px', md: '86px' }}
                  borderRadius="full"
                  overflow="hidden"
                  borderWidth="3px"
                  borderColor="whiteAlpha.800"
                  boxShadow="0 16px 36px rgba(0, 0, 0, 0.28)"
                  flexShrink={0}
                >
                  <Image
                    src={avatarSrc}
                    alt={player.name}
                    w="full"
                    h="full"
                    objectFit="cover"
                  />
                </Box>
              ) : (
                <Flex
                  w={{ base: '70px', md: '86px' }}
                  h={{ base: '70px', md: '86px' }}
                  borderRadius="full"
                  bg="whiteAlpha.300"
                  borderWidth="1px"
                  borderColor="whiteAlpha.500"
                  align="center"
                  justify="center"
                  boxShadow="0 16px 36px rgba(0, 0, 0, 0.24)"
                  flexShrink={0}
                >
                  <UserRound size={36} />
                </Flex>
              )
            }
            meta={
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
            }
          />

          <Flex
            direction={{ base: 'column', md: 'row' }}
            align={{ base: 'stretch', md: 'flex-start' }}
            gap={6}
            p={{ base: 5, md: 7 }}
          >
            <VStack align="stretch" gap={7} flex="1" minW={0}>
              <Box>
                <HStack gap={2} mb={3}>
                  <Medal size={18} color="var(--chakra-colors-green-600)" />
                  <Heading size="md">{t('categoriesTitle')}</Heading>
                </HStack>

                {playerCategories.length === 0 ? (
                  <Text color="gray.500" _dark={{ color: 'gray.400' }}>
                    {t('noCategories')}
                  </Text>
                ) : (
                  <VStack align="stretch" gap={3}>
                    {playerCategories.map((category) => (
                      <Box
                        key={category.id}
                        borderWidth="1px"
                        borderColor="gray.200"
                        borderRadius="xl"
                        p={4}
                        bg="white"
                        boxShadow="0 10px 26px rgba(15, 23, 42, 0.04)"
                        transition="border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease"
                        cursor="pointer"
                        onClick={() =>
                          router.push(
                            `/tournament/${tournamentId}/category/${category.id}`
                          )
                        }
                        _hover={{
                          borderColor: 'green.300',
                          boxShadow: '0 14px 34px rgba(15, 23, 42, 0.08)',
                          transform: 'translateY(-1px)',
                        }}
                        _dark={{
                          bg: 'gray.900',
                          borderColor: 'gray.700',
                          _hover: { borderColor: 'green.500' },
                        }}
                      >
                        <Flex
                          justify="space-between"
                          align="flex-start"
                          gap={3}
                          wrap="wrap"
                        >
                          <Box minW={0}>
                            <Text fontWeight="semibold">{category.name}</Text>
                            <Text
                              color="gray.600"
                              fontSize="sm"
                              mt={1}
                              _dark={{ color: 'gray.300' }}
                            >
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
                  <Text color="gray.500" _dark={{ color: 'gray.400' }}>
                    {t('noMatches')}
                  </Text>
                ) : (
                  <VStack align="stretch" gap={3}>
                    {matches.map((match) => (
                      <Box
                        key={match.id}
                        borderWidth="1px"
                        borderColor="gray.200"
                        borderRadius="xl"
                        p={4}
                        bg="white"
                        transition="border-color 160ms ease, box-shadow 160ms ease"
                        _hover={{
                          borderColor: 'green.300',
                          boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)',
                        }}
                        _dark={{
                          bg: 'gray.900',
                          borderColor: 'gray.700',
                          _hover: { borderColor: 'green.500' },
                        }}
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
                            <Text
                              color="gray.600"
                              fontSize="sm"
                              mt={1}
                              _dark={{ color: 'gray.300' }}
                            >
                              {t('opponentLabel')}:{' '}
                              {getMatchOpponentNames(
                                match,
                                player.id,
                                t('defaultTeamName'),
                                t('noOpponent')
                              )}
                            </Text>
                            <Text
                              color="gray.600"
                              fontSize="sm"
                              mt={1}
                              _dark={{ color: 'gray.300' }}
                            >
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
          </Flex>
        </Box>
        <Box borderRadius="2xl" boxShadow="0 14px 40px rgba(15, 23, 42, 0.05)">
          <TournamentQrBar url={shareUrl} />
        </Box>
      </VStack>
    </PageLayout>
  );
}
