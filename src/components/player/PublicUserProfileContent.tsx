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
  Portal,
  SimpleGrid,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react';
import {
  CalendarDays,
  ChevronRight,
  MessageSquare,
  Pencil,
  Phone,
  Settings,
  User,
  X,
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
import { getFullSizeAvatarUrl } from '@/lib/utils/image';
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
  const [allHostedSessionsCount, setAllHostedSessionsCount] = useState(0);
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
        setClubs(
          Array.from(new Map(clubsResponse.map((c) => [c.id, c])).values())
        );
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
          allCountResponse,
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
        setAllHostedSessionsCount(allCountResponse.total);
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
  const [isAvatarPreviewOpen, setIsAvatarPreviewOpen] = useState(false);

  const joinedAt = profile?.createdAt;
  const phone = profile?.phone;
  const genderLabel = useMemo(() => {
    if (!profile?.gender) {
      return '';
    }

    if (profile.gender === 'MALE') {
      return tCommon('male');
    }

    if (profile.gender === 'FEMALE') {
      return tCommon('female');
    }

    if (profile.gender === 'OTHER') {
      return tCommon('other');
    }

    if (profile.gender === 'PREFER_NOT_TO_SAY') {
      return tCommon('preferNotToSay');
    }

    return profile.gender;
  }, [profile?.gender, tCommon]);

  if (isLoading) {
    return <PublicUserProfileSkeleton />;
  }

  if (error || !profile) {
    return (
      <PageLayout
        title={t('title')}
        showBackButton={true}
        bg="gray.50"
        _dark={{ bg: 'gray.900' }}
      >
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
      <PageLayout title={t('title')} bg="gray.50" _dark={{ bg: 'gray.900' }}>
        <VStack gap={6} align="stretch" pb={6}>
          <Box
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="2xl"
            bg="white"
            overflow="hidden"
            _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
          >
            <Box
              bg="linear-gradient(135deg, #FFD75F 0%, #FFC107 100%)"
              position="relative"
            >
              <Image
                src="/icons/app-logo-black.png"
                alt="Vmito"
                position="absolute"
                right={4}
                bottom={4}
                h="24px"
                opacity={0.25}
              />

              {isOwner && (
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(true)}
                  position="absolute"
                  right={4}
                  top={4}
                  zIndex={1}
                  borderRadius="full"
                  px={3}
                  fontWeight="bold"
                  bg="white"
                  color="gray.800"
                  borderColor="gray.300"
                  _dark={{
                    bg: 'gray.700',
                    color: 'gray.100',
                    borderColor: 'gray.500',
                  }}
                  shadow="sm"
                  _hover={{
                    shadow: 'md',
                    bg: 'gray.50',
                    transform: 'translateY(-1px)',
                  }}
                  transition="all 0.2s"
                >
                  <Pencil size={12} />
                  {tCommon('edit')}
                </Button>
              )}

              <HStack align="end" gap={3} px={5} pt={12} pb={3}>
                <Avatar.Root
                  size="2xl"
                  borderRadius="full"
                  borderWidth="4px"
                  borderColor="white"
                  mb="-32px"
                  cursor={avatarUrl ? 'pointer' : 'default'}
                  onClick={() => {
                    if (avatarUrl) setIsAvatarPreviewOpen(true);
                  }}
                  _hover={avatarUrl ? { opacity: 0.9 } : undefined}
                  transition="opacity 0.2s"
                >
                  <Avatar.Fallback name={displayName}>
                    <User size={24} />
                  </Avatar.Fallback>
                  {avatarUrl && <Avatar.Image src={avatarUrl} />}
                </Avatar.Root>

                <VStack align="start" gap={0} flex={1} pb={0}>
                  <Text
                    fontSize="lg"
                    fontWeight="bold"
                    color="gray.800"
                    _dark={{ color: 'gray.100' }}
                    lineClamp={1}
                  >
                    {displayName}
                  </Text>
                </VStack>
              </HStack>
            </Box>

            <Box px={5} pb={5} pt={2}>
              <VStack align="start" gap={2} pl="88px">
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
                  <Box
                    borderRadius="lg"
                    bg="gray.50"
                    _dark={{ bg: 'gray.700' }}
                    px={3}
                    py={2}
                  >
                    <Text
                      fontSize="xs"
                      color="gray.500"
                      _dark={{ color: 'gray.400' }}
                    >
                      {t('hostedSessions')}
                    </Text>
                    <Text
                      fontSize="md"
                      fontWeight="semibold"
                      color="gray.800"
                      _dark={{ color: 'gray.100' }}
                    >
                      {allHostedSessionsCount}
                    </Text>
                  </Box>

                  <Box
                    borderRadius="lg"
                    bg="gray.50"
                    _dark={{ bg: 'gray.700' }}
                    px={3}
                    py={2}
                  >
                    <Text
                      fontSize="xs"
                      color="gray.500"
                      _dark={{ color: 'gray.400' }}
                    >
                      {t('reviews')}
                    </Text>
                    <Text
                      fontSize="md"
                      fontWeight="semibold"
                      color="gray.800"
                      _dark={{ color: 'gray.100' }}
                    >
                      {ratingStats?.totalRatings ?? 0}
                    </Text>
                  </Box>
                </SimpleGrid>

                {phone && (
                  <HStack
                    gap={2}
                    color="gray.600"
                    _dark={{ color: 'gray.300' }}
                    pt={1}
                  >
                    <Phone size={16} />
                    <Text fontSize="sm">{phone}</Text>
                  </HStack>
                )}

                {genderLabel && (
                  <HStack
                    gap={2}
                    color="gray.600"
                    _dark={{ color: 'gray.300' }}
                  >
                    <User size={16} />
                    <Text fontSize="sm">
                      {tCommon('gender')}: {genderLabel}
                    </Text>
                  </HStack>
                )}

                {joinedAt && (
                  <HStack
                    gap={2}
                    color="gray.600"
                    _dark={{ color: 'gray.300' }}
                  >
                    <CalendarDays size={16} />
                    <Text fontSize="sm">
                      {t('joinedDateLabel', {
                        date: formatDate(joinedAt, locale),
                      })}
                    </Text>
                  </HStack>
                )}
              </VStack>
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

            // Own profile always shows the section so users can navigate to
            // club management even before creating or joining a club.
            const shouldShowSection = isOwnProfile
              ? true
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
                _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
              >
                <HStack justify="space-between" align="center" mb={3}>
                  <Text
                    fontSize="lg"
                    fontWeight="bold"
                    color="gray.800"
                    _dark={{ color: 'gray.100' }}
                  >
                    {t('clubs')}
                  </Text>

                  {isOwnProfile && (
                    <Link href={`/${locale}/my-clubs`}>
                      <Button
                        size="xs"
                        variant="outline"
                        borderRadius="full"
                        bg="green.50"
                        color="green.700"
                        borderColor="green.200"
                        _hover={{
                          bg: 'green.100',
                          borderColor: 'green.300',
                        }}
                      >
                        <Settings size={14} />
                        {tClubs('manageClubs')}
                      </Button>
                    </Link>
                  )}
                </HStack>

                <VStack gap={4} align="stretch">
                  {(isOwnProfile || hostedClubs.length > 0) && (
                    <Box>
                      <Text
                        fontSize="sm"
                        fontWeight="semibold"
                        color="gray.600"
                        _dark={{ color: 'gray.300' }}
                        mb={2}
                      >
                        {t('hostedClubs')} ({hostedClubs.length})
                      </Text>
                      {hostedClubs.length === 0 ? (
                        <Box
                          borderWidth="1px"
                          borderStyle="dashed"
                          borderColor="gray.300"
                          borderRadius="lg"
                          bg="gray.50"
                          p={3}
                          _dark={{ bg: 'gray.700', borderColor: 'gray.600' }}
                        >
                          <Text
                            fontSize="sm"
                            color="gray.500"
                            _dark={{ color: 'gray.400' }}
                          >
                            {t('noHostedClubs')}
                          </Text>
                        </Box>
                      ) : (
                        <VStack gap={2} align="stretch">
                          {hostedClubs.map((club, idx) => (
                            <Link
                              key={`hosted-${club.id}-${idx}`}
                              href={`/${locale}/clubs/${club.id}`}
                            >
                              <Box
                                borderWidth="1px"
                                borderColor="gray.200"
                                borderRadius="lg"
                                p={3}
                                bg="gray.50"
                                _dark={{
                                  bg: 'gray.700',
                                  borderColor: 'gray.600',
                                }}
                                _hover={{
                                  bg: 'gray.100',
                                  borderColor: 'green.300',
                                  _dark: {
                                    bg: 'gray.600',
                                    borderColor: 'green.500',
                                  },
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
                                    <Text
                                      fontWeight="semibold"
                                      color="gray.800"
                                      _dark={{ color: 'gray.100' }}
                                    >
                                      {club.name}
                                    </Text>
                                    {club.memberCount > 0 && (
                                      <Text
                                        fontSize="xs"
                                        color="gray.500"
                                        _dark={{ color: 'gray.400' }}
                                      >
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
                      )}
                    </Box>
                  )}

                  {isOwnProfile && (
                    <Box>
                      <Text
                        fontSize="sm"
                        fontWeight="semibold"
                        color="gray.600"
                        _dark={{ color: 'gray.300' }}
                        mb={2}
                      >
                        {t('memberClubs')} ({memberClubs.length})
                      </Text>
                      {memberClubs.length === 0 ? (
                        <Box
                          borderWidth="1px"
                          borderStyle="dashed"
                          borderColor="gray.300"
                          borderRadius="lg"
                          bg="gray.50"
                          p={3}
                          _dark={{ bg: 'gray.700', borderColor: 'gray.600' }}
                        >
                          <Text
                            fontSize="sm"
                            color="gray.500"
                            _dark={{ color: 'gray.400' }}
                          >
                            {t('noMemberClubs')}
                          </Text>
                        </Box>
                      ) : (
                        <VStack gap={2} align="stretch">
                          {memberClubs.map((club, idx) => (
                            <Link
                              key={`member-${club.id}-${idx}`}
                              href={`/${locale}/clubs/${club.id}`}
                            >
                              <Box
                                borderWidth="1px"
                                borderColor="gray.200"
                                borderRadius="lg"
                                p={3}
                                bg="gray.50"
                                _dark={{
                                  bg: 'gray.700',
                                  borderColor: 'gray.600',
                                }}
                                _hover={{
                                  bg: 'gray.100',
                                  borderColor: 'green.300',
                                  _dark: {
                                    bg: 'gray.600',
                                    borderColor: 'green.500',
                                  },
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
                                    <Text
                                      fontWeight="semibold"
                                      color="gray.800"
                                      _dark={{ color: 'gray.100' }}
                                    >
                                      {club.name}
                                    </Text>
                                    {club.memberCount > 0 && (
                                      <Text
                                        fontSize="xs"
                                        color="gray.500"
                                        _dark={{ color: 'gray.400' }}
                                      >
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
                      )}
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
            _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
          >
            <Flex justify="space-between" align="center" mb={3}>
              <Text
                fontSize="lg"
                fontWeight="bold"
                color="gray.800"
                _dark={{ color: 'gray.100' }}
              >
                {t('hostedSessions')} ({allHostedSessionsCount})
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
                _dark={{ bg: 'gray.700', borderColor: 'gray.600' }}
              >
                <Icon as={MessageSquare} boxSize={6} color="gray.300" mb={2} />
                <Text color="gray.500" _dark={{ color: 'gray.400' }}>
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

                <Text
                  fontSize="sm"
                  color="gray.600"
                  _dark={{ color: 'gray.400' }}
                >
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
            _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
          >
            <Flex justify="space-between" align="center" mb={3}>
              <Text
                fontSize="lg"
                fontWeight="bold"
                color="gray.800"
                _dark={{ color: 'gray.100' }}
              >
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

      {/* Avatar full-size preview */}
      {isAvatarPreviewOpen && avatarUrl && (
        <Portal>
          <Flex
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="blackAlpha.800"
            zIndex={2000}
            align="center"
            justify="center"
            p={4}
            onClick={() => setIsAvatarPreviewOpen(false)}
            animation="fadeIn 0.15s ease-out"
            css={{
              '@keyframes fadeIn': {
                from: { opacity: 0 },
                to: { opacity: 1 },
              },
            }}
          >
            <Box
              position="relative"
              display="inline-flex"
              alignItems="center"
              justifyContent="center"
            >
              <Box
                as="button"
                {...({ type: 'button' } as Record<string, unknown>)}
                position="absolute"
                top="-12px"
                right="-12px"
                w={12}
                h={12}
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
                borderRadius="full"
                bg="blackAlpha.800"
                color="white"
                borderWidth="2px"
                borderColor="whiteAlpha.800"
                boxShadow="0 8px 24px rgba(0,0,0,.24)"
                _hover={{ bg: 'blackAlpha.900' }}
                _active={{ bg: 'blackAlpha.950' }}
                transition="background 0.2s"
                aria-label="Close image preview"
                zIndex={1}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  setIsAvatarPreviewOpen(false);
                }}
              >
                <Icon as={X} boxSize={5} />
              </Box>
              <Image
                src={getFullSizeAvatarUrl(avatarUrl)}
                alt={displayName}
                w={{ base: '92vw', md: '560px' }}
                maxW="92vw"
                maxH="90vh"
                borderRadius="16px"
                objectFit="contain"
                boxShadow="0 4px 16px rgba(0,0,0,.08)"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              />
            </Box>
          </Flex>
        </Portal>
      )}
    </>
  );
}
