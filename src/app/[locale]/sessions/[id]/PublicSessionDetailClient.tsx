'use client';

import { ISession } from '@/lib/api/types';
import { Container, Box, IconButton } from '@chakra-ui/react';
import { Image } from '@/components/ui/chakra-compat';
import TopBar from '@/components/ui/TopBar';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useRouter, usePathname } from '@/i18n/config';
import { useCanGoBack } from '@/hooks/useCanGoBack';
import { SessionService } from '@/lib/api/session.service';
import PublicSessionDetailContent from '@/components/session/PublicSessionDetailContent';
import PageWrapper from '@/components/layout/PageWrapper';
import {
  CONTAINER_PX,
  CONTENT_PT_OFFSET,
  TOP_BAR_HEIGHT_MOBILE,
  TOP_BAR_HEIGHT_DESKTOP,
} from '@/constants';
import JoinSessionModal from '@/components/session/JoinSessionModal';
import { useModal } from '@/components/ui/VModal';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTranslations } from 'next-intl';
import { useSocket, SessionEventType } from '@/contexts/SocketContext';
import { Search } from 'lucide-react';

interface PublicSessionDetailClientProps {
  initialSession?: ISession | null;
}

const PublicSessionDetailClient = ({
  initialSession,
}: PublicSessionDetailClientProps) => {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const canGoBack = useCanGoBack();
  const t = useTranslations('session');
  const { socket } = useSocket();

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
    const handleStatusUpdate = async (data: any) => {
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

  const {
    isOpen: isJoinModalOpen,
    onOpen: onOpenJoinModal,
    onClose: onCloseJoinModal,
  } = useModal();

  const registerParam = searchParams.get('register');

  return (
    <PageWrapper>
      <TopBar
        title={session?.name || t('header')}
        showBackButton={true}
        onBack={canGoBack ? () => router.back() : undefined}
        backHref={backHref}
        variant="secondary"
        rightContent={
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton
              aria-label="Search"
              variant="ghost"
              color="fg"
              _hover={{ bg: 'bg.muted' }}
              borderRadius="full"
              size="md"
            >
              <Search size={20} />
            </IconButton>
          </Box>
        }
      />
      <Box
        pt={{
          base: `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top) + ${CONTENT_PT_OFFSET})`,
          md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top) + ${CONTENT_PT_OFFSET})`,
        }}
      >
        <Container maxW="4xl" px={CONTAINER_PX} pb={8}>
          <PublicSessionDetailContent
            sessionId={sessionId || ''}
            initialSession={session}
            showViewMore
            defaultOpenRegister={registerParam === 'true'}
          />
        </Container>
      </Box>
    </PageWrapper>
  );
};

export default PublicSessionDetailClient;
