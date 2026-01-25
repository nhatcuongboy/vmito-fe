'use client';

import { useRouter } from '@/i18n/config';
import NewSessionForm from '@/components/session/NewSessionForm';

import { Suspense } from 'react';

export default function PlayerNewSessionPage() {
  const router = useRouter();

  return (
    <Suspense>
      <NewSessionForm
        backHref="/player/sessions"
        onSuccess={(session) => router.push(`/player/sessions/${session.id}`)}
      />
    </Suspense>
  );
}
