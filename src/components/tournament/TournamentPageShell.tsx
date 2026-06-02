'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  IconButton,
  Spinner,
  Text,
  VStack,
  Avatar,
} from '@chakra-ui/react';
import PageLayout from '@/components/layout/PageLayout';
import BottomNavigationBar from '@/components/ui/BottomNavigationBar';
import { ROUTES } from '@/constants';
import { TournamentService } from '@/lib/api/tournament.service';
import {
  Category,
  CategoryRegistration,
  CategoryType,
  Tournament,
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
  Menu,
  Search,
  PlusSquare,
  MessageSquare,
  LogIn,
  UserPlus,
  LogOut,
  Trophy,
  CircleHelp,
} from 'lucide-react';
import { AuthService } from '@/lib/api/auth.service';
import TournamentDashboard from '@/components/tournament/TournamentDashboard';
import TournamentHomeTab from '@/components/tournament/TournamentHomeTab';
import TournamentManage from '@/components/tournament/manage/TournamentManage';
import TournamentSidebar from '@/components/tournament/TournamentSidebar';
import {
  getTournamentPlayerCode,
  getUniqueTournamentPlayerCode,
} from '@/components/tournament/player/PublicTournamentPlayerPage';

interface ITeamCategoryBlock {
  id: string;
  title: string;
  type: CategoryType;
  players: Array<{
    id: string;
    name: string;
    code: string;
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

function TournamentTopBarMenu() {
  const common = useTranslations('common');
  const navigation = useTranslations('navigation');
  const router = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const isLoggedIn = isAuthenticated && !!user && user.role !== 'GUEST';

  const navigateTo = useCallback(
    (href: string) => {
      setIsOpen(false);
      router.push(href);
    },
    [router]
  );

  const menuItems = [
    ...(isLoggedIn
      ? [
          {
            label: navigation('tournaments'),
            icon: Trophy,
            href: ROUTES.HOST.TOURNAMENTS.LIST,
          },
        ]
      : [
          {
            label: navigation('mainHome'),
            icon: Home,
            href: ROUTES.HOME,
          },
        ]),
    {
      label: navigation('findTournaments'),
      icon: Search,
      href: ROUTES.BROWSE.TOURNAMENTS.LIST,
    },
    {
      label: navigation('createTournament'),
      icon: PlusSquare,
      href: ROUTES.HOST.TOURNAMENTS.NEW,
    },
    {
      label: common('feedback'),
      icon: MessageSquare,
      href: ROUTES.FEEDBACK,
    },
  ];

  const handleLogout = () => {
    setIsOpen(false);
    AuthService.logout();
    clearAuth();
    router.push(ROUTES.HOME);
  };

  return (
    <Box position="relative">
      {isLoggedIn ? (
        <HStack gap={{ base: 3, md: 4 }}>
          <IconButton
            aria-label={common('guide')}
            variant="ghost"
            borderRadius="full"
            color="gray.950"
            _hover={{ bg: 'gray.50' }}
            onClick={() => navigateTo(ROUTES.GUIDE)}
          >
            <CircleHelp size={27} strokeWidth={2.5} />
          </IconButton>
          <IconButton
            aria-label={navigation('findTournaments')}
            variant="ghost"
            borderRadius="full"
            color="gray.950"
            _hover={{ bg: 'gray.50' }}
            onClick={() => navigateTo(ROUTES.BROWSE.TOURNAMENTS.LIST)}
          >
            <Search size={31} strokeWidth={2.4} />
          </IconButton>
          <IconButton
            aria-label={navigation('createTournament')}
            variant="ghost"
            borderRadius="full"
            color="gray.950"
            _hover={{ bg: 'gray.50' }}
            onClick={() => navigateTo(ROUTES.HOST.TOURNAMENTS.NEW)}
          >
            <PlusSquare size={30} strokeWidth={2.3} />
          </IconButton>
          <Box
            as="button"
            aria-label={common('navigation')}
            position="relative"
            onClick={(event) => {
              event.stopPropagation();
              setIsOpen((open) => !open);
            }}
          >
            <Avatar.Root size="lg" bg="gray.200">
              <Avatar.Fallback name={user.name || user.email || 'User'} />
              {user.image && <Avatar.Image src={user.image} />}
            </Avatar.Root>
            <Flex
              position="absolute"
              right="-3px"
              bottom="-3px"
              align="center"
              justify="center"
              w="27px"
              h="27px"
              borderRadius="full"
              bg="gray.50"
              borderWidth="1px"
              borderColor="gray.200"
              color="gray.950"
            >
              <Menu size={18} strokeWidth={2.5} />
            </Flex>
          </Box>
        </HStack>
      ) : (
        <IconButton
          aria-label={common('navigation')}
          onClick={(event) => {
            event.stopPropagation();
            setIsOpen((open) => !open);
          }}
          variant="subtle"
          colorPalette="gray"
          borderRadius="full"
          size="lg"
          bg="gray.50"
          color="gray.900"
          borderWidth="1px"
          borderColor="gray.200"
          _hover={{ bg: 'gray.100' }}
        >
          <Menu size={24} strokeWidth={2.5} />
        </IconButton>
      )}

      {isOpen && (
        <>
          <Box
            position="fixed"
            inset={0}
            zIndex={1190}
            onMouseDown={() => setIsOpen(false)}
          />
          <Box
            position="absolute"
            top="calc(100% + 8px)"
            right={0}
            zIndex={1200}
            w={{ base: 'min(calc(100vw - 32px), 336px)', md: '340px' }}
            bg="white"
            color="gray.900"
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="2xl"
            boxShadow="0 18px 45px rgba(15, 23, 42, 0.18)"
            overflow="hidden"
            _dark={{ bg: 'gray.900', color: 'white', borderColor: 'gray.700' }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            {isLoggedIn ? (
              <Box p={5} borderBottomWidth="1px" borderColor="gray.100">
                <VStack align="stretch" gap={4}>
                  <Box>
                    <Text fontSize="2xl" fontWeight="800" lineHeight="1.2">
                      {user.name || user.email}
                    </Text>
                    {user.email && (
                      <Text
                        mt={2}
                        fontSize="lg"
                        fontWeight="700"
                        color="gray.500"
                        lineHeight="1.2"
                      >
                        {user.email}
                      </Text>
                    )}
                  </Box>
                  <Button
                    w="full"
                    h="52px"
                    borderRadius="full"
                    bg="gray.950"
                    color="white"
                    fontWeight="800"
                    fontSize="lg"
                    _hover={{ bg: 'gray.800' }}
                    onClick={() => navigateTo(ROUTES.HOST.TOURNAMENTS.LIST)}
                  >
                    Dashboard
                  </Button>
                </VStack>
              </Box>
            ) : (
              <Box p={4} borderBottomWidth="1px" borderColor="gray.100">
                <Button
                  w="full"
                  h="52px"
                  borderRadius="full"
                  bg="gray.950"
                  color="white"
                  fontWeight="800"
                  fontSize="lg"
                  _hover={{ bg: 'gray.800' }}
                  onClick={() => navigateTo(ROUTES.AUTH.SIGNUP)}
                >
                  <UserPlus size={18} />
                  {common('register')}
                </Button>
              </Box>
            )}

            <VStack align="stretch" gap={0} py={2}>
              {menuItems.map((item) => (
                <TournamentTopBarMenuItem
                  key={item.href}
                  label={item.label}
                  icon={item.icon}
                  onClick={() => navigateTo(item.href)}
                />
              ))}
            </VStack>

            {isLoggedIn ? (
              <Box borderTopWidth="1px" borderColor="gray.100" py={2}>
                <Button
                  variant="ghost"
                  justifyContent="flex-start"
                  h="56px"
                  w="full"
                  px={5}
                  borderRadius={0}
                  fontSize="lg"
                  fontWeight="700"
                  color="gray.900"
                  _hover={{ bg: 'gray.50' }}
                  _dark={{ color: 'white', _hover: { bg: 'gray.800' } }}
                  onClick={handleLogout}
                >
                  <HStack gap={4}>
                    <Flex
                      align="center"
                      justify="center"
                      w="36px"
                      h="36px"
                      borderRadius="full"
                      bg="gray.50"
                      color="gray.900"
                      borderWidth="1px"
                      borderColor="gray.100"
                      _dark={{
                        bg: 'gray.800',
                        color: 'white',
                        borderColor: 'gray.700',
                      }}
                    >
                      <LogOut size={19} strokeWidth={2.3} />
                    </Flex>
                    <Text>{common('logout')}</Text>
                  </HStack>
                </Button>
              </Box>
            ) : (
              <Box borderTopWidth="1px" borderColor="gray.100" py={2}>
                <Button
                  variant="ghost"
                  justifyContent="flex-start"
                  h="56px"
                  w="full"
                  px={5}
                  borderRadius={0}
                  fontSize="lg"
                  fontWeight="700"
                  color="gray.900"
                  _hover={{ bg: 'gray.50' }}
                  _dark={{ color: 'white', _hover: { bg: 'gray.800' } }}
                  onClick={() => navigateTo(ROUTES.AUTH.SIGNIN)}
                >
                  <HStack gap={4}>
                    <Flex
                      align="center"
                      justify="center"
                      w="36px"
                      h="36px"
                      borderRadius="full"
                      bg="gray.50"
                      color="gray.900"
                      borderWidth="1px"
                      borderColor="gray.100"
                      _dark={{
                        bg: 'gray.800',
                        color: 'white',
                        borderColor: 'gray.700',
                      }}
                    >
                      <LogIn size={19} strokeWidth={2.3} />
                    </Flex>
                    <Text>{common('login')}</Text>
                  </HStack>
                </Button>
              </Box>
            )}
          </Box>
        </>
      )}
    </Box>
  );
}

function TournamentTopBarMenuItem({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: typeof Home;
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      justifyContent="flex-start"
      h="56px"
      px={5}
      borderRadius={0}
      fontSize="lg"
      fontWeight="700"
      color="gray.900"
      _hover={{ bg: 'gray.50' }}
      _dark={{ color: 'white', _hover: { bg: 'gray.800' } }}
      onClick={onClick}
    >
      <HStack gap={4}>
        <Flex
          align="center"
          justify="center"
          w="36px"
          h="36px"
          borderRadius="full"
          bg="gray.50"
          color="gray.900"
          borderWidth="1px"
          borderColor="gray.100"
          _dark={{
            bg: 'gray.800',
            color: 'white',
            borderColor: 'gray.700',
          }}
        >
          <Icon size={19} strokeWidth={2.3} />
        </Flex>
        <Text>{label}</Text>
      </HStack>
    </Button>
  );
}

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

  const isHost = useMemo(
    () => user?.id === tournament?.hostId,
    [user, tournament]
  );

  const tabs = useMemo(() => {
    const allTabs = [
      { id: 0, label: t('tabs.home'), icon: Home },
      { id: 1, label: t('tabs.teams'), icon: Users },
      { id: 2, label: t('tabs.schedule'), icon: CalendarDays },
      { id: 3, label: t('tabs.standings'), icon: BarChart3 },
      { id: 4, label: t('tabs.manage'), icon: Settings },
      { id: 5, label: t('tabs.dashboard'), icon: LayoutGrid },
    ];

    if (!isHost) {
      return allTabs.filter((tab) => tab.id !== 4 && tab.id !== 5);
    }

    return allTabs;
  }, [isHost, t]);

  const activeTab = SEGMENT_TO_TAB[activeSegment];

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

  const getRegistrationTeamName = useCallback(
    (registration: CategoryRegistration) => {
      return (
        registration.player?.name ||
        registration.pair?.name ||
        registration.pair?.members
          ?.map((member) => member.player?.name)
          .filter(Boolean)
          .join(' & ') ||
        t('teamsTab.unknownTeam')
      );
    },
    [t]
  );

  const getRegistrationPlayers = useCallback(
    (
      registration: CategoryRegistration,
      playerCodeById: Map<string, string>
    ) => {
      const players: TournamentPlayer[] = [];

      if (registration.player) {
        players.push(registration.player);
      }

      registration.pair?.members?.forEach((member) => {
        if (member.player) {
          players.push(member.player);
        }
      });

      if (players.length > 0) {
        return players.map((player) => ({
          id: player.id,
          name: player.name,
          code:
            playerCodeById.get(player.id) ?? getTournamentPlayerCode(player.id),
        }));
      }

      return [
        {
          id: registration.tournamentPlayerId ?? registration.id,
          name: getRegistrationTeamName(registration),
          code: getTournamentPlayerCode(
            registration.tournamentPlayerId ?? registration.id
          ),
        },
      ];
    },
    [getRegistrationTeamName]
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
        setLoadingTeams(true);

        const data = await TournamentService.getTournament(slug);
        setTournament(data);

        const [categories, tournamentPlayers] = await Promise.all([
          CategoryService.getCategories(data.id),
          TournamentPlayerService.getPlayers(data.id),
        ]);
        const tournamentPlayerIds = tournamentPlayers.map(
          (player) => player.id
        );
        const playerCodeById = new Map(
          tournamentPlayers.map((player) => [
            player.id,
            getUniqueTournamentPlayerCode(player.id, tournamentPlayerIds),
          ])
        );
        const categoryBlocks = await Promise.all(
          categories.map(async (category) => {
            const registrations = await CategoryService.getRegistrations(
              category.id
            );

            return {
              id: category.id,
              title: resolveCategoryTitle(category),
              type: category.type,
              players: registrations.flatMap((registration) =>
                getRegistrationPlayers(registration, playerCodeById)
              ),
            } satisfies ITeamCategoryBlock;
          })
        );

        setTeamCategoryBlocks(categoryBlocks);
      } catch (error) {
        console.error('Error loading tournament:', error);
        setTeamCategoryBlocks([]);
      } finally {
        setLoading(false);
        setLoadingTeams(false);
      }
    };

    if (slug) {
      loadTournament();
    }
  }, [getRegistrationPlayers, resolveCategoryTitle, slug]);

  const sortedTeamCategoryBlocks = useMemo(() => {
    return [...teamCategoryBlocks].sort((firstCategory, secondCategory) =>
      firstCategory.title.localeCompare(secondCategory.title)
    );
  }, [teamCategoryBlocks]);

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
    if (
      !loading &&
      tournament &&
      !isHost &&
      (activeSegment === 'manage' || activeSegment === 'dashboard')
    ) {
      router.replace(`/tournament/${slug}`);
    }
  }, [loading, tournament, isHost, activeSegment, router, slug]);

  const handleManageTeamsClick = () => {
    router.push(`/tournament/${slug}/manage?option=teams`);
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
        rightContent={<TournamentTopBarMenu />}
      >
        <Flex justify="center" align="center" minH="50vh">
          <Spinner size="xl" />
        </Flex>
      </PageLayout>
    );
  }

  if (!tournament) {
    return (
      <PageLayout
        title={t('title')}
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
          totalTeams={teamCategoryBlocks.reduce(
            (sum, b) => sum + b.players.length,
            0
          )}
          isHost={isHost}
          slug={slug}
        />
      )}
      {activeTab === 1 && (
        <VStack align="stretch" gap={5}>
          <Flex justify="space-between" align="center" gap={4} wrap="wrap">
            <Heading size="lg">{t('tabs.teams')}</Heading>
            <Button
              size="sm"
              variant="subtle"
              colorPalette="gray"
              borderRadius="full"
              onClick={handleManageTeamsClick}
            >
              <HStack gap={2}>
                <SquarePen size={14} />
                <Text>{t('teamsTab.manageTeams')}</Text>
              </HStack>
            </Button>
          </Flex>

          {loadingTeams ? (
            <Flex justify="center" py={8}>
              <Spinner />
            </Flex>
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
            <VStack align="stretch" gap={5}>
              {sortedTeamCategoryBlocks.map((categoryBlock) => (
                <Box
                  key={categoryBlock.id}
                  borderWidth="1px"
                  borderColor="gray.200"
                  borderTopWidth="3px"
                  borderTopColor={CATEGORY_BORDER_COLOR[categoryBlock.type]}
                  borderRadius="2xl"
                  px={4}
                  py={4}
                  bg="white"
                >
                  <VStack align="stretch" gap={3}>
                    <Heading size="md">{categoryBlock.title}</Heading>

                    {categoryBlock.players.length === 0 ? (
                      <Text color="fg.muted">{t('teamsTab.noTeams')}</Text>
                    ) : (
                      <VStack align="stretch" gap={2}>
                        {categoryBlock.players.map((player) => (
                          <Link
                            key={`${categoryBlock.id}-${player.id}`}
                            href={`/t/${slug}/p/${player.code}`}
                            style={{ color: 'inherit', textDecoration: 'none' }}
                          >
                            <Flex
                              align="center"
                              gap={3}
                              borderRadius="md"
                              px={2}
                              py={1.5}
                              _hover={{ bg: 'gray.50' }}
                            >
                              <CircleUserRound
                                size={22}
                                color="var(--chakra-colors-gray-400)"
                              />
                              <Text flex="1" fontSize="lg" fontWeight="medium">
                                {player.name}
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                {player.code}
                              </Text>
                            </Flex>
                          </Link>
                        ))}
                      </VStack>
                    )}
                  </VStack>
                </Box>
              ))}
            </VStack>
          )}
        </VStack>
      )}
      {activeTab === 2 && (
        <>
          <Heading size="md" mb={4}>
            {t('tabs.schedule')}
          </Heading>
          <Text color="fg.muted">{t('comingSoon')}</Text>
        </>
      )}
      {activeTab === 3 && (
        <>
          <Heading size="md" mb={4}>
            {t('tabs.standings')}
          </Heading>
          <Text color="fg.muted">{t('comingSoon')}</Text>
        </>
      )}
      {activeTab === 4 && isHost && (
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
        showBackButton={false}
        topBarVariant="main"
        showTopBarMenuButton={false}
        showTopBarLogo={false}
        showTopBarAuthActions={false}
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
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    </>
  );
}
