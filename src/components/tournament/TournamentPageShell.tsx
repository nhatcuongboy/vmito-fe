'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Badge,
  Button,
  Flex,
  Heading,
  HStack,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import PageLayout from '@/components/layout/PageLayout';
import BottomNavigationBar from '@/components/ui/BottomNavigationBar';
import { TournamentService } from '@/lib/api/tournament.service';
import { TournamentManagerService } from '@/lib/api/tournament-manager.service';
import {
  Category,
  CategoryRegistration,
  CategoryType,
  Tournament,
  TournamentMyAccess,
  TournamentPlayer,
} from '@/lib/api/types';
import { CategoryService } from '@/lib/api/category.service';
import { TournamentPlayerService } from '@/lib/api/tournament-player.service';
import { useParams } from 'next/navigation';
import { Link, useRouter } from '@/i18n/config';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  Home,
  Users,
  CalendarDays,
  BarChart3,
  Settings,
  LayoutGrid,
  CircleUserRound,
  SquarePen,
  Trophy,
  ArrowRight,
} from 'lucide-react';
import TournamentDashboard from '@/components/tournament/TournamentDashboard';
import TournamentHomeTab from '@/components/tournament/TournamentHomeTab';
import TournamentManage from '@/components/tournament/manage/TournamentManage';
import TournamentSidebar from '@/components/tournament/TournamentSidebar';
import PublicTournamentStandingsTab from '@/components/tournament/PublicTournamentStandingsTab';
import ResultsPanel from '@/components/tournament/manage/panels/ResultsPanel';
import TournamentTopBarMenu from '@/components/tournament/TournamentTopBarMenu';
import {
  getTournamentPlayerCode,
  getUniqueTournamentPlayerCode,
} from '@/components/tournament/player/PublicTournamentPlayerPage';
import { getTournamentPlayerDisplayCode } from '@/lib/tournament/codes';
import {
  TournamentContentSkeleton,
  TournamentMatchListSkeleton,
  TournamentTableSkeleton,
  TournamentTeamsSkeleton,
} from '@/components/tournament/skeletons';

interface ITeamCategoryBlock {
  id: string;
  title: string;
  type: CategoryType;
  players: Array<{
    id: string;
    name: string;
    code?: string;
    target?: 'player' | 'team';
    members?: string[];
  }>;
}

const CATEGORY_BORDER_COLOR: Record<CategoryType, string> = {
  [CategoryType.MENS_SINGLE]: 'blue.300',
  [CategoryType.WOMENS_SINGLE]: 'pink.300',
  [CategoryType.MENS_DOUBLE]: 'yellow.300',
  [CategoryType.WOMENS_DOUBLE]: 'orange.300',
  [CategoryType.MIXED_DOUBLE]: 'cyan.300',
  [CategoryType.CUSTOM]: 'purple.300',
};

const CATEGORY_ACCENT_BG: Record<CategoryType, string> = {
  [CategoryType.MENS_SINGLE]: 'blue.50',
  [CategoryType.WOMENS_SINGLE]: 'pink.50',
  [CategoryType.MENS_DOUBLE]: 'yellow.50',
  [CategoryType.WOMENS_DOUBLE]: 'orange.50',
  [CategoryType.MIXED_DOUBLE]: 'cyan.50',
  [CategoryType.CUSTOM]: 'purple.50',
};

type TeamListItem = ITeamCategoryBlock['players'][number];

export type TournamentSegment =
  | 'home'
  | 'teams'
  | 'schedule'
  | 'standings'
  | 'manage'
  | 'dashboard';

const SEGMENT_TO_TAB: Record<TournamentSegment, number> = {
  home: 0,
  teams: 1,
  schedule: 2,
  standings: 3,
  manage: 4,
  dashboard: 5,
};

const TAB_TO_SEGMENT: Record<number, TournamentSegment> = {
  0: 'home',
  1: 'teams',
  2: 'schedule',
  3: 'standings',
  4: 'manage',
  5: 'dashboard',
};

interface TournamentPageShellProps {
  activeSegment: TournamentSegment;
}

function TeamCategoryCard({
  categoryBlock,
  categoryLabel,
  slug,
  emptyText,
  codeLabel,
  teamCountLabel,
}: {
  categoryBlock: ITeamCategoryBlock;
  categoryLabel: string;
  slug: string;
  emptyText: string;
  codeLabel: string;
  teamCountLabel: string;
}) {
  return (
    <Box
      borderWidth="1px"
      borderColor="gray.200"
      borderTopWidth="4px"
      borderTopColor={CATEGORY_BORDER_COLOR[categoryBlock.type]}
      borderRadius="2xl"
      bg="white"
      overflow="hidden"
      boxShadow="0 18px 46px rgba(15, 23, 42, 0.06)"
    >
      <Flex
        align={{ base: 'stretch', sm: 'center' }}
        justify="space-between"
        gap={3}
        direction={{ base: 'column', sm: 'row' }}
        px={{ base: 4, md: 5 }}
        py={4}
        bg={CATEGORY_ACCENT_BG[categoryBlock.type]}
      >
        <Box minW={0}>
          <Heading size="md" lineClamp={1}>
            {categoryBlock.title}
          </Heading>
          <Text mt={1} fontSize="sm" color="gray.600">
            {categoryLabel}
          </Text>
        </Box>
        <Badge
          alignSelf={{ base: 'flex-start', sm: 'center' }}
          colorPalette="gray"
          variant="solid"
          borderRadius="full"
          px={3}
          py={1}
        >
          {teamCountLabel}
        </Badge>
      </Flex>

      {categoryBlock.players.length === 0 ? (
        <Box px={{ base: 4, md: 5 }} py={5}>
          <Text color="fg.muted">{emptyText}</Text>
        </Box>
      ) : (
        <VStack align="stretch" gap={0} px={{ base: 3, md: 4 }} py={3}>
          {categoryBlock.players.map((team, index) => (
            <TeamRow
              key={`${categoryBlock.id}-${team.id}`}
              team={team}
              slug={slug}
              codeLabel={codeLabel}
              showDivider={index < categoryBlock.players.length - 1}
            />
          ))}
        </VStack>
      )}
    </Box>
  );
}

function TeamRow({
  team,
  slug,
  codeLabel,
  showDivider,
}: {
  team: TeamListItem;
  slug: string;
  codeLabel: string;
  showDivider: boolean;
}) {
  const content = (
    <Flex
      align="center"
      gap={3}
      px={{ base: 2, md: 3 }}
      py={3}
      borderBottomWidth={showDivider ? '1px' : '0'}
      borderColor="gray.100"
      borderRadius="lg"
      transition="background 160ms ease, transform 160ms ease"
      _hover={team.code ? { bg: 'gray.50', transform: 'translateX(2px)' } : {}}
    >
      <Flex
        align="center"
        justify="center"
        w="44px"
        h="44px"
        borderRadius="full"
        bg="gray.50"
        borderWidth="1px"
        borderColor="gray.200"
        color="gray.500"
        flexShrink={0}
      >
        <CircleUserRound size={23} />
      </Flex>

      <Box flex="1" minW={0}>
        <Flex align="center" gap={2} minW={0}>
          <Text
            fontSize={{ base: 'md', md: 'lg' }}
            fontWeight="semibold"
            lineClamp={1}
          >
            {team.name}
          </Text>
          {team.code && (
            <Badge
              colorPalette="gray"
              variant="subtle"
              borderRadius="full"
              flexShrink={0}
            >
              {codeLabel} {team.code}
            </Badge>
          )}
        </Flex>
        {team.members && team.members.length > 0 && (
          <Text mt={1} fontSize="sm" color="gray.500" lineClamp={1}>
            {team.members.join(' · ')}
          </Text>
        )}
      </Box>

      {team.code && (
        <Flex color="gray.400" flexShrink={0}>
          <ArrowRight size={18} />
        </Flex>
      )}
    </Flex>
  );

  if (!team.code) return content;

  return (
    <Link
      href={
        team.target === 'team'
          ? `/t/${slug}/team/${team.code}`
          : `/t/${slug}/p/${team.code}`
      }
      style={{ color: 'inherit', textDecoration: 'none' }}
    >
      {content}
    </Link>
  );
}

export default function TournamentPageShell({
  activeSegment,
}: TournamentPageShellProps) {
  const t = useTranslations('pages.tournaments.detail');
  const tCategory = useTranslations('pages.tournaments.categoryTypeLabels');
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const slug = params.id as string;
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [teamCategoryBlocks, setTeamCategoryBlocks] = useState<
    ITeamCategoryBlock[]
  >([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);

  const isHost = useMemo(
    () => user?.id === tournament?.hostId,
    [user, tournament]
  );

  // Management access for the current user: host, system admin, or an assigned
  // manager with at least one permission scope. Lets managers reach the manage
  // screen (per-action scopes are still enforced by the backend).
  const [myAccess, setMyAccess] = useState<TournamentMyAccess | null>(null);

  useEffect(() => {
    if (!user || !tournament) {
      setMyAccess(null);
      return;
    }
    let active = true;
    TournamentManagerService.getMyAccess(tournament.id)
      .then((access) => {
        if (active) setMyAccess(access);
      })
      .catch(() => {
        if (active) setMyAccess(null);
      });
    return () => {
      active = false;
    };
  }, [user, tournament]);

  const isAdmin = user?.role === 'ADMIN';
  const canManage =
    isHost || isAdmin || (myAccess?.permissions.length ?? 0) > 0;

  const tabs = useMemo(() => {
    const allTabs = [
      { id: 0, label: t('tabs.home'), icon: Home },
      { id: 1, label: t('tabs.teams'), icon: Users },
      { id: 2, label: t('tabs.schedule'), icon: CalendarDays },
      { id: 3, label: t('tabs.standings'), icon: BarChart3 },
      { id: 4, label: t('tabs.manage'), icon: Settings },
      { id: 5, label: t('tabs.dashboard'), icon: LayoutGrid },
    ];

    return allTabs.filter((tab) => {
      if (tab.id === 4) return canManage; // Manage: host, admin, or manager
      if (tab.id === 5) return isHost || isAdmin; // Dashboard: host/admin only
      return true;
    });
  }, [canManage, isHost, isAdmin, t]);

  const bottomNavTabs = tabs;

  const activeTab = SEGMENT_TO_TAB[activeSegment];
  const topBarIcon = (
    <Trophy size={28} strokeWidth={2} color="var(--chakra-colors-yellow-400)" />
  );

  const getCategoryTypeLabel = useCallback(
    (type: CategoryType) => {
      const labels: Record<CategoryType, string> = {
        [CategoryType.MENS_SINGLE]: tCategory('mensSingle'),
        [CategoryType.WOMENS_SINGLE]: tCategory('womensSingle'),
        [CategoryType.MENS_DOUBLE]: tCategory('mensDouble'),
        [CategoryType.WOMENS_DOUBLE]: tCategory('womensDouble'),
        [CategoryType.MIXED_DOUBLE]: tCategory('mixedDouble'),
        [CategoryType.CUSTOM]: CategoryType.CUSTOM,
      };
      return labels[type];
    },
    [tCategory]
  );

  const getRegistrationPlayers = useCallback(
    (
      registration: CategoryRegistration,
      categoryType: CategoryType,
      playerById: Map<string, TournamentPlayer>,
      playerCodeById: Map<string, string>,
      registrationCodeById: Map<string, string>
    ): TeamListItem[] => {
      const players: TournamentPlayer[] = [];
      const isSinglesCategory =
        categoryType === CategoryType.MENS_SINGLE ||
        categoryType === CategoryType.WOMENS_SINGLE;

      if (!isSinglesCategory) {
        return [
          {
            id: registration.id,
            name:
              registration.pair?.name ||
              registration.player?.name ||
              registration.pair?.members
                ?.map(
                  (member) =>
                    member.player?.name || playerById.get(member.playerId)?.name
                )
                .filter(Boolean)
                .join(' & ') ||
              t('teamsTab.unknownTeam'),
            code:
              registrationCodeById.get(registration.id) ??
              getTournamentPlayerCode(registration.id),
            target: 'team' as const,
            members:
              registration.pair?.members
                ?.map(
                  (member) =>
                    member.player?.name || playerById.get(member.playerId)?.name
                )
                .filter((name): name is string => Boolean(name)) ?? [],
          },
        ];
      }

      if (isSinglesCategory) {
        if (registration.player) {
          players.push(registration.player);
        } else if (registration.tournamentPlayerId) {
          const player = playerById.get(registration.tournamentPlayerId);
          if (player) {
            players.push(player);
          }
        }
      }

      registration.pair?.members?.forEach((member) => {
        const player = member.player ?? playerById.get(member.playerId);
        if (player) {
          players.push(player);
        }
      });

      const resolvedPlayers = Array.from(
        new Map(players.map((player) => [player.id, player])).values()
      );

      if (resolvedPlayers.length > 0) {
        return resolvedPlayers.map((player) => ({
          id: player.id,
          name: player.name,
          code:
            playerCodeById.get(player.id) ?? getTournamentPlayerCode(player.id),
          target: 'player' as const,
        }));
      }

      return [
        {
          id: registration.id,
          name:
            registration.pair?.name ||
            registration.player?.name ||
            registration.pair?.members
              ?.map(
                (member) =>
                  member.player?.name || playerById.get(member.playerId)?.name
              )
              .filter(Boolean)
              .join(' & ') ||
            t('teamsTab.unknownTeam'),
          members:
            registration.pair?.members
              ?.map(
                (member) =>
                  member.player?.name || playerById.get(member.playerId)?.name
              )
              .filter((name): name is string => Boolean(name)) ?? [],
        },
      ];
    },
    [t]
  );

  const resolveCategoryTitle = useCallback(
    (category: Category) => {
      if (category.name && category.name.trim().length > 0) {
        return category.name;
      }

      return getCategoryTypeLabel(category.type);
    },
    [getCategoryTypeLabel]
  );

  useEffect(() => {
    const loadTournament = async () => {
      try {
        setLoading(true);
        setTournament(null);
        setLoadingTeams(true);
        setAllCategories([]);
        setTeamCategoryBlocks([]);

        const data = await TournamentService.getTournament(slug);
        setTournament(data);
      } catch (error) {
        console.error('Error loading tournament:', error);
        setTournament(null);
        setAllCategories([]);
        setTeamCategoryBlocks([]);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadTournament();
    }
  }, [slug]);

  useEffect(() => {
    const tournamentId = tournament?.id;

    if (!tournamentId) {
      setLoadingTeams(false);
      return;
    }

    let isMounted = true;

    const loadTournamentTeams = async () => {
      try {
        setLoadingTeams(true);

        const [categories, tournamentPlayers] = await Promise.all([
          CategoryService.getCategories(tournamentId),
          TournamentPlayerService.getPlayers(tournamentId),
        ]);

        const tournamentPlayerIds = tournamentPlayers.map(
          (player) => player.id
        );
        const playerById = new Map(
          tournamentPlayers.map((player) => [player.id, player])
        );
        const playerCodeById = new Map(
          tournamentPlayers.map((player) => [
            player.id,
            getTournamentPlayerDisplayCode(player, tournamentPlayerIds),
          ])
        );
        const registrationsByCategory = await Promise.all(
          categories.map(async (category) => ({
            category,
            registrations: await CategoryService.getRegistrations(category.id),
          }))
        );
        const registrationIds = registrationsByCategory.flatMap(
          ({ registrations }) =>
            registrations.map((registration) => registration.id)
        );
        const registrationCodeById = new Map(
          registrationIds.map((id) => [
            id,
            getUniqueTournamentPlayerCode(id, registrationIds),
          ])
        );
        const categoryBlocks = registrationsByCategory.map(
          ({ category, registrations }) => {
            return {
              id: category.id,
              title: resolveCategoryTitle(category),
              type: category.type,
              players: registrations.flatMap((registration) =>
                getRegistrationPlayers(
                  registration,
                  category.type,
                  playerById,
                  playerCodeById,
                  registrationCodeById
                )
              ),
            } satisfies ITeamCategoryBlock;
          }
        );

        if (!isMounted) return;

        setAllCategories(categories);
        setTeamCategoryBlocks(categoryBlocks);
      } catch (error) {
        console.error('Error loading tournament teams:', error);
        if (!isMounted) return;

        setAllCategories([]);
        setTeamCategoryBlocks([]);
      } finally {
        if (isMounted) {
          setLoadingTeams(false);
        }
      }
    };

    loadTournamentTeams();

    return () => {
      isMounted = false;
    };
  }, [getRegistrationPlayers, resolveCategoryTitle, tournament?.id]);

  const sortedTeamCategoryBlocks = useMemo(() => {
    return [...teamCategoryBlocks].sort((firstCategory, secondCategory) =>
      firstCategory.title.localeCompare(secondCategory.title)
    );
  }, [teamCategoryBlocks]);

  const totalRegisteredTeams = useMemo(
    () =>
      teamCategoryBlocks.reduce(
        (sum, categoryBlock) => sum + categoryBlock.players.length,
        0
      ),
    [teamCategoryBlocks]
  );

  const handleTabChange = useCallback(
    (tabIndex: number) => {
      const segment = TAB_TO_SEGMENT[tabIndex];
      if (segment === 'home') {
        router.push(`/tournament/${slug}`);
      } else {
        router.push(`/tournament/${slug}/${segment}`);
      }
    },
    [router, slug]
  );

  useEffect(() => {
    if (loading || !tournament) return;
    // For a host/admin or a logged-out user the verdict is immediate; for a
    // potential manager we must wait until the access check has resolved before
    // redirecting, otherwise we'd bounce them off /manage prematurely.
    const accessResolved = isHost || isAdmin || !user || myAccess !== null;
    const blockedFromManage =
      activeSegment === 'manage' && accessResolved && !canManage;
    const blockedFromDashboard =
      activeSegment === 'dashboard' && !isHost && !isAdmin;
    if (blockedFromManage || blockedFromDashboard) {
      router.replace(`/tournament/${slug}`);
    }
  }, [
    loading,
    tournament,
    user,
    isHost,
    isAdmin,
    canManage,
    myAccess,
    activeSegment,
    router,
    slug,
  ]);

  const handleManageTeamsClick = () => {
    router.push(`/tournament/${slug}/manage?option=teams`);
  };

  if (loading) {
    return (
      <>
        <PageLayout
          title={t('title')}
          mobileIcon={topBarIcon}
          showBackButton={false}
          topBarVariant="main"
          showTopBarMenuButton={false}
          showTopBarLogo
          showTopBarAuthActions={false}
          disableSidebarOffset
          rightContent={<TournamentTopBarMenu />}
          maxW="full"
          px={{ base: '24px', md: 0 }}
          pb={{
            base: 'calc(64px + env(safe-area-inset-bottom) + 24px)',
            md: '24px',
          }}
        >
          {/* Desktop: real sidebar (skeleton header, real tabs) + content skeleton */}
          <Flex
            display={{ base: 'none', md: 'flex' }}
            gap={6}
            pt={{ md: 6 }}
            pl={{ md: 4 }}
            pr={{ md: 6 }}
          >
            <TournamentSidebar
              tournament={null}
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              showStatusBadge={false}
            />
            <Box flex="1" minW={0}>
              <TournamentContentSkeleton />
            </Box>
          </Flex>

          {/* Mobile: content skeleton only */}
          <Box display={{ base: 'block', md: 'none' }}>
            <TournamentContentSkeleton />
          </Box>
        </PageLayout>

        {/* Bottom tabs render normally during loading */}
        <BottomNavigationBar
          tabs={bottomNavTabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </>
    );
  }

  if (!tournament) {
    return (
      <PageLayout
        title={t('title')}
        mobileIcon={topBarIcon}
        showBackButton={false}
        topBarVariant="main"
        showTopBarMenuButton={false}
        showTopBarLogo={false}
        showTopBarAuthActions={false}
        rightContent={<TournamentTopBarMenu />}
      >
        <Text>{t('notFound')}</Text>
      </PageLayout>
    );
  }

  const renderContent = () => (
    <>
      {activeTab === 0 && (
        <TournamentHomeTab
          tournament={tournament}
          categories={teamCategoryBlocks.map((b) => ({
            id: b.id,
            name: b.title,
            type: b.type,
          }))}
          fullCategories={allCategories}
          totalTeams={teamCategoryBlocks.reduce(
            (sum, b) => sum + b.players.length,
            0
          )}
          isLoadingCategories={loadingTeams}
          isHost={isHost}
          slug={slug}
        />
      )}
      {activeTab === 1 && (
        <VStack align="stretch" gap={6}>
          <Flex
            justify="space-between"
            align={{ base: 'stretch', md: 'center' }}
            gap={4}
            direction={{ base: 'column', md: 'row' }}
          >
            <Box minW={0}>
              <Heading size="lg" mb={2}>
                {t('tabs.teams')}
              </Heading>
              <HStack gap={2} wrap="wrap">
                <Badge colorPalette="green" variant="subtle" px={3} py={1}>
                  {t('teamsTab.totalTeams', { count: totalRegisteredTeams })}
                </Badge>
                <Badge colorPalette="gray" variant="subtle" px={3} py={1}>
                  {t('teamsTab.totalCategories', {
                    count: allCategories.length,
                  })}
                </Badge>
              </HStack>
            </Box>
            <Button
              alignSelf={{ base: 'stretch', md: 'center' }}
              size="md"
              variant="subtle"
              colorPalette="gray"
              borderRadius="full"
              px={5}
              onClick={handleManageTeamsClick}
            >
              <HStack gap={2}>
                <SquarePen size={16} />
                <Text>{t('teamsTab.manageTeams')}</Text>
              </HStack>
            </Button>
          </Flex>

          {loadingTeams ? (
            <TournamentTeamsSkeleton />
          ) : sortedTeamCategoryBlocks.length === 0 ? (
            <Box
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="xl"
              px={6}
              py={8}
            >
              <Text color="fg.muted">{t('teamsTab.noCategories')}</Text>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, xl: 2 }} gap={5} alignItems="start">
              {sortedTeamCategoryBlocks.map((categoryBlock) => (
                <TeamCategoryCard
                  key={categoryBlock.id}
                  categoryBlock={categoryBlock}
                  categoryLabel={getCategoryTypeLabel(categoryBlock.type)}
                  slug={slug}
                  emptyText={t('teamsTab.noTeams')}
                  codeLabel={t('teamsTab.codeLabel')}
                  teamCountLabel={t('teamsTab.teamsCount', {
                    count: categoryBlock.players.length,
                  })}
                />
              ))}
            </SimpleGrid>
          )}
        </VStack>
      )}
      {activeTab === 2 &&
        tournament &&
        (loadingTeams ? (
          <TournamentMatchListSkeleton count={6} />
        ) : (
          <ResultsPanel
            tournament={tournament}
            categories={allCategories}
            canEdit={isHost}
            heading={t('tabs.schedule')}
          />
        ))}
      {activeTab === 3 &&
        tournament &&
        (loadingTeams ? (
          <TournamentTableSkeleton rows={6} columns={7} />
        ) : (
          <PublicTournamentStandingsTab
            tournament={tournament}
            categories={allCategories}
            isHost={isHost}
          />
        ))}
      {activeTab === 4 && canManage && (
        <TournamentManage
          tournament={tournament}
          onTournamentUpdate={(updated) => setTournament(updated)}
        />
      )}
      {activeTab === 5 && isHost && (
        <TournamentDashboard tournament={tournament} />
      )}
    </>
  );

  return (
    <>
      <PageLayout
        title={tournament.name}
        mobileIcon={topBarIcon}
        showBackButton={false}
        topBarVariant="main"
        showTopBarMenuButton={false}
        showTopBarLogo
        showTopBarAuthActions={false}
        disableSidebarOffset
        rightContent={<TournamentTopBarMenu />}
        maxW="full"
        px={{ base: '24px', md: 0 }}
        pb={{
          base: 'calc(64px + env(safe-area-inset-bottom) + 24px)',
          md: '24px',
        }}
      >
        {/* Desktop: sidebar + content */}
        <Flex
          display={{ base: 'none', md: 'flex' }}
          gap={6}
          pt={{ md: 6 }}
          pl={{ md: 4 }}
          pr={{ md: 6 }}
        >
          <TournamentSidebar
            tournament={tournament}
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            showStatusBadge={canManage}
          />
          <Box flex="1" minW={0}>
            {renderContent()}
          </Box>
        </Flex>

        {/* Mobile: content only */}
        <Box display={{ base: 'block', md: 'none' }}>{renderContent()}</Box>
      </PageLayout>

      {/* Bottom tabs: mobile only */}
      <BottomNavigationBar
        tabs={bottomNavTabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Host quick-access: floating "Enter scores" button (mobile only) */}
      {isHost && activeSegment !== 'schedule' && (
        <Box
          display={{ base: 'block', md: 'none' }}
          position="fixed"
          right="16px"
          bottom="calc(64px + env(safe-area-inset-bottom) + 16px)"
          zIndex={20}
        >
          <Button
            colorPalette="green"
            borderRadius="full"
            boxShadow="lg"
            size="lg"
            onClick={() => router.push(`/tournament/${slug}/schedule`)}
          >
            <HStack gap={2}>
              <SquarePen size={18} />
              <Text>{t('enterScores')}</Text>
            </HStack>
          </Button>
        </Box>
      )}
    </>
  );
}
