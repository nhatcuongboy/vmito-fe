'use client';

import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Badge,
  Button,
  Flex,
  Heading,
  HStack,
  Image,
  Input,
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
import { useParams, useSearchParams } from 'next/navigation';
import { Link, useRouter } from '@/i18n/config';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  CircleUserRound,
  SquarePen,
  ArrowRight,
  LayoutList,
  UsersRound,
  Search,
  LayoutGrid,
} from 'lucide-react';
import TournamentDashboard from '@/components/tournament/TournamentDashboard';
import TournamentGuideWidget from '@/components/tournament/guide/TournamentGuideWidget';
import { subscribeTournamentProgressChanged } from '@/components/tournament/guide/progressEvents';
import TournamentHomeTab from '@/components/tournament/TournamentHomeTab';
import TournamentManage from '@/components/tournament/manage/TournamentManage';
import TournamentSidebar from '@/components/tournament/TournamentSidebar';
import PublicTournamentStandingsTab from '@/components/tournament/PublicTournamentStandingsTab';
import ResultsPanel from '@/components/tournament/manage/panels/ResultsPanel';
import { useTournamentBottomNav } from '@/hooks/useTournamentBottomNav';
import { useTournamentNavCache } from '@/hooks/useTournamentNavCache';
import { writeTournamentNavCache } from '@/lib/tournamentNavCache';
import TournamentTopBarMenu from '@/components/tournament/TournamentTopBarMenu';
import TournamentSegmentSkeleton from '@/components/tournament/TournamentSegmentSkeleton';
import {
  getTournamentPlayerCode,
  getUniqueTournamentPlayerCode,
} from '@/components/tournament/player/PublicTournamentPlayerPage';
import { getTournamentPlayerDisplayCode } from '@/lib/tournament/codes';
import { TOP_BAR_HEIGHT_DESKTOP } from '@/constants';

import {
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

const CATEGORY_ACCENT_BG_DARK: Record<CategoryType, string> = {
  [CategoryType.MENS_SINGLE]: 'blue.900',
  [CategoryType.WOMENS_SINGLE]: 'pink.900',
  [CategoryType.MENS_DOUBLE]: 'yellow.900',
  [CategoryType.WOMENS_DOUBLE]: 'orange.900',
  [CategoryType.MIXED_DOUBLE]: 'cyan.900',
  [CategoryType.CUSTOM]: 'purple.900',
};

type TeamListItem = ITeamCategoryBlock['players'][number];

interface IAllPlayerItem {
  id: string;
  name: string;
  code: string;
  image?: string;
  categories: string[];
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

interface TournamentPageShellProps {
  activeSegment: TournamentSegment;
}

function getAvatarInitials(name: string) {
  const normalized = name.trim();
  if (!normalized) return '';

  const words = normalized.split(/\s+/);
  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? '') : '';

  return `${first}${last}`.toLocaleUpperCase('vi-VN');
}

function TeamDefaultAvatar() {
  return (
    <Flex
      align="center"
      justify="center"
      w="44px"
      h="44px"
      borderRadius="full"
      bg="linear-gradient(135deg, #ecfdf5 0%, #d1fae5 58%, #fef3c7 140%)"
      borderWidth="1px"
      borderColor="green.200"
      color="green.700"
      boxShadow="inset 0 1px 0 rgba(255,255,255,0.78), 0 8px 18px rgba(22, 163, 74, 0.12)"
      flexShrink={0}
      _dark={{
        bg: 'linear-gradient(135deg, rgba(6, 78, 59, 0.72) 0%, rgba(20, 83, 45, 0.58) 100%)',
        borderColor: 'green.600',
        color: 'green.100',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
      }}
    >
      <UsersRound size={22} strokeWidth={2.3} />
    </Flex>
  );
}

function PlayerDefaultAvatar({ name }: { name: string }) {
  const initials = getAvatarInitials(name);

  return (
    <Flex
      align="center"
      justify="center"
      w="44px"
      h="44px"
      borderRadius="full"
      bg="linear-gradient(135deg, #16a34a 0%, #059669 56%, #0f766e 100%)"
      borderWidth="2px"
      borderColor="white"
      color="white"
      boxShadow="0 8px 20px rgba(5, 150, 105, 0.24)"
      flexShrink={0}
      _dark={{
        borderColor: 'rgba(255,255,255,0.18)',
        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.28)',
      }}
    >
      {initials ? (
        <Text fontSize="sm" fontWeight="bold" letterSpacing="0">
          {initials}
        </Text>
      ) : (
        <CircleUserRound size={23} />
      )}
    </Flex>
  );
}

function PlayerAvatar({ name, image }: { name: string; image?: string }) {
  if (!image) return <PlayerDefaultAvatar name={name} />;

  return (
    <Flex
      align="center"
      justify="center"
      w="44px"
      h="44px"
      borderRadius="full"
      borderWidth="2px"
      borderColor="white"
      boxShadow="0 8px 20px rgba(15, 23, 42, 0.1)"
      flexShrink={0}
      overflow="hidden"
      _dark={{
        borderColor: 'rgba(255,255,255,0.16)',
        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.28)',
      }}
    >
      <Image src={image} alt={name} w="full" h="full" objectFit="cover" />
    </Flex>
  );
}

function TeamCategoryCard({
  categoryBlock,
  slug,
  emptyText,
  teamCountLabel,
}: {
  categoryBlock: ITeamCategoryBlock;
  slug: string;
  emptyText: string;
  teamCountLabel: string;
}) {
  return (
    <Box
      id={`category-${categoryBlock.id}`}
      borderWidth="1px"
      borderColor="gray.200"
      borderTopWidth="4px"
      borderTopColor={CATEGORY_BORDER_COLOR[categoryBlock.type]}
      borderRadius="2xl"
      bg="white"
      overflow="hidden"
      boxShadow="0 18px 46px rgba(15, 23, 42, 0.06)"
      _dark={{
        bg: 'var(--tournament-surface-raised, var(--chakra-colors-gray-800))',
        borderColor: 'var(--tournament-border, var(--chakra-colors-gray-700))',
        boxShadow: 'var(--tournament-shadow)',
      }}
    >
      <Flex
        align="center"
        justify="space-between"
        gap={3}
        px={{ base: 4, md: 5 }}
        py={4}
        bg={CATEGORY_ACCENT_BG[categoryBlock.type]}
        _dark={{
          bg: CATEGORY_ACCENT_BG_DARK[categoryBlock.type],
          borderBottomWidth: '1px',
          borderBottomColor:
            'var(--tournament-border, var(--chakra-colors-gray-700))',
        }}
      >
        <Heading size="md" lineClamp={1} minW={0} flex="1">
          {categoryBlock.title}
        </Heading>
        <Badge
          colorPalette="green"
          variant="solid"
          borderRadius="full"
          px={3}
          py={1}
          flexShrink={0}
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
  showDivider,
}: {
  team: TeamListItem;
  slug: string;
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
      _dark={{
        borderColor: 'var(--tournament-border, var(--chakra-colors-gray-700))',
        _hover: team.code
          ? {
              bg: 'var(--tournament-accent-soft, rgba(34, 197, 94, 0.14))',
            }
          : {},
      }}
    >
      <TeamDefaultAvatar />

      <Box flex="1" minW={0}>
        <Flex align="center" gap={2} minW={0}>
          <Text
            fontSize={{ base: 'sm', md: 'md' }}
            fontWeight="semibold"
            lineClamp={1}
          >
            {team.name}
          </Text>
        </Flex>
        {team.members && team.members.length > 0 && (
          <Text
            mt={0.5}
            fontSize="xs"
            color="gray.500"
            lineClamp={1}
            _dark={{ color: 'gray.400' }}
          >
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

function PlayerRow({
  player,
  slug,
  showDivider,
}: {
  player: IAllPlayerItem;
  slug: string;
  showDivider: boolean;
}) {
  return (
    <Link
      href={`/t/${slug}/p/${player.code}`}
      style={{ color: 'inherit', textDecoration: 'none' }}
    >
      <Flex
        align="center"
        gap={3}
        px={{ base: 2, md: 3 }}
        py={3}
        borderBottomWidth={showDivider ? '1px' : '0'}
        borderColor="gray.100"
        borderRadius="lg"
        transition="background 160ms ease, transform 160ms ease"
        _hover={{ bg: 'gray.50', transform: 'translateX(2px)' }}
        _dark={{
          borderColor:
            'var(--tournament-border, var(--chakra-colors-gray-700))',
          _hover: {
            bg: 'var(--tournament-accent-soft, rgba(34, 197, 94, 0.14))',
          },
        }}
      >
        <PlayerAvatar name={player.name} image={player.image} />

        <Box flex="1" minW={0}>
          <Text
            fontSize={{ base: 'sm', md: 'md' }}
            fontWeight="semibold"
            lineClamp={1}
          >
            {player.name}
          </Text>
          {player.categories.length > 0 && (
            <Text
              mt={0.5}
              fontSize="xs"
              color="gray.500"
              lineClamp={1}
              _dark={{ color: 'gray.400' }}
            >
              {player.categories.join(' · ')}
            </Text>
          )}
        </Box>

        <Flex color="gray.400" flexShrink={0}>
          <ArrowRight size={18} />
        </Flex>
      </Flex>
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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [teamCategoryBlocks, setTeamCategoryBlocks] = useState<
    ITeamCategoryBlock[]
  >([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [totalAthletes, setTotalAthletes] = useState(0);
  const [allPlayers, setAllPlayers] = useState<IAllPlayerItem[]>([]);
  const searchParams = useSearchParams();
  const [teamsView, setTeamsView] = useState<'category' | 'players'>(() =>
    searchParams.get('view') === 'category' ? 'category' : 'players'
  );

  const handleTeamsViewChange = useCallback(
    (view: 'category' | 'players') => {
      setTeamsView(view);
      const params = new URLSearchParams(searchParams.toString());
      params.set('view', view);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );
  const [playerSearch, setPlayerSearch] = useState('');

  const isHost = useMemo(
    () => user?.id === tournament?.hostId,
    [user, tournament]
  );

  // Management access for the current user: host, system admin, or an assigned
  // manager with at least one permission scope. Lets managers reach the manage
  // screen (per-action scopes are still enforced by the backend).
  const [myAccess, setMyAccess] = useState<TournamentMyAccess | null>(null);
  const [myAccessChecked, setMyAccessChecked] = useState(false);

  useEffect(() => {
    if (!user || !tournament) {
      setMyAccess(null);
      setMyAccessChecked(true);
      return;
    }
    let active = true;
    setMyAccessChecked(false);
    TournamentManagerService.getMyAccess(tournament.id)
      .then((access) => {
        if (active) {
          setMyAccess(access);
          setMyAccessChecked(true);
        }
      })
      .catch(() => {
        if (active) {
          setMyAccess(null);
          setMyAccessChecked(true);
        }
      });
    return () => {
      active = false;
    };
  }, [user, tournament]);

  const isAdmin = user?.role === 'ADMIN';
  const realIsHostOrAdmin = isHost || isAdmin;
  const realCanManage =
    isHost || isAdmin || (myAccess?.permissions.length ?? 0) > 0;

  // Management visibility is only fully known once the tournament (for host
  // detection) and the manager-access check have both resolved. Until then we
  // optimistically reuse the per-session cache so a host/admin/manager keeps
  // their Manage/Dashboard tabs across tab navigations instead of flickering
  // back to the 4 public tabs. The cache is read in a layout effect (not during
  // render) so the hydration render matches the server HTML; the bottom bar is
  // hidden until `navCacheReady` so it appears exactly once with the right tabs.
  const accessResolved = !!tournament && myAccessChecked;
  const { access: cachedAccess, ready: navCacheReady } =
    useTournamentNavCache(slug);

  const canManage = accessResolved
    ? realCanManage
    : (cachedAccess?.canManage ?? false);
  const isHostOrAdmin = accessResolved
    ? realIsHostOrAdmin
    : (cachedAccess?.isHostOrAdmin ?? false);

  useEffect(() => {
    if (!accessResolved) return;
    writeTournamentNavCache(slug, {
      canManage: realCanManage,
      isHostOrAdmin: realIsHostOrAdmin,
    });
  }, [accessResolved, realCanManage, realIsHostOrAdmin, slug]);

  const activeTab = SEGMENT_TO_TAB[activeSegment];

  const { tabs, bottomNavTabs, handleTabChange, isMobile } =
    useTournamentBottomNav({
      slug,
      activeTabId: activeTab,
      canManage,
      isHostOrAdmin,
    });

  const appRootHref = '/';
  const topBarIcon = (
    <Image
      src="/icons/app-logo-96.png"
      h="28px"
      w="28px"
      alt="Vmito"
      loading="eager"
    />
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
        setTotalAthletes(0);
        setAllPlayers([]);

        const data = await TournamentService.getTournament(slug);
        setTournament(data);
      } catch (error) {
        console.error('Error loading tournament:', error);
        setTournament(null);
        setAllCategories([]);
        setTeamCategoryBlocks([]);
        setTotalAthletes(0);
        setAllPlayers([]);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadTournament();
    }
  }, [slug]);

  // Keep the tournament object fresh when setup-affecting mutations happen
  // elsewhere on the page (Manage tab panels), so the setup guide widget's
  // step completion stays in sync without a full reload.
  useEffect(() => {
    if (!slug) return;
    return subscribeTournamentProgressChanged(() => {
      TournamentService.getTournament(slug)
        .then(setTournament)
        .catch((error) => {
          console.error('Error refreshing tournament:', error);
        });
    });
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

        // Build the list of categories each player participates in so the
        // "All players" view can show their categories under each name.
        const playerCategoryTitles = new Map<string, Set<string>>();
        registrationsByCategory.forEach(({ category, registrations }) => {
          const title = resolveCategoryTitle(category);
          const addCategory = (playerId?: string | null) => {
            if (!playerId) return;
            if (!playerCategoryTitles.has(playerId)) {
              playerCategoryTitles.set(playerId, new Set());
            }
            playerCategoryTitles.get(playerId)!.add(title);
          };
          registrations.forEach((registration) => {
            addCategory(registration.player?.id);
            addCategory(registration.tournamentPlayerId);
            registration.pair?.members?.forEach((member) => {
              addCategory(member.player?.id ?? member.playerId);
            });
          });
        });

        const allPlayerItems: IAllPlayerItem[] = tournamentPlayers
          .map((player) => ({
            id: player.id,
            name: player.name,
            code:
              playerCodeById.get(player.id) ??
              getTournamentPlayerDisplayCode(player, tournamentPlayerIds),
            image: player.image,
            categories: Array.from(
              playerCategoryTitles.get(player.id) ?? []
            ).sort((a, b) => a.localeCompare(b)),
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        if (!isMounted) return;

        setAllCategories(categories);
        setTeamCategoryBlocks(categoryBlocks);
        setTotalAthletes(tournamentPlayers.length);
        setAllPlayers(allPlayerItems);
      } catch (error) {
        console.error('Error loading tournament teams:', error);
        if (!isMounted) return;

        setAllCategories([]);
        setTeamCategoryBlocks([]);
        setTotalAthletes(0);
        setAllPlayers([]);
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

  const filteredAllPlayers = useMemo(() => {
    const query = playerSearch.trim().toLowerCase();
    if (!query) return allPlayers;
    return allPlayers.filter(
      (player) =>
        player.name.toLowerCase().includes(query) ||
        player.code.toLowerCase().includes(query) ||
        player.categories.some((category) =>
          category.toLowerCase().includes(query)
        )
    );
  }, [allPlayers, playerSearch]);

  useEffect(() => {
    if (loading || !tournament) return;
    // For a host/admin or a logged-out user the verdict is immediate; for a
    // potential manager we must wait until the access check has resolved before
    // redirecting, otherwise we'd bounce them off /manage prematurely.
    const accessResolved = isHost || isAdmin || !user || myAccessChecked;
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
    myAccessChecked,
    activeSegment,
    router,
    slug,
  ]);

  const handleManageTeamsClick = () => {
    router.push(`/tournament/${slug}/manage?option=teams`);
  };

  const handleOpenRoundsPanel = useCallback(
    (categoryId: string) => {
      router.push(
        `/tournament/${slug}/manage?option=rounds&categoryId=${categoryId}`
      );
    },
    [router, slug]
  );

  const renderDesktopTournamentFrame = (
    content: ReactNode,
    sidebarTournament: Tournament | null,
    showStatusBadge: boolean
  ) => {
    const isManageTab = activeTab === 4 && canManage;

    return (
      <Box
        display={{ base: 'none', md: 'flex' }}
        h={{
          md: `calc(100vh - ${TOP_BAR_HEIGHT_DESKTOP}px - env(safe-area-inset-top))`,
        }}
        minH={0}
        bg="transparent"
        borderWidth="1px"
        borderColor="gray.200"
        borderTopLeftRadius="2xl"
        borderTopRightRadius={0}
        borderBottomRadius={0}
        boxShadow="var(--tournament-shadow)"
        overflow="hidden"
        _dark={{
          bg: 'transparent',
          borderColor: 'var(--tournament-border)',
          boxShadow: 'var(--tournament-shadow)',
        }}
      >
        <TournamentSidebar
          tournament={sidebarTournament}
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          showStatusBadge={showStatusBadge}
          showFavorite={false}
          showGuideToggle={isHostOrAdmin}
          variant="embedded"
        />
        <Box
          flex="1"
          minW={0}
          h="100%"
          overflowY={isManageTab ? 'hidden' : 'auto'}
          bg="transparent"
          _dark={{ bg: 'transparent' }}
          css={{
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(148, 163, 184, 0.42)',
              borderRadius: '999px',
            },
          }}
        >
          <Box
            h={isManageTab ? '100%' : undefined}
            p={isManageTab ? 0 : { md: 6, xl: 8 }}
          >
            {content}
          </Box>
        </Box>
      </Box>
    );
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
          topBarLogoHref={appRootHref}
          centerTitle
          showTopBarAuthActions={false}
          disableSidebarOffset
          rightContent={<TournamentTopBarMenu />}
          rootClassName="tournament-shell"
          topBarClassName="tournament-topbar"
          bg="var(--tournament-bg)"
          maxW="full"
          contentTopOffset="0px"
          px={{ base: '24px', md: 0 }}
          pb={{
            base: 'calc(64px + env(safe-area-inset-bottom) + 24px)',
            md: 0,
          }}
        >
          {/* Desktop: real sidebar (skeleton header, real tabs) + content skeleton */}
          {renderDesktopTournamentFrame(
            <TournamentSegmentSkeleton activeSegment={activeSegment} />,
            null,
            false
          )}

          {/* Mobile: content skeleton only */}
          <Box display={{ base: 'block', md: 'none' }}>
            <TournamentSegmentSkeleton activeSegment={activeSegment} />
          </Box>
        </PageLayout>

        {/* Bottom tabs render once the cached access state is known, so the
            menu never swaps between guest and host tab sets */}
        {navCacheReady && (
          <BottomNavigationBar
            tabs={bottomNavTabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        )}
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
        topBarLogoHref={appRootHref}
        showTopBarAuthActions={false}
        rightContent={<TournamentTopBarMenu />}
        rootClassName="tournament-shell"
        topBarClassName="tournament-topbar"
        bg="var(--tournament-bg)"
      >
        <Text>{t('notFound')}</Text>
      </PageLayout>
    );
  }

  const renderContent = (layout: 'desktop' | 'mobile') => (
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
          totalAthletes={totalAthletes}
          isLoadingCategories={loadingTeams}
          canManageTournament={isHostOrAdmin}
          slug={slug}
          showFavoriteOverlay
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
              <Heading size="lg" display={{ base: 'none', md: 'block' }}>
                {t('tabs.teams')}
              </Heading>
            </Box>
          </Flex>

          {/* View toggle: by category vs. all players */}
          <Flex align="center" justify="space-between" gap={3}>
            {canManage && (
              <Button
                size="sm"
                variant="subtle"
                colorPalette="gray"
                borderRadius="full"
                px={4}
                onClick={handleManageTeamsClick}
              >
                <HStack gap={2}>
                  <SquarePen size={15} />
                  <Text>{t('teamsTab.manageTeams')}</Text>
                </HStack>
              </Button>
            )}
            <Flex
              p={0.5}
              gap={0.5}
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="lg"
              bg="white"
              ml="auto"
              shadow="sm"
              h="fit-content"
              _dark={{
                bg: 'var(--tournament-surface, var(--chakra-colors-gray-800))',
                borderColor:
                  'var(--tournament-border, var(--chakra-colors-gray-700))',
              }}
            >
              <Button
                size="sm"
                variant={teamsView === 'players' ? 'solid' : 'ghost'}
                colorPalette={teamsView === 'players' ? 'green' : 'gray'}
                borderRadius="md"
                h={8}
                px={3}
                onClick={() => handleTeamsViewChange('players')}
              >
                <HStack gap={2}>
                  <UsersRound size={15} />
                  <Text>{t('teamsTab.viewAllPlayers')}</Text>
                </HStack>
              </Button>
              <Button
                size="sm"
                variant={teamsView === 'category' ? 'solid' : 'ghost'}
                colorPalette={teamsView === 'category' ? 'green' : 'gray'}
                borderRadius="md"
                h={8}
                px={3}
                onClick={() => handleTeamsViewChange('category')}
              >
                <HStack gap={2}>
                  <LayoutList size={15} />
                  <Text>{t('teamsTab.viewByCategory')}</Text>
                </HStack>
              </Button>
            </Flex>
          </Flex>

          {teamsView === 'category' ? (
            loadingTeams ? (
              <TournamentTeamsSkeleton />
            ) : sortedTeamCategoryBlocks.length === 0 ? (
              <Box
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="xl"
                px={6}
                py={8}
                bg="white"
                boxShadow="sm"
                _dark={{
                  bg: 'var(--tournament-surface-raised, var(--chakra-colors-gray-800))',
                  borderColor:
                    'var(--tournament-border, var(--chakra-colors-gray-700))',
                  boxShadow: 'var(--tournament-shadow-soft)',
                }}
              >
                <Text color="fg.muted">{t('teamsTab.noCategories')}</Text>
              </Box>
            ) : (
              <SimpleGrid
                columns={{ base: 1, xl: 2 }}
                gap={5}
                alignItems="start"
              >
                {sortedTeamCategoryBlocks.map((categoryBlock) => (
                  <TeamCategoryCard
                    key={categoryBlock.id}
                    categoryBlock={categoryBlock}
                    slug={slug}
                    emptyText={t('teamsTab.noTeams')}
                    teamCountLabel={t('teamsTab.teamsCount', {
                      count: categoryBlock.players.length,
                    })}
                  />
                ))}
              </SimpleGrid>
            )
          ) : loadingTeams ? (
            <TournamentTeamsSkeleton />
          ) : allPlayers.length === 0 ? (
            <Box
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="xl"
              px={6}
              py={8}
              bg="white"
              boxShadow="sm"
              _dark={{
                bg: 'var(--tournament-surface-raised, var(--chakra-colors-gray-800))',
                borderColor:
                  'var(--tournament-border, var(--chakra-colors-gray-700))',
                boxShadow: 'var(--tournament-shadow-soft)',
              }}
            >
              <Text color="fg.muted">{t('teamsTab.noPlayers')}</Text>
            </Box>
          ) : (
            <Box
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="2xl"
              bg="white"
              overflow="hidden"
              boxShadow="0 18px 46px rgba(15, 23, 42, 0.06)"
              _dark={{
                bg: 'var(--tournament-surface-raised, var(--chakra-colors-gray-800))',
                borderColor:
                  'var(--tournament-border, var(--chakra-colors-gray-700))',
                boxShadow: 'var(--tournament-shadow)',
              }}
            >
              <Flex
                align="center"
                gap={3}
                px={{ base: 4, md: 5 }}
                py={4}
                borderBottomWidth="1px"
                borderColor="gray.100"
                _dark={{
                  borderColor:
                    'var(--tournament-border, var(--chakra-colors-gray-700))',
                }}
              >
                <Box flex="1" position="relative" maxW="360px">
                  <Box
                    position="absolute"
                    left={3}
                    top="50%"
                    transform="translateY(-50%)"
                    color="gray.400"
                    pointerEvents="none"
                  >
                    <Search size={16} />
                  </Box>
                  <Input
                    value={playerSearch}
                    onChange={(event) => setPlayerSearch(event.target.value)}
                    placeholder={t('teamsTab.searchPlayers')}
                    pl={9}
                    borderRadius="full"
                    size="sm"
                  />
                </Box>
                <Badge
                  colorPalette="green"
                  variant="solid"
                  borderRadius="full"
                  px={3}
                  py={1}
                  flexShrink={0}
                >
                  {t('teamsTab.totalPlayers', {
                    count: filteredAllPlayers.length,
                  })}
                </Badge>
              </Flex>

              {filteredAllPlayers.length === 0 ? (
                <Box px={{ base: 4, md: 5 }} py={5}>
                  <Text color="fg.muted">{t('teamsTab.noPlayers')}</Text>
                </Box>
              ) : (
                <VStack align="stretch" gap={0} px={{ base: 3, md: 4 }} py={3}>
                  {filteredAllPlayers.map((player, index) => (
                    <PlayerRow
                      key={player.id}
                      player={player}
                      slug={slug}
                      showDivider={index < filteredAllPlayers.length - 1}
                    />
                  ))}
                </VStack>
              )}
            </Box>
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
            canEdit={isHostOrAdmin}
            heading={t('tabs.schedule')}
            hideHeadingOnMobile
            onOpenRoundsPanel={handleOpenRoundsPanel}
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
            isHost={isHostOrAdmin}
          />
        ))}
      {activeTab === 4 && canManage && (
        <TournamentManage
          tournament={tournament}
          onTournamentUpdate={(updated) => setTournament(updated)}
        />
      )}
      {activeTab === 5 && isHostOrAdmin && (
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
        topBarLogoHref={appRootHref}
        centerTitle
        showTopBarAuthActions={false}
        disableSidebarOffset
        rightContent={<TournamentTopBarMenu />}
        rootClassName="tournament-shell"
        topBarClassName="tournament-topbar"
        bg="var(--tournament-bg)"
        maxW="full"
        contentTopOffset="0px"
        px={{ base: '24px', md: 0 }}
        pb={{
          base: 'calc(64px + env(safe-area-inset-bottom) + 24px)',
          md: 0,
        }}
      >
        {/* Desktop: sidebar + content in one tournament container */}
        {renderDesktopTournamentFrame(
          renderContent('desktop'),
          tournament,
          canManage
        )}

        {/* Mobile: content only */}
        <Box display={{ base: 'block', md: 'none' }}>
          {renderContent('mobile')}
        </Box>
      </PageLayout>

      {/* Desktop-only floating guide stepper for hosts/admins */}
      {tournament && isHostOrAdmin && (
        <TournamentGuideWidget
          tournament={tournament}
          onTournamentUpdate={(updated) => setTournament(updated)}
        />
      )}

      {/* Mobile Floating Action Button (FAB) for Dashboard */}
      {isMounted &&
        isMobile &&
        isHostOrAdmin &&
        activeSegment !== 'dashboard' && (
          <Box
            position="fixed"
            bottom="calc(80px + env(safe-area-inset-bottom))"
            right="20px"
            zIndex={1100}
          >
            <Button
              variant="solid"
              colorPalette="green"
              borderRadius="full"
              boxShadow="0 4px 16px rgba(34, 197, 94, 0.4)"
              size="lg"
              h="50px"
              w="50px"
              p={0}
              onClick={() => router.push(`/tournament/${slug}/dashboard`)}
              _active={{ transform: 'scale(0.96)' }}
              transition="all 0.2s"
            >
              <LayoutGrid size={22} />
            </Button>
          </Box>
        )}

      {/* Bottom tabs: mobile only */}
      {navCacheReady && (
        <BottomNavigationBar
          tabs={bottomNavTabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      )}
    </>
  );
}
