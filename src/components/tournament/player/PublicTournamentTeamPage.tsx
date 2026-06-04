'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import { Button, HStack, VStack } from '@/components/ui/chakra-compat';
import PageLayout from '@/components/layout/PageLayout';
import { Link, useRouter } from '@/i18n/config';
import { useParams } from 'next/navigation';
import { getRoundDisplayLabel } from '@/lib/tournament/roundLabel';
import {
  CalendarDays,
  ChevronLeft,
  Trophy,
  UserRound,
  Users,
  Home,
  BarChart3,
} from 'lucide-react';
import { CategoryService } from '@/lib/api/category.service';
import { TournamentPlayerService } from '@/lib/api/tournament-player.service';
import { TournamentService } from '@/lib/api/tournament.service';
import {
  Category,
  CategoryMatch,
  CategoryRegistration,
  Tournament,
  TournamentPlayer,
} from '@/lib/api/types';
import { getTournamentPlayerCode } from './PublicTournamentPlayerPage';
import { getTournamentPlayerDisplayCode } from '@/lib/tournament/codes';
import BottomNavigationBar from '@/components/ui/BottomNavigationBar';
import { PublicTournamentProfileSkeleton } from '@/components/tournament/skeletons';
import TournamentTopBarMenu from '@/components/tournament/TournamentTopBarMenu';
import TournamentQrBar from '@/components/tournament/TournamentQrBar';

export default function PublicTournamentTeamPage() {
  const t = useTranslations('pages.tournaments.teamPage');
  const tRounds = useTranslations('pages.tournaments.teamPage.rounds');
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.tournamentId as string;
  const registrationCode = (params.registrationCode as string).toLowerCase();
  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [registration, setRegistration] = useState<CategoryRegistration | null>(
    null
  );
  const [matches, setMatches] = useState<CategoryMatch[]>([]);
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);

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

  if (!tournament || !category || !registration) {
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
        <Text>{t('notFound')}</Text>
      </PageLayout>
    );
  }

  const members = registration.pair?.members ?? [];
  const teamName =
    registration.pair?.name ||
    registration.player?.name ||
    t('defaultTeamName');

  const tabs = [
    { id: 0, label: t('tabs.overview'), icon: Home },
    { id: 1, label: t('tabs.teams'), icon: Users },
    { id: 2, label: t('tabs.schedule'), icon: CalendarDays },
    { id: 3, label: t('tabs.standings'), icon: BarChart3 },
  ];

  const handleTabChange = (tabIndex: number) => {
    if (tabIndex === 0) {
      router.push(`/tournament/${tournamentId}`);
    } else if (tabIndex === 1) {
      router.push(`/tournament/${tournamentId}/teams`);
    } else if (tabIndex === 2) {
      router.push(`/tournament/${tournamentId}/schedule`);
    } else if (tabIndex === 3) {
      router.push(`/tournament/${tournamentId}/standings`);
    }
  };

  return (
    <>
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
        pb={{
          base: 'calc(64px + env(safe-area-inset-bottom) + 24px)',
          md: '24px',
        }}
        _dark={{ bg: 'gray.900' }}
      >
        <VStack align="stretch" gap={5}>
          <Button
            alignSelf="flex-start"
            variant="ghost"
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
            overflow="hidden"
            _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
          >
            <Box bg="green.600" color="white" p={6}>
              <HStack gap={3}>
                <Users size={30} />
                <Box>
                  <Text opacity={0.85}>{t('teamLabel')}</Text>
                  <Heading size="xl">{teamName}</Heading>
                </Box>
              </HStack>
              <HStack gap={2} mt={4}>
                <Trophy size={16} />
                <Text>{tournament.name}</Text>
              </HStack>
            </Box>
            <Flex
              align="flex-start"
              gap={6}
              p={6}
              direction={{ base: 'column', md: 'row' }}
            >
              <VStack align="stretch" gap={6} flex={1}>
                <Box>
                  <Heading size="md" mb={3}>
                    {t('members')}
                  </Heading>
                  {members.length === 0 ? (
                    <Text color="orange.600">{t('noMembers')}</Text>
                  ) : (
                    <VStack align="stretch" gap={2}>
                      {members.map((member) => (
                        <Link
                          key={member.id}
                          href={`/t/${tournamentId}/p/${
                            playerCodeById.get(member.playerId) ??
                            getTournamentPlayerCode(member.playerId)
                          }`}
                        >
                          <Flex
                            align="center"
                            gap={3}
                            borderWidth="1px"
                            borderColor="gray.200"
                            borderRadius="md"
                            p={3}
                            _dark={{
                              bg: 'gray.900',
                              borderColor: 'gray.700',
                              color: 'gray.100',
                            }}
                          >
                            <UserRound size={18} />
                            <Text>
                              {member.player?.name || t('defaultPlayerName')}
                            </Text>
                          </Flex>
                        </Link>
                      ))}
                    </VStack>
                  )}
                </Box>
                <Box>
                  <HStack gap={2} mb={3}>
                    <CalendarDays size={18} />
                    <Heading size="md">{t('scheduleTitle')}</Heading>
                  </HStack>
                  {matches.length === 0 ? (
                    <Text color="gray.500" _dark={{ color: 'gray.400' }}>
                      {t('noMatches')}
                    </Text>
                  ) : (
                    <VStack align="stretch" gap={2}>
                      {matches.map((match) => (
                        <Box
                          key={match.id}
                          borderWidth="1px"
                          borderColor="gray.200"
                          borderRadius="md"
                          p={3}
                          _dark={{ bg: 'gray.900', borderColor: 'gray.700' }}
                        >
                          <Text fontWeight="semibold">
                            {t('matchInfo', {
                              round: getRoundDisplayLabel(match.round, tRounds),
                              number: match.matchNumber,
                            })}
                          </Text>
                          <Text
                            fontSize="sm"
                            color="gray.600"
                            _dark={{ color: 'gray.300' }}
                          >
                            {match.score || t('noResult')}
                          </Text>
                        </Box>
                      ))}
                    </VStack>
                  )}
                </Box>
              </VStack>
            </Flex>
          </Box>
          <TournamentQrBar url={shareUrl} />
        </VStack>
      </PageLayout>

      <BottomNavigationBar
        tabs={tabs}
        activeTab={1}
        onTabChange={handleTabChange}
      />
    </>
  );
}
