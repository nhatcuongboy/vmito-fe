'use client';

import { useRouter } from '@/i18n/config';
import NewSessionForm from '@/components/session/NewSessionForm';
import { Suspense } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { useTranslations } from 'next-intl';

export default function NewSessionPage() {
  const router = useRouter();
  const t = useTranslations('session');

  return (
    <Suspense>
      <PageLayout title={t('createSession')}>
        <NewSessionForm
          backHref="/host/sessions"
          onSuccess={(session) =>
            router.push(`/sessions/${session.slug || session.id}`)
          }
        />
      </PageLayout>
    </Suspense>
  );
}
