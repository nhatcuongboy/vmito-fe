'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box, Container, Heading, Grid, Tabs } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import { UserRole } from '@/lib/api/types';
import { useParams, useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/config';
import { ClubsService } from '@/lib/api/clubs.service';
import {
  IClub,
  EClubJoinPolicy,
  EMemberRole,
  EJoinRequestStatus,
} from '@/types/club';
import { toaster } from '@/components/ui/toaster';
import { useAuthStore } from '@/stores/useAuthStore';
import PageLayout from '@/components/layout/PageLayout';
import DetailPageSkeleton from '@/components/layout/DetailPageSkeleton';
import AppDetailStickyHeader from '@/components/common/AppDetailStickyHeader';
import AppConfirmDialog from '@/components/ui/AppConfirmDialog';
import { DEFAULT_COVER_PHOTO, DETAIL_PAGE_MAX_W, ROUTES } from '@/constants';
import {
  DEFAULT_CLUB_TAB,
  isClubDetailTab,
  TClubDetailTab,
} from './club-detail.types';
import dynamic from 'next/dynamic';
import { ClubDetailHero } from './components/ClubDetailHero';
import {
  ClubDetailIdentity,
  ClubMembershipBottomBar,
} from './components/ClubDetailIdentity';
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
  const { user: currentUser, isHydrated: isAuthHydrated } = useAuthStore();

  const [club, setClub] = useState<IClub | null>(initialClub);
  const [isLoading, setIsLoading] = useState(!initialClub);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [userJoinRequest, setUserJoinRequest] =
    useState<IClubJoinRequest | null>(null);
  const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);
  const [isMembershipStatusLoading, setIsMembershipStatusLoading] = useState(
    !isAuthHydrated || Boolean(currentUser)
  );

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

  // Server already provided club data (initialClub), so skip re-fetching it —
  // but the join-request status is user-specific and was never fetched
  // server-side, so it still needs its own request on mount.
  const refreshJoinRequestStatus = useCallback(async () => {
    if (!isAuthHydrated) {
      setIsMembershipStatusLoading(true);
      return;
    }

    if (!currentUser) {
      setIsMembershipStatusLoading(false);
      return;
    }

    setIsMembershipStatusLoading(true);
    try {
      const myRequests = await ClubsService.getMyJoinRequests();
      const req = myRequests.find((r) => r.clubId === clubId);
      setUserJoinRequest(req || null);
      setHasPendingRequest(req?.status === EJoinRequestStatus.PENDING);
    } catch (error) {
      console.error('Failed to load join request status:', error);
    } finally {
      setIsMembershipStatusLoading(false);
    }
  }, [clubId, currentUser, isAuthHydrated]);

  useEffect(() => {
    if (initialClub) {
      refreshJoinRequestStatus();
      return;
    }

    if (clubId) {
      loadClubDetails();
    }
  }, [clubId, loadClubDetails, initialClub, refreshJoinRequestStatus]);

  // When server-side loading did not provide a club, the client fetch above
  // also runs before persisted auth is guaranteed to be ready. Re-check the
  // user-specific request state after hydration so the action bar is never
  // left in its loading state or shown with an incorrect action.
  useEffect(() => {
    if (!initialClub) refreshJoinRequestStatus();
  }, [initialClub, refreshJoinRequestStatus]);

  const isUserMember = Boolean(
    currentUser &&
      (optimisticallyJoinedClubId === club?.id ||
        club?.members?.some(
          (m) =>
            String(m.userId) === String(currentUser.id) ||
            String(m.user.id) === String(currentUser.id)
        ))
  );

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

  const isClubOwner = Boolean(
    currentUser &&
      ((club?.hostId && String(club.hostId) === String(currentUser.id)) ||
        (club?.host?.id && String(club.host.id) === String(currentUser.id)))
  );

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

  const handleLeaveClub = async () => {
    if (!club) return;

    try {
      setIsLeaving(true);
      await ClubsService.leaveClub(club.id);
      toaster.success({ title: t('clubs.leftSuccessfully') });
      setOptimisticallyJoinedClubId(null);
      await loadClubDetails(true);
      setIsLeaveConfirmOpen(false);
    } catch (error) {
      console.error('Failed to leave club:', error);
      toaster.error({ title: t('common.error') });
    } finally {
      setIsLeaving(false);
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
  const isRejected = userJoinRequest?.status === EJoinRequestStatus.REJECTED;
  const isInvitationOnly = club.joinPolicy === EClubJoinPolicy.INVITATION_ONLY;
  const canLeaveClub = isUserMember && !isClubOwner;

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(ROUTES.CLUBS.BROWSE);
  };

  const handleShare = async () => {
    const shareUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}${window.location.pathname}`
        : '';

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: club.name,
          text: t('clubs.shareText', { name: club.name }),
          url: shareUrl,
        });
        return;
      }

      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        toaster.success({ title: t('clubs.linkCopied') });
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      console.error('Failed to share club:', error);
      toaster.error({ title: t('clubs.shareFailed') });
    }
  };

  return (
    <PageLayout title={club.name} maxW={DETAIL_PAGE_MAX_W} hideTopBarOnMobile>
      <ClubDetailHero
        club={club}
        clubDisplayImage={clubDisplayImage}
        onBack={handleBack}
        onShare={handleShare}
        canLeaveClub={canLeaveClub}
        isLeaving={isLeaving}
        onLeave={() => setIsLeaveConfirmOpen(true)}
      />

      <AppDetailStickyHeader
        title={club.name}
        onBack={handleBack}
        onShare={handleShare}
        shareLabel={t('clubs.share')}
        showBrand
      />

      <Container maxW={DETAIL_PAGE_MAX_W} px={0}>
        <ClubDetailIdentity
          club={club}
          isClubOwner={isClubOwner}
          onEdit={() => router.push(ROUTES.HOST.CLUBS.EDIT(club.id))}
          onFees={() => router.push(ROUTES.HOST.CLUBS.FEES(club.id))}
          isUserAdmin={Boolean(isUserAdmin)}
          isUserMember={isUserMember}
          isMembershipStatusLoading={isMembershipStatusLoading}
          hasPendingRequest={hasPendingRequest}
          isRejected={isRejected}
          isInvitationOnly={isInvitationOnly}
          isJoining={isJoining}
          onJoin={handleJoinClub}
          onOpenPending={() => setIsPendingModalOpen(true)}
        />
      </Container>

      {/* Navigation Tabs & Content */}
      <Container
        maxW={DETAIL_PAGE_MAX_W}
        pb={{ base: 'calc(96px + env(safe-area-inset-bottom))', md: 8 }}
        px={0}
      >
        <Tabs.Root
          value={activeTab}
          onValueChange={(e) => handleTabChange(e.value)}
          variant="plain"
        >
          <ClubDetailTabList
            announcementCount={club.announcements?.length ?? 0}
            hasImages={hasClubImages}
          />

          {/* Keep the sidebar column only for the About tab. */}
          <Grid
            templateColumns={{
              base: '1fr',
              lg: activeTab === 'about' ? '2.3fr 1fr' : '1fr',
            }}
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

            {activeTab === 'about' && <ClubDetailSidebar club={club} />}
          </Grid>
        </Tabs.Root>
      </Container>
      <ClubMembershipBottomBar
        isClubOwner={isClubOwner}
        onEdit={() => router.push(ROUTES.HOST.CLUBS.EDIT(club.id))}
        onFees={() => router.push(ROUTES.HOST.CLUBS.FEES(club.id))}
        isUserAdmin={Boolean(isUserAdmin)}
        isUserMember={isUserMember}
        isMembershipStatusLoading={isMembershipStatusLoading}
        hasPendingRequest={hasPendingRequest}
        isRejected={isRejected}
        isInvitationOnly={isInvitationOnly}
        isJoining={isJoining}
        onJoin={handleJoinClub}
        onOpenPending={() => setIsPendingModalOpen(true)}
      />
      {isLoginModalOpen && (
        <LoginPromptModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          featureName={t('clubs.joinClub')}
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
      <AppConfirmDialog
        isOpen={isLeaveConfirmOpen}
        title={t('clubs.leaveClubConfirmTitle')}
        body={t('clubs.leaveClubConfirmDescription', { name: club.name })}
        confirmLabel={t('clubs.leaveClub')}
        cancelLabel={t('common.cancel')}
        isLoading={isLeaving}
        onConfirm={handleLeaveClub}
        onClose={() => setIsLeaveConfirmOpen(false)}
      />
    </PageLayout>
  );
}
