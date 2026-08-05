'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
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
  ChevronRight,
  MapPin,
  Navigation,
  Pencil,
  CheckCircle,
  MonitorPlay,
  NotebookText,
  GitBranch,
  Tags,
  Handshake,
  Contact as ContactIcon,
  User,
  Mail,
  Phone,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Tournament,
  Category,
  CategoryType,
  CategoryRegistrationMode,
  TournamentVenue,
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
import TournamentHomeHero from '@/components/tournament/TournamentHomeHero';
import TournamentPulseCard from '@/components/tournament/TournamentPulseCard';
import TournamentQuickActions from '@/components/tournament/TournamentQuickActions';
import TournamentQrBar from '@/components/tournament/TournamentQrBar';
import { TournamentTableSkeleton } from '@/components/tournament/skeletons';
import { Link as RouterLink, useRouter } from '@/i18n/config';
import {
  getGoogleMapsUrl,
  getPrimaryVenueDisplay,
  getTournamentVenueDisplay,
  VenueDisplay,
} from '@/utils';
import { Button } from '@/components/ui/chakra-compat';
import { toaster } from '@/components/ui/toaster';
import { VModal, useModal } from '@/components/ui/VModal';
import { getYouTubeEmbed } from '@/lib/utils/youtube';
import { useTournamentHomeMatches } from '@/hooks/useTournamentHomeMatches';

const VenueMapPin = dynamic(() => import('@/components/venue/VenueMapPin'), {
  ssr: false,
  loading: () => <Skeleton height="160px" width="100%" borderRadius="xl" />,
});

interface ICategoryHomeItem {
  id: string;
  name: string;
  type: CategoryType;
}

interface IHomeVenueItem {
  id: string;
  display: VenueDisplay;
}

interface TournamentHomeTabProps {
  tournament: Tournament;
  categories: ICategoryHomeItem[];
  /** Full category objects, used by the embedded champions/podium section. */
  fullCategories: Category[];
  totalTeams: number;
  totalAthletes: number;
  isLoadingCategories?: boolean;
  canManageTournament: boolean;
  slug: string;
  showFavoriteOverlay: boolean;
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
        p={3}
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
          <HStack gap={2.5} minW={0}>
            <Flex
              align="center"
              justify="center"
              w="36px"
              h="36px"
              borderRadius="lg"
              bg="green.50"
              color="green.600"
              flexShrink={0}
              _dark={{ bg: 'green.900', color: 'green.200' }}
            >
              <GitBranch size={18} aria-hidden="true" />
            </Flex>
            <Box minW={0}>
              <Text fontWeight="semibold" fontSize="md">
                {t('competitionInfo.title')}
              </Text>
              <Text
                fontSize="sm"
                color="gray.500"
                lineClamp={1}
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
      id: 'loss',
      value: roundRobinConfig.lossPoints,
      label: tManage('panels.standings.pointsPerLoss'),
    },
    {
      id: 'tie',
      value: roundRobinConfig.tiePoints,
      label: tManage('panels.standings.pointsPerTie'),
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
  canManageTournament,
  slug,
  showFavoriteOverlay,
}: TournamentHomeTabProps) {
  const t = useTranslations('pages.tournaments.detail.homeTab');
  const locale = useLocale();
  const router = useRouter();
  const [tournamentVenues, setTournamentVenues] = useState<IHomeVenueItem[]>(
    []
  );
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);
  const homeMatches = useTournamentHomeMatches(
    tournament.id,
    tournament.status
  );
  const effectiveStatus = homeMatches.statusOverride ?? tournament.status;

  const sharePath = useMemo(() => `/tournament/${slug}`, [slug]);

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return sharePath;
    const locale = window.location.pathname.split('/')[1] || 'vi';
    return `${window.location.origin}/${locale}${sharePath}`;
  }, [sharePath]);

  const formattedDate = new Date(tournament.startDate).toLocaleDateString(
    locale,
    {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }
  );
  const heroDateLabel = new Date(tournament.startDate).toLocaleDateString(
    locale,
    {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }
  );

  const primaryVenue = getPrimaryVenueDisplay(tournament);
  const host = tournament.host;
  const tournamentNote = tournament.description?.trim() ?? '';
  const youtubeEmbeds = (tournament.youtubeVideoUrls ?? [])
    .map((url) => getYouTubeEmbed(url))
    .filter((embed): embed is NonNullable<typeof embed> => !!embed);
  const coverImage =
    tournament.coverPhoto ||
    primaryVenue?.coverPhoto ||
    primaryVenue?.images?.[0] ||
    '';
  const displayVenues = useMemo<IHomeVenueItem[]>(() => {
    if (tournamentVenues.length > 0) return tournamentVenues;
    if (!primaryVenue) return [];
    return [{ id: primaryVenue.venueId ?? 'primary', display: primaryVenue }];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentVenues, tournament.venue, tournament.tournamentVenues]);
  const overviewVenueName = displayVenues
    .map(({ display }) => display.name)
    .filter(Boolean)
    .join(', ');
  const selectedVenue =
    displayVenues.find(({ id }) => id === selectedVenueId) ?? displayVenues[0];
  const contactName = tournament.contactName || host?.name || '';
  const contactEmail = tournament.contactEmail || host?.email || '';
  const contactPhone = tournament.contactPhone || '';
  const hasAnyContact = !!(contactName || contactEmail || contactPhone);
  const missingOrganizerSections = [
    !tournamentNote ? 'name' : null,
    youtubeEmbeds.length === 0 ? 'videos' : null,
    sponsors.length === 0 ? 'sponsors' : null,
    !hasAnyContact ? 'contact' : null,
  ].filter((option): option is string => !!option);

  useEffect(() => {
    let isMounted = true;

    TournamentService.getVenues(tournament.id)
      .then((data: TournamentVenue[]) => {
        if (!isMounted) return;

        // Inline (address-only) venues have no linked Venue record but must
        // still be displayed — resolve every row through the display helper.
        setTournamentVenues(
          data.map((tournamentVenue) => ({
            id: tournamentVenue.id,
            display: getTournamentVenueDisplay(tournamentVenue),
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

  const handleManageVenues = () => {
    router.push(`/tournament/${slug}/manage?option=venues`);
  };

  const handleManageOption = (option: string) => {
    router.push(`/tournament/${slug}/manage?option=${option}`);
  };

  const handleOpenDirections = (selectedVenue: VenueDisplay) => {
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
      toaster.success({ title: t('share.success') });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      toaster.error({ title: t('share.error') });
    }
  };

  return (
    <VStack align="stretch" gap={4} pt={{ base: 4, md: 0 }}>
      <TournamentHomeHero
        tournament={tournament}
        status={effectiveStatus}
        coverImage={coverImage}
        dateLabel={formattedDate}
        heroDateLabel={heroDateLabel}
        venueName={overviewVenueName}
        totalTeams={totalTeams}
        totalAthletes={totalAthletes}
        isLoadingCounts={isLoadingCategories}
        slug={slug}
        showFavorite={showFavoriteOverlay}
        onShare={handleShareLink}
      />

      <TournamentPulseCard
        status={effectiveStatus}
        categories={fullCategories}
        matches={homeMatches.matches}
        slug={slug}
        loading={homeMatches.loading}
        error={homeMatches.error}
        onRetry={() => void homeMatches.retry()}
      />

      <TournamentQuickActions slug={slug} />

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
        <Flex justify="space-between" align="center" px={4} py={3}>
          <Flex align="center" gap={2}>
            <Tags
              size={18}
              color="var(--chakra-colors-green-600)"
              aria-hidden="true"
            />
            <Text fontWeight="semibold" fontSize="md">
              {t('categories.title')}
            </Text>
          </Flex>
          <HStack gap={1}>
            {canManageTournament && (
              <Box
                asChild
                minH="36px"
                display="inline-flex"
                alignItems="center"
                px={2}
                borderRadius="lg"
                fontSize="sm"
                color="blue.500"
                fontWeight="medium"
                _hover={{ color: 'blue.600', bg: 'blue.50' }}
                _focusVisible={{
                  outline: '2px solid',
                  outlineColor: 'blue.400',
                  outlineOffset: '2px',
                }}
              >
                <RouterLink
                  href={`/tournament/${slug}/manage?option=categories`}
                >
                  {t('categories.manage')}
                </RouterLink>
              </Box>
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
          <VStack align="stretch" gap={2.5} px={3} pb={3} pt={1}>
            {(() => {
              const fullCategoryMap = new Map(
                fullCategories.map((c) => [c.id, c])
              );
              return categories.map((category) => {
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
                  <Box
                    key={category.id}
                    asChild
                    display="block"
                    borderWidth="1px"
                    borderColor="gray.100"
                    borderRadius="lg"
                    bg="gray.50/60"
                    transition="all 0.15s ease"
                    _hover={{
                      bg: 'green.50',
                      borderColor: 'green.200',
                      textDecoration: 'none',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 10px rgba(16, 185, 129, 0.1)',
                    }}
                    _focusVisible={{
                      outline: '2px solid',
                      outlineColor: 'green.400',
                      outlineOffset: '-2px',
                    }}
                    _dark={{
                      borderColor: 'gray.700',
                      bg: 'gray.900/40',
                      _hover: {
                        bg: 'rgba(34, 197, 94, 0.1)',
                        borderColor: 'rgba(34, 197, 94, 0.35)',
                      },
                    }}
                  >
                    <RouterLink
                      href={`/tournament/${slug}/teams?view=category#category-${category.id}`}
                    >
                      <Flex
                        align="center"
                        justify="space-between"
                        gap={3}
                        minH="52px"
                        py={2.5}
                        px={3}
                      >
                        <HStack gap={3} minW={0}>
                          <Flex
                            align="center"
                            justify="center"
                            w="34px"
                            h="34px"
                            flexShrink={0}
                            borderRadius="md"
                            bg="green.100"
                            color="green.600"
                            _dark={{
                              bg: 'rgba(34, 197, 94, 0.16)',
                              color: 'green.300',
                            }}
                          >
                            <Tags size={16} aria-hidden="true" />
                          </Flex>
                          <Text fontSize="md" fontWeight="medium" lineClamp={1}>
                            {category.name}
                          </Text>
                        </HStack>
                        <HStack gap={2} flexShrink={0}>
                          {countLabel && (
                            <Box
                              px={2}
                              py={0.5}
                              borderRadius="full"
                              bg="white"
                              borderWidth="1px"
                              borderColor="gray.200"
                              _dark={{
                                bg: 'gray.800',
                                borderColor: 'gray.700',
                              }}
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
                            aria-hidden="true"
                          />
                        </HStack>
                      </Flex>
                    </RouterLink>
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
          categories={fullCategories}
          matches={homeMatches.matches}
          matchesLoading={homeMatches.loading}
          matchesError={homeMatches.error}
          resultsVersion={homeMatches.resultsVersion}
          onRetryMatches={homeMatches.retry}
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
          <Flex justify="space-between" align="center" px={4} pt={3} pb={3}>
            <Flex align="center" gap={2}>
              <MapPin
                size={20}
                color="var(--chakra-colors-blue-600)"
                aria-hidden="true"
              />
              <Text fontWeight="semibold" fontSize="md">
                {t('venues.title')}
              </Text>
            </Flex>
            <HStack gap={3}>
              {canManageTournament && (
                <Button
                  variant="outline"
                  colorPalette="gray"
                  borderRadius="full"
                  px={4}
                  size="sm"
                  minH="36px"
                  onClick={handleManageVenues}
                >
                  {t('venues.manage')}
                </Button>
              )}
            </HStack>
          </Flex>

          {displayVenues.length > 1 ? (
            <Flex
              px={4}
              pb={3}
              gap={2}
              overflowX="auto"
              css={{ scrollbarWidth: 'none' }}
            >
              {displayVenues.map(({ id, display }) => {
                const isSelected = selectedVenue?.id === id;
                return (
                  <Button
                    key={id}
                    size="sm"
                    minH="40px"
                    px={3}
                    borderRadius="full"
                    variant={isSelected ? 'solid' : 'outline'}
                    colorPalette={isSelected ? 'green' : 'gray'}
                    flexShrink={0}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedVenueId(id)}
                  >
                    {display.name}
                  </Button>
                );
              })}
            </Flex>
          ) : null}

          {selectedVenue ? (
            <Box>
              <Box px={4}>
                {selectedVenue.display.lat != null &&
                selectedVenue.display.lng != null ? (
                  <VenueMapPin
                    lat={selectedVenue.display.lat}
                    lng={selectedVenue.display.lng}
                    height="180px"
                    zoom={12}
                  />
                ) : (
                  <Box
                    h="150px"
                    bg="gray.100"
                    borderRadius="xl"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    _dark={{ bg: 'gray.700' }}
                  >
                    <MapPin
                      size={34}
                      color="var(--chakra-colors-gray-400)"
                      aria-hidden="true"
                    />
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
                      {selectedVenue.display.name}
                    </Text>
                    {selectedVenue.display.acronym ? (
                      <Text
                        fontWeight="bold"
                        fontSize="sm"
                        color="gray.500"
                        _dark={{ color: 'gray.400' }}
                      >
                        {selectedVenue.display.acronym}
                      </Text>
                    ) : null}
                    {selectedVenue.display.isVerified ? (
                      <Box color="blue.500" flexShrink={0}>
                        <CheckCircle size={15} aria-hidden="true" />
                      </Box>
                    ) : null}
                  </Flex>
                  <AppAddressDisplay
                    address={selectedVenue.display.address}
                    district={selectedVenue.display.district}
                    city={selectedVenue.display.city}
                    newAddress={selectedVenue.display.newAddress}
                    newDistrict={selectedVenue.display.newDistrict}
                    fontSize="sm"
                    color="gray.600"
                    lineClamp={2}
                  />
                </Box>

                {selectedVenue.display.lat != null ||
                selectedVenue.display.lng != null ||
                selectedVenue.display.address ? (
                  <Box
                    as="button"
                    minH="44px"
                    borderRadius="lg"
                    px={3}
                    color="gray.900"
                    flexShrink={0}
                    alignSelf={{ base: 'flex-start', sm: 'center' }}
                    cursor="pointer"
                    _hover={{ bg: 'gray.50' }}
                    _focusVisible={{
                      outline: '2px solid',
                      outlineColor: 'green.400',
                      outlineOffset: '2px',
                    }}
                    _dark={{
                      color: 'gray.50',
                      _hover: { bg: 'gray.700' },
                    }}
                    onClick={() => handleOpenDirections(selectedVenue.display)}
                  >
                    <Flex align="center" gap={2}>
                      <Navigation size={18} aria-hidden="true" />
                      <Text fontSize="md" fontWeight="bold">
                        {t('venues.directions')}
                      </Text>
                    </Flex>
                  </Box>
                ) : null}
              </Flex>
            </Box>
          ) : null}
        </Box>
      )}

      {tournamentNote ? (
        <Box
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="xl"
          px={4}
          pt={3}
          pb={3}
          bg="white"
          _dark={{
            bg: 'var(--tournament-surface-raised, var(--chakra-colors-gray-800))',
            borderColor:
              'var(--tournament-border, var(--chakra-colors-gray-700))',
            boxShadow: 'var(--tournament-shadow-soft)',
          }}
        >
          <Flex justify="space-between" align="center" mb={2}>
            <HStack gap={2}>
              <Box color="green.600" _dark={{ color: 'green.300' }}>
                <NotebookText size={18} aria-hidden="true" />
              </Box>
              <Text fontWeight="semibold" fontSize="md">
                {t('notes.title')}
              </Text>
            </HStack>
            {canManageTournament && (
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
                _focusVisible={{
                  outline: '2px solid',
                  outlineColor: 'green.400',
                  outlineOffset: '2px',
                }}
                onClick={() => handleManageOption('name')}
              >
                <Pencil
                  size={15}
                  color="var(--chakra-colors-gray-500)"
                  aria-hidden="true"
                />
              </Box>
            )}
          </Flex>

          <Text
            fontSize="sm"
            lineHeight="1.7"
            whiteSpace="pre-wrap"
            color="gray.700"
            _dark={{ color: 'gray.200' }}
          >
            {renderTextWithLinks(tournamentNote)}
          </Text>
        </Box>
      ) : null}

      {youtubeEmbeds.length > 0 ? (
        <Box
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="xl"
          px={4}
          pt={3}
          pb={3}
          bg="white"
          _dark={{
            bg: 'var(--tournament-surface-raised, var(--chakra-colors-gray-800))',
            borderColor:
              'var(--tournament-border, var(--chakra-colors-gray-700))',
            boxShadow: 'var(--tournament-shadow-soft)',
          }}
        >
          <Flex justify="space-between" align="center" mb={2}>
            <HStack gap={2}>
              <Box color="red.500" _dark={{ color: 'red.300' }}>
                <MonitorPlay size={18} aria-hidden="true" />
              </Box>
              <Text fontWeight="semibold" fontSize="md">
                {t('videos.title')}
              </Text>
            </HStack>
            {canManageTournament && (
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
                _focusVisible={{
                  outline: '2px solid',
                  outlineColor: 'green.400',
                  outlineOffset: '2px',
                }}
                onClick={() => handleManageOption('videos')}
              >
                <Pencil
                  size={15}
                  color="var(--chakra-colors-gray-500)"
                  aria-hidden="true"
                />
              </Box>
            )}
          </Flex>

          <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={3}>
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
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </Box>
            ))}
          </Grid>
        </Box>
      ) : null}

      {/* Sponsors section */}
      {sponsors.length > 0 ? (
        <Box
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="xl"
          px={4}
          pt={3}
          pb={3}
          bg="white"
          _dark={{
            bg: 'var(--tournament-surface-raised, var(--chakra-colors-gray-800))',
            borderColor:
              'var(--tournament-border, var(--chakra-colors-gray-700))',
            boxShadow: 'var(--tournament-shadow-soft)',
          }}
        >
          <Flex justify="space-between" align="center" mb={2}>
            <Flex align="center" gap={2}>
              <Handshake
                size={20}
                color="var(--chakra-colors-purple-600)"
                aria-hidden="true"
              />
              <Text fontWeight="semibold" fontSize="md">
                {t('sponsors.title')}
              </Text>
            </Flex>
            {canManageTournament && (
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
                _focusVisible={{
                  outline: '2px solid',
                  outlineColor: 'green.400',
                  outlineOffset: '2px',
                }}
                onClick={() => handleManageOption('sponsors')}
              >
                <Pencil
                  size={15}
                  color="var(--chakra-colors-gray-500)"
                  aria-hidden="true"
                />
              </Box>
            )}
          </Flex>

          <Flex wrap="wrap" gap={2.5}>
            {sponsors.map((sponsor) => (
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
                _focusVisible={{
                  outline: '2px solid',
                  outlineColor: 'green.400',
                  outlineOffset: '2px',
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
                    loading="lazy"
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
            ))}
          </Flex>

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
      ) : null}

      {/* Contact section */}
      {hasAnyContact ? (
        <Box
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="xl"
          px={4}
          pt={3}
          pb={3}
          bg="white"
          _dark={{
            bg: 'var(--tournament-surface-raised, var(--chakra-colors-gray-800))',
            borderColor:
              'var(--tournament-border, var(--chakra-colors-gray-700))',
            boxShadow: 'var(--tournament-shadow-soft)',
          }}
        >
          <Flex justify="space-between" align="center" mb={2}>
            <Flex align="center" gap={2}>
              <ContactIcon
                size={20}
                color="var(--chakra-colors-teal-600)"
                aria-hidden="true"
              />
              <Text fontWeight="semibold" fontSize="md">
                {t('contact.title')}
              </Text>
            </Flex>
            {canManageTournament ? (
              <Box
                as="button"
                aria-label={t('contact.edit')}
                w="32px"
                h="32px"
                display="flex"
                borderRadius="md"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                _hover={{ bg: 'gray.100', _dark: { bg: 'gray.700' } }}
                _focusVisible={{
                  outline: '2px solid',
                  outlineColor: 'green.400',
                  outlineOffset: '2px',
                }}
                onClick={() => handleManageOption('contact')}
              >
                <Pencil
                  size={15}
                  color="var(--chakra-colors-gray-500)"
                  aria-hidden="true"
                />
              </Box>
            ) : null}
          </Flex>

          <VStack align="stretch" gap={2}>
            {contactName ? (
              <Flex align="center" gap={2.5}>
                <Flex
                  align="center"
                  justify="center"
                  w="28px"
                  h="28px"
                  flexShrink={0}
                  borderRadius="md"
                  bg="teal.50"
                  color="teal.600"
                  _dark={{ bg: 'rgba(20, 184, 166, 0.14)', color: 'teal.300' }}
                >
                  <User size={14} aria-hidden="true" />
                </Flex>
                <Text
                  fontSize="sm"
                  color="gray.700"
                  _dark={{ color: 'gray.300' }}
                >
                  {contactName}
                </Text>
              </Flex>
            ) : null}
            {contactEmail ? (
              <Flex align="center" gap={2.5}>
                <Flex
                  align="center"
                  justify="center"
                  w="28px"
                  h="28px"
                  flexShrink={0}
                  borderRadius="md"
                  bg="teal.50"
                  color="teal.600"
                  _dark={{ bg: 'rgba(20, 184, 166, 0.14)', color: 'teal.300' }}
                >
                  <Mail size={14} aria-hidden="true" />
                </Flex>
                <Link
                  href={`mailto:${contactEmail}`}
                  fontSize="sm"
                  color="green.700"
                  fontWeight="medium"
                  wordBreak="break-word"
                  _hover={{ textDecoration: 'underline' }}
                  _dark={{ color: 'green.300' }}
                >
                  {contactEmail}
                </Link>
              </Flex>
            ) : null}
            {contactPhone ? (
              <Flex align="center" gap={2.5}>
                <Flex
                  align="center"
                  justify="center"
                  w="28px"
                  h="28px"
                  flexShrink={0}
                  borderRadius="md"
                  bg="teal.50"
                  color="teal.600"
                  _dark={{ bg: 'rgba(20, 184, 166, 0.14)', color: 'teal.300' }}
                >
                  <Phone size={14} aria-hidden="true" />
                </Flex>
                <Link
                  href={`tel:${contactPhone}`}
                  fontSize="sm"
                  color="green.700"
                  fontWeight="medium"
                  _hover={{ textDecoration: 'underline' }}
                  _dark={{ color: 'green.300' }}
                >
                  {contactPhone}
                </Link>
              </Flex>
            ) : null}
          </VStack>
        </Box>
      ) : null}

      {canManageTournament && missingOrganizerSections.length > 0 ? (
        <Box
          borderWidth="1px"
          borderColor="blue.200"
          borderRadius="xl"
          p={4}
          bg="blue.50"
          _dark={{
            bg: 'rgba(59, 130, 246, 0.1)',
            borderColor: 'rgba(96, 165, 250, 0.28)',
          }}
        >
          <Text fontWeight="bold">{t('organizerCompletion.title')}</Text>
          <Text
            mt={0.5}
            fontSize="sm"
            color="gray.600"
            _dark={{ color: 'gray.300' }}
          >
            {t('organizerCompletion.description')}
          </Text>
          <Flex mt={3} gap={2} wrap="wrap">
            {missingOrganizerSections.map((option) => (
              <Box
                asChild
                key={option}
                minH="44px"
                display="inline-flex"
                alignItems="center"
                borderWidth="1px"
                borderColor="blue.200"
                borderRadius="full"
                bg="white"
                color="blue.700"
                fontSize="sm"
                fontWeight="700"
                _hover={{ borderColor: 'blue.400', textDecoration: 'none' }}
                _focusVisible={{
                  outline: '2px solid',
                  outlineColor: 'blue.400',
                  outlineOffset: '2px',
                }}
                _dark={{
                  bg: 'var(--tournament-surface-raised)',
                  color: 'blue.200',
                  borderColor: 'blue.700',
                }}
              >
                <RouterLink
                  href={`/tournament/${slug}/manage?option=${option}`}
                >
                  <Flex align="center" gap={2} px={3}>
                    <Pencil size={14} aria-hidden="true" />
                    {t(`organizerCompletion.items.${option}`)}
                  </Flex>
                </RouterLink>
              </Box>
            ))}
          </Flex>
        </Box>
      ) : null}

      {/* Tournament access QR */}
      <TournamentQrBar url={shareUrl} onShare={handleShareLink} />
    </VStack>
  );
}
