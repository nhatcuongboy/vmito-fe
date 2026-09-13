'use client';

import LegalDocumentPage, {
  type LegalSection,
} from '@/components/ui/LegalDocumentPage';
import { useTranslations } from 'next-intl';
import { Suspense } from 'react';
import { Button } from '@/components/ui/chakra-compat';
import { useCookieConsent } from '@/components/providers/CookieConsentProvider';

function CookieSettingsAction() {
  const { openSettings } = useCookieConsent();
  const t = useTranslations('cookieConsent');

  return (
    <Button colorPalette="green" onClick={openSettings} variant="outline">
      {t('manage')}
    </Button>
  );
}

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
      footerAction={<CookieSettingsAction />}
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
