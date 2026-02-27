'use client';

import { ISession, UserRole } from '@/lib/api/types';
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
import { MapPin, Navigation } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/useAuthStore';
import LoginPromptModal from '@/components/auth/LoginPromptModal';
import { VModal, useModal } from '@/components/ui/VModal';
import { useEffect, useState, useCallback } from 'react';
// import { useRouter, usePathname } from '@/i18n/config';
import { SessionService } from '@/lib/api/session.service';
import { PlayerService } from '@/lib/api/player.service';
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
}

export const PublicSessionDetailContent = ({
  sessionId,
  initialSession,
  showViewMore = false,
}: PublicSessionDetailContentProps) => {
  const t = useTranslations('session');
  const { user } = useAuthStore();
  const [session, setSession] = useState<ISession | null>(
    initialSession || null
  );
  const [loading, setLoading] = useState(!initialSession);
  const [error, setError] = useState<string | null>(null);
  const [userRegistrationStatus, setUserRegistrationStatus] = useState<
    'PENDING' | 'APPROVED' | 'REJECTED' | null
  >(null);

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

  const fetchRegistrationStatus = useCallback(async () => {
    if (!user || !session) return;
    try {
      const myPlayers = await PlayerService.getMyPlayersForSession(session.id);
      if (myPlayers && myPlayers.length > 0) {
        setUserRegistrationStatus(myPlayers[0].registrationStatus as any);
      } else {
        setUserRegistrationStatus(null);
      }
    } catch (err) {
      console.error('Error fetching registration status:', err);
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
        <Spinner size="xl" />
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

  const actions: SessionActionConfig = {
    showCallButton: !!session.hostPhone,
    showDownloadButton: canManage,
    showShareButton: true,
    showManageButton: canManage,
    manageButtonHref:
      user?.role === UserRole.PLAYER
        ? `/player/sessions/${session.id}`
        : `/host/sessions/${session.id}`,
    showViewButton: false,
    showViewRegistrationButton:
      !isOwner &&
      !!userRegistrationStatus &&
      userRegistrationStatus !== 'APPROVED',
    onViewRegistration: onOpenViewRegistrationModal,
    showViewSessionButton: userRegistrationStatus === 'APPROVED',
    showRegisterButton: !userRegistrationStatus && (isAdmin || !isOwner),
    onRegister: handleRegister,
    registerButtonDisabled: isFull,
  };

  const locationRow =
    session.venue?.name || session.location ? (
      <Flex align="flex-start">
        <Icon as={MapPin} boxSize={5} mr={2} color="green.500" mt={1} />
        <Box flex="1" overflow="hidden">
          <Flex align="center" gap={1}>
            <Text fontWeight="medium" lineClamp={1}>
              {session.venue?.name || session.location}
            </Text>
            <IconButton
              size="xs"
              colorPalette="green"
              variant="ghost"
              aria-label="Google Maps"
              onClick={(e) => {
                e.stopPropagation();
                const address =
                  session.venue?.address ||
                  session.venue?.name ||
                  session.location;
                if (address) {
                  window.open(
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
                    '_blank'
                  );
                }
              }}
              icon={<Icon as={Navigation} />}
            />
          </Flex>
          {session.venue?.address &&
            session.venue.address !== session.venue.name && (
              <Text fontSize="xs" color="gray.500" lineClamp={1}>
                {session.venue.address}
              </Text>
            )}
        </Box>
      </Flex>
    ) : null;

  // Get host ID for rating stats provider
  const hostIds = session.hostId ? [session.hostId] : [];

  return (
    <RatingStatsProvider userIds={hostIds}>
      <Box>
        <Flex justify="center">
          <BaseSessionCard
            session={session}
            extraInfoRows={locationRow}
            registrationBadgeContent={registrationStatusBadge}
            actions={actions}
            onHostClick={onOpenHostDetailModal}
          />
        </Flex>

        {showViewMore && (
          <Flex justify="center" mt={6}>
            <NextLinkButton
              href="/"
              colorPalette="gray"
              variant="outline"
              size="md"
            >
              {t('viewMoreSessions') || 'Xem thêm kèo'}
            </NextLinkButton>
          </Flex>
        )}

        {/* Internal Modals */}
        <LoginPromptModal
          isOpen={isLoginModalOpen}
          onClose={onCloseLoginModal}
          returnUrl={`/sessions/${session.id}?register=true`}
        />

        <JoinSessionModal
          isOpen={isJoinModalOpen}
          onClose={onCloseJoinModal}
          session={session}
          onSuccess={() => {
            SessionService.getSession(session.id)
              .then(setSession)
              .catch(console.error);
            fetchRegistrationStatus();
          }}
        />

        <MyRegistrationModal
          isOpen={isViewRegistrationModalOpen}
          onClose={onCloseViewRegistrationModal}
          session={session}
          onWithdraw={() => {
            onCloseViewRegistrationModal();
            SessionService.getSession(session.id)
              .then(setSession)
              .catch(console.error);
            fetchRegistrationStatus();
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
          <AppHostDetail
            userId={session.hostId}
            name={session.hostName || session.host?.name}
            image={session.host?.image || undefined}
            phone={session.hostPhone}
            email={session.host?.email}
            hideHeader={true}
          />
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
