'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react';
import { MessageSquare } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/config';
import { useSearchParams } from 'next/navigation';
import PageLayout from '@/components/layout/PageLayout';
import UserProfileModal from '@/components/ui/UserProfileModal';
import UserProfileHeader from '@/components/player/UserProfileHeader';
import UserClubsSection from '@/components/player/UserClubsSection';
import UserPostsSection from '@/components/player/UserPostsSection';
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
import PublicHostedSessionCard from '@/components/player/PublicHostedSessionCard';
import PublicUserProfileSkeleton from '@/components/player/PublicUserProfileSkeleton';
import PublicUserFavoritesSection from '@/components/player/PublicUserFavoritesSection';
import UserAchievementsSection from '@/components/player/UserAchievementsSection';
import { UnderlineTabs } from '@/components/ui/UnderlineTabs';
import { TOP_BAR_HEIGHT_DESKTOP, TOP_BAR_HEIGHT_MOBILE } from '@/constants';

interface IPublicUserProfileContentProps {
  userId: string;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 6;
const REVIEWS_PREVIEW_SIZE = 3;
type THostedTab = 'active' | 'ended' | 'all';
type ProfileSection =
  | 'posts'
  | 'achievements'
  | 'hosted'
  | 'clubs'
  | 'reviews'
  | 'favorites';

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

export default function PublicUserProfileContent({
  userId,
}: IPublicUserProfileContentProps) {
  const t = useTranslations('userProfilePage');
  const tCommon = useTranslations('common');
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

  const isOwner = currentUser?.id === userId;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<ProfileSection>('posts');

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

  const handleProfileImageUpdated = (patch: {
    image?: string;
    coverPhoto?: string;
  }) => {
    setProfile((prev) => (prev ? { ...prev, ...patch } : prev));
  };

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

  const sectionTabs: { key: ProfileSection; label: string }[] = [
    { key: 'posts', label: t('postsTab') },
    { key: 'achievements', label: t('achievementsTab') },
    { key: 'hosted', label: t('hostedTab') },
    { key: 'clubs', label: t('clubsTab') },
    { key: 'reviews', label: t('reviewsTab') },
    ...(isOwner
      ? [{ key: 'favorites' as ProfileSection, label: t('favoritesTab') }]
      : []),
  ];

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
          <UserProfileHeader
            profile={profile}
            ratingStats={ratingStats}
            allHostedSessionsCount={allHostedSessionsCount}
            isOwner={isOwner}
            userId={userId}
            onEdit={() => setIsEditModalOpen(true)}
            onProfileImageUpdated={handleProfileImageUpdated}
          />

          {/* Section tabs: sticky under the fixed top bar */}
          <UnderlineTabs
            items={sectionTabs.map((tab) => ({
              id: tab.key,
              label: tab.label,
            }))}
            activeId={activeSection}
            onTabClick={(id) => setActiveSection(id as ProfileSection)}
            isSticky
            top={{
              base: `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top))`,
              md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top))`,
            }}
            px={3}
            boxShadow="0 2px 6px -2px rgba(0,0,0,0.08)"
          />

          {/* Posts */}
          {activeSection === 'posts' && <UserPostsSection userId={userId} />}

          {/* Achievements */}
          {activeSection === 'achievements' && (
            <Box px={3} pt={4}>
              <UserAchievementsSection userId={userId} />
            </Box>
          )}

          {/* Hosted sessions */}
          {activeSection === 'hosted' && (
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
                  <Icon
                    as={MessageSquare}
                    boxSize={6}
                    color="gray.300"
                    mb={2}
                  />
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
                    <PublicHostedSessionCard
                      key={session.id}
                      session={session}
                    />
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
          )}

          {/* Clubs */}
          {activeSection === 'clubs' && (
            <UserClubsSection clubs={clubs} userId={userId} />
          )}

          {/* Reviews */}
          {activeSection === 'reviews' && (
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
          )}

          {/* Favorites (owner only) */}
          {activeSection === 'favorites' && isOwner && (
            <PublicUserFavoritesSection />
          )}
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
