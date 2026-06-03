'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Box, Flex, HStack, Skeleton, Text, VStack } from '@chakra-ui/react';
import { AppAddressDisplay } from '@/components/common/AppAddressDisplay';
import {
  Users,
  CalendarDays,
  BarChart3,
  ChevronRight,
  MapPin,
  Navigation,
  Pencil,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  QrCode,
  Copy,
  Check,
  Share2,
  MonitorPlay,
  Gavel,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Tournament,
  CategoryType,
  TournamentVenue,
  UserRole,
  Venue,
} from '@/lib/api/types';
import { TournamentService } from '@/lib/api/tournament.service';
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
  totalTeams: number;
  isLoadingCategories?: boolean;
  isHost: boolean;
  slug: string;
}

export default function TournamentHomeTab({
  tournament,
  categories,
  totalTeams,
  isLoadingCategories = false,
  isHost,
  slug,
}: TournamentHomeTabProps) {
  const t = useTranslations('pages.tournaments.detail.homeTab');
  const tBoard = useTranslations('pages.tournaments.scoreboard');
  const tRef = useTranslations('pages.tournaments.scoreEntry');
  const router = useRouter();
  const { user } = useAuthStore();
  const isTournamentHost = !!user && user.id === tournament.hostId;
  const canReferee =
    isTournamentHost ||
    [UserRole.REFEREE, UserRole.HOST, UserRole.ADMIN].includes(
      user?.role as UserRole
    );
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
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
    'en-US',
    {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  );

  const venue = tournament.venue;
  const host = tournament.host;
  const displayVenues = useMemo<IHomeVenueItem[]>(() => {
    if (tournamentVenues.length > 0) return tournamentVenues;
    if (!venue) return [];
    return [{ id: venue.id, venue }];
  }, [tournamentVenues, venue]);

  useEffect(() => {
    if (!qrCanvasRef.current) return;

    QRCode.toCanvas(qrCanvasRef.current, shareUrl, {
      width: 112,
      margin: 2,
      color: {
        dark: '#111827',
        light: '#FFFFFF',
      },
    }).catch((error) => {
      console.error('Tournament QR code generation error:', error);
    });
  }, [shareUrl]);

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

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toaster.success({ title: 'Đã sao chép link giải đấu' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toaster.error({ title: 'Không thể sao chép link giải đấu' });
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

      await handleCopyShareLink();
    } catch {
      toaster.error({ title: 'Không thể chia sẻ giải đấu' });
    }
  };

  return (
    <VStack align="stretch" gap={4}>
      {/* Overview section */}
      <Box
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="xl"
        p={4}
        bg="white"
      >
        <Flex justify="space-between" align="center" mb={3}>
          <Text fontWeight="semibold" fontSize="lg">
            {t('overview.title')}
          </Text>
          <Flex
            w="32px"
            h="32px"
            borderRadius="md"
            align="center"
            justify="center"
            cursor="pointer"
            _hover={{ bg: 'gray.100' }}
          >
            <MoreHorizontal size={16} color="var(--chakra-colors-gray-500)" />
          </Flex>
        </Flex>

        <HStack gap={5} mb={4}>
          <Flex align="center" gap={2}>
            <Users size={16} color="var(--chakra-colors-gray-500)" />
            {isLoadingCategories ? (
              <Skeleton height="16px" width="132px" borderRadius="md" />
            ) : (
              <Text fontSize="sm" color="gray.600">
                {t('overview.teamsParticipating', { count: totalTeams })}
              </Text>
            )}
          </Flex>
          <Flex align="center" gap={2}>
            <CalendarDays size={16} color="var(--chakra-colors-gray-500)" />
            <Text fontSize="sm" color="gray.600">
              {formattedDate}
            </Text>
          </Flex>
        </HStack>

        <Flex gap={3}>
          <Box
            flex="1"
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="lg"
            p={3}
            cursor="pointer"
            _hover={{ bg: 'gray.50' }}
            onClick={handleViewSchedule}
          >
            <Flex align="center" gap={2}>
              <CalendarDays size={16} color="var(--chakra-colors-gray-500)" />
              <Text fontSize="sm" fontWeight="medium">
                {t('overview.viewSchedule')}
              </Text>
            </Flex>
          </Box>
          <Box
            flex="1"
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="lg"
            p={3}
            cursor="pointer"
            _hover={{ bg: 'gray.50' }}
            onClick={handleViewStandings}
          >
            <Flex align="center" gap={2}>
              <BarChart3 size={16} color="var(--chakra-colors-gray-500)" />
              <Text fontSize="sm" fontWeight="medium">
                {t('overview.viewStandings')}
              </Text>
            </Flex>
          </Box>
          <Box
            flex="1"
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="lg"
            p={3}
            cursor="pointer"
            _hover={{ bg: 'gray.50' }}
            onClick={handleViewScoreboard}
          >
            <Flex align="center" gap={2}>
              <MonitorPlay size={16} color="var(--chakra-colors-gray-500)" />
              <Text fontSize="sm" fontWeight="medium">
                {tBoard('liveScoreboard')}
              </Text>
            </Flex>
          </Box>
          {canReferee && (
            <Box
              flex="1"
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="lg"
              p={3}
              cursor="pointer"
              _hover={{ bg: 'gray.50' }}
              onClick={handleRefereeArea}
            >
              <Flex align="center" gap={2}>
                <Gavel size={16} color="var(--chakra-colors-gray-500)" />
                <Text fontSize="sm" fontWeight="medium">
                  {tRef('refereeArea')}
                </Text>
              </Flex>
            </Box>
          )}
        </Flex>
      </Box>

      {/* Categories section */}
      <Box
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="xl"
        bg="white"
        overflow="hidden"
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
            <Flex
              w="32px"
              h="32px"
              borderRadius="md"
              align="center"
              justify="center"
              cursor="pointer"
              _hover={{ bg: 'gray.100' }}
            >
              <MoreHorizontal size={16} color="var(--chakra-colors-gray-500)" />
            </Flex>
          </HStack>
        </Flex>

        {isLoadingCategories ? (
          <VStack align="stretch" gap={0} pb={2}>
            {Array.from({ length: 3 }).map((_, index) => (
              <Box key={index}>
                {index > 0 && <Box mx={4} h="1px" bg="gray.100" />}
                <Flex align="center" justify="space-between" py={3} px={4}>
                  <Skeleton height="18px" width="44%" borderRadius="md" />
                  <Skeleton height="18px" width="18px" borderRadius="md" />
                </Flex>
              </Box>
            ))}
          </VStack>
        ) : categories.length === 0 ? (
          <Box px={4} pb={4}>
            <Text fontSize="sm" color="gray.500">
              {t('categories.empty')}
            </Text>
          </Box>
        ) : (
          <VStack align="stretch" gap={0}>
            {categories.map((category, index) => (
              <Box key={category.id}>
                {index > 0 && <Box mx={4} h="1px" bg="gray.100" />}
                <Flex
                  align="center"
                  justify="space-between"
                  py={3}
                  px={4}
                  cursor="pointer"
                  _hover={{ bg: 'gray.50' }}
                  onClick={() =>
                    router.push(`/tournament/${slug}/manage?option=categories`)
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

      {/* Venues section */}
      {displayVenues.length > 0 && (
        <Box
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="2xl"
          overflow="hidden"
          bg="white"
          boxShadow="sm"
        >
          <Flex
            justify="space-between"
            align="center"
            px={{ base: 4, md: 6 }}
            pt={{ base: 4, md: 6 }}
            pb={4}
          >
            <Text fontWeight="bold" fontSize={{ base: 'xl', md: '2xl' }}>
              {t('venues.title')}
            </Text>
            <HStack gap={3}>
              {isHost && (
                <Button
                  variant="outline"
                  colorPalette="gray"
                  borderRadius="full"
                  px={{ base: 3, sm: 5 }}
                  size={{ base: 'sm', md: 'md' }}
                  onClick={handleManageVenues}
                >
                  {t('venues.manage')}
                </Button>
              )}
              <Flex
                w="32px"
                h="32px"
                borderRadius="md"
                align="center"
                justify="center"
                cursor="pointer"
                _hover={{ bg: 'gray.100' }}
              >
                <MoreHorizontal
                  size={16}
                  color="var(--chakra-colors-gray-500)"
                />
              </Flex>
            </HStack>
          </Flex>

          <VStack align="stretch" gap={0}>
            {displayVenues.map(({ id, venue: currentVenue }, index) => (
              <Box key={id}>
                {index > 0 && <Box h="1px" bg="gray.100" mx={6} />}
                <Box px={{ base: 4, md: 6 }}>
                  {currentVenue.lat && currentVenue.lng ? (
                    <VenueMapPin
                      lat={currentVenue.lat}
                      lng={currentVenue.lng}
                      height="220px"
                      zoom={12}
                    />
                  ) : (
                    <Box
                      h="180px"
                      bg="gray.100"
                      borderRadius="xl"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <MapPin size={34} color="var(--chakra-colors-gray-400)" />
                    </Box>
                  )}
                </Box>

                <Flex
                  align={{ base: 'stretch', sm: 'center' }}
                  justify="space-between"
                  direction={{ base: 'column', sm: 'row' }}
                  gap={4}
                  px={{ base: 4, md: 6 }}
                  py={4}
                >
                  <Box flex="1" minW={0}>
                    <Flex align="center" gap={2}>
                      <Text fontWeight="bold" fontSize="lg" color="gray.900">
                        {currentVenue.name}
                      </Text>
                      {currentVenue.acronym && (
                        <Text fontWeight="bold" fontSize="sm" color="gray.500">
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
                      fontSize="md"
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
                      cursor="pointer"
                      flexShrink={0}
                      alignSelf={{ base: 'flex-start', sm: 'center' }}
                      _hover={{ bg: 'gray.50' }}
                      onClick={() => handleOpenDirections(currentVenue)}
                    >
                      <Flex align="center" gap={3}>
                        <Navigation
                          size={20}
                          color="var(--chakra-colors-gray-900)"
                        />
                        <Text fontSize="lg" fontWeight="bold" color="gray.900">
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

      {/* Contact section */}
      {host && (
        <Box
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="xl"
          p={4}
          bg="white"
        >
          <Flex justify="space-between" align="center" mb={3}>
            <Text fontWeight="semibold" fontSize="lg">
              {t('contact.title')}
            </Text>
            {isHost && (
              <HStack gap={1}>
                <Flex
                  w="32px"
                  h="32px"
                  borderRadius="md"
                  align="center"
                  justify="center"
                  cursor="pointer"
                  _hover={{ bg: 'gray.100' }}
                >
                  <Trash2 size={16} color="var(--chakra-colors-gray-500)" />
                </Flex>
                <Flex
                  w="32px"
                  h="32px"
                  borderRadius="md"
                  align="center"
                  justify="center"
                  cursor="pointer"
                  _hover={{ bg: 'gray.100' }}
                >
                  <Pencil size={16} color="var(--chakra-colors-gray-500)" />
                </Flex>
                <Flex
                  w="32px"
                  h="32px"
                  borderRadius="md"
                  align="center"
                  justify="center"
                  cursor="pointer"
                  _hover={{ bg: 'gray.100' }}
                >
                  <MoreHorizontal
                    size={16}
                    color="var(--chakra-colors-gray-500)"
                  />
                </Flex>
              </HStack>
            )}
          </Flex>

          <VStack align="stretch" gap={1.5}>
            {host.name && (
              <Text fontSize="sm" color="gray.700">
                <Text as="span" fontWeight="medium">
                  {t('contact.name')}:
                </Text>{' '}
                {host.name}
              </Text>
            )}
            {host.email && (
              <Text fontSize="sm" color="gray.700">
                <Text as="span" fontWeight="medium">
                  {t('contact.email')}:
                </Text>{' '}
                {host.email}
              </Text>
            )}
          </VStack>
        </Box>
      )}

      {/* Tournament access QR */}
      <Flex
        direction={{ base: 'column', sm: 'row' }}
        align={{ base: 'stretch', sm: 'center' }}
        gap={4}
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="xl"
        p={4}
        bg="white"
      >
        <Box
          bg="white"
          borderRadius="md"
          borderWidth="1px"
          borderColor="gray.200"
          p={2}
          alignSelf={{ base: 'center', sm: 'auto' }}
          flexShrink={0}
        >
          <canvas ref={qrCanvasRef} />
        </Box>

        <VStack align="stretch" gap={3} flex="1" minW={0}>
          <HStack gap={2}>
            <QrCode size={17} color="var(--chakra-colors-gray-700)" />
            <Text fontWeight="semibold">QR truy cập giải đấu</Text>
          </HStack>
          <Button
            alignSelf={{ base: 'stretch', sm: 'flex-start' }}
            size="sm"
            variant="outline"
            colorPalette={copied ? 'green' : 'gray'}
            leftIcon={copied ? <Check size={15} /> : <Copy size={15} />}
            onClick={handleCopyShareLink}
          >
            {copied ? 'Đã sao chép' : 'Sao chép link'}
          </Button>
          <Button
            alignSelf={{ base: 'stretch', sm: 'flex-start' }}
            size="sm"
            variant="outline"
            colorPalette="blue"
            leftIcon={<Share2 size={15} />}
            onClick={handleShareLink}
          >
            Chia sẻ
          </Button>
        </VStack>
      </Flex>
    </VStack>
  );
}
