'use client';

import { ISession } from '@/lib/api/types';
import { Container, Box, Flex, Image, Text, Icon } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { Phone, MapPin } from 'lucide-react';
import TopBar from '@/components/ui/TopBar';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/useAuthStore';
import LoginPromptModal from '@/components/auth/LoginPromptModal';
import { useModal } from '@/components/ui/CommonModal';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { SessionService } from '@/lib/api/session.service';
import { Spinner } from '@chakra-ui/react';
import BaseSessionCard from '@/components/session/BaseSessionCard';
import { NextLinkButton } from '@/components/ui/NextLinkButton';
import { CONTAINER_PX, CONTENT_PT_OFFSET, TOP_BAR_HEIGHT_MOBILE, TOP_BAR_HEIGHT_DESKTOP } from '@/constants';

interface PublicSessionDetailClientProps {
  initialSession?: ISession | null;
}

const PublicSessionDetailClient = ({ initialSession }: PublicSessionDetailClientProps) => {
  const t = useTranslations('session');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const tCommon = useTranslations('common');
  const { user } = useAuthStore();
  const params = useParams();
  const [session, setSession] = useState<ISession | null>(initialSession || null);
  const [loading, setLoading] = useState(!initialSession);
  const [error, setError] = useState<string | null>(null);

  const {
    isOpen: isLoginModalOpen,
    onOpen: onOpenLoginModal,
    onClose: onCloseLoginModal,
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

  // Check if current user is the session owner/host
  const isOwner = session?.hostId === user?.id;

  // Calculate if session is full (only count approved players)
  const maxPlayers = session?.numberOfCourts ? session.numberOfCourts * (session?.maxPlayersPerCourt || 4) : 0;
  const approvedPlayersCount = session?._count?.players || 0;
  const isFull = approvedPlayersCount >= maxPlayers;

  // Handle register action
  const handleRegister = () => {
    if (!user) {
      onOpenLoginModal();
      return;
    }
    // Redirect to browse sessions page with this session ID
    window.location.href = `/?sessionId=${session?.id}`;
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

  // Custom action buttons for the detail view
  const customActionButtons = (
    <Flex gap={2} flexWrap="wrap" justify="flex-end">
      {/* Call button */}
      {session.hostPhone && (
        <Button
          size="sm"
          colorPalette="blue"
          variant="outline"
          aria-label="Call host"
          onClick={handleCall}
        >
          <Icon as={Phone} boxSize={4} />
        </Button>
      )}

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
          {t('host')}
        </NextLinkButton>
      ) : (
        /* Otherwise show register button */
        <Button
          colorPalette="blue"
          onClick={handleRegister}
          size="sm"
          disabled={isFull}
        >
          {isFull ? t('sessionFull') : t('register')}
        </Button>
      )}
    </Flex>
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
          <Flex justify="center">
            <BaseSessionCard
              session={session}
              extraInfoRows={locationRow}
              actionButtons={customActionButtons}
            />
          </Flex>

          {/* View More Sessions Button */}
          <Flex justify="center" mt={8}>
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
          returnUrl={`/browse/sessions?sessionId=${session.id}`}
        />
      </Box>
    </>
  );
};

export default PublicSessionDetailClient;
