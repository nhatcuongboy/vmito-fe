'use client';

import LegalDocumentPage, {
  type LegalSection,
} from '@/components/ui/LegalDocumentPage';
import { useTranslations } from 'next-intl';
import { Suspense } from 'react';

function PrivacyContent() {
  const common = useTranslations('common');
  const t = useTranslations('pages.privacy');
  const home = useTranslations('pages.home');

  return (
    <LegalDocumentPage
      title={t('title')}
      lastUpdated={t('lastUpdated')}
      intro={t('intro')}
      sections={t.raw('sections') as LegalSection[]}
      appName={common('appName')}
      copyright={home('copyright')}
    />
  );
}

export default function PrivacyClient() {
  return (
    <Suspense>
      <PrivacyContent />
    </Suspense>
  );
}
