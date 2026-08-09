'use client';

import { PlusCircle, Settings, UserPlus, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  GuideCard,
  GuideSectionHeader,
  ScreenshotPlaceholder,
} from './GuideSectionPrimitives';

const steps = [
  { icon: PlusCircle, key: 'create' },
  { icon: UserPlus, key: 'join' },
  { icon: Users, key: 'members' },
  { icon: Settings, key: 'fees' },
] as const;

export default function ClubGuideSection() {
  const t = useTranslations('pages.guide.clubs');
  const placeholders = useTranslations('pages.guide.placeholders');

  return (
    <section
      id="clubs"
      className="scroll-mt-16 bg-muted py-12 md:scroll-mt-20 md:py-16 dark:bg-gray-900"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-10 px-4 sm:px-6">
        <GuideSectionHeader title={t('title')} subtitle={t('subtitle')} />
        <ScreenshotPlaceholder label={placeholders('clubOverview')} />
        <div className="grid w-full max-w-[700px] grid-cols-1 gap-4 md:grid-cols-2">
          {steps.map((step) => (
            <GuideCard
              key={step.key}
              icon={step.icon}
              title={t(`${step.key}.title`)}
              description={t(`${step.key}.description`)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
