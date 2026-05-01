'use client';

import { ISession, UserRole } from '@/lib/api/types';
import { Box, Flex, Grid, Icon, Portal, Spinner } from '@chakra-ui/react';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { TOP_BAR_HEIGHT_DESKTOP } from '@/constants';
import { useAuthStore } from '@/stores/useAuthStore';
import LoginPromptModal from '@/components/auth/LoginPromptModal';
import { VModal, useModal } from '@/components/ui/VModal';
import { useEffect, useState, useCallback } from 'react';
import { SessionService } from '@/lib/api/session.service';
import { PlayerService } from '@/lib/api/player.service';
import { useRouter, usePathname } from '@/i18n/config';
import { useSearchParams } from 'next/navigation';
import AppHostDetail from '@/components/session/AppHostDetail';
import JoinSessionModal from '@/components/session/JoinSessionModal';
import MyRegistrationModal from '@/components/session/MyRegistrationModal';
import { NextLinkButton } from '@/components/ui/NextLinkButton';
import SessionShareCard from '@/components/session/SessionShareCard';
import { RatingStatsProvider } from '@/contexts/RatingStatsContext';
import SessionDetailHero from './SessionDetailHero';
import SessionDetailBody from './SessionDetailBody';
import SessionDetailStickyBar from './SessionDetailStickyBar';
import SessionRecommendations from './SessionRecommendations';

interface PublicSessionDetailContentProps {
  sessionId: string;
  initialSession?: ISession | null;
  showViewMore?: boolean;
  defaultOpenRegister?: boolean;
  onBack?: () => void;
  showBackButton?: boolean;
}

export const PublicSessionDetailContent = ({
  sessionId,
  initialSession,
  showViewMore = false,
  defaultOpenRegister = false,
  onBack,
  showBackButton = false,
}: PublicSessionDetailContentProps) => {
  const t = useTranslations('session');
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [session, setSession] = useState<ISession | null>(
    initialSession || null
  );
  const [loading, setLoading] = useState(!initialSession);
  const [error, setError] = useState<string | null>(null);
  const [userRegistrationStatus, setUserRegistrationStatus] = useState<
    'PENDING' | 'APPROVED' | 'REJECTED' | null
  >(null);
  const [isRegistrationLoading, setIsRegistrationLoading] = useState(!!user);

  const {
    isOpen: isLoginModalOpen,
    onOpen: onOpenLoginModal,
    onClose: onCloseLoginModal,
  } = useModal();

  const {
    isOpen: isJoinModalOpen,
    onOpen: onOpenJoinModal,
    onClose: onCloseJoinModal,
  } = useModal();

  const {
    isOpen: isViewRegistrationModalOpen,
    onOpen: onOpenViewRegistrationModal,
    onClose: onCloseViewRegistrationModal,
  } = useModal();

  const {
    isOpen: isHostDetailModalOpen,
    onOpen: onOpenHostDetailModal,
    onClose: onCloseHostDetailModal,
  } = useModal();

  useEffect(() => {
    if (initialSession && initialSession.id === sessionId) {
      setSession(initialSession);
      setLoading(false);
      return;
    }

    const fetchSession = async () => {
      try {
        setLoading(true);
        if (!sessionId) {
          setError('Session ID not found');
          return;
        }

        const sessionData = await SessionService.getSession(sessionId);
        setSession(sessionData);
      } catch (err) {
        console.error('Error fetching session:', err);
        setError('Session not found');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId, initialSession]);

  useEffect(() => {
    if (defaultOpenRegister && user && session && !loading) {
      onOpenJoinModal();

      // Clear search params
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete('register');
      const search = newSearchParams.toString();
      router.replace(`${pathname}${search ? `?${search}` : ''}`, {
        scroll: false,
      });
    }
  }, [
    defaultOpenRegister,
    user,
    session,
    loading,
    onOpenJoinModal,
    router,
    pathname,
    searchParams,
  ]);

  const fetchRegistrationStatus = useCallback(async () => {
    if (!user || !session) {
      setIsRegistrationLoading(false);
      return;
    }
    try {
      setIsRegistrationLoading(true);
      const myPlayers = await PlayerService.getMyPlayersForSession(session.id);
      if (myPlayers && myPlayers.length > 0) {
        const status = myPlayers[0].registrationStatus;
        if (
          status === 'PENDING' ||
          status === 'APPROVED' ||
          status === 'REJECTED'
        ) {
          setUserRegistrationStatus(status);
        } else {
          setUserRegistrationStatus(null);
        }
      } else {
        setUserRegistrationStatus(null);
      }
    } catch (err) {
      console.error('Error fetching registration status:', err);
    } finally {
      setIsRegistrationLoading(false);
    }
  }, [user, session]);

  useEffect(() => {
    fetchRegistrationStatus();
  }, [fetchRegistrationStatus]);

  const isOwner = session?.hostId === user?.id;
  const isAdmin = user?.role === UserRole.ADMIN;
  const canManage = isOwner || isAdmin;
  const maxPlayers = session?.numberOfCourts
    ? session.numberOfCourts * (session?.maxPlayersPerCourt || 4)
    : 0;
  const approvedPlayersCount = session?._count?.players || 0;
  const isFull = approvedPlayersCount >= maxPlayers;

  const refreshData = useCallback(async () => {
    if (!session?.id) return;
    try {
      const sessionData = await SessionService.getSession(session.id);
      setSession(sessionData);
      await fetchRegistrationStatus();
    } catch (err) {
      console.error('Error refreshing data:', err);
    }
  }, [session?.id, fetchRegistrationStatus]);

  const handleRegister = () => {
    if (!user) {
      onOpenLoginModal();
      return;
    }
    onOpenJoinModal();
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="300px">
        <Spinner size="xl" color="green.500" borderWidth="3px" />
      </Flex>
    );
  }

  if (error || !session) {
    return (
      <Flex justify="center" align="center" minH="300px">
        <Box fontSize="xl" color="red.500">
          {error || 'Session not found'}
        </Box>
      </Flex>
    );
  }

  const availableSlots = maxPlayers - approvedPlayersCount;
  // Get host ID for rating stats provider
  const hostIds = session.hostId ? [session.hostId] : [];

  return (
    <RatingStatsProvider userIds={hostIds}>
      <Box maxW={{ base: '800px', md: '1200px' }} mx="auto" w="full">
        <Grid
          templateColumns={{ base: '1fr', md: '65fr 35fr' }}
          gap={{ md: 8 }}
          alignItems="start"
        >
          {/* Left column */}
          <Box minW={0}>
            {/* Hero Section */}
            <SessionDetailHero
              session={session}
              availableSlots={availableSlots}
              isFull={isFull}
              onBack={onBack}
              showBackButton={showBackButton}
            />

            {/* Body Section */}
            <SessionDetailBody
              session={session}
              maxPlayers={maxPlayers}
              approvedPlayersCount={approvedPlayersCount}
              onHostClick={onOpenHostDetailModal}
            />

            {/* Recommendations Section (mobile only) */}
            <Box
              id="mobile-recommendations"
              display={{ base: 'block', md: 'none' }}
              mt={4}
            >
              <SessionRecommendations
                sessionId={session.id}
                userId={user?.id}
                variant="mobile"
              />
            </Box>

            {/* View More Sessions Link */}
            {showViewMore && (
              <Flex justify="center" mt={4} mb={2} px={5}>
                <NextLinkButton
                  href="/"
                  colorPalette="green"
                  variant="outline"
                  size="md"
                  px={6}
                  borderRadius="full"
                  fontWeight="medium"
                  color="green.600"
                  borderColor="green.300"
                  _hover={{
                    bg: 'green.50',
                    borderColor: 'green.500',
                    color: 'green.700',
                  }}
                  transition="all 0.2s"
                  gap={1.5}
                >
                  {t('viewMoreSessions') || 'Xem thêm kèo'}
                  <Icon as={ArrowRight} boxSize={3.5} />
                </NextLinkButton>
              </Flex>
            )}
            {/* Mobile-only bottom spacing for sticky bar */}
            <Box
              h="calc(80px + env(safe-area-inset-bottom))"
              display={{ base: 'block', md: 'none' }}
            />
          </Box>

          {/* Right column — desktop sidebar only */}
          <Box display={{ base: 'none', md: 'block' }}>
            <Box
              position="sticky"
              top={{
                md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top) + 16px)`,
              }}
            >
              <SessionDetailStickyBar
                session={session}
                isFull={isFull}
                userRegistrationStatus={userRegistrationStatus}
                isRegistrationLoading={isRegistrationLoading}
                isOwner={isOwner}
                onRegister={handleRegister}
                onViewRegistration={onOpenViewRegistrationModal}
                displayMode="sidebar"
                maxPlayers={maxPlayers}
                approvedPlayersCount={approvedPlayersCount}
              />

              {/* Recommendations Section (desktop sidebar) */}
              <Box mt={4}>
                <SessionRecommendations
                  sessionId={session.id}
                  userId={user?.id}
                  variant="desktop"
                />
              </Box>
            </Box>
          </Box>
        </Grid>
      </Box>

      {/* Mobile Sticky Bottom Bar */}
      <Portal>
        <SessionDetailStickyBar
          session={session}
          isFull={isFull}
          userRegistrationStatus={userRegistrationStatus}
          isRegistrationLoading={isRegistrationLoading}
          isOwner={isOwner}
          onRegister={handleRegister}
          onViewRegistration={onOpenViewRegistrationModal}
        />
      </Portal>

      {/* Modals */}
      <LoginPromptModal
        isOpen={isLoginModalOpen}
        onClose={onCloseLoginModal}
        returnUrl={`/sessions/${session.id}?register=true`}
      />

      <JoinSessionModal
        isOpen={isJoinModalOpen}
        onClose={onCloseJoinModal}
        session={session}
        onSuccess={refreshData}
      />

      <MyRegistrationModal
        isOpen={isViewRegistrationModalOpen}
        onClose={onCloseViewRegistrationModal}
        session={session}
        onWithdraw={() => {
          onCloseViewRegistrationModal();
          refreshData();
        }}
      />

      <VModal
        isOpen={isHostDetailModalOpen}
        onClose={onCloseHostDetailModal}
        title={t('hostInfo') || 'Thông tin Host'}
        size="md"
        hideSecondaryAction={true}
        maxBodyHeight="80vh"
      >
        <Box>
          <AppHostDetail
            userId={session.hostId}
            name={session.hostName || session.host?.name}
            image={session.host?.image || undefined}
            phone={session.hostPhone}
            email={session.host?.email}
            hideHeader={true}
          />
        </Box>
      </VModal>

      {canManage && (
        <Portal>
          <Box
            position="absolute"
            left="-9999px"
            top="-9999px"
            zIndex={-1}
            pointerEvents="none"
          >
            <Box>
              <SessionShareCard session={session} mode="portrait" />
            </Box>
            <Box mt={4}>
              <SessionShareCard session={session} mode="social" />
            </Box>
          </Box>
        </Portal>
      )}
    </RatingStatsProvider>
  );
};

export default PublicSessionDetailContent;
