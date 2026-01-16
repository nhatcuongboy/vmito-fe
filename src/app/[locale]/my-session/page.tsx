'use client';

import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import { UserRole } from '@/lib/api/types';
import PlayerSessionView from '@/components/session/PlayerSessionView';
import { useAuthStore } from '@/stores/useAuthStore';
import { Center, Spinner } from '@chakra-ui/react';
import { Suspense } from 'react';

function GuestMySession() {
  const { user } = useAuthStore();

  return (
    <PlayerSessionView
      mode="guest"
      playerId={user?.id}
      errorRedirectPath="/join"
    />
  );
}

export default function MySessionPage() {
  return (
    <ProtectedRouteGuard requiredRole={[UserRole.GUEST]}>
      <Suspense
        fallback={
          <Center>
            <Spinner size="xl" />
          </Center>
        }
      >
        <GuestMySession />
      </Suspense>
    </ProtectedRouteGuard>
  );
}
