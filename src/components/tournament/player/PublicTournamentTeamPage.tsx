'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Badge, Box, Flex, Heading, Image, Text } from '@chakra-ui/react';
import { HStack, VStack } from '@/components/ui/chakra-compat';
import PageLayout from '@/components/layout/PageLayout';
import { Link, useRouter } from '@/i18n/config';
import { useParams } from 'next/navigation';
import { getRoundDisplayLabel } from '@/lib/tournament/roundLabel';
import { CalendarDays, Trophy, UserRound, Users } from 'lucide-react';
import { CategoryService } from '@/lib/api/category.service';
import { TournamentPlayerService } from '@/lib/api/tournament-player.service';
import { TournamentService } from '@/lib/api/tournament.service';
import {
  Category,
  CategoryMatch,
  CategoryRegistration,
  Tournament,
  TournamentCourt,
  TournamentPlayer,
} from '@/lib/api/types';
import { getTournamentPlayerCode } from './PublicTournamentPlayerPage';
import { getTournamentPlayerDisplayCode } from '@/lib/tournament/codes';
import { PublicTournamentTeamSkeleton } from '@/components/tournament/skeletons';
import TournamentTopBarMenu from '@/components/tournament/TournamentTopBarMenu';
import TournamentQrBar from '@/components/tournament/TournamentQrBar';
import { useCanGoBack } from '@/hooks/useCanGoBack';
import TournamentProfileHero, {
  getTournamentCoverImage,
} from './TournamentProfileHero';
import MatchDetailModal from '@/components/tournament/manage/panels/MatchDetailModal';
import { ResultMatchCard } from '@/components/tournament/manage/panels/ResultMatchCard';

export default function PublicTournamentTeamPage() {
  const t = useTranslations('pages.tournaments.teamPage');
  const tRounds = useTranslations('pages.tournaments.teamPage.rounds');
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.tournamentId as string;
  const registrationCode = (params.registrationCode as string).toLowerCase();
  const canGoBack = useCanGoBack();
  const backHref = `/tournament/${tournamentId}/teams`;
  const handleBack = useCallback(() => router.back(), [router]);
  const contextualBack = canGoBack ? handleBack : undefined;
  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [registration, setRegistration] = useState<CategoryRegistration | null>(
    null
  );
  const [matches, setMatches] = useState<CategoryMatch[]>([]);
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<CategoryMatch | null>(
    null
  );

  const load = useCallback(async () => {
    try {
      const tournamentData =
        await TournamentService.getTournament(tournamentId);
      const [categories, tournamentPlayers] = await Promise.all([
        CategoryService.getCategories(tournamentData.id),
        TournamentPlayerService.getPlayers(tournamentData.id),
      ]);
      const registrationsByCategory = await Promise.all(
        categories.map(async (item) => ({
          category: item,
          registrations: await CategoryService.getRegistrations(item.id),
        }))
      );
      const matches = registrationsByCategory.flatMap(
        ({ category, registrations }) =>
          registrations
            .filter((item) =>
              item.id.toLowerCase().startsWith(registrationCode)
            )
            .map((item) => ({ category, registration: item }))
      );
      if (matches.length !== 1) return;
      const resolved = matches[0];
      setTournament(tournamentData);
      setCategory(resolved.category);
      setRegistration(resolved.registration);
      setPlayers(tournamentPlayers);
      setMatches(
        await CategoryService.getRegistrationMatches(
          resolved.category.id,
          resolved.registration.id
        )
      );
    } finally {
      setLoading(false);
    }
  }, [registrationCode, tournamentId]);

  useEffect(() => {
    load();
  }, [load]);

  const sharePath = useMemo(
    () => `/t/${tournamentId}/team/${registrationCode}`,
    [tournamentId, registrationCode]
  );

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return sharePath;
    return `${window.location.origin}${window.location.pathname}`;
  }, [sharePath]);

  const playerCodeById = useMemo(() => {
    const ids = players.map((player) => player.id);
    return new Map(
      players.map((player) => [
        player.id,
        getTournamentPlayerDisplayCode(player, ids),
      ])
    );
  }, [players]);
  const playerById = useMemo(
    () => new Map(players.map((player) => [player.id, player])),
    [players]
  );
  const closeMatchDetail = useCallback(() => setSelectedMatch(null), []);
  const ignoreReadonlyMatchAction = useCallback(() => {}, []);

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
        pb={{
          base: 'calc(64px + env(safe-area-inset-bottom) + 24px)',
          md: '24px',
        }}
        _dark={{ bg: 'gray.900' }}
      >
        <PublicTournamentTeamSkeleton />
      </PageLayout>
    );
  }

  if (!tournament || !category || !registration) {
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
        <Text>{t('notFound')}</Text>
      </PageLayout>
    );
  }

  const members = registration.pair?.members ?? [];
  const teamName =
    registration.pair?.name ||
    registration.player?.name ||
    t('defaultTeamName');
  const coverImage = getTournamentCoverImage(tournament);

  const selectedMatchRoundLabel = selectedMatch
    ? getRoundDisplayLabel(selectedMatch.round, tRounds)
    : '';

  return (
    <>
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
        pb={{
          base: 'calc(64px + env(safe-area-inset-bottom) + 24px)',
          md: '24px',
        }}
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
              label={t('teamLabel')}
              title={teamName}
              visual={
                <Flex
                  w={{ base: '64px', md: '76px' }}
                  h={{ base: '64px', md: '76px' }}
                  borderRadius="2xl"
                  align="center"
                  justify="center"
                  bg="whiteAlpha.300"
                  borderWidth="1px"
                  borderColor="whiteAlpha.500"
                  boxShadow="0 14px 32px rgba(0, 0, 0, 0.24)"
                  flexShrink={0}
                >
                  <Users size={34} />
                </Flex>
              }
              meta={
                <HStack gap={2}>
                  <Trophy size={16} />
                  <Text fontWeight="medium">{tournament.name}</Text>
                </HStack>
              }
            />
            <Flex
              align={{ base: 'stretch', md: 'flex-start' }}
              gap={6}
              p={{ base: 5, md: 7 }}
              direction={{ base: 'column', md: 'row' }}
            >
              <VStack align="stretch" gap={7} flex={1} minW={0} w="full">
                <Box w="full">
                  <HStack gap={2} mb={3}>
                    <Users size={18} color="var(--chakra-colors-green-600)" />
                    <Heading size="md">{t('members')}</Heading>
                    {members.length > 0 && (
                      <Badge colorPalette="green" variant="subtle">
                        {members.length}
                      </Badge>
                    )}
                  </HStack>
                  {members.length === 0 ? (
                    <Text color="orange.600">{t('noMembers')}</Text>
                  ) : (
                    <VStack align="stretch" gap={3}>
                      {members.map((member) => {
                        const player =
                          member.player ?? playerById.get(member.playerId);
                        const avatarSrc = player?.image ?? player?.user?.image;
                        const playerName =
                          player?.name ||
                          member.player?.name ||
                          t('defaultPlayerName');

                        return (
                          <Link
                            key={member.id}
                            href={`/t/${tournamentId}/p/${
                              playerCodeById.get(member.playerId) ??
                              getTournamentPlayerCode(member.playerId)
                            }`}
                            style={{
                              display: 'block',
                              width: '100%',
                              textDecoration: 'none',
                            }}
                          >
                            <Flex
                              align="center"
                              gap={3}
                              w="full"
                              borderWidth="1px"
                              borderColor="gray.200"
                              borderRadius="xl"
                              p={4}
                              bg="white"
                              boxShadow="0 10px 26px rgba(15, 23, 42, 0.04)"
                              transition="border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease"
                              _hover={{
                                borderColor: 'green.300',
                                boxShadow: '0 14px 34px rgba(15, 23, 42, 0.08)',
                                transform: 'translateY(-1px)',
                              }}
                              _dark={{
                                bg: 'gray.900',
                                borderColor: 'gray.700',
                                color: 'gray.100',
                                _hover: { borderColor: 'green.500' },
                              }}
                            >
                              {avatarSrc ? (
                                <Box
                                  w="38px"
                                  h="38px"
                                  borderRadius="full"
                                  overflow="hidden"
                                  flexShrink={0}
                                  bg="green.50"
                                  _dark={{ bg: 'green.900' }}
                                >
                                  <Image
                                    src={avatarSrc}
                                    alt={playerName}
                                    w="full"
                                    h="full"
                                    objectFit="cover"
                                  />
                                </Box>
                              ) : (
                                <Flex
                                  w="38px"
                                  h="38px"
                                  align="center"
                                  justify="center"
                                  borderRadius="full"
                                  bg="green.50"
                                  color="green.700"
                                  flexShrink={0}
                                  _dark={{
                                    bg: 'green.900',
                                    color: 'green.200',
                                  }}
                                >
                                  <UserRound size={19} />
                                </Flex>
                              )}
                              <Text fontWeight="medium" lineClamp={1}>
                                {playerName}
                              </Text>
                            </Flex>
                          </Link>
                        );
                      })}
                    </VStack>
                  )}
                </Box>
                <Box w="full">
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
                        <ResultMatchCard
                          key={match.id}
                          match={match}
                          categoryName={category?.name}
                          onSelect={setSelectedMatch}
                          allMatches={matches}
                          category={category ?? undefined}
                          showPlayerNames
                        />
                      ))}
                    </VStack>
                  )}
                </Box>
              </VStack>
            </Flex>
          </Box>
          <Box
            borderRadius="2xl"
            boxShadow="0 14px 40px rgba(15, 23, 42, 0.05)"
          >
            <TournamentQrBar url={shareUrl} />
          </Box>
        </VStack>
      </PageLayout>

      <MatchDetailModal
        isOpen={!!selectedMatch}
        onClose={closeMatchDetail}
        match={selectedMatch}
        categoryName={category.name}
        roundOrGroupLabel={selectedMatchRoundLabel}
        courtLabel={
          selectedMatch?.court
            ? formatTeamPageCourtLabel(selectedMatch.court, t('courtPrefix'))
            : undefined
        }
        allMatches={matches}
        category={category}
        showPlayerNames
        canEdit={false}
        onEditResult={ignoreReadonlyMatchAction}
        onDeleteMatch={ignoreReadonlyMatchAction}
        tournamentId={tournamentId}
      />
    </>
  );
}

function formatTeamPageCourtLabel(court: TournamentCourt, prefix: string) {
  return (
    court.courtName || prefix.replace('{number}', String(court.courtNumber))
  );
}
