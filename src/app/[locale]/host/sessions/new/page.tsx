'use client';

import { useRouter } from '@/i18n/config';
import NewSessionForm from '@/components/session/NewSessionForm';

import { Suspense } from 'react';

export default function HostNewSessionPage() {
  const router = useRouter();

  return (
    <Suspense>
      <NewSessionForm
        backHref="/host/sessions"
        onSuccess={(session) => router.push(`/sessions/${session.id}`)}
      />
    </Suspense>
  );
}
