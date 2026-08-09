'use client';

import { Button } from '@/components/primitives/button';
import { ROUTES } from '@/constants/routes';
import { useRouter } from '@/i18n/config';
import { useTourStore } from '@/stores/useTourStore';
import { BookOpen, PlayCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function GuideHeroSection() {
  const t = useTranslations('pages.guide.hero');
  const tTour = useTranslations('productTour');
  const router = useRouter();

  const handleStartTour = () => {
    useTourStore.getState().restartJourney();
    router.push(ROUTES.HOST.SESSIONS.LIST);
  };

  return (
    <section className="bg-green-50 py-12 text-center md:py-20 dark:bg-green-950">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-5 px-4 sm:px-6">
        <span className="rounded-full bg-green-500 p-4 text-white shadow-lg">
          <BookOpen aria-hidden className="size-10" />
        </span>
        <h1 className="text-3xl! font-bold! text-green-700 md:text-4xl! dark:text-green-300">
          {t('title')}
        </h1>
        <p className="max-w-[600px] text-base text-muted-foreground md:text-lg">
          {t('subtitle')}
        </p>
        <Button onClick={handleStartTour} size="lg">
          <PlayCircle aria-hidden className="size-5" />
          {tTour('restartCta')}
        </Button>
      </div>
    </section>
  );
}
