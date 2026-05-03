'use client';

import { ISession } from '@/lib/api/types';
import { Box } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/config';
import { SessionService } from '@/lib/api/session.service';
import PublicSessionDetailContent from '@/components/session/PublicSessionDetailContent';
import PageWrapper from '@/components/layout/PageWrapper';
import TopBar from '@/components/ui/TopBar';
import { TOP_BAR_HEIGHT_DESKTOP } from '@/constants';
import { useSocket, SessionEventType } from '@/contexts/SocketContext';

interface PublicSessionDetailClientProps {
  initialSession?: ISession | null;
}

const PublicSessionDetailClient = ({
  initialSession,
}: PublicSessionDetailClientProps) => {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { socket } = useSocket();
  const [canGoBack, setCanGoBack] = useState(false);

  const [backHref, setBackHref] = useState('/');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const referrer = document.referrer;
      if (referrer.includes('/host/sessions')) {
        setBackHref('/host/sessions');
      }
    }
  }, []);

  const [session, setSession] = useState<ISession | null>(
    initialSession || null
  );

  const sessionId = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    if (!socket || !sessionId) return;

    const handleStatusUpdate = async (data: { sessionId: string }) => {
      if (data.sessionId === sessionId) {
        try {
          const updatedSession = await SessionService.getSession(sessionId);
          setSession(updatedSession);
        } catch (error) {
          console.error('Failed to refresh session data:', error);
        }
      }
    };
    socket.on(SessionEventType.REGISTRATION_STATUS_UPDATED, handleStatusUpdate);
    return () => {
      socket.off(
        SessionEventType.REGISTRATION_STATUS_UPDATED,
        handleStatusUpdate
      );
    };
  }, [socket, sessionId]);

  useEffect(() => {
    setCanGoBack(window.history.length > 1);
  }, []);

  const registerParam = searchParams.get('register');

  return (
    <PageWrapper
      bg={{ base: 'white', md: 'gray.50' }}
      _dark={{ bg: { md: 'gray.950' } }}
    >
      {/* Desktop-only top bar */}
      <Box display={{ base: 'none', md: 'block' }}>
        <TopBar
          title={session?.name}
          showBackButton={false}
          backHref={backHref}
          onBack={canGoBack ? () => router.back() : undefined}
        />
      </Box>
      <Box
        pt={{
          md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top))`,
        }}
      >
        <PublicSessionDetailContent
          sessionId={sessionId || ''}
          initialSession={session}
          showViewMore
          defaultOpenRegister={registerParam === 'true'}
          onBack={canGoBack ? () => router.back() : undefined}
          showBackButton={canGoBack}
        />
      </Box>
    </PageWrapper>
  );
};

export default PublicSessionDetailClient;
