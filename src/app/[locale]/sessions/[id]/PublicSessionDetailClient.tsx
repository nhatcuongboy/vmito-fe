'use client';

import { ISession } from '@/lib/api/types';
import {
  Container,
  Box,
  Flex,
  Image,
} from '@chakra-ui/react';
import TopBar from '@/components/ui/TopBar';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useRouter, usePathname } from '@/i18n/config';
import { SessionService } from '@/lib/api/session.service';
import PublicSessionDetailContent from '@/components/session/PublicSessionDetailContent';
import {
  CONTAINER_PX,
  CONTENT_PT_OFFSET,
  TOP_BAR_HEIGHT_MOBILE,
  TOP_BAR_HEIGHT_DESKTOP,
} from '@/constants';
import JoinSessionModal from '@/components/session/JoinSessionModal';
import { useModal } from '@/components/ui/CommonModal';
import { useAuthStore } from '@/stores/useAuthStore';

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

  const [session, setSession] = useState<ISession | null>(
    initialSession || null
  );

  const {
    isOpen: isJoinModalOpen,
    onOpen: onOpenJoinModal,
    onClose: onCloseJoinModal,
  } = useModal();

  useEffect(() => {
    const registerParam = searchParams.get('register');
    if (registerParam === 'true' && user && session) {
      onOpenJoinModal();

      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete('register');
      router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
    }
  }, [searchParams, user, session, onOpenJoinModal, pathname, router]);

  const sessionId = Array.isArray(params.id) ? params.id[0] : params.id;

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
          <PublicSessionDetailContent
            sessionId={sessionId || ''}
            initialSession={initialSession}
            showViewMore
          />
        </Container>
      </Box>

      {/* Join Session Modal for URL triggers */}
      {session && (
        <JoinSessionModal
          isOpen={isJoinModalOpen}
          onClose={onCloseJoinModal}
          session={session}
          onSuccess={() => {
            if (sessionId) {
              SessionService.getSession(sessionId)
                .then(setSession)
                .catch(console.error);
            }
          }}
        />
      )}
    </>
  );
};

export default PublicSessionDetailClient;
