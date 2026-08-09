'use client';

import { LogIn, UserCog, UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  GuideSectionHeader,
  ScreenshotPlaceholder,
} from './GuideSectionPrimitives';

const steps = [
  { id: 'register', icon: UserPlus, badge: '1' },
  { id: 'login', icon: LogIn, badge: '2' },
  { id: 'profile', icon: UserCog, badge: '3' },
] as const;

export default function GettingStartedSection() {
  const t = useTranslations('pages.guide.gettingStarted');
  const placeholders = useTranslations('pages.guide.placeholders');

  return (
    <section
      id="getting-started"
      className="scroll-mt-16 bg-muted py-12 md:scroll-mt-20 md:py-16 dark:bg-gray-900"
    >
      <div className="mx-auto w-full max-w-5xl space-y-10 px-4 sm:px-6">
        <GuideSectionHeader title={t('title')} subtitle={t('subtitle')} />
        <ol className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <li
              key={step.id}
              className="flex flex-col items-center gap-4 rounded-xl bg-background p-6 text-center shadow-sm dark:bg-gray-800"
            >
              <div className="relative">
                <span className="flex rounded-full bg-green-50 p-4 text-green-500 dark:bg-green-950">
                  <step.icon aria-hidden className="size-8" />
                </span>
                <span className="absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white">
                  {step.badge}
                </span>
              </div>
              <h3 className="text-xl! font-semibold!">
                {t(`${step.id}.title`)}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t(`${step.id}.description`)}
              </p>
              <ScreenshotPlaceholder
                label={placeholders('screenshot')}
                compact
              />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
