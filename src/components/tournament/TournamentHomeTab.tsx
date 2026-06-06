'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Flex,
  Grid,
  HStack,
  Image,
  Link,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react';
import { AppAddressDisplay } from '@/components/common/AppAddressDisplay';
import {
  Users,
  UserRound,
  CalendarDays,
  BarChart3,
  ChevronRight,
  MapPin,
  Navigation,
  Pencil,
  Trash2,
  CheckCircle,
  MonitorPlay,
  Gavel,
  NotebookText,
  Sparkles,
  GitBranch,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Tournament,
  Category,
  CategoryType,
  CategoryRegistrationMode,
  TournamentVenue,
  UserRole,
  Venue,
  Sponsor,
  CategoryFormat,
} from '@/lib/api/types';
import { TournamentService } from '@/lib/api/tournament.service';
import { SponsorService } from '@/lib/api/sponsor.service';
import {
  DEFAULT_RR_CONFIG,
  DEFAULT_RR_TO_SE_CONFIG,
  DEFAULT_SE_CONFIG,
} from '@/components/tournament/format-wizard/constants';
import type {
  RoundRobinConfig,
  RoundRobinToSEConfig,
  SingleEliminationConfig,
  StandingsColumn,
  StatisticItem,
  TiebreakerItem,
} from '@/components/tournament/format-wizard/types';
import PublicTournamentWinnersTab from '@/components/tournament/PublicTournamentWinnersTab';
import TournamentQrBar from '@/components/tournament/TournamentQrBar';
import { TournamentTableSkeleton } from '@/components/tournament/skeletons';
import { useRouter } from '@/i18n/config';
import { useAuthStore } from '@/stores/useAuthStore';
import { getGoogleMapsUrl } from '@/utils';
import { Button } from '@/components/ui/chakra-compat';
import { toaster } from '@/components/ui/toaster';
import VenueMapPin from '@/components/venue/VenueMapPin';
import { VModal, useModal } from '@/components/ui/VModal';
import { getYouTubeEmbed } from '@/lib/utils/youtube';

interface ICategoryHomeItem {
  id: string;
  name: string;
  type: CategoryType;
}

interface IHomeVenueItem {
  id: string;
  venue: Venue;
}

interface TournamentHomeTabProps {
  tournament: Tournament;
  categories: ICategoryHomeItem[];
  /** Full category objects, used by the embedded champions/podium section. */
  fullCategories: Category[];
  totalTeams: number;
  totalAthletes: number;
  isLoadingCategories?: boolean;
  isHost: boolean;
  slug: string;
}

const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

function renderTextWithLinks(text: string): ReactNode[] {
  return text.split(URL_PATTERN).map((part, index) => {
    if (!URL_PATTERN.test(part)) return part;
    URL_PATTERN.lastIndex = 0;

    return (
      <Link
        key={`${part}-${index}`}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        color="green.600"
        fontWeight="medium"
        textDecoration="underline"
        textUnderlineOffset="2px"
        wordBreak="break-all"
        _dark={{ color: 'green.300' }}
      >
        {part}
      </Link>
    );
  });
}

function getCategoryLabel(category: Category | ICategoryHomeItem) {
  return category.name?.trim() || category.type;
}

function getRoundRobinConfig(category: Category): RoundRobinConfig {
  const formatConfig =
    (category.formatConfig as Record<string, unknown> | null | undefined) ?? {};
  const rrConfig =
    (formatConfig.roundRobin as Record<string, unknown> | null | undefined) ??
    formatConfig;

  return {
    ...DEFAULT_RR_CONFIG,
    ...rrConfig,
    tiebreakers:
      (rrConfig.tiebreakers as TiebreakerItem[] | undefined) ??
      DEFAULT_RR_CONFIG.tiebreakers,
    headToHeadTiebreakers:
      (rrConfig.headToHeadTiebreakers as TiebreakerItem[] | undefined) ??
      DEFAULT_RR_CONFIG.headToHeadTiebreakers,
    statistics:
      (rrConfig.statistics as StatisticItem[] | undefined) ??
      DEFAULT_RR_CONFIG.statistics,
    standingsColumns:
      (rrConfig.standingsColumns as StandingsColumn[] | undefined) ??
      DEFAULT_RR_CONFIG.standingsColumns,
  };
}

function getSingleEliminationConfig(
  category: Category
): SingleEliminationConfig {
  const formatConfig =
    (category.formatConfig as Partial<SingleEliminationConfig> | null) ?? {};

  return {
    ...DEFAULT_SE_CONFIG,
    ...formatConfig,
  };
}

function getRoundRobinToSEConfig(category: Category): RoundRobinToSEConfig {
  const formatConfig =
    (category.formatConfig as Partial<RoundRobinToSEConfig> | null) ?? {};
  const qualifiersPerGroup =
    category.winnersPerGroup ?? formatConfig.qualifiersPerGroup;

  return {
    ...DEFAULT_RR_TO_SE_CONFIG,
    ...formatConfig,
    ...(qualifiersPerGroup !== undefined ? { qualifiersPerGroup } : {}),
    roundRobin: getRoundRobinConfig(category),
  };
}

function getPointsEarningLabel(
  pointsEarning: RoundRobinConfig['pointsEarning'],
  tRoundRobin: ReturnType<typeof useTranslations>
) {
  switch (pointsEarning) {
    case 'manual':
      return tRoundRobin('manual');
    case 'tiebreakers_only':
      return tRoundRobin('tiebreakersOnly');
    case 'match_results':
    default:
      return tRoundRobin('basedOnMatchResults');
  }
}

function getMatchFormatLabel(
  matchFormat: SingleEliminationConfig['matchFormat'],
  tSingleElimination: ReturnType<typeof useTranslations>
) {
  switch (matchFormat) {
    case 'BEST_OF_1':
      return tSingleElimination('bestOf1');
    case 'BEST_OF_5':
      return 'Best of 5';
    case 'BEST_OF_3':
    default:
      return tSingleElimination('bestOf3');
  }
}

function getFormatLabel(
  format: CategoryFormat,
  tFormat: ReturnType<typeof useTranslations>
) {
  switch (format) {
    case CategoryFormat.SINGLE_ELIMINATION:
      return tFormat('formats.SINGLE_ELIMINATION.name');
    case CategoryFormat.ROUND_ROBIN_TO_SE:
      return tFormat('formats.ROUND_ROBIN_TO_SE.name');
    case CategoryFormat.ROUND_ROBIN:
    default:
      return tFormat('formats.ROUND_ROBIN.name');
  }
}

function CompetitionInfoSection({ categories }: { categories: Category[] }) {
  const t = useTranslations('pages.tournaments.detail.homeTab');
  const tFormat = useTranslations('pages.tournaments.detail.formatWizard');
  const tRoundRobin = useTranslations(
    'pages.tournaments.detail.formatWizard.config.rr'
  );
  const tSingleElimination = useTranslations(
    'pages.tournaments.detail.formatWizard.config.se'
  );
  const tManage = useTranslations('pages.tournaments.detail.manage');
  const modal = useModal();

  if (categories.length === 0) return null;

  return (
    <>
      <Box
        as="button"
        w="full"
        textAlign="left"
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="xl"
        p={4}
        bg="white"
        cursor="pointer"
        transition="background 160ms ease, border-color 160ms ease"
        _hover={{ bg: 'gray.50', borderColor: 'gray.300' }}
        _dark={{
          bg: 'var(--tournament-surface-raised, var(--chakra-colors-gray-800))',
          borderColor:
            'var(--tournament-border, var(--chakra-colors-gray-700))',
          boxShadow: 'var(--tournament-shadow-soft)',
          _hover: {
            bg: 'var(--tournament-surface-muted, var(--chakra-colors-gray-700))',
          },
        }}
        onClick={modal.onOpen}
      >
        <Flex align="center" justify="space-between" gap={3}>
          <HStack gap={3} minW={0}>
            <Flex
              align="center"
              justify="center"
              w="40px"
              h="40px"
              borderRadius="lg"
              bg="green.50"
              color="green.600"
              flexShrink={0}
              _dark={{ bg: 'green.900', color: 'green.200' }}
            >
              <GitBranch size={20} />
            </Flex>
            <Box minW={0}>
              <Text fontWeight="semibold" fontSize="lg">
                {t('competitionInfo.title')}
              </Text>
              <Text
                fontSize="sm"
                color="gray.500"
                lineClamp={2}
                _dark={{ color: 'gray.400' }}
              >
                {t('competitionInfo.subtitle')}
              </Text>
            </Box>
          </HStack>
          <ChevronRight size={18} color="var(--chakra-colors-gray-400)" />
        </Flex>
      </Box>

      <VModal
        isOpen={modal.isOpen}
        onClose={modal.onClose}
        title={t('competitionInfo.title')}
        size="xl"
        hideSecondaryAction
        maxBodyHeight={{ base: '72vh', md: '74vh' }}
      >
        <VStack align="stretch" gap={4}>
          <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
            {t('competitionInfo.modalDescription')}
          </Text>
          <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={3}>
            {categories.map((category) => (
              <CompetitionInfoCard
                key={category.id}
                category={category}
                formatLabel={getFormatLabel(category.format, tFormat)}
                t={t}
                tRoundRobin={tRoundRobin}
                tSingleElimination={tSingleElimination}
                tManage={tManage}
              />
            ))}
          </Grid>
        </VStack>
      </VModal>
    </>
  );
}

function CompetitionInfoCard({
  category,
  formatLabel,
  t,
  tRoundRobin,
  tSingleElimination,
  tManage,
}: {
  category: Category;
  formatLabel: string;
  t: ReturnType<typeof useTranslations>;
  tRoundRobin: ReturnType<typeof useTranslations>;
  tSingleElimination: ReturnType<typeof useTranslations>;
  tManage: ReturnType<typeof useTranslations>;
}) {
  const roundRobinConfig = getRoundRobinConfig(category);
  const roundRobinToSEConfig =
    category.format === CategoryFormat.ROUND_ROBIN_TO_SE
      ? getRoundRobinToSEConfig(category)
      : null;
  const singleEliminationConfig =
    category.format === CategoryFormat.SINGLE_ELIMINATION
      ? getSingleEliminationConfig(category)
      : null;
  const hasRoundRobin =
    category.format === CategoryFormat.ROUND_ROBIN ||
    category.format === CategoryFormat.ROUND_ROBIN_TO_SE;
  const points = [
    {
      id: 'win',
      value: roundRobinConfig.winPoints,
      label: tManage('panels.standings.pointsPerWin'),
    },
    {
      id: 'tie',
      value: roundRobinConfig.tiePoints,
      label: tManage('panels.standings.pointsPerTie'),
    },
    {
      id: 'loss',
      value: roundRobinConfig.lossPoints,
      label: tManage('panels.standings.pointsPerLoss'),
    },
    {
      id: 'cancelled',
      value: roundRobinConfig.cancelledMatchPoints,
      label: tRoundRobin('cancelledMatch'),
    },
    {
      id: 'game-win',
      value: roundRobinConfig.gameWinPoints,
      label: tManage('panels.standings.pointsPerGameWin'),
    },
    {
      id: 'game-loss',
      value: roundRobinConfig.gameLossPoints,
      label: tManage('panels.standings.pointsPerGameLoss'),
    },
    {
      id: 'forfeit-win',
      value: roundRobinConfig.forfeitWinPoints,
      label: tManage('panels.standings.pointsPerForfeitWin'),
    },
    {
      id: 'forfeit-loss',
      value: roundRobinConfig.forfeitLossPoints,
      label: tManage('panels.standings.pointsPerForfeitLoss'),
    },
  ];

  return (
    <Box
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="lg"
      p={4}
      bg="gray.50"
      _dark={{
        bg: 'var(--tournament-surface-muted, var(--chakra-colors-gray-900))',
        borderColor: 'var(--tournament-border, var(--chakra-colors-gray-700))',
      }}
    >
      <VStack align="stretch" gap={3}>
        <Flex justify="space-between" align="flex-start" gap={3}>
          <Box minW={0}>
            <Text fontWeight="bold" lineClamp={1}>
              {getCategoryLabel(category)}
            </Text>
            <Text fontSize="sm" color="gray.500" _dark={{ color: 'gray.400' }}>
              {formatLabel}
            </Text>
          </Box>
          <Badge colorPalette="green" flexShrink={0}>
            {category.format === CategoryFormat.ROUND_ROBIN_TO_SE
              ? 'RR + SE'
              : category.format === CategoryFormat.SINGLE_ELIMINATION
                ? 'SE'
                : 'RR'}
          </Badge>
        </Flex>

        {hasRoundRobin ? (
          <>
            <CompetitionInfoBlock
              title={tRoundRobin('pointsEarningLabel')}
              description={getPointsEarningLabel(
                roundRobinConfig.pointsEarning,
                tRoundRobin
              )}
            >
              <Flex wrap="wrap" gap={2}>
                {points
                  .filter((point) => point.value !== 0)
                  .map((point) => (
                    <Badge
                      key={point.id}
                      variant="subtle"
                      colorPalette={point.value > 0 ? 'green' : 'gray'}
                      borderRadius="md"
                      px={2}
                      py={1}
                    >
                      {point.value} {point.label}
                    </Badge>
                  ))}
              </Flex>
            </CompetitionInfoBlock>

            <CompetitionInfoBlock title={tRoundRobin('tiebreakers')}>
              <VStack align="stretch" gap={1.5}>
                {roundRobinConfig.tiebreakers.map((tiebreaker, index) => (
                  <HStack key={tiebreaker.id} align="flex-start" gap={2}>
                    <Badge colorPalette="blue" borderRadius="md" flexShrink={0}>
                      {index + 1}
                    </Badge>
                    <Box minW={0}>
                      <Text fontSize="sm" fontWeight="medium">
                        {tRoundRobin(`tiebreakerItems.${tiebreaker.label}`)}
                      </Text>
                      <Text
                        fontSize="xs"
                        color="gray.500"
                        _dark={{ color: 'gray.400' }}
                      >
                        {tRoundRobin(
                          `tiebreakerItems.${tiebreaker.description}`
                        )}
                      </Text>
                    </Box>
                  </HStack>
                ))}
              </VStack>
            </CompetitionInfoBlock>
          </>
        ) : null}

        {roundRobinToSEConfig ? (
          <CompetitionInfoBlock title={t('competitionInfo.playoffs')}>
            <Flex wrap="wrap" gap={2}>
              <Badge variant="subtle" colorPalette="purple" borderRadius="md">
                {t('competitionInfo.qualifiersPerGroup', {
                  count: roundRobinToSEConfig.qualifiersPerGroup,
                })}
              </Badge>
              <Badge variant="subtle" colorPalette="purple" borderRadius="md">
                {getMatchFormatLabel(
                  roundRobinToSEConfig.eliminationMatchFormat,
                  tSingleElimination
                )}
              </Badge>
            </Flex>
          </CompetitionInfoBlock>
        ) : null}

        {singleEliminationConfig ? (
          <CompetitionInfoBlock title={t('competitionInfo.playoffs')}>
            <Flex wrap="wrap" gap={2}>
              <Badge variant="subtle" colorPalette="purple" borderRadius="md">
                {getMatchFormatLabel(
                  singleEliminationConfig.matchFormat,
                  tSingleElimination
                )}
              </Badge>
              <Badge variant="subtle" colorPalette="purple" borderRadius="md">
                {t('competitionInfo.thirdPlace')}:{' '}
                {singleEliminationConfig.thirdPlaceMatch
                  ? tSingleElimination('yes')
                  : tSingleElimination('no')}
              </Badge>
            </Flex>
          </CompetitionInfoBlock>
        ) : null}
      </VStack>
    </Box>
  );
}

function CompetitionInfoBlock({
  title,
  description,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Box>
      <Text
        fontSize="sm"
        fontWeight="semibold"
        color="gray.700"
        _dark={{ color: 'gray.200' }}
      >
        {title}
      </Text>
      {description ? (
        <Text
          fontSize="xs"
          color="gray.500"
          _dark={{ color: 'gray.400' }}
          mb={2}
        >
          {description}
        </Text>
      ) : null}
      {children}
    </Box>
  );
}

export default function TournamentHomeTab({
  tournament,
  categories,
  fullCategories,
  totalTeams,
  totalAthletes,
  isLoadingCategories = false,
  isHost,
  slug,
}: TournamentHomeTabProps) {
  const t = useTranslations('pages.tournaments.detail.homeTab');
  const tBoard = useTranslations('pages.tournaments.scoreboard');
  const tRef = useTranslations('pages.tournaments.scoreEntry');
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuthStore();
  const isTournamentHost = !!user && user.id === tournament.hostId;
  const canReferee =
    isTournamentHost ||
    [UserRole.REFEREE, UserRole.HOST, UserRole.ADMIN].includes(
      user?.role as UserRole
    );
  const [tournamentVenues, setTournamentVenues] = useState<IHomeVenueItem[]>(
    []
  );
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);

  const sharePath = useMemo(() => `/tournament/${slug}`, [slug]);

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return sharePath;
    const locale = window.location.pathname.split('/')[1] || 'vi';
    return `${window.location.origin}/${locale}${sharePath}`;
  }, [sharePath]);

  const formattedDate = new Date(tournament.startDate).toLocaleDateString(
    locale,
    {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  );

  const venue = tournament.venue;
  const host = tournament.host;
  const tournamentNote = tournament.description?.trim() ?? '';
  const youtubeEmbeds = (tournament.youtubeVideoUrls ?? [])
    .map((url) => getYouTubeEmbed(url))
    .filter((embed): embed is NonNullable<typeof embed> => !!embed);
  const coverImage =
    tournament.coverPhoto || venue?.coverPhoto || venue?.images?.[0] || '';
  const displayVenues = useMemo<IHomeVenueItem[]>(() => {
    if (tournamentVenues.length > 0) return tournamentVenues;
    if (!venue) return [];
    return [{ id: venue.id, venue }];
  }, [tournamentVenues, venue]);
  const overviewVenueName = displayVenues
    .map(({ venue: currentVenue }) => currentVenue.name)
    .filter(Boolean)
    .join(', ');

  useEffect(() => {
    let isMounted = true;

    TournamentService.getVenues(tournament.id)
      .then((data: TournamentVenue[]) => {
        if (!isMounted) return;

        setTournamentVenues(
          data
            .filter((tournamentVenue) => !!tournamentVenue.venue)
            .map((tournamentVenue) => ({
              id: tournamentVenue.id,
              venue: tournamentVenue.venue,
            }))
        );
      })
      .catch((error) => {
        console.error('Error loading tournament venues:', error);
      });

    return () => {
      isMounted = false;
    };
  }, [tournament.id]);

  useEffect(() => {
    let isMounted = true;

    SponsorService.getSponsors(tournament.id)
      .then((data: Sponsor[]) => {
        if (isMounted) setSponsors(data);
      })
      .catch((error) => {
        console.error('Error loading tournament sponsors:', error);
      });

    return () => {
      isMounted = false;
    };
  }, [tournament.id]);

  const handleViewSchedule = () => {
    router.push(`/tournament/${slug}/schedule`);
  };

  const handleViewScoreboard = () => {
    router.push(`/tournament/${slug}/scoreboard`);
  };

  const handleViewShowcase = () => {
    router.push(`/tournament/${slug}/showcase`);
  };

  const handleRefereeArea = () => {
    router.push(`/tournament/${slug}/referee`);
  };

  const handleViewStandings = () => {
    router.push(`/tournament/${slug}/standings`);
  };

  const handleManageCategories = () => {
    router.push(`/tournament/${slug}/manage?option=categories`);
  };

  const handleManageVenues = () => {
    router.push(`/tournament/${slug}/manage?option=venues`);
  };

  const handleManageOption = (option: string) => {
    router.push(`/tournament/${slug}/manage?option=${option}`);
  };

  const handleOpenDirections = (selectedVenue: Venue) => {
    const url = getGoogleMapsUrl({
      address: selectedVenue.address,
      name: selectedVenue.name,
      placeId: selectedVenue.placeId,
      lat: selectedVenue.lat,
      lng: selectedVenue.lng,
    });
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleShareLink = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: tournament.name,
          text: tournament.name,
          url: shareUrl,
        });
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      toaster.success({ title: 'Đã sao chép link giải đấu' });
    } catch {
      toaster.error({ title: 'Không thể chia sẻ giải đấu' });
    }
  };

  return (
    <VStack align="stretch" gap={4}>
      {/* Mobile cover */}
      <Box
        display={{ base: 'block', md: 'none' }}
        borderRadius="xl"
        overflow="hidden"
        bg="gray.100"
        aspectRatio={21 / 9}
      >
        {coverImage ? (
          <Image
            src={coverImage}
            alt={tournament.name}
            w="100%"
            h="100%"
            objectFit="cover"
          />
        ) : (
          <Box w="100%" h="100%" bg="gray.200" />
        )}
      </Box>

      {/* Overview section */}
      <Box
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="xl"
        p={{ base: 4, md: 4 }}
        bg="white"
        _dark={{
          bg: 'var(--tournament-surface-raised, var(--chakra-colors-gray-800))',
          borderColor:
            'var(--tournament-border, var(--chakra-colors-gray-700))',
          boxShadow: 'var(--tournament-shadow-soft)',
        }}
      >
        <Flex justify="space-between" align="center" mb={3}>
          <Text fontWeight="bold" fontSize={{ base: 'xl', md: 'lg' }}>
            {t('overview.title')}
          </Text>
        </Flex>

        <Grid
          templateColumns="repeat(2, minmax(0, 1fr))"
          gap={{ base: 3, md: 4 }}
          mb={4}
        >
          <Flex align="center" gap={2} minW={0}>
            <Users size={16} color="var(--chakra-colors-gray-500)" />
            {isLoadingCategories ? (
              <Skeleton height="16px" width="132px" borderRadius="md" />
            ) : (
              <Text
                fontSize="sm"
                color="gray.600"
                _dark={{ color: 'gray.300' }}
              >
                {t('overview.teamsParticipating', { count: totalTeams })}
              </Text>
            )}
          </Flex>
          <Flex align="center" gap={2} minW={0}>
            <UserRound size={16} color="var(--chakra-colors-gray-500)" />
            {isLoadingCategories ? (
              <Skeleton height="16px" width="132px" borderRadius="md" />
            ) : (
              <Text
                fontSize="sm"
                color="gray.600"
                _dark={{ color: 'gray.300' }}
              >
                {t('overview.athletesParticipating', {
                  count: totalAthletes,
                })}
              </Text>
            )}
          </Flex>
          <Flex align="center" gap={2} minW={0}>
            <CalendarDays size={16} color="var(--chakra-colors-gray-500)" />
            <Text
              fontSize="sm"
              color="gray.600"
              lineClamp={1}
              _dark={{ color: 'gray.300' }}
            >
              {formattedDate}
            </Text>
          </Flex>
          {overviewVenueName && (
            <Flex align="center" gap={2} minW={0}>
              <MapPin size={16} color="var(--chakra-colors-gray-500)" />
              <Text
                fontSize="sm"
                color="gray.600"
                lineClamp={1}
                _dark={{ color: 'gray.300' }}
              >
                {overviewVenueName}
              </Text>
            </Flex>
          )}
        </Grid>

        <Grid
          templateColumns={{
            base: 'repeat(2, minmax(0, 1fr))',
            md: 'repeat(auto-fit, minmax(140px, 1fr))',
          }}
          gap={3}
        >
          <Box
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="lg"
            px={3}
            py={2}
            cursor="pointer"
            _hover={{ bg: 'gray.50' }}
            _dark={{
              borderColor: 'gray.700',
              _hover: { bg: 'gray.700' },
            }}
            onClick={handleViewSchedule}
            minH="56px"
          >
            <Flex align="center" gap={2} h="full">
              <Box color="gray.500" flexShrink={0}>
                <CalendarDays size={16} />
              </Box>
              <Text fontSize="sm" fontWeight="medium" lineHeight="1.3">
                {t('overview.viewSchedule')}
              </Text>
            </Flex>
          </Box>
          <Box
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="lg"
            px={3}
            py={2}
            cursor="pointer"
            _hover={{ bg: 'gray.50' }}
            _dark={{
              borderColor: 'gray.700',
              _hover: { bg: 'gray.700' },
            }}
            onClick={handleViewStandings}
            minH="56px"
          >
            <Flex align="center" gap={2} h="full">
              <Box color="gray.500" flexShrink={0}>
                <BarChart3 size={16} />
              </Box>
              <Text fontSize="sm" fontWeight="medium" lineHeight="1.3">
                {t('overview.viewStandings')}
              </Text>
            </Flex>
          </Box>
          <Box
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="lg"
            px={3}
            py={2}
            cursor="pointer"
            _hover={{ bg: 'gray.50' }}
            _dark={{
              borderColor: 'gray.700',
              _hover: { bg: 'gray.700' },
            }}
            onClick={handleViewScoreboard}
            minH="56px"
          >
            <Flex align="center" gap={2} h="full">
              <Box color="gray.500" flexShrink={0}>
                <MonitorPlay size={16} />
              </Box>
              <Text fontSize="sm" fontWeight="medium" lineHeight="1.3">
                {tBoard('liveScoreboard')}
              </Text>
            </Flex>
          </Box>
          <Box
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="lg"
            px={3}
            py={2}
            cursor="pointer"
            _hover={{ bg: 'gray.50' }}
            _dark={{
              borderColor: 'gray.700',
              _hover: { bg: 'gray.700' },
            }}
            onClick={handleViewShowcase}
            minH="56px"
          >
            <Flex align="center" gap={2} h="full">
              <Box color="gray.500" flexShrink={0}>
                <Sparkles size={16} />
              </Box>
              <Text fontSize="sm" fontWeight="medium" lineHeight="1.3">
                {t('overview.viewShowcase')}
              </Text>
            </Flex>
          </Box>
          {canReferee && (
            <Box
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="lg"
              px={3}
              py={2}
              cursor="pointer"
              _hover={{ bg: 'gray.50' }}
              _dark={{
                borderColor: 'gray.700',
                _hover: { bg: 'gray.700' },
              }}
              onClick={handleRefereeArea}
              minH="56px"
            >
              <Flex align="center" gap={2} h="full">
                <Box color="gray.500" flexShrink={0}>
                  <Gavel size={16} />
                </Box>
                <Text fontSize="sm" fontWeight="medium" lineHeight="1.3">
                  {tRef('refereeArea')}
                </Text>
              </Flex>
            </Box>
          )}
        </Grid>
      </Box>

      {/* Categories section */}
      <Box
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="xl"
        bg="white"
        overflow="hidden"
        _dark={{
          bg: 'var(--tournament-surface-raised, var(--chakra-colors-gray-800))',
          borderColor:
            'var(--tournament-border, var(--chakra-colors-gray-700))',
          boxShadow: 'var(--tournament-shadow-soft)',
        }}
      >
        <Flex justify="space-between" align="center" p={4} pb={3}>
          <Text fontWeight="semibold" fontSize="lg">
            {t('categories.title')}
          </Text>
          <HStack gap={1}>
            {isHost && (
              <Text
                fontSize="sm"
                color="blue.500"
                cursor="pointer"
                fontWeight="medium"
                _hover={{ color: 'blue.600' }}
                onClick={handleManageCategories}
              >
                {t('categories.manage')}
              </Text>
            )}
          </HStack>
        </Flex>

        {isLoadingCategories ? (
          <VStack align="stretch" gap={0} pb={2}>
            {Array.from({ length: 3 }).map((_, index) => (
              <Box key={index}>
                {index > 0 && (
                  <Box
                    mx={4}
                    h="1px"
                    bg="gray.100"
                    _dark={{ bg: 'gray.700' }}
                  />
                )}
                <Flex align="center" justify="space-between" py={3} px={4}>
                  <Skeleton height="18px" width="44%" borderRadius="md" />
                  <Skeleton height="18px" width="18px" borderRadius="md" />
                </Flex>
              </Box>
            ))}
          </VStack>
        ) : categories.length === 0 ? (
          <Box px={4} pb={4}>
            <Text fontSize="sm" color="gray.500" _dark={{ color: 'gray.400' }}>
              {t('categories.empty')}
            </Text>
          </Box>
        ) : (
          <VStack align="stretch" gap={0}>
            {(() => {
              const fullCategoryMap = new Map(
                fullCategories.map((c) => [c.id, c])
              );
              return categories.map((category, index) => {
                const full = fullCategoryMap.get(category.id);
                const count = full?._count?.registrations ?? 0;
                const isIndividual =
                  full?.registrationMode ===
                  CategoryRegistrationMode.INDIVIDUAL;
                const countLabel =
                  count > 0
                    ? isIndividual
                      ? t('categories.playersCount', { count })
                      : t('categories.teamsCount', { count })
                    : null;

                return (
                  <Box key={category.id}>
                    {index > 0 && (
                      <Box
                        mx={4}
                        h="1px"
                        bg="gray.100"
                        _dark={{ bg: 'gray.700' }}
                      />
                    )}
                    <Flex
                      align="center"
                      justify="space-between"
                      py={3}
                      px={4}
                      cursor="pointer"
                      _hover={{ bg: 'gray.50' }}
                      _dark={{ _hover: { bg: 'gray.700' } }}
                      onClick={() =>
                        router.push(
                          `/tournament/${slug}/standings?category=${category.id}`
                        )
                      }
                    >
                      <Text fontSize="md">{category.name}</Text>
                      <HStack gap={2}>
                        {countLabel && (
                          <Box
                            px={2}
                            py={0.5}
                            borderRadius="full"
                            bg="gray.100"
                            _dark={{ bg: 'gray.700' }}
                          >
                            <Text
                              fontSize="xs"
                              fontWeight="medium"
                              color="gray.500"
                              _dark={{ color: 'gray.400' }}
                            >
                              {countLabel}
                            </Text>
                          </Box>
                        )}
                        <ChevronRight
                          size={18}
                          color="var(--chakra-colors-gray-400)"
                        />
                      </HStack>
                    </Flex>
                  </Box>
                );
              });
            })()}
          </VStack>
        )}
      </Box>

      <CompetitionInfoSection categories={fullCategories} />

      {/* Champions / podium */}
      {isLoadingCategories ? (
        <TournamentTableSkeleton rows={3} columns={3} />
      ) : (
        <PublicTournamentWinnersTab
          tournament={tournament}
          categories={fullCategories}
        />
      )}

      {/* Venues section */}
      {displayVenues.length > 0 && (
        <Box
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="2xl"
          overflow="hidden"
          bg="white"
          boxShadow="sm"
          _dark={{
            bg: 'var(--tournament-surface-raised, var(--chakra-colors-gray-800))',
            borderColor:
              'var(--tournament-border, var(--chakra-colors-gray-700))',
            boxShadow: 'var(--tournament-shadow-soft)',
          }}
        >
          <Flex justify="space-between" align="center" px={4} pt={4} pb={3}>
            <Text fontWeight="bold" fontSize={{ base: 'lg', md: 'xl' }}>
              {t('venues.title')}
            </Text>
            <HStack gap={3}>
              {isHost && (
                <Button
                  variant="outline"
                  colorPalette="gray"
                  borderRadius="full"
                  px={4}
                  size="sm"
                  onClick={handleManageVenues}
                >
                  {t('venues.manage')}
                </Button>
              )}
            </HStack>
          </Flex>

          <VStack align="stretch" gap={0}>
            {displayVenues.map(({ id, venue: currentVenue }, index) => (
              <Box key={id}>
                {index > 0 && (
                  <Box
                    h="1px"
                    bg="gray.100"
                    mx={4}
                    _dark={{ bg: 'gray.700' }}
                  />
                )}
                <Box px={4}>
                  {currentVenue.lat && currentVenue.lng ? (
                    <VenueMapPin
                      lat={currentVenue.lat}
                      lng={currentVenue.lng}
                      height="160px"
                      zoom={12}
                    />
                  ) : (
                    <Box
                      h="140px"
                      bg="gray.100"
                      borderRadius="xl"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      _dark={{ bg: 'gray.700' }}
                    >
                      <MapPin size={34} color="var(--chakra-colors-gray-400)" />
                    </Box>
                  )}
                </Box>

                <Flex
                  align={{ base: 'stretch', sm: 'center' }}
                  justify="space-between"
                  direction={{ base: 'column', sm: 'row' }}
                  gap={3}
                  px={4}
                  py={3}
                >
                  <Box flex="1" minW={0}>
                    <Flex align="center" gap={2}>
                      <Text
                        fontWeight="bold"
                        fontSize="md"
                        color="gray.900"
                        _dark={{ color: 'gray.50' }}
                      >
                        {currentVenue.name}
                      </Text>
                      {currentVenue.acronym && (
                        <Text
                          fontWeight="bold"
                          fontSize="sm"
                          color="gray.500"
                          _dark={{ color: 'gray.400' }}
                        >
                          {currentVenue.acronym}
                        </Text>
                      )}
                      {currentVenue.isVerified && (
                        <Box color="blue.500" flexShrink={0}>
                          <CheckCircle size={15} />
                        </Box>
                      )}
                    </Flex>
                    <AppAddressDisplay
                      address={currentVenue.address}
                      district={currentVenue.district}
                      newAddress={currentVenue.newAddress}
                      newDistrict={currentVenue.newDistrict}
                      fontSize="sm"
                      color="gray.600"
                      lineClamp={2}
                    />
                  </Box>

                  {(currentVenue.lat ||
                    currentVenue.lng ||
                    currentVenue.address) && (
                    <Box
                      as="button"
                      borderRadius="lg"
                      px={2}
                      py={2}
                      color="gray.900"
                      cursor="pointer"
                      flexShrink={0}
                      alignSelf={{ base: 'flex-start', sm: 'center' }}
                      _hover={{ bg: 'gray.50' }}
                      _dark={{
                        color: 'gray.50',
                        _hover: { bg: 'gray.700' },
                      }}
                      onClick={() => handleOpenDirections(currentVenue)}
                    >
                      <Flex align="center" gap={2}>
                        <Navigation size={18} color="currentColor" />
                        <Text fontSize="md" fontWeight="bold">
                          {t('venues.directions')}
                        </Text>
                      </Flex>
                    </Box>
                  )}
                </Flex>
              </Box>
            ))}
          </VStack>
        </Box>
      )}

      {(tournamentNote || isHost) && (
        <Box
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="xl"
          p={4}
          bg="white"
          _dark={{
            bg: 'var(--tournament-surface-raised, var(--chakra-colors-gray-800))',
            borderColor:
              'var(--tournament-border, var(--chakra-colors-gray-700))',
            boxShadow: 'var(--tournament-shadow-soft)',
          }}
        >
          <Flex justify="space-between" align="center" mb={3}>
            <HStack gap={2}>
              <Box color="green.600" _dark={{ color: 'green.300' }}>
                <NotebookText size={18} />
              </Box>
              <Text fontWeight="semibold" fontSize="lg">
                {t('notes.title')}
              </Text>
            </HStack>
            {isHost && (
              <Box
                as="button"
                aria-label={t('notes.edit')}
                w="32px"
                h="32px"
                display="flex"
                borderRadius="md"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                _hover={{ bg: 'gray.100', _dark: { bg: 'gray.700' } }}
                onClick={() => handleManageOption('name')}
              >
                <Pencil size={16} color="var(--chakra-colors-gray-500)" />
              </Box>
            )}
          </Flex>

          {tournamentNote ? (
            <Text
              fontSize="sm"
              lineHeight="1.7"
              whiteSpace="pre-wrap"
              color="gray.700"
              _dark={{ color: 'gray.200' }}
            >
              {renderTextWithLinks(tournamentNote)}
            </Text>
          ) : (
            <Text fontSize="sm" color="gray.500" _dark={{ color: 'gray.400' }}>
              {t('notes.empty')}
            </Text>
          )}
        </Box>
      )}

      {(youtubeEmbeds.length > 0 || isHost) && (
        <Box
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="xl"
          p={4}
          bg="white"
          _dark={{
            bg: 'var(--tournament-surface-raised, var(--chakra-colors-gray-800))',
            borderColor:
              'var(--tournament-border, var(--chakra-colors-gray-700))',
            boxShadow: 'var(--tournament-shadow-soft)',
          }}
        >
          <Flex justify="space-between" align="center" mb={3}>
            <HStack gap={2}>
              <Box color="red.500" _dark={{ color: 'red.300' }}>
                <MonitorPlay size={18} />
              </Box>
              <Text fontWeight="semibold" fontSize="lg">
                {t('videos.title')}
              </Text>
            </HStack>
            {isHost && (
              <Box
                as="button"
                aria-label={t('videos.edit')}
                w="32px"
                h="32px"
                display="flex"
                borderRadius="md"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                _hover={{ bg: 'gray.100', _dark: { bg: 'gray.700' } }}
                onClick={() => handleManageOption('videos')}
              >
                <Pencil size={16} color="var(--chakra-colors-gray-500)" />
              </Box>
            )}
          </Flex>

          {youtubeEmbeds.length > 0 ? (
            <Grid
              templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }}
              gap={3}
            >
              {youtubeEmbeds.map((embed) => (
                <Box
                  key={embed.id}
                  borderRadius="lg"
                  overflow="hidden"
                  bg="black"
                  aspectRatio={16 / 9}
                >
                  <iframe
                    src={embed.embedUrl}
                    title={t('videos.iframeTitle')}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </Box>
              ))}
            </Grid>
          ) : (
            <Text fontSize="sm" color="gray.500" _dark={{ color: 'gray.400' }}>
              {t('videos.empty')}
            </Text>
          )}
        </Box>
      )}

      {/* Sponsors section */}
      {(sponsors.length > 0 || isHost) && (
        <Box
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="xl"
          p={4}
          bg="white"
          _dark={{
            bg: 'var(--tournament-surface-raised, var(--chakra-colors-gray-800))',
            borderColor:
              'var(--tournament-border, var(--chakra-colors-gray-700))',
            boxShadow: 'var(--tournament-shadow-soft)',
          }}
        >
          <Flex justify="space-between" align="center" mb={3}>
            <Text fontWeight="semibold" fontSize="lg">
              {t('sponsors.title')}
            </Text>
            {isHost && (
              <Box
                as="button"
                aria-label={t('sponsors.manage')}
                w="32px"
                h="32px"
                display="flex"
                borderRadius="md"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                _hover={{ bg: 'gray.100', _dark: { bg: 'gray.700' } }}
                onClick={() => handleManageOption('sponsors')}
              >
                <Pencil size={16} color="var(--chakra-colors-gray-500)" />
              </Box>
            )}
          </Flex>

          {sponsors.length > 0 ? (
            <Flex wrap="wrap" gap={2.5}>
              {sponsors.map((sponsor) => {
                return (
                  <Box
                    as="button"
                    key={sponsor.id}
                    title={sponsor.name}
                    aria-label={sponsor.name}
                    w={{ base: '86px', sm: '92px' }}
                    h={{ base: '86px', sm: '92px' }}
                    p={2}
                    borderWidth="1px"
                    borderColor="gray.200"
                    borderRadius="lg"
                    bg="white"
                    overflow="hidden"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    cursor="pointer"
                    transition="border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease"
                    _hover={{
                      borderColor: 'green.300',
                      boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)',
                      transform: 'translateY(-1px)',
                    }}
                    _dark={{
                      bg: 'gray.900',
                      borderColor: 'gray.700',
                      _hover: { borderColor: 'green.500' },
                    }}
                    onClick={() => setSelectedSponsor(sponsor)}
                  >
                    {sponsor.logo ? (
                      <Image
                        src={sponsor.logo}
                        alt={sponsor.name}
                        maxW="100%"
                        maxH="100%"
                        objectFit="contain"
                      />
                    ) : (
                      <Text
                        fontSize="xs"
                        fontWeight="medium"
                        textAlign="center"
                        lineClamp={3}
                        color="gray.700"
                        _dark={{ color: 'gray.300' }}
                      >
                        {sponsor.name}
                      </Text>
                    )}
                  </Box>
                );
              })}
            </Flex>
          ) : (
            <Text fontSize="sm" color="gray.500" _dark={{ color: 'gray.400' }}>
              {t('sponsors.empty')}
            </Text>
          )}

          <VModal
            isOpen={!!selectedSponsor}
            onClose={() => setSelectedSponsor(null)}
            title={selectedSponsor?.name}
            size="sm"
            hideSecondaryAction
          >
            {selectedSponsor && (
              <VStack align="stretch" gap={4}>
                <Flex
                  align="center"
                  justify="center"
                  minH="180px"
                  p={4}
                  borderWidth="1px"
                  borderColor="gray.200"
                  borderRadius="lg"
                  bg="gray.50"
                  _dark={{
                    bg: 'gray.900',
                    borderColor: 'gray.700',
                  }}
                >
                  {selectedSponsor.logo ? (
                    <Image
                      src={selectedSponsor.logo}
                      alt={selectedSponsor.name}
                      maxW="100%"
                      maxH="220px"
                      objectFit="contain"
                    />
                  ) : (
                    <Text
                      fontSize="lg"
                      fontWeight="semibold"
                      textAlign="center"
                    >
                      {selectedSponsor.name}
                    </Text>
                  )}
                </Flex>

                {selectedSponsor.website && (
                  <Link
                    href={selectedSponsor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    color="green.600"
                    fontWeight="medium"
                    wordBreak="break-word"
                    _dark={{ color: 'green.300' }}
                  >
                    {selectedSponsor.website}
                  </Link>
                )}
              </VStack>
            )}
          </VModal>
        </Box>
      )}

      {/* Contact section */}
      {(() => {
        const contactName = tournament.contactName || host?.name || '';
        const contactEmail = tournament.contactEmail || host?.email || '';
        const contactPhone = tournament.contactPhone || '';
        const hasAnyContact = !!(contactName || contactEmail || contactPhone);

        if (!hasAnyContact && !isHost) return null;

        return (
          <Box
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="xl"
            p={4}
            bg="white"
            _dark={{
              bg: 'var(--tournament-surface-raised, var(--chakra-colors-gray-800))',
              borderColor:
                'var(--tournament-border, var(--chakra-colors-gray-700))',
              boxShadow: 'var(--tournament-shadow-soft)',
            }}
          >
            <Flex justify="space-between" align="center" mb={3}>
              <Text fontWeight="semibold" fontSize="lg">
                {t('contact.title')}
              </Text>
              {isHost && (
                <HStack gap={1}>
                  <Box
                    as="button"
                    aria-label="Xóa giải đấu"
                    w="32px"
                    h="32px"
                    display="flex"
                    borderRadius="md"
                    alignItems="center"
                    justifyContent="center"
                    cursor="pointer"
                    _hover={{ bg: 'gray.100', _dark: { bg: 'gray.700' } }}
                    onClick={() => handleManageOption('delete')}
                  >
                    <Trash2 size={16} color="var(--chakra-colors-gray-500)" />
                  </Box>
                  <Box
                    as="button"
                    aria-label="Chỉnh sửa thông tin liên hệ"
                    w="32px"
                    h="32px"
                    display="flex"
                    borderRadius="md"
                    alignItems="center"
                    justifyContent="center"
                    cursor="pointer"
                    _hover={{ bg: 'gray.100', _dark: { bg: 'gray.700' } }}
                    onClick={() => handleManageOption('contact')}
                  >
                    <Pencil size={16} color="var(--chakra-colors-gray-500)" />
                  </Box>
                </HStack>
              )}
            </Flex>

            {hasAnyContact ? (
              <VStack align="stretch" gap={1.5}>
                {contactName && (
                  <Text
                    fontSize="sm"
                    color="gray.700"
                    _dark={{ color: 'gray.300' }}
                  >
                    <Text as="span" fontWeight="medium">
                      {t('contact.name')}:
                    </Text>{' '}
                    {contactName}
                  </Text>
                )}
                {contactEmail && (
                  <Text
                    fontSize="sm"
                    color="gray.700"
                    _dark={{ color: 'gray.300' }}
                  >
                    <Text as="span" fontWeight="medium">
                      {t('contact.email')}:
                    </Text>{' '}
                    {contactEmail}
                  </Text>
                )}
                {contactPhone && (
                  <Text
                    fontSize="sm"
                    color="gray.700"
                    _dark={{ color: 'gray.300' }}
                  >
                    <Text as="span" fontWeight="medium">
                      {t('contact.phone')}:
                    </Text>{' '}
                    {contactPhone}
                  </Text>
                )}
              </VStack>
            ) : (
              <Text
                fontSize="sm"
                color="gray.500"
                _dark={{ color: 'gray.400' }}
              >
                {t('contact.empty')}
              </Text>
            )}
          </Box>
        );
      })()}

      {/* Tournament access QR */}
      <TournamentQrBar url={shareUrl} onShare={handleShareLink} />
    </VStack>
  );
}
