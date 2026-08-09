'use client';

import { Button } from '@/components/primitives/button';
import { Link } from '@/i18n/config';
import { useTranslations } from 'next-intl';

export default function SettingsPage() {
  const t = useTranslations('common');

  return (
    <main className="mx-auto w-full max-w-screen-xl p-4">
      <nav aria-label={t('navigation')} className="mb-8">
        <Button asChild variant="ghost" size="sm">
          <Link href="/">← {t('backToHome')}</Link>
        </Button>
      </nav>

      <section className="py-10 text-center" aria-labelledby="settings-title">
        <h1 id="settings-title" className="mb-6 text-3xl! font-bold!">
          {t('settings')}
        </h1>
        <p className="mb-10 text-xl text-muted-foreground">
          {t('settingsDescription')}
        </p>
        <p className="text-muted-foreground">{t('settingsComingSoon')}</p>
      </section>
    </main>
  );
}
