'use client';

import { ISession, UserRole } from '@/lib/api/types';
import { AppAddressDisplay } from '@/components/common/AppAddressDisplay';
import {
  Box,
  Flex,
  Text,
  Icon,
  Badge,
  Portal,
  Spinner,
} from '@chakra-ui/react';
import { IconButton } from '@/components/ui/chakra-compat';
import { MapPin, Navigation, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatVenueName, getGoogleMapsUrl } from '@/utils';
import { useAuthStore } from '@/stores/useAuthStore';
import LoginPromptModal from '@/components/auth/LoginPromptModal';
import { VModal, useModal } from '@/components/ui/VModal';
import { useEffect, useState, useCallback } from 'react';
import { SessionService } from '@/lib/api/session.service';
import { PlayerService } from '@/lib/api/player.service';
import { useRouter, usePathname } from '@/i18n/config';
import { useSearchParams } from 'next/navigation';
import BaseSessionCard from '@/components/session/BaseSessionCard';
import AppHostDetail from '@/components/session/AppHostDetail';
import { SessionActionConfig } from '@/components/session/BaseSessionCard.types';
import JoinSessionModal from '@/components/session/JoinSessionModal';
import MyRegistrationModal from '@/components/session/MyRegistrationModal';
import { NextLinkButton } from '@/components/ui/NextLinkButton';
import SessionShareCard from '@/components/session/SessionShareCard';
import { RatingStatsProvider } from '@/contexts/RatingStatsContext';

interface PublicSessionDetailContentProps {
  sessionId: string;
  initialSession?: ISession | null;
  showViewMore?: boolean;
  defaultOpenRegister?: boolean;
}

export const PublicSessionDetailContent = ({
  sessionId,
  initialSession,
  showViewMore = false,
  defaultOpenRegister = false,
}: PublicSessionDetailContentProps) => {
  const t = useTranslations('session');
  const tVenue = useTranslations('venue');
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

  // Slot availability badge - hidden if session is expired
  const isExpired =
    session.status === 'PREPARING' &&
    session.endTime &&
    new Date(session.endTime) < new Date();
  const slotAvailabilityBadge = !isExpired ? (
    <Badge
      colorPalette={isFull ? 'gray' : 'teal'}
      variant="solid"
      borderWidth="1px"
      borderColor={isFull ? 'gray.400' : 'teal.400'}
    >
      {isFull ? t('slotsFull') : t('slotsAvailable', { count: availableSlots })}
    </Badge>
  ) : null;

  const registrationStatusBadge = userRegistrationStatus ? (
    <Badge
      colorPalette={
        userRegistrationStatus === 'APPROVED'
          ? 'green'
          : userRegistrationStatus === 'PENDING'
            ? 'yellow'
            : 'red'
      }
      variant="solid"
    >
      {userRegistrationStatus === 'APPROVED'
        ? t('registrationApproved')
        : userRegistrationStatus === 'PENDING'
          ? t('registrationPending')
          : t('registrationRejected')}
    </Badge>
  ) : null;

  const combinedBadges = (
    <Flex gap={1}>
      {slotAvailabilityBadge}
      {registrationStatusBadge}
    </Flex>
  );

  const actions: SessionActionConfig = {
    showCallButton: !!session.hostPhone,
    showDownloadButton: canManage,
    showShareButton: true,
    showManageButton: canManage,
    manageButtonHref:
      user?.role === UserRole.PLAYER
        ? `/player/sessions/${session.slug || session.id}`
        : `/host/sessions/${session.slug || session.id}`,
    showViewRegistrationButton:
      !isOwner &&
      !!userRegistrationStatus &&
      userRegistrationStatus !== 'APPROVED',
    onViewRegistration: onOpenViewRegistrationModal,
    showViewSessionButton: userRegistrationStatus === 'APPROVED',
    showRegisterButton:
      !userRegistrationStatus && !isOwner && !isRegistrationLoading,
    onRegister: handleRegister,
    registerButtonDisabled: isFull,
    isRegistrationLoading,
  };

  const locationRow =
    session.venue?.name || session.location ? (
      <Flex align="flex-start">
        <Icon as={MapPin} boxSize={5} mr={2} color="green.500" mt={1} />
        <Box flex="1" overflow="hidden">
          <Flex align="center" gap={1}>
            <Text fontWeight="medium" lineClamp={1}>
              {session.venue?.name
                ? formatVenueName(
                    session.venue.name,
                    tVenue('nameFormat', { name: '{name}' })
                  )
                : session.location}
            </Text>
            <IconButton
              size="xs"
              colorPalette="green"
              variant="ghost"
              aria-label="Google Maps"
              onClick={(e) => {
                e.stopPropagation();
                const url = getGoogleMapsUrl({
                  address: session.venue?.address,
                  name: session.venue?.name
                    ? formatVenueName(
                        session.venue.name,
                        tVenue('nameFormat', { name: '{name}' })
                      )
                    : session.location,
                  placeId: session.venue?.placeId,
                  lat: session.venue?.lat,
                  lng: session.venue?.lng,
                });
                if (url) window.open(url, '_blank');
              }}
              icon={<Icon as={Navigation} />}
            />
          </Flex>
          {session.venue?.address &&
            session.venue.address !== session.venue.name && (
              <AppAddressDisplay
                address={session.venue.address}
                newAddress={session.venue.newAddress}
                lineClamp={1}
              />
            )}
        </Box>
      </Flex>
    ) : null;

  // Get host ID for rating stats provider
  const hostIds = session.hostId ? [session.hostId] : [];

  return (
    <RatingStatsProvider userIds={hostIds}>
      <Box
        maxW="800px"
        mx="auto"
        w="full"
        px={{ base: 2, md: 4 }}
        pt={2}
        pb={4}
      >
        <Flex justify="center" align="center" direction="column">
          <Box w="full" maxW="400px">
            <BaseSessionCard
              session={session}
              extraInfoRows={locationRow}
              registrationBadgeContent={combinedBadges}
              actions={actions}
              onHostClick={onOpenHostDetailModal}
              disableCardLink
              showYearInDate
              alwaysShowDayName
            />
          </Box>
        </Flex>

        {showViewMore && (
          <Flex justify="center" mt={6}>
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

        {/* Internal Modals */}
        <LoginPromptModal
          isOpen={isLoginModalOpen}
          onClose={onCloseLoginModal}
          returnUrl={`/sessions/${session.slug || session.id}?register=true`}
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
              onClose={onCloseHostDetailModal}
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
      </Box>
    </RatingStatsProvider>
  );
};

export default PublicSessionDetailContent;
