'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  Box,
  Container,
  Flex,
  Grid,
  Heading,
  HStack,
  Image,
  Text,
  VStack,
} from '@chakra-ui/react';
import {
  Banknote,
  CalendarPlus,
  Clock,
  LayoutGrid,
  MapPin,
  PencilLine,
  Search,
  Settings,
} from 'lucide-react';
import { VenueService } from '@/lib/api/venue.service';
import { Venue, VenuePriceBook, VenueRequestType } from '@/lib/api/types';
import PageLayout from '@/components/layout/PageLayout';
import DetailPageSkeleton from '@/components/layout/DetailPageSkeleton';
import { AppAddressDisplay } from '@/components/common/AppAddressDisplay';
import AppDetailStickyHeader from '@/components/common/AppDetailStickyHeader';
import { Button } from '@/components/ui/chakra-compat';
import { DETAIL_PAGE_MAX_W } from '@/constants';
import { usePathname, useRouter } from '@/i18n/config';
import { toaster } from '@/components/ui/toaster';
import { useAuthStore } from '@/stores/useAuthStore';
import { formatVenueFullName, resolveVenueNamePattern } from '@/utils';
import { SPORT_TYPES } from '@/constants/sports';
import {
  buildPricingRows,
  getActivePriceBook,
  getMinPricePerHour,
} from '@/utils/venue-pricing';
import { useLocale, useTranslations } from 'next-intl';
import VenueAboutCard from '@/components/venue/VenueAboutCard';
import VenueContactCard from '@/components/venue/VenueContactCard';
import VenueDetailHero from '@/components/venue/VenueDetailHero';
import VenueLocationCard from '@/components/venue/VenueLocationCard';
import VenuePhotosSection from '@/components/venue/VenuePhotosSection';
import VenuePricingSection from '@/components/venue/VenuePricingSection';
import VenueDetailStickyBar from '@/components/venue/VenueDetailStickyBar';
import VenueRequestModal from '@/components/venue/VenueRequestModal';
import VenuePriceRequestModal from '@/components/venue/VenuePriceRequestModal';
import VenueImageRequestModal from '@/components/venue/VenueImageRequestModal';
import AppLightbox from '@/components/ui/AppLightbox';
import DetailViewCountFooter from '@/components/common/DetailViewCountFooter';
import dynamic from 'next/dynamic';

const LoginPromptModal = dynamic(
  () => import('@/components/auth/LoginPromptModal'),
  { ssr: false }
);

const OPEN_VENUE_UPDATE_REQUEST_ACTION = 'openVenueUpdateRequest';

interface VenueDetailClientProps {
  initialVenue: Venue | null;
}

export default function VenueDetailClient({
  initialVenue,
}: VenueDetailClientProps) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('venue');
  const locale = useLocale();
  const { user, isAuthenticated } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const [venue, setVenue] = useState<Venue | null>(initialVenue);
  const [loading, setLoading] = useState(!initialVenue);
  const [isUpdateRequestOpen, setIsUpdateRequestOpen] = useState(false);
  const [isCreateRequestOpen, setIsCreateRequestOpen] = useState(false);
  const [isPriceRequestOpen, setIsPriceRequestOpen] = useState(false);
  const [isImageRequestOpen, setIsImageRequestOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [heroLightboxImage, setHeroLightboxImage] = useState<string | null>(
    null
  );
  const [priceBooks, setPriceBooks] = useState<VenuePriceBook[]>([]);

  useEffect(() => {
    if (initialVenue) return;

    const fetchVenue = async () => {
      try {
        setLoading(true);
        const id = params.id as string;
        const data = await VenueService.getVenue(id);
        setVenue(data);
      } catch (error) {
        console.error('Failed to fetch venue:', error);
        toaster.error({
          title: t('detail.loadError'),
          description: t('detail.tryAgainLater'),
        });
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchVenue();
    }
  }, [params.id, initialVenue, t]);

  useEffect(() => {
    if (!venue?.id) return;

    const fetchPriceBooks = async () => {
      try {
        const data = await VenueService.getPriceBooks(venue.id);
        setPriceBooks(data);
      } catch (error) {
        console.error('Failed to fetch venue price books:', error);
      }
    };

    fetchPriceBooks();
  }, [venue?.id]);

  useEffect(() => {
    if (
      !user ||
      !venue ||
      searchParams.get('action') !== OPEN_VENUE_UPDATE_REQUEST_ACTION
    ) {
      return;
    }

    setIsUpdateRequestOpen(true);
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete('action');
    const nextUrl = nextParams.toString()
      ? `${pathname}?${nextParams.toString()}`
      : pathname;
    router.replace(nextUrl);
  }, [pathname, router, searchParams, user, venue]);

  const getUpdateRequestReturnUrl = () => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set('action', OPEN_VENUE_UPDATE_REQUEST_ACTION);
    return nextParams.toString()
      ? `${pathname}?${nextParams.toString()}`
      : pathname;
  };

  const handleFindSessions = () => {
    if (!venue) return;
    router.push(`/?venueId=${venue.id}`);
  };

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/venues');
  };

  const handleRentCourt = () => {
    if (!venue) return;
    const target = `/venues/${venue.slug || venue.id}/rent`;
    router.push(
      isAuthenticated
        ? target
        : `/auth/signin?returnUrl=${encodeURIComponent(target)}`
    );
  };

  const handleOpenUpdateRequest = () => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }
    setIsUpdateRequestOpen(true);
  };

  const handleOpenPriceRequest = () => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }
    setIsPriceRequestOpen(true);
  };

  const handleOpenImageRequest = () => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }
    setIsImageRequestOpen(true);
  };

  const handleOpenCreateRequest = () => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }
    setIsCreateRequestOpen(true);
  };

  const handleShare = async () => {
    const shareUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}${window.location.pathname}`
        : '';

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: venueName,
          text: `Khám phá ${venueName} trên Vmito`,
          url: shareUrl,
        });
        return;
      }

      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        toaster.success({
          title: t('detail.linkCopied') || 'Đã sao chép liên kết',
        });
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      toaster.error({
        title: t('detail.shareFailed') || 'Không thể chia sẻ',
      });
    }
  };

  if (loading) {
    return <DetailPageSkeleton title={t('detail.title')} />;
  }

  if (!venue) {
    return (
      <PageLayout title={t('detail.title')} maxW={DETAIL_PAGE_MAX_W}>
        <Container maxW="container.md" py={16} textAlign="center">
          <Heading mb={4}>{t('detail.notFound')}</Heading>
          <Text color="gray.500" mb={6}>
            {t('detail.notFoundDesc')}
          </Text>
          <Button onClick={() => router.push('/venues')} colorPalette="green">
            {t('detail.backToList')}
          </Button>
        </Container>
      </PageLayout>
    );
  }

  const venueName = formatVenueFullName(
    venue.name,
    resolveVenueNamePattern(venue, {
      generic: t('nameFormat', { name: '{name}' }),
      bySport: Object.fromEntries(
        SPORT_TYPES.map((sport) => [
          sport,
          t(`fullNameFormat.${sport}`, { name: '{name}' }),
        ])
      ),
    })
  );

  const activePriceBook = getActivePriceBook(priceBooks);
  const pricingRows = buildPricingRows(activePriceBook, t);
  const minPricePerHour = getMinPricePerHour(pricingRows);
  const hasImages = (venue.images?.length ?? 0) > 0;
  // Venue owner = someone listed as a manager (any role). Admin can always see.
  const isVenueOwner =
    !!user &&
    (venue.managers?.some((m) => String(m.userId) === String(user.id)) ??
      false);
  const distanceLabel =
    venue.distance !== undefined && venue.distance !== null
      ? t('detail.distanceAway', {
          distance: new Intl.NumberFormat(locale, {
            maximumFractionDigits: 1,
          }).format(venue.distance),
        })
      : null;

  return (
    <PageLayout title={venueName} maxW={DETAIL_PAGE_MAX_W} hideTopBarOnMobile>
      {/* Hero Section */}
      <Container maxW={DETAIL_PAGE_MAX_W} px={0}>
        <VenueDetailHero
          venue={venue}
          venueName={venueName}
          canViewFavoriteUsers={isAdmin || isVenueOwner}
          onBack={handleBack}
          onShare={handleShare}
        />

        <AppDetailStickyHeader
          title={venueName}
          onBack={handleBack}
          onShare={handleShare}
          shareLabel={t('share')}
          showBrand
        />

        {/* Info Card */}
        <Box
          w="full"
          bg="white"
          _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
          borderRadius="2xl"
          shadow="sm"
          px={{ base: 3, md: 5 }}
          py={{ base: 2, md: 3.5 }}
          borderWidth="1px"
          borderColor="gray.100"
          mb={4}
        >
          <Flex gap={{ base: 3, md: 4 }} align="center">
            {/* No placeholder icon: a generic map pin next to the address adds
                nothing and steals width from the name. */}
            {venue.logo && (
              <Box
                w="48px"
                h="48px"
                flexShrink={0}
                shadow="sm"
                borderRadius="lg"
                overflow="hidden"
                borderWidth="1px"
                borderColor="green.100"
                _dark={{ borderColor: 'green.800' }}
                cursor="pointer"
                onClick={() => setHeroLightboxImage(venue.logo!)}
              >
                <Image
                  src={venue.logo}
                  alt={venueName}
                  w="full"
                  h="full"
                  objectFit="cover"
                />
              </Box>
            )}
            <Box flex="1" minW="0">
              <Heading
                size={{ base: 'xl', md: '2xl' }}
                fontWeight="bold"
                mb={0}
                letterSpacing="tight"
              >
                {venueName}
              </Heading>
              <Box display={{ base: 'none', lg: 'block' }} mt={0.5}>
                <AppAddressDisplay
                  address={venue.address}
                  district={venue.district}
                  city={venue.city}
                  newAddress={venue.newAddress}
                  newDistrict={venue.newDistrict}
                  fontSize="sm"
                  color="gray.500"
                  lineClamp={2}
                />
              </Box>
            </Box>
          </Flex>
          {/* Mobile address — visually separated from the title so long
              addresses remain scannable and align with the quick facts. */}
          <Flex
            display={{ base: 'flex', lg: 'none' }}
            align="flex-start"
            gap={2}
            mt={2.5}
            minW={0}
          >
            <Box color="gray.500" _dark={{ color: 'gray.400' }} pt="2px">
              <MapPin size={18} aria-hidden="true" />
            </Box>
            <Box flex="1" minW={0}>
              <AppAddressDisplay
                address={venue.address}
                district={venue.district}
                city={venue.city}
                newAddress={venue.newAddress}
                newDistrict={venue.newDistrict}
                fontSize="sm"
                color="gray.500"
                _dark={{ color: 'gray.400' }}
                lineClamp={2}
                suffix={distanceLabel ? ` (${distanceLabel})` : undefined}
              />
            </Box>
          </Flex>
          {/* Quick facts — mobile only; the desktop sidebar owns its own card */}
          {(venue.openingHours || venue.numberOfCourts) && (
            <Grid
              display={{ base: 'grid', lg: 'none' }}
              templateColumns={
                venue.openingHours && venue.numberOfCourts
                  ? 'repeat(2, minmax(0, 1fr))'
                  : '1fr'
              }
              gap={3}
              mt={4}
            >
              {venue.openingHours && (
                <Box
                  minW={0}
                  p={3}
                  borderRadius="xl"
                  bg="gray.50"
                  borderWidth="1px"
                  borderColor="gray.100"
                  _dark={{ bg: 'gray.900', borderColor: 'gray.700' }}
                >
                  <Text
                    fontSize="xs"
                    color="gray.500"
                    _dark={{ color: 'gray.400' }}
                    mb={1}
                  >
                    {t('openingHours')}
                  </Text>
                  <Text fontSize="md" fontWeight="bold" lineClamp={1}>
                    {venue.openingHours}
                  </Text>
                </Box>
              )}
              {venue.numberOfCourts && (
                <Box
                  minW={0}
                  p={3}
                  borderRadius="xl"
                  bg="gray.50"
                  borderWidth="1px"
                  borderColor="gray.100"
                  _dark={{ bg: 'gray.900', borderColor: 'gray.700' }}
                >
                  <Text
                    fontSize="xs"
                    color="gray.500"
                    _dark={{ color: 'gray.400' }}
                    mb={1}
                  >
                    {t('detail.courtsLabel')}
                  </Text>
                  <Text fontSize="md" fontWeight="bold" lineClamp={1}>
                    {t('detail.courtsValue', { count: venue.numberOfCourts })}
                  </Text>
                </Box>
              )}
            </Grid>
          )}
          {/* Contact — mobile only, merged into this card so calling the venue
              never requires scrolling past the price table. */}
          {(venue.phone || venue.website) && (
            <Box
              display={{ base: 'block', lg: 'none' }}
              mt={3}
              pt={3}
              borderTopWidth="1px"
              borderTopColor="gray.100"
              _dark={{ borderTopColor: 'gray.700' }}
            >
              <VenueContactCard
                phone={venue.phone}
                website={venue.website}
                variant="inline"
              />
            </Box>
          )}
          {/* Admin actions — own full-width row so they never crowd the
              (truncated) venue name on mobile. */}
          {isAdmin && (
            <Flex gap={2} mt={3}>
              <Button
                flex={{ base: 1, md: 'initial' }}
                variant="outline"
                size="sm"
                colorPalette="green"
                onClick={() => router.push(`/admin/venues/${venue.id}/pricing`)}
              >
                <Banknote size={14} />
                {t('detail.pricing')}
              </Button>
              <Button
                flex={{ base: 1, md: 'initial' }}
                variant="outline"
                size="sm"
                colorPalette="gray"
                onClick={() => router.push(`/admin/venues/${venue.id}/edit`)}
              >
                <Settings size={14} />
                {t('detail.edit')}
              </Button>
            </Flex>
          )}
        </Box>
      </Container>

      {/* Content — one continuous scroll; the old 2-tab bar (Giới thiệu /
          Hình ảnh) added a navigation layer for very little content. */}
      <Container maxW={DETAIL_PAGE_MAX_W} pb={8} px={0}>
        <Grid templateColumns={{ base: '1fr', lg: '2.3fr 1fr' }} gap={6} mt={0}>
          {/* ── Left column: main content ── */}
          <Box minW={0}>
            <VStack gap={4} align="stretch">
              <VenueAboutCard venue={venue} />

              <VenuePricingSection
                rows={pricingRows}
                activePriceBook={activePriceBook}
                canEditPricing={isAdmin}
                onEditPricing={() =>
                  router.push(`/admin/venues/${venue.id}/pricing`)
                }
              />

              {hasImages && (
                <VenuePhotosSection
                  images={venue.images ?? []}
                  venueName={venueName}
                />
              )}
            </VStack>
          </Box>

          {/* ── Right column on desktop; on mobile it stacks below the content
              and only the blocks not already shown above stay visible. ── */}
          <Box minW={0}>
            <VStack gap={5} align="stretch" position="sticky" top="80px">
              {/* Quick Info — hidden entirely when there's nothing to show */}
              {(venue.openingHours || venue.numberOfCourts) && (
                <Box
                  display={{ base: 'none', lg: 'block' }}
                  bg="white"
                  _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                  borderRadius="2xl"
                  p={5}
                  shadow="sm"
                  borderWidth="1px"
                  borderColor="gray.100"
                >
                  <Heading size="sm" mb={4}>
                    {t('detail.quickInfo')}
                  </Heading>
                  <VStack gap={4} align="stretch">
                    {venue.openingHours && (
                      <HStack gap={3}>
                        <Flex
                          w="36px"
                          h="36px"
                          borderRadius="lg"
                          bg="blue.100"
                          _dark={{ bg: 'blue.900/60' }}
                          align="center"
                          justify="center"
                          flexShrink={0}
                        >
                          <Clock
                            size={18}
                            color="var(--chakra-colors-blue-600)"
                          />
                        </Flex>
                        <Box flex="1">
                          <Text
                            fontSize="xs"
                            color="gray.500"
                            _dark={{ color: 'gray.400' }}
                          >
                            {t('openingHours')}
                          </Text>
                          <Text fontWeight="semibold" fontSize="sm">
                            {venue.openingHours}
                          </Text>
                        </Box>
                      </HStack>
                    )}
                    {venue.numberOfCourts && (
                      <HStack gap={3}>
                        <Flex
                          w="36px"
                          h="36px"
                          borderRadius="lg"
                          bg="green.100"
                          _dark={{ bg: 'green.900/60' }}
                          align="center"
                          justify="center"
                          flexShrink={0}
                        >
                          <LayoutGrid
                            size={18}
                            color="var(--chakra-colors-green-600)"
                          />
                        </Flex>
                        <Box flex="1">
                          <Text
                            fontSize="xs"
                            color="gray.500"
                            _dark={{ color: 'gray.400' }}
                          >
                            {t('detail.courtsLabel')}
                          </Text>
                          <Text fontWeight="semibold" fontSize="sm">
                            {t('detail.courtsValue', {
                              count: venue.numberOfCourts,
                            })}
                          </Text>
                        </Box>
                      </HStack>
                    )}
                  </VStack>
                </Box>
              )}

              {/* Chơi tại sân này: Đặt sân + Tìm kèo. On mobile it only earns
                  its place when the sticky bar shows "Đặt sân" instead. */}
              <Box
                display={{
                  base: venue.rentalEnabled ? 'block' : 'none',
                  lg: 'block',
                }}
                bg="green.50"
                _dark={{ bg: 'green.900/20', borderColor: 'green.800' }}
                borderRadius="2xl"
                p={5}
                shadow="sm"
                borderWidth="1px"
                borderColor="green.100"
              >
                <Heading
                  size="sm"
                  mb={1}
                  color="green.700"
                  _dark={{ color: 'green.300' }}
                >
                  {t('detail.findSessionsHere')}
                </Heading>
                <Text
                  fontSize="xs"
                  color="green.600"
                  _dark={{ color: 'green.400' }}
                  mb={3}
                >
                  {t('detail.findSessionsHereDesc')}
                </Text>
                <VStack gap={2} align="stretch">
                  {venue.rentalEnabled && (
                    <Button
                      display={{ base: 'none', lg: 'flex' }}
                      colorPalette="green"
                      onClick={handleRentCourt}
                    >
                      <CalendarPlus size={16} />
                      {t('detail.rentCourt')}
                    </Button>
                  )}
                  <Button
                    w="full"
                    variant={{
                      base: 'solid',
                      lg: venue.rentalEnabled ? 'outline' : 'solid',
                    }}
                    colorPalette="green"
                    onClick={handleFindSessions}
                  >
                    <Search size={16} />
                    {t('findSessions')}
                  </Button>
                </VStack>
              </Box>

              {/* Contact — the mobile layout shows this inside the info card */}
              <Box display={{ base: 'none', lg: 'block' }}>
                <VenueContactCard phone={venue.phone} website={venue.website} />
              </Box>

              {/* Location */}
              <VenueLocationCard venue={venue} venueName={venueName} />

              <Flex justify="center" w="full" pt={1}>
                <Button
                  variant="ghost"
                  colorPalette="gray"
                  color="gray.500"
                  _dark={{ color: 'gray.400' }}
                  _hover={{
                    color: 'green.600',
                    bg: 'green.50',
                    _dark: { color: 'green.400', bg: 'green.950/30' },
                  }}
                  size="sm"
                  onClick={handleOpenUpdateRequest}
                >
                  <PencilLine size={14} />
                  {t('requestUpdate')}
                </Button>
              </Flex>

              <DetailViewCountFooter
                targetType="VENUE"
                targetId={venue.id}
                initialCount={venue.viewCount}
              />

              {/* Clearance for the fixed bottom bar */}
              <Box
                display={{ base: 'block', lg: 'none' }}
                h="calc(72px + env(safe-area-inset-bottom))"
              />
            </VStack>
          </Box>
        </Grid>
      </Container>

      <VenueDetailStickyBar
        phone={venue.phone}
        minPricePerHour={minPricePerHour}
        rentalEnabled={venue.rentalEnabled}
        onRentCourt={handleRentCourt}
        onFindSessions={handleFindSessions}
      />

      <VenueRequestModal
        isOpen={isUpdateRequestOpen}
        onClose={() => setIsUpdateRequestOpen(false)}
        type={VenueRequestType.UPDATE}
        venue={venue}
        onOpenCreateRequest={() => {
          setIsUpdateRequestOpen(false);
          handleOpenCreateRequest();
        }}
        onOpenPriceCorrection={() => {
          setIsUpdateRequestOpen(false);
          handleOpenPriceRequest();
        }}
        onOpenImageCorrection={() => {
          setIsUpdateRequestOpen(false);
          handleOpenImageRequest();
        }}
      />
      <VenueRequestModal
        isOpen={isCreateRequestOpen}
        onClose={() => setIsCreateRequestOpen(false)}
        type={VenueRequestType.CREATE}
      />
      <VenuePriceRequestModal
        isOpen={isPriceRequestOpen}
        onClose={() => setIsPriceRequestOpen(false)}
        venueId={venue.id}
      />
      <VenueImageRequestModal
        isOpen={isImageRequestOpen}
        onClose={() => setIsImageRequestOpen(false)}
        venueId={venue.id}
      />
      {heroLightboxImage && (
        <AppLightbox
          images={[heroLightboxImage]}
          onClose={() => setHeroLightboxImage(null)}
          alt={venueName}
        />
      )}
      {isLoginModalOpen && (
        <LoginPromptModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          featureName={t('requestUpdate')}
          returnUrl={getUpdateRequestReturnUrl()}
        />
      )}
    </PageLayout>
  );
}
