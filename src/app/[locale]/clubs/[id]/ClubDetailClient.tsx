'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  HStack,
  Image,
  Grid,
  Tabs,
} from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import { UserRole } from '@/lib/api/types';
import { useParams, useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/config';
import { ClubsService } from '@/lib/api/clubs.service';
import { IClub, EMemberRole, EJoinRequestStatus } from '@/types/club';
import { toaster } from '@/components/ui/toaster';
import { useAuthStore } from '@/stores/useAuthStore';
import PageLayout from '@/components/layout/PageLayout';
import DetailPageSkeleton from '@/components/layout/DetailPageSkeleton';
import { DEFAULT_COVER_PHOTO, DETAIL_PAGE_MAX_W, ROUTES } from '@/constants';
import {
  DEFAULT_CLUB_TAB,
  isClubDetailTab,
  TClubDetailTab,
} from './club-detail.types';
import dynamic from 'next/dynamic';
import { ClubDetailHero } from './components/ClubDetailHero';
import { ClubDetailTabList } from './components/ClubDetailTabList';
import { ClubAboutTab } from './components/ClubAboutTab';
import { ClubScheduleTab } from './components/ClubScheduleTab';
import { ClubAnnouncementsTab } from './components/ClubAnnouncementsTab';
import { ClubPhotosTab } from './components/ClubPhotosTab';
import { ClubMembersTab } from './components/ClubMembersTab';
import { ClubDetailSidebar } from './components/ClubDetailSidebar';
import PendingJoinRequestModal from './components/PendingJoinRequestModal';
import { IClubJoinRequest } from '@/types/club';

const LoginPromptModal = dynamic(
  () => import('@/components/auth/LoginPromptModal'),
  { ssr: false }
);

interface ClubDetailClientProps {
  initialClub: IClub | null;
}

export default function ClubDetailClient({
  initialClub,
}: ClubDetailClientProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const clubId = params.id as string;
  const { user: currentUser } = useAuthStore();

  const [club, setClub] = useState<IClub | null>(initialClub);
  const [isLoading, setIsLoading] = useState(!initialClub);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [userJoinRequest, setUserJoinRequest] =
    useState<IClubJoinRequest | null>(null);
  const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<TClubDetailTab>(
    isClubDetailTab(tabParam) ? tabParam : DEFAULT_CLUB_TAB
  );

  const handleTabChange = useCallback(
    (tab: string) => {
      const nextTab = isClubDetailTab(tab) ? tab : DEFAULT_CLUB_TAB;
      setActiveTab(nextTab);

      const query = new URLSearchParams(searchParams.toString());
      if (nextTab === DEFAULT_CLUB_TAB) {
        query.delete('tab');
      } else {
        query.set('tab', nextTab);
      }
      const queryString = query.toString();
      router.replace(`${pathname}${queryString ? `?${queryString}` : ''}`, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );
  const [isJoining, setIsJoining] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [optimisticallyJoinedClubId, setOptimisticallyJoinedClubId] = useState<
    string | null
  >(null);

  const loadClubDetails = useCallback(
    async (silent?: boolean) => {
      try {
        if (!silent) setIsLoading(true);
        const [data, myRequests] = await Promise.all([
          ClubsService.getClubDetails(clubId),
          ClubsService.getMyJoinRequests().catch(() => []),
        ]);
        setClub(data);
        const req = myRequests.find((r) => r.clubId === clubId);
        setUserJoinRequest(req || null);
        const pending = req?.status === EJoinRequestStatus.PENDING;
        setHasPendingRequest(pending);
      } catch (error) {
        console.error('Failed to load club details:', error);
        toaster.error({ title: t('common.error') });
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [clubId, t]
  );

  useEffect(() => {
    if (initialClub) return;

    if (clubId) {
      loadClubDetails();
    }
  }, [clubId, loadClubDetails, initialClub]);

  const isUserMember =
    optimisticallyJoinedClubId === club?.id ||
    club?.members?.some((m) => m.user.id === currentUser?.id);

  const isUserAdmin =
    !!currentUser &&
    (currentUser.role === UserRole.ADMIN ||
      (club?.hostId && String(club.hostId) === String(currentUser.id)) ||
      (club?.host?.id && String(club.host.id) === String(currentUser.id)) ||
      club?.members?.some(
        (m) =>
          (String(m.userId) === String(currentUser.id) ||
            String(m?.user?.id) === String(currentUser.id)) &&
          m.role === EMemberRole.ADMIN
      ));

  const handleJoinClub = async () => {
    if (!currentUser) {
      setIsLoginModalOpen(true);
      return;
    }
    if (!club) return;

    try {
      setIsJoining(true);
      const result = await ClubsService.requestToJoin(club.id);
      toaster.success({
        title:
          result.status === 'joined'
            ? t('clubs.joinedSuccessfully')
            : t('clubs.joinRequestSent'),
      });
      await loadClubDetails(true);
      if (result.status === 'pending') {
        setHasPendingRequest(true);
      } else {
        setOptimisticallyJoinedClubId(club.id);
      }
    } catch (error) {
      console.error('Failed to join club:', error);
      toaster.error({ title: t('common.error') });
    } finally {
      setIsJoining(false);
    }
  };

  const handleCancelJoinRequest = async () => {
    if (!club) return;
    try {
      setIsCancelling(true);
      await ClubsService.cancelJoinRequest(club.id);
      toaster.success({
        title: 'Đã thu hồi yêu cầu tham gia',
      });
      setUserJoinRequest(null);
      setHasPendingRequest(false);
      setIsPendingModalOpen(false);
      await loadClubDetails(true);
    } catch (error) {
      console.error('Failed to cancel join request:', error);
      toaster.error({ title: t('common.error') });
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return <DetailPageSkeleton title={t('clubs.clubDetails')} />;
  }

  if (!club) {
    return (
      <PageLayout title={t('common.error')} maxW={DETAIL_PAGE_MAX_W}>
        <Container maxW="container.md" py={16} textAlign="center">
          <Heading mb={4}>{t('common.error')}</Heading>
          <Button
            colorPalette="green"
            onClick={() => router.push(ROUTES.CLUBS.BROWSE)}
          >
            {t('common.back')}
          </Button>
        </Container>
      </PageLayout>
    );
  }

  const clubDisplayImage = club.image || DEFAULT_COVER_PHOTO;
  const hasClubImages = (club.images?.length ?? 0) > 0;

  return (
    <PageLayout
      title={
        <HStack gap={2} align="center" minW={0} flex="1">
          {/* Only shown once the club has a dedicated logo — falling back to
              a cropped cover/group photo at 32px reads as an unrecognizable
              smudge, not a brand mark. */}
          {club.logo && (
            <Box
              w="32px"
              h="32px"
              display={{ base: 'flex', md: 'none' }}
              borderRadius="md"
              overflow="hidden"
              bg="gray.100"
              flexShrink={0}
              alignItems="center"
              justifyContent="center"
            >
              <Image
                src={club.logo}
                alt={club.name}
                objectFit="cover"
                w="full"
                h="full"
              />
            </Box>
          )}
          <Text truncate fontWeight="bold" flex="1" minW={0}>
            {club.name}
          </Text>
        </HStack>
      }
      maxW={DETAIL_PAGE_MAX_W}
    >
      <ClubDetailHero club={club} clubDisplayImage={clubDisplayImage} />

      {/* Navigation Tabs & Content */}
      <Container maxW={DETAIL_PAGE_MAX_W} pb={8} px={0}>
        <Tabs.Root
          value={activeTab}
          onValueChange={(e) => handleTabChange(e.value)}
          variant="plain"
        >
          <ClubDetailTabList
            announcementCount={club.announcements?.length ?? 0}
            hasImages={hasClubImages}
          />

          {/* Grid Layout 7:3 */}
          <Grid
            templateColumns={{ base: '1fr', lg: '2.3fr 1fr' }}
            gap={6}
            mt={0}
          >
            {/* Main Content - Left Column */}
            <Box>
              <ClubAboutTab description={club.description} />

              <ClubMembersTab
                club={club}
                isUserAdmin={Boolean(isUserAdmin)}
                onClubChanged={loadClubDetails}
              />

              <ClubScheduleTab schedules={club.schedules} />

              <ClubAnnouncementsTab
                clubId={club.id}
                isUserAdmin={Boolean(isUserAdmin)}
              />
              {hasClubImages && (
                <ClubPhotosTab clubName={club.name} images={club.images} />
              )}
            </Box>

            <ClubDetailSidebar
              club={club}
              isUserAdmin={Boolean(isUserAdmin)}
              isUserMember={Boolean(isUserMember)}
              hasPendingRequest={hasPendingRequest}
              isJoining={isJoining}
              userJoinRequest={userJoinRequest}
              onJoin={handleJoinClub}
              onOpenPendingModal={() => setIsPendingModalOpen(true)}
              onTabChange={handleTabChange}
            />
          </Grid>
        </Tabs.Root>
      </Container>
      {isLoginModalOpen && (
        <LoginPromptModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          featureName={t('clubs.joinNow')}
          returnUrl={pathname}
        />
      )}
      {isPendingModalOpen && (
        <PendingJoinRequestModal
          isOpen={isPendingModalOpen}
          onClose={() => setIsPendingModalOpen(false)}
          onCancelRequest={handleCancelJoinRequest}
          isCancelling={isCancelling}
          request={userJoinRequest}
          clubName={club.name}
        />
      )}
    </PageLayout>
  );
}
