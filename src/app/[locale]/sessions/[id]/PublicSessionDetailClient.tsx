'use client';

import { ISession } from '@/lib/api/types';
import { Container, Box, Flex, Image, Text, Icon, Badge, Portal } from '@chakra-ui/react';
import { Button, IconButton } from '@/components/ui/chakra-compat';
import { Phone, MapPin, Map, Share2, Download } from 'lucide-react';
import TopBar from '@/components/ui/TopBar';
import { useTranslations, useLocale } from 'next-intl';
import { useAuthStore } from '@/stores/useAuthStore';
import LoginPromptModal from '@/components/auth/LoginPromptModal';
import { useModal } from '@/components/ui/CommonModal';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { SessionService } from '@/lib/api/session.service';
import { PlayerService } from '@/lib/api/player.service';
import { Spinner } from '@chakra-ui/react';
import BaseSessionCard from '@/components/session/BaseSessionCard';
import JoinSessionModal from '@/components/session/JoinSessionModal';
import MyRegistrationModal from '@/components/session/MyRegistrationModal';
import { NextLinkButton } from '@/components/ui/NextLinkButton';
import { toaster } from '@/components/ui/toaster';
import { useDownloadSessionImage } from '@/hooks/useDownloadSessionImage';
import SessionShareCard from '@/components/session/SessionShareCard';
import {
  CONTAINER_PX,
  CONTENT_PT_OFFSET,
  TOP_BAR_HEIGHT_MOBILE,
  TOP_BAR_HEIGHT_DESKTOP,
} from '@/constants';

interface PublicSessionDetailClientProps {
  initialSession?: ISession | null;
}

const PublicSessionDetailClient = ({
  initialSession,
}: PublicSessionDetailClientProps) => {
  const t = useTranslations('session');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const { user } = useAuthStore();
  const params = useParams();
  const searchParams = useSearchParams();

  const [session, setSession] = useState<ISession | null>(initialSession || null);
  const [loading, setLoading] = useState(!initialSession);
  const [error, setError] = useState<string | null>(null);
  const [userRegistrationStatus, setUserRegistrationStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | null>(null);

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

  useEffect(() => {
    // If we already have session (from properties / server), don't fetch again unless ID changes significantly or we need to revalidate
    // Ideally, if initialSession.id matches params.id, we skip.
    // For simplicity, if we have initialSession and it matches the param ID, we skip.
    const sessionId = Array.isArray(params.id) ? params.id[0] : params.id;

    if (initialSession && initialSession.id === sessionId) {
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
  }, [params.id, initialSession]);

  // Fetch user registration status
  const fetchRegistrationStatus = async () => {
    if (!user || !session) return;
    try {
      const myPlayers = await PlayerService.getMyPlayersForSession(session.id);
      if (myPlayers && myPlayers.length > 0) {
        // Simplified: use status of their first registration
        setUserRegistrationStatus(myPlayers[0].registrationStatus as any);
      } else {
        setUserRegistrationStatus(null);
      }
    } catch (err) {
      console.error('Error fetching registration status:', err);
    }
  };

  useEffect(() => {
    fetchRegistrationStatus();
  }, [user, session]);

  useEffect(() => {
    const registerParam = searchParams.get('register');
    if (registerParam === 'true' && user && session) {
      onOpenJoinModal();
    }
  }, [searchParams, user, session, onOpenJoinModal]);

  // Check if current user is the session owner/host
  const isOwner = session?.hostId === user?.id;

  // Calculate if session is full (only count approved players)
  const maxPlayers = session?.numberOfCourts
    ? session.numberOfCourts * (session?.maxPlayersPerCourt || 4)
    : 0;
  const approvedPlayersCount = session?._count?.players || 0;
  const isFull = approvedPlayersCount >= maxPlayers;

  // Handle register action
  const handleRegister = () => {
    if (!user) {
      onOpenLoginModal();
      return;
    }
    onOpenJoinModal();
  };

  // Handle share
  const handleShare = async () => {
    if (!session) return;
    const url = `${window.location.origin}/${locale}/sessions/${session.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          url: url,
        });
      } catch {
        // User cancelled share
      }
    } else {
      // Fallback to copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        toaster.success({
          title: t('linkCopied') || 'Link copied to clipboard',
        });
      } catch {
        toaster.error({ title: tCommon('error') });
      }
    }
  };

  // Handle call action
  const handleCall = () => {
    if (session?.hostPhone) {
      window.location.href = `tel:${session.hostPhone}`;
    }
  };

  if (loading) {
    return (
      <>
        <TopBar
          icon={<Image src="/icons/app-logo.png" h="32px" alt="Logo" />}
        />
        <Box
          pt={{
            base: `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top) + ${CONTENT_PT_OFFSET})`,
            md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top) + ${CONTENT_PT_OFFSET})`,
          }}
        >
          <Container maxW="4xl" px={CONTAINER_PX} pb={8}>
            <Flex justify="center" align="center" minH="400px">
              <Spinner size="xl" />
            </Flex>
          </Container>
        </Box>
      </>
    );
  }

  if (error || !session) {
    return (
      <>
        <TopBar
          icon={<Image src="/icons/app-logo.png" h="32px" alt="Logo" />}
        />
        <Box
          pt={{
            base: `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top) + ${CONTENT_PT_OFFSET})`,
            md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top) + ${CONTENT_PT_OFFSET})`,
          }}
        >
          <Container maxW="4xl" px={CONTAINER_PX} pb={8}>
            <Flex justify="center" align="center" minH="400px">
              <Box fontSize="xl" color="red.500">
                {error || 'Session not found'}
              </Box>
            </Flex>
          </Container>
        </Box>
      </>
    );
  }

  // Registration status badge
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

  const { downloadSessionImage, isDownloading } = useDownloadSessionImage();

  // Top actions (Phone, Google Maps, Share)
  const topActions = (
    <>
      {session.hostPhone && (
        <IconButton
          size="sm"
          colorPalette="blue"
          variant="outline"
          aria-label="Call host"
          onClick={handleCall}
          icon={<Icon as={Phone} />}
        />
      )}
      {(session.venue?.address || session.venue?.name || session.location) && (
        <IconButton
          size="sm"
          colorPalette="blue"
          variant="outline"
          aria-label="Google Maps"
          onClick={() => {
            const address =
              session.venue?.address || session.venue?.name || session.location;
            if (address) {
              window.open(
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
                '_blank'
              );
            }
          }}
          icon={<Icon as={Map} />}
        />
      )}
      {isOwner && (
        <IconButton
          size="sm"
          colorPalette="blue"
          variant="outline"
          aria-label="Download session image"
          loading={isDownloading}
          icon={<Icon as={Download} />}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            downloadSessionImage(
              session,
              `session-share-card-portrait-${session.id}`
            );
          }}
        />
      )}
      <IconButton
        size="sm"
        colorPalette="gray"
        variant="outline"
        aria-label="Share session"
        onClick={handleShare}
        icon={<Icon as={Share2} />}
      />
    </>
  );

  // Main actions
  const bottomActions = (
    <>
      {/* If user owns the session, show Host button */}
      {isOwner ? (
        <NextLinkButton
          href={
            user?.role === 'PLAYER'
              ? `/player/sessions/${session.id}`
              : `/host/sessions/${session.id}`
          }
          colorPalette="blue"
          size="sm"
        >
          {t('manageSession')}
        </NextLinkButton>
      ) : (
        /* Otherwise show register/view registration buttons */
        <>
          {userRegistrationStatus && (
            <Button
              colorPalette="blue"
              variant="outline"
              onClick={onOpenViewRegistrationModal}
              size="sm"
            >
              {t('viewMyRegistration')}
            </Button>
          )}

          {userRegistrationStatus === 'APPROVED' && (
            <NextLinkButton
              href={`/player/sessions/${session.id}`}
              colorPalette="green"
              size="sm"
            >
              {t('viewSession')}
            </NextLinkButton>
          )}

          {!userRegistrationStatus && (
            <Button
              colorPalette="blue"
              onClick={handleRegister}
              size="sm"
              disabled={isFull}
            >
              {isFull ? t('sessionFull') : t('register')}
            </Button>
          )}
        </>
      )}
    </>
  );

  // Location/venue display (reuse from SessionCard)
  const locationRow =
    session.venue?.name || session.location ? (
      <Flex align="flex-start">
        <Icon as={MapPin} boxSize={5} mr={2} color="blue.500" mt={1} />
        <Box flex="1" overflow="hidden">
          <Text fontWeight="medium" lineClamp={1}>
            {session.venue?.name || session.location}
          </Text>
          {session.venue?.address &&
            session.venue.address !== session.venue.name && (
              <Text fontSize="xs" color="gray.500" lineClamp={1}>
                {session.venue.address}
              </Text>
            )}
        </Box>
      </Flex>
    ) : null;

  return (
    <>
      <TopBar icon={<Image src="/icons/app-logo.png" h="32px" alt="Logo" />} />
      <Box
        pt={{
          base: `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top) + ${CONTENT_PT_OFFSET})`,
          md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top) + ${CONTENT_PT_OFFSET})`,
        }}
      >
        <Container maxW="4xl" px={CONTAINER_PX} pb={8}>
          <Flex justify="center">
            <BaseSessionCard
              session={session}
              extraInfoRows={locationRow}
              registrationBadgeContent={registrationStatusBadge}
              topActionButtons={topActions}
              bottomActionButtons={bottomActions}
            />
          </Flex>

          {/* View More Sessions Button */}
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
        </Container>

        {/* Login prompt modal */}
        <LoginPromptModal
          isOpen={isLoginModalOpen}
          onClose={onCloseLoginModal}
          returnUrl={`/sessions/${session.id}?register=true`}
        />

        {/* Join session modal */}
        <JoinSessionModal
          isOpen={isJoinModalOpen}
          onClose={onCloseJoinModal}
          session={session}
          onSuccess={() => {
            // Re-fetch session data to update player count
            const sessionId = Array.isArray(params.id) ? params.id[0] : params.id;
            if (sessionId) {
              SessionService.getSession(sessionId).then(setSession).catch(console.error);
            }
            fetchRegistrationStatus();
          }}
        />

        {/* View Registration modal */}
        <MyRegistrationModal
          isOpen={isViewRegistrationModalOpen}
          onClose={onCloseViewRegistrationModal}
          session={session}
          onWithdraw={() => {
            onCloseViewRegistrationModal();
            // Re-fetch everything after withdraw
            const sessionId = Array.isArray(params.id) ? params.id[0] : params.id;
            if (sessionId) {
              SessionService.getSession(sessionId).then(setSession).catch(console.error);
            }
            fetchRegistrationStatus();
          }}
        />

        {/* Hidden SessionShareCards for image generation */}
        {isOwner && (
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
            </Box>
          </Portal>
        )}
      </Box>
    </>
  );
};

export default PublicSessionDetailClient;
