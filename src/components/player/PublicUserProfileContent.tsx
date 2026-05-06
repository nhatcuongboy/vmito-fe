'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Image,
  SimpleGrid,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react';
import {
  CalendarDays,
  ChevronRight,
  MapPin,
  MessageSquare,
  Pencil,
  Phone,
  Settings,
  User,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/config';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PageLayout from '@/components/layout/PageLayout';
import UserProfileModal from '@/components/ui/UserProfileModal';
import { RatingService } from '@/lib/api/rating.service';
import { SessionService } from '@/lib/api/session.service';
import { UserService, IPublicProfileMeta } from '@/lib/api/user.service';
import { ClubsService } from '@/lib/api/clubs.service';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  ISession,
  Rating,
  RatingType,
  SessionStatus,
  UserRatingStats,
} from '@/lib/api/types';
import { IClub } from '@/types/club';
import { UserRatingSummaryCard } from '@/components/rating/UserRatingSummaryCard';
import { RatingList } from '@/components/rating/RatingList';
import { VModal, useModal } from '@/components/ui/VModal';
import { StarRatingDisplay } from '@/components/rating/StarRatingDisplay';
import PublicHostedSessionCard from '@/components/player/PublicHostedSessionCard';
import PublicUserProfileSkeleton from '@/components/player/PublicUserProfileSkeleton';

interface IPublicUserProfileContentProps {
  userId: string;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 6;
const REVIEWS_PREVIEW_SIZE = 3;
type THostedTab = 'active' | 'ended' | 'all';

const getHostedTab = (value: string | null): THostedTab => {
  if (value === 'active' || value === 'ended' || value === 'all') {
    return value;
  }

  return 'active';
};

const parsePositiveInt = (value: string | null, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
};

const formatDate = (
  input: Date | string | undefined,
  locale: string
): string => {
  if (!input) {
    return '--';
  }

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return '--';
  }

  return new Intl.DateTimeFormat(
    locale === 'vi' ? 'vi-VN' : locale === 'cn' ? 'zh-CN' : 'en-US',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }
  ).format(parsed);
};

export default function PublicUserProfileContent({
  userId,
}: IPublicUserProfileContentProps) {
  const t = useTranslations('userProfilePage');
  const tCommon = useTranslations('common');
  const tClubs = useTranslations('clubs');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { user: currentUser } = useAuthStore();

  const [profile, setProfile] = useState<IPublicProfileMeta | null>(null);
  const [ratingStats, setRatingStats] = useState<UserRatingStats | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [hostedSessions, setHostedSessions] = useState<ISession[]>([]);
  const [clubs, setClubs] = useState<IClub[]>([]);
  const [totalHostedSessions, setTotalHostedSessions] = useState(0);
  const [activeHostedSessionsCount, setActiveHostedSessionsCount] = useState(0);
  const [endedHostedSessionsCount, setEndedHostedSessionsCount] = useState(0);
  const [totalSessionPages, setTotalSessionPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionsLoading, setIsSessionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    isOpen: isAllReviewsOpen,
    onOpen: onOpenAllReviews,
    onClose: onCloseAllReviews,
  } = useModal();

  const page = parsePositiveInt(searchParams.get('page'), DEFAULT_PAGE);
  const limit = parsePositiveInt(searchParams.get('limit'), DEFAULT_LIMIT);
  const hostedTab = getHostedTab(searchParams.get('tab'));

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [
          profileResponse,
          ratingStatsResponse,
          ratingsResponse,
          clubsResponse,
        ] = await Promise.all([
          UserService.getPublicProfile(userId),
          RatingService.getUserRatingStats(userId),
          RatingService.getUserReceivedRatings(userId),
          ClubsService.getUserClubs(userId),
        ]);

        const sortedRatings = [...ratingsResponse]
          .filter((r) => r.type === RatingType.PLAYER_TO_HOST)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

        setProfile(profileResponse);
        setRatingStats(ratingStatsResponse);
        setRatings(sortedRatings);
        setClubs(clubsResponse);
      } catch (fetchError) {
        console.error('Failed to fetch public profile:', fetchError);
        setError(t('loadFailed'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [userId, t]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setIsSessionsLoading(true);

        const sessionFilters =
          hostedTab === 'active'
            ? {
                excludeStatuses: [
                  SessionStatus.FINISHED,
                  SessionStatus.CANCELLED,
                ],
              }
            : hostedTab === 'ended'
              ? {
                  excludeStatuses: [
                    SessionStatus.PREPARING,
                    SessionStatus.IN_PROGRESS,
                  ],
                }
              : {};

        const [
          hostedSessionsResponse,
          activeCountResponse,
          endedCountResponse,
        ] = await Promise.all([
          SessionService.getPublicSessions(userId, {
            page,
            limit,
            sortBy: 'startTime',
            sortOrder: 'desc',
            ...sessionFilters,
          }),
          SessionService.getPublicSessions(userId, {
            page: 1,
            limit: 1,
            excludeStatuses: [SessionStatus.FINISHED, SessionStatus.CANCELLED],
          }),
          SessionService.getPublicSessions(userId, {
            page: 1,
            limit: 1,
            excludeStatuses: [
              SessionStatus.PREPARING,
              SessionStatus.IN_PROGRESS,
            ],
          }),
        ]);

        setHostedSessions(hostedSessionsResponse.data);
        setTotalHostedSessions(hostedSessionsResponse.total);
        setActiveHostedSessionsCount(activeCountResponse.total);
        setEndedHostedSessionsCount(endedCountResponse.total);
        setTotalSessionPages(hostedSessionsResponse.totalPages);
      } catch (fetchError) {
        console.error('Failed to fetch sessions:', fetchError);
      } finally {
        setIsSessionsLoading(false);
      }
    };

    fetchSessions();
  }, [userId, page, limit, hostedTab]);

  const ratingsPreview = useMemo(
    () => ratings.slice(0, REVIEWS_PREVIEW_SIZE),
    [ratings]
  );

  const handlePageChange = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(nextPage));
    params.set('limit', String(limit));
    params.set('tab', hostedTab);

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleTabChange = (nextTab: THostedTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', nextTab);
    params.set('page', String(DEFAULT_PAGE));
    params.set('limit', String(limit));

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const displayName = profile?.name || tCommon('unknown');
  const avatarUrl = profile?.image || undefined;

  const isOwner = currentUser?.id === userId;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const joinedAt = profile?.createdAt;
  const phone = profile?.phone;

  const derivedArea = useMemo(() => {
    const sessionWithArea = hostedSessions.find(
      (session) => session.venue?.district || session.venue?.city
    );

    if (!sessionWithArea) {
      return '';
    }

    return [sessionWithArea.venue?.district, sessionWithArea.venue?.city]
      .filter(Boolean)
      .join(', ');
  }, [hostedSessions]);

  if (isLoading) {
    return <PublicUserProfileSkeleton />;
  }

  if (error || !profile) {
    return (
      <PageLayout title={t('title')} showBackButton={true} bg="gray.50">
        <Box
          mt={4}
          borderWidth="1px"
          borderColor="red.200"
          bg="red.50"
          borderRadius="lg"
          p={4}
        >
          <Text color="red.600" fontWeight="medium">
            {error || t('profileNotFound')}
          </Text>
        </Box>
      </PageLayout>
    );
  }

  return (
    <>
      {isOwner && (
        <UserProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
      <PageLayout title={t('title')} bg="gray.50">
        <VStack gap={6} align="stretch" pb={6}>
          <Box
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="2xl"
            bg="white"
            overflow="hidden"
          >
            <Box
              bg="linear-gradient(135deg, #FFD75F 0%, #FFC107 100%)"
              h="100px"
              position="relative"
            >
              <Image
                src="/icons/app-logo-black.png"
                alt="Vmito"
                position="absolute"
                right={4}
                top={4}
                h="24px"
                opacity={0.25}
              />
              <Text
                position="absolute"
                bottom={2}
                left="120px"
                right={16}
                fontSize="lg"
                fontWeight="bold"
                color="gray.800"
                lineClamp={1}
              >
                {displayName}
              </Text>
            </Box>

            <Box px={5} pb={5}>
              <HStack align="start" gap={4} mt="-12">
                <Avatar.Root
                  size="2xl"
                  borderRadius="full"
                  borderWidth="4px"
                  borderColor="white"
                >
                  <Avatar.Fallback name={displayName}>
                    <User size={24} />
                  </Avatar.Fallback>
                  {avatarUrl && <Avatar.Image src={avatarUrl} />}
                </Avatar.Root>

                <VStack align="start" gap={2} flex={1} pt={14}>
                  {isOwner && (
                    <Button
                      size="sm"
                      variant="outline"
                      colorPalette="green"
                      onClick={() => setIsEditModalOpen(true)}
                      alignSelf="flex-end"
                    >
                      <Pencil size={14} />
                      {tCommon('editProfile')}
                    </Button>
                  )}
                  <HStack gap={2}>
                    <StarRatingDisplay
                      rating={ratingStats?.averageRating || 0}
                      count={ratingStats?.totalRatings || 0}
                      variant="compact"
                      size="sm"
                    />
                    <Badge colorPalette="green" variant="subtle">
                      {t('verifiedHost')}
                    </Badge>
                  </HStack>

                  <SimpleGrid columns={2} gap={3} width="full" pt={1}>
                    <Box borderRadius="lg" bg="gray.50" px={3} py={2}>
                      <Text fontSize="xs" color="gray.500">
                        {t('hostedSessions')}
                      </Text>
                      <Text
                        fontSize="md"
                        fontWeight="semibold"
                        color="gray.800"
                      >
                        {totalHostedSessions}
                      </Text>
                    </Box>

                    <Box borderRadius="lg" bg="gray.50" px={3} py={2}>
                      <Text fontSize="xs" color="gray.500">
                        {t('reviews')}
                      </Text>
                      <Text
                        fontSize="md"
                        fontWeight="semibold"
                        color="gray.800"
                      >
                        {ratingStats?.totalRatings ?? 0}
                      </Text>
                    </Box>
                  </SimpleGrid>

                  {phone && (
                    <HStack gap={2} color="gray.600" pt={1}>
                      <Phone size={16} />
                      <Text fontSize="sm">{phone}</Text>
                    </HStack>
                  )}

                  {derivedArea && (
                    <HStack gap={2} color="gray.600">
                      <MapPin size={16} />
                      <Text fontSize="sm">{derivedArea}</Text>
                    </HStack>
                  )}

                  {joinedAt && (
                    <HStack gap={2} color="gray.600">
                      <CalendarDays size={16} />
                      <Text fontSize="sm">
                        {t('joinedDateLabel', {
                          date: formatDate(joinedAt, locale),
                        })}
                      </Text>
                    </HStack>
                  )}
                </VStack>
              </HStack>
            </Box>
          </Box>

          {(() => {
            const hostedClubs = clubs.filter(
              (c) => (c.hostId ?? c.host?.id) === userId
            );
            const memberClubs = clubs.filter(
              (c) => (c.hostId ?? c.host?.id) !== userId
            );
            const isOwnProfile = currentUser?.id === userId;

            // Only show section if:
            // - Own profile: has any clubs (hosted or member)
            // - Other's profile: has hosted clubs only
            const shouldShowSection = isOwnProfile
              ? clubs.length > 0
              : hostedClubs.length > 0;

            if (!shouldShowSection) {
              return null;
            }

            return (
              <Box
                bg="white"
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="2xl"
                p={4}
              >
                <HStack justify="space-between" align="center" mb={3}>
                  <Text fontSize="lg" fontWeight="bold" color="gray.800">
                    {t('clubs')}
                  </Text>

                  {isOwnProfile && (
                    <Link href={`/${locale}/my-clubs`}>
                      <Button size="xs" variant="ghost" colorPalette="green">
                        <Settings size={14} />
                        {tClubs('manageClubs')}
                      </Button>
                    </Link>
                  )}
                </HStack>

                <VStack gap={4} align="stretch">
                  {hostedClubs.length > 0 && (
                    <Box>
                      <Text
                        fontSize="sm"
                        fontWeight="semibold"
                        color="gray.600"
                        mb={2}
                      >
                        {t('hostedClubs')} ({hostedClubs.length})
                      </Text>
                      <VStack gap={2} align="stretch">
                        {hostedClubs.map((club) => (
                          <Link
                            key={club.id}
                            href={`/${locale}/clubs/${club.id}`}
                          >
                            <Box
                              borderWidth="1px"
                              borderColor="gray.200"
                              borderRadius="lg"
                              p={3}
                              bg="gray.50"
                              _hover={{
                                bg: 'gray.100',
                                borderColor: 'green.300',
                              }}
                              transition="all 0.2s"
                              cursor="pointer"
                            >
                              <HStack gap={3}>
                                {club.image && (
                                  <Image
                                    src={club.image}
                                    alt={club.name}
                                    boxSize="40px"
                                    borderRadius="md"
                                    objectFit="cover"
                                  />
                                )}
                                <VStack align="start" gap={0} flex={1}>
                                  <Text fontWeight="semibold" color="gray.800">
                                    {club.name}
                                  </Text>
                                  {club.memberCount > 0 && (
                                    <Text fontSize="xs" color="gray.500">
                                      {club.memberCount} {tCommon('members')}
                                    </Text>
                                  )}
                                </VStack>
                                <ChevronRight size={16} color="gray" />
                              </HStack>
                            </Box>
                          </Link>
                        ))}
                      </VStack>
                    </Box>
                  )}

                  {isOwnProfile && memberClubs.length > 0 && (
                    <Box>
                      <Text
                        fontSize="sm"
                        fontWeight="semibold"
                        color="gray.600"
                        mb={2}
                      >
                        {t('memberClubs')} ({memberClubs.length})
                      </Text>
                      <VStack gap={2} align="stretch">
                        {memberClubs.map((club) => (
                          <Link
                            key={club.id}
                            href={`/${locale}/clubs/${club.id}`}
                          >
                            <Box
                              borderWidth="1px"
                              borderColor="gray.200"
                              borderRadius="lg"
                              p={3}
                              bg="gray.50"
                              _hover={{
                                bg: 'gray.100',
                                borderColor: 'green.300',
                              }}
                              transition="all 0.2s"
                              cursor="pointer"
                            >
                              <HStack gap={3}>
                                {club.image && (
                                  <Image
                                    src={club.image}
                                    alt={club.name}
                                    boxSize="40px"
                                    borderRadius="md"
                                    objectFit="cover"
                                  />
                                )}
                                <VStack align="start" gap={0} flex={1}>
                                  <Text fontWeight="semibold" color="gray.800">
                                    {club.name}
                                  </Text>
                                  {club.memberCount > 0 && (
                                    <Text fontSize="xs" color="gray.500">
                                      {club.memberCount} {tCommon('members')}
                                    </Text>
                                  )}
                                </VStack>
                                <ChevronRight size={16} color="gray" />
                              </HStack>
                            </Box>
                          </Link>
                        ))}
                      </VStack>
                    </Box>
                  )}
                </VStack>
              </Box>
            );
          })()}

          <Box
            bg="white"
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="2xl"
            p={4}
          >
            <Flex justify="space-between" align="center" mb={3}>
              <Text fontSize="lg" fontWeight="bold" color="gray.800">
                {t('hostedSessions')} ({totalHostedSessions})
              </Text>
            </Flex>

            <HStack gap={2} mb={4}>
              <Button
                size="sm"
                borderRadius="full"
                variant={hostedTab === 'active' ? 'solid' : 'outline'}
                colorPalette={hostedTab === 'active' ? 'green' : 'gray'}
                onClick={() => handleTabChange('active')}
              >
                {t('activeHosted')} ({activeHostedSessionsCount})
              </Button>
              <Button
                size="sm"
                borderRadius="full"
                variant={hostedTab === 'ended' ? 'solid' : 'outline'}
                colorPalette={hostedTab === 'ended' ? 'green' : 'gray'}
                onClick={() => handleTabChange('ended')}
              >
                {t('endedHosted')} ({endedHostedSessionsCount})
              </Button>
              <Button
                size="sm"
                borderRadius="full"
                variant={hostedTab === 'all' ? 'solid' : 'outline'}
                colorPalette={hostedTab === 'all' ? 'green' : 'gray'}
                onClick={() => handleTabChange('all')}
              >
                {t('allHosted')}
              </Button>
            </HStack>

            {isSessionsLoading ? (
              <VStack gap={3} align="stretch">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} height="80px" borderRadius="lg" />
                ))}
              </VStack>
            ) : hostedSessions.length === 0 ? (
              <Box
                borderWidth="1px"
                borderStyle="dashed"
                borderColor="gray.300"
                borderRadius="xl"
                p={6}
                textAlign="center"
                bg="gray.50"
              >
                <Icon as={MessageSquare} boxSize={6} color="gray.300" mb={2} />
                <Text color="gray.500">
                  {hostedTab === 'active'
                    ? t('noActiveHostedSessions')
                    : hostedTab === 'ended'
                      ? t('noEndedHostedSessions')
                      : t('noHostedSessions')}
                </Text>
              </Box>
            ) : (
              <VStack gap={3} align="stretch">
                {hostedSessions.map((session) => (
                  <PublicHostedSessionCard key={session.id} session={session} />
                ))}
              </VStack>
            )}

            {totalSessionPages > 1 && (
              <HStack justify="space-between" mt={4}>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                >
                  {tCommon('previous')}
                </Button>

                <Text fontSize="sm" color="gray.600">
                  {t('pagination', { page, totalPages: totalSessionPages })}
                </Text>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalSessionPages}
                  onClick={() => handlePageChange(page + 1)}
                >
                  {tCommon('next')}
                </Button>
              </HStack>
            )}
          </Box>

          <Box
            bg="white"
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="2xl"
            p={4}
          >
            <Flex justify="space-between" align="center" mb={3}>
              <Text fontSize="lg" fontWeight="bold" color="gray.800">
                {t('reviews')} ({ratingStats?.totalRatings ?? 0})
              </Text>
              {ratings.length > REVIEWS_PREVIEW_SIZE && (
                <Button
                  variant="ghost"
                  size="sm"
                  colorPalette="green"
                  onClick={onOpenAllReviews}
                >
                  {t('viewAllReviews')}
                </Button>
              )}
            </Flex>

            <VStack gap={3} align="stretch">
              <UserRatingSummaryCard stats={ratingStats} />
              {ratingsPreview.length > 0 && (
                <RatingList
                  ratings={ratingsPreview}
                  emptyMessage={t('noReviews')}
                />
              )}
            </VStack>
          </Box>
        </VStack>
      </PageLayout>

      <VModal
        isOpen={isAllReviewsOpen}
        onClose={onCloseAllReviews}
        title={t('allReviews')}
        size="lg"
        showHeaderDivider={true}
        showFooterDivider={false}
        hideSecondaryAction={true}
      >
        <RatingList ratings={ratings} emptyMessage={t('noReviews')} />
      </VModal>
    </>
  );
}
