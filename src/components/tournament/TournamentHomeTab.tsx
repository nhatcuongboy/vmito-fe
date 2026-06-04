'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
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
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Tournament,
  Category,
  CategoryType,
  TournamentVenue,
  UserRole,
  Venue,
} from '@/lib/api/types';
import { TournamentService } from '@/lib/api/tournament.service';
import PublicTournamentWinnersTab from '@/components/tournament/PublicTournamentWinnersTab';
import TournamentQrBar from '@/components/tournament/TournamentQrBar';
import { TournamentTableSkeleton } from '@/components/tournament/skeletons';
import { useRouter } from '@/i18n/config';
import { useAuthStore } from '@/stores/useAuthStore';
import { getGoogleMapsUrl } from '@/utils';
import { Button } from '@/components/ui/chakra-compat';
import { toaster } from '@/components/ui/toaster';
import VenueMapPin from '@/components/venue/VenueMapPin';

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
            {categories.map((category, index) => (
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
                  <ChevronRight
                    size={18}
                    color="var(--chakra-colors-gray-400)"
                  />
                </Flex>
              </Box>
            ))}
          </VStack>
        )}
      </Box>

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
