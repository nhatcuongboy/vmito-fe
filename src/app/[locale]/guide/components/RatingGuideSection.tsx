'use client';

import { MessageSquare, Star, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { GuideSectionHeader } from './GuideSectionPrimitives';

const features = [
  {
    id: 'rate',
    icon: Star,
    iconClass: 'bg-yellow-50 text-yellow-500 dark:bg-yellow-950',
  },
  {
    id: 'review',
    icon: MessageSquare,
    iconClass: 'bg-blue-50 text-blue-500 dark:bg-blue-950',
  },
  {
    id: 'stats',
    icon: TrendingUp,
    iconClass: 'bg-green-50 text-green-500 dark:bg-green-950',
  },
] as const;

export default function RatingGuideSection() {
  const t = useTranslations('pages.guide.ratings');

  return (
    <section
      id="ratings"
      className="scroll-mt-16 py-12 md:scroll-mt-20 md:py-16"
    >
      <div className="mx-auto w-full max-w-5xl space-y-10 px-4 sm:px-6">
        <GuideSectionHeader title={t('title')} subtitle={t('subtitle')} />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.id}
              className="flex flex-col items-center gap-4 rounded-xl bg-background p-6 text-center shadow-sm dark:bg-gray-800"
            >
              <span className={`rounded-full p-4 ${feature.iconClass}`}>
                <feature.icon aria-hidden className="size-7" />
              </span>
              <h3 className="text-xl! font-semibold!">
                {t(`${feature.id}.title`)}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t(`${feature.id}.description`)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
