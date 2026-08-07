'use client';

import { Bell, Filter, Globe, Share2, Smartphone, Wifi } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { GuideSectionHeader } from './GuideSectionPrimitives';
import PWAInstallTour from './PWAInstallTour';

const tips = [
  { icon: Bell, key: 'notifications', color: 'text-red-500' },
  { icon: Smartphone, key: 'pwa', color: 'text-blue-500' },
  { icon: Filter, key: 'filters', color: 'text-purple-500' },
  { icon: Share2, key: 'share', color: 'text-green-500' },
  { icon: Globe, key: 'language', color: 'text-orange-500' },
  { icon: Wifi, key: 'realtime', color: 'text-cyan-500' },
] as const;

export default function TipsSection() {
  const t = useTranslations('pages.guide.tips');
  const [isPWAInstallTourOpen, setIsPWAInstallTourOpen] = useState(false);

  return (
    <section
      id="tips"
      className="scroll-mt-16 bg-muted py-12 md:scroll-mt-20 md:py-16 dark:bg-gray-900"
    >
      <div className="mx-auto w-full max-w-5xl space-y-10 px-4 sm:px-6">
        <GuideSectionHeader title={t('title')} subtitle={t('subtitle')} />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {tips.map((tip) => {
            const content = (
              <>
                <tip.icon
                  aria-hidden
                  className={`mt-0.5 size-[22px] shrink-0 ${tip.color}`}
                />
                <div className="space-y-1">
                  <h3 className="text-sm! font-semibold!">
                    {t(`${tip.key}.title`)}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t(`${tip.key}.description`)}
                  </p>
                </div>
              </>
            );

            return tip.key === 'pwa' ? (
              <button
                key={tip.key}
                type="button"
                className="flex items-start gap-4 rounded-lg bg-background p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-gray-800"
                onClick={() => setIsPWAInstallTourOpen(true)}
              >
                {content}
              </button>
            ) : (
              <article
                key={tip.key}
                className="flex items-start gap-4 rounded-lg bg-background p-4 shadow-sm dark:bg-gray-800"
              >
                {content}
              </article>
            );
          })}
        </div>
      </div>
      <PWAInstallTour
        isOpen={isPWAInstallTourOpen}
        onClose={() => setIsPWAInstallTourOpen(false)}
      />
    </section>
  );
}
