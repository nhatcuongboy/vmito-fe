'use client';

import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import { UserRole } from '@/lib/api/types';
import PlayerSessionView from '@/components/session/PlayerSessionView';
import { useAuthStore } from '@/stores/useAuthStore';
import { Center, Spinner } from '@chakra-ui/react';
import { useParams } from 'next/navigation';
import { Suspense } from 'react';

function PlayerMySession() {
  const { user } = useAuthStore();
  const params = useParams();
  const sessionId = params.id as string;

  return (
    <PlayerSessionView
      mode="player"
      sessionId={sessionId}
      userId={user?.id}
      errorRedirectPath="/dashboard"
    />
  );
}

export default function PlayerSessionPage() {
  return (
    <ProtectedRouteGuard requiredRole={[UserRole.PLAYER, UserRole.HOST]}>
      <Suspense
        fallback={
          <Center>
            <Spinner size="xl" />
          </Center>
        }
      >
        <PlayerMySession />
      </Suspense>
    </ProtectedRouteGuard>
  );
}
