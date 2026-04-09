'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import PageLayout from '@/components/layout/PageLayout';
import BottomNavigationBar from '@/components/ui/BottomNavigationBar';
import { TournamentService } from '@/lib/api/tournament.service';
import {
  Category,
  CategoryRegistration,
  CategoryType,
  Tournament,
} from '@/lib/api/types';
import { CategoryService } from '@/lib/api/category.service';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/config';
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
} from 'lucide-react';
import TournamentDashboard from '@/components/tournament/TournamentDashboard';
import TournamentHomeTab from '@/components/tournament/TournamentHomeTab';
import TournamentManage from '@/components/tournament/manage/TournamentManage';
import TournamentSidebar from '@/components/tournament/TournamentSidebar';

interface ITeamCategoryBlock {
  id: string;
  title: string;
  type: CategoryType;
  teams: string[];
}

const CATEGORY_BORDER_COLOR: Record<CategoryType, string> = {
  [CategoryType.MENS_SINGLE]: 'blue.300',
  [CategoryType.WOMENS_SINGLE]: 'pink.300',
  [CategoryType.MENS_DOUBLE]: 'yellow.300',
  [CategoryType.WOMENS_DOUBLE]: 'orange.300',
  [CategoryType.MIXED_DOUBLE]: 'cyan.300',
  [CategoryType.CUSTOM]: 'purple.300',
};

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

        const categories = await CategoryService.getCategories(data.id);
        const categoryBlocks = await Promise.all(
          categories.map(async (category) => {
            const registrations = await CategoryService.getRegistrations(
              category.id
            );

            return {
              id: category.id,
              title: resolveCategoryTitle(category),
              type: category.type,
              teams: registrations.map(getRegistrationTeamName),
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
  }, [getRegistrationTeamName, resolveCategoryTitle, slug]);

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
      <PageLayout title={t('title')} showBackButton={false}>
        <Flex justify="center" align="center" minH="50vh">
          <Spinner size="xl" />
        </Flex>
      </PageLayout>
    );
  }

  if (!tournament) {
    return (
      <PageLayout title={t('title')} showBackButton={false}>
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
            (sum, b) => sum + b.teams.length,
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

                    {categoryBlock.teams.length === 0 ? (
                      <Text color="fg.muted">{t('teamsTab.noTeams')}</Text>
                    ) : (
                      <VStack align="stretch" gap={2}>
                        {categoryBlock.teams.map((teamName, index) => (
                          <Flex
                            key={`${categoryBlock.id}-${teamName}-${index}`}
                            align="center"
                            gap={3}
                          >
                            <CircleUserRound
                              size={22}
                              color="var(--chakra-colors-gray-400)"
                            />
                            <Text fontSize="lg" fontWeight="medium">
                              {teamName}
                            </Text>
                          </Flex>
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
        maxW="container.xl"
        pb={{
          base: 'calc(64px + env(safe-area-inset-bottom) + 24px)',
          md: '24px',
        }}
      >
        {/* Desktop: sidebar + content */}
        <Flex display={{ base: 'none', md: 'flex' }} gap={8}>
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
